import Feather from '@expo/vector-icons/Feather';
import { colourWall, daysSinceWorn, forgotten, wearState } from '@vastra/shared';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { GarmentTile } from '../../src/components/GarmentTile';
import { Text } from '../../src/components/Text';
import { COLOUR_SWATCH, wardrobe, type MockItem } from '../../src/mock/data';
import { useWearLog } from '../../src/store/wear';
import { useTheme } from '../../src/theme/ThemeProvider';

type WardrobeView = 'colour' | 'forgotten';

/** Readable names for the colour bands. The enum is lower case for storage. */
const COLOUR_NAME: Record<string, string> = {
  black: 'Black',
  grey: 'Grey',
  white: 'White',
  beige: 'Beige',
  brown: 'Brown',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  blue: 'Blue',
  purple: 'Purple',
  pink: 'Pink',
  multi: 'Multi',
  other: 'Other',
};

/**
 * Your wardrobe — now a place, not a button.
 *
 * It used to live behind a small grid icon in the Studio header, which is a
 * strange thing to do to the screen an app named *cloth* exists to show you.
 *
 * Two views, deliberately, rather than a filter bar with six axes:
 *
 * **Colour** is how people actually reach for clothes. Nobody thinks "I need a
 * mid-weight cotton top", they think "something navy". Grouping by colour also
 * scales: at 150 garments a flat grid is a wall of noise, while colour bands
 * stay navigable because you always know which band you are looking for.
 *
 * **Forgotten** is the product's whole argument made visible. Everything else
 * here shows you what you own; this shows you what you own *and never wear*,
 * which is the only thing the app can tell you that you did not already know.
 */
export default function WardrobeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const log = useWearLog();

  const [view, setView] = useState<WardrobeView>('colour');

  const owned = useMemo(() => wardrobe.filter((item) => item.owned), []);
  const bands = useMemo(() => colourWall(owned), [owned]);
  const neglected = useMemo(() => forgotten(owned, log), [owned, log]);
  const hasHistory = useMemo(() => Object.keys(log).length > 0, [log]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.lg,
          paddingBottom: theme.space.base,
          flexDirection: 'row',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
        }}
      >
        <View>
          <Text variant="title1">Wardrobe</Text>
          <Text variant="footnote" colour="tertiary" style={{ marginTop: theme.space.xs }}>
            {owned.length} {owned.length === 1 ? 'piece' : 'pieces'}
            {/* Before anything has been logged, every garment is technically
                "unworn" — reporting that on day one is alarming and tells the
                user nothing. The count appears once there is history to
                compare against. */}
            {hasHistory && neglected.length > 0
              ? ` · ${neglected.length} needing a wear`
              : ''}
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
              width: 38,
              height: 38,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colour.actionPrimary,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="plus" size={17} color={theme.colour.textOnAction} />
          </View>
        </Pressable>
      </View>

      {/* Two words, not a filter bar. Every extra control here is a decision
          asked of someone who only wanted to look at their clothes. */}
      <View
        style={{
          flexDirection: 'row',
          gap: theme.space.sm,
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: theme.space.base,
        }}
      >
        <ViewTab label="By colour" active={view === 'colour'} onPress={() => setView('colour')} />
        <ViewTab
          label="Forgotten"
          count={neglected.length}
          active={view === 'forgotten'}
          onPress={() => setView('forgotten')}
        />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: theme.space['4xl'],
          gap: theme.space.xl,
        }}
      >
        {owned.length === 0 ? (
          <Empty onAdd={() => router.push('/add')} />
        ) : view === 'colour' ? (
          bands.map((band) => (
            <View key={band.colour} style={{ gap: theme.space.sm }}>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space.sm,
                  paddingHorizontal: theme.layout.gutter,
                }}
              >
                {/* The swatch does the work the label cannot: you find the band
                    you want by colour, at a glance, without reading. */}
                <View
                  style={{
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: COLOUR_SWATCH[band.colour],
                    borderWidth: theme.borderWidth.hairline,
                    borderColor: theme.colour.borderStrong,
                  }}
                />
                <Text variant="overline" colour="tertiary">
                  {COLOUR_NAME[band.colour] ?? band.colour} · {band.items.length}
                </Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                // Without flexGrow:0 a horizontal list stretches into whatever
                // vertical space it is given — a bug already fixed twice here.
                style={{ flexGrow: 0 }}
                contentContainerStyle={{
                  paddingHorizontal: theme.layout.gutter,
                  gap: theme.space.base,
                }}
              >
                {band.items.map((item, index) => (
                  <View key={item.id} style={{ width: 104 }}>
                    <GarmentTile
                      item={item}
                      index={index}
                      subtitle={wearSubtitle(item, log)}
                      onPress={() => router.push(`/item/${item.id}`)}
                    />
                  </View>
                ))}
              </ScrollView>
            </View>
          ))
        ) : neglected.length === 0 ? (
          <View style={{ alignItems: 'center', paddingTop: theme.space['4xl'], gap: theme.space.sm }}>
            <Feather name="check-circle" size={26} color={theme.colour.textTertiary} />
            <Text variant="title2" align="center">
              Nothing forgotten
            </Text>
            <Text variant="footnote" colour="tertiary" align="center" style={{ maxWidth: 270 }}>
              You have worn everything here recently. That is genuinely unusual.
            </Text>
          </View>
        ) : (
          <View
            style={{
              flexDirection: 'row',
              flexWrap: 'wrap',
              gap: theme.space.base,
              paddingHorizontal: theme.layout.gutter,
            }}
          >
            {neglected.map((item, index) => (
              <MotiView
                key={item.id}
                from={{ opacity: 0, translateY: 8 }}
                animate={{ opacity: 1, translateY: 0 }}
                transition={{ type: 'timing', duration: theme.duration.base, delay: Math.min(index, 8) * 35 }}
                style={{ width: '48%' }}
              >
                <GarmentTile
                  item={item}
                  subtitle={describeNeglect(item, log)}
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              </MotiView>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

/** Plain language, never a raw date. "Not worn since April" is a fact someone
 *  can act on; "2026-04-11" is a database row. */
function describeNeglect(item: MockItem, log: ReturnType<typeof useWearLog>): string {
  if (wearState(log, item.id) === 'never') return 'Never worn';
  const days = daysSinceWorn(log, item.id);
  if (days === null) return 'Never worn';
  if (days >= 365) return 'Not worn in over a year';
  const months = Math.floor(days / 30);
  return months >= 2 ? `Not worn in ${months} months` : `Not worn in ${days} days`;
}

/** Short enough for a 104pt tile. The colour view is about scanning, so the
 *  line under each garment must not wrap. */
function wearSubtitle(item: MockItem, log: ReturnType<typeof useWearLog>): string {
  const days = daysSinceWorn(log, item.id);
  if (days === null) return 'Not worn yet';
  if (days === 0) return 'Worn today';
  if (days === 1) return 'Worn yesterday';
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

function ViewTab({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count?: number;
  active: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          height: 34,
          paddingHorizontal: theme.space.base,
          borderRadius: theme.radius.full,
          backgroundColor: active ? theme.colour.actionPrimary : 'transparent',
          borderWidth: active ? 0 : theme.borderWidth.hairline,
          borderColor: theme.colour.border,
        }}
      >
        <Text variant="subhead" colour={active ? 'onAction' : 'secondary'}>
          {label}
        </Text>
        {count !== undefined && count > 0 && (
          <Text variant="caption" colour={active ? 'onAction' : 'tertiary'}>
            {count}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function Empty({ onAdd }: { onAdd: () => void }) {
  const theme = useTheme();
  return (
    <View style={{ alignItems: 'center', paddingTop: theme.space['4xl'], gap: theme.space.md, paddingHorizontal: theme.layout.gutter }}>
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
        <Feather name="grid" size={24} color={theme.colour.textTertiary} />
      </View>
      <Text variant="title2" align="center">
        Nothing in here yet
      </Text>
      <Text variant="callout" colour="tertiary" align="center" style={{ maxWidth: 280 }}>
        Add the ten things you wear most. That is enough for Vastra to be useful — you do not have
        to catalogue everything.
      </Text>
      <View style={{ paddingTop: theme.space.sm, width: 220 }}>
        <Button label="Add your first piece" onPress={onAdd} />
      </View>
    </View>
  );
}
