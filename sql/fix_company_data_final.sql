-- This script fixes the company data for all users

-- First, check if the companies table exists
CREATE TABLE IF NOT EXISTS public.companies (
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

-- Create a function to ensure each user has a company
CREATE OR REPLACE FUNCTION ensure_user_has_company()
RETURNS void AS $$
DECLARE
  user_record RECORD;
  company_exists BOOLEAN;
BEGIN
  -- Loop through all users
  FOR user_record IN SELECT id, email FROM auth.users
  LOOP
    -- Check if the user already has a company
    SELECT EXISTS (
      SELECT 1 FROM public.companies WHERE user_id = user_record.id
    ) INTO company_exists;
    
    IF NOT company_exists THEN
      -- Create a company for the user
      INSERT INTO public.companies (
        name, email, phone, address, website, tax_number, user_id
      )
      VALUES (
        'Your Company Name',
        COALESCE(user_record.email, 'your@company.com'),
        '',
        '',
        '',
        '',
        user_record.id
      );
      
      RAISE NOTICE 'Created company for user: %', user_record.id;
    ELSE
      -- Update the existing company with proper data if name is 'Alex Johnson'
      UPDATE public.companies
      SET 
        name = CASE WHEN name = 'Alex Johnson' THEN 'Your Company Name' ELSE name END,
        email = CASE WHEN email = 'alex@company.com' THEN 'your@company.com' ELSE email END
      WHERE user_id = user_record.id;
      
      RAISE NOTICE 'Updated company for user: %', user_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT ensure_user_has_company();

-- Drop the function after use
DROP FUNCTION ensure_user_has_company();

-- Verify the results
SELECT c.id, c.name, c.email, u.email as user_email
FROM public.companies c
JOIN auth.users u ON c.user_id = u.id;
