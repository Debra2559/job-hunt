import { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Send, Loader2, Sparkles, User, Bot, Quote,
  Heart, Briefcase, Lightbulb, Compass,
  ChevronDown, Check, Plus, X, Users, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { toast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { streamCh2 } from '@/lib/ch2Stream';
import { classifyIntent, needsLLMFallback, type IntentResult } from '@/hooks/useIntentClassifier';
import { useAssistant } from '@/hooks/useAssistant';
import { COMPANION_SYSTEM_PROMPT } from '@/data/companionPrompt';
import { ASSISTANTS, type Assistant } from '@/data/assistants';

// ========== Types ==========
type Msg = { role: 'user' | 'assistant'; content: string };
type IntentLabel = '实用模式' | '情绪模式' | '融合模式' | null;

// ========== Quick-start prompts ==========
const STARTER_PROMPTS = [
  { icon: Heart, label: '情绪陪伴', text: '被拒了好几次，有点怀疑自己是不是不适合这行...', gradient: 'from-rose-50 to-pink-50 border-rose-200', iconBg: 'bg-rose-100', iconColor: 'text-rose-600' },
  { icon: Briefcase, label: '实用攻略', text: '明天产品经理终面，反问环节怎么准备？', gradient: 'from-sky-50 to-blue-50 border-sky-200', iconBg: 'bg-sky-100', iconColor: 'text-sky-600' },
  { icon: Compass, label: '选择困难', text: 'offer选了小厂但朋友都去了大厂，是不是选错了？', gradient: 'from-amber-50 to-orange-50 border-amber-200', iconBg: 'bg-amber-100', iconColor: 'text-amber-600' },
  { icon: Lightbulb, label: '策略诊断', text: '投了30家一个面试都没有，问题可能出在哪？', gradient: 'from-emerald-50 to-teal-50 border-emerald-200', iconBg: 'bg-emerald-100', iconColor: 'text-emerald-600' },
  { icon: Sparkles, label: '面试突击', text: '技术面被问项目经历，没有亮眼的项目怎么答？', gradient: 'from-violet-50 to-purple-50 border-violet-200', iconBg: 'bg-violet-100', iconColor: 'text-violet-600' },
  { icon: Heart, label: '心态建设', text: '身边的同学都上岸了只剩我，越来越慌怎么办？', gradient: 'from-red-50 to-rose-50 border-red-200', iconBg: 'bg-red-100', iconColor: 'text-red-600' },
];

// ========== Intent label resolver ==========
function resolveIntentLabel(input: string): { label: IntentLabel; tags: string[] } {
  const result = classifyIntent(input);
  let label: IntentLabel;
  switch (result.intent) {
    case 'practical': label = '实用模式'; break;
    case 'emotional': label = '情绪模式'; break;
    case 'mixed': label = '融合模式'; break;
    default: label = null;
  }
  return { label, tags: result.moodTags };
}

// ========== Quote card parser ==========
type ParsedQuote = { text: string; author: string; source?: string };
type ContentSegment = { type: 'text' | 'quote'; text?: string; quote?: ParsedQuote };

function parseQuotes(content: string): ContentSegment[] {
  const segments: ContentSegment[] = [];
  const quoteRegex = /^>\s*「(.+?)」\s*——\s*(.+?)(?:[，,]\s*(.+?))?\s*$/gm;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = quoteRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      const text = content.slice(lastIndex, match.index).trim();
      if (text) segments.push({ type: 'text', text });
    }
    segments.push({
      type: 'quote',
      quote: {
        text: match[1],
        author: match[2].trim(),
        source: match[3]?.trim(),
      },
    });
    lastIndex = match.index + match[0].length;
  }

  const remaining = content.slice(lastIndex).trim();
  if (remaining) segments.push({ type: 'text', text: remaining });

  if (segments.length === 0) {
    return [{ type: 'text', text: content }];
  }

  return segments;
}

// ========== Quote card component ==========
function QuoteCard({ quote }: { quote: ParsedQuote }) {
  return (
    <div className="relative my-3 mx-1 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/70 overflow-hidden shadow-sm">
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-orange-400" />
      <div className="p-3.5 pl-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-6 h-6 rounded-lg bg-amber-100 flex items-center justify-center">
            <Quote className="w-3.5 h-3.5 text-amber-600" />
          </div>
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wide">大拿观点</span>
        </div>
        <p className="text-sm text-foreground/90 leading-relaxed font-medium">
          「{quote.text}」
        </p>
        <div className="flex items-baseline gap-1.5 mt-2">
          <span className="text-xs font-bold text-amber-800">{quote.author}</span>
          {quote.source && (
            <span className="text-[11px] text-muted-foreground">· {quote.source}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ========== Intent badge ==========
function IntentBadge({ label }: { label: IntentLabel }) {
  if (!label) return null;
  const colors: Record<string, string> = {
    '实用模式': 'bg-sky-50 text-sky-700 border-sky-200',
    '情绪模式': 'bg-rose-50 text-rose-700 border-rose-200',
    '融合模式': 'bg-violet-50 text-violet-700 border-violet-200',
  };
  const icons: Record<string, string> = {
    '实用模式': '🎯',
    '情绪模式': '💙',
    '融合模式': '✨',
  };
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border',
      colors[label] || 'bg-muted text-muted-foreground border-border',
    )}>
      {icons[label]}{label}
    </span>
  );
}

// ========== Chat history per-assistant persistence ==========
const HISTORY_LS = (id: string) => `career:companion:chat:v1:${id}`;
const COMPANION_DEFAULT_KEY = '__companion_default__';

function readHistory(key: string): Msg[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_LS(key)) || '[]'); } catch { return []; }
}
function saveHistory(key: string, msgs: Msg[]) {
  try { localStorage.setItem(HISTORY_LS(key), JSON.stringify(msgs.slice(-40))); } catch {}
}

// ========== Main Component ==========
export default function CompanionChat() {
  const { assistant, assistants, claim, release, setActive, isClaimed } = useAssistant();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [intentLabel, setIntentLabel] = useState<IntentLabel>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const stopRef = useRef<() => void>();
  const scrollRef = useRef<HTMLDivElement>(null);

  // History key: per-assistant or default companion
  const historyKey = assistant?.id ?? COMPANION_DEFAULT_KEY;

  // Load history when assistant changes
  useEffect(() => {
    setMessages(readHistory(historyKey));
  }, [historyKey]);

  // Persist
  useEffect(() => {
    if (messages.length > 0) saveHistory(historyKey, messages);
  }, [messages, historyKey]);

  // Autoscroll
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  // Determine which system prompt to use
  const systemPrompt = assistant?.systemPrompt ?? COMPANION_SYSTEM_PROMPT;

  const send = useCallback(async (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || streaming) return;
    setInput('');

    const { label } = resolveIntentLabel(text);
    setIntentLabel(label);

    const history = messages.slice();
    const next: Msg[] = [...history, { role: 'user', content: text }, { role: 'assistant', content: '' }];
    setMessages(next);
    setStreaming(true);

    try {
      const stop = await streamCh2({
        mode: 'assistant',
        input: text,
        systemPrompt,
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
  }, [input, messages, streaming, systemPrompt]);

  const lastMsg = messages[messages.length - 1];
  const isStreamingLast = streaming && lastMsg?.role === 'assistant';

  // Unclaimed assistants (for the picker)
  const unclaimedAssistants = ASSISTANTS.filter(a => !isClaimed(a.id));

  // Switch assistant and close picker
  const handleSwitch = (a: Assistant) => {
    if (!isClaimed(a.id)) {
      claim(a.id);
    }
    setActive(a.id);
    setPickerOpen(false);
    toast({ title: `已切换到 ${a.name}`, description: `${a.role} · ${a.tagline}` });
  };

  const handleRelease = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const a = ASSISTANTS.find(x => x.id === id);
    release(id);
    toast({ title: `已释放 ${a?.name ?? id}`, description: '可以随时重新认领' });
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf9f7] via-white to-[#f7f6f1]">
      {/* Ambient decor */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[5%] -left-20 w-80 h-80 rounded-full bg-amber-100/20 blur-3xl" />
        <div className="absolute bottom-[10%] -right-16 w-72 h-72 rounded-full bg-emerald-100/20 blur-3xl" />
        <div className="absolute top-[40%] left-[30%] w-60 h-60 rounded-full bg-violet-100/15 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#faf9f7]/85 border-b border-stone-200/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/career/map"
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>

          {/* Assistant avatar — changes with active assistant */}
          <div className={cn(
            'w-10 h-10 rounded-2xl flex items-center justify-center shadow-sm shrink-0',
            assistant
              ? `${assistant.gradient} text-white`
              : 'bg-gradient-to-br from-amber-400 to-orange-500',
          )}>
            {assistant ? (
              <span className="text-lg">{assistant.emoji}</span>
            ) : (
              <Sparkles className="w-5 h-5 text-white" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold leading-tight text-foreground">
                求职陪伴官
              </h1>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                情绪价值陪伴
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
              {assistant
                ? `${assistant.emoji} ${assistant.name} · ${assistant.role} · 稳稳接住你`
                : '实用建议 + 大拿智慧 + 情绪价值，稳稳接住你'}
            </p>
          </div>

          {intentLabel && <IntentBadge label={intentLabel} />}

          {/* ===== Assistant picker ===== */}
          <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
            <PopoverTrigger asChild>
              <button
                className={cn(
                  'shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                  assistant
                    ? 'bg-white border-stone-200 hover:border-stone-300 text-foreground shadow-sm'
                    : 'bg-gradient-to-r from-emerald-600 to-emerald-700 text-white border-transparent shadow-sm hover:opacity-90',
                )}
              >
                {assistant ? (
                  <>
                    <span>{assistant.emoji}</span>
                    <span className="max-w-[80px] truncate">{assistant.name}</span>
                    <ChevronDown className="w-3 h-3 text-muted-foreground" />
                  </>
                ) : (
                  <>
                    <Users className="w-3.5 h-3.5" />
                    认领助手
                  </>
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent
              align="end"
              sideOffset={8}
              className="w-72 p-0 rounded-2xl border border-stone-200 shadow-[0_12px_40px_-16px_rgba(0,0,0,0.2)] overflow-hidden"
            >
              <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                <p className="text-xs font-semibold text-foreground">我的 AI 助手</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  认领多位助手，随时切换对话
                </p>
              </div>

              <div className="max-h-[320px] overflow-y-auto">
                {/* Claimed assistants */}
                {assistants.length > 0 && (
                  <div className="px-2 pt-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">
                      已认领 ({assistants.length})
                    </p>
                    {assistants.map((a) => {
                      const isActive = assistant?.id === a.id;
                      return (
                        <button
                          key={a.id}
                          onClick={() => handleSwitch(a)}
                          className={cn(
                            'w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left transition-all mb-0.5',
                            isActive
                              ? 'bg-emerald-50 border border-emerald-200'
                              : 'hover:bg-stone-50 border border-transparent',
                          )}
                        >
                          <span className="text-xl shrink-0">{a.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[13px] font-semibold text-foreground leading-tight">
                              {a.name}
                              {isActive && (
                                <span className="ml-1 text-[10px] text-emerald-600 font-normal">· 当前</span>
                              )}
                            </p>
                            <p className="text-[11px] text-muted-foreground truncate">{a.role} · {a.tagline}</p>
                          </div>
                          <button
                            onClick={(e) => handleRelease(a.id, e)}
                            className="shrink-0 w-6 h-6 rounded-lg hover:bg-red-50 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors"
                            title={`释放 ${a.name}`}
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Unclaimed — available to claim */}
                {unclaimedAssistants.length > 0 && (
                  <div className="px-2 pt-2 pb-2">
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1 mt-1">
                      可认领 ({unclaimedAssistants.length})
                    </p>
                    {unclaimedAssistants.map((a) => (
                      <button
                        key={a.id}
                        onClick={() => handleSwitch(a)}
                        className="w-full flex items-center gap-2.5 px-2 py-2 rounded-xl text-left hover:bg-stone-50 transition-all mb-0.5 border border-transparent hover:border-stone-200"
                      >
                        <span className="text-xl shrink-0">{a.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-semibold text-foreground leading-tight">{a.name}</p>
                          <p className="text-[11px] text-muted-foreground truncate">{a.role} · {a.tagline}</p>
                        </div>
                        <span className="shrink-0 w-6 h-6 rounded-lg bg-emerald-600 flex items-center justify-center text-white">
                          <Plus className="w-3 h-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {unclaimedAssistants.length === 0 && assistants.length > 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-4 px-4">
                    已认领全部 {ASSISTANTS.length} 位助手 🎉
                  </p>
                )}
              </div>

              {/* Link to full hub */}
              <div className="px-4 py-2.5 border-t border-stone-100 bg-stone-50/50">
                <Link
                  to="/career/assistants"
                  onClick={() => setPickerOpen(false)}
                  className="text-[11px] text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1"
                >
                  查看全部助手详情 →
                </Link>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </header>

      {/* Chat area */}
      <main className="relative max-w-3xl mx-auto px-3 sm:px-6 py-5 sm:py-8">
        <div ref={scrollRef} className="space-y-4 min-h-[60vh]">
          {messages.length === 0 ? (
            /* Empty state */
            <div className="space-y-5 mt-4">
              <div className="rounded-3xl bg-white border border-stone-200 p-6 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.08)]">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn(
                    'w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-sm',
                    assistant
                      ? `${assistant.gradient} text-white`
                      : 'bg-gradient-to-br from-amber-100 to-orange-100',
                  )}>
                    {assistant ? assistant.emoji : '🧭'}
                  </div>
                  <div>
                    <h2 className="font-bold text-lg text-foreground">
                      {assistant ? `Hi，我是 ${assistant.name}` : 'Hi，我是你的求职陪伴官'}
                    </h2>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <p className="text-[13px] text-muted-foreground">
                        {assistant
                          ? `${assistant.role} · ${assistant.tagline}`
                          : '实用攻略 + 大拿智慧 + 情绪陪伴，三位一体'}
                      </p>
                      <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                        <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                        稳稳接住你
                      </span>
                    </div>
                  </div>
                </div>
                {assistant ? (
                  <>
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      我已经吸收了 {assistant.sources.length} 份「{assistant.role}」领域的经典素材——<br />
                      简历、面试、职业规划、行业洞察，尽管来问。
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {assistant.expertise.map((e) => (
                        <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                          {e}
                        </span>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-sm text-foreground/75 leading-relaxed">
                      不管是简历卡壳、面试焦虑、offer 纠结，还是纯粹被拒得体无完肤——<br />
                      丢过来，每条回复都给你<b>具体可执行的建议</b> + <b>真实大拿的智慧金句</b>。
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {['雷军', '张一鸣', 'Steve Jobs', '马云', 'Bill Gates', '王兴', '古典'].map(name => (
                        <span key={name} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-medium">
                          {name}
                        </span>
                      ))}
                      <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 font-semibold border border-amber-100">
                        +10+ 大拿
                      </span>
                    </div>

                    {/* Nudge to claim an assistant */}
                    {!assistant && assistants.length === 0 && (
                      <button
                        onClick={() => setPickerOpen(true)}
                        className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold hover:opacity-90 transition-all inline-flex items-center justify-center gap-2"
                      >
                        <Users className="w-4 h-4" />
                        认领一位 AI 助手，获得专属指导
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Starter prompts — show assistant-specific when claimed, generic otherwise */}
              {assistant ? (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase mb-2.5 px-1">
                    试试这些——
                  </p>
                  <div className="space-y-1.5">
                    {assistant.starterPrompts.map((p) => (
                      <button
                        key={p}
                        onClick={() => send(p)}
                        className="w-full text-left text-[13px] px-4 py-3 rounded-2xl bg-white border border-stone-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:-translate-y-0.5 transition-all leading-relaxed shadow-sm"
                      >
                        💬 {p}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-[11px] font-semibold text-muted-foreground tracking-wide uppercase mb-2.5 px-1">
                    选一个场景开始，或者直接打字——
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {STARTER_PROMPTS.map((p) => {
                      const Icon = p.icon;
                      return (
                        <button
                          key={p.text}
                          onClick={() => send(p.text)}
                          className={cn(
                            'group text-left rounded-2xl p-3.5 border transition-all duration-200',
                            'hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]',
                            'bg-white bg-gradient-to-br',
                            p.gradient,
                          )}
                        >
                          <div className="flex items-start gap-2.5">
                            <div className={cn('shrink-0 w-8 h-8 rounded-lg flex items-center justify-center', p.iconBg)}>
                              <Icon className={cn('w-4 h-4', p.iconColor)} />
                            </div>
                            <div className="min-w-0">
                              <span className={cn('text-[10px] font-semibold tracking-wide', p.iconColor)}>
                                {p.label}
                              </span>
                              <p className="text-[13px] text-foreground/80 leading-relaxed mt-0.5 line-clamp-2">
                                {p.text}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* Messages */
            messages.map((m, i) => {
              const isUser = m.role === 'user';
              const isLastAssistant = !isUser && i === messages.length - 1;
              const segments = !isUser && m.content ? parseQuotes(m.content) : [];

              return (
                <div key={i} className={cn('flex gap-2.5', isUser ? 'flex-row-reverse' : '')}>
                  {/* Avatar */}
                  <div className={cn(
                    'shrink-0 w-8 h-8 rounded-full flex items-center justify-center',
                    isUser
                      ? 'bg-gradient-to-br from-sky-400 to-blue-500'
                      : assistant
                        ? `${assistant.gradient}`
                        : 'bg-gradient-to-br from-amber-400 to-orange-500',
                  )}>
                    {isUser ? (
                      <User className="w-4 h-4 text-white" />
                    ) : assistant ? (
                      <span className="text-sm">{assistant.emoji}</span>
                    ) : (
                      <span className="text-sm">🧭</span>
                    )}
                  </div>

                  {/* Bubble */}
                  <div className={cn(
                    'max-w-[82%] sm:max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed',
                    isUser
                      ? 'bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100'
                      : 'bg-white border border-stone-200/80 shadow-sm',
                  )}>
                    {isUser ? (
                      <p className="whitespace-pre-wrap">{m.content}</p>
                    ) : segments.length > 0 ? (
                      segments.map((seg, j) =>
                        seg.type === 'quote' && seg.quote ? (
                          <QuoteCard key={j} quote={seg.quote} />
                        ) : (
                          seg.text ? (
                            <ReactMarkdown
                              key={j}
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                                strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                                em: ({ children }) => <em className="italic">{children}</em>,
                                ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
                                ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
                                li: ({ children }) => <li className="text-sm">{children}</li>,
                                blockquote: ({ children }) => (
                                  <blockquote className="border-l-[3px] border-amber-400 pl-3 my-2 italic text-muted-foreground">{children}</blockquote>
                                ),
                                code: ({ children }) => (
                                  <code className="px-1 py-0.5 rounded bg-stone-100 text-[12px] font-mono">{children}</code>
                                ),
                                hr: () => <hr className="my-3 border-stone-200" />,
                              }}
                            >
                              {seg.text}
                            </ReactMarkdown>
                          ) : null
                        ),
                      )
                    ) : m.content ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
                          em: ({ children }) => <em className="italic">{children}</em>,
                          ul: ({ children }) => <ul className="list-disc pl-4 space-y-1 mb-2">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal pl-4 space-y-1 mb-2">{children}</ol>,
                          li: ({ children }) => <li className="text-sm">{children}</li>,
                          blockquote: ({ children }) => (
                            <blockquote className="border-l-[3px] border-amber-400 pl-3 my-2 italic text-muted-foreground">{children}</blockquote>
                          ),
                          code: ({ children }) => (
                            <code className="px-1 py-0.5 rounded bg-stone-100 text-[12px] font-mono">{children}</code>
                          ),
                          hr: () => <hr className="my-3 border-stone-200" />,
                        }}
                      >
                        {m.content}
                      </ReactMarkdown>
                    ) : (
                      isStreamingLast && <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse rounded-full" />
                    )}

                    {isLastAssistant && isStreamingLast && m.content && (
                      <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse rounded-full" />
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </main>

      {/* Input area */}
      <div className="sticky bottom-0 z-30 bg-gradient-to-t from-[#faf9f7] via-[#faf9f7]/95 to-transparent pb-4 pt-6">
        <div className="max-w-3xl mx-auto px-3 sm:px-6">
          <div className="flex items-end gap-2 bg-white rounded-2xl border border-stone-200 shadow-[0_8px_30px_-12px_rgba(0,0,0,0.1)] p-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              disabled={streaming}
              placeholder={
                assistant
                  ? `问 ${assistant.name} 任何 ${assistant.role} 问题…`
                  : '说说你现在的情况...'
              }
              className="flex-1 h-10 px-3 bg-transparent text-sm placeholder:text-muted-foreground/60 focus:outline-none disabled:opacity-50"
            />
            <Button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              size="icon"
              className={cn(
                'shrink-0 rounded-xl h-10 w-10 text-white border-0 disabled:opacity-40 shadow-md hover:opacity-95',
                assistant
                  ? `${assistant.gradient}`
                  : 'bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 shadow-[0_4px_14px_-4px_rgba(251,146,60,0.5)]',
              )}
            >
              {streaming ? (
                <Loader2 className="w-4 h-4 text-white animate-spin" />
              ) : (
                <Send className="w-4 h-4 text-white" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
