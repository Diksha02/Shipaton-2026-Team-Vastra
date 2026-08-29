import {
  InstrumentSerif_400Regular,
  useFonts as useSerifFonts,
} from '@expo-google-fonts/instrument-serif';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LoadingScreen } from '../src/components/LoadingScreen';
import { PhoneFrame } from '../src/components/PhoneFrame';
import { useAuth } from '../src/store/auth';
import { useEntitlements } from '../src/store/entitlements';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

function RootStack() {
  const theme = useTheme();

  return (
    <>
      {/* Follows the resolved theme so the clock and battery stay legible in both. */}
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
      <PhoneFrame>
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: theme.colour.bg },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="paywall"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="item/[id]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="wardrobe-grid" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen
            name="add"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen name="shop" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="saved" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="intake" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="delete-account" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="search" options={{ animation: 'slide_from_bottom' }} />
          <Stack.Screen name="brand/[slug]" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="diagnostics" options={{ animation: 'slide_from_right' }} />
          {/* Presented, not pushed: signing in is a decision you step into and
              can back out of, not a place in the navigation hierarchy. */}
          <Stack.Screen name="sign-in" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen
            name="legal"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
          <Stack.Screen
            name="post-new"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </PhoneFrame>
    </>
  );
}

export default function RootLayout() {
  // Fonts are loaded once, here. No screen ever loads a font.
  const [loaded, error] = useSerifFonts({
    InstrumentSerif_400Regular,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    // Hide on error too — a missing font should degrade to the system face,
    // never leave the user staring at a splash screen forever.
    if (loaded || error) void SplashScreen.hideAsync();
  }, [loaded, error]);

  // Configure RevenueCat and Firebase once, at start. Neither blocks render:
  // the wardrobe, Studio, outfits and feed all work signed out and unpaid, so a
  // failure here degrades one feature rather than the app.
  const configurePurchases = useEntitlements((s) => s.configure);
  const configureAuth = useAuth((s) => s.configure);
  useEffect(() => {
    void configurePurchases();
    // After purchases: signing in calls Purchases.logIn, which needs the SDK to
    // already be configured to attach the alias to the right project.
    void configureAuth();
  }, [configurePurchases, configureAuth]);

  // No artificial hold. An earlier version waited 900ms so the brand moment
  // registered; it read as slowness, which is worse than being unseen.
  const ready = loaded || error;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          {/*
            ThemeProvider wraps both states so the loading screen already knows
            whether the device is light or dark. Returning null before the
            provider mounts would flash the wrong background on a dark phone —
            the exact seam the branded loading screen exists to hide.
          */}
          {ready ? (
            <RootStack />
          ) : (
            <PhoneFrame>
              <LoadingScreen />
            </PhoneFrame>
          )}
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
