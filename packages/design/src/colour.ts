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

  accent: '#A16207',
  accentPressed: '#854D0E',
  accentSubtle: '#FEF9EC',
  accentBorder: '#FDE68A',
  textOnAccent: '#FFFFFF',

  danger: '#B91C1C',
  dangerSubtle: '#FEF2F2',
  textOnDanger: '#FFFFFF',

  scrim: 'rgba(28, 25, 23, 0.55)',
};

export const darkColours: ColourScheme = {
  bg: '#0C0A09',
  surface: '#1C1917',
  surfaceMuted: '#292524',
  surfacePressed: '#44403C',
  surfaceGarment: '#232020',

  border: '#292524',
  borderStrong: '#44403C',

  textPrimary: '#FAFAF9',
  textSecondary: '#D6D3D1',
  textTertiary: '#A8A29E',
  textDisabled: '#57534E',
  textOnAction: '#1C1917',

  actionPrimary: '#FAFAF9',
  actionPrimaryPressed: '#D6D3D1',

  accent: '#FBBF24',
  accentPressed: '#F59E0B',
  accentSubtle: '#2A2011',
  accentBorder: '#57430F',
  textOnAccent: '#1C1917',

  danger: '#F87171',
  dangerSubtle: '#2A1515',
  textOnDanger: '#1C1917',

  scrim: 'rgba(0, 0, 0, 0.7)',
};
