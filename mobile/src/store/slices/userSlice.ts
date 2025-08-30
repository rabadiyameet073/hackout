import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { userService } from '../../services/userService';
import { gamificationService } from '../../services/gamificationService';

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
  activity_summary?: {
    total_reports: number;
    total_validations: number;
  };
}

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
  recent_activity: any[];
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

interface UserState {
  profile: UserProfile | null;
  gamification: GamificationProfile | null;
  leaderboard: LeaderboardEntry[];
  userPosition: LeaderboardEntry | null;
  isLoading: boolean;
  isUpdating: boolean;
  error: string | null;
}

const initialState: UserState = {
  profile: null,
  gamification: null,
  leaderboard: [],
  userPosition: null,
  isLoading: false,
  isUpdating: false,
  error: null,
};

// Async thunks
export const fetchUserProfile = createAsyncThunk(
  'user/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await userService.getProfile();
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch profile');
    }
  }
);

export const updateUserProfile = createAsyncThunk(
  'user/updateProfile',
  async (profileData: {
    full_name?: string;
    phone?: string;
    location?: {
      latitude: number;
      longitude: number;
      address?: string;
    };
  }, { rejectWithValue }) => {
    try {
      const response = await userService.updateProfile(profileData);
      return response.data.user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update profile');
    }
  }
);

export const fetchGamificationProfile = createAsyncThunk(
  'user/fetchGamification',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationService.getProfile();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch gamification data');
    }
  }
);

export const fetchLeaderboard = createAsyncThunk(
  'user/fetchLeaderboard',
  async (params: {
    type?: string;
    period?: string;
    limit?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await gamificationService.getLeaderboard(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch leaderboard');
    }
  }
);

export const checkBadges = createAsyncThunk(
  'user/checkBadges',
  async (_, { rejectWithValue }) => {
    try {
      const response = await gamificationService.checkBadges();
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to check badges');
    }
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updatePoints: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.points += action.payload;
      }
      if (state.gamification) {
        state.gamification.profile.points += action.payload;
      }
    },
    addBadge: (state, action: PayloadAction<string>) => {
      if (state.profile && !state.profile.badges.includes(action.payload)) {
        state.profile.badges.push(action.payload);
      }
      if (state.gamification) {
        const badge = state.gamification.badges.find(b => b.id === action.payload);
        if (badge) {
          badge.earned = true;
        }
        if (!state.gamification.profile.badges.includes(action.payload)) {
          state.gamification.profile.badges.push(action.payload);
        }
      }
    },
    updateLevel: (state, action: PayloadAction<number>) => {
      if (state.profile) {
        state.profile.level = action.payload;
      }
      if (state.gamification) {
        state.gamification.profile.level = action.payload;
      }
    },
    incrementReportCount: (state) => {
      if (state.profile?.activity_summary) {
        state.profile.activity_summary.total_reports += 1;
      }
      if (state.gamification) {
        state.gamification.stats.total_reports += 1;
      }
    },
    incrementValidationCount: (state) => {
      if (state.profile?.activity_summary) {
        state.profile.activity_summary.total_validations += 1;
      }
      if (state.gamification) {
        state.gamification.stats.total_validations += 1;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch User Profile
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Update User Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isUpdating = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.isUpdating = false;
        state.profile = action.payload;
        state.error = null;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isUpdating = false;
        state.error = action.payload as string;
      });

    // Fetch Gamification Profile
    builder
      .addCase(fetchGamificationProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchGamificationProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.gamification = action.payload;
        state.error = null;
      })
      .addCase(fetchGamificationProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Leaderboard
    builder
      .addCase(fetchLeaderboard.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLeaderboard.fulfilled, (state, action) => {
        state.isLoading = false;
        state.leaderboard = action.payload.leaderboard;
        state.userPosition = action.payload.user_position;
        state.error = null;
      })
      .addCase(fetchLeaderboard.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Check Badges
    builder
      .addCase(checkBadges.fulfilled, (state, action) => {
        const newBadges = action.payload.new_badges;
        if (newBadges && newBadges.length > 0) {
          newBadges.forEach((badge: string) => {
            if (state.profile && !state.profile.badges.includes(badge)) {
              state.profile.badges.push(badge);
            }
            if (state.gamification) {
              const badgeObj = state.gamification.badges.find(b => b.id === badge);
              if (badgeObj) {
                badgeObj.earned = true;
              }
              if (!state.gamification.profile.badges.includes(badge)) {
                state.gamification.profile.badges.push(badge);
              }
            }
          });
        }
      });
  },
});

export const {
  clearError,
  updatePoints,
  addBadge,
  updateLevel,
  incrementReportCount,
  incrementValidationCount,
} = userSlice.actions;

export default userSlice.reducer;
