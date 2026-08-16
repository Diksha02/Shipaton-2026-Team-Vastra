import type { PAYWALL_RESULT } from 'react-native-purchases-ui';
import { purchasesSupported, useEntitlements } from '../store/entitlements';
import { ENTITLEMENT_PRO, type Placement } from './config';

/** `react-native-purchases-ui` is a native module and is absent from Expo Go,
 *  so it is only ever loaded once we know the environment supports it. */
async function loadUi() {
  const module = await import('react-native-purchases-ui');
  return { RevenueCatUI: module.default, RESULT: module.PAYWALL_RESULT };
}

export type PaywallOutcome =
  | 'purchased'
  | 'restored'
  | 'cancelled'
  | 'not_presented'
  | 'unavailable'
  | 'error';

function toOutcome(
  result: PAYWALL_RESULT,
  RESULT: typeof import('react-native-purchases-ui').PAYWALL_RESULT,
): PaywallOutcome {
  switch (result) {
    case RESULT.PURCHASED:
      return 'purchased';
    case RESULT.RESTORED:
      return 'restored';
    case RESULT.CANCELLED:
      return 'cancelled';
    case RESULT.NOT_PRESENTED:
      return 'not_presented';
    default:
      return 'error';
  }
}

/**
 * Presents the RevenueCat-hosted paywall.
 *
 * Remote-configured on purpose: pricing, copy and layout change in the
 * dashboard without an app release, which is what makes a price experiment
 * possible inside a submission window (PROJECT.md §6, T40).
 *
 * `presentPaywallIfNeeded` checks the entitlement first, so a subscriber who
 * taps a gated action is never shown a paywall for something they already own.
 */
export async function presentPaywall(placement?: Placement): Promise<PaywallOutcome> {
  if (!purchasesSupported()) return 'unavailable';

  const { status, refresh } = useEntitlements.getState();
  if (status !== 'ready') return 'unavailable';

  try {
    // No `offering` passed, so the dashboard's *current* offering is used —
    // which is what lets pricing and packaging change without an app release.
    // To target a specific one, fetch it first (the SDK wants the whole
    // PurchasesOffering object, not an identifier):
    //   const offerings = await Purchases.getOfferings();
    //   const offering = offerings.all[OFFERING_ID];
    const { RevenueCatUI, RESULT } = await loadUi();
    const result = await RevenueCatUI.presentPaywallIfNeeded({
      requiredEntitlementIdentifier: ENTITLEMENT_PRO,
      displayCloseButton: true,
    });

    const outcome = toOutcome(result, RESULT);

    // The customer-info listener normally lands first, but refreshing here
    // removes the race on the very next render after a purchase.
    if (outcome === 'purchased' || outcome === 'restored') await refresh();

    return outcome;
  } catch {
    return 'error';
  }
}

/**
 * The Customer Center — RevenueCat's hosted subscription management.
 *
 * Worth using rather than building: it handles cancellation, refunds, plan
 * changes and "restore my purchase" consistently on both stores, and those are
 * exactly the flows that are tedious to build and costly to get wrong.
 */
export async function presentCustomerCenter(): Promise<boolean> {
  if (!purchasesSupported()) return false;

  const { status, refresh } = useEntitlements.getState();
  if (status !== 'ready') return false;

  try {
    const { RevenueCatUI } = await loadUi();
    await RevenueCatUI.presentCustomerCenter();
    // Someone may have cancelled or changed plan while in there.
    await refresh();
    return true;
  } catch {
    return false;
  }
}
