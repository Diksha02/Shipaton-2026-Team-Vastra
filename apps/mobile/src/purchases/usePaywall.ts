import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Platform } from 'react-native';
import { useEntitlements } from '../store/entitlements';
import type { Placement } from './config';
import { presentPaywall, type PaywallOutcome } from './paywall';

/**
 * Opens the paywall, wherever the user is.
 *
 * Tries the RevenueCat-hosted paywall first, because it is remote-configured —
 * pricing, copy and layout change from the dashboard without an app release,
 * which is what makes a price experiment possible inside the submission window.
 *
 * Falls back to our own `/paywall` screen when the SDK cannot run: on web, in
 * Expo Go, or before a key is configured. That screen carries the §6 craft
 * (loss framing, a real close button, no countdowns), so the fallback is a
 * proper experience rather than a dead end.
 */
export function useOpenPaywall() {
  const router = useRouter();
  const status = useEntitlements((s) => s.status);

  return useCallback(async (placement?: Placement): Promise<PaywallOutcome> => {
    if (Platform.OS !== 'web') {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    if (status === 'ready') {
      const outcome = await presentPaywall(placement);
      // 'unavailable' can still come back if the SDK dropped out between the
      // status read and the call. Fall through rather than showing nothing.
      if (outcome !== 'unavailable') return outcome;
    }

    router.push('/paywall');
    return 'not_presented';
  }, [router, status]);
}
