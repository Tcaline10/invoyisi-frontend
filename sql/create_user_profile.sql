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
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
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

-- Insert or update the user profile
DO $$
DECLARE
  user_exists boolean;
  user_email text;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email FROM auth.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';

  -- Check if the user already exists in the users table
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
  ) INTO user_exists;

  IF user_exists THEN
    -- Update the existing user
    UPDATE public.users
    SET
      email = user_email
    WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';

    RAISE NOTICE 'User profile updated';
  ELSE
    -- Insert a new user
    INSERT INTO public.users (id, email)
    VALUES ('34feae9d-cef4-4ab5-af62-81bceabe3d19', user_email);

    RAISE NOTICE 'User profile created';
  END IF;
END
$$;
