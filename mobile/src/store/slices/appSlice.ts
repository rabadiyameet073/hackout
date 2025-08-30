import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppState {
  isFirstLaunch: boolean;
  hasCompletedOnboarding: boolean;
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notificationsEnabled: boolean;
  locationPermissionGranted: boolean;
  cameraPermissionGranted: boolean;
  currentLocation: {
    latitude: number;
    longitude: number;
    address?: string;
  } | null;
  networkStatus: 'online' | 'offline';
  lastSyncTime: string | null;
  settings: {
    autoUploadPhotos: boolean;
    highQualityPhotos: boolean;
    offlineMode: boolean;
    pushNotifications: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    shareLocation: boolean;
    shareUsageData: boolean;
  };
  tutorial: {
    reportIncident: boolean;
    validateIncident: boolean;
    viewMap: boolean;
    checkLeaderboard: boolean;
  };
}

const initialState: AppState = {
  isFirstLaunch: true,
  hasCompletedOnboarding: false,
  theme: 'auto',
  language: 'en',
  notificationsEnabled: false,
  locationPermissionGranted: false,
  cameraPermissionGranted: false,
  currentLocation: null,
  networkStatus: 'online',
  lastSyncTime: null,
  settings: {
    autoUploadPhotos: true,
    highQualityPhotos: false,
    offlineMode: false,
    pushNotifications: true,
    emailNotifications: true,
    smsNotifications: false,
    shareLocation: true,
    shareUsageData: false,
  },
  tutorial: {
    reportIncident: false,
    validateIncident: false,
    viewMap: false,
    checkLeaderboard: false,
  },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setFirstLaunch: (state, action: PayloadAction<boolean>) => {
      state.isFirstLaunch = action.payload;
    },
    completeOnboarding: (state) => {
      state.hasCompletedOnboarding = true;
      state.isFirstLaunch = false;
    },
    setTheme: (state, action: PayloadAction<'light' | 'dark' | 'auto'>) => {
      state.theme = action.payload;
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
    },
    setNotificationsEnabled: (state, action: PayloadAction<boolean>) => {
      state.notificationsEnabled = action.payload;
    },
    setLocationPermission: (state, action: PayloadAction<boolean>) => {
      state.locationPermissionGranted = action.payload;
    },
    setCameraPermission: (state, action: PayloadAction<boolean>) => {
      state.cameraPermissionGranted = action.payload;
    },
    setCurrentLocation: (state, action: PayloadAction<{
      latitude: number;
      longitude: number;
      address?: string;
    } | null>) => {
      state.currentLocation = action.payload;
    },
    setNetworkStatus: (state, action: PayloadAction<'online' | 'offline'>) => {
      state.networkStatus = action.payload;
    },
    setLastSyncTime: (state, action: PayloadAction<string>) => {
      state.lastSyncTime = action.payload;
    },
    updateSettings: (state, action: PayloadAction<Partial<AppState['settings']>>) => {
      state.settings = { ...state.settings, ...action.payload };
    },
    completeTutorial: (state, action: PayloadAction<keyof AppState['tutorial']>) => {
      state.tutorial[action.payload] = true;
    },
    resetTutorials: (state) => {
      state.tutorial = {
        reportIncident: false,
        validateIncident: false,
        viewMap: false,
        checkLeaderboard: false,
      };
    },
    resetApp: (state) => {
      return {
        ...initialState,
        isFirstLaunch: false, // Don't reset first launch flag
      };
    },
  },
});

export const {
  setFirstLaunch,
  completeOnboarding,
  setTheme,
  setLanguage,
  setNotificationsEnabled,
  setLocationPermission,
  setCameraPermission,
  setCurrentLocation,
  setNetworkStatus,
  setLastSyncTime,
  updateSettings,
  completeTutorial,
  resetTutorials,
  resetApp,
} = appSlice.actions;

export default appSlice.reducer;
