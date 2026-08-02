import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { View } from 'react-native';
import darkMark from '../../assets/splash-icon-dark.png';
import lightMark from '../../assets/splash-icon.png';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

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
 * The branded loading state.
 *
 * Continues the native splash rather than replacing it: same mark, same
 * background, so the handover is invisible. The user should not be able to tell
 * where the operating system stopped and the app started.
 *
 * The mark is an image, not text, because this renders before the fonts do.
 */
export function LoadingScreen({ message }: LoadingScreenProps) {
  const theme = useTheme();

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colour.bg,
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.space.xl,
      }}
    >
      <MotiView
        from={{ opacity: 0, scale: 0.94 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: theme.duration.slow }}
      >
        <Image
          source={theme.name === 'dark' ? darkMark : lightMark}
          style={{ width: 76, height: 76 }}
          contentFit="contain"
        />
      </MotiView>

      {/*
        A breathing rule, not a spinner. A spinner says "this might fail";
        a slow pulse says "this is working".

        Animated with `scaleX`, never `width`. Width is a layout property, and
        driving one from an infinite Reanimated loop forces layout recalculation
        on the UI thread — which crashes the host app outright on the New
        Architecture rather than throwing something catchable. Transforms and
        opacity are safe because they never touch layout.
      */}
      <MotiView
        from={{ opacity: 0.25, scaleX: 0.5 }}
        animate={{ opacity: 0.7, scaleX: 1 }}
        transition={{ type: 'timing', duration: 900, loop: true, repeatReverse: true }}
        style={{ width: 56, height: 1, backgroundColor: theme.colour.textTertiary }}
      />

      {!!message && (
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: theme.duration.slow, delay: 400 }}
          style={{ position: 'absolute', bottom: theme.space['5xl'], paddingHorizontal: theme.space.xl }}
        >
          <Text variant="footnote" colour="tertiary" align="center">
            {message}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
