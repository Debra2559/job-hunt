import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { X, Send, Loader2, Sparkles, ChevronDown, RotateCcw, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAssistant } from '@/hooks/useAssistant';
import { streamCh2 } from '@/lib/ch2Stream';
import { toast } from '@/hooks/use-toast';

type Msg = { role: 'user' | 'assistant'; content: string };

const HISTORY_LS = (id: string) => `career:assistant:chat:v1:${id}`;

function readHistory(id: string): Msg[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_LS(id)) || '[]'); } catch { return []; }
}
function saveHistory(id: string, msgs: Msg[]) {
  try { localStorage.setItem(HISTORY_LS(id), JSON.stringify(msgs.slice(-30))); } catch {}
}

export default function FloatingAssistant() {
  const { assistant } = useAssistant();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const stopRef = useRef<() => void>();
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const { pathname } = useLocation();

  // hide FAB on the AssistantHub page itself
  const hideFab = pathname.startsWith('/career/assistants');

  // load history when assistant changes
  useEffect(() => {
    if (assistant) setMessages(readHistory(assistant.id));
    else setMessages([]);
  }, [assistant?.id]);

  // persist
  useEffect(() => {
    if (assistant && messages.length > 0) saveHistory(assistant.id, messages);
  }, [messages, assistant?.id]);

  // autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open]);

  if (!assistant || hideFab) return null;

  const send = async (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || streaming) return;
    setInput('');
    const history = messages.slice();
    const next: Msg[] = [...history, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(next);
    setStreaming(true);

    try {
      const stop = await streamCh2({
        mode: 'assistant',
        input: text,
        systemPrompt: assistant.systemPrompt,
        history,
        onDelta: (chunk) => {
          setMessages(prev => {
            const arr = [...prev];
            arr[arr.length - 1] = { role: 'assistant', content: arr[arr.length - 1].content + chunk };
            return arr;
          });
        },
        onDone: () => setStreaming(false),
        onError: (e) => {
          setStreaming(false);
          toast({ title: '出错了', description: e, variant: 'destructive' });
          setMessages(prev => prev.slice(0, -1));
        },
      });
      stopRef.current = stop;
    } catch (e: any) {
      setStreaming(false);
      toast({ title: '请求失败', description: e?.message || '稍后再试', variant: 'destructive' });
    }
  };

  const resetChat = () => {
    setMessages([]);
    try { localStorage.removeItem(HISTORY_LS(assistant.id)); } catch {}
  };

  return (
    <>
      {/* ===== Floating bubble (FAB) ===== */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className={cn(
            'fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-40',
            'group flex items-center gap-2 pl-2 pr-3.5 h-14 rounded-full text-white font-bold text-sm shadow-2xl',
            'bg-gradient-to-br hover:scale-105 active:scale-95 transition-all duration-300',
            assistant.gradient,
          )}
          style={{ boxShadow: '0 16px 40px -10px rgba(124,58,237,0.45), inset 0 2px 0 rgba(255,255,255,0.5)' }}
          aria-label={`打开 ${assistant.name}`}
        >
          <span className="relative w-10 h-10 rounded-full bg-white/30 backdrop-blur flex items-center justify-center text-2xl shadow-inner">
            <span className="drop-shadow">{assistant.emoji}</span>
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white animate-pulse" />
          </span>
          <span className="hidden sm:inline-block leading-tight text-left">
            <span className="block text-[10px] opacity-85 font-semibold tracking-wide">你的助理</span>
            <span className="block text-sm font-extrabold">{assistant.name}</span>
          </span>
        </button>
      )}

      {/* ===== Chat drawer ===== */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:items-end sm:justify-end pointer-events-none">
          {/* backdrop on mobile only */}
          <div
            className="absolute inset-0 bg-black/30 backdrop-blur-sm sm:hidden pointer-events-auto"
            onClick={() => setOpen(false)}
          />

          <div
            className={cn(
              'relative pointer-events-auto',
              'w-full sm:w-[400px] h-[85vh] sm:h-[640px] sm:mr-6 sm:mb-6',
              'rounded-t-3xl sm:rounded-3xl overflow-hidden bg-white shadow-2xl',
              'flex flex-col animate-in slide-in-from-bottom duration-300',
              'border border-white/60',
            )}
          >
            {/* header */}
            <div className={cn('shrink-0 px-4 py-3 text-white bg-gradient-to-br', assistant.gradient)}>
              <div className="flex items-center gap-2.5">
                <div className="relative w-10 h-10 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-2xl shrink-0 shadow-inner">
                  {assistant.emoji}
                  <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold leading-tight">{assistant.name} <span className="font-medium opacity-85 text-[11px]">· {assistant.role}</span></h3>
                  <p className="text-[11px] opacity-90 truncate">{assistant.tagline}</p>
                </div>
                <button
                  onClick={resetChat}
                  title="清空对话"
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  title="收起"
                  className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 backdrop-blur flex items-center justify-center"
                >
                  <ChevronDown className="w-4 h-4 sm:hidden" />
                  <X className="w-4 h-4 hidden sm:block" />
                </button>
              </div>
            </div>

            {/* messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-gradient-to-b from-white via-violet-50/30 to-white">
              {messages.length === 0 ? (
                <div className="space-y-3 mt-2">
                  <div className="rounded-2xl bg-violet-50 border border-violet-100 p-3.5">
                    <p className="text-[13px] text-foreground/80 leading-relaxed">
                      👋 我是 <b>{assistant.name}</b>，已经吸收了 {assistant.sources.length} 份「{assistant.role}」领域的经典素材。
                      下面是几个常被问到的问题，点一个直接开聊：
                    </p>
                  </div>
                  <div className="space-y-1.5">
                    {assistant.starterPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="w-full text-left text-[13px] px-3 py-2.5 rounded-xl bg-white border border-border/50 hover:border-violet-300 hover:bg-violet-50/80 hover:-translate-y-0.5 transition-all leading-relaxed"
                      >
                        💬 {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                messages.map((m, i) => (
                  <div key={i} className={cn('flex gap-2', m.role === 'user' ? 'flex-row-reverse' : '')}>
                    <div className={cn('shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm bg-gradient-to-br shadow-sm',
                      m.role === 'user' ? 'from-sky-400 to-blue-500' : assistant.gradient)}>
                      {m.role === 'user' ? <span className="text-white text-[10px] font-bold">YOU</span> : <span>{assistant.emoji}</span>}
                    </div>
                    <div className={cn(
                      'max-w-[82%] rounded-2xl px-3.5 py-2 text-[13px] whitespace-pre-wrap leading-relaxed',
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100'
                        : 'bg-white border border-border/50 shadow-sm',
                    )}>
                      {m.content || (streaming && i === messages.length - 1 ? <span className="inline-block w-1.5 h-3.5 bg-violet-500 animate-pulse" /> : null)}
                      {streaming && i === messages.length - 1 && m.content && (
                        <span className="inline-block w-1.5 h-3.5 bg-violet-500 ml-0.5 align-middle animate-pulse" />
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* input */}
            <div className="shrink-0 px-3 py-2.5 border-t border-border/40 bg-white">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => { setOpen(false); navigate('/career/assistants'); }}
                  title="换一个助理"
                  className="shrink-0 w-9 h-9 rounded-xl border border-border/50 bg-white hover:bg-muted flex items-center justify-center text-muted-foreground"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
                  disabled={streaming}
                  placeholder={`问 ${assistant.name} 任何 ${assistant.role} 问题…`}
                  className="flex-1 h-10 px-3.5 rounded-xl border border-border bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
                />
                <Button
                  onClick={() => send()}
                  disabled={streaming || !input.trim()}
                  className={cn('shrink-0 rounded-xl h-10 w-10 p-0 text-white bg-gradient-to-br shadow-md disabled:opacity-40', assistant.gradient)}
                >
                  {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
