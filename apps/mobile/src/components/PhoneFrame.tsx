import type { ReactNode } from 'react';
import { Platform, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

/**
 * Constrains the app to phone width when running in a desktop browser.
 *
 * Without this, react-navigation's bottom tab bar stretches across a 1400px
 * viewport and mispositions, which makes the web preview a misleading way to
 * review a design that only ever ships to phones. On native this is a
 * pass-through and costs nothing.
 */
export function PhoneFrame({ children }: { children: ReactNode }) {
  const theme = useTheme();

  if (Platform.OS !== 'web') {
    return <>{children}</>;
  }

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: theme.colour.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          flex: 1,
          width: '100%',
          maxWidth: 430, // iPhone 15 Pro Max logical width
          backgroundColor: theme.colour.bg,
          borderLeftWidth: theme.borderWidth.hairline,
          borderRightWidth: theme.borderWidth.hairline,
          borderColor: theme.colour.border,
          overflow: 'hidden',
        }}
      >
        {children}
      </View>
    </View>
  );
}
