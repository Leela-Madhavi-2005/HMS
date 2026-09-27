import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }) {
  // Check localStorage or default to 'blue'
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('medicare-theme');
    return savedTheme ? savedTheme : 'blue';
  });

  useEffect(() => {
    // Save theme to localStorage
    localStorage.setItem('medicare-theme', theme);
    // Apply theme class to body
    document.body.className = `theme-${theme}`;
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'blue' ? 'white' : 'blue'));
  };

  const value = {
    theme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}
