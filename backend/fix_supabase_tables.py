import os
import httpx
import asyncio
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_ANON_KEY")

async def check_and_fix_tables():
    """Check existing tables in Supabase and generate fix script"""
    if not SUPABASE_URL or not SUPABASE_KEY:
        print("Error: SUPABASE_URL or SUPABASE_ANON_KEY not set in .env file")
        return
    
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    
    # Query to get table information
    query = """
    SELECT 
        table_schema, 
        table_name, 
        column_name, 
        data_type, 
        is_nullable
    FROM 
        information_schema.columns
    WHERE 
        table_schema IN ('public', 'auth')
    ORDER BY 
        table_schema, 
        table_name, 
        ordinal_position;
    """
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{SUPABASE_URL}/rest/v1/rpc/execute_sql",
                headers=headers,
                json={"query": query, "params": []}
            )
            
            if response.status_code == 200:
                data = response.json()
                
                # Group by table
                tables = {}
                for row in data:
                    schema = row['table_schema']
                    table = row['table_name']
                    key = f"{schema}.{table}"
                    
                    if key not in tables:
                        tables[key] = []
                    
                    tables[key].append({
                        'column': row['column_name'],
                        'type': row['data_type'],
                        'nullable': row['is_nullable']
                    })
                
                # Print table information
                print("=== Supabase Tables ===")
                for table_name, columns in tables.items():
                    print(f"\n{table_name}:")
                    for col in columns:
                        nullable = "NULL" if col['nullable'] == "YES" else "NOT NULL"
                        print(f"  - {col['column']}: {col['type']} {nullable}")
                
                # Generate fix script
                fix_script = generate_fix_script(tables)
                
                # Save fix script to file
                with open("supabase_fix_script.sql", "w") as f:
                    f.write(fix_script)
                
                print("\n=== Fix Script Generated ===")
                print("The fix script has been saved to 'supabase_fix_script.sql'")
                print("Run this script in the Supabase SQL Editor to fix any inconsistencies")
            else:
                print(f"❌ Failed to query tables. Status code: {response.status_code}")
                print(f"Response: {response.text}")
    except Exception as e:
        print(f"❌ Error querying tables: {str(e)}")

def generate_fix_script(tables):
    """Generate SQL script to fix table inconsistencies"""
    script = """-- Fix script for Supabase tables
-- Run this in the Supabase SQL Editor to fix any inconsistencies

"""
    
    # Check if tables exist
    required_tables = [
        "auth.users",
        "public.clients",
        "public.invoices",
        "public.invoice_items",
        "public.payments"
    ]
    
    for table in required_tables:
        if table not in tables:
            if table == "auth.users":
                script += f"""
-- Create {table} table
CREATE TABLE IF NOT EXISTS auth.users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  hashed_password TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_superuser BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

"""
            elif table == "public.clients":
                script += f"""
-- Create {table} table
CREATE TABLE IF NOT EXISTS public.clients (
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

"""
            elif table == "public.invoices":
                script += f"""
-- Create {table} table
CREATE TABLE IF NOT EXISTS public.invoices (
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

"""
            elif table == "public.invoice_items":
                script += f"""
-- Create {table} table
CREATE TABLE IF NOT EXISTS public.invoice_items (
  id SERIAL PRIMARY KEY,
  description TEXT NOT NULL,
  quantity DECIMAL(10, 2) NOT NULL DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  invoice_id INTEGER NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

"""
            elif table == "public.payments":
                script += f"""
-- Create {table} table
CREATE TABLE IF NOT EXISTS public.payments (
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

"""
    
    # Check for type inconsistencies
    if "public.invoices" in tables and "public.payments" in tables:
        # Check invoice_id type in payments table
        invoice_id_type = None
        for col in tables["public.payments"]:
            if col["column"] == "invoice_id":
                invoice_id_type = col["type"]
                break
        
        # Check id type in invoices table
        invoice_id_ref_type = None
        for col in tables["public.invoices"]:
            if col["column"] == "id":
                invoice_id_ref_type = col["type"]
                break
        
        if invoice_id_type and invoice_id_ref_type and invoice_id_type != invoice_id_ref_type:
            script += f"""
-- Fix type inconsistency between payments.invoice_id ({invoice_id_type}) and invoices.id ({invoice_id_ref_type})
-- First, drop the foreign key constraint
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_invoice_id_fkey;

-- Then, alter the column type to match
ALTER TABLE public.payments 
  ALTER COLUMN invoice_id TYPE {invoice_id_ref_type} USING invoice_id::{invoice_id_ref_type};

-- Finally, recreate the foreign key constraint
ALTER TABLE public.payments 
  ADD CONSTRAINT payments_invoice_id_fkey 
  FOREIGN KEY (invoice_id) 
  REFERENCES public.invoices(id) 
  ON DELETE CASCADE;

"""
    
    # Add RLS policies
    script += """
-- Enable Row Level Security
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for clients
DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
CREATE POLICY "Users can view their own clients"
  ON public.clients
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
CREATE POLICY "Users can insert their own clients"
  ON public.clients
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
CREATE POLICY "Users can update their own clients"
  ON public.clients
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
CREATE POLICY "Users can delete their own clients"
  ON public.clients
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for invoices
DROP POLICY IF EXISTS "Users can view their own invoices" ON public.invoices;
CREATE POLICY "Users can view their own invoices"
  ON public.invoices
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own invoices" ON public.invoices;
CREATE POLICY "Users can insert their own invoices"
  ON public.invoices
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own invoices" ON public.invoices;
CREATE POLICY "Users can update their own invoices"
  ON public.invoices
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own invoices" ON public.invoices;
CREATE POLICY "Users can delete their own invoices"
  ON public.invoices
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create RLS policies for invoice_items
DROP POLICY IF EXISTS "Users can view invoice items for their invoices" ON public.invoice_items;
CREATE POLICY "Users can view invoice items for their invoices"
  ON public.invoice_items
  FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can insert invoice items for their invoices" ON public.invoice_items;
CREATE POLICY "Users can insert invoice items for their invoices"
  ON public.invoice_items
  FOR INSERT
  WITH CHECK (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update invoice items for their invoices" ON public.invoice_items;
CREATE POLICY "Users can update invoice items for their invoices"
  ON public.invoice_items
  FOR UPDATE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete invoice items for their invoices" ON public.invoice_items;
CREATE POLICY "Users can delete invoice items for their invoices"
  ON public.invoice_items
  FOR DELETE
  USING (
    invoice_id IN (
      SELECT id FROM public.invoices WHERE user_id = auth.uid()
    )
  );

-- Create RLS policies for payments
DROP POLICY IF EXISTS "Users can view their own payments" ON public.payments;
CREATE POLICY "Users can view their own payments"
  ON public.payments
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own payments" ON public.payments;
CREATE POLICY "Users can insert their own payments"
  ON public.payments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payments" ON public.payments;
CREATE POLICY "Users can update their own payments"
  ON public.payments
  FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payments" ON public.payments;
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
"""
    
    return script

if __name__ == "__main__":
    asyncio.run(check_and_fix_tables())
