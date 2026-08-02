/**
 * @vastra/design — the single source of visual truth.
 *
 * Every colour, size, radius, duration and curve in the app comes from here.
 * A hard-coded `#fff`, `padding: 13` or `duration: 300` in a screen is a bug:
 * "matching theme everywhere" is only achievable if there is exactly one place
 * these values live.
 */

import { darkColours, lightColours, type ColourScheme } from './colour';
import { duration, easing, spring, stagger, staggerDelay } from './motion';
import { borderWidth, layout, radius, shadow, space } from './space';
import { fontFamily, textStyles } from './typography';

export * from './colour';
export * from './motion';
export * from './space';
export * from './typography';

export type ThemeName = 'light' | 'dark';

export interface Theme {
  name: ThemeName;
  colour: ColourScheme;
  space: typeof space;
  radius: typeof radius;
  borderWidth: typeof borderWidth;
  shadow: typeof shadow;
  layout: typeof layout;
  text: typeof textStyles;
  fontFamily: typeof fontFamily;
  duration: typeof duration;
  easing: typeof easing;
  spring: typeof spring;
  stagger: typeof stagger;
}

const shared = {
  space,
  radius,
  borderWidth,
  shadow,
  layout,
  text: textStyles,
  fontFamily,
  duration,
  easing,
  spring,
  stagger,
} as const;

export const lightTheme: Theme = { name: 'light', colour: lightColours, ...shared };
export const darkTheme: Theme = { name: 'dark', colour: darkColours, ...shared };

export const themes: Readonly<Record<ThemeName, Theme>> = Object.freeze({
  light: lightTheme,
  dark: darkTheme,
});

/** Both themes are peers — there is no "default" that dark is derived from.
 *  The app follows the OS setting. */
export function getTheme(name: ThemeName): Theme {
  return themes[name];
}

export { staggerDelay };
