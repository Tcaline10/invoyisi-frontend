-- Check if invoice_settings table exists, if not create it
CREATE TABLE IF NOT EXISTS invoice_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  invoice_prefix text DEFAULT 'INV-',
  next_invoice_number integer DEFAULT 1001,
  default_due_days integer DEFAULT 30,
  default_notes text,
  default_tax_rate numeric(5,2) DEFAULT 0,
  default_currency text DEFAULT 'XAF',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security on invoice_settings table
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to manage their own invoice settings
CREATE POLICY "Users can CRUD own invoice settings"
  ON invoice_settings
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid());

-- Create a function to automatically create invoice settings for new users
CREATE OR REPLACE FUNCTION public.create_default_invoice_settings()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.invoice_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger to call the function when a new user is created
DROP TRIGGER IF EXISTS create_invoice_settings_for_new_user ON auth.users;
CREATE TRIGGER create_invoice_settings_for_new_user
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_default_invoice_settings();
