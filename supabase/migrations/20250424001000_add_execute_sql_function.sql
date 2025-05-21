-- Create a function to execute SQL queries
CREATE OR REPLACE FUNCTION execute_sql(sql_query TEXT, params TEXT[] DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_rows JSONB;
BEGIN
  -- Check if the user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Execute the query and convert the result to JSON
  IF params IS NULL THEN
    -- For SELECT queries that return rows
    IF sql_query ~* '^SELECT' OR sql_query ~* 'RETURNING' THEN
      EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || sql_query || ') t' INTO result_rows;
      RETURN COALESCE(result_rows, '[]'::jsonb);
    -- For non-SELECT queries (INSERT, UPDATE, DELETE without RETURNING)
    ELSE
      EXECUTE sql_query;
      RETURN jsonb_build_object('success', true, 'message', 'Query executed successfully');
    END IF;
  ELSE
    -- For parameterized queries
    IF sql_query ~* '^SELECT' OR sql_query ~* 'RETURNING' THEN
      -- This is a bit tricky with parameterized queries, so we'll use a simpler approach
      EXECUTE sql_query USING params;
      RETURN jsonb_build_object('success', true, 'message', 'Query executed successfully');
    ELSE
      EXECUTE sql_query USING params;
      RETURN jsonb_build_object('success', true, 'message', 'Query executed successfully');
    END IF;
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'error', SQLERRM,
      'detail', SQLSTATE
    );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION execute_sql TO authenticated;

-- Add unique constraint on user_id in companies table if it doesn't exist
DO $$
BEGIN
    -- Check if the constraint already exists
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'companies_user_id_key'
    ) THEN
        -- Add the constraint if it doesn't exist
        ALTER TABLE companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);
    END IF;
END $$;
