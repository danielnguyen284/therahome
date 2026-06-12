/**
 * Profile sync service
 * Handles background profile synchronization with backend API
 */
import { api } from './api';

// Check if profile exists for current user
export async function checkProfileExists() {
  try {
    const user = await api.get('/auth/me');
    return !!user;
  } catch (error) {
    return false;
  }
}

// Sync profile data to backend
export async function syncProfileToBackend(profileData: any) {
  try {
    const result = await api.post('/auth/profile/sync', profileData);
    return result;
  } catch (error) {
    console.error('Profile sync error:', error);
    throw error;
  }
}

// Upsert profile (create or update)
export async function upsertProfile(data: {
  full_name?: string;
  age?: number;
  occupation?: string;
  gender?: string;
  height?: string;
  weight?: string;
  target_weight?: string;
  primary_goal?: string;
  focus_area?: string;
  limitations?: string;
  diet_type?: string;
  pain_areas?: string[];
  symptoms?: string[];
  surgery_history?: string;
  preferred_time?: string;
  notifications_enabled?: boolean;
  avatar_url?: string;
}) {
  try {
    return await api.put('/auth/profile', data);
  } catch (error) {
    console.error('Upsert profile error:', error);
    throw error;
  }
}
