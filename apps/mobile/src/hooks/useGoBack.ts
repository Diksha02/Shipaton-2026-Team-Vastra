import { useRouter, type Href } from 'expo-router';
import { useCallback } from 'react';

/**
 * Dismiss the current screen, with somewhere to land.
 *
 * A bare `router.back()` assumes there is history behind it, which is only true
 * when the user arrived by tapping. Load one of these routes directly — a web
 * refresh, a deep link, a hot reload sitting on the page — and the stack holds
 * a single screen, so GO_BACK is dispatched with no navigator willing to handle
 * it and the back control does nothing at all.
 *
 * `replace` rather than `push` for the fallback: the screen being left should
 * not remain behind the one being opened.
 */
export function useGoBack(fallback: Href = '/(tabs)') {
  const router = useRouter();

  return useCallback(() => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    router.replace(fallback);
  }, [fallback, router]);
}
