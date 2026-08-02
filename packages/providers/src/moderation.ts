import type { ModerationVerdict } from '@vastra/shared';

/**
 * Moderation.
 *
 * Two passes (PROJECT.md §5.1): OpenAI omni-moderation first (free), then
 * Sightengine only when the first pass is inconclusive.
 */

export interface ModerationInput {
  /** Publicly reachable URL, or raw bytes for providers that accept uploads. */
  imageUrl: string;
}

export interface ModerationOutcome {
  verdict: ModerationVerdict;
  provider: string;
  scores: Record<string, number>;
  raw: unknown;
}

export interface ModerationProvider {
  readonly name: string;
  check(input: ModerationInput): Promise<ModerationOutcome>;
}

/**
 * Sightengine nudity classes, from its `nudity-2.1` model.
 *
 * THE CALIBRATION HERE IS THE WHOLE FEATURE. This is a fashion app: swimwear,
 * underwear and activewear are the product, not an edge case. PROJECT.md §5.1
 * is explicit — "a blunt NSFW classifier will destroy the core use case".
 *
 *   fail   → sexual_activity, sexual_display
 *   review → erotica
 *   pass   → very_suggestive, suggestive, none
 *
 * `very_suggestive` passing is deliberate and is the line most off-the-shelf
 * configurations get wrong. A bikini scores very_suggestive.
 */
export interface NudityScores {
  sexual_activity?: number;
  sexual_display?: number;
  erotica?: number;
  very_suggestive?: number;
  suggestive?: number;
  none?: number;
}

export const MODERATION_THRESHOLDS = {
  /** Above this on a failing class → reject outright. */
  fail: 0.5,
  /** Above this on erotica → human review queue. */
  review: 0.5,
} as const;

/**
 * Pure decision function, so the policy is unit-testable without a live
 * provider and reviewable without reading HTTP code.
 */
export function decideNudityVerdict(scores: NudityScores): ModerationVerdict {
  const sexualActivity = scores.sexual_activity ?? 0;
  const sexualDisplay = scores.sexual_display ?? 0;
  const erotica = scores.erotica ?? 0;

  if (
    sexualActivity >= MODERATION_THRESHOLDS.fail ||
    sexualDisplay >= MODERATION_THRESHOLDS.fail
  ) {
    return 'fail';
  }

  if (erotica >= MODERATION_THRESHOLDS.review) {
    return 'review';
  }

  // very_suggestive and below pass. Swimwear and underwear live here.
  return 'pass';
}

/** Offensive symbols and gore are rejected regardless of the nudity classes. */
export function decideAuxiliaryVerdict(scores: {
  offensive?: number;
  gore?: number;
}): ModerationVerdict | null {
  if ((scores.offensive ?? 0) >= MODERATION_THRESHOLDS.fail) return 'fail';
  if ((scores.gore ?? 0) >= MODERATION_THRESHOLDS.fail) return 'fail';
  return null;
}

/**
 * Fake used by tests and by local development before keys exist.
 *
 * Deterministic by design: the verdict is driven by markers in the URL, so a
 * test can request a rejection without needing an actually-offensive image.
 */
export class FakeModerationProvider implements ModerationProvider {
  readonly name = 'fake-moderation';

  constructor(private readonly overrides: Record<string, ModerationVerdict> = {}) {}

  check(input: ModerationInput): Promise<ModerationOutcome> {
    const override = this.overrides[input.imageUrl];
    const verdict: ModerationVerdict =
      override ??
      (input.imageUrl.includes('--fail')
        ? 'fail'
        : input.imageUrl.includes('--review')
          ? 'review'
          : 'pass');

    return Promise.resolve({
      verdict,
      provider: this.name,
      scores: { none: verdict === 'pass' ? 0.99 : 0.01 },
      raw: { fake: true, imageUrl: input.imageUrl },
    });
  }
}
