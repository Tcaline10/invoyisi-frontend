-- Complete Supabase setup script for InvoiceAI with Supabase Auth integration
-- This script will create all necessary tables, policies, and functions for the InvoiceAI application

-- First, clean up any existing tables and objects
DROP TABLE IF EXISTS public.payments;
DROP TABLE IF EXISTS public.invoice_items;
DROP TABLE IF EXISTS public.invoices;
DROP TABLE IF EXISTS public.clients;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP FUNCTION IF EXISTS public.update_invoice_status();
DROP FUNCTION IF EXISTS public.update_invoice_status_on_delete();
DROP FUNCTION IF EXISTS public.set_updated_at();

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create tables
-- Clients table
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

-- Invoices table
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

-- Invoice items table
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

-- Payments table
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

-- Create indexes for better performance
CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_email ON public.clients(email);
CREATE INDEX idx_clients_name ON public.clients(name);

CREATE INDEX idx_invoices_user_id ON public.invoices(user_id);
CREATE INDEX idx_invoices_client_id ON public.invoices(client_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

CREATE INDEX idx_invoice_items_invoice_id ON public.invoice_items(invoice_id);

CREATE INDEX idx_payments_user_id ON public.payments(user_id);
CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id);
CREATE INDEX idx_payments_date ON public.payments(date);

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

-- Create function to update invoice status when payment is added
CREATE OR REPLACE FUNCTION public.update_invoice_status()
RETURNS TRIGGER AS $$
DECLARE
  total_amount DECIMAL(10, 2);
  paid_amount DECIMAL(10, 2);
BEGIN
  -- Get the invoice total
  SELECT total INTO total_amount FROM public.invoices WHERE id = NEW.invoice_id;
  
  -- Calculate total paid amount including the new payment
  SELECT COALESCE(SUM(amount), 0) INTO paid_amount 
  FROM public.payments 
  WHERE invoice_id = NEW.invoice_id;
  
  -- Update invoice status based on payment
  IF paid_amount >= total_amount THEN
    UPDATE public.invoices SET status = 'paid' WHERE id = NEW.invoice_id;
  ELSIF paid_amount > 0 THEN
    UPDATE public.invoices SET status = 'partial' WHERE id = NEW.invoice_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment updates
CREATE TRIGGER update_invoice_status_on_payment
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_status();

-- Create function to update invoice status when payment is deleted
CREATE OR REPLACE FUNCTION public.update_invoice_status_on_delete()
RETURNS TRIGGER AS $$
DECLARE
  total_amount DECIMAL(10, 2);
  paid_amount DECIMAL(10, 2);
BEGIN
  -- Get the invoice total
  SELECT total INTO total_amount FROM public.invoices WHERE id = OLD.invoice_id;
  
  -- Calculate remaining paid amount after deletion
  SELECT COALESCE(SUM(amount), 0) INTO paid_amount 
  FROM public.payments 
  WHERE invoice_id = OLD.invoice_id AND id != OLD.id;
  
  -- Update invoice status based on remaining payment
  IF paid_amount = 0 THEN
    UPDATE public.invoices SET status = 'pending' WHERE id = OLD.invoice_id;
  ELSIF paid_amount < total_amount THEN
    UPDATE public.invoices SET status = 'partial' WHERE id = OLD.invoice_id;
  END IF;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for payment deletion
CREATE TRIGGER update_invoice_status_on_payment_delete
  BEFORE DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_invoice_status_on_delete();

-- Create function to automatically set updated_at timestamp
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER set_updated_at_clients
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_invoices
  BEFORE UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_invoice_items
  BEFORE UPDATE ON public.invoice_items
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER set_updated_at_payments
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Create a function to sync user data when a new user signs up with Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  -- Create a default client for the new user
  INSERT INTO public.clients (name, email, user_id)
  VALUES (
    'My First Client', 
    'client@example.com',
    NEW.id
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run when a new user is created in auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_signup();

-- Create a function to handle user profile updates
CREATE OR REPLACE FUNCTION public.handle_user_update()
RETURNS TRIGGER AS $$
BEGIN
  -- You can add logic here to sync user profile changes if needed
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to run when a user is updated in auth.users
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_user_update();

-- Create sample data for testing (only if you want demo data)
-- This will create a sample client, invoice, and payment for each user in the system
DO $$
DECLARE
  user_record RECORD;
  client_id INTEGER;
  invoice_id INTEGER;
BEGIN
  -- Loop through all existing users
  FOR user_record IN SELECT id FROM auth.users LOOP
    -- Create a sample client
    INSERT INTO public.clients (name, email, phone, address, company, user_id)
    VALUES (
      'Sample Client',
      'sample@example.com',
      '+1 (555) 123-4567',
      '123 Sample St, Sample City, SC 12345',
      'Sample Company',
      user_record.id
    )
    RETURNING id INTO client_id;
    
    -- Create a sample invoice
    INSERT INTO public.invoices (
      number, 
      status, 
      issued_date, 
      due_date, 
      subtotal, 
      tax, 
      total, 
      client_id, 
      user_id
    )
    VALUES (
      'INV-001',
      'pending',
      CURRENT_DATE,
      CURRENT_DATE + INTERVAL '30 days',
      1000.00,
      100.00,
      1100.00,
      client_id,
      user_record.id
    )
    RETURNING id INTO invoice_id;
    
    -- Create sample invoice items
    INSERT INTO public.invoice_items (description, quantity, unit_price, amount, invoice_id)
    VALUES
      ('Web Development', 10, 80.00, 800.00, invoice_id),
      ('Design Services', 4, 50.00, 200.00, invoice_id);
      
    -- Create a sample partial payment
    INSERT INTO public.payments (amount, date, method, reference, invoice_id, user_id)
    VALUES (
      500.00,
      CURRENT_DATE - INTERVAL '5 days',
      'bank_transfer',
      'REF123456',
      invoice_id,
      user_record.id
    );
  END LOOP;
END
$$;
