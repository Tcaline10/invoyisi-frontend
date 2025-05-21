-- Fix the clients table to ensure it has the correct columns

-- Make sure the clients table exists
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  address text,
  company_name text,
  notes text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security if not already enabled
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own clients if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'clients' AND policyname = 'Users can CRUD own clients'
  ) THEN
    CREATE POLICY "Users can CRUD own clients"
      ON clients
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- Check if company_name column exists, if not add it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE clients ADD COLUMN company_name text;
  END IF;
END
$$;

-- Create a function to copy data from company to company_name if needed
CREATE OR REPLACE FUNCTION migrate_company_to_company_name()
RETURNS void AS $$
DECLARE
  company_exists boolean;
BEGIN
  -- Check if 'company' column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'company'
  ) INTO company_exists;

  -- If 'company' column exists, copy data to 'company_name'
  IF company_exists THEN
    UPDATE clients
    SET company_name = company
    WHERE company IS NOT NULL AND company_name IS NULL;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Execute the function
SELECT migrate_company_to_company_name();

-- Drop the function after use
DROP FUNCTION migrate_company_to_company_name();

-- Drop the 'company' column if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'company'
  ) THEN
    ALTER TABLE clients DROP COLUMN company;
  END IF;
END
$$;
