import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { store } from '../store';
import { clearAuth } from '../store/slices/authSlice';
import { setNetworkStatus } from '../store/slices/appSlice';

// Get API URL from environment or use default
const API_BASE_URL = Constants.expoConfig?.extra?.apiUrl || 
                    process.env.EXPO_PUBLIC_API_URL || 
                    'http://localhost:3000';

class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${API_BASE_URL}/api`,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
    this.loadStoredToken();
  }

  private async loadStoredToken() {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        this.setToken(token);
      }
    } catch (error) {
      console.error('Failed to load stored token:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add auth token if available
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Add request timestamp for debugging
        config.metadata = { startTime: new Date() };

        console.log(`🚀 ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        // Calculate request duration
        const duration = new Date().getTime() - response.config.metadata?.startTime?.getTime();
        console.log(`✅ ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status} (${duration}ms)`);

        // Update network status to online
        store.dispatch(setNetworkStatus('online'));

        return response;
      },
      async (error) => {
        const { config, response } = error;

        // Log error details
        if (response) {
          console.error(`❌ ${config?.method?.toUpperCase()} ${config?.url} - ${response.status}: ${response.data?.error?.message || 'Unknown error'}`);
        } else {
          console.error(`❌ ${config?.method?.toUpperCase()} ${config?.url} - Network Error:`, error.message);
          // Update network status to offline on network errors
          store.dispatch(setNetworkStatus('offline'));
        }

        // Handle 401 Unauthorized - clear auth and redirect to login
        if (response?.status === 401) {
          console.log('🔐 Unauthorized - clearing auth');
          await this.clearToken();
          store.dispatch(clearAuth());
        }

        // Handle 403 Forbidden
        if (response?.status === 403) {
          console.log('🚫 Forbidden - insufficient permissions');
        }

        // Handle 429 Too Many Requests
        if (response?.status === 429) {
          console.log('⏰ Rate limited - too many requests');
        }

        // Handle 500+ Server Errors
        if (response?.status >= 500) {
          console.log('🔥 Server error - backend issue');
        }

        return Promise.reject(error);
      }
    );
  }

  async setToken(token: string) {
    this.token = token;
    try {
      await SecureStore.setItemAsync('auth_token', token);
    } catch (error) {
      console.error('Failed to store token:', error);
    }
  }

  async clearToken() {
    this.token = null;
    try {
      await SecureStore.deleteItemAsync('auth_token');
    } catch (error) {
      console.error('Failed to clear token:', error);
    }
  }

  getToken(): string | null {
    return this.token;
  }

  // HTTP Methods
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.get(url, config);
  }

  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.post(url, data, config);
  }

  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.put(url, data, config);
  }

  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.patch(url, data, config);
  }

  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>> {
    return this.client.delete(url, config);
  }

  // File upload method
  async uploadFile<T = any>(url: string, file: any, onUploadProgress?: (progressEvent: any) => void): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    formData.append('image', {
      uri: file.uri,
      type: file.type || 'image/jpeg',
      name: file.name || 'image.jpg',
    } as any);

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }

  // Multiple file upload method
  async uploadFiles<T = any>(url: string, files: any[], onUploadProgress?: (progressEvent: any) => void): Promise<AxiosResponse<T>> {
    const formData = new FormData();
    
    files.forEach((file, index) => {
      formData.append('images', {
        uri: file.uri,
        type: file.type || 'image/jpeg',
        name: file.name || `image_${index}.jpg`,
      } as any);
    });

    return this.client.post(url, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress,
    });
  }

  // Health check method
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Get base URL for constructing full URLs
  getBaseUrl(): string {
    return API_BASE_URL;
  }

  // Get API base URL
  getApiBaseUrl(): string {
    return `${API_BASE_URL}/api`;
  }
}

// Create and export singleton instance
export const apiClient = new ApiClient();

// Export types for use in other files
export type { AxiosResponse, AxiosRequestConfig };
