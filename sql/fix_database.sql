-- Fix database tables and create storage buckets

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

-- Create policy to allow users to manage their own profile (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'users' AND policyname = 'Users can manage their own profile'
  ) THEN
    CREATE POLICY "Users can manage their own profile"
      ON users
      FOR ALL
      TO authenticated
      USING (id = auth.uid());
  END IF;
END
$$;

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

-- Create policy to allow users to manage their own clients (if it doesn't exist)
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

-- Create policy to allow users to manage their own companies (if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'companies' AND policyname = 'Users can manage their own companies'
  ) THEN
    CREATE POLICY "Users can manage their own companies"
      ON companies
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

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

-- Create invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'paid', 'partial', 'overdue', 'cancelled')),
  issued_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax numeric DEFAULT 0,
  discount numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  client_id uuid REFERENCES clients(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on invoices table
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own invoices
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoices' AND policyname = 'Users can CRUD own invoices'
  ) THEN
    CREATE POLICY "Users can CRUD own invoices"
      ON invoices
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid());
  END IF;
END
$$;

-- Create invoice_items table if it doesn't exist
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0,
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on invoice_items table
ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own invoice items
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'invoice_items' AND policyname = 'Users can CRUD own invoice items'
  ) THEN
    CREATE POLICY "Users can CRUD own invoice items"
      ON invoice_items
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM invoices
          WHERE invoices.id = invoice_items.invoice_id
          AND invoices.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create payments table if it doesn't exist
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  date date NOT NULL,
  method text NOT NULL,
  reference text,
  notes text,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on payments table
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own payments
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'payments' AND policyname = 'Users can CRUD own payments'
  ) THEN
    CREATE POLICY "Users can CRUD own payments"
      ON payments
      FOR ALL
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM invoices
          WHERE invoices.id = payments.invoice_id
          AND invoices.user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- Create storage policies

-- Create a policy to allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own avatars"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'avatars' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read any avatar
CREATE POLICY "Anyone can view avatars"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'avatars');

-- Create a policy to allow authenticated users to upload their own company logos
CREATE POLICY "Users can upload their own company logos"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'company_logos' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read any company logo
CREATE POLICY "Anyone can view company logos"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'company_logos');

-- Create a policy to allow authenticated users to upload their own invoice files
CREATE POLICY "Users can upload their own invoice files"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );

-- Create a policy to allow authenticated users to read only their own invoice files
CREATE POLICY "Users can view their own invoice files"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'invoices' AND
    (storage.foldername(name))[1] = auth.uid()::text
  );
