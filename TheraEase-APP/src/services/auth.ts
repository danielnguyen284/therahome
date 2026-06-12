/**
 * Auth service - Google Sign-In + Backend JWT
 * 
 * Flow:
 * 1. User clicks Google Sign-In
 * 2. Google SDK returns idToken
 * 3. Send idToken to backend /api/auth/google
 * 4. Backend verifies with Google, creates/updates user, returns JWT
 * 5. Store JWT in AsyncStorage via api.setToken()
 */
// import * as WebBrowser from 'expo-web-browser';
// import * as Google from 'expo-auth-session/providers/google';
// import { api } from './api';

// WebBrowser.maybeCompleteAuthSession();

// const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID || 
//   '319313921698-qojr5gaoi278fps6m0peu9p787n0fj50.apps.googleusercontent.com';

// // Google Sign-In using Expo Auth Session
// export async function signInWithGoogle() {
//   try {
//     // Use Expo AuthSession for Google Sign-In
//     // This returns an idToken that we send to our backend
//     const discovery = {
//       authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
//       tokenEndpoint: 'https://oauth2.googleapis.com/token',
//     };

//     // For direct fetch approach:
//     // The mobile app should use @react-native-google-signin/google-signin
//     // or expo-auth-session depending on the setup
//     // Since the original app used Supabase's OAuth flow via WebBrowser,
//     // we'll keep using WebBrowser but redirect to our backend

//     // Alternative: Direct Google Sign-In
//     // This is a simplified approach that works with expo-auth-session
//     throw new Error('Please use the signInWithGoogleToken function with a Google ID token');
//   } catch (error) {
//     console.error('Google sign in error:', error);
//     throw error;
//   }
// }

// // Sign in with Google ID token (from Google Sign-In SDK)
// export async function signInWithGoogleToken(idToken: string) {
//   try {
//     const data = await api.post('/auth/google', { idToken });

//     // Store token and user
//     await api.setToken(data.token);
//     await api.setUser(data.user);

//     return data;
//   } catch (error) {
//     console.error('Google auth error:', error);
//     throw error;
//   }
// }

// // Get current user profile from backend
// export async function getProfile() {
//   try {
//     const user = await api.get('/auth/me');
//     return user;
//   } catch (error) {
//     console.error('Get profile error:', error);
//     return null;
//   }
// }

// // Update user profile
// export async function updateProfile(updates: any) {
//   try {
//     const user = await api.put('/auth/profile', updates);
//     await api.setUser(user);
//     return user;
//   } catch (error) {
//     console.error('Update profile error:', error);
//     throw error;
//   }
// }

// // Sync profile (background sync)
// export async function syncProfile(data: any) {
//   try {
//     const result = await api.post('/auth/profile/sync', data);
//     return result;
//   } catch (error) {
//     console.error('Profile sync error:', error);
//     throw error;
//   }
// }

// // Sign out
// export async function signOut() {
//   try {
//     await api.clearToken();
//   } catch (error) {
//     console.error('Sign out error:', error);
//   }
// }

// // Check if user is authenticated
// export async function isAuthenticated() {
//   const token = await api.getToken();
//   return !!token;
// }

// // Initialize auth state from stored token
// export async function initAuth() {
//   try {
//     await api.init();
//     const token = await api.getToken();
//     if (!token) return null;

//     // Verify token is still valid by fetching profile
//     const user = await getProfile();
//     if (user) {
//       await api.setUser(user);
//     }
//     return user;
//   } catch (error) {
//     console.error('Init auth error:', error);
//     await api.clearToken();
//     return null;
//   }
// }

import { api } from './api';

type SocialAuthResponse = {
  token: string;
  user: any;
};

async function completeSocialAuth(endpoint: string, payload: Record<string, any>): Promise<SocialAuthResponse> {
  const data = await api.post(endpoint, payload);

  if (!data?.token || !data?.user) {
    throw new Error('Phản hồi đăng nhập từ server không hợp lệ');
  }

  await api.setToken(data.token);
  await api.setUser(data.user);

  return data;
}

// Gửi Google idToken lên backend để đổi lấy JWT của hệ thống
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

// Gửi Facebook accessToken lên backend để đổi lấy JWT của hệ thống
export async function signInWithFacebookToken(accessToken: string): Promise<SocialAuthResponse> {
  try {
    if (!accessToken) {
      throw new Error('Thiếu Facebook accessToken');
    }

    return await completeSocialAuth('/auth/facebook', { accessToken });
  } catch (error) {
    console.error('Facebook auth error:', error);
    throw error;
  }
}

// Lấy profile hiện tại từ backend
export async function getProfile() {
  try {
    const user = await api.get('/auth/me');
    return user;
  } catch (error) {
    console.error('Get profile error:', error);
    return null;
  }
}

// Cập nhật hồ sơ user
export async function updateProfile(updates: Record<string, any>) {
  try {
    const user = await api.put('/auth/profile', updates);
    await api.setUser(user);
    return user;
  } catch (error) {
    console.error('Update profile error:', error);
    throw error;
  }
}

// Đồng bộ hồ sơ nền
export async function syncProfile(data: Record<string, any>) {
  try {
    const result = await api.post('/auth/profile/sync', data);
    return result;
  } catch (error) {
    console.error('Profile sync error:', error);
    throw error;
  }
}

// Đăng xuất
export async function signOut() {
  try {
    await api.clearToken();
    await api.setUser(null);
  } catch (error) {
    console.error('Sign out error:', error);
  }
}

// Kiểm tra đã đăng nhập chưa
export async function isAuthenticated() {
  try {
    const token = await api.getToken();
    return !!token;
  } catch (error) {
    console.error('Auth check error:', error);
    return false;
  }
}

// Khởi tạo auth state từ token đã lưu
export async function initAuth() {
  try {
    await api.init();

    const token = await api.getToken();
    if (!token) return null;

    const user = await getProfile();

    if (!user) {
      await api.clearToken();
      return null;
    }

    await api.setUser(user);
    return user;
  } catch (error) {
    console.error('Init auth error:', error);
    await api.clearToken();
    return null;
  }
}
