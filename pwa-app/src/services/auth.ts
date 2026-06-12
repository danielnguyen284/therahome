import { api } from '../lib/api';
import { storage } from '../lib/storage';

export type User = {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  role: string;
  is_pro: boolean;
  age: number;
  occupation: string;
  gender: string;
  height: string;
  weight: string;
  target_weight: string;
  primary_goal: string;
  focus_area: string;
  limitations: string;
  diet_type: string;
  pain_areas: string[];
  symptoms: string[];
  surgery_history: string;
  preferred_time: string;
  notifications_enabled: boolean;
  personalized_plan_started_at?: string | null;
  personalized_plan_completed_at?: string | null;
  personalized_plan_unlock_at?: string | null;
  onboarding_completed: boolean;
  owned_devices: any[];
  created_at: string;
};

type SocialAuthResponse = {
  token: string;
  user: User;
};

async function completeSocialAuth(
  endpoint: string,
  payload: Record<string, any>
): Promise<SocialAuthResponse> {
  const data = await api.post<SocialAuthResponse>(endpoint, payload);

  if (!data?.token || !data?.user) {
    throw new Error('Phản hồi đăng nhập từ server không hợp lệ');
  }

  storage.set('therahome_token', data.token);
  storage.set('therahome_user', data.user);

  return data;
}

export async function signInWithGoogleToken(idToken: string): Promise<SocialAuthResponse> {
  try {
    if (!idToken) {
      throw new Error('Thiếu Google idToken');
    }
    return await completeSocialAuth('/auth/google', { idToken });
  } catch (error) {
    console.error('Google auth error:', error);
    throw error;
  }
}

export async function getProfile(): Promise<User | null> {
  try {
    const user = await api.get<User>('/auth/me');
    if (user) {
      storage.set('therahome_user', user);
    }
    return user;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

export async function updateProfile(updates: Record<string, any>): Promise<User> {
  try {
    const user = await api.put<User>('/auth/profile', updates);
    storage.set('therahome_user', user);
    return user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

export async function syncProfile(data: Record<string, any>) {
  try {
    const result = await api.post('/auth/profile/sync', data);
    return result;
  } catch (error) {
    console.error('Profile sync error:', error);
    throw error;
  }
}

export async function signOut() {
  try {
    storage.remove('therahome_token');
    storage.remove('therahome_user');
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

export async function isAuthenticated(): Promise<boolean> {
  try {
    const token = storage.get<string>('therahome_token');
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

export async function initAuth(): Promise<User | null> {
  try {
    const token = storage.get<string>('therahome_token');
    if (!token) return null;

    const user = await getProfile();
    if (!user) {
      storage.remove('therahome_token');
      storage.remove('therahome_user');
      return null;
    }

    storage.set('therahome_user', user);
    return user;
  } catch (error) {
    console.error('Init auth error:', error);
    storage.remove('therahome_token');
    storage.remove('therahome_user');
    return null;
  }
}
