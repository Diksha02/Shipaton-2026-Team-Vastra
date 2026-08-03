import Feather from '@expo/vector-icons/Feather';
import { staggerDelay } from '@vastra/design';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { MotiPressable } from 'moti/interactions';
import { useMemo } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LockedSection } from '../../src/components/LockedSection';
import { Text } from '../../src/components/Text';
import {
  BRAND_KIND_LABEL,
  brandMoments,
  communityLooks,
  formatPrice,
  itemsByIds,
  trending,
  type BrandMoment,
  type MockItem,
} from '../../src/mock/data';
import { useTheme } from '../../src/theme/ThemeProvider';

const BRAND_CARD_WIDTH = 280;
const TRENDING_CARD_WIDTH = 168;

function usePressScale() {
  return useMemo(
    () =>
      ({ pressed }: { pressed: boolean }) => {
        'worklet';
        return { scale: pressed ? 0.97 : 1 };
      },
    [],
  );
}

function SectionHeader({ title, action, index }: { title: string; action?: string; index: number }) {
  const theme = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 10 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
      style={{
        flexDirection: 'row',
        alignItems: 'baseline',
        justifyContent: 'space-between',
        paddingHorizontal: theme.layout.gutter,
        marginBottom: theme.space.base,
      }}
    >
      <Text variant="title2">{title}</Text>
      {!!action && (
        <Pressable hitSlop={10}>
          <Text variant="footnote" colour="secondary">
            {action}
          </Text>
        </Pressable>
      )}
    </MotiView>
  );
}

/** A brand moment: free try-on week, an upcoming drop, or new arrivals. */
function BrandCard({ moment, index }: { moment: BrandMoment; index: number }) {
  const theme = useTheme();
  const isFree = moment.kind === 'free_tryon';
  const animate = usePressScale();

  return (
    <MotiView
      from={{ opacity: 0, translateX: 24 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
    >
      <MotiPressable animate={animate} transition={{ type: 'timing', duration: theme.duration.instant }}>
        <View
          style={{
            width: BRAND_CARD_WIDTH,
            borderRadius: theme.radius['2xl'],
            overflow: 'hidden',
            borderWidth: theme.borderWidth.hairline,
            borderColor: isFree ? theme.colour.accentBorder : theme.colour.border,
            backgroundColor: theme.colour.surface,
            ...theme.shadow.sm,
          }}
        >
          <View
            style={{
              height: 168,
              justifyContent: 'flex-end',
              padding: theme.space.base,
              backgroundColor: theme.colour.surfaceGarment,
            }}
          >
            <View
              style={{
                position: 'absolute',
                top: 0,
                right: 0,
                bottom: 0,
                left: 0,
                paddingHorizontal: theme.space.xl,
                paddingVertical: theme.space.lg,
              }}
            >
              <Image
                source={moment.image}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={280}
              />
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: theme.space.md,
                paddingVertical: theme.space.xs,
                borderRadius: theme.radius.full,
                backgroundColor: isFree ? theme.colour.accent : theme.colour.surface,
                borderWidth: isFree ? 0 : theme.borderWidth.hairline,
                borderColor: theme.colour.border,
              }}
            >
              <Text variant="overline" colour={isFree ? 'onAccent' : 'secondary'}>
                {BRAND_KIND_LABEL[moment.kind]}
              </Text>
            </View>
          </View>

          <View style={{ paddingHorizontal: theme.space.lg, paddingVertical: theme.space.base, gap: theme.space.xs }}>
            <Text variant="overline" colour="tertiary">
              {moment.brand}
            </Text>
            <Text variant="headline">{moment.headline}</Text>
            <Text variant="footnote" colour="tertiary" numberOfLines={2}>
              {moment.detail}
            </Text>
          </View>
        </View>
      </MotiPressable>
    </MotiView>
  );
}

function TrendingCard({ item, onPress, index }: { item: MockItem; onPress: () => void; index: number }) {
  const theme = useTheme();
  const animate = usePressScale();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 16 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
    >
      <MotiPressable
        onPress={onPress}
        animate={animate}
        transition={{ type: 'timing', duration: theme.duration.instant }}
      >
        <View style={{ width: TRENDING_CARD_WIDTH, gap: theme.space.md }}>
          <View
            style={{
              height: 220,
              borderRadius: theme.radius.xl,
              overflow: 'hidden',
              backgroundColor: theme.colour.surfaceGarment,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.border,
              ...theme.shadow.sm,
            }}
          >
            <View style={{ flex: 1, padding: theme.space.lg }}>
              <Image
                source={item.image}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={280}
              />
            </View>
          </View>
          <View style={{ gap: theme.space.xs, paddingHorizontal: theme.space.hair }}>
            <Text variant="overline" colour="tertiary">
              {item.brand}
            </Text>
            <Text variant="subhead" numberOfLines={1}>
              {item.title}
            </Text>
            <Text variant="footnote" colour="secondary">
              {formatPrice(item.priceMinor, item.currency)}
            </Text>
          </View>
        </View>
      </MotiPressable>
    </MotiView>
  );
}

/** Illustrative preview behind the locked OOTD section. */
function LookStrip() {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', gap: theme.space.sm, padding: theme.space.base }}>
      {communityLooks.map((look) => (
        <View key={look.id} style={{ flex: 1, gap: theme.space.xs }}>
          <View
            style={{
              flexDirection: 'row',
              height: 128,
              borderRadius: theme.radius.lg,
              overflow: 'hidden',
              gap: theme.space.hair,
              backgroundColor: theme.colour.surfaceGarment,
            }}
          >
            {itemsByIds(look.itemIds).map((item) => (
              <Image
                key={item.id}
                source={item.image}
                style={{ flex: 1, height: '100%' }}
                contentFit="contain"
              />
            ))}
          </View>
          <Text variant="caption" colour="tertiary" numberOfLines={1}>
            {look.handle}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const gutter = theme.layout.gutter;
  const ctaPress = usePressScale();

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.space['6xl'] }}
      >
        {/*
          The masthead.

          A centred serif wordmark is the oldest pattern in fashion publishing
          and still the strongest — it reads as a title page rather than as a
          toolbar. It appears once, here, on the landing screen only; repeating
          a wordmark on every screen is what makes it stop meaning anything.
        */}
        <MotiView
          from={{ opacity: 0, translateY: -8 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: theme.duration.deliberate }}
          style={{
            paddingHorizontal: gutter,
            paddingTop: theme.space['2xl'],
            paddingBottom: theme.space.xl,
            alignItems: 'center',
          }}
        >
          <Text variant="display" style={{ letterSpacing: -0.6 }}>
            Vastra
          </Text>
          <Text variant="overline" colour="tertiary" style={{ marginTop: theme.space.sm }}>
            by you
          </Text>
          <View
            style={{
              marginTop: theme.space.lg,
              width: 28,
              height: theme.borderWidth.hairline,
              backgroundColor: theme.colour.borderStrong,
            }}
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 12 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: theme.duration.slow, delay: 80 }}
          style={{
            paddingHorizontal: gutter,
            paddingTop: theme.space.lg,
            paddingBottom: theme.space.xs,
          }}
        >
          <Text variant="overline" colour="tertiary">
            {today}
          </Text>
          <Text variant="title1" style={{ marginTop: theme.space.sm }}>
            What&apos;s new
          </Text>
        </MotiView>

        <View style={{ paddingTop: theme.space['2xl'] }}>
          <SectionHeader title="From brands" action="All" index={0} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={BRAND_CARD_WIDTH + theme.space.base}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={{
              paddingHorizontal: gutter,
              gap: theme.space.base,
              paddingVertical: theme.space.xs,
            }}
          >
            {brandMoments.map((moment, index) => (
              <BrandCard key={moment.id} moment={moment} index={index} />
            ))}
          </ScrollView>
        </View>

        <View style={{ paddingTop: theme.space['3xl'] }}>
          <SectionHeader title="Trending" action="Shop" index={1} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={TRENDING_CARD_WIDTH + theme.space.base}
            snapToAlignment="start"
            disableIntervalMomentum
            contentContainerStyle={{
              paddingHorizontal: gutter,
              gap: theme.space.base,
              paddingVertical: theme.space.xs,
            }}
          >
            {trending.map((item, index) => (
              <TrendingCard
                key={item.id}
                item={item}
                index={index}
                onPress={() => router.push(`/item/${item.id}`)}
              />
            ))}
          </ScrollView>
        </View>

        {/* Locked (§2.2): visible, illustrative, never functional and never sold. */}
        <MotiView
          from={{ opacity: 0, translateY: 14 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: theme.duration.slow, delay: 160 }}
          style={{
            paddingHorizontal: gutter,
            paddingTop: theme.space['3xl'],
            gap: theme.space.lg,
          }}
        >
          <LockedSection
            title="What others are wearing"
            blurb="Outfit videos from people whose style you follow, and the pieces that make them."
            preview={<LookStrip />}
          />

          <LockedSection
            title="Connect your brands"
            blurb="Link the labels you already wear. Early access to drops, and try before anything ships."
            preview={
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.space.sm,
                  padding: theme.space.base,
                }}
              >
                {['ACME', 'Northbound', 'Studio Nord', 'Maison Lu'].map((brand) => (
                  <View
                    key={brand}
                    style={{
                      paddingHorizontal: theme.space.md,
                      paddingVertical: theme.space.sm,
                      borderRadius: theme.radius.full,
                      borderWidth: theme.borderWidth.hairline,
                      borderColor: theme.colour.borderStrong,
                      backgroundColor: theme.colour.bg,
                    }}
                  >
                    <Text variant="subhead" colour="secondary">
                      {brand}
                    </Text>
                  </View>
                ))}
              </View>
            }
          />
        </MotiView>

        <MotiView
          from={{ opacity: 0, translateY: 16 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: theme.duration.slow, delay: 220 }}
          style={{ paddingHorizontal: gutter, paddingTop: theme.space['3xl'] }}
        >
          <MotiPressable
            onPress={() => router.push('/(tabs)/studio')}
            animate={ctaPress}
            transition={{ type: 'timing', duration: theme.duration.instant }}
          >
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: theme.space.base,
                paddingVertical: theme.space.xl,
                paddingHorizontal: theme.space.lg,
                borderRadius: theme.radius['2xl'],
                backgroundColor: theme.colour.surface,
                borderWidth: theme.borderWidth.hairline,
                borderColor: theme.colour.border,
                ...theme.shadow.sm,
              }}
            >
              <View
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: theme.radius.full,
                  backgroundColor: theme.colour.surfaceMuted,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="sliders" size={18} color={theme.colour.textPrimary} />
              </View>
              <View style={{ flex: 1, gap: theme.space.hair }}>
                <Text variant="headline">Build something</Text>
                <Text variant="footnote" colour="tertiary">
                  Style an outfit from what you already own.
                </Text>
              </View>
              <Feather name="arrow-right" size={18} color={theme.colour.textSecondary} />
            </View>
          </MotiPressable>
        </MotiView>
      </ScrollView>
    </View>
  );
}
