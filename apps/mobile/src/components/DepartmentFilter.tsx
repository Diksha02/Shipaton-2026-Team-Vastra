import { DEPARTMENTS, DEPARTMENT_LABEL } from '@vastra/shared';
import * as Haptics from 'expo-haptics';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useDepartments } from '../store/departments';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * Department chips.
 *
 * "All" is a real chip rather than an implied empty state, because a filter row
 * with nothing selected gives no way back to everything except deselecting each
 * chip in turn. It reads as selected precisely when nothing else is.
 */
export function DepartmentFilter() {
  const theme = useTheme();
  const selected = useDepartments((s) => s.selected);
  const toggle = useDepartments((s) => s.toggle);
  const clear = useDepartments((s) => s.clear);

  function tap(action: () => void) {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    action();
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Without this the row stretches into any flex space it is given and the
      // chips drift apart — a bug already fixed once elsewhere in this app.
      style={{ flexGrow: 0 }}
      contentContainerStyle={{
        paddingHorizontal: theme.layout.gutter,
        gap: theme.space.sm,
        alignItems: 'center',
      }}
    >
      <Chip label="All" active={selected.length === 0} onPress={() => tap(clear)} />
      {DEPARTMENTS.map((department) => (
        <Chip
          key={department}
          label={DEPARTMENT_LABEL[department]}
          active={selected.includes(department)}
          onPress={() => tap(() => toggle(department))}
        />
      ))}
    </ScrollView>
  );
}

function Chip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label}${active ? ', selected' : ''}`}
    >
      <View
        style={{
          height: 34,
          paddingHorizontal: theme.space.base,
          borderRadius: theme.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? theme.colour.actionPrimary : 'transparent',
          borderWidth: active ? 0 : theme.borderWidth.hairline,
          borderColor: theme.colour.border,
        }}
      >
        <Text variant="subhead" colour={active ? 'onAction' : 'secondary'}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
