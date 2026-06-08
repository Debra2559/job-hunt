import { supabase } from '@/integrations/supabase/client';
import { normalizeResume, type ResumeData } from '@/lib/resumeTypes';

export async function generateStructuredResume(input: string): Promise<ResumeData> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/ch2-toolkit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${accessToken || ANON}`,
    },
    body: JSON.stringify({ mode: 'resume-structured', input }),
  });
  if (!resp.ok) throw new Error(`AI ${resp.status}`);
  const json = await resp.json();
  return normalizeResume(json?.data);
}
