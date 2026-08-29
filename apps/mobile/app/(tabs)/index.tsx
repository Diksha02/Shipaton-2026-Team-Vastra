import Feather from '@expo/vector-icons/Feather';
import { staggerDelay } from '@vastra/design';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommunityLooks } from '../../src/components/CommunityLooks';
import { LockedSection } from '../../src/components/LockedSection';
import { Text } from '../../src/components/Text';
import {
  BRAND_KIND_LABEL,
  brandMoments,
  formatPrice,
  trending,
  type BrandMoment,
  type MockItem,
} from '../../src/mock/data';
import { useTheme } from '../../src/theme/ThemeProvider';

function SectionHeader({
  title,
  action,
  onAction,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useTheme();
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        paddingHorizontal: theme.layout.gutter,
        marginBottom: theme.space.md,
      }}
    >
      <Text variant="title2">{title}</Text>
      {/* An action with nowhere to go is worse than no action: it reads as
          broken. Only rendered when it actually does something. */}
      {!!action && !!onAction && (
        <Pressable hitSlop={8} onPress={onAction} accessibilityRole="button" accessibilityLabel={action}>
          <Text variant="subhead" colour="tertiary">
            {action}
          </Text>
        </Pressable>
      )}
    </View>
  );
}

/** A brand moment: free try-on week, an upcoming drop, or new arrivals. */
function BrandCard({ moment, index }: { moment: BrandMoment; index: number }) {
  const theme = useTheme();
  const isFree = moment.kind === 'free_tryon';
  const router = useRouter();

  return (
    <MotiView
      from={{ opacity: 0, translateX: 16 }}
      animate={{ opacity: 1, translateX: 0 }}
      transition={{ type: 'timing', duration: theme.duration.base, delay: staggerDelay(index) }}
    >
      <Pressable
        onPress={() => router.push({ pathname: '/brand/[slug]', params: { slug: moment.slug } })}
        accessibilityRole="button"
        accessibilityLabel={`${moment.brand}: ${moment.headline}${moment.sponsored ? '. Sponsored' : ''}`}
      >
        <View
          style={{
            width: 260,
            borderRadius: theme.radius.xl,
            overflow: 'hidden',
            borderWidth: theme.borderWidth.hairline,
            borderColor: isFree ? theme.colour.accentBorder : theme.colour.border,
            backgroundColor: theme.colour.surface,
          }}
        >
          <View
            style={{
              height: 124,
              justifyContent: 'flex-end',
              padding: theme.space.md,
              backgroundColor: theme.colour.surfaceGarment,
            }}
          >
            <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, padding: 18 }}>
              <Image
                source={moment.image}
                style={{ width: '100%', height: '100%' }}
                contentFit="contain"
                transition={200}
              />
            </View>
            <View
              style={{
                alignSelf: 'flex-start',
                paddingHorizontal: theme.space.sm,
                paddingVertical: 3,
                borderRadius: theme.radius.sm,
                backgroundColor: isFree ? theme.colour.accent : theme.colour.surface,
              }}
            >
              <Text variant="overline" colour={isFree ? 'onAccent' : 'secondary'}>
                {BRAND_KIND_LABEL[moment.kind]}
              </Text>
            </View>
          </View>

          <View style={{ padding: theme.space.base, gap: 2 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
              <Text variant="overline" colour="tertiary">
                {moment.brand}
              </Text>
              {/* Paid placements are labelled at the placement itself, in plain
                  language. The UK CAP Code and the FTC both require the label to
                  be visible up front — not on the destination, and not hidden
                  behind an info tap. */}
              {moment.sponsored && (
                <View
                  style={{
                    paddingHorizontal: 5,
                    paddingVertical: 1,
                    borderRadius: theme.radius.sm,
                    borderWidth: theme.borderWidth.hairline,
                    borderColor: theme.colour.border,
                  }}
                >
                  <Text variant="micro" colour="tertiary">
                    AD
                  </Text>
                </View>
              )}
            </View>
            <Text variant="headline">{moment.headline}</Text>
            <Text variant="caption" colour="tertiary">
              {moment.detail}
            </Text>
          </View>
        </View>
      </Pressable>
    </MotiView>
  );
}

function TrendingCard({ item, onPress }: { item: MockItem; onPress: () => void }) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress}>
      <View style={{ width: 150, gap: theme.space.sm }}>
        <View
          style={{
            height: 190,
            borderRadius: theme.radius.lg,
            overflow: 'hidden',
            backgroundColor: theme.colour.surfaceGarment,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
          }}
        >
          <View style={{ flex: 1, padding: 16 }}>
            <Image
              source={item.image}
              style={{ width: '100%', height: '100%' }}
              contentFit="contain"
              transition={200}
            />
          </View>
        </View>
        <View style={{ gap: 1 }}>
          <Text variant="overline" colour="tertiary">
            {item.brand}
          </Text>
          <Text variant="subhead" numberOfLines={1}>
            {item.title}
          </Text>
          <Text variant="caption" colour="secondary">
            {formatPrice(item.priceMinor, item.currency)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const today = new Date().toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.space['4xl'], gap: theme.space['2xl'] }}
      >
        {/*
          The masthead.

          A centred serif wordmark is the oldest pattern in fashion publishing
          and still the strongest — it reads as a title page rather than as a
          toolbar. It appears once, here, on the landing screen only; repeating
          a wordmark on every screen is what makes it stop meaning anything.
        */}
        <View
          style={{
            paddingHorizontal: theme.layout.gutter,
            paddingTop: theme.space.lg,
            paddingBottom: theme.space.lg,
            alignItems: 'center',
            borderBottomWidth: theme.borderWidth.hairline,
            borderBottomColor: theme.colour.border,
          }}
        >
          <Text variant="display" style={{ letterSpacing: 0.5 }}>
            Vastra
          </Text>
          <Text variant="overline" colour="tertiary" style={{ marginTop: theme.space.xs }}>
            by you
          </Text>

          {/* Search sits *on* the masthead rather than replacing it. The
              wordmark stays centred and undisturbed; the affordance is where a
              thumb reaches, and the row keeps its title-page reading. */}
          <Pressable
            onPress={() => router.push('/search')}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Search"
            style={{ position: 'absolute', right: theme.layout.gutter, top: theme.space.lg + 6 }}
          >
            <Feather name="search" size={20} color={theme.colour.textPrimary} />
          </Pressable>
        </View>

        <View style={{ paddingHorizontal: theme.layout.gutter }}>
          <Text variant="overline" colour="tertiary">
            {today}
          </Text>
          <Text variant="title1" style={{ marginTop: theme.space.xs }}>
            What&apos;s new
          </Text>
        </View>

        <View>
          <SectionHeader title="From brands" action="All" onAction={() => router.push('/shop')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.md }}
          >
            {brandMoments.map((moment, index) => (
              <BrandCard key={moment.id} moment={moment} index={index} />
            ))}
          </ScrollView>
        </View>

        <View>
          <SectionHeader title="Trending" action="Shop" onAction={() => router.push('/shop')} />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.md }}
          >
            {trending.map((item) => (
              <TrendingCard key={item.id} item={item} onPress={() => router.push(`/item/${item.id}`)} />
            ))}
          </ScrollView>
        </View>

        {/* Locked (§2.2): illustrative, never functional, never sold. */}
        <View>
          <SectionHeader
            title="Looks"
            action="See all"
            onAction={() => router.push('/looks')}
          />
          <CommunityLooks onOpen={() => router.push('/looks')} />
        </View>

        <View style={{ paddingHorizontal: theme.layout.gutter, gap: theme.space.base }}>
          <LockedSection
            title="Connect your brands"
            blurb="Link the labels you already wear. Early access to drops, and try before anything ships."
            preview={
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: theme.space.sm,
                  padding: theme.space.md,
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
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/studio')}
          style={{ paddingHorizontal: theme.layout.gutter }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.md,
              padding: theme.space.lg,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colour.surfaceMuted,
            }}
          >
            <Feather name="sliders" size={20} color={theme.colour.textSecondary} />
            <View style={{ flex: 1 }}>
              <Text variant="headline">Build something</Text>
              <Text variant="caption" colour="tertiary">
                Style an outfit from what you already own.
              </Text>
            </View>
            <Feather name="arrow-right" size={18} color={theme.colour.textTertiary} />
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}
