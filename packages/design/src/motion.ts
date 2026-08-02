/**
 * Motion.
 *
 * PROJECT.md §1 targets the Design Award and notes that judges may only ever
 * watch two minutes of video. Motion is therefore load-bearing, not decoration:
 * it is a large part of what a screen recording actually conveys.
 *
 * Two principles:
 *   - Movement acknowledges input immediately. Nothing waits on the network to
 *     start animating.
 *   - Springs for anything the user directly manipulates; timed easing curves
 *     for anything the system does on its own.
 */

export const duration = {
  /** State changes that must feel instant: press states, toggles. */
  instant: 100,
  fast: 160,
  /** The default for most transitions. */
  base: 240,
  slow: 380,
  /** Reveals that deserve weight — the try-on result, the paywall entrance. */
  deliberate: 560,
} as const;

export type DurationToken = keyof typeof duration;

/** Cubic-bezier control points, for `Easing.bezier(...)` in Reanimated. */
export const easing = {
  /** Default. Enters fast, settles gently. */
  standard: [0.2, 0, 0, 1],
  /** Elements entering the screen. */
  decelerate: [0, 0, 0, 1],
  /** Elements leaving the screen — quick, unremarkable exits. */
  accelerate: [0.3, 0, 1, 1],
  /** Emphasis on both ends. Use rarely. */
  emphasised: [0.2, 0, 0, 1.2],
} as const satisfies Record<string, readonly [number, number, number, number]>;

export type EasingToken = keyof typeof easing;

/**
 * Reanimated spring configs. `damping`/`stiffness`, not duration — a spring
 * interrupted mid-flight resolves naturally, which is what makes drag
 * interactions in the outfit builder feel physical rather than scripted.
 */
export const spring = {
  /** Default for direct manipulation. */
  responsive: { damping: 20, stiffness: 220, mass: 1 },
  /** Sheets and modals: heavier, more settled. */
  gentle: { damping: 26, stiffness: 140, mass: 1 },
  /** Small confirmations — a slot filling, an item added. Slight overshoot. */
  bouncy: { damping: 14, stiffness: 260, mass: 0.9 },
} as const;

export type SpringToken = keyof typeof spring;

/**
 * Staggered list entrances. Capped deliberately: past roughly the eighth item
 * the delay is longer than the user's patience, and a grid that keeps animating
 * after you have started scrolling feels broken rather than polished.
 */
export const stagger = {
  step: 40,
  maxItems: 8,
} as const;

export function staggerDelay(index: number): number {
  return Math.min(index, stagger.maxItems) * stagger.step;
}
