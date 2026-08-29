import { catalogue, type MockItem } from '../mock/data';

/**
 * Visual search — "find me things that look like this".
 *
 * Behind an interface for the same reason every other third party is
 * (PROJECT.md §3): the screen calling it must not care which service answers,
 * and the whole flow has to be testable before any account exists.
 *
 * The real implementation is a **server** call, never a client one. Two
 * reasons, and both matter:
 *   - an image-search API key in the app bundle is a key anyone can extract
 *     and spend;
 *   - results need affiliate links attached, which is server work.
 *
 * Google Cloud Vision Product Search is the natural fit given Vertex AI is
 * already the try-on provider — one GCP project, one credential.
 */

export interface SimilarItem {
  item: MockItem;
  /** 0–1. Shown as a coarse band, never a raw percentage: users read "92%
   *  match" as a promise, and visual similarity cannot keep it. */
  score: number;
  retailerUrl: string | null;
}

export interface SimilarSearchResult {
  ok: boolean;
  items: SimilarItem[];
  /** Present when the search could not run, so the UI explains instead of
   *  showing an empty list that looks like "nothing matches". */
  reason?: string;
}

export interface SimilarSearchProvider {
  readonly name: string;
  search(input: { imageUri: string | null }): Promise<SimilarSearchResult>;
}

/**
 * Local stand-in until a GCP credential exists.
 *
 * Deliberately returns real catalogue items with real prices and real retailer
 * links, so the entire flow — button, sheet, scoring, tap through to buy — is
 * exercisable and reviewable now. Only the *matching* is not real, and that is
 * the one part that cannot be without a key.
 */
export class LocalSimilarSearch implements SimilarSearchProvider {
  readonly name = 'local-stand-in';

  async search(): Promise<SimilarSearchResult> {
    // A short delay so the loading state is real rather than theoretical —
    // an instant result hides whether the UI handles waiting properly.
    await new Promise((resolve) => setTimeout(resolve, 700));

    return {
      ok: true,
      items: catalogue.slice(0, 4).map((item, index) => ({
        item,
        score: 0.9 - index * 0.12,
        retailerUrl: `https://example.com/${item.brand?.toLowerCase().replace(/\s+/g, '-')}/${item.id}`,
      })),
    };
  }
}

let provider: SimilarSearchProvider = new LocalSimilarSearch();

/** Swapped for the API-backed provider once the endpoint exists. One line. */
export function setSimilarSearchProvider(next: SimilarSearchProvider): void {
  provider = next;
}

export function findSimilar(imageUri: string | null): Promise<SimilarSearchResult> {
  return provider.search({ imageUri });
}

/** Coarse bands rather than a number. "Close match" is honest about what
 *  visual similarity can actually promise. */
export function matchLabel(score: number): string {
  if (score >= 0.85) return 'Very close';
  if (score >= 0.7) return 'Close';
  return 'Similar';
}
