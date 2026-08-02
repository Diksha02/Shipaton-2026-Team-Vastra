import { staggerDelay } from '@vastra/design';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { Pressable, View } from 'react-native';
import { formatPrice, type MockItem } from '../mock/data';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

export interface GarmentTileProps {
  item: MockItem;
  index?: number;
  onPress?: () => void;
  selected?: boolean;
}

export function GarmentTile({ item, index = 0, onPress, selected = false }: GarmentTileProps) {
  const theme = useTheme();

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
