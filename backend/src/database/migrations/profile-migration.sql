-- Migration for Student Profiles Table
-- Execute this query to add the student_profiles table

-- Create student_profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,

  -- Core Academic Information (Admin-Managed)
  full_name VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  program VARCHAR(100),
  semester INTEGER CHECK (semester >= 1 AND semester <= 12),
  section VARCHAR(10),
  student_id VARCHAR(20) UNIQUE NOT NULL,
  enrollment_year INTEGER,
  expected_graduation_year INTEGER,

  -- Personal Information (Student-Managed)
  date_of_birth DATE,
  gender VARCHAR(20),

  -- Contact Information (Student-Managed with Admin Override)
  primary_phone VARCHAR(15),
  alternate_phone VARCHAR(15),
  personal_email VARCHAR(255),

  -- Address Information (Optional)
  permanent_address TEXT,
  current_address TEXT,

  -- Emergency Contact (Student-Managed, Admin Verifiable)
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(15),

  -- Academic Performance (Admin-Managed)
  specialization VARCHAR(100),
  cgpa DECIMAL(4,2) CHECK (cgpa >= 0 AND cgpa <= 10),
  backlogs_count INTEGER DEFAULT 0,

  -- System Fields
  profile_completed BOOLEAN DEFAULT FALSE,
  profile_photo_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_student_profiles_department ON student_profiles(department);
CREATE INDEX IF NOT EXISTS idx_student_profiles_semester ON student_profiles(semester);
CREATE INDEX IF NOT EXISTS idx_student_profiles_graduation_year ON student_profiles(expected_graduation_year);

-- Update trigger for updated_at
CREATE OR REPLACE FUNCTION update_student_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_student_profiles_updated_at
  BEFORE UPDATE ON student_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_student_profiles_updated_at();

-- Grant permissions (if needed)
-- GRANT SELECT, INSERT, UPDATE ON student_profiles TO your_app_user;
