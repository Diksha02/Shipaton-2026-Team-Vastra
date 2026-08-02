import { FlashList } from '@shopify/flash-list';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { MotiView } from 'moti';
import { useCallback } from 'react';
import {
  Platform,
  Pressable,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import type { MockItem } from '../mock/data';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

const CARD = 108;
const GAP = 14;
const INTERVAL = CARD + GAP;

export interface LayerCarouselProps {
  items: MockItem[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}

/**
 * The garment picker.
 *
 * Cards are large and the centred one sits at full size while its neighbours
 * shrink back — so the row reads as one thing being considered, with
 * alternatives either side, rather than as a grid of equal options. Snapping
 * makes browsing and choosing the same gesture.
 *
 * FlashList rather than FlatList: it recycles rows instead of mounting every
 * item, which is what holds 60fps once a wardrobe has hundreds of garments.
 */
export function LayerCarousel({ items, selectedId, onSelect }: LayerCarouselProps) {
  const theme = useTheme();
  const { width } = useWindowDimensions();

  // Side padding that lets the first and last card reach dead centre.
  const sidePad = Math.max(theme.layout.gutter, (Math.min(width, 430) - CARD) / 2);

  // A leading "none" entry, so a category can be deliberately empty — not every
  // outfit has a coat.
  const entries: Array<MockItem | null> = [null, ...items];

  const select = useCallback(
    (id: string | null) => {
      if (id === selectedId) return;
      // Haptics are the difference between "the list moved" and "I chose that".
      if (Platform.OS !== 'web') void Haptics.selectionAsync();
      onSelect(id);
    },
    [onSelect, selectedId],
  );

  const handleSettle = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(event.nativeEvent.contentOffset.x / INTERVAL);
      const entry = entries[Math.max(0, Math.min(index, entries.length - 1))];
      select(entry ? entry.id : null);
    },
    [entries, select],
  );

  // NOTE: `initialScrollIndex` would open the row on the current selection, but
  // it breaks FlashList v2's first render pass here — every card mounts blank.
  // Left off deliberately; the selected card is still obvious from its scale.
  return (
    <View style={{ height: CARD + 16 }}>
      <FlashList
        data={entries}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(entry, index) => entry?.id ?? `none-${index}`}
        snapToInterval={INTERVAL}
        decelerationRate="fast"
        onMomentumScrollEnd={handleSettle}
        contentContainerStyle={{ paddingHorizontal: sidePad }}
        renderItem={({ item: entry }) => {
          const selected = (entry?.id ?? null) === selectedId;

          return (
            <Pressable onPress={() => select(entry?.id ?? null)} style={{ marginRight: GAP }}>
              <MotiView
                animate={{ scale: selected ? 1 : 0.84, opacity: selected ? 1 : 0.55 }}
                transition={{ type: 'spring', ...theme.spring.responsive }}
              >
                <View
                  style={{
                    width: CARD,
                    height: CARD,
                    borderRadius: theme.radius.lg,
                    overflow: 'hidden',
                    backgroundColor: entry ? theme.colour.surfaceGarment : theme.colour.surface,
                    borderWidth: entry ? 0 : theme.borderWidth.hairline,
                    borderColor: theme.colour.border,
                    borderStyle: entry ? 'solid' : 'dashed',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {entry ? (
                    <View style={{ width: '100%', height: '100%', padding: 10 }}>
                      <Image
                        source={entry.thumb}
                        style={{ width: '100%', height: '100%' }}
                        contentFit="contain"
                        transition={140}
                        cachePolicy="memory-disk"
                      />
                    </View>
                  ) : (
                    <View style={{ alignItems: 'center', gap: 4 }}>
                      <Feather name="minus" size={16} color={theme.colour.textTertiary} />
                      <Text variant="micro" colour="tertiary">
                        NONE
                      </Text>
                    </View>
                  )}
                </View>
              </MotiView>
            </Pressable>
          );
        }}
      />
    </View>
  );
}
