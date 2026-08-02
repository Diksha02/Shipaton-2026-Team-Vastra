/**
 * Resilience primitives.
 *
 * PROJECT.md §7: "Every external call: timeout, 2 retries with jittered
 * backoff, circuit breaker. A provider outage degrades one feature, never the
 * app."
 *
 * These are the mechanism for that sentence. Every adapter composes them; no
 * adapter reimplements them.
 */

export class ProviderError extends Error {
  readonly provider: string;
  readonly retryable: boolean;
  override readonly cause?: unknown;

  constructor(
    provider: string,
    message: string,
    options?: { retryable?: boolean; cause?: unknown },
  ) {
    super(message);
    this.name = 'ProviderError';
    this.provider = provider;
    this.retryable = options?.retryable ?? false;
    this.cause = options?.cause;
  }
}

export class TimeoutError extends ProviderError {
  constructor(provider: string, ms: number) {
    super(provider, `${provider} timed out after ${ms}ms`, { retryable: true });
    this.name = 'TimeoutError';
  }
}

export class CircuitOpenError extends ProviderError {
  constructor(provider: string) {
    super(provider, `${provider} circuit is open`, { retryable: false });
    this.name = 'CircuitOpenError';
  }
}

/**
 * Races a promise against a timer.
 *
 * `AbortSignal` is passed through so the underlying request is actually
 * cancelled rather than merely ignored — an abandoned fetch still holds a
 * socket, and enough of those exhaust the pool.
 */
export async function withTimeout<T>(
  provider: string,
  ms: number,
  fn: (signal: AbortSignal) => Promise<T>,
): Promise<T> {
  const controller = new AbortController();
  let timer: ReturnType<typeof setTimeout> | undefined;

  // The timer must be *raced*, not merely used to abort. Aborting only helps if
  // the callee honours the signal; a provider SDK that ignores it would
  // otherwise hang well past the deadline, which is precisely what the timeout
  // exists to prevent.
  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      controller.abort();
      reject(new TimeoutError(provider, ms));
    }, ms);
  });

  try {
    return await Promise.race([fn(controller.signal), expiry]);
  } catch (error) {
    // A callee that *does* honour the signal rejects with its own AbortError.
    // Normalise that to TimeoutError so callers see one failure mode.
    if (controller.signal.aborted && !(error instanceof TimeoutError)) {
      throw new TimeoutError(provider, ms);
    }
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export interface RetryOptions {
  attempts?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  /** Injectable for deterministic tests. */
  random?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Retries with full jitter: `delay = random(0, min(cap, base * 2^n))`.
 *
 * Full jitter rather than fixed backoff because every client retrying on the
 * same schedule reconverges into a thundering herd against a provider that is
 * already struggling.
 *
 * Only `retryable` ProviderErrors are retried. A 400 will be a 400 next time.
 */
export async function withRetry<T>(fn: () => Promise<T>, options: RetryOptions = {}): Promise<T> {
  const attempts = options.attempts ?? 3; // initial call + 2 retries, per §7
  const baseDelayMs = options.baseDelayMs ?? 200;
  const maxDelayMs = options.maxDelayMs ?? 4000;
  const random = options.random ?? Math.random;
  const sleep = options.sleep ?? defaultSleep;

  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      const retryable = error instanceof ProviderError ? error.retryable : false;
      const isLast = attempt === attempts - 1;
      if (!retryable || isLast) throw error;

      const ceiling = Math.min(maxDelayMs, baseDelayMs * 2 ** attempt);
      await sleep(Math.floor(random() * ceiling));
    }
  }

  throw lastError;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreakerOptions {
  failureThreshold?: number;
  resetTimeoutMs?: number;
  now?: () => number;
}

/**
 * A circuit breaker.
 *
 * After `failureThreshold` consecutive failures the circuit opens and calls
 * fail immediately without touching the provider. After `resetTimeoutMs` it
 * half-opens and lets exactly one probe through: success closes it, failure
 * re-opens it.
 *
 * The point is not to protect the provider — it is to stop our own request
 * threads piling up behind a dead dependency, which is how one broken feature
 * takes down an app.
 */
export class CircuitBreaker {
  private failures = 0;
  private openedAt: number | null = null;
  private halfOpenInFlight = false;

  private readonly failureThreshold: number;
  private readonly resetTimeoutMs: number;
  private readonly now: () => number;

  constructor(
    readonly provider: string,
    options: CircuitBreakerOptions = {},
  ) {
    this.failureThreshold = options.failureThreshold ?? 5;
    this.resetTimeoutMs = options.resetTimeoutMs ?? 30_000;
    this.now = options.now ?? Date.now;
  }

  get state(): CircuitState {
    if (this.openedAt === null) return 'closed';
    if (this.now() - this.openedAt >= this.resetTimeoutMs) return 'half-open';
    return 'open';
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    const state = this.state;

    if (state === 'open') {
      throw new CircuitOpenError(this.provider);
    }

    // Half-open admits a single probe; everything else fails fast so a recovering
    // provider is not immediately buried by the backlog that accumulated.
    if (state === 'half-open') {
      if (this.halfOpenInFlight) throw new CircuitOpenError(this.provider);
      this.halfOpenInFlight = true;
    }

    try {
      const result = await fn();
      this.reset();
      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    } finally {
      this.halfOpenInFlight = false;
    }
  }

  private recordFailure(): void {
    this.failures += 1;
    if (this.failures >= this.failureThreshold) {
      this.openedAt = this.now();
    }
  }

  private reset(): void {
    this.failures = 0;
    this.openedAt = null;
  }
}

/** Timeout + retry + breaker, composed in the order every adapter needs:
 *  the breaker wraps the whole retry sequence, not each individual attempt. */
export function guarded<T>(
  provider: string,
  breaker: CircuitBreaker,
  timeoutMs: number,
  fn: (signal: AbortSignal) => Promise<T>,
  retry?: RetryOptions,
): Promise<T> {
  return breaker.execute(() => withRetry(() => withTimeout(provider, timeoutMs, fn), retry));
}
