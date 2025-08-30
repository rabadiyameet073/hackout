import { apiClient, AxiosResponse } from './apiClient';

interface LoginRequest {
  email: string;
  password: string;
}

interface RegisterRequest {
  email: string;
  password: string;
  username: string;
  full_name: string;
  phone?: string;
  role?: string;
}

interface AuthResponse {
  success: boolean;
  message: string;
  data: {
    token?: string;
    user: {
      id: string;
      email: string;
      username: string;
      full_name: string;
      role: string;
      points: number;
      level: number;
      badges: string[];
      is_verified: boolean;
    };
    verificationRequired?: boolean;
  };
}

interface VerifyEmailRequest {
  token: string;
}

interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

interface CurrentUserResponse {
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      username: string;
      full_name: string;
      phone?: string;
      role: string;
      points: number;
      level: number;
      badges: string[];
      is_verified: boolean;
      created_at: string;
      location?: {
        latitude: number;
        longitude: number;
        address?: string;
      };
    };
  };
}

class AuthService {
  /**
   * Login user with email and password
   */
  async login(email: string, password: string): Promise<AxiosResponse<AuthResponse>> {
    const response = await apiClient.post<AuthResponse>('/auth/login', {
      email,
      password,
    });

    // Store token if login successful
    if (response.data.success && response.data.data.token) {
      await apiClient.setToken(response.data.data.token);
    }

    return response;
  }

  /**
   * Register new user
   */
  async register(userData: RegisterRequest): Promise<AxiosResponse<AuthResponse>> {
    return apiClient.post<AuthResponse>('/auth/register', userData);
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<AxiosResponse<VerifyEmailResponse>> {
    return apiClient.post<VerifyEmailResponse>('/auth/verify', { token });
  }

  /**
   * Get current authenticated user
   */
  async getCurrentUser(): Promise<AxiosResponse<CurrentUserResponse>> {
    return apiClient.get<CurrentUserResponse>('/auth/me');
  }

  /**
   * Logout user
   */
  async logout(): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    try {
      const response = await apiClient.post('/auth/logout');
      await apiClient.clearToken();
      return response;
    } catch (error) {
      // Clear token even if logout request fails
      await apiClient.clearToken();
      throw error;
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post('/auth/forgot-password', { email });
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post('/auth/reset-password', {
      token,
      password: newPassword,
    });
  }

  /**
   * Change password (authenticated user)
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post('/auth/change-password', {
      currentPassword,
      newPassword,
    });
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post('/auth/resend-verification');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return apiClient.getToken() !== null;
  }

  /**
   * Get stored auth token
   */
  getToken(): string | null {
    return apiClient.getToken();
  }

  /**
   * Refresh user session (validate token)
   */
  async refreshSession(): Promise<boolean> {
    try {
      await this.getCurrentUser();
      return true;
    } catch (error) {
      await apiClient.clearToken();
      return false;
    }
  }

  /**
   * Check if email is available
   */
  async checkEmailAvailability(email: string): Promise<AxiosResponse<{ available: boolean }>> {
    return apiClient.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
  }

  /**
   * Check if username is available
   */
  async checkUsernameAvailability(username: string): Promise<AxiosResponse<{ available: boolean }>> {
    return apiClient.get(`/auth/check-username?username=${encodeURIComponent(username)}`);
  }
}

export const authService = new AuthService();
export type { LoginRequest, RegisterRequest, AuthResponse, CurrentUserResponse };
