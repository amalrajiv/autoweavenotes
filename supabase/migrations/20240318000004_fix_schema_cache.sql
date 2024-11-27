-- Create a function to refresh the PostgREST schema cache
CREATE OR REPLACE FUNCTION refresh_schema_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_schema_cache() TO authenticated;

-- Refresh the schema cache immediately
SELECT refresh_schema_cache();