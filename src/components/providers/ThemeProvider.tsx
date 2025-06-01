import React, { createContext, useContext, useEffect, useState } from 'react';

type ColorScheme = 'default' | 'purple' | 'blue' | 'green' | 'autumn' | 'ocean';
type Mode = 'light' | 'dark' | 'system';

interface ThemeContextType {
  colorScheme: ColorScheme;
  setColorScheme: (theme: ColorScheme) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  resolvedMode: 'light' | 'dark'; // The actual mode after resolving 'system'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

export function ThemeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize color scheme from localStorage or default
  const [colorScheme, setColorScheme] = useState<ColorScheme>(() => {
    return (localStorage.getItem('app-color-scheme') as ColorScheme) || 'default';
  });

  // Initialize mode from localStorage or system
  const [mode, setMode] = useState<Mode>(() => {
    return (localStorage.getItem('app-mode') as Mode) || 'system';
  });

  // Track the resolved mode (actual light/dark value)
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');

  const [mounted, setMounted] = useState(false);

  // Handle system theme changes
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    
    function handleChange() {
      if (mode === 'system') {
        setResolvedMode(mediaQuery.matches ? 'dark' : 'light');
      }
    }

    // Initial check
    handleChange();

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [mode]);

  // Update resolved mode when mode changes
  useEffect(() => {
    if (mode === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setResolvedMode(isDark ? 'dark' : 'light');
    } else {
      setResolvedMode(mode);
    }
  }, [mode]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    // Remove existing theme classes
    document.documentElement.classList.remove('light', 'dark');
    document.documentElement.removeAttribute('data-theme');
    
    // Apply color scheme if not default
    if (colorScheme !== 'default') {
      document.documentElement.setAttribute('data-theme', colorScheme);
    }
    
    // Apply mode
    document.documentElement.classList.add(resolvedMode);
    
    // Save to localStorage
    localStorage.setItem('app-color-scheme', colorScheme);
    localStorage.setItem('app-mode', mode);
  }, [colorScheme, mode, resolvedMode, mounted]);

  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ colorScheme, setColorScheme, mode, setMode, resolvedMode }}>
      {children}
    </ThemeContext.Provider>
  );
} 