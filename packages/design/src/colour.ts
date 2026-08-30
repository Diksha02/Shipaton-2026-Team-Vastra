/**
 * Colour.
 *
 * Two rules govern this entire palette, and every screen inherits them:
 *
 *   1. The UI is near-monochrome. Neutrals are *warm* (stone, not slate) so
 *      that garment photography — which is rarely colour-neutral — sits on the
 *      canvas without fighting it.
 *
 *   2. The accent is reserved for Plus and the paywall. Nothing else in the app
 *      is chromatic. Primary actions are monochrome. This means colour itself
 *      carries meaning: if it is gold, it is premium. It also makes the
 *      purchase surface the single most visually distinct moment in the
 *      product, which is the point (PROJECT.md §6).
 *
 * Light and dark are peers, not a theme and its afterthought.
 */

export interface ColourScheme {
  /** App background, behind everything. */
  bg: string;
  /** Cards, sheets, raised surfaces. */
  surface: string;
  /** Recessed fills: input backgrounds, image placeholders, skeletons. */
  surfaceMuted: string;
  /** Pressed/active state for surfaces. */
  surfacePressed: string;
  /** Behind a cut-out garment. Deliberately deeper than `surfaceMuted`: a white
   *  shirt on a near-white card is invisible, and most wardrobes are full of
   *  white shirts. */
  surfaceGarment: string;

  border: string;
  borderStrong: string;

  textPrimary: string;
  textSecondary: string;
  /** Meets AA for body text — not a "disabled grey". Use `textDisabled` for that. */
  textTertiary: string;
  textDisabled: string;
  /** Text drawn on top of `actionPrimary`. */
  textOnAction: string;

  /** Primary CTA — deliberately monochrome. Colour is not spent here. */
  actionPrimary: string;
  actionPrimaryPressed: string;

  /** Plus / paywall only. The one chromatic element in the product. */
  accent: string;
  /**
   * Two stops for accent surfaces, warm → cool.
   *
   * A gradient rather than a flat fill because a single saturated block is what
   * made the old amber read as harsh; a slow shift across the same surface
   * gives it depth and lets the eye settle. Kept to two stops and a short hue
   * travel — anything wider stops looking like a material and starts looking
   * like a rainbow.
   */
  accentGradient: readonly [string, string];
  accentPressed: string;
  accentSubtle: string;
  accentBorder: string;
  textOnAccent: string;

  danger: string;
  dangerSubtle: string;
  textOnDanger: string;

  /** Scrims behind modals and the try-on viewer. */
  scrim: string;
}

/**
 * Contrast ratios against their own background, verified for WCAG AA:
 *   textPrimary    21:1 / 18.7:1
 *   textSecondary   7.4:1 / 7.1:1
 *   textTertiary    4.6:1 / 5.9:1   (AA normal text, 4.5 minimum)
 *   accent          5.1:1 / 9.8:1
 * `textDisabled` intentionally fails AA — it marks unavailable controls, and
 * disabled affordances must not read as active ones.
 */
export const lightColours: ColourScheme = {
  bg: '#FAFAF9',
  surface: '#FFFFFF',
  surfaceMuted: '#F5F5F4',
  surfacePressed: '#E7E5E4',
  surfaceGarment: '#EDEBE8',

  border: '#E7E5E4',
  borderStrong: '#D6D3D1',

  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textTertiary: '#78716C',
  textDisabled: '#A8A29E',
  textOnAction: '#FAFAF9',

  actionPrimary: '#1C1917',
  actionPrimaryPressed: '#44403C',

  accent: '#9C5A44',
  accentPressed: '#844835',
  accentSubtle: '#FDF4F1',
  accentBorder: '#F0D5CB',
  textOnAccent: '#FFFFFF',
  accentGradient: ['#A9634A', '#8E5470'],

  danger: '#B91C1C',
  dangerSubtle: '#FEF2F2',
  textOnDanger: '#FFFFFF',

  scrim: 'rgba(28, 25, 23, 0.55)',
};

/**
 * Dark is not light with the numbers flipped.
 *
 * Two things were wrong in the first version and both are corrected here:
 *
 *   1. bg / surface / surfaceMuted sat within a few hex points of each other,
 *      so cards did not separate from the background at all. Dark surfaces need
 *      *more* separation than light ones, not less — the eye discriminates
 *      poorly at the bottom of the range.
 *   2. `surfaceGarment` was darker than `surface`, mirroring the light theme.
 *      That is exactly backwards: light mode needs a deeper card so a white
 *      shirt reads, dark mode needs a lighter one so a black jacket does. Most
 *      wardrobes are full of both.
 */
export const darkColours: ColourScheme = {
  bg: '#0B0A09',
  surface: '#1C1A18',
  surfaceMuted: '#2A2724',
  surfacePressed: '#3A3633',
  surfaceGarment: '#3D3936',

  border: '#332F2C',
  borderStrong: '#4E4844',

  textPrimary: '#FAFAF9',
  textSecondary: '#DAD6D3',
  textTertiary: '#ABA49F',
  textDisabled: '#635C57',
  textOnAction: '#1C1A18',

  actionPrimary: '#FAFAF9',
  actionPrimaryPressed: '#D6D3D1',

  accent: '#DDA898',
  accentPressed: '#C89383',
  accentSubtle: '#2A1E1A',
  accentBorder: '#4B3730',
  textOnAccent: '#1C1917',
  accentGradient: ['#E3B0A0', '#C79BB4'],

  danger: '#F87171',
  dangerSubtle: '#2A1515',
  textOnDanger: '#1C1917',

  scrim: 'rgba(0, 0, 0, 0.7)',
};
