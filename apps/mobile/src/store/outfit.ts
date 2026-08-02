import { create } from 'zustand';
import { STUDIO_LAYERS, itemsForLayer, type StudioLayer } from '../mock/data';

export type OutfitLayers = Record<StudioLayer, string | null>;

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
  setLayer: (layer: StudioLayer, itemId: string | null) => void;
  setActiveLayer: (layer: StudioLayer) => void;
  shuffle: () => void;
  reset: () => void;
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
export const useOutfitStore = create<OutfitState>((set) => ({
  // Ids must track src/mock/data.ts. w1 sweatshirt, w4 jean, w8 trainers.
  layers: { ...EMPTY, top: 'w1', bottom: 'w4', footwear: 'w8' },
  activeLayer: 'top',

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
