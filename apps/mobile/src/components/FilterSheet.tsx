import Feather from '@expo/vector-icons/Feather';
import {
  DEPARTMENTS,
  DEPARTMENT_LABEL,
  PRICE_BANDS,
  PRICE_BAND_LABEL,
  SORT_LABEL,
  SORT_OPTIONS,
  sizesForScale,
  type PriceBand,
  type SizeScale,
  type SortOption,
} from '@vastra/shared';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { Platform, Pressable, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDepartments } from '../store/departments';
import { useSizeProfile } from '../store/sizeProfile';
import { useTheme } from '../theme/ThemeProvider';
import { Button } from './Button';
import { Text } from './Text';

export interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  priceBand: PriceBand;
  onPriceBand: (band: PriceBand) => void;
  sort: SortOption;
  onSort: (sort: SortOption) => void;
  /** Result count, so someone can see a filter bite before they commit to it. */
  resultCount: number;
}

const SCALE_LABEL: Record<Exclude<SizeScale, 'one_size'>, string> = {
  apparel: 'Tops & outerwear',
  waist: 'Bottoms',
  shoe: 'Shoes',
};

/**
 * One sheet for every filter, rather than a row of separate popovers.
 *
 * The button count matters less than the decision count: a single surface where
 * everything is visible at once lets someone see how the axes interact, and the
 * live result count means they are never guessing whether a choice emptied the
 * screen.
 */
export function FilterSheet({
  visible,
  onClose,
  priceBand,
  onPriceBand,
  sort,
  onSort,
  resultCount,
}: FilterSheetProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const departments = useDepartments((s) => s.selected);
  const toggleDepartment = useDepartments((s) => s.toggle);
  const clearDepartments = useDepartments((s) => s.clear);

  const profile = useSizeProfile((s) => s.profile);
  const sizesEnabled = useSizeProfile((s) => s.enabled);
  const setSize = useSizeProfile((s) => s.setSize);
  const setSizesEnabled = useSizeProfile((s) => s.setEnabled);
  const clearSizes = useSizeProfile((s) => s.clear);

  if (!visible) return null;

  function tap(action: () => void) {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    action();
  }

  function resetAll() {
    tap(() => {
      clearDepartments();
      clearSizes();
      onPriceBand('any');
      onSort('relevance');
    });
  }

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: theme.duration.fast }}
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: theme.colour.scrim,
        justifyContent: 'flex-end',
        zIndex: 60,
      }}
    >
      <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close filters" />

      <MotiView
        from={{ translateY: 40 }}
        animate={{ translateY: 0 }}
        transition={{ type: 'spring', ...theme.spring.gentle }}
        style={{
          maxHeight: '82%',
          backgroundColor: theme.colour.bg,
          borderTopLeftRadius: theme.radius['2xl'],
          borderTopRightRadius: theme.radius['2xl'],
          paddingTop: theme.space.lg,
          paddingBottom: insets.bottom + theme.space.base,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingHorizontal: theme.space.xl,
            paddingBottom: theme.space.base,
          }}
        >
          <Text variant="title2">Filter</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.lg }}>
            <Pressable onPress={resetAll} hitSlop={10} accessibilityRole="button">
              <Text variant="subhead" colour="tertiary">
                Reset
              </Text>
            </Pressable>
            <Pressable onPress={onClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
              <Feather name="x" size={20} color={theme.colour.textSecondary} />
            </Pressable>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: theme.space.xl, gap: theme.space.lg, paddingBottom: theme.space.base }}
        >
          <Group title="Department">
            <Row>
              <Pill label="All" active={departments.length === 0} onPress={() => tap(clearDepartments)} />
              {DEPARTMENTS.map((department) => (
                <Pill
                  key={department}
                  label={DEPARTMENT_LABEL[department]}
                  active={departments.includes(department)}
                  onPress={() => tap(() => toggleDepartment(department))}
                />
              ))}
            </Row>
          </Group>

          <Group title="Price">
            <Row>
              {PRICE_BANDS.map((band) => (
                <Pill
                  key={band}
                  label={PRICE_BAND_LABEL[band]}
                  active={priceBand === band}
                  onPress={() => tap(() => onPriceBand(band))}
                />
              ))}
            </Row>
          </Group>

          <Group title="Sort">
            <Row>
              {SORT_OPTIONS.map((option) => (
                <Pill
                  key={option}
                  label={SORT_LABEL[option]}
                  active={sort === option}
                  onPress={() => tap(() => onSort(option))}
                />
              ))}
            </Row>
          </Group>

          <View style={{ gap: theme.space.md }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flex: 1 }}>
                <Text variant="overline" colour="tertiary">
                  Only my size
                </Text>
                <Text variant="caption" colour="tertiary" style={{ marginTop: 2 }}>
                  Bags and accessories are never hidden.
                </Text>
              </View>
              <Switch
                value={sizesEnabled}
                onValueChange={(next) => tap(() => setSizesEnabled(next))}
                trackColor={{ true: theme.colour.accent, false: theme.colour.borderStrong }}
                accessibilityLabel="Only show items in my size"
              />
            </View>

            {sizesEnabled &&
              (['apparel', 'waist', 'shoe'] as const).map((scale) => (
                <View key={scale} style={{ gap: theme.space.sm }}>
                  <Text variant="caption" colour="secondary">
                    {SCALE_LABEL[scale]}
                  </Text>
                  <Row>
                    {sizesForScale(scale).map((size) => {
                      const active = profile[scale] === size;
                      return (
                        <Pill
                          key={size}
                          label={size}
                          active={active}
                          // Tapping the selected size clears it, so there is
                          // always a way back to "any" without a second control.
                          onPress={() => tap(() => setSize(scale, active ? undefined : size))}
                        />
                      );
                    })}
                  </Row>
                </View>
              ))}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: theme.space.xl, paddingTop: theme.space.base }}>
          <Button
            label={
              resultCount === 0
                ? 'No matches — adjust filters'
                : `Show ${resultCount} ${resultCount === 1 ? 'piece' : 'pieces'}`
            }
            onPress={onClose}
            disabled={resultCount === 0}
          />
        </View>
      </MotiView>
    </MotiView>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ gap: theme.space.sm }}>
      <Text variant="overline" colour="tertiary">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>{children}</View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <View
        style={{
          height: 36,
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
