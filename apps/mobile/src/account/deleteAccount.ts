import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDepartments } from '../store/departments';
import { useOnboardingStore } from '../store/onboarding';
import { usePosts } from '../store/posts';
import { usePreferences } from '../store/preferences';
import { useRecentSearches } from '../store/recentSearches';
import { useSavedOutfits } from '../store/savedOutfits';
import { useSizeProfile } from '../store/sizeProfile';
import { useWishlist } from '../store/wishlist';
import { authSupported, useAuth } from '../store/auth';

/**
 * Erasing everything.
 *
 * Both stores require an in-app account deletion path, and UK GDPR Article 17
 * requires erasure on request. Until this existed the Profile row was a dead
 * control — it rendered, it looked real, and it did nothing.
 *
 * Three principles here, all of which are the difference between deletion and
 * the appearance of deletion:
 *
 * 1. **Every persisted key goes.** Enumerated from AsyncStorage rather than from
 *    a hand-written list, because a list is exactly the thing that goes stale
 *    the next time someone adds a store.
 * 2. **In-memory state is reset too.** Clearing storage while a Zustand store
 *    still holds the data means the next render writes it straight back.
 * 3. **It reports honestly.** A partial failure says so rather than showing a
 *    success screen over data that is still there.
 */

export interface DeleteResult {
  ok: boolean;
  /** What could not be removed, in plain language, for the UI to show. */
  problems: string[];
}

/** Everything this app owns in device storage. */
const KEY_PREFIX = 'vastra.';

export async function deleteEverything(): Promise<DeleteResult> {
  const problems: string[] = [];

  // 1. Remote identity first. If this fails we stop short of wiping the device,
  // because local data is the only remaining way to recover the account.
  if (authSupported() && useAuth.getState().user) {
    try {
      const { getApp } = await import('@react-native-firebase/app');
      const { getAuth } = await import('@react-native-firebase/auth');
      const current = getAuth(getApp()).currentUser;
      if (current) await current.delete();
    } catch (error) {
      // Firebase requires a recent login before it will delete an account.
      const code = (error as { code?: string })?.code ?? '';
      problems.push(
        code.includes('requires-recent-login')
          ? 'For your security, sign in again before deleting your account.'
          : 'Could not delete your sign-in account. Nothing else has been removed.',
      );
      return { ok: false, problems };
    }
  }

  // 2. Detach purchases from the identity. Best effort: an entitlement living on
  // in RevenueCat is not personal data we are obliged to erase, and failing here
  // must not strand someone with an account they cannot delete.
  try {
    if (authSupported()) {
      const Purchases = (await import('react-native-purchases')).default;
      await Purchases.logOut();
    }
  } catch {
    // Deliberately swallowed — see above.
  }

  // 3. Wipe persisted storage, discovered rather than listed.
  try {
    const keys = await AsyncStorage.getAllKeys();
    const ours = keys.filter((key) => key.startsWith(KEY_PREFIX));
    if (ours.length > 0) await AsyncStorage.multiRemove(ours);
  } catch {
    problems.push('Some saved data could not be removed from this device.');
  }

  // 4. Reset what is already in memory. Without this the stores rehydrate
  // nothing but still hold the old state, and the next write puts it back.
  try {
    useSavedOutfits.setState({ outfits: [], reusableSlots: 1, singleUseGranted: 4, singleUseSpent: 0 });
    useWishlist.setState({ ids: [] });
    useRecentSearches.setState({ queries: [] });
    useDepartments.setState({ selected: [] });
    useSizeProfile.setState({ profile: {}, enabled: false });
    usePosts.setState({ posts: [] });
    // Back to a first-run app, which is what "deleted" should feel like.
    useOnboardingStore.setState({ seenWalkthrough: false });
    usePreferences.setState({
      completed: false,
      email: '',
      marketingConsent: false,
      marketingConsentAt: null,
    });
    useAuth.setState({ user: null });
  } catch {
    problems.push('The app could not fully reset. Restart it to finish.');
  }

  return { ok: problems.length === 0, problems };
}
