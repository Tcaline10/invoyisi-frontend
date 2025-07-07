-- Create users table if it doesn't exist
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
DROP POLICY IF EXISTS "Users can manage their own profile" ON users;
CREATE POLICY "Users can manage their own profile"
  ON users
  FOR ALL
  TO authenticated
  USING (id = auth.uid());

-- Create clients table if it doesn't exist
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

-- Enable Row Level Security on clients table
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own clients
DROP POLICY IF EXISTS "Users can CRUD own clients" ON clients;
CREATE POLICY "Users can CRUD own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create companies table if it doesn't exist
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

-- Enable Row Level Security on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own companies
DROP POLICY IF EXISTS "Users can manage their own companies" ON companies;
CREATE POLICY "Users can manage their own companies"
  ON companies
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create storage buckets for the application

-- Create avatars bucket for user profile pictures
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']::text[];

-- Create company_logos bucket for company logos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'company_logos',
  'company_logos',
  true,
  2097152, -- 2MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 2097152,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[];

-- Create invoices bucket for invoice PDFs and attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false, -- private
  10485760, -- 10MB
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[]
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']::text[];

-- Create storage policies

-- Create a policy to allow authenticated users to upload their own avatars
DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read any avatar
DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Create a policy to allow authenticated users to upload their own company logos
DROP POLICY IF EXISTS "Users can upload their own company logos" ON storage.objects;
CREATE POLICY "Users can upload their own company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company_logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read any company logo
DROP POLICY IF EXISTS "Anyone can view company logos" ON storage.objects;
CREATE POLICY "Anyone can view company logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company_logos');

-- Create a policy to allow authenticated users to upload their own invoice files
DROP POLICY IF EXISTS "Users can upload their own invoice files" ON storage.objects;
CREATE POLICY "Users can upload their own invoice files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read only their own invoice files
DROP POLICY IF EXISTS "Users can view their own invoice files" ON storage.objects;
CREATE POLICY "Users can view their own invoice files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
