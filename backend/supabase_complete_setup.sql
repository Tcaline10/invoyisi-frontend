-- Complete Supabase setup script for InvoiceAI
-- This script will:
-- 1. Drop existing tables
-- 2. Create new tables with consistent data types
-- 3. Set up Row Level Security policies
-- 4. Create trigger functions for user management

-- First, drop all existing tables in the correct order
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.clients;
DROP TABLE IF EXISTS auth.users;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;

DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;

DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can insert invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can update invoice items for their invoices" ON public.invoice_items;
DROP POLICY IF EXISTS "Users can delete invoice items for their invoices" ON public.invoice_items;

DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;

-- Drop the trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Now create the tables with consistent data types
-- Enable the auth schema if not already enabled
CREATE SCHEMA IF NOT EXISTS auth;

-- Create users table
CREATE TABLE auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  hashed_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_superuser BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create clients table
CREATE TABLE public.clients (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  address TEXT,
  company TEXT,
  notes TEXT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoices table
CREATE TABLE public.invoices (
  id SERIAL PRIMARY KEY,
  number TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft',
  issued_date DATE NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  discount DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  notes TEXT,
  client_id INTEGER NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create invoice_items table
CREATE TABLE public.invoice_items (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  invoice_id INTEGER NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create payments table
CREATE TABLE public.payments (
  id SERIAL PRIMARY KEY,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  method TEXT NOT NULL,
  reference TEXT,
  notes TEXT,
  invoice_id INTEGER NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
CREATE POLICY "Users can view their own clients"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own clients"
  ON public.clients
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own clients"
  ON public.clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for invoices
CREATE POLICY "Users can view their own invoices"
  ON public.invoices
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own invoices"
  ON public.invoices
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own invoices"
  ON public.invoices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for invoice_items
CREATE POLICY "Users can view invoice items for their invoices"
  ON public.invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert invoice items for their invoices"
  ON public.invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update invoice items for their invoices"
  ON public.invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete invoice items for their invoices"
  ON public.invoice_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for payments
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payments"
  ON public.payments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payments"
  ON public.payments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO auth.users (id, email, full_name, hashed_password, is_active, is_superuser)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    '',  -- We don't store the actual password, Supabase handles that
    TRUE,
    FALSE
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
