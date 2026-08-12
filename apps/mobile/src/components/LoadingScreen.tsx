import { Image } from 'expo-image';
import { useEffect, useRef } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import darkMark from '../../assets/splash-icon-dark.png';
import lightMark from '../../assets/splash-icon.png';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

const MARK = 96;

/** Beat at rest before the zoom begins (after fonts are ready). */
const HOLD_MS = 380;
/** Zoom until the mark fills the screen. */
const ZOOM_MS = 920;
/** Overlay fades out over Today. */
const FADE_MS = 520;

export interface LoadingScreenProps {
  /**
   * Optional line under the mark.
   *
   * Leave it off during font loading at app start — the brand face has not
   * resolved yet, so it would render in a system fallback next to the mark.
   * Safe to pass anywhere else.
   */
  message?: string;
}

/**
 * Static branded wait — kept for callers that need a non-animated hold.
 * App start uses `BrandIntro` instead so the mark never remounts mid-intro.
 */
export function LoadingScreen({ message }: LoadingScreenProps) {
  const theme = useTheme();

  return (
    <View style={[styles.fill, { backgroundColor: theme.colour.bg }]}>
      <Image
        source={theme.name === 'dark' ? darkMark : lightMark}
        style={{ width: MARK, height: MARK }}
        contentFit="contain"
      />
      {!!message && (
        <View style={styles.message}>
          <Text variant="footnote" colour="tertiary" align="center">
            {message}
          </Text>
        </View>
      )}
    </View>
  );
}

/**
 * Full-screen intro on a single mount: V stays put while fonts load, then
 * zooms to cover the viewport and fades away over Today.
 *
 * Important: do not swap this for a separate wait screen when fonts resolve —
 * remounting the mark is what made it vanish and pop back before the zoom.
 */
export function BrandIntro({
  readyToZoom,
  onComplete,
}: {
  /** Start the zoom only once fonts (and the app under us) are ready. */
  readyToZoom: boolean;
  onComplete: () => void;
}) {
  const theme = useTheme();
  const { width, height } = useWindowDimensions();
  const started = useRef(false);

  // Large enough that the mark's bounding box covers the longer screen edge.
  const coverScale = (Math.max(width, height) * 1.35) / MARK;

  const scale = useSharedValue(1);
  const markOpacity = useSharedValue(1);
  const overlayOpacity = useSharedValue(1);

  useEffect(() => {
    if (!readyToZoom || started.current) return;
    started.current = true;

    scale.value = withDelay(
      HOLD_MS,
      withTiming(coverScale, {
        duration: ZOOM_MS,
        easing: Easing.out(Easing.cubic),
      }),
    );

    // Soften the mark as it blows past full-bleed so the cut isn't a hard edge.
    markOpacity.value = withDelay(
      HOLD_MS + ZOOM_MS * 0.55,
      withTiming(0, { duration: ZOOM_MS * 0.45, easing: Easing.out(Easing.quad) }),
    );

    overlayOpacity.value = withDelay(
      HOLD_MS + ZOOM_MS * 0.65,
      withSequence(
        withTiming(0, { duration: FADE_MS, easing: Easing.inOut(Easing.quad) }),
        withTiming(0, { duration: 0 }, (finished) => {
          if (finished) runOnJS(onComplete)();
        }),
      ),
    );
  }, [coverScale, markOpacity, onComplete, overlayOpacity, readyToZoom, scale]);

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFillObject,
        styles.overlay,
        { backgroundColor: theme.colour.bg },
        overlayStyle,
      ]}
    >
      <Animated.View style={markStyle}>
        <Image
          source={theme.name === 'dark' ? darkMark : lightMark}
          style={{ width: MARK, height: MARK }}
          contentFit="contain"
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    position: 'absolute',
    bottom: 64,
    paddingHorizontal: 24,
  },
});
