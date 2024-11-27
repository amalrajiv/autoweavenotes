-- Drop and recreate note_embeddings table with correct schema
DROP TABLE IF EXISTS public.note_embeddings;

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
  USING (user_id = auth.uid());

CREATE POLICY "Users can create note embeddings"
  ON public.note_embeddings FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update note embeddings"
  ON public.note_embeddings FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete note embeddings"
  ON public.note_embeddings FOR DELETE
  USING (user_id = auth.uid());

-- Refresh the schema cache
SELECT refresh_schema_cache();