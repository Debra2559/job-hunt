-- Create system settings table for storing admin notification emails and other configs
CREATE TABLE public.system_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Only admins can view and manage settings
CREATE POLICY "Admins can view settings"
ON public.system_settings
FOR SELECT
USING (is_admin(auth.uid()));

CREATE POLICY "Super admins can manage settings"
ON public.system_settings
FOR ALL
USING (has_role(auth.uid(), 'super_admin'))
WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Insert default admin notification emails setting
INSERT INTO public.system_settings (key, value) 
VALUES ('admin_notification_emails', '{"emails": []}'::jsonb);