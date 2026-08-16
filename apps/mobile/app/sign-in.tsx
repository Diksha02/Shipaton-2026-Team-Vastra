import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { MotiView } from 'moti';
import { useState } from 'react';
import { ActivityIndicator, Linking, Platform, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Aurora } from '../src/components/Aurora';
import { GoogleMark } from '../src/components/GoogleMark';
import { Text } from '../src/components/Text';
import { useAuth } from '../src/store/auth';
import { useTheme } from '../src/theme/ThemeProvider';

/** Entrance timing. Each element arrives just after the one above it, so the
 *  eye is led down the screen to the button rather than shown everything at
 *  once and left to search. */
const STAGGER = 110;

function Enter({ delay, children }: { delay: number; children: React.ReactNode }) {
  const theme = useTheme();
  return (
    <MotiView
      from={{ opacity: 0, translateY: 18 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: theme.duration.slow, delay }}
    >
      {children}
    </MotiView>
  );
}

/**
 * Sign in.
 *
 * Two decisions worth stating, because both are easy to get wrong:
 *
 * **This screen is not a gate.** The wardrobe, Studio, outfits and the feed all
 * work without an account, so demanding one before anyone has seen the app is
 * the single most reliable way to lose them. Signing in is offered with a
 * reason attached, and declining costs nothing.
 *
 * **The reason is stated, not assumed.** "Sign in to continue" tells someone
 * what to do but never why they should want to. Here the promise is concrete:
 * your wardrobe survives a lost phone.
 */
export default function SignInScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const status = useAuth((s) => s.status);
  const reason = useAuth((s) => s.reason);
  const busy = useAuth((s) => s.busy);
  const retryable = useAuth((s) => s.retryable);
  const configureAuth = useAuth((s) => s.configure);
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);

  const [error, setError] = useState<string | null>(null);

  function leave() {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)');
  }

  async function handleGoogle() {
    setError(null);
    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await signInWithGoogle();

    if (result.ok) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      leave();
      return;
    }

    // Backing out of the Google sheet is an ordinary thing to do, not an error
    // to report back at someone.
    if (result.reason === 'cancelled') return;

    setError(
      result.reason === 'no_play_services'
        ? 'This device needs Google Play Services to sign in.'
        : result.reason === 'unavailable'
          ? (reason ?? 'Sign-in is unavailable in this build.')
          : (result.message ?? 'Could not sign in. Try again.'),
    );
  }

  const disabled = busy || status !== 'ready';

  return (
    <Aurora>
      <View
        style={{
          flex: 1,
          paddingHorizontal: theme.layout.gutter,
          paddingTop: insets.top + theme.space.base,
          paddingBottom: insets.bottom + theme.space.xl,
        }}
      >
        {/* Dismiss sits top-right and quiet: available without competing with
            the thing we would rather they did. */}
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <Pressable
            onPress={leave}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Close"
          >
            <Feather name="x" size={22} color={theme.colour.textTertiary} />
          </Pressable>
        </View>

        <View style={{ flex: 1, justifyContent: 'flex-end', gap: theme.space.md }}>
          <Enter delay={STAGGER}>
            <Text variant="overline" colour="tertiary">
              वस्त्र
            </Text>
          </Enter>

          <Enter delay={STAGGER * 2}>
            {/* The serif, at size, once per screen. It is the whole brand
                signal — using it twice would spend it. */}
            <Text variant="display">
              Your wardrobe,{'\n'}by you.
            </Text>
          </Enter>

          <Enter delay={STAGGER * 3}>
            <Text variant="callout" colour="secondary" style={{ maxWidth: 320 }}>
              Sign in so your pieces, outfits and saved looks follow you to a new phone. Everything
              else works without an account.
            </Text>
          </Enter>
        </View>

        {/* The action group needs air above it. Without this the promise and
            the button touch, and the eye reads them as one block. */}
        <View style={{ gap: theme.space.md, marginTop: theme.space['2xl'] }}>
          {!!error && (
            <MotiView
              from={{ opacity: 0, translateY: 8 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={{
                flexDirection: 'row',
                gap: theme.space.sm,
                alignItems: 'flex-start',
                padding: theme.space.md,
                borderRadius: theme.radius.lg,
                backgroundColor: theme.colour.dangerSubtle,
              }}
            >
              <Feather name="alert-circle" size={15} color={theme.colour.danger} />
              <Text variant="footnote" colour="danger" style={{ flex: 1 }}>
                {error}
              </Text>
            </MotiView>
          )}

          <Enter delay={STAGGER * 4}>
            <Pressable
              onPress={() => void handleGoogle()}
              disabled={disabled}
              accessibilityRole="button"
              accessibilityLabel="Continue with Google"
              accessibilityState={{ disabled, busy }}
              style={({ pressed }) => ({
                height: 54,
                borderRadius: theme.radius.full,
                // Google's guidelines fix the button's own surface; it does not
                // follow our theme, in light mode or dark.
                backgroundColor: '#FFFFFF',
                opacity: disabled ? 0.55 : pressed ? 0.9 : 1,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'center',
                gap: theme.space.md,
                borderWidth: theme.borderWidth.hairline,
                borderColor: 'rgba(0,0,0,0.12)',
              })}
            >
              {busy ? (
                <ActivityIndicator color="#1F1F1F" />
              ) : (
                <>
                  <GoogleMark size={19} />
                  <Text
                    variant="headline"
                    style={{ color: '#1F1F1F', fontFamily: theme.fontFamily.sansMedium }}
                  >
                    Continue with Google
                  </Text>
                </>
              )}
            </Pressable>
          </Enter>

          <Enter delay={STAGGER * 5}>
            <Pressable
              onPress={leave}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Continue without an account"
              style={{ height: 44, alignItems: 'center', justifyContent: 'center' }}
            >
              <Text variant="subhead" colour="secondary">
                Continue without an account
              </Text>
            </Pressable>
          </Enter>

          <Enter delay={STAGGER * 6}>
            <Text variant="caption" colour="tertiary" align="center" style={{ lineHeight: 17 }}>
              By continuing you agree to our{' '}
              <Text
                variant="caption"
                colour="secondary"
                onPress={() => void Linking.openURL('https://vastra.app/terms')}
              >
                Terms
              </Text>{' '}
              and{' '}
              <Text
                variant="caption"
                colour="secondary"
                onPress={() => void Linking.openURL('https://vastra.app/privacy')}
              >
                Privacy Policy
              </Text>
              .
            </Text>
          </Enter>

          {/* Says why the button will not work, rather than leaving someone
              tapping a dead control. Expo Go is the common case.

              A retry is offered only when one could plausibly succeed. On web
              and in Expo Go the native module is simply absent, and a "Try
              again" that cannot ever work is worse than no button at all. */}
          {status === 'unavailable' && !!reason && (
            <View style={{ gap: theme.space.xs, alignItems: 'center' }}>
              <Text variant="caption" colour="tertiary" align="center">
                {reason}
              </Text>
              {retryable && (
                <Pressable
                  onPress={() => {
                    setError(null);
                    void configureAuth();
                  }}
                  hitSlop={10}
                  accessibilityRole="button"
                  accessibilityLabel="Try setting up sign-in again"
                  style={{ height: 32, justifyContent: 'center' }}
                >
                  <Text variant="caption" colour="secondary">
                    Try again
                  </Text>
                </Pressable>
              )}
            </View>
          )}
        </View>
      </View>
    </Aurora>
  );
}
