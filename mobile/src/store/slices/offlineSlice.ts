import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface PendingIncident {
  id: string;
  title: string;
  description: string;
  type: string;
  severity: string;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images: string[]; // Local file URIs
  tags: string[];
  timestamp: string;
  retryCount: number;
}

interface PendingValidation {
  id: string;
  incident_id: string;
  score: number;
  comments?: string;
  evidence: string[]; // Local file URIs
  timestamp: string;
  retryCount: number;
}

interface PendingUpload {
  id: string;
  localUri: string;
  purpose: string;
  timestamp: string;
  retryCount: number;
}

interface OfflineState {
  isOfflineMode: boolean;
  pendingIncidents: PendingIncident[];
  pendingValidations: PendingValidation[];
  pendingUploads: PendingUpload[];
  syncInProgress: boolean;
  lastSyncAttempt: string | null;
  syncErrors: string[];
}

const initialState: OfflineState = {
  isOfflineMode: false,
  pendingIncidents: [],
  pendingValidations: [],
  pendingUploads: [],
  syncInProgress: false,
  lastSyncAttempt: null,
  syncErrors: [],
};

const offlineSlice = createSlice({
  name: 'offline',
  initialState,
  reducers: {
    setOfflineMode: (state, action: PayloadAction<boolean>) => {
      state.isOfflineMode = action.payload;
    },
    
    // Pending Incidents
    addPendingIncident: (state, action: PayloadAction<Omit<PendingIncident, 'retryCount'>>) => {
      const incident: PendingIncident = {
        ...action.payload,
        retryCount: 0,
      };
      state.pendingIncidents.push(incident);
    },
    
    removePendingIncident: (state, action: PayloadAction<string>) => {
      state.pendingIncidents = state.pendingIncidents.filter(
        incident => incident.id !== action.payload
      );
    },
    
    incrementIncidentRetryCount: (state, action: PayloadAction<string>) => {
      const incident = state.pendingIncidents.find(i => i.id === action.payload);
      if (incident) {
        incident.retryCount += 1;
      }
    },
    
    // Pending Validations
    addPendingValidation: (state, action: PayloadAction<Omit<PendingValidation, 'retryCount'>>) => {
      const validation: PendingValidation = {
        ...action.payload,
        retryCount: 0,
      };
      state.pendingValidations.push(validation);
    },
    
    removePendingValidation: (state, action: PayloadAction<string>) => {
      state.pendingValidations = state.pendingValidations.filter(
        validation => validation.id !== action.payload
      );
    },
    
    incrementValidationRetryCount: (state, action: PayloadAction<string>) => {
      const validation = state.pendingValidations.find(v => v.id === action.payload);
      if (validation) {
        validation.retryCount += 1;
      }
    },
    
    // Pending Uploads
    addPendingUpload: (state, action: PayloadAction<Omit<PendingUpload, 'retryCount'>>) => {
      const upload: PendingUpload = {
        ...action.payload,
        retryCount: 0,
      };
      state.pendingUploads.push(upload);
    },
    
    removePendingUpload: (state, action: PayloadAction<string>) => {
      state.pendingUploads = state.pendingUploads.filter(
        upload => upload.id !== action.payload
      );
    },
    
    incrementUploadRetryCount: (state, action: PayloadAction<string>) => {
      const upload = state.pendingUploads.find(u => u.id === action.payload);
      if (upload) {
        upload.retryCount += 1;
      }
    },
    
    // Sync Management
    setSyncInProgress: (state, action: PayloadAction<boolean>) => {
      state.syncInProgress = action.payload;
      if (action.payload) {
        state.lastSyncAttempt = new Date().toISOString();
      }
    },
    
    addSyncError: (state, action: PayloadAction<string>) => {
      state.syncErrors.push(action.payload);
      // Keep only last 10 errors
      if (state.syncErrors.length > 10) {
        state.syncErrors = state.syncErrors.slice(-10);
      }
    },
    
    clearSyncErrors: (state) => {
      state.syncErrors = [];
    },
    
    // Clear all pending items (after successful sync)
    clearAllPending: (state) => {
      state.pendingIncidents = [];
      state.pendingValidations = [];
      state.pendingUploads = [];
      state.syncErrors = [];
    },
    
    // Remove failed items (after max retries)
    removeFailedItems: (state) => {
      const maxRetries = 3;
      
      state.pendingIncidents = state.pendingIncidents.filter(
        incident => incident.retryCount < maxRetries
      );
      
      state.pendingValidations = state.pendingValidations.filter(
        validation => validation.retryCount < maxRetries
      );
      
      state.pendingUploads = state.pendingUploads.filter(
        upload => upload.retryCount < maxRetries
      );
    },
  },
});

export const {
  setOfflineMode,
  addPendingIncident,
  removePendingIncident,
  incrementIncidentRetryCount,
  addPendingValidation,
  removePendingValidation,
  incrementValidationRetryCount,
  addPendingUpload,
  removePendingUpload,
  incrementUploadRetryCount,
  setSyncInProgress,
  addSyncError,
  clearSyncErrors,
  clearAllPending,
  removeFailedItems,
} = offlineSlice.actions;

export default offlineSlice.reducer;
