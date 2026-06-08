export async function callLLM(_prompt: string): Promise<string> {
  throw new Error('LLM client is not configured. Use Supabase Edge Function or a backend proxy later.');
}
