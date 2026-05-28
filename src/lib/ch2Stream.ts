import { supabase } from '@/integrations/supabase/client';

type StreamOpts = {
  mode: 'resume' | 'tips' | 'agent';
  input: string;
  context?: string;
  onDelta: (chunk: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
};

/**
 * Stream from the ch2-toolkit edge function via SSE.
 * Returns a function that can be called to abort the stream.
 */
export async function streamCh2(opts: StreamOpts): Promise<() => void> {
  const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
  const ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  const controller = new AbortController();

  fetch(`${SUPABASE_URL}/functions/v1/ch2-toolkit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: ANON,
      Authorization: `Bearer ${accessToken || ANON}`,
    },
    body: JSON.stringify({ mode: opts.mode, input: opts.input, context: opts.context }),
    signal: controller.signal,
  })
    .then(async (resp) => {
      if (!resp.ok || !resp.body) {
        const txt = await resp.text().catch(() => '');
        opts.onError(`AI 服务错误 ${resp.status}: ${txt.slice(0, 120)}`);
        return;
      }
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;
          const data = trimmed.slice(5).trim();
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            const delta: string | undefined = parsed?.choices?.[0]?.delta?.content;
            if (delta) opts.onDelta(delta);
          } catch {
            // ignore non-JSON lines
          }
        }
      }
      opts.onDone();
    })
    .catch((e) => {
      if (e?.name === 'AbortError') return;
      opts.onError(e?.message || '网络错误');
    });

  return () => controller.abort();
}
