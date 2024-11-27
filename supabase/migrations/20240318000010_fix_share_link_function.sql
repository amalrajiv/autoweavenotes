-- Drop and recreate the generate_share_link function with fixed column reference
CREATE OR REPLACE FUNCTION generate_share_link(note_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_public_id UUID;
BEGIN
  UPDATE notes
  SET 
    is_public = true,
    public_id = COALESCE(notes.public_id, uuid_generate_v4())
  WHERE id = note_id
  AND auth.uid() = user_id  -- Ensure user owns the note
  RETURNING notes.public_id INTO result_public_id;
  
  RETURN result_public_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_share_link(UUID) TO authenticated;

-- Refresh the schema cache
SELECT refresh_schema_cache();