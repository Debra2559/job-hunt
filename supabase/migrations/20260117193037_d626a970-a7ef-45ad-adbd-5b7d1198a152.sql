-- Enable vector extension for semantic search
CREATE EXTENSION IF NOT EXISTS vector;

-- Add tags column for categorization
ALTER TABLE public.knowledge_files 
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Add embedding column for semantic search (using 768 dimensions for embedding models)
ALTER TABLE public.knowledge_files 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Create index for faster vector similarity search
CREATE INDEX IF NOT EXISTS knowledge_files_embedding_idx 
ON public.knowledge_files 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for tags search
CREATE INDEX IF NOT EXISTS knowledge_files_tags_idx 
ON public.knowledge_files 
USING GIN (tags);

-- Create function for semantic search
CREATE OR REPLACE FUNCTION match_knowledge_files(
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