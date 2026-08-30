import Feather from '@expo/vector-icons/Feather';
import { matchesDepartments } from '@vastra/shared';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DepartmentFilter } from '../../src/components/DepartmentFilter';
import { GarmentTile } from '../../src/components/GarmentTile';
import { Text } from '../../src/components/Text';
import { brandMoments, catalogue, type MockItem } from '../../src/mock/data';
import { useDepartments } from '../../src/store/departments';
import { useTheme } from '../../src/theme/ThemeProvider';

/** Brand names are display strings; slugs are what a URL can carry. Derived
 *  rather than stored on every item, so adding a brand needs no second edit. */
function slugify(brand: string): string {
  return brand.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Everything one brand sells.
 *
 * This is where a brand card on Today actually goes. Until now every one of them
 * opened the same generic Shop screen, which made the whole "From brands" row
 * decorative — you could look at a brand and then not reach it.
 */
export default function BrandScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const selected = useDepartments((s) => s.selected);

  const moment = brandMoments.find((m) => m.slug === slug) ?? null;
  // The brand may have a catalogue presence without a promoted moment, so the
  // name is resolved from the items too rather than only from the placement.
  const brandName =
    moment?.brand ?? catalogue.find((i) => i.brand && slugify(i.brand) === slug)?.brand ?? null;

  const items = useMemo(
    () =>
      catalogue.filter(
        (item): item is MockItem =>
          item.brand !== null &&
          slugify(item.brand) === slug &&
          matchesDepartments(item, selected),
      ),
    [slug, selected],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.base,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title2" numberOfLines={1}>
            {brandName ?? 'Brand'}
          </Text>
          {!!moment?.sponsored && (
            // Disclosed on the destination as well as the placement. Someone who
            // arrives here from a paid card should not lose that context.
            <Text variant="caption" colour="tertiary">
              Paid partnership
            </Text>
          )}
        </View>
      </View>

      {!!moment && (
        <View style={{ paddingHorizontal: theme.layout.gutter, paddingBottom: theme.space.base }}>
          <Text variant="headline">{moment.headline}</Text>
          <Text variant="footnote" colour="secondary" style={{ marginTop: theme.space.xs }}>
            {moment.detail}
          </Text>
        </View>
      )}

      <DepartmentFilter />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.layout.gutter,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.base,
        }}
      >
        {items.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: theme.space['4xl'], gap: theme.space.sm }}>
            <Text variant="headline" align="center">
              Nothing here yet
            </Text>
            <Text variant="footnote" colour="tertiary" align="center" style={{ maxWidth: 260 }}>
              {selected.length > 0
                ? 'No pieces from this brand match your departments. Try All.'
                : 'This brand has no pieces in the catalogue yet.'}
            </Text>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.base }}>
            {items.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 10 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: theme.duration.base, delay: index * 40 }}
                // Two up, accounting for the gap between them.
                style={{ width: '48%' }}
              >
                <GarmentTile item={item} onPress={() => router.push(`/item/${item.id}`)} />
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

