-- Create a function to update company data
CREATE OR REPLACE FUNCTION update_company(
  p_name TEXT,
  p_logo_url TEXT,
  p_address TEXT,
  p_phone TEXT,
  p_email TEXT,
  p_website TEXT,
  p_tax_number TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_company_id UUID;
  v_result JSONB;
BEGIN
  -- Get the current user ID
  v_user_id := auth.uid();
  
  -- Check if the user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if the user already has a company
  SELECT id INTO v_company_id
  FROM companies
  WHERE user_id = v_user_id;
  
  -- If the user has a company, update it
  IF v_company_id IS NOT NULL THEN
    UPDATE companies
    SET 
      name = p_name,
      logo_url = p_logo_url,
      address = p_address,
      phone = p_phone,
      email = p_email,
      website = p_website,
      tax_number = p_tax_number
    WHERE id = v_company_id
    RETURNING to_jsonb(companies.*) INTO v_result;
  -- If the user doesn't have a company, create one
  ELSE
    INSERT INTO companies (
      name, logo_url, address, phone, email, website, tax_number, user_id
    ) VALUES (
      p_name, p_logo_url, p_address, p_phone, p_email, p_website, p_tax_number, v_user_id
    )
    RETURNING to_jsonb(companies.*) INTO v_result;
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
GRANT EXECUTE ON FUNCTION update_company TO authenticated;
