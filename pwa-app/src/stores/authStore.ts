import { create } from 'zustand';
import { User, initAuth, signOut as authSignOut, getProfile } from '../services/auth';
import { storage } from '../lib/storage';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  initialize: () => Promise<void>;
  setUser: (user: User | null) => void;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  initialize: async () => {
    if (typeof window === 'undefined') return;
    try {
      set({ isLoading: true });
      const user = await initAuth();

      if (user) {
        const token = storage.get<string>('therahome_token');
        set({
          user,
          token,
          isAuthenticated: true,
          isLoading: false,
        });
      } else {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    } catch (error) {
      console.error('Auth store initialization error:', error);
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  setUser: (user) => {
    if (user) {
      storage.set('therahome_user', user);
      set({
        user,
        isAuthenticated: true,
      });
    } else {
      storage.remove('therahome_user');
      set({
        user: null,
        isAuthenticated: false,
      });
    }
  },

  signOut: async () => {
    await authSignOut();
    set({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  },

  refreshProfile: async () => {
    try {
      const user = await getProfile();
      if (user) {
        set({ user });
      }
    } catch (error) {
      console.error('Refresh profile error in store:', error);
    }
  },
}));
