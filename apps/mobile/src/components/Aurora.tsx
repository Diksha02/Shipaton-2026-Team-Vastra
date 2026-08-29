import { useEffect } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';
import { useTheme } from '../theme/ThemeProvider';

/**
 * A slow, living background.
 *
 * Built from `RadialGradient` rather than layered translucent circles. The first
 * version stacked concentric rings to fake a radial falloff without pulling in a
 * blur dependency; on screen it banded into visible arcs and the overlapping
 * muted swatches summed to grey mud. A real radial gradient has genuinely smooth
 * falloff, renders on the GPU, and costs less than the rings did.
 *
 * Two constraints still hold:
 *
 * 1. **Transforms only.** An earlier loading screen animated `width` in an
 *    infinite Reanimated loop and crashed the host app — layout properties
 *    re-lay out the tree every frame. Everything here animates
 *    `translate`/`scale`, which stay on the UI thread.
 * 2. **No blur.** `expo-blur` is expensive on Android and janky on mid-range
 *    devices, and this is the first screen anyone sees.
 */

interface Orb {
  /** Saturated on purpose — see the note on `TINTS`. */
  colour: string;
  /** Fractions of screen width/height, so the composition holds on any device. */
  x: number;
  y: number;
  /** Diameter as a fraction of the larger screen edge. */
  size: number;
  opacity: number;
  drift: { x: number; y: number };
  duration: number;
}

/**
 * Not the garment swatches.
 *
 * Using the wardrobe palette directly was the obvious idea and it looked awful:
 * those colours are deliberately desaturated so garments read as cloth, and
 * overlapping five muted browns and greens produces grey. These are the same
 * *hues* pushed up in saturation, which reads as light through fabric rather
 * than as dye.
 */
const TINTS = {
  amber: '#E8A15C',
  rose: '#D98A96',
  indigo: '#5B7BA8',
  sage: '#6E9070',
} as const;

/**
 * Deliberately unbalanced. Evenly spaced orbs read as a pattern; an off-centre
 * cluster with one far outlier reads as light.
 */
const ORBS: Orb[] = [
  { colour: TINTS.amber, x: 0.2, y: 0.16, size: 1.15, opacity: 0.5, drift: { x: 28, y: 36 }, duration: 15000 },
  { colour: TINTS.rose, x: 0.88, y: 0.3, size: 0.9, opacity: 0.42, drift: { x: -34, y: 24 }, duration: 18000 },
  { colour: TINTS.indigo, x: 0.75, y: 0.72, size: 1.0, opacity: 0.38, drift: { x: 24, y: -30 }, duration: 20000 },
  { colour: TINTS.sage, x: 0.1, y: 0.82, size: 0.8, opacity: 0.32, drift: { x: 32, y: -22 }, duration: 17000 },
];

function AuroraOrb({
  orb,
  width,
  height,
  intensity,
}: {
  orb: Orb;
  width: number;
  height: number;
  intensity: number;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, {
        duration: orb.duration,
        // Sinusoidal so the orb eases at the turn. A linear loop reads as
        // mechanical at this speed.
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [orb.duration, progress]);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: progress.value * orb.drift.x },
      { translateY: progress.value * orb.drift.y },
      { scale: 1 + progress.value * 0.14 },
    ],
  }));

  const diameter = Math.max(width, height) * orb.size;
  const gradientId = `orb-${orb.colour.replace('#', '')}-${Math.round(orb.x * 100)}`;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: 'absolute',
          left: width * orb.x - diameter / 2,
          top: height * orb.y - diameter / 2,
          width: diameter,
          height: diameter,
        },
        style,
      ]}
    >
      <Svg width={diameter} height={diameter}>
        <Defs>
          <RadialGradient id={gradientId} cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={orb.colour} stopOpacity={orb.opacity * intensity} />
            {/* The middle stop is what removes the hard shoulder. Two stops
                alone fall off linearly and still read as a disc edge. */}
            <Stop offset="45%" stopColor={orb.colour} stopOpacity={orb.opacity * intensity * 0.45} />
            <Stop offset="100%" stopColor={orb.colour} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Circle cx={diameter / 2} cy={diameter / 2} r={diameter / 2} fill={`url(#${gradientId})`} />
      </Svg>
    </Animated.View>
  );
}

/**
 * Fills its parent. Render it first and lay content over the top.
 *
 * There is no scrim. An earlier version laid a bg-to-transparent gradient over
 * everything to guarantee contrast, which desaturated the whole screen to a
 * flat grey — it protected legibility by destroying the thing it was protecting.
 * Contrast comes instead from keeping orb opacity low enough that body text
 * clears its ratio against the base background anywhere an orb can drift.
 */
export function Aurora({ children }: { children?: React.ReactNode }) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();

  // Warm saturated tints over a near-black ground turn brown and dirty at full
  // strength. Dark mode wants a suggestion of colour, not the same wash dimmed.
  const intensity = theme.name === 'dark' ? 0.5 : 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg }}>
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {ORBS.map((orb) => (
          <AuroraOrb
            key={orb.colour + orb.x}
            orb={orb}
            width={width}
            height={height}
            intensity={intensity}
          />
        ))}
      </View>
      {children}
    </View>
  );
}
