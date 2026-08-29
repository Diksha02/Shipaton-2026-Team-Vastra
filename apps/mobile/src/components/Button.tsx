import { LinearGradient } from 'expo-linear-gradient';
import { MotiPressable } from 'moti/interactions';
import { useMemo } from 'react';
import { ActivityIndicator, View, type ViewStyle } from 'react-native';
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

  // Only the accent surface is a gradient. A flat saturated block is what made
  // the old amber read as harsh; a short warm→cool travel across the same
  // surface gives it depth without turning a button into decoration. Primary
  // actions stay monochrome — see the note above.
  const gradient = variant === 'accent' ? theme.colour.accentGradient : null;

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
      <Surface
        gradient={gradient}
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
          <ActivityIndicator
            size="small"
            color={variant === 'accent' ? theme.colour.textOnAccent : theme.colour.textOnAction}
          />
        ) : (
          <Text variant="button" colour={palette.fg}>
            {label}
          </Text>
        )}
      </Surface>
    </MotiPressable>
  );
}

/** A View, or a LinearGradient when two stops are supplied. Keeps the layout
 *  style identical either way so the gradient cannot shift the button. */
function Surface({
  gradient,
  style,
  children,
}: {
  gradient: readonly [string, string] | null;
  style: ViewStyle;
  children: React.ReactNode;
}) {
  if (!gradient) return <View style={style}>{children}</View>;
  return (
    <LinearGradient
      colors={[gradient[0], gradient[1]]}
      // Diagonal: a vertical ramp on a pill reads as a bevel, which looks dated.
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}
    >
      {children}
    </LinearGradient>
  );
}
