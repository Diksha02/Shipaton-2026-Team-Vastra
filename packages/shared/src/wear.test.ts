import { describe, expect, it } from 'vitest';
import type { ItemColour } from './enums';
import {
  COLOUR_WALL_ORDER,
  FORGOTTEN_AFTER_DAYS,
  colourWall,
  daysSinceWorn,
  forgotten,
  wearCount,
  wearState,
  type WearLog,
} from './wear';

const NOW = Date.parse('2026-08-23T12:00:00Z');
const daysAgo = (n: number) => new Date(NOW - n * 86_400_000).toISOString();

const log: WearLog = {
  worn_yesterday: { wornAt: [daysAgo(1)] },
  worn_often: { wornAt: [daysAgo(2), daysAgo(9), daysAgo(20)] },
  worn_long_ago: { wornAt: [daysAgo(120)] },
  worn_just_over: { wornAt: [daysAgo(FORGOTTEN_AFTER_DAYS)] },
  worn_just_under: { wornAt: [daysAgo(FORGOTTEN_AFTER_DAYS - 1)] },
};

// Annotated, not inferred: `= 'black' as const` narrows the parameter to the
// literal 'black' and rejects every other colour at the call site.
const item = (id: string, colour: ItemColour = 'black', owned = true) => ({ id, colour, owned });

describe('wear state', () => {
  it('counts wears', () => {
    expect(wearCount(log, 'worn_often')).toBe(3);
    expect(wearCount(log, 'never_worn')).toBe(0);
  });

  it('reports days since last worn, and null for never', () => {
    expect(daysSinceWorn(log, 'worn_yesterday', NOW)).toBe(1);
    expect(daysSinceWorn(log, 'never_worn', NOW)).toBeNull();
  });

  it('separates never from forgotten', () => {
    // They read completely differently to a user: one is a purchase that has
    // never paid for itself, the other is something that fell out of rotation.
    expect(wearState(log, 'never_worn', NOW)).toBe('never');
    expect(wearState(log, 'worn_long_ago', NOW)).toBe('forgotten');
    expect(wearState(log, 'worn_yesterday', NOW)).toBe('recent');
  });

  it('is inclusive at the threshold', () => {
    expect(wearState(log, 'worn_just_over', NOW)).toBe('forgotten');
    expect(wearState(log, 'worn_just_under', NOW)).toBe('recent');
  });

  it('treats a future date as today rather than as negative days', () => {
    // A device with a wrong clock should not produce a garment "worn in -3
    // days", which sorts oddly and reads as a bug.
    const skewed: WearLog = { skew: { wornAt: [new Date(NOW + 5 * 86_400_000).toISOString()] } };
    expect(daysSinceWorn(skewed, 'skew', NOW)).toBe(0);
    expect(wearState(skewed, 'skew', NOW)).toBe('recent');
  });
});

describe('forgotten', () => {
  const items = [
    item('worn_yesterday'),
    item('worn_long_ago'),
    item('never_worn'),
    item('also_never'),
  ];

  it('excludes anything worn recently', () => {
    expect(forgotten(items, log, NOW).map((i) => i.id)).not.toContain('worn_yesterday');
  });

  it('puts never-worn ahead of long-forgotten', () => {
    const ids = forgotten(items, log, NOW).map((i) => i.id);
    expect(ids.indexOf('never_worn')).toBeLessThan(ids.indexOf('worn_long_ago'));
  });

  it('never suggests something you do not own', () => {
    // Telling someone they have "forgotten" a jacket from a shop is nonsense.
    const withShop = [...items, { id: 'shop_item', colour: 'black' as const, owned: false }];
    expect(forgotten(withShop, log, NOW).map((i) => i.id)).not.toContain('shop_item');
  });

  it('is stable rather than reshuffling on every render', () => {
    const a = forgotten(items, log, NOW).map((i) => i.id);
    const b = forgotten(items, log, NOW).map((i) => i.id);
    expect(a).toEqual(b);
  });
});

describe('colour wall', () => {
  it('orders neutrals first, then warm through cool', () => {
    // Alphabetical would sit beige next to black and blue next to brown, which
    // is the arrangement that makes a colour view useless.
    expect(COLOUR_WALL_ORDER.slice(0, 3)).toEqual(['black', 'grey', 'white']);
    expect(COLOUR_WALL_ORDER.indexOf('red')).toBeLessThan(COLOUR_WALL_ORDER.indexOf('blue'));
  });

  it('drops empty colours instead of showing placeholders', () => {
    const groups = colourWall([item('a', 'black'), item('b', 'blue')]);
    expect(groups.map((g) => g.colour)).toEqual(['black', 'blue']);
  });

  it('groups every item exactly once', () => {
    const items = [item('a', 'black'), item('b', 'black'), item('c', 'red')];
    const groups = colourWall(items);
    expect(groups.flatMap((g) => g.items)).toHaveLength(items.length);
    expect(groups.find((g) => g.colour === 'black')?.items).toHaveLength(2);
  });

  it('returns nothing for an empty wardrobe rather than empty bands', () => {
    expect(colourWall([])).toEqual([]);
  });
});
