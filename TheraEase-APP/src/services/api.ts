import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';

function getDevServerHost() {
  const possibleHostUris = [
    Constants.expoConfig?.hostUri,
    (Constants as any).expoGoConfig?.debuggerHost,
    (Constants as any).manifest?.debuggerHost,
    Constants.platform?.hostUri,
  ].filter(Boolean) as string[];

  for (const hostUri of possibleHostUris) {
    const host = hostUri.split(':')[0]?.trim();
    if (host && host !== 'localhost' && host !== '127.0.0.1') {
      return host;
    }
  }

  return null;
}

function resolveApiBase() {
  const fallbackBase = 'http://localhost:5001/api';
  const configuredBase = process.env.EXPO_PUBLIC_API_URL?.trim() || fallbackBase;

  try {
    const parsed = new URL(configuredBase);
    if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
      const devHost = getDevServerHost();
      if (devHost) {
        parsed.hostname = devHost;
        return parsed.toString().replace(/\/$/, '');
      }
    }
  } catch (error) {
    console.warn('Resolve API base error:', error);
  }

  return configuredBase;
}

const API_BASE = resolveApiBase();

const TOKEN_KEY = 'therahome_token';
const USER_KEY = 'therahome_user';

class ApiClient {
  private token: string | null = null;

  async init() {
    this.token = await AsyncStorage.getItem(TOKEN_KEY);
  }

  async getToken(): Promise<string | null> {
    if (!this.token) {
      this.token = await AsyncStorage.getItem(TOKEN_KEY);
    }
    return this.token;
  }

  private async getHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleResponse<T>(res: Response): Promise<T> {
    if (!res.ok) {
      const contentType = res.headers.get('content-type') || '';

      if (contentType.includes('application/json')) {
        const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }));
        throw new Error(error.error || `HTTP ${res.status}`);
      }

      const text = await res.text().catch(() => '');
      if (text.includes('Cannot GET') || text.includes('Cannot POST') || text.includes('Cannot PUT') || text.includes('Cannot DELETE')) {
        throw new Error(`Endpoint chưa tồn tại trên backend (${res.status})`);
      }

      throw new Error(text || `HTTP ${res.status}`);
    }

    return res.json();
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, { headers });
    } catch (error) {
      throw new Error(`Không kết nối được tới backend tại ${API_BASE}. Hãy kiểm tra backend đang chạy và EXPO_PUBLIC_API_URL.`);
    }
    return this.handleResponse<T>(res);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      throw new Error(`Không kết nối được tới backend tại ${API_BASE}. Hãy kiểm tra backend đang chạy và EXPO_PUBLIC_API_URL.`);
    }
    return this.handleResponse<T>(res);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const headers = await this.getHeaders();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'PUT',
        headers,
        body: data ? JSON.stringify(data) : undefined,
      });
    } catch (error) {
      throw new Error(`Không kết nối được tới backend tại ${API_BASE}. Hãy kiểm tra backend đang chạy và EXPO_PUBLIC_API_URL.`);
    }
    return this.handleResponse<T>(res);
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const headers = await this.getHeaders();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${endpoint}`, {
        method: 'DELETE',
        headers,
      });
    } catch (error) {
      throw new Error(`Không kết nối được tới backend tại ${API_BASE}. Hãy kiểm tra backend đang chạy và EXPO_PUBLIC_API_URL.`);
    }
    return this.handleResponse<T>(res);
  }

  // Auth helpers
  async setToken(token: string) {
    this.token = token;
    await AsyncStorage.setItem(TOKEN_KEY, token);
  }

  async clearToken() {
    this.token = null;
    await AsyncStorage.removeItem(TOKEN_KEY);
    await AsyncStorage.removeItem(USER_KEY);
  }

  async setUser(user: any) {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  async getUser() {
    const user = await AsyncStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.token;
  }
}

export const api = new ApiClient();
