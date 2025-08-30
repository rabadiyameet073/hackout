import { createClient } from '@supabase/supabase-js';
import { logger } from '@/utils/logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase configuration. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

// Create Supabase client for server-side operations
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create Supabase client for client-side operations (with anon key)
export const supabaseClient = createClient(
  supabaseUrl, 
  process.env.SUPABASE_ANON_KEY || supabaseServiceKey
);

export async function connectDatabase(): Promise<void> {
  try {
    // Test the connection by making a simple query
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 is "relation does not exist" which is fine for initial setup
      throw error;
    }

    logger.info('✅ Supabase database connection established');
  } catch (error) {
    logger.error('❌ Failed to connect to Supabase database:', error);
    throw error;
  }
}

// Database schema types
export interface User {
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
  role: 'community_member' | 'validator' | 'admin' | 'researcher';
  points: number;
  level: number;
  badges: string[];
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

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
}

export interface Validation {
  id: string;
  incident_id: string;
  validator_id: string;
  validation_type: 'community' | 'expert' | 'ai';
  score: number; // 1-5 scale
  comments?: string;
  evidence?: string[];
  created_at: string;
}

export interface Gamification {
  id: string;
  user_id: string;
  action_type: 'report_incident' | 'validate_incident' | 'verify_incident' | 'daily_login';
  points_earned: number;
  badge_earned?: string;
  level_achieved?: number;
  created_at: string;
}
