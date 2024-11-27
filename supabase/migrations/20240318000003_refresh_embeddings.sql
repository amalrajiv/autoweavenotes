-- Refresh the schema cache for note_embeddings
NOTIFY pgrst, 'reload schema';

-- Add a function to refresh embeddings for a user
CREATE OR REPLACE FUNCTION refresh_user_embeddings(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Clear existing embeddings for the user
  DELETE FROM note_embeddings WHERE user_id = p_user_id;
  
  -- The application will need to regenerate embeddings for all notes
  -- This is handled by the client-side code
END;
$$;