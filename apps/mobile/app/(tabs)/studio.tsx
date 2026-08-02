import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { CategoryStrip } from '../../src/components/CategoryStrip';
import { LayerCarousel } from '../../src/components/LayerCarousel';
import { OutfitStage } from '../../src/components/OutfitStage';
import { Text } from '../../src/components/Text';
import {
  FREE_SLOTS,
  STUDIO_LAYER_LABEL,
  itemsForLayer,
  outfits,
  wardrobe,
} from '../../src/mock/data';
import { useActiveLayer, useFilledCount, useLayer, useOutfitStore } from '../../src/store/outfit';
import { useTheme } from '../../src/theme/ThemeProvider';

/** A quiet text action. Low visual weight on purpose — these sit near the stage
 *  and must never compete with the outfit or the primary button. */
function QuietAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Feather name={icon} size={14} color={theme.colour.textTertiary} />
        <Text variant="subhead" colour="tertiary">
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

/**
 * The garment picker plus the name of whatever is centred.
 *
 * Naming the selection is a small thing that does a lot: it connects the
 * photograph to a word, confirms the tap landed, and gives the row somewhere to
 * resolve. Without it the carousel is just pictures moving.
 */
function Picker() {
  const theme = useTheme();
  const activeLayer = useActiveLayer();
  const selectedId = useLayer(activeLayer);
  const setLayer = useOutfitStore((state) => state.setLayer);

  const items = itemsForLayer(activeLayer);
  const selected = selectedId ? (wardrobe.find((i) => i.id === selectedId) ?? null) : null;

  const onSelect = useCallback(
    (id: string | null) => setLayer(activeLayer, id),
    [activeLayer, setLayer],
  );

  if (items.length === 0) {
    return (
      <View style={{ alignItems: 'center', paddingVertical: theme.space.xl, gap: theme.space.xs }}>
        <Text variant="subhead" colour="tertiary">
          No {STUDIO_LAYER_LABEL[activeLayer].toLowerCase()} yet
        </Text>
        <Text variant="caption" colour="tertiary">
          Add some and they will show up here.
        </Text>
      </View>
    );
  }

  return (
    <View style={{ gap: theme.space.sm }}>
      <MotiView
        key={activeLayer}
        from={{ opacity: 0, translateY: 10 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: theme.duration.fast }}
      >
        <LayerCarousel items={items} selectedId={selectedId} onSelect={onSelect} />
      </MotiView>

      <View style={{ height: 20, alignItems: 'center', justifyContent: 'center' }}>
        <MotiView
          key={selected?.id ?? 'none'}
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: theme.duration.fast }}
        >
          <Text variant="subhead" colour={selected ? 'primary' : 'tertiary'}>
            {selected ? selected.title : `No ${STUDIO_LAYER_LABEL[activeLayer].toLowerCase().replace(/s$/, '')}`}
          </Text>
        </MotiView>
      </View>
    </View>
  );
}

/**
 * Studio — build an outfit from what you own.
 *
 * Deliberately five bands, two of them a single line of text: stage, quiet
 * actions, categories, garments, one primary button. An earlier version stacked
 * six competing bands including a saved-outfits strip, which duplicated the
 * Outfits tab and left the eye nowhere to rest. Removing things was the fix,
 * not restyling them.
 *
 * The screen subscribes to almost nothing. Garment panels, category pills and
 * the picker each hold their own slice, so tapping a shoe redraws the shoe panel
 * and two cards — not the screen.
 */
export default function StudioScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const pieceCount = useFilledCount();
  const shuffle = useOutfitStore((state) => state.shuffle);
  const reset = useOutfitStore((state) => state.reset);

  const slotsFull = outfits.length >= FREE_SLOTS;
  const spacesLeft = Math.max(0, FREE_SLOTS - outfits.length);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.xs,
          paddingBottom: theme.space.sm,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text variant="title2">Studio</Text>

        <Pressable
          onPress={() => router.push('/wardrobe-grid')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="See everything you own"
        >
          <Feather name="grid" size={19} color={theme.colour.textSecondary} />
        </Pressable>
      </View>

      {/* The stage takes every pixel the rest of the screen does not need. */}
      <View style={{ flex: 1, marginHorizontal: theme.layout.gutter }}>
        <OutfitStage />
      </View>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'center',
          alignItems: 'center',
          gap: theme.space.xl,
          paddingVertical: theme.space.md,
        }}
      >
        <QuietAction
          icon="shuffle"
          label="Surprise me"
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            shuffle();
          }}
        />
        <QuietAction
          icon="rotate-ccw"
          label="Start over"
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            reset();
          }}
        />
      </View>

      <CategoryStrip />

      <View style={{ paddingTop: theme.space.md }}>
        <Picker />
      </View>

      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.base,
          paddingBottom: insets.bottom + theme.space.sm,
          gap: theme.space.xs,
        }}
      >
        <Button
          label="Save this outfit"
          disabled={pieceCount < 2}
          onPress={() => {
            if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            if (slotsFull) router.push('/paywall');
          }}
        />
        <Text variant="caption" colour="tertiary" align="center">
          {pieceCount < 2
            ? 'Pick at least two pieces'
            : slotsFull
              ? 'All 5 spaces are full'
              : `${spacesLeft} of ${FREE_SLOTS} spaces left`}
        </Text>
      </View>
    </View>
  );
}
