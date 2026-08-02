import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface ScreenProps {
  children: ReactNode;
  /** Serif display title. One per screen — the serif is an accent, not a habit. */
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  padded?: boolean;
}

export function Screen({ children, title, subtitle, right, padded = true }: ScreenProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      {!!title && (
        <View
          style={{
            paddingHorizontal: theme.layout.gutter,
            paddingTop: theme.space.lg,
            paddingBottom: theme.space.base,
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: theme.space.base,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="title1">{title}</Text>
            {!!subtitle && (
              <Text variant="footnote" colour="tertiary" style={{ marginTop: theme.space.xs }}>
                {subtitle}
              </Text>
            )}
          </View>
          {right}
        </View>
      )}
      <View style={{ flex: 1, paddingHorizontal: padded ? theme.layout.gutter : 0 }}>
        {children}
      </View>
    </View>
  );
}
