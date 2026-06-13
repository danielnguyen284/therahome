export type StorageKey =
  | 'therahome_token'
  | 'therahome_user'
  | 'theme_mode'
  | 'therahome_theme'
  | 'therahome_onboarding_draft'
  | 'therahome_onboarding_step'
  | 'notificationsEnabled';

const isClient = typeof window !== 'undefined';

export const storage = {
  get: <T>(key: StorageKey): T | null => {
    if (!isClient) return null;
    const value = localStorage.getItem(key);
    if (!value) return null;
    try {
      return JSON.parse(value) as T;
    } catch (e) {
      // Fallback for plain string values that are not valid JSON (e.g. raw "light" or "dark")
      return value as unknown as T;
    }
  },

  set: <T>(key: StorageKey, value: T): void => {
    if (!isClient) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(`Error writing key "${key}" to localStorage:`, e);
    }
  },

  remove: (key: StorageKey): void => {
    if (!isClient) return;
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.error(`Error removing key "${key}" from localStorage:`, e);
    }
  },

  clear: (): void => {
    if (!isClient) return;
    try {
      localStorage.clear();
    } catch (e) {
      console.error('Error clearing localStorage:', e);
    }
  }
};
