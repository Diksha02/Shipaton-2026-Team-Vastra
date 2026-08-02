import Feather from '@expo/vector-icons/Feather';
import { staggerDelay } from '@vastra/design';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, ScrollView, View } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { FREE_SLOTS, itemsByIds, outfits } from '../../src/mock/data';
import { useTheme } from '../../src/theme/ThemeProvider';

/** A filled slot: the outfit's garments as a stacked colour strip. */
function FilledSlot({ name, itemIds, index }: { name: string; itemIds: string[]; index: number }) {
  const theme = useTheme();
  const items = itemsByIds(itemIds);

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
          borderColor: theme.colour.border,
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

        <View
          style={{
            padding: theme.space.base,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
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
        </View>
      </View>
    </MotiView>
  );
}

function EmptySlot({ index, onPress }: { index: number; onPress: () => void }) {
  const theme = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 14 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base, delay: staggerDelay(index) }}
    >
      <Pressable onPress={onPress}>
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
            Empty slot
          </Text>
        </View>
      </Pressable>
    </MotiView>
  );
}

export default function OutfitsScreen() {
  const theme = useTheme();
  const router = useRouter();

  const used = outfits.length;
  const remaining = Math.max(0, FREE_SLOTS - used);

  return (
    <Screen title="Outfits" subtitle={`${used} of ${FREE_SLOTS} slots used`}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ gap: theme.space.base, paddingBottom: theme.space['4xl'] }}
      >
        {outfits.map((outfit, index) => (
          <FilledSlot key={outfit.id} name={outfit.name} itemIds={outfit.itemIds} index={index} />
        ))}

        {Array.from({ length: remaining }).map((_, offset) => (
          <EmptySlot
            key={`empty-${offset}`}
            index={used + offset}
            onPress={() => router.push('/paywall')}
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
            </View>
          </MotiView>
        )}
      </ScrollView>
    </Screen>
  );
}
