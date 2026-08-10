import Feather from '@expo/vector-icons/Feather';
import { staggerDelay, type ThemeName } from '@vastra/design';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import type { ReactNode } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { LockedSection } from '../../src/components/LockedSection';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { FREE_SLOTS, lockedFeatures } from '../../src/mock/data';
import { useSavedOutfits } from '../../src/store/outfit';
import { useTheme, useThemeControls } from '../../src/theme/ThemeProvider';

/** Every benefit named here has to exist in V1. A paywall that promises a
 *  feature the build does not have is a refund request waiting to happen. */
const PLUS_BENEFITS = [
  'Unlimited outfit slots',
  'Priority try-on rendering',
  'HD export, no watermark',
] as const;

/** An overline plus its content, so every section on this screen shares one
 *  vertical rhythm instead of each inventing its own margin. */
function Section({
  title,
  index,
  children,
}: {
  title?: string;
  index: number;
  children: ReactNode;
}) {
  const theme = useTheme();

  return (
    <MotiView
      from={{ opacity: 0, translateY: 12 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay: staggerDelay(index) }}
      style={{ gap: theme.space.md }}
    >
      {!!title && (
        <Text variant="overline" colour="tertiary">
          {title}
        </Text>
      )}
      {children}
    </MotiView>
  );
}

/** Groups rows into a single card. Settings rows read as one object with
 *  divisions, rather than as a stack of loose lines on the page. */
function RowGroup({ children }: { children: ReactNode }) {
  const theme = useTheme();

  return (
    <View
      style={{
        borderRadius: theme.radius['2xl'],
        borderWidth: theme.borderWidth.hairline,
        borderColor: theme.colour.border,
        backgroundColor: theme.colour.surface,
        overflow: 'hidden',
      }}
    >
      {children}
    </View>
  );
}

/**
 * A settings row.
 *
 * The divider is drawn on the inner content view, so it inherits the card's
 * horizontal padding and stops short of the card edges — and `last` omits it
 * entirely, so a group never ends with a line under nothing.
 */
function Row({
  icon,
  label,
  hint,
  last = false,
  danger = false,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint?: string;
  last?: boolean;
  danger?: boolean;
  onPress?: () => void;
}) {
  const theme = useTheme();

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      {({ pressed }) => (
        <View
          style={{
            paddingHorizontal: theme.space.lg,
            backgroundColor: pressed ? theme.colour.surfacePressed : 'transparent',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: theme.space.md,
              paddingVertical: theme.space.base,
              minHeight: theme.layout.minTapTarget,
              borderBottomWidth: last ? 0 : theme.borderWidth.hairline,
              borderBottomColor: theme.colour.border,
            }}
          >
            <Feather
              name={icon}
              size={18}
              color={danger ? theme.colour.danger : theme.colour.textSecondary}
            />
            <View style={{ flex: 1, gap: theme.space.hair }}>
              <Text variant="body" colour={danger ? 'danger' : 'primary'}>
                {label}
              </Text>
              {!!hint && (
                <Text variant="caption" colour="tertiary">
                  {hint}
                </Text>
              )}
            </View>
            <Feather name="chevron-right" size={18} color={theme.colour.textTertiary} />
          </View>
        </View>
      )}
    </Pressable>
  );
}

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { override, setOverride } = useThemeControls();

  // Read from the store rather than stating a number: this screen and the
  // Outfits tab must never disagree about how full the wardrobe is.
  const used = useSavedOutfits().length;

  const options: Array<{ label: string; value: ThemeName | null }> = [
    { label: 'System', value: null },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  return (
    /* No screen title. The tab is already labelled "You" with a person icon, so
       a "You" heading above "@ujjwal" was the same thing said three times. The
       handle takes the title slot instead, at the size the other tabs use. */
    <Screen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          // Matches Home's masthead inset. Screens with a `title` get their top
          // room from the header block; this one has to ask for it.
          paddingTop: theme.space['2xl'],
          paddingBottom: theme.space['5xl'],
          gap: theme.space.xl,
        }}
      >
        <Section index={0}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.base }}>
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: theme.radius.full,
                backgroundColor: theme.colour.surfaceMuted,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: theme.borderWidth.hairline,
                borderColor: theme.colour.border,
              }}
            >
              <Feather name="user" size={24} color={theme.colour.textTertiary} />
            </View>
            <View style={{ flex: 1, gap: theme.space.hair }}>
              <Text variant="title1">@ujjwal</Text>
              <Text variant="footnote" colour="tertiary">
                Free plan · {used} of {FREE_SLOTS} slots used
              </Text>
            </View>
          </View>
        </Section>

        {/* The one chromatic surface in the app. Colour means premium, so this is
            also the most finished card on the screen. A single tap target: the
            card used to be pressable *and* contain a button to the same route. */}
        <Section index={1}>
          <View
            style={{
              padding: theme.space.lg,
              borderRadius: theme.radius['2xl'],
              backgroundColor: theme.colour.accentSubtle,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.accentBorder,
              gap: theme.space.md,
              ...theme.shadow.sm,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
              <Feather name="star" size={16} color={theme.colour.accent} />
              <Text variant="overline" colour="accent">
                Vastra Plus
              </Text>
            </View>
            <Text variant="title2">Unlimited outfits.</Text>

            <View style={{ gap: theme.space.sm }}>
              {PLUS_BENEFITS.map((benefit) => (
                <View
                  key={benefit}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}
                >
                  <Feather name="check" size={14} color={theme.colour.accent} />
                  <Text variant="callout" colour="secondary">
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <View style={{ paddingTop: theme.space.xs }}>
              <Button
                label="See what's included"
                variant="accent"
                onPress={() => router.push('/paywall')}
              />
            </View>
          </View>
        </Section>

        <Section title="Appearance" index={2}>
          <View style={{ flexDirection: 'row', gap: theme.space.sm }}>
            {options.map((option) => (
              <Chip
                key={option.label}
                label={option.label}
                selected={override === option.value}
                onPress={() => setOverride(option.value)}
              />
            ))}
          </View>
          <Text variant="caption" colour="tertiary">
            System follows your device setting.
          </Text>
        </Section>

        <Section title="Account" index={3}>
          <RowGroup>
            <Row icon="camera" label="Your photo" hint="Used for try-on. Delete any time." />
            <Row icon="bell" label="Notifications" />
            <Row icon="shield" label="Privacy & data" last />
          </RowGroup>
        </Section>

        {/* Restore is a store requirement, not a nicety: without it a subscriber
            on a new device cannot reach what they have already paid for. Both
            rows wait on the RevenueCat SDK (TASKS.md T26). */}
        <Section title="Subscription" index={4}>
          <RowGroup>
            <Row icon="refresh-cw" label="Restore purchases" />
            <Row icon="credit-card" label="Manage subscription" last />
          </RowGroup>
        </Section>

        <Section title="Legal" index={5}>
          <RowGroup>
            <Row icon="file-text" label="Terms of use" />
            <Row icon="lock" label="Privacy policy" last />
          </RowGroup>
        </Section>

        <Section title="On the way" index={6}>
          {lockedFeatures.map((feature) => (
            <LockedSection key={feature.key} title={feature.title} blurb={feature.blurb} />
          ))}
        </Section>

        {/* Its own block, last, and in danger colour — never one identical row
            away from Notifications. Deliberately inert until accounts exist
            (F13): a delete control that appears to work and does not is worse
            than one that is plainly not wired yet. */}
        <Section index={7}>
          <RowGroup>
            <Row
              icon="trash-2"
              label="Delete account"
              hint="Removes everything, permanently."
              danger
              last
            />
          </RowGroup>
        </Section>
      </ScrollView>
    </Screen>
  );
}
