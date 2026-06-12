import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#5B9BD5',
    secondary: '#10B981',
    background: '#FFFFFF',
    surface: '#F9FAFB',
    error: '#EF4444',
    success: '#10B981',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#111827',
    onSurface: '#111827',
  },
  roundness: 16,
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#4CAF50',
    secondary: '#26A69A',
    background: '#1A1A1A',
    surface: '#2A2A2A',
    error: '#EF5350',
    success: '#66BB6A',
    onPrimary: '#FFFFFF',
    onSecondary: '#FFFFFF',
    onBackground: '#FFFFFF',
    onSurface: '#FFFFFF',
  },
  roundness: 16,
};

export const theme = lightTheme; // Default

export const lightColors = {
  // TheraHome Brand Colors (from website)
  primary: '#5B9BD5', // TheraHome Blue
  primaryDark: '#4A7FB8', // Darker Blue
  primaryLight: '#7DB3E0', // Lighter Blue
  
  secondary: '#10B981', // Emerald 500
  accent: '#F59E0B', // Amber 500
  
  background: '#FFFFFF',
  surface: '#F9FAFB',
  surfaceLight: '#F3F4F6',
  
  error: '#EF4444',
  success: '#10B981',
  warning: '#F59E0B',
  info: '#5B9BD5',
  
  text: '#111827',
  textSecondary: '#6B7280',
  textLight: '#9CA3AF',
  
  border: '#E5E7EB',
  borderLight: '#F3F4F6',
  
  // Pain levels
  painNone: '#10B981',
  painMild: '#FCD34D',
  painModerate: '#FB923C',
  painSevere: '#EF4444',
};

export const darkColors = {
  primary: '#4CAF50',
  primaryDark: '#388E3C',
  primaryLight: '#66BB6A',
  
  secondary: '#26A69A',
  accent: '#FFA726',
  
  background: '#1A1A1A',
  surface: '#2A2A2A',
  surfaceLight: '#3A3A3A',
  
  error: '#EF5350',
  success: '#66BB6A',
  warning: '#FFA726',
  info: '#4CAF50',
  
  text: '#FFFFFF',
  textSecondary: '#B0B0B0',
  textLight: '#808080',
  
  border: '#3A3A3A',
  borderLight: '#4A4A4A',
  
  // Pain levels
  painNone: '#66BB6A',
  painMild: '#FDD835',
  painModerate: '#FF9800',
  painSevere: '#EF5350',
};

export const colors = lightColors; // Default
