import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';
import { create } from 'zustand';

/**
 * Who is signed in.
 *
 * Firebase Auth via `@react-native-firebase`, loaded lazily for the same reason
 * RevenueCat is: Expo Go bundles a fixed set of native modules and neither is
 * among them. A top-level import there is a hard native crash at startup, not a
 * catchable error, so nothing in this file may be imported eagerly.
 *
 * This store holds identity only. It never decides what a user is *allowed* to
 * do — entitlements come from RevenueCat and, ultimately, from our own API
 * (PROJECT.md §5.4). A client that computes its own permissions is a client that
 * can be told to lie.
 */

export type AuthStatus = 'idle' | 'configuring' | 'ready' | 'unavailable';

export interface AuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoUrl: string | null;
}

export type SignInResult =
  | { ok: true; user: AuthUser }
  | { ok: false; reason: 'cancelled' | 'no_play_services' | 'unavailable' | 'failed'; message?: string };

export function authSupported(): boolean {
  if (Platform.OS === 'web') return false;
  return Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;
}

interface AuthState {
  status: AuthStatus;
  /** Why auth is unavailable, so the UI can explain rather than fail silently. */
  reason: string | null;
  /**
   * Whether retrying `configure` could plausibly help.
   *
   * The distinction matters: on web, or in Expo Go, the native module is simply
   * absent and no amount of retrying will conjure it — offering a "Try again"
   * there is a lie. A thrown error during setup is a different thing and is
   * worth another attempt.
   */
  retryable: boolean;
  user: AuthUser | null;
  /** True while a sign-in is in flight, so the button can't be double-tapped. */
  busy: boolean;

  configure: () => Promise<void>;
  signInWithGoogle: () => Promise<SignInResult>;
  signOut: () => Promise<void>;
  /** A fresh ID token for the API. Null when signed out. */
  getIdToken: (forceRefresh?: boolean) => Promise<string | null>;
}

let unsubscribe: (() => void) | null = null;

/**
 * Links purchases to the account.
 *
 * Until now RevenueCat has been issuing anonymous ids, so a purchase belongs to
 * an install rather than a person — reinstall and it is gone. Calling `logIn`
 * with the Firebase uid is what makes an entitlement follow the user onto a new
 * phone. Best-effort: a failure here must never block signing in.
 */
async function linkPurchases(uid: string | null): Promise<void> {
  if (!authSupported()) return;
  try {
    const Purchases = (await import('react-native-purchases')).default;
    if (uid) await Purchases.logIn(uid);
    else await Purchases.logOut();
  } catch {
    // Non-fatal by design. Entitlements re-sync on the next configure().
  }
}

export const useAuth = create<AuthState>((set, get) => ({
  status: 'idle',
  reason: null,
  retryable: false,
  user: null,
  busy: false,

  configure: async () => {
    const current = get().status;
    if (current === 'configuring' || current === 'ready') return;

    if (!authSupported()) {
      // Structural, not transient: the native module is not in this runtime.
      set({
        status: 'unavailable',
        retryable: false,
        reason:
          Platform.OS === 'web'
            ? 'Sign-in is not available on web.'
            : 'Sign-in needs a development build — Firebase is not in Expo Go.',
      });
      return;
    }

    set({ status: 'configuring', reason: null, retryable: false });

    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const { getApp } = await import('@react-native-firebase/app');
      const { getAuth, onAuthStateChanged } = await import('@react-native-firebase/auth');

      // The **web** OAuth client id (client_type 3 in google-services.json).
      //
      // Mandatory, and worth stating why: the Android module only calls
      // `requestIdToken(webClientId)` when this is non-empty (Utils.java). Omit
      // it and sign-in appears to work — a Google account picker, a returned
      // user — but `idToken` is null, so there is nothing to exchange for a
      // Firebase credential. Failing here, loudly, beats that silent dead end.
      const webClientId = process.env['EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID']?.trim();
      if (!webClientId) {
        set({
          status: 'unavailable',
          retryable: false,
          reason:
            'EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set. Copy the web client id from google-services.json.',
        });
        return;
      }

      GoogleSignin.configure({ webClientId, offlineAccess: false });

      const auth = getAuth(getApp());

      unsubscribe?.();
      unsubscribe = onAuthStateChanged(auth, (fbUser) => {
        const user: AuthUser | null = fbUser
          ? {
              uid: fbUser.uid,
              displayName: fbUser.displayName ?? null,
              email: fbUser.email ?? null,
              photoUrl: fbUser.photoURL ?? null,
            }
          : null;
        set({ user });
        void linkPurchases(user?.uid ?? null);
      });

      set({ status: 'ready', retryable: false });
    } catch (error) {
      // Never fatal. The wardrobe, Studio and outfits all work signed out.
      // Retryable: setup threw, which a second attempt may well survive.
      set({
        status: 'unavailable',
        retryable: true,
        reason: error instanceof Error ? error.message : 'Could not start sign-in.',
      });
    }
  },

  signInWithGoogle: async () => {
    if (get().status !== 'ready') {
      return { ok: false, reason: 'unavailable', ...(get().reason ? { message: get().reason! } : {}) };
    }
    if (get().busy) return { ok: false, reason: 'failed', message: 'Already signing in.' };

    set({ busy: true });

    // Loaded *before* the try so the catch below can classify the failure
    // against the real status codes. Destructured inside the try, they would be
    // block-scoped out of the handler that needs them.
    const google = await import('@react-native-google-signin/google-signin').catch(() => null);
    if (!google) {
      set({ busy: false });
      return { ok: false, reason: 'unavailable', message: 'Sign-in module is unavailable.' };
    }
    const { GoogleSignin, statusCodes } = google;

    try {
      const { getApp } = await import('@react-native-firebase/app');
      const { GoogleAuthProvider, getAuth, signInWithCredential } = await import(
        '@react-native-firebase/auth'
      );

      // Emulators and some devices ship without Play Services; without this the
      // failure surfaces as an opaque native error.
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

      const response = await GoogleSignin.signIn();
      // Backing out is an ordinary outcome, not an error to report.
      if (response.type === 'cancelled') return { ok: false, reason: 'cancelled' };

      const idToken = response.data?.idToken;
      if (!idToken) {
        return { ok: false, reason: 'failed', message: 'Google returned no identity token.' };
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const result = await signInWithCredential(getAuth(getApp()), credential);

      const user: AuthUser = {
        uid: result.user.uid,
        displayName: result.user.displayName ?? null,
        email: result.user.email ?? null,
        photoUrl: result.user.photoURL ?? null,
      };

      set({ user });
      await linkPurchases(user.uid);
      return { ok: true, user };
    } catch (error) {
      // Compared against the real constants, never by substring. On native these
      // values come from `NativeModule.getConstants()` and are platform codes —
      // Android reports cancellation as "12501", which contains no recognisable
      // word at all. Matching on `.includes('CANCEL')` therefore never fired on
      // Android, and every user who simply backed out of the account picker
      // would have been shown an error instead.
      const code = (error as { code?: string })?.code;
      if (code != null) {
        if (code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, reason: 'cancelled' };
        if (code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
          return { ok: false, reason: 'no_play_services' };
        }
        if (code === statusCodes.IN_PROGRESS) {
          return { ok: false, reason: 'failed', message: 'A sign-in is already in progress.' };
        }
      }
      return {
        ok: false,
        reason: 'failed',
        message: error instanceof Error ? error.message : 'Sign-in failed.',
      };
    } finally {
      set({ busy: false });
    }
  },

  signOut: async () => {
    if (get().status !== 'ready') return;
    try {
      const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
      const { getApp } = await import('@react-native-firebase/app');
      const { getAuth, signOut } = await import('@react-native-firebase/auth');

      await signOut(getAuth(getApp()));
      // Also clear Google's own cached account, or the next sign-in silently
      // reuses it and "sign out" appears not to have worked.
      await GoogleSignin.signOut();
      set({ user: null });
      await linkPurchases(null);
    } catch {
      // Signing out must always appear to succeed locally, whatever the network
      // did. Leaving someone looking signed in after they asked not to be is
      // worse than a stale token.
      set({ user: null });
    }
  },

  getIdToken: async (forceRefresh = false) => {
    if (get().status !== 'ready' || !get().user) return null;
    try {
      const { getApp } = await import('@react-native-firebase/app');
      const { getAuth } = await import('@react-native-firebase/auth');
      return (await getAuth(getApp()).currentUser?.getIdToken(forceRefresh)) ?? null;
    } catch {
      return null;
    }
  },
}));

/** The question most screens actually ask. */
export function useIsSignedIn(): boolean {
  return useAuth((s) => s.user !== null);
}
