import Feather from '@expo/vector-icons/Feather';
import {
  DEPARTMENTS,
  DEPARTMENT_LABEL,
  validatePreferenceOnboarding,
  type Department,
} from '@vastra/shared';
import * as Haptics from 'expo-haptics';
import { MotiView } from 'moti';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../store/auth';
import { useDepartments } from '../store/departments';
import { usePreferences, useShouldShowPreferences } from '../store/preferences';
import { useTheme } from '../theme/ThemeProvider';
import { GoogleMark } from './GoogleMark';
import { Text } from './Text';

/**
 * Blocking preference sheet over the live app — same overlay pattern as the
 * Studio walkthrough. The main stack stays mounted underneath so Today shows
 * through the scrim; the sheet cannot be dismissed by tapping outside or
 * swiping away. At least one shopping department is required to continue.
 */
export function PreferencesGate() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const shouldShow = useShouldShowPreferences();

  const selected = useDepartments((s) => s.selected);
  const toggleDepartment = useDepartments((s) => s.toggle);

  const email = usePreferences((s) => s.email);
  const marketingConsent = usePreferences((s) => s.marketingConsent);
  const setEmail = usePreferences((s) => s.setEmail);
  const setMarketingConsent = usePreferences((s) => s.setMarketingConsent);
  const complete = usePreferences((s) => s.complete);

  const status = useAuth((s) => s.status);
  const reason = useAuth((s) => s.reason);
  const busy = useAuth((s) => s.busy);
  const signInWithGoogle = useAuth((s) => s.signInWithGoogle);

  const [error, setError] = useState<string | null>(null);

  if (!shouldShow) return null;

  const validation = validatePreferenceOnboarding({
    departments: selected,
    email,
    marketingConsent,
  });
  const canContinue = validation.ok;

  function tap(action: () => void) {
    if (Platform.OS !== 'web') void Haptics.selectionAsync();
    action();
  }

  function validate(): boolean {
    const result = validatePreferenceOnboarding({
      departments: selected,
      email,
      marketingConsent,
    });
    if (!result.ok) {
      setError(result.message);
      return false;
    }
    setError(null);
    setEmail(result.email);
    return true;
  }

  function continueAsGuest() {
    if (!validate()) return;
    complete();
  }

  async function continueWithGoogle() {
    if (!validate()) return;

    if (Platform.OS !== 'web') void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const result = await signInWithGoogle();
    if (result.ok) {
      if (Platform.OS !== 'web') {
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      complete();
      return;
    }
    if (result.reason === 'cancelled') return;

    setError(
      result.reason === 'no_play_services'
        ? 'This device needs Google Play Services to sign in.'
        : result.reason === 'unavailable'
          ? (reason ?? 'Sign-in is unavailable in this build.')
          : (result.message ?? 'Could not sign in. Try again.'),
    );
  }

  const googleDisabled = busy || status !== 'ready' || !canContinue;

  return (
    <MotiView
      from={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ type: 'timing', duration: theme.duration.base }}
      pointerEvents="box-none"
      style={{
        position: 'absolute',
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
        backgroundColor: theme.colour.scrim,
        justifyContent: 'flex-end',
        zIndex: 100,
      }}
      accessibilityViewIsModal
    >
      {/* Scrim catches taps — deliberately not dismissible. */}
      <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ maxHeight: '88%' }}
        pointerEvents="box-none"
      >
        <MotiView
          from={{ translateY: 48 }}
          animate={{ translateY: 0 }}
          transition={{ type: 'spring', ...theme.spring.gentle }}
          style={{
            backgroundColor: theme.colour.bg,
            borderTopLeftRadius: theme.radius['2xl'],
            borderTopRightRadius: theme.radius['2xl'],
            maxHeight: '100%',
            paddingTop: theme.space.lg,
            paddingBottom: insets.bottom + theme.space.base,
          }}
        >
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            bounces={false}
            contentContainerStyle={{
              paddingHorizontal: theme.space.xl,
              gap: theme.space.lg,
              paddingBottom: theme.space.sm,
            }}
          >
            <View style={{ gap: theme.space.sm }}>
              <Text variant="overline" colour="tertiary">
                वस्त्र
              </Text>
              <Text variant="title2">What are you shopping for?</Text>
              <Text variant="callout" colour="secondary">
                Pick all that apply. You can change this anytime in filters.
              </Text>
            </View>

            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: theme.space.sm }}>
              {DEPARTMENTS.map((department: Department) => {
                const active = selected.includes(department);
                return (
                  <Pressable
                    key={department}
                    onPress={() => tap(() => toggleDepartment(department))}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={DEPARTMENT_LABEL[department]}
                  >
                    <View
                      style={{
                        height: 40,
                        paddingHorizontal: theme.space.base,
                        borderRadius: theme.radius.full,
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: active ? theme.colour.actionPrimary : 'transparent',
                        borderWidth: active ? 0 : theme.borderWidth.hairline,
                        borderColor: theme.colour.border,
                      }}
                    >
                      <Text variant="subhead" colour={active ? 'onAction' : 'secondary'}>
                        {DEPARTMENT_LABEL[department]}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <View style={{ gap: theme.space.sm }}>
              <Text variant="headline">Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={theme.colour.textDisabled}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                textContentType="emailAddress"
                autoComplete="email"
                style={{
                  height: 52,
                  borderRadius: theme.radius.lg,
                  paddingHorizontal: theme.space.base,
                  backgroundColor: theme.colour.surfaceMuted,
                  borderWidth: theme.borderWidth.hairline,
                  borderColor: theme.colour.border,
                  color: theme.colour.textPrimary,
                  fontFamily: theme.fontFamily.sans,
                  fontSize: 16,
                }}
              />
              <Text variant="caption" colour="tertiary">
                Optional for guests — used for updates if you opt in below.
              </Text>
            </View>

            <Pressable
              onPress={() => tap(() => setMarketingConsent(!marketingConsent))}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: marketingConsent }}
              accessibilityLabel="Send me style tips and offers by email"
              style={{ flexDirection: 'row', alignItems: 'flex-start', gap: theme.space.md }}
            >
              <View
                style={{
                  width: 22,
                  height: 22,
                  marginTop: 1,
                  borderRadius: theme.radius.sm,
                  borderWidth: theme.borderWidth.thick,
                  borderColor: marketingConsent
                    ? theme.colour.actionPrimary
                    : theme.colour.borderStrong,
                  backgroundColor: marketingConsent ? theme.colour.actionPrimary : 'transparent',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {marketingConsent ? (
                  <Feather name="check" size={14} color={theme.colour.textOnAction} />
                ) : null}
              </View>
              <Text variant="callout" colour="secondary" style={{ flex: 1, lineHeight: 22 }}>
                Send me style tips and offers by email. I can unsubscribe anytime.
              </Text>
            </Pressable>

            {!!error && (
              <View
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
              </View>
            )}

            <View style={{ gap: theme.space.md, paddingTop: theme.space.sm }}>
              <Pressable
                onPress={() => void continueWithGoogle()}
                disabled={googleDisabled}
                accessibilityRole="button"
                accessibilityLabel="Continue with Google"
                accessibilityState={{ disabled: googleDisabled, busy }}
                style={({ pressed }) => ({
                  height: 54,
                  borderRadius: theme.radius.full,
                  backgroundColor: '#FFFFFF',
                  opacity: googleDisabled ? 0.55 : pressed ? 0.9 : 1,
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

              <Pressable
                onPress={continueAsGuest}
                disabled={!canContinue}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Continue as guest"
                style={{
                  height: 44,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: canContinue ? 1 : 0.45,
                }}
              >
                <Text variant="subhead" colour="secondary">
                  Continue as guest
                </Text>
              </Pressable>
            </View>
          </ScrollView>
        </MotiView>
      </KeyboardAvoidingView>
    </MotiView>
  );
}
