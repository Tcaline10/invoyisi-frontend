-- This script creates a user profile for the specified user ID
-- Replace '34feae9d-cef4-4ab5-af62-81bceabe3d19' with your actual user ID

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text NOT NULL,
  full_name text,
  phone text,
  location text,
  bio text,
  company_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own profile" ON public.users;

-- Create policy to allow users to manage their own profile
CREATE POLICY "Users can manage their own profile"
  ON public.users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Get the user's email from auth.users
WITH user_data AS (
  SELECT email FROM auth.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
)
-- Insert the user if they don't exist, otherwise do nothing
INSERT INTO public.users (id, email)
SELECT '34feae9d-cef4-4ab5-af62-81bceabe3d19', email
FROM user_data
WHERE NOT EXISTS (
  SELECT 1 FROM public.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
);

-- Update the user's email if they already exist
UPDATE public.users
SET email = (SELECT email FROM auth.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19')
WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19');
