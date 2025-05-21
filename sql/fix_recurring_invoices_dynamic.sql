-- Dynamic script to create recurring_invoices table based on clients table structure
DO $$
DECLARE
    client_id_type text;
BEGIN
    -- Check if clients table exists and get the data type of its id column
    SELECT data_type INTO client_id_type
    FROM information_schema.columns
    WHERE table_name = 'clients' AND column_name = 'id';
    
    -- If clients table doesn't exist or id column not found
    IF client_id_type IS NULL THEN
        RAISE EXCEPTION 'Clients table not found or id column missing';
    END IF;
    
    -- Drop existing recurring_invoices table if it exists
    DROP TABLE IF EXISTS recurring_invoices;
    
    -- Create recurring_invoices table with the correct client_id type
    IF client_id_type = 'uuid' THEN
        -- Create with UUID client_id
        EXECUTE '
        CREATE TABLE recurring_invoices (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          frequency text NOT NULL CHECK (frequency IN (''weekly'', ''monthly'', ''quarterly'', ''yearly'')),
          next_date date NOT NULL,
          last_sent date,
          template jsonb NOT NULL,
          active boolean NOT NULL DEFAULT true,
          client_id uuid REFERENCES clients(id) NOT NULL,
          user_id uuid REFERENCES auth.users(id) NOT NULL,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        )';
        RAISE NOTICE 'Created recurring_invoices table with UUID client_id';
    ELSIF client_id_type IN ('integer', 'bigint') THEN
        -- Create with INTEGER client_id
        EXECUTE '
        CREATE TABLE recurring_invoices (
          id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
          name text NOT NULL,
          frequency text NOT NULL CHECK (frequency IN (''weekly'', ''monthly'', ''quarterly'', ''yearly'')),
          next_date date NOT NULL,
          last_sent date,
          template jsonb NOT NULL,
          active boolean NOT NULL DEFAULT true,
          client_id ' || client_id_type || ' REFERENCES clients(id) NOT NULL,
          user_id uuid REFERENCES auth.users(id) NOT NULL,
          created_at timestamptz DEFAULT now(),
          updated_at timestamptz DEFAULT now()
        )';
        RAISE NOTICE 'Created recurring_invoices table with % client_id', client_id_type;
    ELSE
        -- Unsupported type
        RAISE EXCEPTION 'Unsupported client_id type: %', client_id_type;
    END IF;
    
    -- Enable Row Level Security
    EXECUTE 'ALTER TABLE recurring_invoices ENABLE ROW LEVEL SECURITY';
    
    -- Create policy
    EXECUTE '
    CREATE POLICY "Users can CRUD own recurring invoices"
      ON recurring_invoices
      FOR ALL
      TO authenticated
      USING (user_id = auth.uid())';
      
    RAISE NOTICE 'Successfully created recurring_invoices table and policies';
END
$$;
