-- Ensure all required columns exist
DO $$ 
BEGIN
  -- Add columns to notes table if they don't exist
  BEGIN
    ALTER TABLE public.notes 
    ADD COLUMN is_public BOOLEAN DEFAULT false;
  EXCEPTION
    WHEN duplicate_column THEN 
      NULL;
  END;

  BEGIN
    ALTER TABLE public.notes 
    ADD COLUMN public_id UUID DEFAULT uuid_generate_v4();
  EXCEPTION
    WHEN duplicate_column THEN 
      NULL;
  END;

  -- Add user_id to note_embeddings if it doesn't exist
  BEGIN
    ALTER TABLE public.note_embeddings 
    ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  EXCEPTION
    WHEN duplicate_column THEN 
      NULL;
  END;
END $$;

-- Create index for public_id if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_notes_public_id ON public.notes(public_id);

-- Update RLS policies for public notes
DO $$ 
BEGIN
  -- Drop existing policy if it exists
  DROP POLICY IF EXISTS "Anyone can view public notes" ON public.notes;
  
  -- Create new policy
  CREATE POLICY "Anyone can view public notes" ON public.notes
    FOR SELECT USING (is_public = true);
EXCEPTION
  WHEN others THEN NULL;
END $$;

-- Create or replace the generate_share_link function
CREATE OR REPLACE FUNCTION generate_share_link(note_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  public_id UUID;
BEGIN
  UPDATE notes
  SET 
    is_public = true,
    public_id = COALESCE(public_id, uuid_generate_v4())
  WHERE id = note_id
  AND auth.uid() = user_id  -- Ensure user owns the note
  RETURNING public_id INTO public_id;
  
  RETURN public_id;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION generate_share_link(UUID) TO authenticated;

-- Refresh the schema cache
SELECT refresh_schema_cache();