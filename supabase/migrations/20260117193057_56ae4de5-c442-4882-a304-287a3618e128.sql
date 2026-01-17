-- Fix function search path for match_knowledge_files
DROP FUNCTION IF EXISTS public.match_knowledge_files;

CREATE OR REPLACE FUNCTION public.match_knowledge_files(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 5
)
RETURNS TABLE (
  id uuid,
  file_name text,
  content_text text,
  tags text[],
  similarity float
)
LANGUAGE sql STABLE
SET search_path = public
AS $$
  SELECT
    knowledge_files.id,
    knowledge_files.file_name,
    knowledge_files.content_text,
    knowledge_files.tags,
    1 - (knowledge_files.embedding <=> query_embedding) as similarity
  FROM knowledge_files
  WHERE 
    knowledge_files.status = 'ready'
    AND knowledge_files.embedding IS NOT NULL
    AND 1 - (knowledge_files.embedding <=> query_embedding) > match_threshold
  ORDER BY knowledge_files.embedding <=> query_embedding
  LIMIT match_count;
$$;