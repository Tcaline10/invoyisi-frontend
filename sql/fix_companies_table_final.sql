-- This script fixes any issues with the companies table
-- and ensures it has the correct structure and constraints

-- First, check if the companies table exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'companies'
  ) THEN
    -- Create the companies table if it doesn't exist
    CREATE TABLE public.companies (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      logo_url text,
      address text,
      phone text,
      email text,
      website text,
      tax_number text,
      user_id uuid REFERENCES auth.users(id) NOT NULL,
      created_at timestamptz DEFAULT now()
    );
    
    RAISE NOTICE 'Companies table created.';
  ELSE
    RAISE NOTICE 'Companies table already exists.';
  END IF;
END
$$;

-- Enable Row Level Security on companies table
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can manage their own companies" ON public.companies;

-- Create policy to allow users to manage their own companies
CREATE POLICY "Users can manage their own companies"
  ON public.companies
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Check if user_id has a unique constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.constraint_column_usage ccu 
      ON tc.constraint_name = ccu.constraint_name
    WHERE tc.table_name = 'companies'
    AND tc.constraint_type = 'UNIQUE'
    AND ccu.column_name = 'user_id'
  ) THEN
    -- First, check if there are any duplicate user_id values
    IF EXISTS (
      SELECT user_id, COUNT(*)
      FROM public.companies
      GROUP BY user_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'Found users with multiple companies. Fixing...';
      
      -- For each user with multiple companies, keep the most recently updated one
      -- and delete the others
      WITH duplicates AS (
        SELECT user_id
        FROM public.companies
        GROUP BY user_id
        HAVING COUNT(*) > 1
      ),
      to_keep AS (
        SELECT DISTINCT ON (user_id) id
        FROM public.companies
        WHERE user_id IN (SELECT user_id FROM duplicates)
        ORDER BY user_id, created_at DESC
      )
      DELETE FROM public.companies
      WHERE user_id IN (SELECT user_id FROM duplicates)
      AND id NOT IN (SELECT id FROM to_keep);
      
      RAISE NOTICE 'Duplicates fixed.';
    END IF;
    
    -- Add the unique constraint
    ALTER TABLE public.companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
    RAISE NOTICE 'Added unique constraint on user_id.';
  ELSE
    RAISE NOTICE 'Unique constraint on user_id already exists.';
  END IF;
END
$$;

-- Fix company data for user 34feae9d-cef4-4ab5-af62-81bceabe3d19
DO $$
DECLARE
  company_exists boolean;
  company_id uuid;
BEGIN
  -- Check if the user already has a company
  SELECT EXISTS (
    SELECT 1 FROM public.companies WHERE user_id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
  ) INTO company_exists;
  
  IF company_exists THEN
    -- Get the company ID
    SELECT id INTO company_id FROM public.companies WHERE user_id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';
    
    -- Update the existing company with proper data
    UPDATE public.companies
    SET 
      name = 'UkuqalA',
      email = 'Ukuqala@gmail.com',
      phone = '+237693612374',
      address = '123 messassi , Yaounde, Cameroon',
      website = 'https://ukuqala.com',
      tax_number = 'GB123456789'
    WHERE id = company_id;
    
    RAISE NOTICE 'Company data updated for ID: %', company_id;
  ELSE
    -- Insert a new company
    INSERT INTO public.companies (
      name, email, phone, address, website, tax_number, user_id
    )
    VALUES (
      'UkuqalA',
      'Ukuqala@gmail.com',
      '+237693612374',
      '123 messassi , Yaounde, Cameroon',
      'https://ukuqala.com',
      'GB123456789',
      '34feae9d-cef4-4ab5-af62-81bceabe3d19'
    )
    RETURNING id INTO company_id;
    
    RAISE NOTICE 'Company data created with ID: %', company_id;
  END IF;
END
$$;

-- Verify the results
SELECT * FROM public.companies WHERE user_id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';
