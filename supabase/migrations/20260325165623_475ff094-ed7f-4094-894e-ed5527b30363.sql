
-- Create conversation_folders table
CREATE TABLE public.conversation_folders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  icon TEXT DEFAULT 'folder',
  color TEXT DEFAULT 'primary',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add unique constraint on user_id + name
ALTER TABLE public.conversation_folders ADD CONSTRAINT conversation_folders_user_name_unique UNIQUE (user_id, name);

-- Enable RLS
ALTER TABLE public.conversation_folders ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own folders" ON public.conversation_folders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own folders" ON public.conversation_folders FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own folders" ON public.conversation_folders FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own folders" ON public.conversation_folders FOR DELETE USING (auth.uid() = user_id);

-- Add folder_id column to conversations
ALTER TABLE public.conversations ADD COLUMN folder_id UUID REFERENCES public.conversation_folders(id) ON DELETE SET NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_conversation_folders_updated_at
  BEFORE UPDATE ON public.conversation_folders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
