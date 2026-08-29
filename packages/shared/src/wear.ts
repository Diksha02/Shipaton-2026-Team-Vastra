import type { ItemColour } from './enums';

/**
 * Wear tracking — the difference between a catalogue and a wardrobe.
 *
 * Without it the app can list what you own but can never tell you anything you
 * did not already know. "You have not worn this since April" is the one
 * sentence that turns an inventory into a reason to open the app again, and it
 * is the only honest way to deliver the promise that you should wear more of
 * what you already have.
 */

/** A garment is "forgotten" after this long unworn. */
export const FORGOTTEN_AFTER_DAYS = 60;

/** Never worn at all is its own state, and reads differently to a user. */
export type WearState = 'never' | 'forgotten' | 'recent';

export interface WearRecord {
  /** ISO dates, newest first. */
  wornAt: string[];
}

export type WearLog = Readonly<Record<string, WearRecord | undefined>>;

const DAY_MS = 86_400_000;

export function daysSince(iso: string, now: number = Date.now()): number {
  const then = Date.parse(iso);
  if (Number.isNaN(then)) return Number.POSITIVE_INFINITY;
  // Future dates (clock skew, a device set wrong) count as today rather than
  // as negative, which would sort them oddly and read as nonsense.
  return Math.max(0, Math.floor((now - then) / DAY_MS));
}

export function wearCount(log: WearLog, itemId: string): number {
  return log[itemId]?.wornAt.length ?? 0;
}

/** Days since last worn, or null if never. */
export function daysSinceWorn(log: WearLog, itemId: string, now = Date.now()): number | null {
  const last = log[itemId]?.wornAt[0];
  return last ? daysSince(last, now) : null;
}

export function wearState(log: WearLog, itemId: string, now = Date.now()): WearState {
  const days = daysSinceWorn(log, itemId, now);
  if (days === null) return 'never';
  return days >= FORGOTTEN_AFTER_DAYS ? 'forgotten' : 'recent';
}

/**
 * What the user should be nudged about, worst first.
 *
 * Never-worn outranks long-forgotten, because an unworn garment is a purchase
 * that has not paid for itself yet — which is the more useful thing to be shown.
 * Ties break on how long it has been, so the list is stable rather than
 * shuffling on every render.
 */
export function forgotten<T extends { id: string; owned: boolean }>(
  items: readonly T[],
  log: WearLog,
  now = Date.now(),
): T[] {
  return items
    .filter((item) => item.owned && wearState(log, item.id, now) !== 'recent')
    .sort((a, b) => {
      const da = daysSinceWorn(log, a.id, now);
      const db = daysSinceWorn(log, b.id, now);
      if (da === null && db === null) return a.id.localeCompare(b.id);
      if (da === null) return -1;
      if (db === null) return 1;
      return db - da;
    });
}

/**
 * Colour order for the wall.
 *
 * Neutrals first because most wardrobes are mostly neutral and people look for
 * them first, then warm through cool. Alphabetical would put beige next to
 * black and blue next to brown, which is exactly the arrangement that makes a
 * colour view useless — the whole point is that like sits beside like.
 */
export const COLOUR_WALL_ORDER: readonly ItemColour[] = [
  'black',
  'grey',
  'white',
  'beige',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'purple',
  'pink',
  'multi',
  'other',
] as const;

export interface ColourGroup<T> {
  colour: ItemColour;
  items: T[];
}

/**
 * Groups items into colour bands, dropping empty ones.
 *
 * Empty bands are dropped rather than shown as placeholders: a wall of "you own
 * nothing purple" is noise, and it pushes the colours you *do* own off screen.
 */
export function colourWall<T extends { colour: ItemColour }>(
  items: readonly T[],
): ColourGroup<T>[] {
  const buckets = new Map<ItemColour, T[]>();
  for (const item of items) {
    const bucket = buckets.get(item.colour);
    if (bucket) bucket.push(item);
    else buckets.set(item.colour, [item]);
  }

  return COLOUR_WALL_ORDER.filter((colour) => buckets.has(colour)).map((colour) => ({
    colour,
    items: buckets.get(colour) ?? [],
  }));
}
