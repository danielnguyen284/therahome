/**
 * Direct API service
 * Previously used direct REST calls to Supabase. 
 * Now proxies through the backend API.
 */
import { api } from './api';

// Insert profile (used during onboarding)
export async function directInsertProfile(profileData: any) {
  try {
    return await api.put('/auth/profile', profileData);
  } catch (error) {
    console.error('Direct insert profile error:', error);
    throw error;
  }
}

// Check if profile exists
export async function directCheckProfileExists() {
  try {
    const user = await api.get('/auth/me');
    return !!user;
  } catch (error) {
    return false;
  }
}

// Upsert profile by email (no longer needed, kept for compatibility)
export async function directUpsertProfile(profileData: any) {
  try {
    return await api.post('/auth/profile/sync', profileData);
  } catch (error) {
    console.error('Direct upsert profile error:', error);
    throw error;
  }
}
