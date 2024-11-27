-- Drop existing note_embeddings table if it exists
DROP TABLE IF EXISTS public.note_embeddings;

-- Recreate note_embeddings table with correct schema
CREATE TABLE public.note_embeddings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  note_id UUID REFERENCES public.notes(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  embedding vector(1536) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for vector similarity search
CREATE INDEX note_embeddings_embedding_idx ON note_embeddings 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Enable RLS
ALTER TABLE public.note_embeddings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
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