-- Create a function to ensure required columns exist
CREATE OR REPLACE FUNCTION ensure_required_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add columns to notes table if they don't exist
  BEGIN
    ALTER TABLE public.notes 
    ADD COLUMN is_public BOOLEAN DEFAULT false;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  BEGIN
    ALTER TABLE public.notes 
    ADD COLUMN public_id UUID DEFAULT uuid_generate_v4();
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;

  -- Add user_id to note_embeddings if it doesn't exist
  BEGIN
    ALTER TABLE public.note_embeddings 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_column THEN NULL;
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION ensure_required_columns() TO authenticated;