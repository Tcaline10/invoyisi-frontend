-- Create recurring_invoices table if it doesn't exist
CREATE TABLE IF NOT EXISTS recurring_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  frequency text NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'quarterly', 'yearly')),
  next_date date NOT NULL,
  last_sent date,
  template jsonb NOT NULL,
  active boolean NOT NULL DEFAULT true,
  client_id integer REFERENCES clients(id) NOT NULL,
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on recurring_invoices table
ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can CRUD own recurring invoices" ON recurring_invoices;

-- Create policy to allow users to manage their own recurring invoices
CREATE POLICY "Users can CRUD own recurring invoices"
  ON recurring_invoices
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());
