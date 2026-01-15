interface LoginRequest {
  homeAssistantUrl: string;
  accessToken: string;
}

interface LoginResponse {
  success: boolean;
  message?: string;
}

interface Settings {
  homeAssistantUrl: string;
  accessToken: string;
  [key: string]: unknown;
}

export class BackendClient {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:3001') {
    this.baseUrl = baseUrl;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async fetchWithAuth(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers['Authorization'] = `Bearer ${this.authToken}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response;
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.fetchWithAuth('/api/login', {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const result = await response.json();
    if (result.token) {
      this.setAuthToken(result.token);
    }

    return result;
  }

  async getSettings(): Promise<Settings> {
    const response = await this.fetchWithAuth('/api/settings', {
      method: 'GET',
    });

    return response.json();
  }

  async updateSettings(settings: Partial<Settings>): Promise<Settings> {
    const response = await this.fetchWithAuth('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });

    return response.json();
  }
}

// Singleton instance
export const backendClient = new BackendClient();
