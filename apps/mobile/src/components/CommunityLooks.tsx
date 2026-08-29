import Feather from '@expo/vector-icons/Feather';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
  Pressable,
  ScrollView,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { COLOUR_SWATCH, communityLooks, itemsByIds, type MockLook } from '../mock/data';
import { useTheme } from '../theme/ThemeProvider';
import { Text } from './Text';

const CARD_W = 150;
const GAP = 12;

/** One look, as the colours it is made of. Photographs are deliberately absent
 *  — see the note in OutfitStage about flat product shots reading as collage. */
function LookCard({ look }: { look: MockLook }) {
  const theme = useTheme();
  const colours = itemsByIds(look.itemIds).map((item) => COLOUR_SWATCH[item.colour]);

  return (
    <View style={{ width: CARD_W, gap: theme.space.sm }}>
      <View
        style={{
          height: 190,
          borderRadius: theme.radius.lg,
          overflow: 'hidden',
          flexDirection: 'row',
          gap: 2,
          padding: 2,
          backgroundColor: theme.colour.surfaceGarment,
          borderWidth: theme.borderWidth.hairline,
          borderColor: theme.colour.border,
        }}
      >
        {colours.map((colour, index) => (
          <View key={index} style={{ flex: 1, backgroundColor: colour, borderRadius: theme.radius.sm }} />
        ))}
      </View>

      <View style={{ gap: 1 }}>
        <Text variant="subhead" numberOfLines={1}>
          {look.handle}
        </Text>
        <Text variant="caption" colour="tertiary" numberOfLines={1}>
          {look.caption}
        </Text>
      </View>
    </View>
  );
}

/**
 * "What others are wearing".
 *
 * Locked in V1 (PROJECT.md §2.2): the social graph is on the cut list, so these
 * are illustrative and there is no Buy or Unlock CTA anywhere on them.
 *
 * The end card is the honest part. Rather than an infinite list that quietly
 * stops, scrolling to the end reveals — smoothly, tied to scroll position —
 * that there is more coming. That turns a dead end into an expectation, and
 * gives us somewhere real to put the Notify me action.
 */
export function CommunityLooks({ onOpen }: { onOpen: () => void }) {
  const theme = useTheme();
  const [progress, setProgress] = useState(0);

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const maxScroll = Math.max(1, contentSize.width - layoutMeasurement.width);
    // Only the last stretch counts, so the card arrives as you reach it rather
    // than fading in from the very first pixel of scroll.
    const raw = (contentOffset.x / maxScroll - 0.55) / 0.45;
    setProgress(Math.max(0, Math.min(1, raw)));
  }

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      onScroll={onScroll}
      scrollEventThrottle={16}
      contentContainerStyle={{
        paddingHorizontal: theme.layout.gutter,
        gap: GAP,
        alignItems: 'flex-start',
      }}
    >
      {communityLooks.map((look) => (
        <LookCard key={look.id} look={look} />
      ))}

      <MotiView
        animate={{
          opacity: 0.25 + progress * 0.75,
          scale: 0.94 + progress * 0.06,
          translateX: (1 - progress) * 16,
        }}
        transition={{ type: 'timing', duration: 220 }}
      >
        <View
          style={{
            width: CARD_W,
            height: 190,
            borderRadius: theme.radius.lg,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
            borderStyle: 'dashed',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.space.base,
            gap: theme.space.sm,
          }}
        >
          <Feather name="maximize-2" size={22} color={theme.colour.textTertiary} />
          <Text variant="subhead" colour="secondary" align="center">
            See the full feed
          </Text>
          <Text variant="caption" colour="tertiary" align="center">
            Scroll outfits, and shop the pieces in them.
          </Text>

          <Pressable onPress={onOpen} hitSlop={8} accessibilityRole="button" accessibilityLabel="Open the feed">
            <Text variant="subhead">Open</Text>
          </Pressable>
        </View>
      </MotiView>
    </ScrollView>
  );
}
