const API_BASE = process.env.NEXT_PUBLIC_API_URL;

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('therahome_token');
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  private async handleRes(res: Response) {
    if (res.status === 401) {
      this.clearToken();
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: 'Network error' }));
      throw new Error(error.error || `HTTP ${res.status}`);
    }
    return res.json();
  }

  async get<T = any>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      headers: this.getHeaders(),
    });
    return this.handleRes(res);
  }

  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleRes(res);
  }

  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: data ? JSON.stringify(data) : undefined,
    });
    return this.handleRes(res);
  }

  async delete<T = any>(endpoint: string): Promise<T> {
    const res = await fetch(`${API_BASE}${endpoint}`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    return this.handleRes(res);
  }

  // Auth helpers
  setToken(token: string) {
    localStorage.setItem('therahome_token', token);
  }

  clearToken() {
    localStorage.removeItem('therahome_token');
    localStorage.removeItem('therahome_user');
  }

  setUser(user: any) {
    localStorage.setItem('therahome_user', JSON.stringify(user));
  }

  getUser() {
    if (typeof window === 'undefined') return null;
    const user = localStorage.getItem('therahome_user');
    return user ? JSON.parse(user) : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}

export const api = new ApiClient();
