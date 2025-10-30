import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react'; // FIX: Imported useCallback
import { Appearance,ColorSchemeName } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  const [theme, setThemeState] = useState<Theme>('system'); // Default to system until loaded
  const [isSystemDark, setIsSystemDark] = useState<boolean>(() => Appearance.getColorScheme() === 'dark');

  // Load theme from AsyncStorage on component mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const storedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (storedTheme) {
          setThemeState(storedTheme as Theme);
        }
      } catch (error) {
        console.error('Failed to load theme from AsyncStorage:', error);
      }
    };
    loadTheme();
  }, []);

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

  // Function to set theme and save to AsyncStorage
  const setTheme = useCallback(async (newTheme: Theme) => {
    setThemeState(newTheme);
    try {
      if (newTheme === 'system') {
        await AsyncStorage.removeItem(THEME_STORAGE_KEY);
      } else {
        await AsyncStorage.setItem(THEME_STORAGE_KEY, newTheme);
      }
    } catch (error) {
      console.error('Failed to save theme to AsyncStorage:', error);
    }
  }, []);

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