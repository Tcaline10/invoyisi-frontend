-- Create users table if it doesn't exist (for storing user profile data)
CREATE TABLE IF NOT EXISTS users (
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
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own profile
CREATE POLICY "Users can manage their own profile"
  ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Create companies table for storing company information
CREATE TABLE IF NOT EXISTS companies (
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

-- Enable Row Level Security
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own companies
CREATE POLICY "Users can manage their own companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create policy to allow users to read companies they have invoices with
CREATE POLICY "Users can read companies they have invoices with"
  ON companies
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM invoices
      WHERE invoices.client_id IN (
        SELECT id FROM clients
        WHERE clients.company_name = companies.name
      )
      AND invoices.user_id = auth.uid()
    )
  );

-- Add company_name column to users table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'users' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE users ADD COLUMN company_name text;
  END IF;
END
$$;
