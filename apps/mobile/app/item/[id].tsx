import Feather from '@expo/vector-icons/Feather';
import type { ItemCategory } from '@vastra/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Text } from '../../src/components/Text';
import { useGoBack } from '../../src/hooks/useGoBack';
import {
  CATEGORY_LABEL,
  COLOUR_SWATCH,
  STUDIO_LAYERS,
  catalogue,
  formatPrice,
  wardrobe,
  type StudioLayer,
} from '../../src/mock/data';
import { useOutfitStore } from '../../src/store/outfit';
import { useTheme } from '../../src/theme/ThemeProvider';

function colourLabel(colour: string): string {
  return colour.charAt(0).toUpperCase() + colour.slice(1);
}

function asStudioLayer(category: ItemCategory): StudioLayer | null {
  return (STUDIO_LAYERS as readonly string[]).includes(category)
    ? (category as StudioLayer)
    : null;
}

export default function ItemDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const goBack = useGoBack('/wardrobe-grid');
  const { id } = useLocalSearchParams<{ id: string }>();

  const setLayer = useOutfitStore((state) => state.setLayer);
  const setActiveLayer = useOutfitStore((state) => state.setActiveLayer);

  const item = [...wardrobe, ...catalogue].find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Pressable
          onPress={goBack}
          style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: theme.colour.scrim }}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />
        <View
          style={{
            marginHorizontal: theme.layout.gutter,
            padding: theme.layout.gutter,
            gap: theme.space.base,
            borderRadius: theme.radius['2xl'],
            backgroundColor: theme.colour.surface,
            alignItems: 'center',
            ...theme.shadow.lg,
          }}
        >
          <Text variant="title2">Not found</Text>
          <Text variant="callout" colour="tertiary" align="center">
            That piece isn&apos;t in your wardrobe any more.
          </Text>
          <Button label="Close" variant="secondary" fullWidth={false} onPress={goBack} />
        </View>
      </View>
    );
  }

  const layer = asStudioLayer(item.category);
  const price =
    item.priceMinor === null ? null : formatPrice(item.priceMinor, item.currency);

  const onAddToOutfit = () => {
    // Studio is the builder; the Outfits tab only lists finals. Selecting here
    // puts the piece on the stage and focuses its layer so the carousel lands
    // on it.
    if (!layer) return;
    setLayer(layer, item.id);
    setActiveLayer(layer);
    router.push('/(tabs)/studio');
  };

  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: theme.layout.gutter,
        paddingVertical: insets.top + theme.space.lg,
      }}
    >
      <Pressable
        onPress={goBack}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          backgroundColor: theme.colour.scrim,
        }}
        accessibilityRole="button"
        accessibilityLabel="Close"
      />

      <MotiView
        from={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'timing', duration: theme.duration.base }}
        style={{
          width: '100%',
          maxHeight: '86%',
          borderRadius: theme.radius['2xl'],
          backgroundColor: theme.colour.surface,
          overflow: 'hidden',
          ...theme.shadow.lg,
        }}
      >
        <Pressable
          onPress={goBack}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close"
          style={{
            position: 'absolute',
            top: theme.space.base,
            right: theme.space.base,
            zIndex: 1,
          }}
        >
          {({ pressed }) => (
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: theme.radius.full,
                backgroundColor: pressed ? theme.colour.surfacePressed : theme.colour.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Feather name="x" size={18} color={theme.colour.textPrimary} />
            </View>
          )}
        </Pressable>

        <ScrollView
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={{ paddingBottom: theme.space.base }}
        >
          <View
            style={{
              height: 240,
              marginHorizontal: theme.space.base,
              marginTop: theme.space['2xl'],
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colour.surfaceGarment,
              padding: theme.space.base,
            }}
          >
            <Image
              source={item.image}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={220}
              cachePolicy="memory-disk"
            />
          </View>

          <View
            style={{
              paddingHorizontal: theme.layout.gutter,
              paddingTop: theme.space.lg,
              gap: theme.space.md,
            }}
          >
            {!!item.brand && (
              <Text variant="overline" colour="tertiary">
                {item.brand}
              </Text>
            )}

            <View style={{ gap: theme.space.xs }}>
              <Text variant="title1">{item.title}</Text>
              {price !== null ? (
                <Text variant="title2">{price}</Text>
              ) : (
                <Text variant="callout" colour="secondary">
                  In your wardrobe
                </Text>
              )}
            </View>

            <View style={{ flexDirection: 'row', gap: theme.space.sm, flexWrap: 'wrap' }}>
              <View
                style={{
                  paddingHorizontal: theme.space.md,
                  paddingVertical: theme.space.sm,
                  borderRadius: theme.radius.full,
                  borderWidth: theme.borderWidth.hairline,
                  borderColor: theme.colour.border,
                  backgroundColor: theme.colour.bg,
                }}
              >
                <Text variant="caption" colour="secondary">
                  {CATEGORY_LABEL[item.category]}
                </Text>
              </View>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: theme.space.xs,
                  paddingHorizontal: theme.space.md,
                  paddingVertical: theme.space.sm,
                  borderRadius: theme.radius.full,
                  borderWidth: theme.borderWidth.hairline,
                  borderColor: theme.colour.border,
                  backgroundColor: theme.colour.bg,
                }}
              >
                <View
                  style={{
                    width: 10,
                    height: 10,
                    borderRadius: theme.radius.full,
                    backgroundColor: COLOUR_SWATCH[item.colour],
                    borderWidth: theme.borderWidth.hairline,
                    borderColor: theme.colour.borderStrong,
                  }}
                />
                <Text variant="caption" colour="secondary">
                  {colourLabel(item.colour)}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>

        <View
          style={{
            paddingHorizontal: theme.layout.gutter,
            paddingTop: theme.space.md,
            paddingBottom: theme.space.lg,
            gap: theme.space.sm,
            borderTopWidth: theme.borderWidth.hairline,
            borderTopColor: theme.colour.border,
          }}
        >
          {item.owned ? (
            <>
              <Button label="Add to an outfit" disabled={!layer} onPress={onAddToOutfit} />
              <Text variant="caption" colour="tertiary" align="center">
                {layer ? 'Opens in Studio' : "This piece can't be added to an outfit yet."}
              </Text>
            </>
          ) : (
            <>
              {/* F10 buy sheet lands later. Disabled until a real retailer URL exists. */}
              <Button label="View at retailer" disabled />
              <Text variant="caption" colour="tertiary" align="center">
                Coming soon
              </Text>
            </>
          )}
        </View>
      </MotiView>
    </View>
  );
}
