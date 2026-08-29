import Feather from '@expo/vector-icons/Feather';
import { ITEM_CATEGORIES, type ItemCategory, type ItemColour } from '@vastra/shared';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { CATEGORY_LABEL, COLOUR_SWATCH } from '../src/mock/data';
import { useIntake, type Draft } from '../src/store/intake';
import { useTheme } from '../src/theme/ThemeProvider';

/** The colours worth offering as taps. `multi` and `other` exist in the enum
 *  for imported data but are a poor thing to ask a person to choose. */
const PICKABLE_COLOURS: ItemColour[] = [
  'black', 'grey', 'white', 'beige', 'brown',
  'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink',
];

/**
 * Labelling what you photographed.
 *
 * This screen is the other half of bulk capture. Photographing and tagging in
 * one motion means a decision per garment, and forty decisions in a row is
 * exactly where people give up. Splitting them lets someone empty a shelf
 * standing at the wardrobe, then label it sitting down.
 *
 * Two taps per garment: what it is, what colour. Nothing else is required —
 * a name is optional and defaults to the category. Every additional required
 * field here multiplies across the whole queue.
 */
export default function IntakeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const drafts = useIntake((s) => s.drafts);
  const update = useIntake((s) => s.update);
  const remove = useIntake((s) => s.remove);
  const clear = useIntake((s) => s.clear);

  const [index, setIndex] = useState(0);
  const current: Draft | undefined = drafts[Math.min(index, Math.max(0, drafts.length - 1))];

  const ready = useMemo(
    () => drafts.filter((d) => d.category !== null && d.colour !== null).length,
    [drafts],
  );

  if (drafts.length === 0) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colour.bg,
          paddingTop: insets.top,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.base,
          paddingHorizontal: theme.layout.gutter,
        }}
      >
        <Feather name="check-circle" size={34} color={theme.colour.textTertiary} />
        <Text variant="title2" align="center">
          Nothing waiting
        </Text>
        <Text variant="callout" colour="tertiary" align="center" style={{ maxWidth: 280 }}>
          Every photo you have taken is labelled and in your wardrobe.
        </Text>
        <View style={{ width: 220, paddingTop: theme.space.sm }}>
          <Button label="Back to wardrobe" onPress={() => router.replace('/(tabs)/wardrobe')} />
        </View>
      </View>
    );
  }

  if (!current) return null;

  const done = current.category !== null && current.colour !== null;

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.sm,
          paddingBottom: theme.space.base,
        }}
      >
        <View>
          <Text variant="title2">Label these</Text>
          <Text variant="caption" colour="tertiary">
            {index + 1} of {drafts.length} · {ready} ready
          </Text>
        </View>
        <Pressable onPress={() => router.back()} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Feather name="x" size={20} color={theme.colour.textSecondary} />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: insets.bottom + theme.space['3xl'],
          gap: theme.space.lg,
        }}
      >
        <View
          style={{
            height: 260,
            borderRadius: theme.radius.xl,
            overflow: 'hidden',
            backgroundColor: theme.colour.surfaceGarment,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Image
            source={{ uri: current.uri }}
            style={{ width: '100%', height: '100%' }}
            contentFit="contain"
            transition={150}
          />
        </View>

        <View style={{ gap: theme.space.sm }}>
          <Text variant="overline" colour="tertiary">
            What is it?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
            {ITEM_CATEGORIES.filter((c) => c !== 'other').map((category) => (
              <Pill
                key={category}
                label={CATEGORY_LABEL[category as ItemCategory] ?? category}
                active={current.category === category}
                onPress={() => update(current.id, { category: category as ItemCategory })}
              />
            ))}
          </View>
        </View>

        <View style={{ gap: theme.space.sm }}>
          <Text variant="overline" colour="tertiary">
            What colour?
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
            {PICKABLE_COLOURS.map((colour) => {
              const active = current.colour === colour;
              return (
                <Pressable
                  key={colour}
                  onPress={() => update(current.id, { colour })}
                  accessibilityRole="button"
                  accessibilityLabel={colour}
                  accessibilityState={{ selected: active }}
                >
                  <View
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: theme.radius.full,
                      backgroundColor: COLOUR_SWATCH[colour],
                      borderWidth: active ? 3 : theme.borderWidth.hairline,
                      borderColor: active ? theme.colour.actionPrimary : theme.colour.borderStrong,
                    }}
                  />
                </Pressable>
              );
            })}
          </View>
        </View>

        <View style={{ gap: theme.space.sm }}>
          <Text variant="overline" colour="tertiary">
            Name it (optional)
          </Text>
          <TextInput
            value={current.title}
            onChangeText={(title) => update(current.id, { title })}
            placeholder={
              current.category ? `${CATEGORY_LABEL[current.category] ?? 'Piece'}` : 'Blue linen shirt'
            }
            placeholderTextColor={theme.colour.textDisabled}
            maxLength={60}
            style={{
              height: 48,
              borderRadius: theme.radius.lg,
              paddingHorizontal: theme.space.base,
              backgroundColor: theme.colour.surfaceMuted,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.border,
              color: theme.colour.textPrimary,
              fontFamily: theme.fontFamily.sans,
              fontSize: 15,
            }}
          />
        </View>

        <View style={{ gap: theme.space.sm }}>
          <Button
            label={index + 1 < drafts.length ? 'Next piece' : 'Finish'}
            disabled={!done}
            onPress={() => {
              if (index + 1 < drafts.length) setIndex(index + 1);
              else router.replace('/(tabs)/wardrobe');
            }}
          />
          <Button
            label="Skip this one"
            variant="ghost"
            onPress={() => {
              remove(current.id);
              setIndex((i) => Math.max(0, Math.min(i, drafts.length - 2)));
            }}
          />
        </View>

        {/* Leaving is never trapped. A queue you cannot escape is worse than one
            you never started. */}
        <Pressable onPress={clear} hitSlop={8} style={{ alignItems: 'center', paddingTop: theme.space.sm }}>
          <Text variant="caption" colour="tertiary">
            Discard all {drafts.length} photos
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

function Pill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: active }}>
      <View
        style={{
          height: 36,
          paddingHorizontal: theme.space.base,
          borderRadius: theme.radius.full,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: active ? theme.colour.actionPrimary : 'transparent',
          borderWidth: active ? 0 : theme.borderWidth.hairline,
          borderColor: theme.colour.border,
        }}
      >
        <Text variant="subhead" colour={active ? 'onAction' : 'secondary'}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
