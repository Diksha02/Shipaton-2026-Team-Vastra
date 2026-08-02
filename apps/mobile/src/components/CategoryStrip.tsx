import * as Haptics from 'expo-haptics';
import { memo } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { STUDIO_LAYERS, STUDIO_LAYER_LABEL, type StudioLayer } from '../mock/data';
import { useActiveLayer, useLayer, useOutfitStore } from '../store/outfit';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

/**
 * One category pill.
 *
 * Deliberately text, not a thumbnail. An earlier version showed the chosen
 * garment in each category — more literal, but it put two rows of photographs
 * directly above each other, and the eye had nowhere to rest. The garments
 * below are the images; this row is the index. A filled category gets a small
 * dot, which is enough.
 *
 * Its own subscriber, so switching categories redraws two pills, not seven.
 */
const CategoryPill = memo(function CategoryPill({ layer }: { layer: StudioLayer }) {
  const theme = useTheme();
  const active = useActiveLayer() === layer;
  const filled = Boolean(useLayer(layer));
  const setActiveLayer = useOutfitStore((state) => state.setActiveLayer);

  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== 'web') void Haptics.selectionAsync();
        setActiveLayer(layer);
      }}
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${STUDIO_LAYER_LABEL[layer]}${filled ? ', chosen' : ''}`}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 6,
          paddingHorizontal: theme.space.md + 2,
          height: 34,
          borderRadius: theme.radius.full,
          backgroundColor: active ? theme.colour.actionPrimary : 'transparent',
        }}
      >
        {filled && (
          <View
            style={{
              width: 5,
              height: 5,
              borderRadius: 3,
              backgroundColor: active ? theme.colour.textOnAction : theme.colour.textTertiary,
            }}
          />
        )}
        <Text variant="subhead" colour={active ? 'onAction' : 'tertiary'}>
          {STUDIO_LAYER_LABEL[layer]}
        </Text>
      </View>
    </Pressable>
  );
});

/** The category index. Horizontal, quiet, above the garments it filters. */
export function CategoryStrip() {
  const theme = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // Without an explicit height and flexGrow:0 a horizontal ScrollView
      // expands to fill the column, which is what opened the dead gaps.
      style={{ flexGrow: 0, flexShrink: 0, height: 40 }}
      contentContainerStyle={{
        paddingHorizontal: theme.layout.gutter,
        gap: theme.space.xs,
        alignItems: 'center',
      }}
    >
      {STUDIO_LAYERS.map((layer) => (
        <CategoryPill key={layer} layer={layer} />
      ))}
    </ScrollView>
  );
}
