import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useCallback, useState } from 'react';
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  View,
  useWindowDimensions,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../../src/components/Button';
import { SimilarSheet } from '../../src/components/SimilarSheet';
import { Text } from '../../src/components/Text';
import { COLOUR_SWATCH, STUDIO_LAYERS, wardrobe, type StudioLayer } from '../../src/mock/data';
import { usePosts, useVisiblePosts, type Post } from '../../src/store/posts';
import { useTheme } from '../../src/theme/ThemeProvider';

/** A composed outfit as its colours, for posts made in the Studio. */
function OutfitCanvas({ post }: { post: Post }) {
  const theme = useTheme();

  const colours = STUDIO_LAYERS.map((layer: StudioLayer) => {
    const id = post.layers?.[layer];
    const item = id ? wardrobe.find((candidate) => candidate.id === id) : undefined;
    return item ? COLOUR_SWATCH[item.colour] : null;
  }).filter((c): c is string => c !== null);

  return (
    <View style={{ flex: 1, flexDirection: 'row', gap: 2, padding: 2, backgroundColor: theme.colour.bg }}>
      {colours.map((colour, index) => (
        <View key={index} style={{ flex: 1, backgroundColor: colour, borderRadius: theme.radius.md }} />
      ))}
    </View>
  );
}

/** The action rail. Icons only, right edge, thumb height — the arrangement
 *  every vertical feed has trained people to expect. */
function RailButton({
  icon,
  label,
  active,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel={label}>
      <View style={{ alignItems: 'center', gap: 4 }}>
        <MotiView animate={{ scale: active ? 1.14 : 1 }} transition={{ type: 'spring', ...theme.spring.bouncy }}>
          <Feather name={icon} size={27} color={active ? theme.colour.danger : '#FFFFFF'} />
        </MotiView>
        <Text variant="micro" style={{ color: '#FFFFFF' }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

function PostCard({ post, height, onShop }: { post: Post; height: number; onShop: () => void }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const toggleLike = usePosts((s) => s.toggleLike);
  const block = usePosts((s) => s.block);
  const blockAuthor = usePosts((s) => s.blockAuthor);
  const remove = usePosts((s) => s.remove);

  const [burst, setBurst] = useState(0);
  const isMine = post.authorHandle === '@you';

  const like = useCallback(
    (viaDoubleTap: boolean) => {
      // Double tap only ever *adds* a like. Removing one by accident while
      // double-tapping is the single most annoying bug in this pattern.
      if (viaDoubleTap && post.likedByMe) return;
      if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      toggleLike(post.id);
      if (viaDoubleTap) setBurst((n) => n + 1);
    },
    [post.id, post.likedByMe, toggleLike],
  );

  // The 2011 Instagram gesture: tap twice where your eyes already are, rather
  // than aiming for a small target.
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(280)
    .onEnd(() => like(true))
    .runOnJS(true);

  function report() {
    // Three outcomes, because reporting a post and blocking a person are
    // different needs and store policy requires both to exist.
    Alert.alert('Report this post?', 'It will be hidden immediately and reviewed.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Report', style: 'destructive', onPress: () => block(post.id) },
      {
        text: `Block @${post.authorHandle}`,
        style: 'destructive',
        onPress: () =>
          Alert.alert(
            `Block @${post.authorHandle}?`,
            'You will not see anything from them again. You can undo this in your profile.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Block', style: 'destructive', onPress: () => blockAuthor(post.authorHandle) },
            ],
          ),
      },
    ]);
  }

  function confirmDelete() {
    Alert.alert('Delete your post?', 'This cannot be undone.', [
      { text: 'Keep', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => remove(post.id) },
    ]);
  }

  return (
    <View style={{ height, backgroundColor: '#000000' }}>
      <GestureDetector gesture={doubleTap}>
        <View style={{ flex: 1 }}>
          {post.imageUri ? (
            <Image
              source={{ uri: post.imageUri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              transition={180}
            />
          ) : (
            <OutfitCanvas post={post} />
          )}

          {/* Scrims, not flat overlays. A solid panel reads as a bar sitting on
              the photo; a gradient reads as light falling away, and keeps text
              legible over any image. */}
          <LinearGradient
            colors={['rgba(0,0,0,0.55)', 'transparent']}
            style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 160 }}
            pointerEvents="none"
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.25)', 'rgba(0,0,0,0.82)']}
            locations={[0, 0.45, 1]}
            style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 340 }}
            pointerEvents="none"
          />

          {/* The heart that scales up and flies away. Keyed on a counter so
              repeated double-taps each get their own animation. */}
          {burst > 0 && (
            <MotiView
              key={burst}
              from={{ opacity: 0, scale: 0.4 }}
              animate={{ opacity: 0, scale: 1.9, translateY: -70 }}
              transition={{ type: 'timing', duration: 700 }}
              style={{
                position: 'absolute',
                top: '42%',
                alignSelf: 'center',
              }}
              pointerEvents="none"
            >
              <Feather name="heart" size={96} color="#FFFFFF" />
            </MotiView>
          )}

          <View
            style={{
              position: 'absolute',
              right: theme.space.base,
              bottom: insets.bottom + 170,
              alignItems: 'center',
              gap: theme.space.lg,
            }}
          >
            <RailButton
              icon="heart"
              label={String(post.likes)}
              active={post.likedByMe}
              onPress={() => like(false)}
            />
            <RailButton icon="shopping-bag" label="SHOP" onPress={onShop} />
            <RailButton
              icon={isMine ? 'trash-2' : 'flag'}
              label={isMine ? 'DELETE' : 'REPORT'}
              onPress={isMine ? confirmDelete : report}
            />
          </View>

          <View
            style={{
              position: 'absolute',
              left: 0,
              right: 76,
              bottom: insets.bottom + theme.space.lg,
              paddingHorizontal: theme.layout.gutter,
              gap: theme.space.md,
            }}
          >
            <View style={{ gap: 4 }}>
              <Text variant="headline" style={{ color: '#FFFFFF' }}>
                {post.authorHandle}
              </Text>
              {!!post.caption && (
                <Text variant="callout" style={{ color: 'rgba(255,255,255,0.9)' }} numberOfLines={2}>
                  {post.caption}
                </Text>
              )}
            </View>

            <Button label="Shop this look" onPress={onShop} />
          </View>
        </View>
      </GestureDetector>
    </View>
  );
}

/**
 * Looks — the vertical feed.
 *
 * Full-bleed 9:16 paging, one outfit per screen, which is the only shape
 * short-form feeds use now. Double-tap to like, gradient scrims rather than
 * flat panels, and an action rail on the right edge.
 *
 * Only moderated posts render: the filter lives in `useVisiblePosts`, not here,
 * so no future screen can accidentally show unreviewed content.
 */
export default function LooksScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const posts = useVisiblePosts();
  const [shopFor, setShopFor] = useState<Post | null>(null);

  // The feed is edge-to-edge, so it must account for the tab bar itself.
  const pageHeight = height - 72;

  return (
    <View style={{ flex: 1, backgroundColor: '#000000' }}>
      {posts.length === 0 ? (
        <EmptyFeed onPost={() => router.push('/post-new')} />
      ) : (
        <FlatList
          data={posts}
          keyExtractor={(post) => post.id}
          pagingEnabled
          snapToInterval={pageHeight}
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <PostCard post={item} height={pageHeight} onShop={() => setShopFor(item)} />
          )}
        />
      )}

      <View
        style={{
          position: 'absolute',
          top: insets.top + theme.space.sm,
          left: theme.layout.gutter,
          right: theme.layout.gutter,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text variant="title2" style={{ color: '#FFFFFF' }}>
          Looks
        </Text>

        <Pressable onPress={() => router.push('/post-new')} hitSlop={12} accessibilityRole="button" accessibilityLabel="Post an outfit">
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.sm,
              paddingHorizontal: theme.space.base,
              height: 38,
              borderRadius: theme.radius.full,
              backgroundColor: 'rgba(255,255,255,0.16)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.28)',
            }}
          >
            <Feather name="plus" size={16} color="#FFFFFF" />
            <Text variant="subhead" style={{ color: '#FFFFFF' }}>
              Post
            </Text>
          </View>
        </Pressable>
      </View>

      <SimilarSheet
        visible={shopFor !== null}
        imageUri={shopFor?.imageUri ?? null}
        onClose={() => setShopFor(null)}
      />
    </View>
  );
}

function EmptyFeed({ onPost }: { onPost: () => void }) {
  const theme = useTheme();

  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: theme.layout.gutter, gap: theme.space.md }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: theme.radius.full,
          backgroundColor: 'rgba(255,255,255,0.1)',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Feather name="camera" size={24} color="rgba(255,255,255,0.7)" />
      </View>

      <Text variant="title2" align="center" style={{ color: '#FFFFFF' }}>
        Nothing here yet
      </Text>
      <Text variant="callout" align="center" style={{ color: 'rgba(255,255,255,0.7)', maxWidth: 280 }}>
        Post an outfit and it lands here. Anyone can tap Shop this look to find
        the closest pieces to buy.
      </Text>

      <View style={{ width: 240, paddingTop: theme.space.sm }}>
        <Button label="Post your first outfit" onPress={onPost} />
      </View>
    </View>
  );
}
