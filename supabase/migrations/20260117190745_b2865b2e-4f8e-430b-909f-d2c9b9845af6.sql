-- Create knowledge_files table for storing knowledge base metadata
CREATE TABLE public.knowledge_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_path TEXT NOT NULL,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  content_text TEXT,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable Row Level Security
ALTER TABLE public.knowledge_files ENABLE ROW LEVEL SECURITY;

-- Admins can view all knowledge files
CREATE POLICY "Admins can view all knowledge files" 
ON public.knowledge_files 
FOR SELECT 
USING (public.is_admin(auth.uid()));

-- Admins can insert knowledge files
CREATE POLICY "Admins can insert knowledge files" 
ON public.knowledge_files 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()));

-- Admins can update knowledge files
CREATE POLICY "Admins can update knowledge files" 
ON public.knowledge_files 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

-- Admins can delete knowledge files
CREATE POLICY "Admins can delete knowledge files" 
ON public.knowledge_files 
FOR DELETE 
USING (public.is_admin(auth.uid()));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_knowledge_files_updated_at
BEFORE UPDATE ON public.knowledge_files
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for knowledge files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('knowledge', 'knowledge', false);

-- Storage policies for knowledge bucket
CREATE POLICY "Admins can upload knowledge files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'knowledge' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can view knowledge files"
ON storage.objects
FOR SELECT
USING (bucket_id = 'knowledge' AND public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete knowledge files"
ON storage.objects
FOR DELETE
USING (bucket_id = 'knowledge' AND public.is_admin(auth.uid()));