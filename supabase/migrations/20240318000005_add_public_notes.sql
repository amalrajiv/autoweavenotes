-- Add public sharing columns to notes table
ALTER TABLE public.notes
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS public_id UUID DEFAULT uuid_generate_v4();

-- Create index for public_id
CREATE INDEX IF NOT EXISTS idx_notes_public_id ON public.notes(public_id);

-- Create policy for public note access
CREATE POLICY "Anyone can view public notes" ON public.notes
FOR SELECT USING (is_public = true);

-- Function to generate share link
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
  RETURNING public_id INTO public_id;
  
  RETURN public_id;
END;
$$;