import { darkTheme, lightTheme, type Theme, type ThemeName } from '@vastra/design';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextValue {
  theme: Theme;
  /** null = use the app default, which is light. See the note below. */
  override: ThemeName | null;
  setOverride: (name: ThemeName | null) => void;
}

/**
 * Light is the default, and it does not follow the OS unless asked.
 *
 * Clothes are bought, photographed and worn in daylight, and a garment cutout
 * on a warm stone ground reads the way it would on a shop rail. The same
 * cutout on near-black reads as a product shot on a website — accurate, and
 * the wrong feeling entirely for something that is meant to be *yours*.
 *
 * Dark remains a first-class choice in Settings, and following the system is
 * still available there; it is simply not what someone gets before they have
 * expressed a preference.
 */
const DEFAULT_THEME: ThemeName = 'light';

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeName | null>(null);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: ThemeName = override ?? DEFAULT_THEME;
    return {
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      override,
      setOverride,
      system: system === 'dark' ? 'dark' : 'light',
    } as ThemeContextValue & { system: ThemeName };
  }, [override, system]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context.theme;
}

export function useThemeControls(): Omit<ThemeContextValue, 'theme'> {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useThemeControls must be used inside <ThemeProvider>');
  return { override: context.override, setOverride: context.setOverride };
}
