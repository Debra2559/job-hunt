-- Create knowledge categories table
CREATE TABLE public.knowledge_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT DEFAULT 'gray',
  icon TEXT DEFAULT 'folder',
  parent_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add category_id to knowledge_files
ALTER TABLE public.knowledge_files 
ADD COLUMN category_id UUID REFERENCES public.knowledge_categories(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.knowledge_categories ENABLE ROW LEVEL SECURITY;

-- Create policies for knowledge_categories (admin only for write, public read)
CREATE POLICY "Anyone can view categories" 
ON public.knowledge_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can manage categories" 
ON public.knowledge_categories 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin', 'super_admin')
  )
);

-- Create index for faster lookups
CREATE INDEX idx_knowledge_files_category ON public.knowledge_files(category_id);
CREATE INDEX idx_knowledge_categories_parent ON public.knowledge_categories(parent_id);

-- Insert some default categories
INSERT INTO public.knowledge_categories (name, description, color, icon, sort_order) VALUES
('政策法规', '学校规章制度和相关政策', 'blue', 'scale', 1),
('学业指导', '课程、学分、考试相关', 'green', 'graduation-cap', 2),
('心理健康', '心理咨询和健康指导', 'purple', 'heart', 3),
('就业指导', '实习、就业、创业相关', 'orange', 'briefcase', 4),
('校园生活', '住宿、餐饮、活动等', 'pink', 'home', 5),
('行政服务', '证明、报销、办事流程', 'cyan', 'file-text', 6);