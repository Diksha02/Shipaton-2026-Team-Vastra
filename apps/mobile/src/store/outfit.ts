import { create } from 'zustand';
import {
  FREE_SLOTS,
  STUDIO_LAYERS,
  itemsForLayer,
  outfits as seedOutfits,
  type MockOutfit,
  type StudioLayer,
} from '../mock/data';

export type OutfitLayers = Record<StudioLayer, string | null>;

/** Below this an outfit is a garment, not a look. Mirrors the disabled state of
 *  the Save button. */
export const MIN_PIECES = 2;

export type SaveResult = 'saved' | 'full' | 'too_few';

const EMPTY: OutfitLayers = {
  top: null,
  bottom: null,
  outerwear: null,
  footwear: null,
  bag: null,
  accessory: null,
  headwear: null,
};

/** Layers shuffle leaves empty roughly half the time. A random hat on every
 *  outfit gets old fast; a random top is the whole point. */
const OPTIONAL: ReadonlySet<StudioLayer> = new Set(['headwear', 'bag', 'accessory']);

interface OutfitState {
  layers: OutfitLayers;
  activeLayer: StudioLayer;
  /** Saved outfits, oldest first. Seeded from mock data for design review. */
  saved: MockOutfit[];
  setLayer: (layer: StudioLayer, itemId: string | null) => void;
  setActiveLayer: (layer: StudioLayer) => void;
  shuffle: () => void;
  reset: () => void;
  /** Commits whatever is on the stage to a free slot. Returns why it refused
   *  rather than throwing — the caller decides between paywall and a hint. */
  saveCurrent: () => SaveResult;
  /** Frees the slot the outfit occupied. Always permitted, for any outfit,
   *  finalised or not — see the note above `deleteOutfit`. */
  deleteOutfit: (id: string) => void;
}

/** Garments in paint order, so a saved outfit lists head-to-toe rather than in
 *  whatever order the layers happen to be declared. */
function composedItemIds(layers: OutfitLayers): string[] {
  return STUDIO_LAYERS.map((layer) => layers[layer]).filter(
    (id): id is string => id !== null,
  );
}

/** Slots are numbered by position, not by count of saves — deleting slot 2 and
 *  saving again should not produce two outfits called the same thing. */
function nextOutfitName(saved: readonly MockOutfit[]): string {
  const taken = new Set(saved.map((outfit) => outfit.name));
  for (let n = saved.length + 1; ; n += 1) {
    const candidate = `Outfit ${n}`;
    if (!taken.has(candidate)) return candidate;
  }
}

/**
 * The composed outfit.
 *
 * The store holds ids, never item objects — an id is the smallest thing that
 * can change, and keeping it small is what makes the next part true:
 *
 * `setLayer` replaces exactly one key. Combined with the selector hooks below,
 * changing shoes re-renders the shoes panel and nothing else. No list reloads,
 * no stage rebuild, no cascade.
 */
export const useOutfitStore = create<OutfitState>((set, get) => ({
  // Ids must track src/mock/data.ts. w1 sweatshirt, w4 jean, w8 trainers.
  layers: { ...EMPTY, top: 'w1', bottom: 'w4', footwear: 'w8' },
  activeLayer: 'top',
  saved: [...seedOutfits],

  setLayer: (layer, itemId) =>
    set((state) =>
      // Bail out when nothing actually changed. A snap-scroll settling on the
      // card that is already selected must not produce a state write.
      state.layers[layer] === itemId
        ? state
        : { layers: { ...state.layers, [layer]: itemId } },
    ),

  setActiveLayer: (layer) => set((state) => (state.activeLayer === layer ? state : { activeLayer: layer })),

  shuffle: () =>
    set(() => {
      const layers = { ...EMPTY };
      for (const layer of STUDIO_LAYERS) {
        const options = itemsForLayer(layer);
        if (options.length === 0) continue;
        if (OPTIONAL.has(layer) && Math.random() < 0.5) continue;

        const pick = options[Math.floor(Math.random() * options.length)];
        if (pick) layers[layer] = pick.id;
      }
      return { layers };
    }),

  reset: () => set({ layers: { ...EMPTY } }),

  saveCurrent: () => {
    const { layers, saved } = get();
    const itemIds = composedItemIds(layers);

    if (itemIds.length < MIN_PIECES) return 'too_few';
    if (saved.length >= FREE_SLOTS) return 'full';

    const outfit: MockOutfit = {
      id: `saved-${Date.now()}`,
      name: nextOutfitName(saved),
      itemIds,
      // Saved outfits are edit-locked but always deletable (PROJECT.md §4).
      finalised: true,
    };

    set({ saved: [...saved, outfit] });
    return 'saved';
  },

  /**
   * There is deliberately no `finalised` check here.
   *
   * A finalised outfit is immutable — it cannot be edited — but it remains
   * deletable, and deleting it frees its slot. Edit-locking is the scarcity
   * mechanic; deletion-locking is not, and must never become one (PROJECT.md
   * §4, UK GDPR Art. 17). Do not add a guard to this function.
   */
  deleteOutfit: (id) =>
    set((state) => {
      const saved = state.saved.filter((outfit) => outfit.id !== id);
      return saved.length === state.saved.length ? state : { saved };
    }),
}));

/**
 * Subscribe to a single layer.
 *
 * This is the hook that makes the "nothing else changes" claim real: a
 * component using `useLayer('footwear')` is not re-rendered when the top
 * changes, because the selected slice is identical between renders.
 */
export function useLayer(layer: StudioLayer): string | null {
  return useOutfitStore((state) => state.layers[layer]);
}

export function useActiveLayer(): StudioLayer {
  return useOutfitStore((state) => state.activeLayer);
}

/** Count of filled layers. Selector-derived so the header re-renders on a
 *  count change rather than on every selection change. */
export function useFilledCount(): number {
  return useOutfitStore((state) => {
    let count = 0;
    for (const layer of STUDIO_LAYERS) if (state.layers[layer]) count += 1;
    return count;
  });
}

export function useSavedOutfits(): MockOutfit[] {
  return useOutfitStore((state) => state.saved);
}

export function useSlotsLeft(): number {
  return useOutfitStore((state) => Math.max(0, FREE_SLOTS - state.saved.length));
}
