import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';
type ResolvedTheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme; // The user's setting: 'light', 'dark', or 'system'
  setTheme: (theme: Theme) => void;
  resolvedTheme: ResolvedTheme; // The actually applied theme: 'light' or 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  const [isSystemDark, setIsSystemDark] = useState(() => 
    window.matchMedia('(prefers-color-scheme: dark)').matches
  );

  // Effect to listen for OS theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setIsSystemDark(e.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Determine the actual theme to apply
  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    return theme === 'system' ? (isSystemDark ? 'dark' : 'light') : theme;
  }, [theme, isSystemDark]);

  // Effect to apply the theme class to <html> and save the user's preference
  useEffect(() => {
    const root = window.document.documentElement;
    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    if (theme === 'system') {
      localStorage.removeItem('theme');
    } else {
      localStorage.setItem('theme', theme);
    }
  }, [theme, resolvedTheme]);

  const contextValue = useMemo(() => ({ theme, setTheme, resolvedTheme }), [theme, resolvedTheme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};