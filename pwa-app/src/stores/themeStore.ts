import { create } from 'zustand';
import { storage } from '../lib/storage';

export type FontSize = 'normal' | 'large' | 'extra-large';

interface ThemeState {
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  setTheme: (theme: 'light' | 'dark') => void;
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  theme: 'light',
  fontSize: 'large',
  toggleTheme: () => {
    set((state) => {
      const nextTheme = state.theme === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        storage.set('therahome_theme', nextTheme);
        if (nextTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
      return { theme: nextTheme };
    });
  },
  setTheme: (theme) => {
    if (typeof window !== 'undefined') {
      storage.set('therahome_theme', theme);
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    set({ theme });
  },
  setFontSize: (fontSize) => {
    if (typeof window !== 'undefined') {
      storage.set('therahome_fontsize', fontSize);
      document.documentElement.classList.remove('font-size-normal', 'font-size-large', 'font-size-extra-large');
      document.documentElement.classList.add(`font-size-${fontSize}`);
    }
    set({ fontSize });
  },
}));
