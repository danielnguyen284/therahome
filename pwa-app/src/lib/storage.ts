export type StorageKey =
  | 'therahome_token'
  | 'therahome_user'
  | 'theme_mode'
  | 'therahome_onboarding_draft'
  | 'notificationsEnabled';

const isClient = typeof window !== 'undefined';

export const storage = {
  get: <T>(key: StorageKey): T | null => {
    if (!isClient) return null;
    try {
      const value = localStorage.getItem(key);
      if (!value) return null;
      return JSON.parse(value) as T;
    } catch (e) {
      console.error(`Error reading key "${key}" from localStorage:`, e);
      return null;
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
