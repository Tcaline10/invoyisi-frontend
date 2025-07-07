/*
  # Initial Schema Setup

  1. New Tables
    - users
      - id (uuid, primary key)
      - email (text)
      - full_name (text)
      - avatar_url (text)
      - created_at (timestamp)
      
    - companies
      - id (uuid, primary key)
      - name (text)
      - logo_url (text)
      - address (text)
      - phone (text)
      - email (text)
      - website (text)
      - tax_number (text)
      - user_id (uuid, references users)
      
    - clients
      - id (uuid, primary key)
      - name (text)
      - email (text)
      - phone (text)
      - address (text)
      - company_name (text)
      - notes (text)
      - user_id (uuid, references users)
      - created_at (timestamp)
      
    - invoices
      - id (uuid, primary key)
      - number (text)
      - client_id (uuid, references clients)
      - user_id (uuid, references users)
      - issued_date (date)
      - due_date (date)
      - subtotal (numeric)
      - tax_rate (numeric)
      - tax_amount (numeric)
      - total (numeric)
      - notes (text)
      - status (text)
      - stripe_payment_intent_id (text)
      - created_at (timestamp)
      
    - invoice_items
      - id (uuid, primary key)
      - invoice_id (uuid, references invoices)
      - description (text)
      - quantity (numeric)
      - unit_price (numeric)
      - amount (numeric)
      
    - recurring_invoices
      - id (uuid, primary key)
      - client_id (uuid, references clients)
      - user_id (uuid, references users)
      - frequency (text)
      - next_date (date)
      - template (jsonb)
      - active (boolean)
      
  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text,
  avatar_url text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- Create companies table
CREATE TABLE IF NOT EXISTS companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  logo_url text,
  address text,
  phone text,
  email text,
  website text,
  tax_number text,
  user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own company"
  ON companies
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create clients table
CREATE TABLE IF NOT EXISTS clients (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text,
  phone text,
  address text,
  company_name text,
  notes text,
  user_id uuid REFERENCES users(id) NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own clients"
  ON clients
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create invoices table
CREATE TABLE IF NOT EXISTS invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  number text NOT NULL,
  client_id uuid REFERENCES clients(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  issued_date date NOT NULL,
  due_date date NOT NULL,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric NOT NULL DEFAULT 0,
  tax_amount numeric NOT NULL DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  notes text,
  status text NOT NULL DEFAULT 'draft',
  stripe_payment_intent_id text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own invoices"
  ON invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);

-- Create invoice_items table
CREATE TABLE IF NOT EXISTS invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES invoices(id) ON DELETE CASCADE NOT NULL,
  description text NOT NULL,
  quantity numeric NOT NULL DEFAULT 1,
  unit_price numeric NOT NULL DEFAULT 0,
  amount numeric NOT NULL DEFAULT 0
);

ALTER TABLE invoice_items ENABLE ROW LEVEL SECURITY;

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

-- Create recurring_invoices table
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid REFERENCES clients(id) NOT NULL,
  user_id uuid REFERENCES users(id) NOT NULL,
  frequency text NOT NULL,
  next_date date NOT NULL,
  template jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can CRUD own recurring invoices"
  ON recurring_invoices
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id);