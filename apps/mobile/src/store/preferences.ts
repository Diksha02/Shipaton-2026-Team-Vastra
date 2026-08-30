import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface PreferencesState {
  /** Null until storage has been read — same hydration gate as onboarding. */
  completed: boolean | null;
  email: string;
  marketingConsent: boolean;
  /** ISO timestamp when marketingConsent became true; null when false. */
  marketingConsentAt: string | null;
  hydrated: boolean;
  setEmail: (email: string) => void;
  setMarketingConsent: (consent: boolean) => void;
  complete: () => void;
  reset: () => void;
}

/**
 * Preference onboarding — captured before Google or guest.
 *
 * Departments live in `useDepartments` (the filter the catalogue already
 * understands). This store holds contact email, marketing opt-in, and whether
 * onboarding finished, so guests keep their choices for the whole session and
 * after a refresh without inventing a second department model.
 */
export const usePreferences = create<PreferencesState>()(
  persist(
    (set) => ({
      completed: null,
      email: '',
      marketingConsent: false,
      marketingConsentAt: null,
      hydrated: false,
      setEmail: (email) => set({ email }),
      setMarketingConsent: (consent) =>
        set({
          marketingConsent: consent,
          marketingConsentAt: consent ? new Date().toISOString() : null,
        }),
      complete: () => set({ completed: true }),
      reset: () =>
        set({
          completed: false,
          email: '',
          marketingConsent: false,
          marketingConsentAt: null,
        }),
    }),
    {
      name: 'vastra.preferences',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        completed: state.completed,
        email: state.email,
        marketingConsent: state.marketingConsent,
        marketingConsentAt: state.marketingConsentAt,
      }),
      onRehydrateStorage: () => (state) => {
        // Use setState so subscribers re-render (in-place mutation can leave
        // the gate stuck hidden after a hard reload).
        usePreferences.setState({
          hydrated: true,
          completed: state?.completed === true,
        });
      },
    },
  ),
);

/** True only after storage is read and preference onboarding is unfinished. */
export function useShouldShowPreferences(): boolean {
  return usePreferences((s) => s.hydrated && s.completed === false);
}

/**
 * Web QA helper: open `/?resetPreferences=1` to force the sheet again.
 * Hard reload alone does not clear AsyncStorage.
 */
export function resetPreferencesFromUrlIfRequested(): void {
  if (typeof window === 'undefined') return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('resetPreferences') !== '1') return;

  usePreferences.getState().reset();
  params.delete('resetPreferences');
  const qs = params.toString();
  const next = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
  window.history.replaceState({}, '', next);
}
