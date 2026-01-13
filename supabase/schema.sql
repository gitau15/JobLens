-- JobLens Database Schema
-- Tables for the autonomous AI agent for semantic CV-Job matching

-- Table: raw_jobs - All scraped jobs with embedding status tracking
CREATE TABLE IF NOT EXISTS raw_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    source_name VARCHAR(100) NOT NULL,
    external_id VARCHAR(255),
    job_url TEXT NOT NULL UNIQUE,
    job_url_hash VARCHAR(64) NOT NULL UNIQUE, -- For deduplication
    title VARCHAR(500) NOT NULL,
    company VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    employment_type VARCHAR(100),
    remote_option VARCHAR(100),
    salary_min INTEGER,
    salary_max INTEGER,
    salary_currency VARCHAR(10),
    description TEXT,
    requirements TEXT,
    skills TEXT,
    posted_at TIMESTAMP WITH TIME ZONE,
    scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    embedding_status VARCHAR(20) DEFAULT 'pending' CHECK (embedding_status IN ('pending', 'embedded', 'error')),
    embedding_updated_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for raw_jobs
CREATE INDEX IF NOT EXISTS idx_raw_jobs_source ON raw_jobs(source_name);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_company ON raw_jobs(company);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_location ON raw_jobs(location);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_embedding_status ON raw_jobs(embedding_status);
CREATE INDEX IF NOT EXISTS idx_raw_jobs_scraped_at ON raw_jobs(scraped_at DESC);

-- Table: users - User profiles (Supabase auth will handle authentication)
-- This extends the built-in auth.users table
CREATE TABLE IF NOT EXISTS users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    full_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Enable Row Level Security (RLS) for users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users FOR UPDATE USING (auth.uid() = id);

-- Table: user_preferences - Job preferences (role, location, remote, salary)
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_keywords TEXT[], -- Preferred job roles/keywords
    location_preference VARCHAR(255), -- Preferred location
    remote_preference VARCHAR(20) DEFAULT 'either' CHECK (remote_preference IN ('remote', 'onsite', 'hybrid', 'either')), -- Remote work preference
    min_salary INTEGER, -- Minimum acceptable salary
    experience_level VARCHAR(50), -- Desired experience level (junior, mid, senior, etc.)
    industries TEXT[], -- Preferred industries
    job_types TEXT[], -- Full-time, part-time, contract, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for user_preferences
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON user_preferences(user_id);

-- Enable Row Level Security (RLS) for user_preferences
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON user_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON user_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON user_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON user_preferences FOR DELETE USING (auth.uid() = user_id);

-- Table: cvs - Uploaded/parsed CV data per user
CREATE TABLE IF NOT EXISTS cvs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    filename VARCHAR(500),
    file_path TEXT,
    original_content TEXT,
    parsed_content TEXT,
    extracted_skills TEXT[],
    extracted_experience JSONB,
    extracted_education JSONB,
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_parsed_at TIMESTAMP WITH TIME ZONE,
    parsing_status VARCHAR(20) DEFAULT 'pending' CHECK (parsing_status IN ('pending', 'processing', 'completed', 'error'))
);

-- Indexes for cvs
CREATE INDEX IF NOT EXISTS idx_cvs_user_id ON cvs(user_id);
CREATE INDEX IF NOT EXISTS idx_cvs_parsing_status ON cvs(parsing_status);

-- Enable Row Level Security (RLS) for cvs
ALTER TABLE cvs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own CVs" ON cvs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own CVs" ON cvs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own CVs" ON cvs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own CVs" ON cvs FOR DELETE USING (auth.uid() = user_id);

-- Table: recommendations - Daily job matches with scores and feedback
CREATE TABLE IF NOT EXISTS recommendations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    job_id UUID REFERENCES raw_jobs(id) ON DELETE CASCADE,
    score DECIMAL(5,2), -- Match score (0-100)
    matched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'pending_notification' CHECK (status IN ('pending_notification', 'sent', 'opened', 'applied', 'rejected', 'ignored')),
    feedback VARCHAR(20) CHECK (feedback IN ('like', 'dislike', 'apply', 'ignore', 'spam')),
    feedback_at TIMESTAMP WITH TIME ZONE,
    job_title VARCHAR(500), -- Cached for performance
    job_company VARCHAR(255), -- Cached for performance
    job_url TEXT, -- Cached for performance
    job_description TEXT -- Cached for performance
);

-- Indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recommendations_user_id ON recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_job_id ON recommendations(job_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_matched_at ON recommendations(matched_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_status ON recommendations(status);
CREATE INDEX IF NOT EXISTS idx_recommendations_score ON recommendations(score DESC);

-- Enable Row Level Security (RLS) for recommendations
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendations" ON recommendations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own recommendations" ON recommendations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recommendations" ON recommendations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can provide feedback on own recommendations" ON recommendations FOR UPDATE USING (auth.uid() = user_id);

-- RLS Functions
-- Update timestamp for users table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach the trigger to users table
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Attach the trigger to user_preferences table
CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();