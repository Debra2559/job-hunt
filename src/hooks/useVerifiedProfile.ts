import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

type VerifiedProfile = {
  is_verified: boolean;
} | null;

export function useVerifiedProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<VerifiedProfile>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!userId) {
        if (!mounted) return;
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('is_verified')
        .eq('user_id', userId)
        .maybeSingle();

      if (!mounted) return;

      if (error) {
        // Keep it silent here; the route guard will treat it as not verified.
        setProfile(null);
        setLoading(false);
        return;
      }

      setProfile(data ?? null);
      setLoading(false);
    };

    run();

    return () => {
      mounted = false;
    };
  }, [userId]);

  return { profile, loading };
}
