import { describe, expect, it, vi } from 'vitest';
import {
  CircuitBreaker,
  CircuitOpenError,
  ProviderError,
  TimeoutError,
  withRetry,
  withTimeout,
} from './resilience';

const noSleep = () => Promise.resolve();

describe('withTimeout', () => {
  it('resolves when the call finishes in time', async () => {
    await expect(withTimeout('p', 50, () => Promise.resolve('ok'))).resolves.toBe('ok');
  });

  it('throws TimeoutError and aborts the signal', async () => {
    let seen: AbortSignal | undefined;

    const promise = withTimeout('p', 10, (signal) => {
      seen = signal;
      return new Promise((resolve) => setTimeout(() => resolve('late'), 200));
    });

    await expect(promise).rejects.toBeInstanceOf(TimeoutError);
    // The request must actually be cancelled — an abandoned fetch still holds a socket.
    expect(seen?.aborted).toBe(true);
  });
});

describe('withRetry', () => {
  it('does not retry a non-retryable error', async () => {
    const fn = vi.fn(() => Promise.reject(new ProviderError('p', 'bad request')));
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('bad request');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('retries a retryable error and succeeds', async () => {
    let calls = 0;
    const fn = vi.fn(() => {
      calls += 1;
      return calls < 3
        ? Promise.reject(new ProviderError('p', 'flaky', { retryable: true }))
        : Promise.resolve('ok');
    });

    await expect(withRetry(fn, { sleep: noSleep })).resolves.toBe('ok');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('makes exactly one call plus two retries by default (PROJECT.md §7)', async () => {
    const fn = vi.fn(() => Promise.reject(new ProviderError('p', 'down', { retryable: true })));
    await expect(withRetry(fn, { sleep: noSleep })).rejects.toThrow('down');
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('uses full jitter, capped by the exponential ceiling', async () => {
    const delays: number[] = [];
    const fn = () => Promise.reject(new ProviderError('p', 'x', { retryable: true }));

    await expect(
      withRetry(fn, {
        baseDelayMs: 100,
        random: () => 0.999,
        sleep: (ms) => {
          delays.push(ms);
          return Promise.resolve();
        },
      }),
    ).rejects.toThrow();

    // ceilings are 100 and 200; full jitter draws below each.
    expect(delays).toHaveLength(2);
    expect(delays[0]).toBeLessThan(100);
    expect(delays[1]).toBeLessThan(200);
    expect(delays[1]).toBeGreaterThan(delays[0] ?? 0);
  });
});

describe('CircuitBreaker', () => {
  it('opens after the failure threshold and then fails fast', async () => {
    const breaker = new CircuitBreaker('p', { failureThreshold: 2, resetTimeoutMs: 1000 });
    const failing = () => Promise.reject(new ProviderError('p', 'down', { retryable: true }));

    await expect(breaker.execute(failing)).rejects.toThrow('down');
    await expect(breaker.execute(failing)).rejects.toThrow('down');
    expect(breaker.state).toBe('open');

    // Now it rejects without invoking the provider at all.
    const spy = vi.fn(failing);
    await expect(breaker.execute(spy)).rejects.toBeInstanceOf(CircuitOpenError);
    expect(spy).not.toHaveBeenCalled();
  });

  it('half-opens after the reset window and closes on a successful probe', async () => {
    let now = 0;
    const breaker = new CircuitBreaker('p', {
      failureThreshold: 1,
      resetTimeoutMs: 500,
      now: () => now,
    });

    await expect(
      breaker.execute(() => Promise.reject(new ProviderError('p', 'down'))),
    ).rejects.toThrow();
    expect(breaker.state).toBe('open');

    now = 600;
    expect(breaker.state).toBe('half-open');

    await expect(breaker.execute(() => Promise.resolve('recovered'))).resolves.toBe('recovered');
    expect(breaker.state).toBe('closed');
  });

  it('re-opens if the probe fails', async () => {
    let now = 0;
    const breaker = new CircuitBreaker('p', {
      failureThreshold: 1,
      resetTimeoutMs: 500,
      now: () => now,
    });

    await expect(
      breaker.execute(() => Promise.reject(new ProviderError('p', 'down'))),
    ).rejects.toThrow();

    now = 600;
    await expect(
      breaker.execute(() => Promise.reject(new ProviderError('p', 'still down'))),
    ).rejects.toThrow('still down');

    expect(breaker.state).toBe('open');
  });

  it('resets the failure count on success, so intermittent errors never trip it', async () => {
    const breaker = new CircuitBreaker('p', { failureThreshold: 3 });
    const fail = () => Promise.reject(new ProviderError('p', 'x'));

    await expect(breaker.execute(fail)).rejects.toThrow();
    await expect(breaker.execute(fail)).rejects.toThrow();
    await expect(breaker.execute(() => Promise.resolve('ok'))).resolves.toBe('ok');
    await expect(breaker.execute(fail)).rejects.toThrow();
    await expect(breaker.execute(fail)).rejects.toThrow();

    expect(breaker.state).toBe('closed');
  });
});
