import { staggerDelay } from '@vastra/design';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useMemo } from 'react';
import { View } from 'react-native';
import { formatPrice, type MockItem } from '../mock/data';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface GarmentTileProps {
  item: MockItem;
  index?: number;
  onPress?: () => void;
  selected?: boolean;
  /**
   * The full-width variant used to break up the grid.
   *
   * Not simply a larger tile: garments are portrait cut-outs, so scaling one
   * into a landscape box leaves it marooned in dead space. The wide tile puts
   * the garment on the left and its details in the room that opens up beside
   * it, which turns that space into composition rather than waste.
   */
  wide?: boolean;
}

export function GarmentTile({
  item,
  index = 0,
  onPress,
  selected = false,
  wide = false,
}: GarmentTileProps) {
  const theme = useTheme();

  const animate = useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        'worklet';
        return { scale: pressed ? 0.97 : 1 };
      },
    [],
  );

  const price =
    item.priceMinor === null ? 'In your wardrobe' : formatPrice(item.priceMinor, item.currency);

  const frame = {
    borderRadius: theme.radius['2xl'],
    overflow: 'hidden' as const,
    backgroundColor: theme.colour.surfaceGarment,
    borderWidth: selected ? theme.borderWidth.thick : theme.borderWidth.hairline,
    borderColor: selected ? theme.colour.actionPrimary : theme.colour.border,
  };

  const brandBadge = !!item.brand && (
    <View
      style={{
        position: 'absolute',
        top: theme.space.sm,
        left: theme.space.sm,
        backgroundColor: theme.colour.surface,
        paddingHorizontal: theme.space.sm,
        paddingVertical: theme.space.hair,
        borderRadius: theme.radius.sm,
      }}
    >
      <Text variant="overline" colour="secondary">
        {item.brand}
      </Text>
    </View>
  );

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base, delay: staggerDelay(index) }}
      style={{ flex: 1 }}
    >
      <MotiPressable
        onPress={onPress}
        animate={animate}
        transition={{ type: 'timing', duration: theme.duration.instant }}
        accessibilityLabel={`${item.title}, ${price}`}
      >
        {wide ? (
          <View style={{ ...frame, flexDirection: 'row', ...theme.shadow.sm }}>
            <View style={{ flex: 55, aspectRatio: 1, padding: theme.space.base }}>
              <Image
                source={item.image}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={280}
              />
            </View>
            <View
              style={{
                flex: 45,
                justifyContent: 'center',
                gap: theme.space.xs,
                paddingHorizontal: theme.space.lg,
              }}
            >
              {!!item.brand && (
                <Text variant="overline" colour="tertiary">
                  {item.brand}
                </Text>
              )}
              <Text variant="headline" numberOfLines={2}>
                {item.title}
              </Text>
              <Text variant="caption" colour="tertiary">
                {price}
              </Text>
            </View>
          </View>
        ) : (
          <>
            <View
              style={{
                ...frame,
                aspectRatio: theme.layout.garmentAspectRatio,
                ...theme.shadow.sm,
              }}
            >
              <View style={{ flex: 1, padding: theme.space.base }}>
                <Image
                  source={item.image}
                  style={{ width: '100%', height: '100%' }}
                  contentFit="contain"
                  transition={280}
                />
              </View>
              {brandBadge}
            </View>

            <View style={{ paddingTop: theme.space.sm, gap: theme.space.hair }}>
              <Text variant="subhead" numberOfLines={1}>
                {item.title}
              </Text>
              <Text variant="caption" colour="tertiary">
                {price}
              </Text>
            </View>
          </>
        )}
      </MotiPressable>
    </MotiView>
  );
}
