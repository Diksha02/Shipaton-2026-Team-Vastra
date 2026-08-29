import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
// Type-only: erased at build time, so this never pulls the native module in.
import type { CustomerInfo } from 'react-native-purchases';
import { create } from 'zustand';
import { ENTITLEMENT_PRO, resolveApiKey } from '../purchases/config';

export type PurchasesStatus = 'idle' | 'configuring' | 'ready' | 'unavailable';

/**
 * Expo Go bundles a fixed set of native modules and RevenueCat is not among
 * them. Importing the SDK at module scope there crashes the host app at start —
 * a hard native crash, not a catchable error. So the SDK is only ever loaded
 * lazily, and only once we know the environment can support it.
 */
export function purchasesSupported(): boolean {
  if (Platform.OS === 'web') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

async function loadSdk() {
  // Dynamic import: never evaluated in Expo Go or on web.
  const module = await import('react-native-purchases');
  return module.default;
}

interface EntitlementState {
  status: PurchasesStatus;
  /** Why the SDK is unavailable, so the UI can explain rather than fail silently. */
  reason: string | null;
  isPro: boolean;
  expiresAt: string | null;
  managementUrl: string | null;
  customerInfo: CustomerInfo | null;

  configure: () => Promise<void>;
  refresh: () => Promise<void>;
  restore: () => Promise<{ ok: boolean; isPro: boolean; error?: string }>;
}

function readEntitlement(info: CustomerInfo) {
  const pro = info.entitlements.active[ENTITLEMENT_PRO];
  return {
    isPro: Boolean(pro),
    expiresAt: pro?.expirationDate ?? null,
    managementUrl: info.managementURL ?? null,
  };
}

/**
 * Purchase state.
 *
 * Deliberately read-only about *money*: nothing here decides what a user has
 * paid for. It mirrors what RevenueCat reports, and PROJECT.md §5.4 keeps the
 * server authoritative for what that entitlement actually grants. A client that
 * computes its own entitlements is a client that can be told to lie.
 *
 * `addCustomerInfoUpdateListener` is what keeps this current without polling:
 * renewals, expiries, refunds, and purchases made on another device all arrive
 * through it.
 */
export const useEntitlements = create<EntitlementState>((set, get) => ({
  status: 'idle',
  reason: null,
  isPro: false,
  expiresAt: null,
  managementUrl: null,
  customerInfo: null,

  configure: async () => {
    const current = get().status;
    if (current === 'configuring' || current === 'ready') return;

    if (!purchasesSupported()) {
      set({
        status: 'unavailable',
        reason:
          Platform.OS === 'web'
            ? 'Purchases are not available on web.'
            : 'Purchases need a development build — the SDK is not in Expo Go.',
      });
      return;
    }

    const apiKey = resolveApiKey();
    if (!apiKey) {
      set({
        status: 'unavailable',
        reason: 'No RevenueCat key configured. Set EXPO_PUBLIC_REVENUECAT_TEST_KEY in .env.',
      });
      return;
    }

    set({ status: 'configuring', reason: null });

    try {
      const Purchases = await loadSdk();
      const { LOG_LEVEL } = await import('react-native-purchases');

      if (__DEV__) await Purchases.setLogLevel(LOG_LEVEL.DEBUG);

      // No appUserID here on purpose. RevenueCat issues an anonymous id, and
      // `useAuth` calls `Purchases.logIn(uid)` once Firebase reports a user —
      // which is what aliases the anonymous purchases onto the account and lets
      // an entitlement follow someone to a new phone. Passing an id at
      // configure time instead would strand purchases made before sign-in.
      await Purchases.configure({ apiKey });

      Purchases.addCustomerInfoUpdateListener((info: CustomerInfo) => {
        set({ customerInfo: info, ...readEntitlement(info) });
      });

      const info = await Purchases.getCustomerInfo();
      set({ status: 'ready', customerInfo: info, ...readEntitlement(info) });

      // Subscriber attributes are what Targeting and Experiments segment on.
      // Without them every user looks identical and audience targeting cannot
      // do anything. Deliberately non-identifying — no email, no name, until
      // the user has an account and has agreed to it.
      try {
        await Purchases.setAttributes({
          platform: Platform.OS,
          app_version: Constants.expoConfig?.version ?? 'unknown',
        });
      } catch {
        // Attributes are an optimisation, never a reason to fail configuration.
      }
    } catch (error) {
      // Never fatal. Everything except purchasing works without RevenueCat.
      set({
        status: 'unavailable',
        reason: error instanceof Error ? error.message : 'Could not reach RevenueCat.',
      });
    }
  },

  refresh: async () => {
    if (get().status !== 'ready') return;
    try {
      const Purchases = await loadSdk();
      const info = await Purchases.getCustomerInfo();
      set({ customerInfo: info, ...readEntitlement(info) });
    } catch {
      // Non-fatal: the cached entitlement stands. Losing a network round-trip
      // must never revoke access someone has paid for.
    }
  },

  restore: async () => {
    if (get().status !== 'ready') {
      return { ok: false, isPro: false, error: get().reason ?? 'Purchases unavailable.' };
    }
    try {
      const Purchases = await loadSdk();
      const info = await Purchases.restorePurchases();
      const next = readEntitlement(info);
      set({ customerInfo: info, ...next });
      return { ok: true, isPro: next.isPro };
    } catch (error) {
      return {
        ok: false,
        isPro: get().isPro,
        error: error instanceof Error ? error.message : 'Restore failed.',
      };
    }
  },
}));

/** The only question most screens need to ask. */
export function useIsPro(): boolean {
  return useEntitlements((s) => s.isPro);
}
