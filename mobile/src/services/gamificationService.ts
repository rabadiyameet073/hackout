import { apiClient, AxiosResponse } from './apiClient';

interface GamificationProfile {
  profile: {
    points: number;
    level: number;
    badges: string[];
    member_since: string;
    next_level: {
      level: number;
      points_required: number;
      points_to_go: number;
    };
  };
  stats: {
    total_reports: number;
    verified_reports: number;
    total_validations: number;
    expert_validations: number;
    average_validation_score: number;
    reports_by_type: Record<string, number>;
    points_this_month: number;
  };
  badges: Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    earned: boolean;
  }>;
  recent_activity: Array<{
    id: string;
    action_type: string;
    points_earned: number;
    badge_earned?: string;
    level_achieved?: number;
    created_at: string;
  }>;
}

interface LeaderboardEntry {
  id: string;
  username: string;
  full_name: string;
  points: number;
  level: number;
  badges: string[];
  rank: number;
  badge_count: number;
  monthly_points?: number;
}

interface LeaderboardResponse {
  success: boolean;
  data: {
    leaderboard: LeaderboardEntry[];
    user_position?: LeaderboardEntry;
    period: string;
    type: string;
  };
}

interface GamificationResponse {
  success: boolean;
  data: GamificationProfile;
}

interface BadgeCheckResponse {
  success: boolean;
  data: {
    new_badges: string[];
    message: string;
  };
}

class GamificationService {
  /**
   * Get user's gamification profile
   */
  async getProfile(): Promise<AxiosResponse<GamificationResponse>> {
    return apiClient.get<GamificationResponse>('/gamification/profile');
  }

  /**
   * Get leaderboard
   */
  async getLeaderboard(params: {
    type?: 'points' | 'monthly_points';
    period?: 'all_time' | 'monthly';
    limit?: number;
  } = {}): Promise<AxiosResponse<LeaderboardResponse>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/gamification/leaderboard?${queryString}` : '/gamification/leaderboard';
    
    return apiClient.get<LeaderboardResponse>(url);
  }

  /**
   * Check for new badges
   */
  async checkBadges(): Promise<AxiosResponse<BadgeCheckResponse>> {
    return apiClient.post<BadgeCheckResponse>('/gamification/check-badges');
  }

  /**
   * Get available badges and their requirements
   */
  getBadgeDefinitions(): Array<{
    id: string;
    name: string;
    description: string;
    icon: string;
    requirements: string;
    category: 'reporting' | 'validation' | 'engagement' | 'achievement';
  }> {
    return [
      {
        id: 'FIRST_REPORT',
        name: 'First Reporter',
        description: 'Submitted your first incident report',
        icon: '🌱',
        requirements: 'Submit 1 incident report',
        category: 'reporting',
      },
      {
        id: 'VIGILANT_GUARDIAN',
        name: 'Vigilant Guardian',
        description: 'Reported 10 incidents',
        icon: '👁️',
        requirements: 'Submit 10 incident reports',
        category: 'reporting',
      },
      {
        id: 'MANGROVE_PROTECTOR',
        name: 'Mangrove Protector',
        description: 'Reported 50 incidents',
        icon: '🛡️',
        requirements: 'Submit 50 incident reports',
        category: 'reporting',
      },
      {
        id: 'FOREST_CHAMPION',
        name: 'Forest Champion',
        description: 'Reported 100 incidents',
        icon: '🏆',
        requirements: 'Submit 100 incident reports',
        category: 'achievement',
      },
      {
        id: 'COMMUNITY_VALIDATOR',
        name: 'Community Validator',
        description: 'Validated 25 incidents',
        icon: '✅',
        requirements: 'Validate 25 incidents',
        category: 'validation',
      },
      {
        id: 'EXPERT_REVIEWER',
        name: 'Expert Reviewer',
        description: 'Provided 10 expert validations',
        icon: '🔬',
        requirements: 'Provide 10 expert validations',
        category: 'validation',
      },
      {
        id: 'STREAK_MASTER',
        name: 'Streak Master',
        description: 'Logged in for 7 consecutive days',
        icon: '🔥',
        requirements: 'Login for 7 consecutive days',
        category: 'engagement',
      },
      {
        id: 'PHOTO_JOURNALIST',
        name: 'Photo Journalist',
        description: 'Submitted 20 reports with photos',
        icon: '📸',
        requirements: 'Submit 20 reports with photos',
        category: 'reporting',
      },
      {
        id: 'LOCATION_SCOUT',
        name: 'Location Scout',
        description: 'Reported from 10 different locations',
        icon: '🗺️',
        requirements: 'Report from 10 different locations',
        category: 'reporting',
      },
      {
        id: 'EARLY_BIRD',
        name: 'Early Bird',
        description: 'One of the first 100 users',
        icon: '🐦',
        requirements: 'Be among the first 100 users',
        category: 'achievement',
      },
    ];
  }

  /**
   * Get level definitions and requirements
   */
  getLevelDefinitions(): Array<{
    level: number;
    name: string;
    points_required: number;
    benefits: string[];
    icon: string;
  }> {
    return [
      {
        level: 1,
        name: 'Seedling',
        points_required: 0,
        benefits: ['Basic reporting', 'Community validation'],
        icon: '🌱',
      },
      {
        level: 2,
        name: 'Sprout',
        points_required: 100,
        benefits: ['Enhanced reporting features', 'Profile customization'],
        icon: '🌿',
      },
      {
        level: 3,
        name: 'Sapling',
        points_required: 250,
        benefits: ['Advanced filters', 'Incident analytics'],
        icon: '🌳',
      },
      {
        level: 4,
        name: 'Young Tree',
        points_required: 500,
        benefits: ['Expert validation access', 'Priority support'],
        icon: '🌲',
      },
      {
        level: 5,
        name: 'Mature Tree',
        points_required: 1000,
        benefits: ['Mentor status', 'Beta features access'],
        icon: '🌴',
      },
      {
        level: 6,
        name: 'Forest Guardian',
        points_required: 2000,
        benefits: ['Community moderation', 'Special recognition'],
        icon: '🏞️',
      },
      {
        level: 7,
        name: 'Ecosystem Protector',
        points_required: 4000,
        benefits: ['Research collaboration', 'Policy input'],
        icon: '🌍',
      },
      {
        level: 8,
        name: 'Conservation Hero',
        points_required: 8000,
        benefits: ['Leadership opportunities', 'Conference invitations'],
        icon: '🦸',
      },
      {
        level: 9,
        name: 'Environmental Champion',
        points_required: 15000,
        benefits: ['Global recognition', 'Award nominations'],
        icon: '🏅',
      },
      {
        level: 10,
        name: 'Mangrove Legend',
        points_required: 30000,
        benefits: ['Lifetime achievement', 'Hall of fame'],
        icon: '👑',
      },
    ];
  }

  /**
   * Calculate points for different actions
   */
  getPointsSystem(): Record<string, number> {
    return {
      report_incident: 10,
      validate_incident: 5,
      verify_incident: 15,
      daily_login: 2,
      first_report: 25,
      verified_report: 20,
      photo_with_report: 5,
      location_accuracy: 3,
      detailed_description: 2,
      helpful_validation: 8,
      expert_validation: 12,
      community_contribution: 15,
    };
  }

  /**
   * Get user's rank in leaderboard
   */
  async getUserRank(userId?: string): Promise<AxiosResponse<{
    success: boolean;
    data: {
      rank: number;
      total_users: number;
      percentile: number;
    };
  }>> {
    const url = userId ? `/gamification/rank/${userId}` : '/gamification/rank';
    return apiClient.get(url);
  }

  /**
   * Get gamification statistics
   */
  async getGamificationStats(): Promise<AxiosResponse<{
    success: boolean;
    data: {
      total_points_awarded: number;
      total_badges_earned: number;
      active_users: number;
      top_contributors: Array<{
        username: string;
        points: number;
        contributions: number;
      }>;
      badge_distribution: Record<string, number>;
      level_distribution: Record<number, number>;
    };
  }>> {
    return apiClient.get('/gamification/stats');
  }

  /**
   * Get achievement progress
   */
  async getAchievementProgress(): Promise<AxiosResponse<{
    success: boolean;
    data: {
      badges: Array<{
        id: string;
        name: string;
        progress: number;
        total: number;
        percentage: number;
        earned: boolean;
      }>;
      next_level: {
        current_points: number;
        required_points: number;
        progress_percentage: number;
      };
    };
  }>> {
    return apiClient.get('/gamification/progress');
  }
}

export const gamificationService = new GamificationService();
export type { 
  GamificationProfile, 
  LeaderboardEntry, 
  LeaderboardResponse, 
  GamificationResponse, 
  BadgeCheckResponse 
};
