import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { MD3DarkTheme, MD3LightTheme, PaperProvider } from 'react-native-paper';

const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6B4EE6',
    secondary: '#FF5C5C',
    tertiary: '#00C6AE',
    accent: '#FFA73B',
    background: '#FFFFFF',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    onSurface: '#1A1A1A',
    onSurfaceVariant: '#666666',
    onBackground: '#1A1A1A',
  },
};

const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#9B7EFF',
    secondary: '#FF8080',
    tertiary: '#40E0D0',
    accent: '#FFB366',
    background: '#121212',
    surface: '#1E1E1E',
    surfaceVariant: '#2C2C2C',
    onSurface: '#FFFFFF',
    onSurfaceVariant: '#AAAAAA',
    onBackground: '#FFFFFF',
  },
};

type ThemeContextType = {
  isDarkMode: boolean;
  toggleTheme: () => void;
  theme: typeof lightTheme | typeof darkTheme;
};

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: false,
  toggleTheme: () => {},
  theme: lightTheme,
});

export const ThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const systemColorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(systemColorScheme === 'dark');

  useEffect(() => {
    setIsDarkMode(systemColorScheme === 'dark');
  }, [systemColorScheme]);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      <PaperProvider theme={theme}>
        {children}
      </PaperProvider>
    </ThemeContext.Provider>
  );
};

export const useThemeContext = () => useContext(ThemeContext);

export default ThemeContext; 