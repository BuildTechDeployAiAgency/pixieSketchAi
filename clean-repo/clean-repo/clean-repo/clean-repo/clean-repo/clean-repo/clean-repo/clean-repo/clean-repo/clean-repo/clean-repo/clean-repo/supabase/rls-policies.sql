-- Row Level Security (RLS) Policies for PixieSketchAI
-- Run these SQL commands in your Supabase SQL editor

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sketches ENABLE ROW LEVEL SECURITY;

-- Profiles table policies
-- Users can only view their own profile
CREATE POLICY "Users can view own profile" 
ON profiles FOR SELECT 
USING (auth.uid() = id);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON profiles FOR UPDATE 
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Allow authenticated users to insert their own profile
CREATE POLICY "Users can insert own profile" 
ON profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Prevent users from deleting profiles
-- (No DELETE policy = no deletes allowed)

-- Sketches table policies
-- Users can only view their own sketches
CREATE POLICY "Users can view own sketches" 
ON sketches FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only insert sketches for themselves
CREATE POLICY "Users can insert own sketches" 
ON sketches FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own sketches
CREATE POLICY "Users can update own sketches" 
ON sketches FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own sketches
CREATE POLICY "Users can delete own sketches" 
ON sketches FOR DELETE 
USING (auth.uid() = user_id);

-- Additional security measures
-- Create a function to automatically set user_id on insert
CREATE OR REPLACE FUNCTION set_user_id()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set user_id
CREATE TRIGGER ensure_user_id
BEFORE INSERT ON sketches
FOR EACH ROW
EXECUTE FUNCTION set_user_id();

-- Create a function to increment credits (for payment processing)
CREATE OR REPLACE FUNCTION increment_credits(p_user_id uuid, p_credits integer)
RETURNS void AS $$
BEGIN
  UPDATE profiles 
  SET credits = credits + p_credits,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION increment_credits TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sketches_user_id ON sketches(user_id);
CREATE INDEX IF NOT EXISTS idx_sketches_status ON sketches(status);
CREATE INDEX IF NOT EXISTS idx_sketches_created_at ON sketches(created_at DESC);

-- Add check constraints
ALTER TABLE profiles ADD CONSTRAINT credits_non_negative CHECK (credits >= 0);
ALTER TABLE sketches ADD CONSTRAINT valid_status CHECK (status IN ('processing', 'completed', 'failed'));

-- IMPORTANT: After running these policies, update your edge functions to use
-- the authenticated user's context instead of the service role key where possible.
-- The service role key bypasses all RLS policies!