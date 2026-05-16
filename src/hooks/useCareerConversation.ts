import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { BossJobListing } from '@/components/career/CareerReport';

type Msg = { role: 'user' | 'assistant'; content: string };

const CAREER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-agent`;

export function useCareerConversation(userId: string | undefined) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const assistantContentRef = useRef('');
  const hasGreeted = useRef(false);

  // Load existing career conversation on mount
  useEffect(() => {
    if (!userId) {
      setLoadingHistory(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        // Find the most recent career conversation
        const { data: convs, error } = await supabase
          .from('conversations')
          .select('id')
          .eq('group_id', 'career')
          .order('updated_at', { ascending: false })
          .limit(1);

        if (error || cancelled) {
          setLoadingHistory(false);
          return;
        }

        if (convs && convs.length > 0) {
          const convId = convs[0].id;
          setConversationId(convId);

          const { data: msgData } = await supabase
            .from('messages')
            .select('role, content')
            .eq('conversation_id', convId)
            .order('created_at', { ascending: true });

          if (!cancelled && msgData && msgData.length > 0) {
            setMessages(msgData.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
            hasGreeted.current = true; // Skip auto-greet if we have history
          }
        }
      } catch (e) {
        console.error('Error loading career conversation:', e);
      } finally {
        if (!cancelled) setLoadingHistory(false);
      }
    })();

    return () => { cancelled = true; };
  }, [userId]);

  // Ensure a conversation exists in the DB
  const ensureConversation = useCallback(async (): Promise<string | null> => {
    if (conversationId) return conversationId;
    if (!userId) return null;

    try {
      const { data, error } = await supabase
        .from('conversations')
        .insert({ user_id: userId, title: '职业规划对话', group_id: 'career' })
        .select('id')
        .single();

      if (error) throw error;
      setConversationId(data.id);
      return data.id;
    } catch (e) {
      console.error('Error creating career conversation:', e);
      return null;
    }
  }, [conversationId, userId]);

  // Save a message to DB
  const saveMessage = useCallback(async (convId: string, role: 'user' | 'assistant', content: string) => {
    try {
      await supabase.from('messages').insert({ conversation_id: convId, role, content });
      await supabase.from('conversations').update({ updated_at: new Date().toISOString() }).eq('id', convId);
    } catch (e) {
      console.error('Error saving message:', e);
    }
  }, []);

  // Stream response from career agent
  const streamResponse = useCallback(async (allMessages: Msg[], onSources?: (sources: any[]) => void, onBossJobs?: (jobs: BossJobListing[]) => void): Promise<string> => {
    setIsLoading(true);
    assistantContentRef.current = '';

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CAREER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'AI服务暂时不可用');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            if (parsed.webSources && onSources) {
              onSources(parsed.webSources);
              continue;
            }
            if (parsed.bossJobs && onBossJobs) {
              onBossJobs(parsed.bossJobs);
              continue;
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContentRef.current += delta;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantContentRef.current } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContentRef.current }];
              });
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      return assistantContentRef.current;
    } catch (e: any) {
      console.error('Career agent error:', e);
      const errMsg = `⚠️ ${e.message || '网络错误，请重试'}`;
      setMessages(prev => [...prev, { role: 'assistant', content: errMsg }]);
      return errMsg;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Send a user message
  const sendMessage = useCallback(async (
    content: string,
    onSources?: (index: number, sources: any[]) => void,
    onBossJobs?: (jobs: BossJobListing[]) => void
  ) => {
    if (!content.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);

    const convId = await ensureConversation();
    if (convId) {
      await saveMessage(convId, 'user', content.trim());
    }

    const sourceIndex = newMessages.length; // index where assistant msg will appear
    const assistantContent = await streamResponse(
      newMessages,
      (sources) => { onSources?.(sourceIndex, sources); },
      onBossJobs
    );

    if (convId && assistantContent) {
      await saveMessage(convId, 'assistant', assistantContent);
    }
  }, [messages, isLoading, ensureConversation, saveMessage, streamResponse]);

  // Auto-greet
  const autoGreet = useCallback(async () => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;

    setIsLoading(true);
    const greetMessages: Msg[] = [{ role: 'user', content: '你好，我想进行职业规划。' }];

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const resp = await fetch(CAREER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ messages: greetMessages }),
      });

      if (!resp.ok || !resp.body) throw new Error('AI服务暂时不可用');

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      assistantContentRef.current = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf('\n')) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContentRef.current += delta;
              setMessages([{ role: 'assistant', content: assistantContentRef.current }]);
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      // Save greeting to DB
      const convId = await ensureConversation();
      if (convId && assistantContentRef.current) {
        await saveMessage(convId, 'assistant', assistantContentRef.current);
      }
    } catch {
      const fallback = '你好！👋 我是你的职业规划助手，很高兴为你服务。先聊聊你的专业和兴趣吧，你目前学的什么专业呢？';
      setMessages([{ role: 'assistant', content: fallback }]);
      const convId = await ensureConversation();
      if (convId) await saveMessage(convId, 'assistant', fallback);
    } finally {
      setIsLoading(false);
    }
  }, [ensureConversation, saveMessage]);

  // Clear history (delete messages but keep single conversation)
  const clearHistory = useCallback(async () => {
    if (conversationId) {
      try {
        await supabase.from('messages').delete().eq('conversation_id', conversationId);
      } catch (e) {
        console.error('Error clearing career messages:', e);
      }
    }
    setMessages([]);
    hasGreeted.current = false;
  }, [conversationId]);

  return {
    messages,
    isLoading,
    loadingHistory,
    sendMessage,
    autoGreet,
    hasGreeted,
    clearHistory,
  };
}
