import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Appearance,ColorSchemeName } from 'react-native';
// FIX: Updated import for useAsyncStorage and removed direct AsyncStorage import
import { useAsyncStorage } from './useAsyncStorage';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme; // The user's setting: 'light', 'dark', or 'system'
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme; // The actually applied theme: 'light' or 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = 'vosWashTheme';

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // FIX: Use useAsyncStorage for theme state management
  const [theme, setThemeState] = useAsyncStorage<Theme>(THEME_STORAGE_KEY, 'system');
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => Appearance.getColorScheme() === 'dark');

  // Effect to listen for OS theme changes
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }: { colorScheme: ColorSchemeName }) => {
      setIsSystemDark(colorScheme === 'dark');
    });

    // Initial check in case it changed before listener was attached
    setIsSystemDark(Appearance.getColorScheme() === 'dark');
    
    return () => subscription.remove();
  }, []);

  // Determine the actual theme to apply
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    return theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme;
  }, [theme, isSystemDark]);

  // FIX: Function to set theme now simply calls setThemeState from useAsyncStorage
  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme);
    // useAsyncStorage's setValue handles the persistence logic,
    // including removing from storage if `newTheme` is 'system'
  }, [setThemeState]);

  const contextValue = useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, setTheme, resolvedTheme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};