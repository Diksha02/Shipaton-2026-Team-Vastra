import Feather from '@expo/vector-icons/Feather';
import { staggerDelay } from '@vastra/design';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { Platform, Pressable, View } from 'react-native';
import { formatPrice, type MockItem } from '../mock/data';
import { useIsWishlisted, useWishlist } from '../store/wishlist';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface GarmentTileProps {
  item: MockItem;
  index?: number;
  onPress?: () => void;
  selected?: boolean;
  /** Off inside the Studio picker, where the tile is a control for dressing the
   *  figure and a wishlist heart would be meaningless on clothes you own. */
  wishlistable?: boolean;
}

export function GarmentTile({
  item,
  index = 0,
  onPress,
  selected = false,
  wishlistable = false,
}: GarmentTileProps) {
  const theme = useTheme();
  const saved = useIsWishlisted(item.id);
  const toggle = useWishlist((s) => s.toggle);

  // Only things you can buy. Saving a piece already in your wardrobe is a
  // no-op that makes the control look broken.
  const showHeart = wishlistable && !item.owned;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base, delay: staggerDelay(index) }}
      style={{ flex: 1 }}
    >
      <Pressable onPress={onPress}>
        <View
          style={{
            aspectRatio: theme.layout.garmentAspectRatio,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            backgroundColor: theme.colour.surfaceGarment,
            borderWidth: selected ? theme.borderWidth.thick : theme.borderWidth.hairline,
            borderColor: selected ? theme.colour.actionPrimary : theme.colour.border,
          }}
        >
          <View style={{ flex: 1, padding: 14 }}>
            <Image
              source={item.image}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={200}
            />
          </View>

          {showHeart && (
            <Pressable
              onPress={() => {
                if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggle(item.id);
              }}
              // Generous, because this sits on top of another pressable and a
              // near-miss should never open the item instead of saving it.
              hitSlop={12}
              accessibilityRole="button"
              accessibilityState={{ selected: saved }}
              accessibilityLabel={saved ? `Remove ${item.title} from saved` : `Save ${item.title}`}
              style={{
                position: 'absolute',
                top: theme.space.sm,
                right: theme.space.sm,
                width: 32,
                height: 32,
                borderRadius: theme.radius.full,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.colour.surface,
              }}
            >
              <MotiView
                // Keyed so the state change replays the pop rather than fading.
                key={saved ? 'on' : 'off'}
                from={{ scale: saved ? 0.6 : 1 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', ...theme.spring.responsive }}
              >
                <Feather
                  name="heart"
                  size={15}
                  color={saved ? theme.colour.accent : theme.colour.textTertiary}
                  // Feather has no filled heart; the fill prop is what makes a
                  // saved state read at a glance.
                  style={saved ? { opacity: 1 } : undefined}
                  {...(saved ? { fill: theme.colour.accent } : {})}
                />
              </MotiView>
            </Pressable>
          )}

          {!!item.brand && (
            <View
              style={{
                position: 'absolute',
                top: theme.space.sm,
                left: theme.space.sm,
                backgroundColor: theme.colour.surface,
                paddingHorizontal: theme.space.sm,
                paddingVertical: 3,
                borderRadius: theme.radius.sm,
              }}
            >
              <Text variant="overline" colour="secondary">
                {item.brand}
              </Text>
            </View>
          )}
        </View>

        <View style={{ paddingTop: theme.space.sm, gap: 2 }}>
          <Text variant="subhead" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="caption" colour="tertiary">
            {item.priceMinor === null
              ? 'In your wardrobe'
              : formatPrice(item.priceMinor, item.currency)}
          </Text>
        </View>
      </Pressable>
    </MotiView>
  );
}
