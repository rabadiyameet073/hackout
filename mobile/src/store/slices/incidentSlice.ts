import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { incidentService } from '../../services/incidentService';

export interface Incident {
  id: string;
  user_id: string;
  title: string;
  description: string;
  type: 'illegal_cutting' | 'pollution' | 'land_reclamation' | 'wildlife_disturbance' | 'other';
  severity: 'low' | 'medium' | 'high' | 'critical';
  location: {
    latitude: number;
    longitude: number;
    address?: string;
  };
  images: string[];
  status: 'pending' | 'under_review' | 'verified' | 'rejected' | 'resolved';
  validation_score: number;
  ai_confidence: number;
  tags: string[];
  created_at: string;
  updated_at: string;
  users?: {
    username: string;
    full_name: string;
  };
  validations?: any[];
}

interface IncidentState {
  incidents: Incident[];
  currentIncident: Incident | null;
  myIncidents: Incident[];
  nearbyIncidents: Incident[];
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  filters: {
    type?: string;
    severity?: string;
    status?: string;
    radius?: number;
  };
}

const initialState: IncidentState = {
  incidents: [],
  currentIncident: null,
  myIncidents: [],
  nearbyIncidents: [],
  isLoading: false,
  isSubmitting: false,
  error: null,
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  },
  filters: {},
};

// Async thunks
export const fetchIncidents = createAsyncThunk(
  'incidents/fetchIncidents',
  async (params: {
    page?: number;
    limit?: number;
    type?: string;
    severity?: string;
    status?: string;
    lat?: number;
    lng?: number;
    radius?: number;
  } = {}, { rejectWithValue }) => {
    try {
      const response = await incidentService.getIncidents(params);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch incidents');
    }
  }
);

export const fetchIncidentById = createAsyncThunk(
  'incidents/fetchIncidentById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await incidentService.getIncidentById(id);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch incident');
    }
  }
);

export const createIncident = createAsyncThunk(
  'incidents/createIncident',
  async (incidentData: {
    title: string;
    description: string;
    type: string;
    severity: string;
    location: {
      latitude: number;
      longitude: number;
      address?: string;
    };
    images: string[];
    tags?: string[];
  }, { rejectWithValue }) => {
    try {
      const response = await incidentService.createIncident(incidentData);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to create incident');
    }
  }
);

export const updateIncident = createAsyncThunk(
  'incidents/updateIncident',
  async ({ id, data }: { id: string; data: Partial<Incident> }, { rejectWithValue }) => {
    try {
      const response = await incidentService.updateIncident(id, data);
      return response.data.incident;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to update incident');
    }
  }
);

export const deleteIncident = createAsyncThunk(
  'incidents/deleteIncident',
  async (id: string, { rejectWithValue }) => {
    try {
      await incidentService.deleteIncident(id);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to delete incident');
    }
  }
);

export const fetchMyIncidents = createAsyncThunk(
  'incidents/fetchMyIncidents',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await incidentService.getIncidents({ user_id: userId });
      return response.data.incidents;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch your incidents');
    }
  }
);

export const fetchNearbyIncidents = createAsyncThunk(
  'incidents/fetchNearbyIncidents',
  async ({ lat, lng, radius = 10 }: { lat: number; lng: number; radius?: number }, { rejectWithValue }) => {
    try {
      const response = await incidentService.getIncidents({ lat, lng, radius, limit: 50 });
      return response.data.incidents;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.error?.message || 'Failed to fetch nearby incidents');
    }
  }
);

const incidentSlice = createSlice({
  name: 'incidents',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentIncident: (state, action: PayloadAction<Incident | null>) => {
      state.currentIncident = action.payload;
    },
    setFilters: (state, action: PayloadAction<Partial<IncidentState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {};
    },
    addIncident: (state, action: PayloadAction<Incident>) => {
      state.incidents.unshift(action.payload);
      state.myIncidents.unshift(action.payload);
    },
    updateIncidentInList: (state, action: PayloadAction<Incident>) => {
      const incident = action.payload;
      
      // Update in main incidents list
      const mainIndex = state.incidents.findIndex(i => i.id === incident.id);
      if (mainIndex !== -1) {
        state.incidents[mainIndex] = incident;
      }
      
      // Update in my incidents list
      const myIndex = state.myIncidents.findIndex(i => i.id === incident.id);
      if (myIndex !== -1) {
        state.myIncidents[myIndex] = incident;
      }
      
      // Update current incident if it's the same
      if (state.currentIncident?.id === incident.id) {
        state.currentIncident = incident;
      }
    },
    removeIncidentFromList: (state, action: PayloadAction<string>) => {
      const id = action.payload;
      state.incidents = state.incidents.filter(i => i.id !== id);
      state.myIncidents = state.myIncidents.filter(i => i.id !== id);
      state.nearbyIncidents = state.nearbyIncidents.filter(i => i.id !== id);
      
      if (state.currentIncident?.id === id) {
        state.currentIncident = null;
      }
    },
  },
  extraReducers: (builder) => {
    // Fetch Incidents
    builder
      .addCase(fetchIncidents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidents.fulfilled, (state, action) => {
        state.isLoading = false;
        state.incidents = action.payload.incidents;
        state.pagination = action.payload.pagination;
        state.error = null;
      })
      .addCase(fetchIncidents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch Incident by ID
    builder
      .addCase(fetchIncidentById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchIncidentById.fulfilled, (state, action) => {
        state.isLoading = false;
        state.currentIncident = action.payload;
        state.error = null;
      })
      .addCase(fetchIncidentById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create Incident
    builder
      .addCase(createIncident.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(createIncident.fulfilled, (state, action) => {
        state.isSubmitting = false;
        state.incidents.unshift(action.payload);
        state.myIncidents.unshift(action.payload);
        state.error = null;
      })
      .addCase(createIncident.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Update Incident
    builder
      .addCase(updateIncident.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(updateIncident.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const incident = action.payload;
        
        // Update in all relevant lists
        const mainIndex = state.incidents.findIndex(i => i.id === incident.id);
        if (mainIndex !== -1) {
          state.incidents[mainIndex] = incident;
        }
        
        const myIndex = state.myIncidents.findIndex(i => i.id === incident.id);
        if (myIndex !== -1) {
          state.myIncidents[myIndex] = incident;
        }
        
        if (state.currentIncident?.id === incident.id) {
          state.currentIncident = incident;
        }
        
        state.error = null;
      })
      .addCase(updateIncident.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Delete Incident
    builder
      .addCase(deleteIncident.pending, (state) => {
        state.isSubmitting = true;
        state.error = null;
      })
      .addCase(deleteIncident.fulfilled, (state, action) => {
        state.isSubmitting = false;
        const id = action.payload;
        state.incidents = state.incidents.filter(i => i.id !== id);
        state.myIncidents = state.myIncidents.filter(i => i.id !== id);
        
        if (state.currentIncident?.id === id) {
          state.currentIncident = null;
        }
        
        state.error = null;
      })
      .addCase(deleteIncident.rejected, (state, action) => {
        state.isSubmitting = false;
        state.error = action.payload as string;
      });

    // Fetch My Incidents
    builder
      .addCase(fetchMyIncidents.fulfilled, (state, action) => {
        state.myIncidents = action.payload;
      });

    // Fetch Nearby Incidents
    builder
      .addCase(fetchNearbyIncidents.fulfilled, (state, action) => {
        state.nearbyIncidents = action.payload;
      });
  },
});

export const {
  clearError,
  setCurrentIncident,
  setFilters,
  clearFilters,
  addIncident,
  updateIncidentInList,
  removeIncidentFromList,
} = incidentSlice.actions;

export default incidentSlice.reducer;
