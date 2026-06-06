import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

/**
 * useTheme Hook
 * Access theme state and controls from any component
 * 
 * @returns {Object} { theme, toggleTheme, isDark, isLight }
 * 
 * @example
 * const { theme, isDark, toggleTheme } = useTheme();
 * const bgColor = isDark ? 'bg-gray-900' : 'bg-white';
 */
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};

/**
 * ThemeProvider Component
 * Wraps app to provide global theme state
 * Syncs with existing ThemeToggle component via MutationObserver
 * 
 * Features:
 * - Persists theme to localStorage
 * - Observes HTML data-theme attribute changes
 * - Provides theme state to all child components
 * 
 * @example
 * <ThemeProvider>
 *   <App />
 * </ThemeProvider>
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    // Initialize from localStorage or system preference
    const savedTheme = localStorage.getItem('theme');
    const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    const initialTheme = savedTheme || systemTheme;
    
    setTheme(initialTheme);
    applyTheme(initialTheme);
    
    // Observe changes from ThemeToggle component
    // This ensures sync when user clicks the theme toggle button
    const observer = new MutationObserver(() => {
      const currentTheme = document.documentElement.hasAttribute('data-theme') ? 'light' : 'dark';
      setTheme(currentTheme);
    });
    
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['data-theme'] 
    });
    
    return () => observer.disconnect();
  }, []);

  const applyTheme = (newTheme) => {
    if (newTheme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    applyTheme(newTheme);
  };

  const value = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
