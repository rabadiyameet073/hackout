-- Community Mangrove Watch Database Schema
-- This script creates all necessary tables and functions for the application

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    location JSONB,
    role VARCHAR(20) DEFAULT 'community_member' CHECK (role IN ('community_member', 'validator', 'admin', 'researcher')),
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    badges TEXT[] DEFAULT '{}',
    is_verified BOOLEAN DEFAULT FALSE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Incidents table
CREATE TABLE IF NOT EXISTS incidents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    type VARCHAR(30) NOT NULL CHECK (type IN ('illegal_cutting', 'pollution', 'land_reclamation', 'wildlife_disturbance', 'other')),
    severity VARCHAR(10) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    location JSONB NOT NULL,
    location_point GEOGRAPHY(POINT, 4326) GENERATED ALWAYS AS (
        ST_SetSRID(ST_MakePoint((location->>'longitude')::float, (location->>'latitude')::float), 4326)
    ) STORED,
    images TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'verified', 'rejected', 'resolved')),
    validation_score DECIMAL(3,2) DEFAULT 0,
    ai_confidence DECIMAL(3,2) DEFAULT 0,
    tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Validations table
CREATE TABLE IF NOT EXISTS validations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    incident_id UUID NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
    validator_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    validation_type VARCHAR(20) NOT NULL CHECK (validation_type IN ('community', 'expert', 'ai')),
    score INTEGER NOT NULL CHECK (score >= 1 AND score <= 5),
    comments TEXT,
    evidence TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(incident_id, validator_id, validation_type)
);

-- Gamification table
CREATE TABLE IF NOT EXISTS gamification (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(30) NOT NULL CHECK (action_type IN ('report_incident', 'validate_incident', 'verify_incident', 'daily_login', 'badge_earned')),
    points_earned INTEGER DEFAULT 0,
    badge_earned VARCHAR(50),
    level_achieved INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_points ON users(points DESC);

CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON incidents(type);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_location_point ON incidents USING GIST(location_point);

CREATE INDEX IF NOT EXISTS idx_validations_incident_id ON validations(incident_id);
CREATE INDEX IF NOT EXISTS idx_validations_validator_id ON validations(validator_id);
CREATE INDEX IF NOT EXISTS idx_validations_type ON validations(validation_type);

CREATE INDEX IF NOT EXISTS idx_gamification_user_id ON gamification(user_id);
CREATE INDEX IF NOT EXISTS idx_gamification_action_type ON gamification(action_type);
CREATE INDEX IF NOT EXISTS idx_gamification_created_at ON gamification(created_at DESC);

-- Function to get incidents within radius
CREATE OR REPLACE FUNCTION incidents_within_radius(lat FLOAT, lng FLOAT, radius_km FLOAT)
RETURNS TABLE(
    id UUID,
    user_id UUID,
    title VARCHAR(200),
    description TEXT,
    type VARCHAR(30),
    severity VARCHAR(10),
    location JSONB,
    images TEXT[],
    status VARCHAR(20),
    validation_score DECIMAL(3,2),
    ai_confidence DECIMAL(3,2),
    tags TEXT[],
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE,
    distance_km FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        i.id,
        i.user_id,
        i.title,
        i.description,
        i.type,
        i.severity,
        i.location,
        i.images,
        i.status,
        i.validation_score,
        i.ai_confidence,
        i.tags,
        i.created_at,
        i.updated_at,
        ST_Distance(
            i.location_point,
            ST_SetSRID(ST_MakePoint(lng, lat), 4326)
        ) / 1000 AS distance_km
    FROM incidents i
    WHERE ST_DWithin(
        i.location_point,
        ST_SetSRID(ST_MakePoint(lng, lat), 4326),
        radius_km * 1000
    )
    ORDER BY distance_km;
END;
$$ LANGUAGE plpgsql;

-- Function to get user rank
CREATE OR REPLACE FUNCTION get_user_rank(user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    user_rank INTEGER;
BEGIN
    SELECT rank INTO user_rank
    FROM (
        SELECT id, RANK() OVER (ORDER BY points DESC) as rank
        FROM users
        WHERE is_verified = TRUE
    ) ranked_users
    WHERE id = user_id;
    
    RETURN COALESCE(user_rank, 0);
END;
$$ LANGUAGE plpgsql;

-- Function to update user level based on points
CREATE OR REPLACE FUNCTION update_user_level()
RETURNS TRIGGER AS $$
DECLARE
    new_level INTEGER;
    level_thresholds INTEGER[] := ARRAY[0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000, 50000];
BEGIN
    -- Calculate new level based on points
    new_level := 1;
    FOR i IN 1..array_length(level_thresholds, 1) LOOP
        IF NEW.points >= level_thresholds[i] THEN
            new_level := i;
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    -- Update level if it changed
    IF new_level != OLD.level THEN
        NEW.level := new_level;
        
        -- Log level achievement
        INSERT INTO gamification (user_id, action_type, points_earned, level_achieved, created_at)
        VALUES (NEW.id, 'level_achieved', 0, new_level, NOW());
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic level updates
DROP TRIGGER IF EXISTS trigger_update_user_level ON users;
CREATE TRIGGER trigger_update_user_level
    BEFORE UPDATE OF points ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_level();

-- Function to update incident validation score
CREATE OR REPLACE FUNCTION update_incident_validation_score()
RETURNS TRIGGER AS $$
DECLARE
    weighted_score DECIMAL(5,2);
    total_weight INTEGER;
    validation_count INTEGER;
    new_status VARCHAR(20);
BEGIN
    -- Calculate weighted average score
    SELECT 
        COALESCE(SUM(
            CASE 
                WHEN validation_type = 'expert' THEN score * 3
                WHEN validation_type = 'ai' THEN score * 2
                ELSE score * 1
            END
        ), 0) / COALESCE(SUM(
            CASE 
                WHEN validation_type = 'expert' THEN 3
                WHEN validation_type = 'ai' THEN 2
                ELSE 1
            END
        ), 1),
        COUNT(*)
    INTO weighted_score, validation_count
    FROM validations 
    WHERE incident_id = COALESCE(NEW.incident_id, OLD.incident_id);
    
    -- Determine new status
    new_status := 'pending';
    IF validation_count >= 3 THEN
        new_status := 'under_review';
    END IF;
    
    -- Update incident
    UPDATE incidents 
    SET 
        validation_score = ROUND(weighted_score, 2),
        status = new_status,
        updated_at = NOW()
    WHERE id = COALESCE(NEW.incident_id, OLD.incident_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers for validation score updates
DROP TRIGGER IF EXISTS trigger_update_validation_score_insert ON validations;
CREATE TRIGGER trigger_update_validation_score_insert
    AFTER INSERT ON validations
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_validation_score();

DROP TRIGGER IF EXISTS trigger_update_validation_score_update ON validations;
CREATE TRIGGER trigger_update_validation_score_update
    AFTER UPDATE ON validations
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_validation_score();

DROP TRIGGER IF EXISTS trigger_update_validation_score_delete ON validations;
CREATE TRIGGER trigger_update_validation_score_delete
    AFTER DELETE ON validations
    FOR EACH ROW
    EXECUTE FUNCTION update_incident_validation_score();

-- Row Level Security (RLS) policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE validations ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;

-- Users can read their own data and public profiles
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Public profiles viewable" ON users
    FOR SELECT USING (is_verified = true);

-- Incidents are publicly readable, but users can only modify their own
CREATE POLICY "Incidents are publicly readable" ON incidents
    FOR SELECT USING (true);

CREATE POLICY "Users can create incidents" ON incidents
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own incidents" ON incidents
    FOR UPDATE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'validator')
    ));

CREATE POLICY "Users can delete own incidents" ON incidents
    FOR DELETE USING (auth.uid() = user_id OR EXISTS (
        SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    ));

-- Validations are publicly readable, users can create validations for others' incidents
CREATE POLICY "Validations are publicly readable" ON validations
    FOR SELECT USING (true);

CREATE POLICY "Users can create validations" ON validations
    FOR INSERT WITH CHECK (
        auth.uid() = validator_id AND 
        auth.uid() != (SELECT user_id FROM incidents WHERE id = incident_id)
    );

-- Gamification records are readable by owner
CREATE POLICY "Users can view own gamification" ON gamification
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can create gamification records" ON gamification
    FOR INSERT WITH CHECK (true);

-- Insert default admin user (password: admin123456)
INSERT INTO users (
    id,
    email,
    username,
    password_hash,
    full_name,
    role,
    points,
    level,
    is_verified
) VALUES (
    uuid_generate_v4(),
    'admin@mangrovewatch.org',
    'admin',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMeshwqOYL1fKxiEf9mQGhvfK2',
    'System Administrator',
    'admin',
    1000,
    5,
    true
) ON CONFLICT (email) DO NOTHING;
