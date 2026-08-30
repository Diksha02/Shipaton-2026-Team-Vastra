import Feather from '@expo/vector-icons/Feather';
import type { ItemCategory } from '@vastra/shared';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { GarmentTile } from '../src/components/GarmentTile';
import { Text } from '../src/components/Text';
import { CATEGORY_LABEL, wardrobe } from '../src/mock/data';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * The full inventory, as a grid.
 *
 * Secondary to the Studio by design: browsing everything you own is an
 * occasional need (auditing, correcting a bad tag), whereas building an outfit
 * is the daily one. The daily job gets the tab.
 */
export default function WardrobeGridScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<ItemCategory | null>(null);

  const categories = useMemo(
    () => [...new Set(wardrobe.map((item) => item.category))] as ItemCategory[],
    [],
  );

  const items = useMemo(
    () => (category ? wardrobe.filter((item) => item.category === category) : wardrobe),
    [category],
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
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title2">Everything</Text>
          <Text variant="caption" colour="tertiary">
            {wardrobe.length} pieces
          </Text>
        </View>
        <Pressable
          onPress={() => router.push('/add')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Add a piece"
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colour.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="plus" size={18} color={theme.colour.textOnAction} />
          </View>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          gap: theme.space.sm,
          paddingBottom: theme.space.base,
        }}
      >
        <Chip label="All" selected={category === null} onPress={() => setCategory(null)} />
        {categories.map((value) => (
          <Chip
            key={value}
            label={CATEGORY_LABEL[value]}
            selected={category === value}
            onPress={() => setCategory(value)}
          />
        ))}
      </ScrollView>

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        numColumns={theme.layout.gridColumns}
        showsVerticalScrollIndicator={false}
        columnWrapperStyle={{ gap: theme.layout.gridGap }}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.lg,
        }}
        renderItem={({ item, index }) => (
          <GarmentTile item={item} index={index} onPress={() => router.push(`/item/${item.id}`)} />
        )}
        ListEmptyComponent={
          <EmptyWardrobe
            filtered={category !== null}
            onAdd={() => router.push('/add')}
            onClear={() => setCategory(null)}
          />
        }
      />
    </View>
  );
}

/**
 * The empty state.
 *
 * It teaches rather than reports. "Nothing here" tells someone what they can
 * already see; the useful version says what to do next and gives them the
 * control to do it. Filtering to nothing is a different problem from owning
 * nothing, so it gets a different answer.
 */
function EmptyWardrobe({
  filtered,
  onAdd,
  onClear,
}: {
  filtered: boolean;
  onAdd: () => void;
  onClear: () => void;
}) {
  const theme = useTheme();

  return (
    <View style={{ alignItems: 'center', paddingTop: theme.space['4xl'], gap: theme.space.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: theme.radius.full,
          backgroundColor: theme.colour.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name={filtered ? 'filter' : 'camera'}
          size={24}
          color={theme.colour.textTertiary}
        />
      </View>

      <Text variant="title2" align="center">
        {filtered ? 'Nothing in this category' : 'Your wardrobe is empty'}
      </Text>
      <Text variant="callout" colour="tertiary" align="center" style={{ maxWidth: 260 }}>
        {filtered
          ? 'You own things, just not in this one yet.'
          : 'Photograph a few pieces to start. Most people add ten in a couple of minutes.'}
      </Text>

      <View style={{ paddingTop: theme.space.sm, width: 220 }}>
        <Button
          label={filtered ? 'Show everything' : 'Add your first piece'}
          onPress={filtered ? onClear : onAdd}
        />
      </View>
    </View>
  );
}
