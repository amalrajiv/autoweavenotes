-- Drop and recreate the match_notes function to include user_id
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  content text,
  similarity float
)
LANGUAGE sql STABLE
AS $$
  SELECT
    note_embeddings.note_id as id,
    note_embeddings.content,
    1 - (note_embeddings.embedding <=> query_embedding) as similarity
  FROM note_embeddings
  WHERE 
    1 - (note_embeddings.embedding <=> query_embedding) > match_threshold
    AND note_embeddings.user_id = p_user_id
  ORDER BY note_embeddings.embedding <=> query_embedding
  LIMIT match_count;
$$;