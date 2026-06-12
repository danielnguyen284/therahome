/**
 * Profile by Email service
 * Previously used direct Supabase REST calls.
 * Now uses the backend API.
 */
import { api } from './api';

// Get profile by email
export async function getProfileByEmail(email: string) {
  try {
    // The backend auth/me already returns current user profile
    // This function is kept for backward compatibility
    const user = await api.get('/auth/me');
    return user;
  } catch (error) {
    console.error('Get profile by email error:', error);
    return null;
  }
}

// Upsert profile by email
export async function upsertProfileByEmail(email: string, data: any) {
  try {
    return await api.post('/auth/profile/sync', data);
  } catch (error) {
    console.error('Upsert profile by email error:', error);
    throw error;
  }
}
