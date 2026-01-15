import type { HomeAssistantSettings } from '@ha-assist/shared-types';
import { storage } from './storage';

/**
 * Detect password from various sources
 */
function detectPassword(): string | null {
  // Try window injection (desktop wrapper)
  if (typeof window !== 'undefined' && (window as any).__HA_ASSIST__?.password) {
    return (window as any).__HA_ASSIST__.password;
  }

  // Try URL query parameter
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const password = params.get('password');
    if (password) {
      return password;
    }
  }

  return null;
}

/**
 * Response types matching Phase 1 API
 */
export interface LoginResponse {
  success: boolean;
  token?: string;
  message?: string;
  error?: string;
}

export interface AuthStatusResponse {
  authenticated: boolean;
}

export interface PasswordResponse {
  password?: string;
  error?: string;
}

export interface SettingsResponse {
  settings: HomeAssistantSettings | null;
}

export interface TestConnectionRequest {
  url: string;
  accessToken: string;
}

export interface TestConnectionResponse {
  success: boolean;
  message?: string;
  error?: string;
}

export interface PipelinesResponse {
  success: boolean;
  pipelines: any[];
  preferredPipeline: string | null;
  error?: string;
}

export interface RunPipelineRequest {
  text: string;
  pipelineId?: string;
  conversationId?: string | null;
}

export interface RunPipelineResponse {
  success: boolean;
  response: string;
  events: any[];
  error?: string;
}

/**
 * Backend API Client matching Phase 1 implementation
 */
export class BackendClient {
  private baseUrl: string;
  private token: string | null = null;
  private maxRetries = 3;
  private retryDelay = 1000; // ms

  constructor(baseUrl: string = 'http://localhost:3000') {
    this.baseUrl = baseUrl;
    
    // Try to load token from storage
    const storedToken = storage.getToken();
    if (storedToken) {
      this.token = storedToken;
    }
  }

  /**
   * Set the base URL for the backend
   */
  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  /**
   * Set authentication token
   */
  private setToken(token: string): void {
    this.token = token;
    storage.setToken(token);
  }

  /**
   * Clear authentication token
   */
  private clearToken(): void {
    this.token = null;
    storage.clearToken();
  }

  /**
   * Make authenticated request with retry logic
   */
  private async fetchWithAuth<T>(
    endpoint: string,
    options: RequestInit = {},
    retries = 0
  ): Promise<T> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Try to parse error response
        const errorData = await response.json().catch(() => ({}));
        
        if (response.status === 401) {
          // Clear token on authentication error
          this.clearToken();
          throw new Error(errorData.error || 'Authentication failed');
        }

        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      // Retry on network errors
      if (retries < this.maxRetries && error instanceof TypeError) {
        console.warn(`Request failed, retrying (${retries + 1}/${this.maxRetries})...`);
        await new Promise((resolve) => setTimeout(resolve, this.retryDelay * (retries + 1)));
        return this.fetchWithAuth<T>(endpoint, options, retries + 1);
      }

      throw error;
    }
  }

  /**
   * Detect and return password from various sources
   */
  detectPassword(): string | null {
    return detectPassword();
  }

  /**
   * Login with server password
   * POST /api/auth/login
   */
  async login(password: string): Promise<LoginResponse> {
    const response = await this.fetchWithAuth<LoginResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ password }),
    });

    if (response.success && response.token) {
      this.setToken(response.token);
    }

    return response;
  }

  /**
   * Logout and clear session
   * POST /api/auth/logout
   */
  async logout(): Promise<void> {
    try {
      await this.fetchWithAuth('/api/auth/logout', {
        method: 'POST',
      });
    } finally {
      this.clearToken();
    }
  }

  /**
   * Check authentication status
   * GET /api/auth/status
   */
  async checkAuthStatus(): Promise<AuthStatusResponse> {
    return this.fetchWithAuth<AuthStatusResponse>('/api/auth/status');
  }

  /**
   * Get auto-generated password (first run only)
   * GET /api/auth/password
   */
  async getPassword(): Promise<PasswordResponse> {
    return this.fetchWithAuth<PasswordResponse>('/api/auth/password');
  }

  /**
   * Get Home Assistant settings
   * GET /api/settings
   */
  async getSettings(): Promise<SettingsResponse> {
    return this.fetchWithAuth<SettingsResponse>('/api/settings');
  }

  /**
   * Update Home Assistant settings
   * PUT /api/settings
   */
  async updateSettings(settings: HomeAssistantSettings): Promise<{ success: boolean; error?: string }> {
    return this.fetchWithAuth('/api/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }

  /**
   * Test Home Assistant connection
   * POST /api/settings/test-connection
   */
  async testConnection(url: string, accessToken: string): Promise<TestConnectionResponse> {
    return this.fetchWithAuth<TestConnectionResponse>('/api/settings/test-connection', {
      method: 'POST',
      body: JSON.stringify({ url, accessToken }),
    });
  }

  /**
   * List available assist pipelines
   * GET /api/pipelines
   */
  async getPipelines(): Promise<PipelinesResponse> {
    return this.fetchWithAuth<PipelinesResponse>('/api/pipelines');
  }

  /**
   * Execute pipeline with text input
   * POST /api/pipelines/run-text
   */
  async runPipeline(request: RunPipelineRequest): Promise<RunPipelineResponse> {
    return this.fetchWithAuth<RunPipelineResponse>('/api/pipelines/run-text', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return this.token !== null;
  }

  /**
   * Get current token (for debugging)
   */
  getToken(): string | null {
    return this.token;
  }
}

// Singleton instance
export const backendClient = new BackendClient();
