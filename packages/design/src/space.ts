/**
 * Spacing, radii and layout constants.
 *
 * A 4pt grid. Every margin, padding and gap in the app comes from this scale —
 * an arbitrary `padding: 13` is a bug, not a preference. Consistent rhythm is
 * most of what reads as "designed" versus "assembled".
 */

export const space = {
  none: 0,
  hair: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
  '6xl': 80,
} as const;

export type SpaceToken = keyof typeof space;

export const radius = {
  none: 0,
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  '2xl': 28,
  /** Pills: chips, avatars, the Plus badge. */
  full: 9999,
} as const;

export type RadiusToken = keyof typeof radius;

export const borderWidth = {
  hairline: 1,
  thick: 2,
} as const;

/**
 * Elevation is expressed with borders and background separation first, shadows
 * second. Heavy drop shadows read as dated, and they look worse over garment
 * photography than a crisp 1px border does.
 */
export const shadow = {
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },
  /** Sticky headers, floating chips. */
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  /** Bottom sheets, the buy sheet, the paywall. */
  lg: {
    shadowColor: '#000000',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export type ShadowToken = keyof typeof shadow;

export const layout = {
  /** Horizontal page gutter. Everything aligns to this. */
  gutter: space.base,
  /** Wardrobe grid: 2 columns on phones. */
  gridColumns: 2,
  gridGap: space.md,
  /** Garment cards are portrait — clothing is taller than it is wide. */
  garmentAspectRatio: 3 / 4,
  /** Minimum tap target. Below this, controls fail accessibility guidance on
   *  both platforms regardless of how they look. */
  minTapTarget: 44,
} as const;
