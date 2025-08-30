import { apiClient, AxiosResponse } from './apiClient';

interface UserProfile {
  id: string;
  email: string;
  username: string;
  full_name: string;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  role: string;
  points: number;
  level: number;
  badges: string[];
  is_verified: boolean;
  created_at: string;
  last_login?: string;
  activity_summary?: {
    total_reports: number;
    total_validations: number;
  };
}

interface UpdateProfileRequest {
  full_name?: string;
  phone?: string;
  location?: {
    latitude: number;
    longitude: number;
    address?: string;
  };
}

interface UserProfileResponse {
  success: boolean;
  data: {
    user: UserProfile;
  };
}

interface PublicUserProfile {
  id: string;
  username: string;
  full_name: string;
  role: string;
  points: number;
  level: number;
  badges: string[];
  created_at: string;
  stats: {
    total_reports: number;
    verified_reports: number;
    total_validations: number;
    expert_validations: number;
    member_since: string;
    reports_by_type: Record<string, number>;
  };
}

interface PublicUserResponse {
  success: boolean;
  data: {
    user: PublicUserProfile;
  };
}

class UserService {
  /**
   * Get current user's profile
   */
  async getProfile(): Promise<AxiosResponse<UserProfileResponse>> {
    return apiClient.get<UserProfileResponse>('/users/profile');
  }

  /**
   * Update current user's profile
   */
  async updateProfile(profileData: UpdateProfileRequest): Promise<AxiosResponse<UserProfileResponse>> {
    return apiClient.put<UserProfileResponse>('/users/profile', profileData);
  }

  /**
   * Get public user profile by ID
   */
  async getPublicProfile(userId: string): Promise<AxiosResponse<PublicUserResponse>> {
    return apiClient.get<PublicUserResponse>(`/users/${userId}`);
  }

  /**
   * Update user location
   */
  async updateLocation(location: {
    latitude: number;
    longitude: number;
    address?: string;
  }): Promise<AxiosResponse<UserProfileResponse>> {
    return this.updateProfile({ location });
  }

  /**
   * Update user phone number
   */
  async updatePhone(phone: string): Promise<AxiosResponse<UserProfileResponse>> {
    return this.updateProfile({ phone });
  }

  /**
   * Get user statistics
   */
  async getUserStats(userId?: string): Promise<AxiosResponse<{
    success: boolean;
    data: {
      stats: {
        total_reports: number;
        verified_reports: number;
        pending_reports: number;
        total_validations: number;
        expert_validations: number;
        points_earned: number;
        current_level: number;
        badges_earned: number;
        member_since: string;
        last_activity: string;
        reports_by_type: Record<string, number>;
        reports_by_month: Array<{ month: string; count: number }>;
        validation_accuracy: number;
      };
    };
  }>> {
    const url = userId ? `/users/${userId}/stats` : '/users/profile/stats';
    return apiClient.get(url);
  }

  /**
   * Search users (public profiles only)
   */
  async searchUsers(query: string, params: {
    page?: number;
    limit?: number;
    role?: string;
  } = {}): Promise<AxiosResponse<{
    success: boolean;
    data: {
      users: Array<{
        id: string;
        username: string;
        full_name: string;
        role: string;
        points: number;
        level: number;
        badges: string[];
      }>;
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    };
  }>> {
    const queryParams = new URLSearchParams();
    queryParams.append('search', query);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    return apiClient.get(`/users/search?${queryParams.toString()}`);
  }

  /**
   * Get nearby users (users who have shared their location)
   */
  async getNearbyUsers(
    latitude: number,
    longitude: number,
    radius: number = 10
  ): Promise<AxiosResponse<{
    success: boolean;
    data: {
      users: Array<{
        id: string;
        username: string;
        full_name: string;
        points: number;
        level: number;
        distance_km: number;
        last_activity: string;
      }>;
    };
  }>> {
    return apiClient.get(`/users/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`);
  }

  /**
   * Follow/unfollow user (if social features are implemented)
   */
  async followUser(userId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`/users/${userId}/follow`);
  }

  async unfollowUser(userId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.delete(`/users/${userId}/follow`);
  }

  /**
   * Get user's followers and following
   */
  async getUserConnections(userId?: string): Promise<AxiosResponse<{
    success: boolean;
    data: {
      followers: Array<{
        id: string;
        username: string;
        full_name: string;
        points: number;
        level: number;
      }>;
      following: Array<{
        id: string;
        username: string;
        full_name: string;
        points: number;
        level: number;
      }>;
      stats: {
        followers_count: number;
        following_count: number;
      };
    };
  }>> {
    const url = userId ? `/users/${userId}/connections` : '/users/profile/connections';
    return apiClient.get(url);
  }

  /**
   * Report user (for inappropriate behavior)
   */
  async reportUser(userId: string, reason: string, description?: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`/users/${userId}/report`, {
      reason,
      description,
    });
  }

  /**
   * Block/unblock user
   */
  async blockUser(userId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post(`/users/${userId}/block`);
  }

  async unblockUser(userId: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.delete(`/users/${userId}/block`);
  }

  /**
   * Get blocked users list
   */
  async getBlockedUsers(): Promise<AxiosResponse<{
    success: boolean;
    data: {
      blocked_users: Array<{
        id: string;
        username: string;
        full_name: string;
        blocked_at: string;
      }>;
    };
  }>> {
    return apiClient.get('/users/profile/blocked');
  }

  /**
   * Delete user account
   */
  async deleteAccount(password: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.delete('/users/profile', {
      data: { password },
    });
  }

  /**
   * Export user data (GDPR compliance)
   */
  async exportUserData(): Promise<AxiosResponse<{
    success: boolean;
    data: {
      download_url: string;
      expires_at: string;
    };
  }>> {
    return apiClient.post('/users/profile/export');
  }
}

export const userService = new UserService();
export type { 
  UserProfile, 
  UpdateProfileRequest, 
  UserProfileResponse, 
  PublicUserProfile, 
  PublicUserResponse 
};
