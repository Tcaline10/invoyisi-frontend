-- Create invoice_settings table
CREATE TABLE IF NOT EXISTS invoice_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  invoice_prefix TEXT DEFAULT 'INV-',
  next_invoice_number INTEGER DEFAULT 1001,
  default_due_days INTEGER DEFAULT 30,
  default_tax_rate DECIMAL(5,2) DEFAULT 0,
  invoice_footer TEXT DEFAULT 'Thank you for your business!',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT invoice_settings_user_id_key UNIQUE (user_id)
);

-- Add RLS policies for invoice_settings table
ALTER TABLE invoice_settings ENABLE ROW LEVEL SECURITY;

-- Policy for selecting invoice settings (users can only see their own settings)
CREATE POLICY select_own_invoice_settings ON invoice_settings
  FOR SELECT USING (auth.uid() = user_id);

-- Policy for inserting invoice settings (users can only insert their own settings)
CREATE POLICY insert_own_invoice_settings ON invoice_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy for updating invoice settings (users can only update their own settings)
CREATE POLICY update_own_invoice_settings ON invoice_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- Policy for deleting invoice settings (users can only delete their own settings)
CREATE POLICY delete_own_invoice_settings ON invoice_settings
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update invoice settings
CREATE OR REPLACE FUNCTION update_invoice_settings(
  p_invoice_prefix TEXT,
  p_next_invoice_number INTEGER,
  p_default_due_days INTEGER,
  p_default_tax_rate DECIMAL,
  p_invoice_footer TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_settings_id UUID;
  v_result JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if the user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if the user already has invoice settings
  SELECT id INTO v_settings_id
  FROM invoice_settings
  WHERE user_id = v_user_id;
  
  -- If the user has settings, update them
  IF v_settings_id IS NOT NULL THEN
    UPDATE invoice_settings
    SET 
      invoice_prefix = p_invoice_prefix,
      next_invoice_number = p_next_invoice_number,
      default_due_days = p_default_due_days,
      default_tax_rate = p_default_tax_rate,
      invoice_footer = p_invoice_footer,
      updated_at = NOW()
    WHERE id = v_settings_id
    RETURNING to_jsonb(invoice_settings.*) INTO v_result;
  -- If the user doesn't have settings, create them
  ELSE
    INSERT INTO invoice_settings (
      invoice_prefix, next_invoice_number, default_due_days, default_tax_rate, invoice_footer, user_id
    ) VALUES (
      p_invoice_prefix, p_next_invoice_number, p_default_due_days, p_default_tax_rate, p_invoice_footer, v_user_id
    )
    RETURNING to_jsonb(invoice_settings.*) INTO v_result;
  END IF;
  
  RETURN v_result;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION update_invoice_settings TO authenticated;
