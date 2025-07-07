-- This script fixes the company data for a specific user
-- Replace '34feae9d-cef4-4ab5-af62-81bceabe3d19' with your actual user ID

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

-- Check if the user already has a company
DO $$
DECLARE
  company_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM public.companies WHERE user_id = '34feae9d-cef4-4ab5-af62-81bceabe3d19'
  ) INTO company_exists;
  
  IF company_exists THEN
    -- Update the existing company with proper data
    UPDATE public.companies
    SET 
      name = 'Your Company Name',
      email = 'your@company.com',
      phone = '+1 (555) 123-4567',
      address = '123 Business St, City, Country',
      website = 'https://yourcompany.com',
      tax_number = 'TAX12345'
    WHERE user_id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';
    
    RAISE NOTICE 'Company data updated';
  ELSE
    -- Insert a new company
    INSERT INTO public.companies (
      name, email, phone, address, website, tax_number, user_id
    )
    VALUES (
      'Your Company Name',
      'your@company.com',
      '+1 (555) 123-4567',
      '123 Business St, City, Country',
      'https://yourcompany.com',
      'TAX12345',
      '34feae9d-cef4-4ab5-af62-81bceabe3d19'
    );
    
    RAISE NOTICE 'Company data created';
  END IF;
END
$$;
