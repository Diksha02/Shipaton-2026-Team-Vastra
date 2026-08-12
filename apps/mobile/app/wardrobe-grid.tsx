import Feather from '@expo/vector-icons/Feather';
import type { ItemCategory, ItemColour } from '@vastra/shared';
import { useRouter } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Chip } from '../src/components/Chip';
import { GarmentTile } from '../src/components/GarmentTile';
import { Text } from '../src/components/Text';
import { useGoBack } from '../src/hooks/useGoBack';
import { CATEGORY_LABEL, COLOUR_SWATCH, wardrobe, type MockItem } from '../src/mock/data';
import { useTheme } from '../src/theme/ThemeProvider';

/** One wide tile followed by three pairs. Seven items per cycle, so the rhythm
 *  is predictable while scrolling instead of appearing to happen at random. */
const MOSAIC_CYCLE = 7;

/** The colour enum is lower case for storage. Chips are read by people. */
function colourLabel(colour: ItemColour): string {
  return colour.charAt(0).toUpperCase() + colour.slice(1);
}

interface MosaicRow {
  key: string;
  /** The wide row carries exactly one item; a pair row carries one or two. */
  items: Array<{ item: MockItem; index: number }>;
  wide: boolean;
}

/**
 * Lays the filtered inventory out as alternating wide and paired rows.
 *
 * Rows are built up front rather than left to `numColumns`, which can only
 * produce a fixed width. Working in rows also keeps the list virtualised: one
 * row is one cell, whatever it contains.
 */
function toMosaicRows(items: MockItem[]): MosaicRow[] {
  const rows: MosaicRow[] = [];

  for (let i = 0; i < items.length; ) {
    const first = items[i];
    if (!first) break;

    if (i % MOSAIC_CYCLE === 0) {
      rows.push({ key: first.id, items: [{ item: first, index: i }], wide: true });
      i += 1;
      continue;
    }

    const pair = items.slice(i, i + 2).map((item, offset) => ({ item, index: i + offset }));
    rows.push({ key: first.id, items: pair, wide: false });
    i += 2;
  }

  return rows;
}

/**
 * A path for adding a garment, shown before it exists.
 *
 * Rendered disabled rather than tappable: `textDisabled` is the one colour in
 * the scheme that deliberately fails AA, precisely so an unavailable control
 * cannot read as an active one.
 */
function FuturePath({
  icon,
  label,
  hint,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint: string;
}) {
  const theme = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.space.md,
        padding: theme.space.base,
        borderRadius: theme.radius.xl,
        backgroundColor: theme.colour.surfaceMuted,
      }}
    >
      <Feather name={icon} size={18} color={theme.colour.textDisabled} />
      <View style={{ flex: 1, gap: theme.space.hair }}>
        <Text variant="body" colour="disabled">
          {label}
        </Text>
        <Text variant="caption" colour="tertiary">
          {hint}
        </Text>
      </View>
    </View>
  );
}

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
  // Studio is where the Wardrobe pill lives, so it is where this screen belongs
  // when there is no history to return to.
  const goBack = useGoBack('/(tabs)/studio');

  const [category, setCategory] = useState<ItemCategory | null>(null);
  const [colour, setColour] = useState<ItemColour | null>(null);
  const [adding, setAdding] = useState(false);

  const categories = useMemo(
    () => [...new Set(wardrobe.map((item) => item.category))] as ItemCategory[],
    [],
  );

  const colours = useMemo(
    () => [...new Set(wardrobe.map((item) => item.colour))] as ItemColour[],
    [],
  );

  const items = useMemo(
    () =>
      wardrobe.filter(
        (item) =>
          (category === null || item.category === category) &&
          (colour === null || item.colour === colour),
      ),
    [category, colour],
  );

  const rows = useMemo(() => toMosaicRows(items), [items]);

  const filtered = category !== null || colour !== null;
  const clearFilters = () => {
    setCategory(null);
    setColour(null);
  };

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
        <Pressable
          onPress={goBack}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <View style={{ flex: 1, gap: theme.space.hair }}>
          <Text variant="title2">Everything</Text>
          {/* Counts what is on screen. Reporting the whole wardrobe while a
              filter is applied made the header contradict the grid. */}
          <Text variant="caption" colour="tertiary">
            {filtered
              ? `${items.length} of ${wardrobe.length} pieces`
              : `${wardrobe.length} pieces`}
          </Text>
        </View>
      </View>

      {/* Both rows live in a plain wrapper that owns the spacing between them.
          A horizontal ScrollView in a column stretches to fill what is left,
          and two of them competing with the grid squashed each other, so each
          is pinned to its own content height with flexGrow: 0. */}
      <View style={{ gap: theme.space.sm, paddingBottom: theme.space.base }}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: theme.layout.gutter,
            gap: theme.space.sm,
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

        {/* Colour is the second half of F5. The swatch is the label here — a dot
            of the actual colour identifies a garment faster than the word does. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ flexGrow: 0 }}
          contentContainerStyle={{
            paddingHorizontal: theme.layout.gutter,
            gap: theme.space.sm,
          }}
        >
          <Chip label="Any colour" selected={colour === null} onPress={() => setColour(null)} />
          {colours.map((value) => (
            <Chip
              key={value}
              label={colourLabel(value)}
              swatch={COLOUR_SWATCH[value]}
              selected={colour === value}
              onPress={() => setColour(value)}
            />
          ))}
        </ScrollView>
      </View>

      {items.length === 0 ? (
        /* Reachable only now that two filters combine — yellow shoes match
           nothing. An empty grid with no explanation reads as a failure. */
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: theme.duration.base }}
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.space.base,
            paddingHorizontal: theme.space['2xl'],
            paddingBottom: theme.space['4xl'],
          }}
        >
          <Feather name="search" size={22} color={theme.colour.textTertiary} />
          <Text variant="callout" colour="secondary" align="center">
            Nothing in your wardrobe matches those two filters.
          </Text>
          <Button label="Clear filters" variant="secondary" fullWidth={false} onPress={clearFilters} />
        </MotiView>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => row.key}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: theme.layout.gutter,
            paddingBottom: theme.space['6xl'],
            gap: theme.layout.gridGap,
          }}
          renderItem={({ item: row }) =>
            row.wide ? (
              <GarmentTile
                item={row.items[0]!.item}
                index={row.items[0]!.index}
                wide
                onPress={() => router.push(`/item/${row.items[0]!.item.id}`)}
              />
            ) : (
              <View style={{ flexDirection: 'row', gap: theme.layout.gridGap }}>
                {row.items.map(({ item, index }) => (
                  <GarmentTile
                    key={item.id}
                    item={item}
                    index={index}
                    onPress={() => router.push(`/item/${item.id}`)}
                  />
                ))}
                {/* Keeps a lone final garment at column width instead of
                    stretching it across the row. */}
                {row.items.length === 1 && <View style={{ flex: 1 }} />}
              </View>
            )
          }
        />
      )}

      <MotiPressable
        onPress={() => setAdding(true)}
        accessibilityLabel="Add a piece"
        style={{
          position: 'absolute',
          right: theme.layout.gutter,
          bottom: insets.bottom + theme.space.lg,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.sm,
            paddingHorizontal: theme.space.lg,
            minHeight: theme.layout.minTapTarget,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colour.actionPrimary,
            ...theme.shadow.lg,
          }}
        >
          <Feather name="plus" size={16} color={theme.colour.textOnAction} />
          <Text variant="button" colour="onAction">
            Add a piece
          </Text>
        </View>
      </MotiPressable>

      <AnimatePresence>
        {adding && (
          <MotiView
            key="scrim"
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: 'timing', duration: theme.duration.fast }}
            style={{ position: 'absolute', inset: 0 }}
          >
            <Pressable
              onPress={() => setAdding(false)}
              accessibilityRole="button"
              accessibilityLabel="Close"
              style={{ flex: 1, backgroundColor: theme.colour.scrim }}
            />

            <MotiView
              from={{ translateY: 40 }}
              animate={{ translateY: 0 }}
              exit={{ translateY: 40 }}
              transition={{ type: 'timing', duration: theme.duration.base }}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                bottom: 0,
                padding: theme.space.lg,
                paddingBottom: insets.bottom + theme.space.lg,
                gap: theme.space.md,
                borderTopLeftRadius: theme.radius['2xl'],
                borderTopRightRadius: theme.radius['2xl'],
                backgroundColor: theme.colour.surface,
                ...theme.shadow.lg,
              }}
            >
              <Text variant="headline">Add a piece</Text>
              <FuturePath
                icon="camera"
                label="Take a photo"
                hint="Arrives with the camera update."
              />
              <FuturePath
                icon="link"
                label="Paste a product link"
                hint="Arrives with the camera update."
              />
              <Button label="Close" variant="ghost" onPress={() => setAdding(false)} />
            </MotiView>
          </MotiView>
        )}
      </AnimatePresence>
    </View>
  );
}
