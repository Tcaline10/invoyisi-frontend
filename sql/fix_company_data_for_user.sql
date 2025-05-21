-- This script fixes the company data for a specific user
-- Replace '34feae9d-cef4-4ab5-af62-81bceabe3d19' with your actual user ID if needed

-- First, check if the user has a company
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
      name = 'Your Company Name',
      email = 'your@company.com',
      phone = '+1 (555) 123-4567',
      address = '123 Business St, City, Country',
      website = 'https://yourcompany.com',
      tax_number = 'TAX12345'
    WHERE id = company_id;
    
    RAISE NOTICE 'Company data updated for ID: %', company_id;
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
    )
    RETURNING id INTO company_id;
    
    RAISE NOTICE 'Company data created with ID: %', company_id;
  END IF;
END
$$;

-- Verify the results
SELECT * FROM public.companies WHERE user_id = '34feae9d-cef4-4ab5-af62-81bceabe3d19';
