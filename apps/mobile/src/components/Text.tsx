import type { TextStyleName } from '@vastra/design';
import { Text as RNText, type TextProps as RNTextProps, type TextStyle } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';

type ColourRole =
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'disabled'
  | 'onAction'
  | 'accent'
  | 'onAccent'
  | 'danger';

export interface TextProps extends RNTextProps {
  variant?: TextStyleName;
  colour?: ColourRole;
  align?: TextStyle['textAlign'];
}

/**
 * The only way text is rendered in this app.
 *
 * Font family, size, line height and tracking all come from tokens — a screen
 * cannot set `fontSize` directly, which is what keeps typography consistent
 * across every surface rather than drifting per screen.
 */
export function Text({
  variant = 'body',
  colour = 'primary',
  align,
  style,
  ...rest
}: TextProps) {
  const theme = useTheme();

  const colours: Record<ColourRole, string> = {
    primary: theme.colour.textPrimary,
    secondary: theme.colour.textSecondary,
    tertiary: theme.colour.textTertiary,
    disabled: theme.colour.textDisabled,
    onAction: theme.colour.textOnAction,
    accent: theme.colour.accent,
    onAccent: theme.colour.textOnAccent,
    danger: theme.colour.danger,
  };

  return (
    <RNText
      style={[theme.text[variant] as TextStyle, { color: colours[colour] }, !!align && { textAlign: align }, style]}
      {...rest}
    />
  );
}
