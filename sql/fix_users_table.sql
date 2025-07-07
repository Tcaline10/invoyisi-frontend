-- This script fixes any issues with the users table
-- and ensures it has the correct structure and constraints

-- First, check if the users table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
  ) THEN
    -- Create the users table if it doesn't exist
    CREATE TABLE public.users (
      id uuid PRIMARY KEY REFERENCES auth.users(id),
      email text NOT NULL,
      full_name text,
      avatar_url text,
      phone text,
      location text,
      bio text,
      company_name text,
      created_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE 'Users table created.';
  ELSE
    RAISE NOTICE 'Users table already exists.';
  END IF;
END
$$;

-- Enable Row Level Security on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own profiles" ON public.users;

-- Create policy to allow users to manage their own profiles
CREATE POLICY "Users can manage their own profiles"
  ON public.users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Fix user data for user 34feae9d-cef4-4ab5-af62-81bceabe3d19
DO $$
DECLARE
  user_exists boolean;
BEGIN
  -- Check if the user already exists
  SELECT EXISTS (
    SELECT 1 FROM public.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
  ) INTO user_exists;
  
  IF user_exists THEN
    -- Update the existing user
    UPDATE public.users
    SET 
      full_name = 'Noa',
      email = 'noafrederic91@gmail.com',
      phone = '+2376548087',
      location = 'Yaounde, Cameroon',
      bio = 'I am A cOMPUTER sCIENCE STUDENT'
    WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';
    
    RAISE NOTICE 'User data updated for ID: 34feae9d-cef4-4ab5-af62-81bceabe3d19';
  ELSE
    -- Insert a new user
    INSERT INTO public.users (
      id, email, full_name, phone, location, bio
    )
    VALUES (
      '34feae9d-cef4-4ab5-af62-81bceabe3d19',
      'noafrederic91@gmail.com',
      'Noa',
      '+2376548087',
      'Yaounde, Cameroon',
      'I am A cOMPUTER sCIENCE STUDENT'
    );
    
    RAISE NOTICE 'User data created for ID: 34feae9d-cef4-4ab5-af62-81bceabe3d19';
  END IF;
END
$$;

-- Verify the results
SELECT * FROM public.users WHERE id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';
