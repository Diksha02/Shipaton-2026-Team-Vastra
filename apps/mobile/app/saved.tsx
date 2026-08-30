import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { GarmentTile } from '../src/components/GarmentTile';
import { Text } from '../src/components/Text';
import { catalogue, formatPrice } from '../src/mock/data';
import { useWishlistItems } from '../src/store/wishlist';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Pieces you have saved but do not own.
 *
 * Separate from Outfits, and unlimited. Outfit spaces are the scarcity
 * mechanic because that is where the work and the value are; charging for a
 * bookmark on something someone intends to buy would be taxing them for
 * wanting to spend money.
 */
export default function SavedScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const items = useWishlistItems(catalogue);

  const total = useMemo(
    () => items.reduce((sum, item) => sum + (item.priceMinor ?? 0), 0),
    [items],
  );

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.base,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text variant="title2">Saved</Text>
          {items.length > 0 && (
            <Text variant="caption" colour="tertiary">
              {items.length} {items.length === 1 ? 'piece' : 'pieces'} · {formatPrice(total, 'GBP')} total
            </Text>
          )}
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          padding: theme.layout.gutter,
          paddingBottom: theme.space['4xl'],
          gap: theme.space.base,
        }}
      >
        {items.length === 0 ? (
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
              <Feather name="heart" size={24} color={theme.colour.textTertiary} />
            </View>
            <Text variant="title2" align="center">
              Nothing saved yet
            </Text>
            <Text variant="callout" colour="tertiary" align="center" style={{ maxWidth: 270 }}>
              Tap the heart on anything you are considering. Saved pieces are unlimited and stay
              until you remove them.
            </Text>
            <View style={{ paddingTop: theme.space.sm, width: 220 }}>
              <Button label="Browse the shop" onPress={() => router.push('/shop')} />
            </View>
          </View>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.base }}>
            {items.map((item, index) => (
              <View key={item.id} style={{ width: '48%' }}>
                <GarmentTile
                  item={item}
                  index={index}
                  wishlistable
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

