import Feather from '@expo/vector-icons/Feather';
import type { ThemeName } from '@vastra/design';
import { useRouter } from 'expo-router';
import { Alert, Pressable, ScrollView, View } from 'react-native';
import { Button } from '../../src/components/Button';
import { Chip } from '../../src/components/Chip';
import { Screen } from '../../src/components/Screen';
import { Text } from '../../src/components/Text';
import { lockedFeatures } from '../../src/mock/data';
import { PLACEMENTS } from '../../src/purchases/config';
import { presentCustomerCenter } from '../../src/purchases/paywall';
import { useOpenPaywall } from '../../src/purchases/usePaywall';
import { useAuth } from '../../src/store/auth';
import { usePosts } from '../../src/store/posts';
import { useSpaces } from '../../src/store/savedOutfits';
import { useEntitlements } from '../../src/store/entitlements';
import { useTheme, useThemeControls } from '../../src/theme/ThemeProvider';

function Row({
  icon,
  label,
  hint,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  hint?: string;
  onPress?: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={label}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingVertical: theme.space.base,
          borderBottomWidth: theme.borderWidth.hairline,
          borderBottomColor: theme.colour.border,
        }}
      >
        <Feather name={icon} size={18} color={theme.colour.textSecondary} />
        <View style={{ flex: 1 }}>
          <Text variant="body">{label}</Text>
          {!!hint && (
            <Text variant="caption" colour="tertiary">
              {hint}
            </Text>
          )}
        </View>
        <Feather name="chevron-right" size={18} color={theme.colour.textTertiary} />
      </View>
    </Pressable>
  );
}

/**
 * Locked feature tile (PROJECT.md §2.2).
 * Never presents a Buy or Unlock CTA — selling access to unbuilt functionality
 * is a store-rejection and refund risk. Only "Notify me".
 */
function LockedTile({ title, blurb }: { title: string; blurb: string }) {
  const theme = useTheme();
  return (
    <View
      style={{
        padding: theme.space.base,
        borderRadius: theme.radius.lg,
        borderWidth: theme.borderWidth.hairline,
        borderColor: theme.colour.border,
        backgroundColor: theme.colour.surfaceMuted,
        gap: theme.space.sm,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
        <Text variant="subhead" style={{ flex: 1 }}>
          {title}
        </Text>
        <View
          style={{
            paddingHorizontal: theme.space.sm,
            paddingVertical: 3,
            borderRadius: theme.radius.sm,
            backgroundColor: theme.colour.surface,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
          }}
        >
          <Text variant="overline" colour="tertiary">
            Coming soon
          </Text>
        </View>
      </View>
      <Text variant="caption" colour="tertiary">
        {blurb}
      </Text>
      <Pressable style={{ alignSelf: 'flex-start', paddingTop: theme.space.xs }}>
        <Text variant="subhead" colour="secondary">
          Notify me →
        </Text>
      </Pressable>
    </View>
  );
}

export default function ProfileScreen() {
  const authUser = useAuth((s) => s.user);
  const signOutOfAccount = useAuth((s) => s.signOut);
  const theme = useTheme();
  const router = useRouter();
  const { override, setOverride } = useThemeControls();
  const openPaywall = useOpenPaywall();
  const isPro = useEntitlements((s) => s.isPro);
  const purchasesStatus = useEntitlements((s) => s.status);
  const restore = useEntitlements((s) => s.restore);
  const spaces = useSpaces(isPro);
  const blockedHandles = usePosts((s) => s.blockedHandles);
  const unblockAuthor = usePosts((s) => s.unblockAuthor);

  const options: Array<{ label: string; value: ThemeName | null }> = [
    { label: 'System', value: null },
    { label: 'Light', value: 'light' },
    { label: 'Dark', value: 'dark' },
  ];

  return (
    <Screen title="You">
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: theme.space['4xl'], gap: theme.space.xl }}
      >
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
          <View style={{ flex: 1 }}>
            <Text variant="title2">
              {authUser?.displayName ?? authUser?.email ?? 'Your wardrobe'}
            </Text>
            <Text variant="footnote" colour="tertiary">
              {isPro
                ? 'Vastra Pro · unlimited spaces'
                : `Free plan · ${spaces.reusableUsed}/${spaces.reusableSlots} permanent · ${spaces.creditsLeft} single-use left`}
            </Text>
          </View>
        </View>

        {/* The one chromatic surface in the app. Colour means premium. */}
        <Pressable onPress={() => void openPaywall(PLACEMENTS.profileUpsell)}>
          <View
            style={{
              padding: theme.space.lg,
              borderRadius: theme.radius.xl,
              backgroundColor: theme.colour.accentSubtle,
              borderWidth: theme.borderWidth.hairline,
              borderColor: theme.colour.accentBorder,
              gap: theme.space.md,
            }}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.sm }}>
              <Feather name="star" size={16} color={theme.colour.accent} />
              <Text variant="overline" colour="accent">
                Vastra Plus
              </Text>
            </View>
            <Text variant="title2">Unlimited outfits.</Text>
            <Text variant="callout" colour="secondary">
              Every look you build, saved. Priority try-on and HD export included.
            </Text>
            <View style={{ paddingTop: theme.space.xs }}>
              <Button
                label={isPro ? 'Manage subscription' : "See what's included"}
                variant="accent"
                onPress={() => void (isPro ? presentCustomerCenter() : openPaywall())}
              />
            </View>
          </View>
        </Pressable>

        <View style={{ gap: theme.space.md }}>
          <Text variant="overline" colour="tertiary">
            Appearance
          </Text>
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
        </View>

        <View>
          <Text variant="overline" colour="tertiary" style={{ marginBottom: theme.space.xs }}>
            Account
          </Text>
          {/* Identity first: whether your wardrobe is backed up is a more
              pressing question than any setting below it. */}
          {authUser ? (
            <Row
              icon="log-out"
              label="Sign out"
              hint={authUser.email ?? authUser.displayName ?? 'Signed in'}
              onPress={() => void signOutOfAccount()}
            />
          ) : (
            <Row
              icon="log-in"
              label="Sign in"
              hint="Keep your wardrobe if you change phone"
              onPress={() => router.push('/sign-in')}
            />
          )}
          {/* Restore is a store requirement on both platforms, and the first
              thing a returning user looks for after reinstalling. */}
          <Row
            icon="refresh-cw"
            label="Restore purchases"
            hint={
              purchasesStatus === 'ready'
                ? 'Already paid? Bring it back.'
                : 'Available once purchases are set up.'
            }
            onPress={purchasesStatus === 'ready' ? () => void restore() : undefined}
          />
          <Row
            icon="heart"
            label="Saved pieces"
            hint="Things you are considering"
            onPress={() => router.push('/saved')}
          />
          <Row icon="camera" label="Your photo" hint="Used for try-on. Delete any time." />
          <Row icon="bell" label="Notifications" />
          <Row icon="shield" label="Privacy & data" />
          <Row
            icon="activity"
            label="Purchases diagnostics"
            hint="What RevenueCat actually reports"
            onPress={() => router.push('/diagnostics')}
          />
          <Row
            icon="user-x"
            label="Blocked accounts"
            hint={
              blockedHandles.length === 0
                ? 'Nobody blocked'
                : `${blockedHandles.length} blocked`
            }
            onPress={
              blockedHandles.length === 0
                ? undefined
                : () =>
                    Alert.alert(
                      'Blocked accounts',
                      blockedHandles.map((h) => `@${h}`).join(', '),
                      [
                        { text: 'Done', style: 'cancel' },
                        {
                          text: 'Unblock all',
                          onPress: () => blockedHandles.forEach((h) => unblockAuthor(h)),
                        },
                      ],
                    )
            }
          />
          <Row
            icon="trash-2"
            label="Delete account"
            hint="Removes everything, permanently."
            onPress={() => router.push('/delete-account')}
          />
        </View>

        <View style={{ gap: theme.space.md }}>
          <Text variant="overline" colour="tertiary">
            On the way
          </Text>
          {lockedFeatures.map((feature) => (
            <LockedTile key={feature.key} title={feature.title} blurb={feature.blurb} />
          ))}
        </View>
      </ScrollView>
    </Screen>
  );
}
