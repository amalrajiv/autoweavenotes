-- Refresh schema cache function
CREATE OR REPLACE FUNCTION refresh_schema_cache()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Force PostgREST to reload its schema cache
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION refresh_schema_cache() TO authenticated;

-- Ensure all required columns exist
DO $$ 
BEGIN
  -- Add user_id to note_embeddings if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'note_embeddings' 
    AND column_name = 'user_id'
  ) THEN
    ALTER TABLE public.note_embeddings 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  -- Add is_public and public_id to notes if they don't exist
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'is_public'
  ) THEN
    ALTER TABLE public.notes 
    ADD COLUMN is_public BOOLEAN DEFAULT false;
  END IF;

  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'notes' 
    AND column_name = 'public_id'
  ) THEN
    ALTER TABLE public.notes 
    ADD COLUMN public_id UUID DEFAULT uuid_generate_v4();
  END IF;
END $$;

-- Create index for public_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notes_public_id ON public.notes(public_id);

-- Refresh the schema cache
SELECT refresh_schema_cache();