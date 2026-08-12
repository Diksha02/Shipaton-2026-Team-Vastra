import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { AnimatePresence, MotiView } from 'moti';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { CategoryStrip } from '../../src/components/CategoryStrip';
import { LayerCarousel } from '../../src/components/LayerCarousel';
import { OutfitStage } from '../../src/components/OutfitStage';
import { Text } from '../../src/components/Text';
import { FREE_SLOTS, STUDIO_LAYER_LABEL, itemsForLayer, wardrobe } from '../../src/mock/data';
import {
  MIN_PIECES,
  useActiveLayer,
  useFilledCount,
  useLayer,
  useOutfitStore,
  useSlotsLeft,
} from '../../src/store/outfit';
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
    <Pressable onPress={onPress} hitSlop={12} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.xs + 2,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.sm,
            borderRadius: theme.radius.full,
            backgroundColor: pressed ? theme.colour.surfaceMuted : 'transparent',
          }}
        >
          <Feather name={icon} size={14} color={theme.colour.textTertiary} />
          <Text variant="subhead" colour="tertiary">
            {label}
          </Text>
        </View>
      )}
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
  const saveCurrent = useOutfitStore((state) => state.saveCurrent);
  const slotsLeft = useSlotsLeft();

  const slotsFull = slotsLeft === 0;
  const enoughPieces = pieceCount >= MIN_PIECES;

  // Confirmation lives here rather than on the Outfits tab: the tap happened on
  // this screen, so this is where the acknowledgement belongs.
  const [justSaved, setJustSaved] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
    },
    [],
  );

  const onSave = useCallback(() => {
    if (slotsFull) {
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      router.push('/paywall');
      return;
    }

    if (saveCurrent() !== 'saved') return;

    if (Platform.OS !== 'web') void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // The stage keeps wearing the outfit — a save should not look like a reset.
    setJustSaved(true);
    if (confirmTimer.current) clearTimeout(confirmTimer.current);
    confirmTimer.current = setTimeout(() => setJustSaved(false), 1600);

    router.push('/(tabs)/outfits');
  }, [router, saveCurrent, slotsFull]);

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.sm,
          paddingBottom: theme.space.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: theme.space.base,
        }}
      >
        <View style={{ flex: 1 }}>
          <Text variant="title2">Studio</Text>
          <Text variant="caption" colour="tertiary">
            {pieceCount === 0
              ? 'Nothing on the figure yet'
              : `${pieceCount} ${pieceCount === 1 ? 'piece' : 'pieces'} on the figure`}
          </Text>
        </View>

        {/* Labelled: an unlabelled grid glyph tested as "some kind of settings". */}
        <Pressable
          onPress={() => router.push('/wardrobe-grid')}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Wardrobe, see everything you own"
        >
          {({ pressed }) => (
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.sm,
                paddingHorizontal: theme.space.md,
                paddingVertical: theme.space.sm,
                borderRadius: theme.radius.full,
                borderWidth: theme.borderWidth.hairline,
                borderColor: theme.colour.border,
                backgroundColor: pressed ? theme.colour.surfacePressed : theme.colour.surface,
              }}
            >
              <Feather name="grid" size={15} color={theme.colour.textSecondary} />
              <Text variant="subhead" colour="secondary">
                Wardrobe
              </Text>
            </View>
          )}
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
          gap: theme.space.lg,
          paddingVertical: theme.space.sm,
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
          paddingBottom: insets.bottom + theme.space.md,
          gap: theme.space.sm,
        }}
      >
        <Button
          label={slotsFull ? 'Get more slots' : 'Save this outfit'}
          disabled={!enoughPieces}
          onPress={onSave}
        />

        {/* Fixed height so the caption swapping never nudges the button. */}
        <View style={{ height: 18, alignItems: 'center', justifyContent: 'center' }}>
          <AnimatePresence exitBeforeEnter>
            {justSaved ? (
              <MotiView
                key="saved"
                from={{ opacity: 0, translateY: 4 }}
                animate={{ opacity: 1, translateY: 0 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: theme.duration.fast }}
                style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.xs }}
              >
                <Feather name="check" size={12} color={theme.colour.textSecondary} />
                <Text variant="caption" colour="secondary">
                  Saved to your outfits
                </Text>
              </MotiView>
            ) : (
              <MotiView
                key="hint"
                from={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ type: 'timing', duration: theme.duration.fast }}
              >
                <Text variant="caption" colour="tertiary" align="center">
                  {!enoughPieces
                    ? 'Pick at least two pieces'
                    : slotsFull
                      ? `All ${FREE_SLOTS} slots are full`
                      : `${slotsLeft} of ${FREE_SLOTS} slots left`}
                </Text>
              </MotiView>
            )}
          </AnimatePresence>
        </View>
      </View>
    </View>
  );
}
