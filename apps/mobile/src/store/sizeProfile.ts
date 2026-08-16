import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SizeProfile } from '@vastra/shared';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

interface SizeProfileState {
  profile: SizeProfile;
  /** Whether "my size" filtering is switched on. Kept separate from the sizes
   *  themselves so turning the filter off does not make someone re-enter them. */
  enabled: boolean;
  hydrated: boolean;
  setSize: (scale: keyof SizeProfile, value: string | undefined) => void;
  setEnabled: (enabled: boolean) => void;
  clear: () => void;
}

/**
 * What the user wears.
 *
 * Never asked for during onboarding. Sizes are the least interesting question
 * you can put between someone and a product they have not seen yet, and the
 * filter is discoverable the moment they open Shop. Persisted because it is a
 * stable fact about a person.
 */
export const useSizeProfile = create<SizeProfileState>()(
  persist(
    (set) => ({
      profile: {},
      enabled: false,
      hydrated: false,
      setSize: (scale, value) =>
        set((state) => {
          const profile = { ...state.profile };
          if (value === undefined) delete profile[scale];
          else profile[scale] = value;
          return { profile };
        }),
      setEnabled: (enabled) => set({ enabled }),
      clear: () => set({ profile: {}, enabled: false }),
    }),
    {
      name: 'vastra.sizes',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ profile: state.profile, enabled: state.enabled }),
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

/** The profile to filter with, or undefined when the filter is off. Keeps the
 *  on/off decision in one place instead of at every call site. */
export function useActiveSizeProfile(): SizeProfile | undefined {
  const profile = useSizeProfile((s) => s.profile);
  const enabled = useSizeProfile((s) => s.enabled);
  if (!enabled) return undefined;
  return Object.values(profile).some(Boolean) ? profile : undefined;
}
