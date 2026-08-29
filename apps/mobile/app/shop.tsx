import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Chip } from '../src/components/Chip';
import { GarmentTile } from '../src/components/GarmentTile';
import { Text } from '../src/components/Text';
import { activeFilterCount, applyCatalogueQuery, type PriceBand, type SortOption } from '@vastra/shared';
import { BRANDS, catalogue } from '../src/mock/data';
import { FilterSheet } from '../src/components/FilterSheet';
import { useDepartments } from '../src/store/departments';
import { useActiveSizeProfile } from '../src/store/sizeProfile';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Discover (PROJECT.md F9).
 *
 * The catalogue, filterable by brand. Previously this was a tab; it was removed
 * because it duplicated the Trending row on Today. It comes back as a
 * destination instead — which is what "Shop" and "All" on Today now open.
 */
export default function ShopScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [brand, setBrand] = useState<string | null>(null);

  const departments = useDepartments((s) => s.selected);
  const sizeProfile = useActiveSizeProfile();
  const [priceBand, setPriceBand] = useState<PriceBand>('any');
  const [sort, setSort] = useState<SortOption>('relevance');
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Every axis composes: brand AND department AND price AND size, then sorted.
  // The engine lives in @vastra/shared and is unit-tested there, so this screen
  // holds no ranking logic of its own.
  const query = useMemo(
    () => ({ brand, departments, priceBand, sort, ...(sizeProfile ? { sizeProfile } : {}) }),
    [brand, departments, priceBand, sort, sizeProfile],
  );
  const items = useMemo(() => applyCatalogueQuery(catalogue, query), [query]);
  const filterCount = activeFilterCount(query);

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
          <Text variant="title2">Shop</Text>
          <Text variant="caption" colour="tertiary">
            {items.length} {items.length === 1 ? 'piece' : 'pieces'}
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/search')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Search"
        >
          <Feather name="search" size={20} color={theme.colour.textPrimary} />
        </Pressable>

        <Pressable
          onPress={() => setFiltersOpen(true)}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel={`Filter${filterCount > 0 ? `, ${filterCount} active` : ''}`}
        >
          <View>
            <Feather name="sliders" size={20} color={theme.colour.textPrimary} />
            {/* A count, not just a dot: "something is filtered" is less useful
                than knowing how much is. */}
            {filterCount > 0 && (
              <View
                style={{
                  position: 'absolute',
                  top: -5,
                  right: -7,
                  minWidth: 15,
                  height: 15,
                  paddingHorizontal: 3,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colour.accent,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Text variant="micro" colour="onAccent">
                  {filterCount}
                </Text>
              </View>
            )}
          </View>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ flexGrow: 0, flexShrink: 0, height: 46 }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          gap: theme.space.sm,
          alignItems: 'center',
        }}
      >
        <Chip label="All brands" selected={brand === null} onPress={() => setBrand(null)} />
        {BRANDS.map((value) => (
          <Chip key={value} label={value} selected={brand === value} onPress={() => setBrand(value)} />
        ))}
      </ScrollView>


      <FilterSheet
        visible={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        priceBand={priceBand}
        onPriceBand={setPriceBand}
        sort={sort}
        onSort={setSort}
        resultCount={items.length}
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={theme.layout.gridColumns}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: theme.layout.gridGap }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.base,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.lg,
        }}
        renderItem={({ item, index }) => (
          <GarmentTile item={item} index={index} onPress={() => router.push(`/item/${item.id}`)} />
        )}
      />
    </View>
  );
}
