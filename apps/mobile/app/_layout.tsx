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
import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BrandIntro } from '../src/components/LoadingScreen';
import { PhoneFrame } from '../src/components/PhoneFrame';
import { ThemeProvider, useTheme } from '../src/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

function RootStack() {
  const theme = useTheme();

  return (
    <>
      {/* Follows the resolved theme so the clock and battery stay legible in both. */}
      <StatusBar style={theme.name === 'dark' ? 'light' : 'dark'} />
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
        <Stack.Screen
          name="item/[id]"
          options={{
            presentation: 'transparentModal',
            animation: 'fade',
            contentStyle: { backgroundColor: 'transparent' },
          }}
        />
        <Stack.Screen name="wardrobe-grid" options={{ animation: 'slide_from_right' }} />
      </Stack>
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
  const [introDone, setIntroDone] = useState(false);

  const fontsReady = Boolean(loaded || error);
  const finishIntro = useCallback(() => setIntroDone(true), []);

  useEffect(() => {
    // Reveal the branded intro immediately so the mark is not trapped under
    // the OS splash. The mark is an image and does not need fonts.
    void SplashScreen.hideAsync();
  }, []);

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
          <PhoneFrame>
            <View style={styles.stage}>
              {/* Mount Today as soon as fonts resolve, still under the intro.
                  The V overlay itself never remounts — that flash was the bug. */}
              {fontsReady ? <RootStack /> : null}
              {!introDone && (
                <BrandIntro readyToZoom={fontsReady} onComplete={finishIntro} />
              )}
            </View>
          </PhoneFrame>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  stage: {
    flex: 1,
  },
});
