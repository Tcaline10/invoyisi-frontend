-- Add a unique constraint on user_id in the companies table
-- This will ensure that each user can only have one company

-- First, check if there are any duplicate user_id values
DO $$
DECLARE
  duplicate_count integer;
BEGIN
  -- Count duplicate user_id values
  SELECT COUNT(*) INTO duplicate_count
  FROM (
    SELECT user_id, COUNT(*) as count
    FROM public.companies
    GROUP BY user_id
    HAVING COUNT(*) > 1
  ) as duplicates;
  
  IF duplicate_count > 0 THEN
    RAISE NOTICE 'Found % users with multiple companies. Fixing...', duplicate_count;
    
    -- For each user with multiple companies, keep the most recently updated one
    -- and delete the others
    WITH duplicates AS (
      SELECT user_id
      FROM public.companies
      GROUP BY user_id
      HAVING COUNT(*) > 1
    ),
    to_keep AS (
      SELECT DISTINCT ON (user_id) id
      FROM public.companies
      WHERE user_id IN (SELECT user_id FROM duplicates)
      ORDER BY user_id, created_at DESC
    )
    DELETE FROM public.companies
    WHERE user_id IN (SELECT user_id FROM duplicates)
    AND id NOT IN (SELECT id FROM to_keep);
    
    RAISE NOTICE 'Duplicates fixed.';
  ELSE
    RAISE NOTICE 'No duplicate user_id values found.';
  END IF;
END
$$;

-- Now add the unique constraint
ALTER TABLE public.companies DROP CONSTRAINT IF EXISTS companies_user_id_key;
ALTER TABLE public.companies ADD CONSTRAINT companies_user_id_key UNIQUE (user_id);

-- Verify the constraint was added
SELECT constraint_name, constraint_type
FROM information_schema.table_constraints
WHERE table_name = 'companies'
AND constraint_name = 'companies_user_id_key';
