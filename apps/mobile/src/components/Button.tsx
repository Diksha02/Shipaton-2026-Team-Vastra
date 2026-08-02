import { MotiPressable } from 'moti/interactions';
import { useMemo } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'accent' | 'danger';

export interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

/**
 * `accent` is deliberately not the default and is not used for ordinary
 * actions. Colour in this app means premium — see the design notes in
 * DECISIONS.md. Primary actions are monochrome.
 */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  fullWidth = true,
}: ButtonProps) {
  const theme = useTheme();

  const palette = {
    primary: { bg: theme.colour.actionPrimary, fg: 'onAction' as const, border: 'transparent' },
    secondary: { bg: theme.colour.surface, fg: 'primary' as const, border: theme.colour.borderStrong },
    ghost: { bg: 'transparent', fg: 'secondary' as const, border: 'transparent' },
    accent: { bg: theme.colour.accent, fg: 'onAccent' as const, border: 'transparent' },
    danger: { bg: theme.colour.danger, fg: 'onAction' as const, border: 'transparent' },
  }[variant];

  const inactive = disabled || loading;

  const animate = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        'worklet';
        // Scale rather than opacity: an opacity dip on a dark button reads as
        // the button breaking, whereas a slight compression reads as physical.
        return { scale: pressed ? 0.975 : 1 };
      },
    [],
  );

  return (
    <MotiPressable
      onPress={inactive ? undefined : onPress}
      animate={animate}
      transition={{ type: 'timing', duration: theme.duration.instant }}
      style={{ width: fullWidth ? '100%' : undefined, opacity: inactive ? 0.45 : 1 }}
    >
      <View
        style={{
          backgroundColor: palette.bg,
          borderColor: palette.border,
          borderWidth: variant === 'secondary' ? theme.borderWidth.hairline : 0,
          borderRadius: theme.radius.full,
          minHeight: theme.layout.minTapTarget + 6,
          paddingHorizontal: theme.space.xl,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          gap: theme.space.sm,
        }}
      >
        {loading ? (
          <ActivityIndicator size="small" color={theme.colour.textOnAction} />
        ) : (
          <Text variant="button" colour={palette.fg}>
            {label}
          </Text>
        )}
      </View>
    </MotiPressable>
  );
}
