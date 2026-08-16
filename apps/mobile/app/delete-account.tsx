import Feather from '@expo/vector-icons/Feather';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '../src/components/Button';
import { Text } from '../src/components/Text';
import { deleteEverything } from '../src/account/deleteAccount';
import { useSavedOutfits } from '../src/store/savedOutfits';
import { useWishlist } from '../src/store/wishlist';
import { useTheme } from '../src/theme/ThemeProvider';

/**
 * Deleting your account.
 *
 * A required store feature and an Article 17 right, so it is a real screen
 * rather than an alert: someone is entitled to see exactly what disappears
 * before it does, and a two-line dialog cannot show that.
 *
 * Deliberately not obstructive. Confirmation friction exists to prevent
 * *accidents*, not to change minds — dark patterns around deletion are the thing
 * regulators actually look for. One explicit confirmation, no typing a phrase,
 * no retention offer, no discount.
 */
export default function DeleteAccountScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const outfitCount = useSavedOutfits((s) => s.outfits.length);
  const savedCount = useWishlist((s) => s.ids.length);

  const [confirming, setConfirming] = useState(false);
  const [busy, setBusy] = useState(false);
  const [problems, setProblems] = useState<string[]>([]);
  const [done, setDone] = useState(false);

  async function run() {
    setBusy(true);
    setProblems([]);
    const result = await deleteEverything();
    setBusy(false);

    if (result.ok) {
      setDone(true);
      return;
    }
    setProblems(result.problems);
    setConfirming(false);
  }

  if (done) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: theme.colour.bg,
          paddingTop: insets.top,
          paddingHorizontal: theme.layout.gutter,
          alignItems: 'center',
          justifyContent: 'center',
          gap: theme.space.base,
        }}
      >
        <MotiView from={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
          <Feather name="check-circle" size={40} color={theme.colour.textTertiary} />
        </MotiView>
        <Text variant="title2" align="center">
          Everything is gone
        </Text>
        <Text variant="callout" colour="tertiary" align="center" style={{ maxWidth: 300 }}>
          Your account and everything on this device have been deleted. Thanks for trying Vastra.
        </Text>
        <View style={{ paddingTop: theme.space.base, width: 240 }}>
          <Button label="Start fresh" onPress={() => router.replace('/(tabs)')} />
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.colour.bg, paddingTop: insets.top }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: theme.space.md,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: theme.space.md,
          paddingBottom: theme.space.base,
        }}
      >
        <Pressable onPress={() => router.back()} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back">
          <Feather name="chevron-left" size={22} color={theme.colour.textPrimary} />
        </Pressable>
        <Text variant="title2">Delete account</Text>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: theme.layout.gutter,
          paddingBottom: insets.bottom + theme.space['3xl'],
          gap: theme.space.lg,
        }}
      >
        <Text variant="callout" colour="secondary">
          This removes your account and everything stored on this device. It cannot be undone.
        </Text>

        <View
          style={{
            borderRadius: theme.radius.lg,
            borderWidth: theme.borderWidth.hairline,
            borderColor: theme.colour.border,
            backgroundColor: theme.colour.surface,
            padding: theme.space.base,
            gap: theme.space.sm,
          }}
        >
          <Text variant="overline" colour="tertiary">
            What gets deleted
          </Text>
          <Line icon="layers" text={`${outfitCount} saved ${outfitCount === 1 ? 'outfit' : 'outfits'}`} />
          <Line icon="heart" text={`${savedCount} saved ${savedCount === 1 ? 'piece' : 'pieces'}`} />
          <Line icon="grid" text="Your wardrobe and every photo in it" />
          <Line icon="user" text="Your sign-in account" />
          <Line icon="search" text="Your searches, sizes and preferences" />
        </View>

        {/* Stated plainly rather than buried. Someone deleting an account needs
            to know what does *not* vanish with it. */}
        <View
          style={{
            borderRadius: theme.radius.lg,
            backgroundColor: theme.colour.surfaceMuted,
            padding: theme.space.base,
            gap: theme.space.xs,
          }}
        >
          <Text variant="footnote" colour="secondary">
            An active subscription is billed by Google Play and is not cancelled by deleting your
            account. Cancel it in the Play Store, or you will keep being charged.
          </Text>
        </View>

        {problems.length > 0 && (
          <View
            style={{
              borderRadius: theme.radius.lg,
              backgroundColor: theme.colour.dangerSubtle,
              padding: theme.space.base,
              gap: theme.space.xs,
            }}
          >
            {problems.map((problem) => (
              <Text key={problem} variant="footnote" colour="danger">
                {problem}
              </Text>
            ))}
          </View>
        )}

        {confirming ? (
          <View style={{ gap: theme.space.sm }}>
            <Text variant="headline" align="center">
              Delete everything?
            </Text>
            <Button
              label={busy ? 'Deleting…' : 'Yes, delete my account'}
              variant="danger"
              loading={busy}
              disabled={busy}
              onPress={() => void run()}
            />
            <Button label="Keep my account" variant="ghost" onPress={() => setConfirming(false)} />
          </View>
        ) : (
          <Button label="Delete my account" variant="danger" onPress={() => setConfirming(true)} />
        )}
      </ScrollView>
    </View>
  );
}

function Line({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const theme = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: theme.space.md }}>
      <Feather name={icon} size={14} color={theme.colour.textTertiary} />
      <Text variant="footnote" colour="secondary">
        {text}
      </Text>
    </View>
  );
}
