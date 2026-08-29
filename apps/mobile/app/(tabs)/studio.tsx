import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { SaveOutfitSheet } from '../../src/components/SaveOutfitSheet';
import { CategoryStrip } from '../../src/components/CategoryStrip';
import { LayerCarousel } from '../../src/components/LayerCarousel';
import { OutfitStage } from '../../src/components/OutfitStage';
import { Text } from '../../src/components/Text';
import {
  STUDIO_LAYER_LABEL,
  itemsForLayer,
  wardrobe,
} from '../../src/mock/data';
import { PLACEMENTS } from '../../src/purchases/config';
import { useOpenPaywall } from '../../src/purchases/usePaywall';
import { useIsPro } from '../../src/store/entitlements';
import { useSavedOutfits, useSpaces } from '../../src/store/savedOutfits';
import { useWear } from '../../src/store/wear';
import { useOnboardingStore } from '../../src/store/onboarding';
import { useActiveLayer, useFilledCount, useLayer, useOutfitStore } from '../../src/store/outfit';
import { useTheme } from '../../src/theme/ThemeProvider';

/** A round header control. Uniform size and hit area across all three, so the
 *  row reads as one set rather than three ad-hoc buttons. */
function HeaderButton({
  icon,
  label,
  onPress,
  filled = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  filled?: boolean;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={8} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: theme.radius.full,
          backgroundColor: filled ? theme.colour.actionPrimary : 'transparent',
          borderWidth: filled ? 0 : theme.borderWidth.hairline,
          borderColor: theme.colour.border,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather
          name={icon}
          size={16}
          color={filled ? theme.colour.textOnAction : theme.colour.textSecondary}
        />
      </View>
    </Pressable>
  );
}

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
  const replayGuide = useOnboardingStore((s) => s.replay);
  const openPaywall = useOpenPaywall();

  const pieceCount = useFilledCount();
  const shuffle = useOutfitStore((state) => state.shuffle);
  const reset = useOutfitStore((state) => state.reset);
  const markWorn = useWear((s) => s.markWorn);

  const isPro = useIsPro();
  const spaces = useSpaces(isPro);
  const saveOutfit = useSavedOutfits((s) => s.save);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // A name you would actually have chosen, so the fast path is one tap.
  const suggestion = new Date().toLocaleDateString('en-GB', { weekday: 'long' });

  function handleSavePress() {
    if (pieceCount < 2) return;
    // The paywall appears at exactly one moment: when there is no space left.
    if (spaces.full) {
      void openPaywall(PLACEMENTS.outfitLimit);
      return;
    }
    setSheetOpen(true);
  }

  function handleSaveConfirm(name: string) {
    const result = saveOutfit(useOutfitStore.getState().layers, name, isPro);
    setSheetOpen(false);
    if (result.ok) {
      setToast(
        result.slot === 'single_use'
          ? `Saved "${result.outfit.name}" · ${result.creditsLeft} single-use left`
          : `Saved "${result.outfit.name}"`,
      );
      setTimeout(() => setToast(null), 2200);
    } else if (result.reason === 'no_space') {
      void openPaywall(PLACEMENTS.outfitLimit);
    }
  }

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

        <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
          <HeaderButton
            icon="help-circle"
            label="How this works"
            onPress={() => {
              if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              replayGuide();
            }}
          />
          <HeaderButton
            icon="grid"
            label="See everything you own"
            onPress={() => router.push('/wardrobe-grid')}
          />
          {/* Adding a piece is the app's primary action, and belongs on every
              screen where you might notice something missing. */}
          <HeaderButton
            icon="plus"
            label="Add a piece"
            filled
            onPress={() => {
              if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/add');
            }}
          />
        </View>
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
        {/* One tap logs the whole outfit. Asking someone to log garments one at
            a time is asking them to do data entry, and nobody does data entry
            twice — which would leave Forgotten permanently wrong. */}
        <QuietAction
          icon="check"
          label="Wore this"
          onPress={() => {
            if (Platform.OS !== 'web') {
              void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            const layers = useOutfitStore.getState().layers;
            const ids = Object.values(layers).filter((id): id is string => Boolean(id));
            if (ids.length === 0) return;
            markWorn(ids);
            setToast(`Logged ${ids.length} ${ids.length === 1 ? 'piece' : 'pieces'}`);
            setTimeout(() => setToast(null), 1800);
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
          label={spaces.full ? 'Get more space' : 'Save this outfit'}
          disabled={pieceCount < 2}
          onPress={handleSavePress}
        />
        <Text variant="caption" colour="tertiary" align="center">
          {pieceCount < 2
            ? 'Pick at least two pieces'
            : spaces.unlimited
              ? 'Unlimited spaces with Pro'
              : spaces.full
                ? 'No spaces left'
                : spaces.nextSlot === 'reusable'
                  ? 'Goes in your permanent space'
                  : `${spaces.creditsLeft} single-use ${spaces.creditsLeft === 1 ? 'save' : 'saves'} left`}
        </Text>
      </View>

      <SaveOutfitSheet
        visible={sheetOpen}
        suggestion={suggestion}
        nextSlot={spaces.nextSlot}
        creditsLeft={spaces.creditsLeft}
        unlimited={spaces.unlimited}
        onCancel={() => setSheetOpen(false)}
        onSave={handleSaveConfirm}
      />

      {/* Confirmation, not celebration. It says the thing happened and gets
          out of the way. */}
      {!!toast && (
        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          style={{
            position: 'absolute',
            left: theme.layout.gutter,
            right: theme.layout.gutter,
            bottom: insets.bottom + 90,
            paddingVertical: theme.space.md,
            paddingHorizontal: theme.space.base,
            borderRadius: theme.radius.full,
            backgroundColor: theme.colour.actionPrimary,
            alignItems: 'center',
          }}
          pointerEvents="none"
        >
          <Text variant="subhead" colour="onAction">
            {toast}
          </Text>
        </MotiView>
      )}
    </View>
  );
}
