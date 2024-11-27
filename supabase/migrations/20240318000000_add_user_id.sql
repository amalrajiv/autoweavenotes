-- Add user_id column to notes table if it doesn't exist
ALTER TABLE public.notes 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to folders table if it doesn't exist
ALTER TABLE public.folders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to note_embeddings table if it doesn't exist
ALTER TABLE public.note_embeddings 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Update RLS policies for notes
DROP POLICY IF EXISTS "Users can only see their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can insert their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can update their own notes" ON public.notes;
DROP POLICY IF EXISTS "Users can delete their own notes" ON public.notes;

CREATE POLICY "Users can only see their own notes"
  ON public.notes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notes"
  ON public.notes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own notes"
  ON public.notes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notes"
  ON public.notes FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for folders
DROP POLICY IF EXISTS "Users can only see their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can insert their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can update their own folders" ON public.folders;
DROP POLICY IF EXISTS "Users can delete their own folders" ON public.folders;

CREATE POLICY "Users can only see their own folders"
  ON public.folders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own folders"
  ON public.folders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own folders"
  ON public.folders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own folders"
  ON public.folders FOR DELETE
  USING (auth.uid() = user_id);

-- Update RLS policies for note_embeddings
DROP POLICY IF EXISTS "Users can only see their own note embeddings" ON public.note_embeddings;
DROP POLICY IF EXISTS "Users can insert their own note embeddings" ON public.note_embeddings;
DROP POLICY IF EXISTS "Users can update their own note embeddings" ON public.note_embeddings;
DROP POLICY IF EXISTS "Users can delete their own note embeddings" ON public.note_embeddings;

CREATE POLICY "Users can only see their own note embeddings"
  ON public.note_embeddings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own note embeddings"
  ON public.note_embeddings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own note embeddings"
  ON public.note_embeddings FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own note embeddings"
  ON public.note_embeddings FOR DELETE
  USING (auth.uid() = user_id);