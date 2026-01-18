-- Create conversation_tags table for custom grouping
CREATE TABLE public.conversation_tags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  color TEXT DEFAULT 'primary',
  icon TEXT DEFAULT 'tag',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create junction table for many-to-many relationship
CREATE TABLE public.conversation_tag_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.conversation_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, tag_id)
);

-- Enable RLS on both tables
ALTER TABLE public.conversation_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_tag_assignments ENABLE ROW LEVEL SECURITY;

-- RLS policies for conversation_tags
CREATE POLICY "Users can view their own tags"
ON public.conversation_tags FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tags"
ON public.conversation_tags FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tags"
ON public.conversation_tags FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tags"
ON public.conversation_tags FOR DELETE
USING (auth.uid() = user_id);

-- RLS policies for conversation_tag_assignments
CREATE POLICY "Users can view their tag assignments"
ON public.conversation_tag_assignments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.conversations
  WHERE conversations.id = conversation_tag_assignments.conversation_id
  AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can insert their tag assignments"
ON public.conversation_tag_assignments FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.conversations
  WHERE conversations.id = conversation_tag_assignments.conversation_id
  AND conversations.user_id = auth.uid()
));

CREATE POLICY "Users can delete their tag assignments"
ON public.conversation_tag_assignments FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.conversations
  WHERE conversations.id = conversation_tag_assignments.conversation_id
  AND conversations.user_id = auth.uid()
));

-- Create indexes
CREATE INDEX idx_conversation_tags_user_id ON public.conversation_tags(user_id);
CREATE INDEX idx_conversation_tag_assignments_conversation_id ON public.conversation_tag_assignments(conversation_id);
CREATE INDEX idx_conversation_tag_assignments_tag_id ON public.conversation_tag_assignments(tag_id);