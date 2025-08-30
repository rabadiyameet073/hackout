import { apiClient, AxiosResponse } from './apiClient';

interface CreateIncidentRequest {
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
  tags?: string[];
}

interface UpdateIncidentRequest {
  title?: string;
  description?: string;
  type?: string;
  severity?: string;
  status?: string;
}

interface Incident {
  id: string;
  user_id: string;
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
  status: string;
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

interface GetIncidentsParams {
  page?: number;
  limit?: number;
  type?: string;
  severity?: string;
  status?: string;
  lat?: number;
  lng?: number;
  radius?: number;
  user_id?: string;
  sort?: string;
  order?: string;
}

interface IncidentsResponse {
  success: boolean;
  data: {
    incidents: Incident[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  };
}

interface IncidentResponse {
  success: boolean;
  data: {
    incident: Incident;
  };
}

interface CreateIncidentResponse {
  success: boolean;
  message: string;
  data: {
    incident: Incident;
  };
}

class IncidentService {
  /**
   * Get all incidents with optional filtering and pagination
   */
  async getIncidents(params: GetIncidentsParams = {}): Promise<AxiosResponse<IncidentsResponse>> {
    const queryParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const queryString = queryParams.toString();
    const url = queryString ? `/incidents?${queryString}` : '/incidents';
    
    return apiClient.get<IncidentsResponse>(url);
  }

  /**
   * Get incident by ID
   */
  async getIncidentById(id: string): Promise<AxiosResponse<IncidentResponse>> {
    return apiClient.get<IncidentResponse>(`/incidents/${id}`);
  }

  /**
   * Create new incident
   */
  async createIncident(incidentData: CreateIncidentRequest): Promise<AxiosResponse<CreateIncidentResponse>> {
    return apiClient.post<CreateIncidentResponse>('/incidents', incidentData);
  }

  /**
   * Update incident
   */
  async updateIncident(id: string, updateData: UpdateIncidentRequest): Promise<AxiosResponse<IncidentResponse>> {
    return apiClient.put<IncidentResponse>(`/incidents/${id}`, updateData);
  }

  /**
   * Delete incident
   */
  async deleteIncident(id: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.delete(`/incidents/${id}`);
  }

  /**
   * Get incidents near a location
   */
  async getNearbyIncidents(
    latitude: number, 
    longitude: number, 
    radius: number = 10,
    limit: number = 50
  ): Promise<AxiosResponse<IncidentsResponse>> {
    return this.getIncidents({
      lat: latitude,
      lng: longitude,
      radius,
      limit,
    });
  }

  /**
   * Get user's incidents
   */
  async getUserIncidents(userId: string, page: number = 1, limit: number = 20): Promise<AxiosResponse<IncidentsResponse>> {
    return this.getIncidents({
      user_id: userId,
      page,
      limit,
      sort: 'created_at',
      order: 'desc',
    });
  }

  /**
   * Search incidents by text
   */
  async searchIncidents(query: string, params: GetIncidentsParams = {}): Promise<AxiosResponse<IncidentsResponse>> {
    return apiClient.get<IncidentsResponse>(`/incidents/search?q=${encodeURIComponent(query)}`, {
      params,
    });
  }

  /**
   * Get incident statistics
   */
  async getIncidentStats(params: {
    period?: string;
    type?: string;
    location?: { lat: number; lng: number; radius: number };
  } = {}): Promise<AxiosResponse<{
    success: boolean;
    data: {
      total: number;
      by_type: Record<string, number>;
      by_severity: Record<string, number>;
      by_status: Record<string, number>;
      recent_trend: Array<{ date: string; count: number }>;
    };
  }>> {
    const queryParams = new URLSearchParams();
    
    if (params.period) queryParams.append('period', params.period);
    if (params.type) queryParams.append('type', params.type);
    if (params.location) {
      queryParams.append('lat', params.location.lat.toString());
      queryParams.append('lng', params.location.lng.toString());
      queryParams.append('radius', params.location.radius.toString());
    }

    const queryString = queryParams.toString();
    const url = queryString ? `/incidents/stats?${queryString}` : '/incidents/stats';
    
    return apiClient.get(url);
  }

  /**
   * Report incident via SMS format (for testing)
   */
  async reportViaSMS(message: string, phoneNumber: string): Promise<AxiosResponse<{ success: boolean; message: string }>> {
    return apiClient.post('/sms/report', {
      message,
      phone: phoneNumber,
    });
  }

  /**
   * Get incident types and their descriptions
   */
  getIncidentTypes(): Array<{
    value: string;
    label: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        value: 'illegal_cutting',
        label: 'Illegal Cutting',
        description: 'Unauthorized cutting or removal of mangrove trees',
        icon: '🪓',
      },
      {
        value: 'pollution',
        label: 'Pollution',
        description: 'Water, soil, or air pollution affecting mangrove ecosystem',
        icon: '🏭',
      },
      {
        value: 'land_reclamation',
        label: 'Land Reclamation',
        description: 'Unauthorized land reclamation in mangrove areas',
        icon: '🏗️',
      },
      {
        value: 'wildlife_disturbance',
        label: 'Wildlife Disturbance',
        description: 'Activities disturbing mangrove wildlife and habitats',
        icon: '🐦',
      },
      {
        value: 'other',
        label: 'Other',
        description: 'Other environmental concerns in mangrove areas',
        icon: '⚠️',
      },
    ];
  }

  /**
   * Get severity levels and their descriptions
   */
  getSeverityLevels(): Array<{
    value: string;
    label: string;
    description: string;
    color: string;
  }> {
    return [
      {
        value: 'low',
        label: 'Low',
        description: 'Minor issue with limited immediate impact',
        color: '#4CAF50',
      },
      {
        value: 'medium',
        label: 'Medium',
        description: 'Moderate issue requiring attention',
        color: '#FF9800',
      },
      {
        value: 'high',
        label: 'High',
        description: 'Serious issue requiring urgent action',
        color: '#F44336',
      },
      {
        value: 'critical',
        label: 'Critical',
        description: 'Severe issue requiring immediate intervention',
        color: '#9C27B0',
      },
    ];
  }
}

export const incidentService = new IncidentService();
export type { 
  CreateIncidentRequest, 
  UpdateIncidentRequest, 
  Incident, 
  GetIncidentsParams,
  IncidentsResponse,
  IncidentResponse,
  CreateIncidentResponse 
};
