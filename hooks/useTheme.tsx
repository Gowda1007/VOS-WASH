import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    // This function applies the correct class based on the currently selected theme
    // and the system preference.
    const applyTheme = (selectedTheme: Theme) => {
      const systemIsDark = mediaQuery.matches;
      const isDark = selectedTheme === 'dark' || (selectedTheme === 'system' && systemIsDark);
      
      root.classList.toggle('dark', isDark);

      if (selectedTheme === 'system') {
        localStorage.removeItem('theme');
      } else {
        localStorage.setItem('theme', selectedTheme);
      }
    };

    // Apply the theme when the component mounts or when the user changes the theme.
    applyTheme(theme);

    // This handler listens for changes in the system's color scheme.
    const handleSystemThemeChange = () => {
      // We only need to react if the user's preference is 'system'.
      // We check localStorage directly to avoid stale closures on the 'theme' state variable.
      const currentThemeSetting = (localStorage.getItem('theme') as Theme) || 'system';
      if (currentThemeSetting === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleSystemThemeChange);
    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange);
    };
  }, [theme]); // This effect re-runs only when the user explicitly changes the theme.

  const contextValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    // Correcting the error message to be more accurate
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
