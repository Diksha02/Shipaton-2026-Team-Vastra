import type { ItemCategory, ItemColour } from '@vastra/shared';

/**
 * Garment tagging (Ximilar in production).
 *
 * Provider vocabularies are not stable and are not ours, so the adapter returns
 * both its own raw labels and our normalised view. `taxonomy_map` owns the
 * translation; this interface only promises to surface both.
 */

export interface TaggingInput {
  imageUrl: string;
}

export interface TaggingOutcome {
  provider: string;
  /** Normalised onto our taxonomy. Null when the provider had no confident answer —
   *  better an untagged item the user can correct than a confidently wrong one. */
  category: ItemCategory | null;
  subcategory: string | null;
  colourPrimary: ItemColour | null;
  /** Provider labels as returned, before mapping. */
  rawLabels: string[];
  attributes: Record<string, unknown>;
  raw: unknown;
}

export interface TaggingProvider {
  readonly name: string;
  tag(input: TaggingInput): Promise<TaggingOutcome>;
}

export class FakeTaggingProvider implements TaggingProvider {
  readonly name = 'fake-tagging';

  constructor(private readonly fixed?: Partial<TaggingOutcome>) {}

  tag(input: TaggingInput): Promise<TaggingOutcome> {
    return Promise.resolve({
      provider: this.name,
      category: 'top',
      subcategory: 't-shirt',
      colourPrimary: 'black',
      rawLabels: ['clothing', 'top', 't-shirt'],
      attributes: { material: 'cotton', fit: 'regular' },
      raw: { fake: true, imageUrl: input.imageUrl },
      ...this.fixed,
    });
  }
}
