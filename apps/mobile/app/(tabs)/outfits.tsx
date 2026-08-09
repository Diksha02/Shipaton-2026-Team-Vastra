import Feather from '@expo/vector-icons/Feather';
import { staggerDelay } from '@vastra/design';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { FREE_SLOTS, itemsByIds } from '../../src/mock/data';
import { useOutfitStore, useSavedOutfits } from '../../src/store/outfit';
import { useTheme } from '../../src/theme/ThemeProvider';

/**
 * A filled slot: the outfit's garments as a stacked colour strip.
 *
 * Carries both halves of the slot rule in one row — a lock, because a saved
 * outfit cannot be edited, and a delete control, because it can always be
 * removed. Deletion is confirmed inline rather than through a system alert: the
 * outfit stays on screen while the user decides, which is the thing they are
 * deciding about.
 */
function FilledSlot({
  name,
  itemIds,
  index,
  onDelete,
}: {
  name: string;
  itemIds: string[];
  index: number;
  onDelete: () => void;
}) {
  const theme = useTheme();
  const items = itemsByIds(itemIds);
  const [confirming, setConfirming] = useState(false);

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base, delay: staggerDelay(index) }}
    >
      <View
        style={{
          borderRadius: theme.radius.xl,
          borderWidth: theme.borderWidth.hairline,
          borderColor: confirming ? theme.colour.danger : theme.colour.border,
          backgroundColor: theme.colour.surface,
          overflow: 'hidden',
        }}
      >
        <View style={{ flexDirection: 'row', height: 132, gap: 1 }}>
          {items.map((item) => (
            <Image
              key={item.id}
              source={item.image}
              style={{ flex: 1, height: '100%' }}
              contentFit="contain"
              transition={200}
            />
          ))}
        </View>

        {confirming ? (
          <View style={{ padding: theme.space.base, gap: theme.space.md }}>
            <Text variant="subhead">Delete this outfit? Its slot is freed.</Text>
            <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
              <View style={{ flex: 1 }}>
                <Button label="Keep it" variant="secondary" onPress={() => setConfirming(false)} />
              </View>
              <View style={{ flex: 1 }}>
                <Button
                  label="Delete"
                  variant="danger"
                  onPress={() => {
                    if (Platform.OS !== 'web') {
                      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                    }
                    onDelete();
                  }}
                />
              </View>
            </View>
          </View>
        ) : (
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
                {name}
              </Text>
              <Text variant="caption" colour="tertiary">
                {items.length} pieces
              </Text>
            </View>

            {/* Finalised outfits are edit-locked, never delete-locked (PROJECT.md §4). */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.xs }}>
              <Feather name="lock" size={12} color={theme.colour.textTertiary} />
              <Text variant="overline" colour="tertiary">
                Saved
              </Text>
            </View>

            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.selectionAsync();
                setConfirming(true);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel={`Delete ${name}`}
            >
              {({ pressed }) => (
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: theme.radius.full,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: pressed ? theme.colour.surfacePressed : theme.colour.surfaceMuted,
                  }}
                >
                  <Feather name="trash-2" size={15} color={theme.colour.textSecondary} />
                </View>
              )}
            </Pressable>
          </View>
        )}
      </View>
    </MotiView>
  );
}

/** A free slot. Tapping it goes to Studio to build one — never to the paywall,
 *  because the slot the user is looking at is already theirs. */
function EmptySlot({ index, onPress }: { index: number; onPress: () => void }) {
  const theme = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base, delay: staggerDelay(index) }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Empty slot, build an outfit"
      >
        <View
          style={{
            height: 132,
            borderRadius: theme.radius.xl,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            gap: theme.space.sm,
          }}
        >
          <Feather name="plus" size={18} color={theme.colour.textTertiary} />
          <Text variant="subhead" colour="tertiary">
            Build an outfit
          </Text>
        </View>
      </Pressable>
    </MotiView>
  );
}

export default function OutfitsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const saved = useSavedOutfits();
  const deleteOutfit = useOutfitStore((state) => state.deleteOutfit);
  const used = saved.length;
  const remaining = Math.max(0, FREE_SLOTS - used);

  return (
    <Screen title="Outfits" subtitle={`${used} of ${FREE_SLOTS} slots used`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.space.base, paddingBottom: theme.space['4xl'] }}
      >
        {saved.map((outfit, index) => (
          <FilledSlot
            key={outfit.id}
            name={outfit.name}
            itemIds={outfit.itemIds}
            index={index}
            onDelete={() => deleteOutfit(outfit.id)}
          />
        ))}

        {Array.from({ length: remaining }).map((_, offset) => (
          <EmptySlot
            key={`empty-${offset}`}
            index={used + offset}
            onPress={() => router.push('/(tabs)/studio')}
          />
        ))}

        {remaining <= 1 && (
          <MotiView
            from={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: 'timing', duration: theme.duration.slow }}
          >
            <View
              style={{
                marginTop: theme.space.sm,
                padding: theme.space.base,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colour.accentSubtle,
                borderWidth: theme.borderWidth.hairline,
                borderColor: theme.colour.accentBorder,
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.md,
              }}
            >
              <Feather name="alert-circle" size={18} color={theme.colour.accent} />
              <Text variant="footnote" colour="secondary" style={{ flex: 1 }}>
                {remaining === 0
                  ? 'All slots are full. Free one up, or get more.'
                  : 'One slot left. More outfits need more room.'}
              </Text>
              {/* The only route to the paywall from this screen, and only once
                  there is genuinely no free slot left. */}
              {remaining === 0 && (
                <Pressable
                  onPress={() => router.push('/paywall')}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Get more slots"
                >
                  <Text variant="subhead" colour="accent">
                    Get more
                  </Text>
                </Pressable>
              )}
            </View>
          </MotiView>
        )}
      </ScrollView>
    </Screen>
  );
}
