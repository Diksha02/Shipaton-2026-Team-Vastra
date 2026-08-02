import { createHash } from 'node:crypto';

/**
 * AI try-on (FASHN.ai in production).
 *
 * The cache is the economics of this feature (PROJECT.md §5.2). Cost scales
 * with unique outfits created, never with taps — which is what makes "free
 * try-on, any time" honest rather than a subsidy we quietly withdraw later.
 */

export interface TryonInput {
  avatarImageUrl: string;
  garmentImageUrls: string[];
}

export interface TryonOutcome {
  provider: string;
  /** Where the provider put the render. The worker copies it into R2 — we never
   *  serve a client a URL on someone else's domain that could expire. */
  resultUrl: string;
  /** Real cost in minor units, recorded per generation so COGS is measured
   *  rather than estimated. */
  costMinor: number;
  modelVersion: string;
  raw: unknown;
}

export interface TryonProvider {
  readonly name: string;
  readonly modelVersion: string;
  generate(input: TryonInput): Promise<TryonOutcome>;
}

/**
 * The cache key, exactly as specified in PROJECT.md §5.2:
 *
 *   sha256(avatar_asset_id + ':' + sorted(item_ids).join(',') + ':' + MODEL_VERSION)
 *
 * Item ids are sorted so that composing the same garments in a different order
 * hits the same cache entry — order is a property of the outfit's presentation,
 * not of the image the model produces.
 *
 * Including MODEL_VERSION means bumping it invalidates every entry at once,
 * which is the only safe way to roll out a model change.
 */
export function tryonCacheKey(
  avatarAssetId: string,
  itemIds: readonly string[],
  modelVersion: string,
): string {
  const sortedItems = [...itemIds].sort().join(',');
  return createHash('sha256')
    .update(`${avatarAssetId}:${sortedItems}:${modelVersion}`)
    .digest('hex');
}

export class FakeTryonProvider implements TryonProvider {
  readonly name = 'fake-tryon';
  readonly modelVersion: string;

  constructor(modelVersion = 'fake-v1') {
    this.modelVersion = modelVersion;
  }

  generate(input: TryonInput): Promise<TryonOutcome> {
    return Promise.resolve({
      provider: this.name,
      resultUrl: `https://fake.local/tryon/${tryonCacheKey(input.avatarImageUrl, input.garmentImageUrls, this.modelVersion)}.jpg`,
      costMinor: 12,
      modelVersion: this.modelVersion,
      raw: { fake: true },
    });
  }
}
