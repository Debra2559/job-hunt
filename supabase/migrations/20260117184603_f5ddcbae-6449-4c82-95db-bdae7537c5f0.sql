-- Create role enum
CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'user');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'user',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to check if user is admin or super_admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'super_admin')
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Super admins can do everything"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Create feedback table for user feedback
CREATE TABLE public.feedbacks (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    message_id uuid REFERENCES public.messages(id) ON DELETE CASCADE,
    feedback_type text NOT NULL CHECK (feedback_type IN ('positive', 'negative')),
    content text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.feedbacks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own feedback"
ON public.feedbacks
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
ON public.feedbacks
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all feedback"
ON public.feedbacks
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create analytics table to track page views and queries
CREATE TABLE public.analytics (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type text NOT NULL CHECK (event_type IN ('page_view', 'query', 'session')),
    metadata jsonb DEFAULT '{}',
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert analytics"
ON public.analytics
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can view all analytics"
ON public.analytics
FOR SELECT
TO authenticated
USING (public.is_admin(auth.uid()));

-- Create trigger for user_roles updated_at
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert super admin role for tenghuijin@163.com (will be done when user signs up)
-- Create a trigger to auto-assign super_admin role
CREATE OR REPLACE FUNCTION public.assign_super_admin()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.email = 'tenghuijin@163.com' THEN
        INSERT INTO public.user_roles (user_id, role)
        VALUES (NEW.id, 'super_admin')
        ON CONFLICT (user_id, role) DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created_assign_role
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.assign_super_admin();