-- Create table to track knowledge file usage
CREATE TABLE public.knowledge_usage (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_id UUID REFERENCES public.knowledge_files(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES public.conversations(id) ON DELETE SET NULL,
  user_query TEXT NOT NULL,
  similarity REAL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_usage ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Admins can view knowledge usage"
  ON public.knowledge_usage
  FOR SELECT
  USING (public.is_admin(auth.uid()));

CREATE POLICY "Service role can insert knowledge usage"
  ON public.knowledge_usage
  FOR INSERT
  WITH CHECK (true);

-- Create index for efficient querying
CREATE INDEX idx_knowledge_usage_file_id ON public.knowledge_usage(file_id);
CREATE INDEX idx_knowledge_usage_created_at ON public.knowledge_usage(created_at DESC);