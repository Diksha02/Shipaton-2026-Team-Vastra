import Feather from '@expo/vector-icons/Feather';
import { staggerDelay } from '@vastra/design';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { FREE_SLOTS, itemsByIds } from '../../src/mock/data';
import { OUTFIT_NAME_MAX, useOutfitStore, useSavedOutfits } from '../../src/store/outfit';
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
  onRename,
}: {
  name: string;
  itemIds: string[];
  index: number;
  onDelete: () => void;
  onRename: (name: string) => void;
}) {
  const theme = useTheme();
  const items = itemsByIds(itemIds);
  const [confirming, setConfirming] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(name);

  const startEditing = () => {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    setDraft(name);
    setEditing(true);
  };

  // Commits on blur as well as on Done, so tapping elsewhere keeps the edit
  // rather than silently discarding it. A blank draft is refused by the store,
  // which leaves the old name showing.
  const commit = () => {
    setEditing(false);
    onRename(draft);
  };

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
    >
      <View
        style={{
          borderRadius: theme.radius['2xl'],
          borderWidth: theme.borderWidth.hairline,
          borderColor: confirming ? theme.colour.danger : theme.colour.border,
          backgroundColor: theme.colour.surface,
          overflow: 'hidden',
          ...theme.shadow.sm,
        }}
      >
        {/* Garments sit on their own backdrop rather than the card colour. A
            cutout on a near-white card has no ground to stand on. */}
        <View
          style={{
            flexDirection: 'row',
            height: 148,
            gap: theme.space.hair,
            paddingHorizontal: theme.space.md,
            paddingVertical: theme.space.base,
            backgroundColor: theme.colour.surfaceGarment,
          }}
        >
          {items.map((item) => (
            <Image
              key={item.id}
              source={item.image}
              style={{ flex: 1, height: '100%' }}
              contentFit="contain"
              transition={280}
            />
          ))}
        </View>

        {confirming ? (
          <View style={{ padding: theme.space.lg, gap: theme.space.md }}>
            <Text variant="subhead">Delete this outfit? Its slot is freed.</Text>
            {/* Delete carries the weight; keeping is the quiet default, so the
                destructive choice has to be meant. */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
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
              <Button
                label="Keep it"
                variant="ghost"
                fullWidth={false}
                onPress={() => setConfirming(false)}
              />
            </View>
          </View>
        ) : (
          <View
            style={{
              padding: theme.space.lg,
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.md,
            }}
          >
            <View style={{ flex: 1, gap: theme.space.hair }}>
              {editing ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  onBlur={commit}
                  onSubmitEditing={commit}
                  autoFocus
                  selectTextOnFocus
                  returnKeyType="done"
                  maxLength={OUTFIT_NAME_MAX}
                  underlineColorAndroid="transparent"
                  accessibilityLabel="Outfit name"
                  style={[
                    theme.text.headline,
                    {
                      color: theme.colour.textPrimary,
                      padding: 0,
                      borderBottomWidth: theme.borderWidth.hairline,
                      borderBottomColor: theme.colour.borderStrong,
                    },
                  ]}
                />
              ) : (
                /* The pencil sits against the name itself, not out at the edge of
                   the card, so it reads as belonging to this one word — the
                   garments beside it are locked, and the icon must not imply
                   otherwise. */
                <Pressable
                  onPress={startEditing}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Rename ${name}`}
                >
                  {({ pressed }) => (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: theme.space.xs,
                        opacity: pressed ? 0.6 : 1,
                      }}
                    >
                      <Text variant="headline" numberOfLines={1} style={{ flexShrink: 1 }}>
                        {name}
                      </Text>
                      <Feather name="edit-2" size={12} color={theme.colour.textTertiary} />
                    </View>
                  )}
                </Pressable>
              )}
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

/**
 * A free slot. Tapping it goes to Studio to build one — never to the paywall,
 * because the slot the user is looking at is already theirs.
 *
 * Only the next slot in line invites a tap. Four identical dashed boxes read as
 * four things gone wrong; one invitation followed by quiet placeholders reads as
 * room to grow, and leaves the eye somewhere to land.
 */
function EmptySlot({
  index,
  next,
  onPress,
}: {
  index: number;
  next: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  if (!next) {
    return (
      <MotiView
        from={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
      >
        <View
          style={{
            height: 56,
            borderRadius: theme.radius.xl,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
            borderStyle: 'dashed',
          }}
          pointerEvents="none"
        />
      </MotiView>
    );
  }

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
    >
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel="Empty slot, build an outfit"
      >
        {({ pressed }) => (
          <View
            style={{
              height: 148,
              borderRadius: theme.radius['2xl'],
              borderWidth: theme.borderWidth.hairline,
              borderColor: pressed ? theme.colour.borderStrong : theme.colour.border,
              borderStyle: 'dashed',
              backgroundColor: pressed ? theme.colour.surfaceMuted : 'transparent',
              alignItems: 'center',
              justifyContent: 'center',
              gap: theme.space.sm,
            }}
          >
            <Feather name="plus" size={18} color={theme.colour.textSecondary} />
            <Text variant="subhead" colour="secondary">
              Build an outfit
            </Text>
          </View>
        )}
      </Pressable>
    </MotiView>
  );
}

/**
 * How full the wardrobe is, in the header. This is why the cards below do not
 * each carry a "Slot 3" label — the count belongs in one place, and the outfit's
 * own name is what the user is looking for on the card.
 */
function SlotCount({ used }: { used: number }) {
  const theme = useTheme();
  const full = used >= FREE_SLOTS;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        paddingHorizontal: theme.space.md,
        paddingVertical: theme.space.xs,
        borderRadius: theme.radius.full,
        borderWidth: theme.borderWidth.hairline,
        borderColor: full ? theme.colour.accentBorder : theme.colour.border,
        backgroundColor: full ? theme.colour.accentSubtle : theme.colour.surface,
      }}
      accessibilityRole="text"
      accessibilityLabel={`${used} of ${FREE_SLOTS} slots used`}
    >
      <Text variant="subhead" colour={full ? 'accent' : 'primary'}>
        {used}
      </Text>
      <Text variant="caption" colour="tertiary">
        {' / '}
        {FREE_SLOTS}
      </Text>
    </View>
  );
}

export default function OutfitsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const saved = useSavedOutfits();
  const deleteOutfit = useOutfitStore((state) => state.deleteOutfit);
  const renameOutfit = useOutfitStore((state) => state.renameOutfit);
  const used = saved.length;
  const remaining = Math.max(0, FREE_SLOTS - used);

  return (
    <Screen
      title="Outfits"
      subtitle={remaining === 0 ? 'Every slot is filled' : `${remaining} still free`}
      right={<SlotCount used={used} />}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.space.md, paddingBottom: theme.space['5xl'] }}
      >
        {saved.map((outfit, index) => (
          <FilledSlot
            key={outfit.id}
            name={outfit.name}
            itemIds={outfit.itemIds}
            index={index}
            onDelete={() => deleteOutfit(outfit.id)}
            onRename={(next) => renameOutfit(outfit.id, next)}
          />
        ))}

        {Array.from({ length: remaining }).map((_, offset) => (
          <EmptySlot
            key={`empty-${offset}`}
            index={used + offset}
            next={offset === 0}
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
                padding: theme.space.lg,
                borderRadius: theme.radius.xl,
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
