import { supabase } from '@/integrations/supabase/client';

type CareerLLMResponse = {
  content?: string;
  error?: string;
};

export async function callLLM(prompt: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<CareerLLMResponse>('career-llm', {
    body: { prompt },
  });

  if (error) {
    throw new Error(`career-llm function failed: ${error.message}`);
  }

  if (data?.error) {
    throw new Error(`career-llm error: ${data.error}`);
  }

  const content = data?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('career-llm returned empty content.');
  }

  return content;
}
