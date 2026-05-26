import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');
  const [density, setDensity] = useState(() => localStorage.getItem('density') || 'normal');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density);
    localStorage.setItem('density', density);
  }, [density]);

  const toggleTheme = () => setTheme(t => t === 'dark' ? 'light' : 'dark');
  const cycleDensity = () => setDensity(d => d === 'compact' ? 'normal' : d === 'normal' ? 'cozy' : 'compact');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, density, setDensity, cycleDensity }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
