import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

type Theme = 'light' | 'dark' | 'system';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>(() => {
    return (localStorage.getItem('theme') as Theme) || 'system';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

    if (theme === 'system') {
      root.classList.remove('dark', 'light');
      root.classList.add(systemTheme);
      localStorage.removeItem('theme');
    } else {
      root.classList.remove('dark', 'light');
      root.classList.add(theme);
      localStorage.setItem('theme', theme);
    }
  }, [theme]);
  
  useEffect(() => {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      
      const handleChange = () => {
          if (theme === 'system') {
              const newSystemTheme = mediaQuery.matches ? 'dark' : 'light';
              window.document.documentElement.classList.remove('dark', 'light');
              window.document.documentElement.classList.add(newSystemTheme);
          }
      };

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);


  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const contextValue = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
