
-- 1) knowledge_usage: 增加 user_id 列 + 严格的访问策略
ALTER TABLE public.knowledge_usage
  ADD COLUMN IF NOT EXISTS user_id uuid;

CREATE INDEX IF NOT EXISTS idx_knowledge_usage_user_id ON public.knowledge_usage(user_id);

-- 用户可以查看自己的检索记录
DROP POLICY IF EXISTS "Users can view their own knowledge usage" ON public.knowledge_usage;
CREATE POLICY "Users can view their own knowledge usage"
  ON public.knowledge_usage FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- 2) profiles: 禁止用户自行把 is_verified 设为 true（保留 student_id 可写，由认证流程负责）
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id AND is_verified = false);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND (
      is_verified = false
      OR is_admin(auth.uid())
      OR is_verified = (SELECT p.is_verified FROM public.profiles p WHERE p.user_id = auth.uid())
    )
  );

-- 3) SECURITY DEFINER 函数：撤销 anon 和 public 的 EXECUTE，仅留 authenticated（RLS 策略调用需要）
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.match_knowledge_files(vector, double precision, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.match_knowledge_files(vector, double precision, integer) TO service_role;

-- 4) 公共 avatars 桶：禁止通过 API 列出文件（公开 URL 直链仍可访问）
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
CREATE POLICY "Users can view their own avatar via API"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'avatars'
    AND (auth.uid())::text = (storage.foldername(name))[1]
  );
