import { Pressable, View } from 'react-native';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  /** Small colour dot, for the colour filter row. */
  swatch?: string;
}

export function Chip({ label, selected = false, onPress, swatch }: ChipProps) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={6}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.xs + 2,
          paddingHorizontal: theme.space.md + 2,
          paddingVertical: theme.space.sm,
          borderRadius: theme.radius.full,
          backgroundColor: selected ? theme.colour.actionPrimary : 'transparent',
          borderWidth: theme.borderWidth.hairline,
          borderColor: selected ? theme.colour.actionPrimary : theme.colour.border,
        }}
      >
        {!!swatch && (
          <View
            style={{
              width: 10,
              height: 10,
              borderRadius: theme.radius.full,
              backgroundColor: swatch,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.borderStrong,
            }}
          />
        )}
        <Text variant="subhead" colour={selected ? 'onAction' : 'secondary'}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
