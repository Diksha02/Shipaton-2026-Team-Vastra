import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Text } from '../../src/components/Text';
import {
  COLOUR_SWATCH,
  STUDIO_LAYERS,
  wardrobe,
  type StudioLayer,
} from '../../src/mock/data';
import { PLACEMENTS } from '../../src/purchases/config';
import { useOpenPaywall } from '../../src/purchases/usePaywall';
import { useIsPro } from '../../src/store/entitlements';
import { useOutfitStore } from '../../src/store/outfit';
import { useSavedOutfits, useSpaces, type SavedOutfit } from '../../src/store/savedOutfits';
import { useTheme } from '../../src/theme/ThemeProvider';

/** The colours of an outfit, in the order they sit on the body. Enough to
 *  recognise a look at a glance without rendering the whole figure. */
function ColourStrip({ outfit }: { outfit: SavedOutfit }) {
  const theme = useTheme();

  const colours = STUDIO_LAYERS.map((layer: StudioLayer) => {
    const id = outfit.layers[layer];
    if (!id) return null;
    const item = wardrobe.find((candidate) => candidate.id === id);
    return item ? COLOUR_SWATCH[item.colour] : null;
  }).filter((c): c is string => c !== null);

  return (
    <View style={{ flexDirection: 'row', height: 96, gap: 2 }}>
      {colours.map((colour, index) => (
        <View
          key={index}
          style={{
            flex: 1,
            backgroundColor: colour,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
            borderRadius: theme.radius.sm,
          }}
        />
      ))}
    </View>
  );
}

function OutfitCard({ outfit, onWear, onDelete }: {
  outfit: SavedOutfit;
  onWear: () => void;
  onDelete: () => void;
}) {
  const theme = useTheme();

  const pieces = STUDIO_LAYERS.filter((layer: StudioLayer) => outfit.layers[layer]).length;
  const saved = new Date(outfit.savedAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base }}
    >
      <View
        style={{
          borderRadius: theme.radius.xl,
          borderWidth: theme.borderWidth.hairline,
          borderColor: theme.colour.border,
          backgroundColor: theme.colour.surface,
          overflow: 'hidden',
        }}
      >
        <View style={{ padding: theme.space.md, paddingBottom: 0 }}>
          <ColourStrip outfit={outfit} />
        </View>

        <View
          style={{
            padding: theme.space.base,
            flexDirection: 'row',
            alignItems: 'center',
            gap: theme.space.md,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text variant="headline" numberOfLines={1}>
              {outfit.name}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              {/* Which kind of space this sits in, on the card itself. Someone
                  deciding what to delete needs to know before they tap, not
                  after. */}
              <Feather
                name={outfit.slot === 'reusable' ? 'refresh-cw' : 'zap'}
                size={10}
                color={theme.colour.textTertiary}
              />
              <Text variant="caption" colour="tertiary">
                {outfit.slot === 'reusable' ? 'Permanent' : 'Single-use'} · {pieces} pieces · {saved}
              </Text>
            </View>
          </View>

          <Pressable onPress={onWear} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open in Studio">
            <View
              style={{
                paddingHorizontal: theme.space.base,
                height: 36,
                borderRadius: theme.radius.full,
                borderWidth: theme.borderWidth.hairline,
                borderColor: theme.colour.borderStrong,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text variant="subhead">Wear</Text>
            </View>
          </Pressable>

          {/* Deleting is always available. The scarcity mechanic is the number
              of spaces, never the ability to remove your own data (§4). */}
          <Pressable onPress={onDelete} hitSlop={10} accessibilityRole="button" accessibilityLabel={`Delete ${outfit.name}`}>
            <Feather name="trash-2" size={17} color={theme.colour.textTertiary} />
          </Pressable>
        </View>
      </View>
    </MotiView>
  );
}

export default function OutfitsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const openPaywall = useOpenPaywall();

  const isPro = useIsPro();
  const outfits = useSavedOutfits((s) => s.outfits);
  const remove = useSavedOutfits((s) => s.remove);
  const spaces = useSpaces(isPro);
  const [toast, setToast] = useState<string | null>(null);

  function wear(outfit: SavedOutfit) {
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Load it back into the Studio rather than opening a read-only view — the
    // most common thing to do with a saved outfit is make a variation of it.
    for (const layer of STUDIO_LAYERS) {
      useOutfitStore.getState().setLayer(layer, outfit.layers[layer] ?? null);
    }
    router.push('/(tabs)/studio');
  }

  function confirmDelete(outfit: SavedOutfit) {
    // Deleting is never blocked or priced (§4). What changes between the two
    // kinds is only what the user should *expect* afterwards, so the copy is
    // honest about it in both directions.
    const consequence =
      outfit.slot === 'reusable'
        ? 'This frees up your permanent space, ready to use again.'
        : 'This was a single-use save, so the space will not come back.';

    Alert.alert('Delete this outfit?', `"${outfit.name}" will be removed. ${consequence}`, [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          remove(outfit.id);
          setToast(outfit.slot === 'reusable' ? 'Deleted · space free again' : 'Outfit deleted');
          setTimeout(() => setToast(null), 1800);
        },
      },
    ]);
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.lg,
          paddingBottom: theme.space.base,
        }}
      >
        <Text variant="title1">Outfits</Text>
        <Text variant="footnote" colour="tertiary" style={{ marginTop: theme.space.xs }}>
          {spaces.unlimited
            ? `${outfits.length} saved · unlimited spaces`
            : `${spaces.reusableUsed}/${spaces.reusableSlots} permanent · ${spaces.creditsLeft} single-use left`}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.base,
        }}
      >
        {outfits.length === 0 ? (
          <EmptyOutfits onBuild={() => router.push('/(tabs)/studio')} />
        ) : (
          <>
            {outfits.map((outfit) => (
              <OutfitCard
                key={outfit.id}
                outfit={outfit}
                onWear={() => wear(outfit)}
                onDelete={() => confirmDelete(outfit)}
              />
            ))}

            {spaces.full && (
              <View
                style={{
                  padding: theme.space.base,
                  borderRadius: theme.radius.lg,
                  backgroundColor: theme.colour.accentSubtle,
                  borderWidth: theme.borderWidth.hairline,
                  borderColor: theme.colour.accentBorder,
                  gap: theme.space.md,
                }}
              >
                <Text variant="footnote" colour="secondary">
                  No spaces left. Deleting a permanent one frees it up again — or get unlimited
                  spaces with Pro.
                </Text>
                <Button label="Get unlimited spaces" variant="accent" onPress={() => void openPaywall(PLACEMENTS.outfitLimit)} />
              </View>
            )}
          </>
        )}
      </ScrollView>

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

/** Teaches rather than reports: says what to do next, and offers the control
 *  that does it. */
function EmptyOutfits({ onBuild }: { onBuild: () => void }) {
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
        <Feather name="layers" size={24} color={theme.colour.textTertiary} />
      </View>

      <Text variant="title2" align="center">
        No outfits yet
      </Text>
      <Text variant="callout" colour="tertiary" align="center" style={{ maxWidth: 260 }}>
        Put a few pieces together in the Studio and save the ones you like. You start with one permanent space and four single-use saves.
      </Text>

      <View style={{ paddingTop: theme.space.sm, width: 220 }}>
        <Button label="Build an outfit" onPress={onBuild} />
      </View>
    </View>
  );
}
