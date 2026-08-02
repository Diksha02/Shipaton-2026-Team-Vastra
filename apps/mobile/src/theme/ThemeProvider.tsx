import { darkTheme, lightTheme, type Theme, type ThemeName } from '@vastra/design';
import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { useColorScheme } from 'react-native';

interface ThemeContextValue {
  theme: Theme;
  /** null = follow the OS. PROJECT.md design decision: light and dark are peers. */
  override: ThemeName | null;
  setOverride: (name: ThemeName | null) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const system = useColorScheme();
  const [override, setOverride] = useState<ThemeName | null>(null);

  const value = useMemo<ThemeContextValue>(() => {
    const resolved: ThemeName = override ?? (system === 'dark' ? 'dark' : 'light');
    return {
      theme: resolved === 'dark' ? darkTheme : lightTheme,
      override,
      setOverride,
    };
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
