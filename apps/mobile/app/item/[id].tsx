import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Alert, Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { Text } from '../../src/components/Text';
import {
  CATEGORY_LABEL,
  STUDIO_LAYERS,
  catalogue,
  formatPrice,
  wardrobe,
  type StudioLayer,
} from '../../src/mock/data';
import { useOutfitStore } from '../../src/store/outfit';
import { useTheme } from '../../src/theme/ThemeProvider';

export default function ItemDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const item = [...wardrobe, ...catalogue].find((candidate) => candidate.id === id);

  if (!item) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colour.bg,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.base,
          padding: theme.layout.gutter,
        }}
      >
        <Text variant="title2">Not found</Text>
        <Text variant="callout" colour="tertiary" align="center">
          That piece isn&apos;t in your wardrobe any more.
        </Text>
        <Button label="Go back" variant="secondary" fullWidth={false} onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: theme.space['4xl'] }}>
        <View style={{ height: 460, backgroundColor: theme.colour.surfaceGarment }}>
          <Image
            source={item.image}
            style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }}
            contentFit="contain"
            transition={220}
          />
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={{
              position: 'absolute',
              top: insets.top + theme.space.sm,
              left: theme.layout.gutter,
              width: 36,
              height: 36,
              borderRadius: theme.radius.full,
              backgroundColor: theme.colour.surface,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Feather name="chevron-left" size={20} color={theme.colour.textPrimary} />
          </Pressable>
        </View>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: theme.duration.base }}
          style={{ padding: theme.layout.gutter, gap: theme.space.base }}
        >
          {!!item.brand && (
            <Text variant="overline" colour="tertiary">
              {item.brand}
            </Text>
          )}
          <Text variant="title1">{item.title}</Text>

          {item.priceMinor !== null && (
            <Text variant="title2">{formatPrice(item.priceMinor, item.currency)}</Text>
          )}

          <View style={{ flexDirection: 'row', gap: theme.space.sm, flexWrap: 'wrap' }}>
            {[CATEGORY_LABEL[item.category], item.colour].map((label) => (
              <View
                key={label}
                style={{
                  paddingHorizontal: theme.space.md,
                  paddingVertical: theme.space.sm - 2,
                  borderRadius: theme.radius.full,
                  borderWidth: theme.borderWidth.hairline,
                  borderColor: theme.colour.border,
                }}
              >
                <Text variant="caption" colour="secondary">
                  {label}
                </Text>
              </View>
            ))}
          </View>
        </MotiView>
      </ScrollView>

      <View
        style={{
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.md,
          paddingBottom: insets.bottom + theme.space.base,
          gap: theme.space.sm,
          borderTopWidth: theme.borderWidth.hairline,
          borderTopColor: theme.colour.border,
        }}
      >
        <Button
          label={item.owned ? 'Wear this' : 'View at retailer'}
          onPress={() => {
            if (item.owned) {
              // Not every category is a Studio layer — dresses, swimwear and
              // underwear have no slot on the figure yet. Check rather than
              // cast, or tapping one silently writes a layer that cannot render.
              const layer = STUDIO_LAYERS.find((candidate) => candidate === item.category);
              if (!layer) {
                Alert.alert(
                  'Not on the figure yet',
                  `${CATEGORY_LABEL[item.category]} cannot be styled in the Studio for now.`,
                );
                return;
              }
              useOutfitStore.getState().setLayer(layer as StudioLayer, item.id);
              router.push('/(tabs)/studio');
              return;
            }
            if (item.retailerUrl) {
              void Linking.openURL(item.retailerUrl);
            } else {
              Alert.alert('No link yet', 'This piece has no retailer page attached.');
            }
          }}
        />
        {!item.owned && (
          <Text variant="caption" colour="tertiary" align="center">
            Opens {item.brand}. Two taps from here, as promised.
          </Text>
        )}
      </View>
    </View>
  );
}
