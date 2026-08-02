/**
 * Typography.
 *
 * Instrument Serif for display, Inter for everything functional.
 *
 * The serif is used sparingly and at size — screen titles, prices, the try-on
 * reveal, the paywall headline. It is what makes the app read as fashion rather
 * than as a utility. Never set body copy or controls in it.
 *
 * Font files ship via `@expo-google-fonts/instrument-serif` and
 * `@expo-google-fonts/inter`, both OFL-licensed. Loaded once at app root; a
 * screen never loads a font.
 */

export const fontFamily = {
  /** Instrument Serif, 400 only (it has no other weight — hierarchy comes from size). */
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  sans: 'Inter_400Regular',
  sansMedium: 'Inter_500Medium',
  sansSemibold: 'Inter_600SemiBold',
  sansBold: 'Inter_700Bold',
} as const;

export type FontFamilyToken = keyof typeof fontFamily;

export interface TextStyleToken {
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  letterSpacing: number;
  textTransform?: 'uppercase';
}

/**
 * Negative tracking on the serif sizes is deliberate: Instrument Serif is drawn
 * loose, and it only looks composed once it is tightened at display sizes.
 */
export const textStyles = {
  /** Try-on reveal, onboarding, paywall headline. One per screen at most. */
  display: {
    fontFamily: fontFamily.display,
    fontSize: 44,
    lineHeight: 48,
    letterSpacing: -0.8,
  },
  title1: {
    fontFamily: fontFamily.display,
    fontSize: 32,
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  title2: {
    fontFamily: fontFamily.display,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.3,
  },

  /** Section headers, card titles. Sans — this is structure, not expression. */
  headline: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 18,
    lineHeight: 24,
    letterSpacing: -0.2,
  },
  body: {
    fontFamily: fontFamily.sans,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  bodyMedium: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 16,
    lineHeight: 24,
    letterSpacing: -0.1,
  },
  callout: {
    fontFamily: fontFamily.sans,
    fontSize: 15,
    lineHeight: 22,
    letterSpacing: -0.1,
  },
  subhead: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 14,
    lineHeight: 20,
    letterSpacing: 0,
  },
  footnote: {
    fontFamily: fontFamily.sans,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 0,
  },
  caption: {
    fontFamily: fontFamily.sans,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 0.1,
  },
  /** Icon-button captions and other sub-caption labels. The floor — anything
   *  smaller is decoration the user cannot read. */
  micro: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 9,
    lineHeight: 12,
    letterSpacing: 0.2,
  },
  /** Category chips, "COMING SOON" badges, metadata labels. */
  overline: {
    fontFamily: fontFamily.sansMedium,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
  },
  /** Button labels. Slightly tighter than body so they optically centre. */
  button: {
    fontFamily: fontFamily.sansSemibold,
    fontSize: 16,
    lineHeight: 20,
    letterSpacing: -0.1,
  },
} as const satisfies Record<string, TextStyleToken>;

export type TextStyleName = keyof typeof textStyles;
