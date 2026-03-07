import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, ExternalLink, Moon, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CareerReport, parseCareerReport, type CareerReportData } from '@/components/career/CareerReport';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';

type Msg = { role: 'user' | 'assistant'; content: string };
type WebSource = { url: string; title: string; snippet: string };

const CAREER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-agent`;

const QUICK_STARTERS = [
  { icon: '🌟', label: '开始职业测评', message: '你好，我想做一个职业规划测评，帮我分析一下适合什么岗位。', color: 'from-[hsl(var(--dream-violet)/0.15)] to-[hsl(var(--dream-pink)/0.1)]' },
  { icon: '🦋', label: '探索新方向', message: '我对目前的专业方向不太确定，想探索其他可能性。', color: 'from-[hsl(var(--dream-blue)/0.15)] to-[hsl(var(--dream-mint)/0.1)]' },
  { icon: '🔮', label: '行业趋势', message: '我想了解一下当前就业市场的热门行业和发展趋势。', color: 'from-[hsl(var(--dream-pink)/0.15)] to-[hsl(var(--dream-violet)/0.1)]' },
];

function DreamyBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {/* Large floating orbs */}
      <div className="dream-orb absolute -top-20 -right-20 w-[400px] h-[400px] rounded-full opacity-50"
        style={{ background: 'var(--gradient-dream-orb1)' }} />
      <div className="dream-orb-2 absolute top-1/3 -left-32 w-[350px] h-[350px] rounded-full opacity-40"
        style={{ background: 'var(--gradient-dream-orb2)' }} />
      <div className="dream-orb-3 absolute bottom-10 right-1/4 w-[300px] h-[300px] rounded-full opacity-30"
        style={{ background: 'var(--gradient-dream-orb3)' }} />
      {/* Subtle sparkle dots */}
      <div className="absolute top-[15%] left-[20%] w-1.5 h-1.5 rounded-full bg-[hsl(var(--dream-violet))] dream-pulse" />
      <div className="absolute top-[35%] right-[15%] w-1 h-1 rounded-full bg-[hsl(var(--dream-pink))] dream-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[60%] left-[10%] w-1 h-1 rounded-full bg-[hsl(var(--dream-blue))] dream-pulse" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[80%] right-[30%] w-1.5 h-1.5 rounded-full bg-[hsl(var(--dream-mint))] dream-pulse" style={{ animationDelay: '3s' }} />
    </div>
  );
}

function SourceCards({ sources }: { sources: WebSource[] }) {
  if (sources.length === 0) return null;
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-hide">
      {sources.map((s, i) => (
        <a
          key={i}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0 max-w-[220px] p-3 rounded-2xl border border-[hsl(var(--dream-violet)/0.2)] bg-white/60 backdrop-blur-sm hover:shadow-dream hover:border-[hsl(var(--dream-violet)/0.4)] transition-all duration-300 group"
        >
          <div className="flex items-start gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-[hsl(var(--dream-violet))] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
            <div className="min-w-0">
              <p className="text-xs font-medium text-foreground truncate">{s.title}</p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">{s.snippet}</p>
            </div>
          </div>
        </a>
      ))}
    </div>
  );
}

export default function Career() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Map<number, CareerReportData>>(new Map());
  const [webSources, setWebSources] = useState<Map<number, WebSource[]>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const assistantContentRef = useRef('');

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMsg: Msg = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setIsLoading(true);
    assistantContentRef.current = '';
    scrollToBottom();

    try {
      const resp = await fetch(CAREER_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || 'AI服务暂时不可用');
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = '';
      let currentSources: WebSource[] = [];

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
            if (parsed.webSources) {
              currentSources = parsed.webSources;
              continue;
            }
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContentRef.current += delta;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, idx) => idx === prev.length - 1 ? { ...m, content: assistantContentRef.current } : m);
                }
                return [...prev, { role: 'assistant', content: assistantContentRef.current }];
              });
              scrollToBottom();
            }
          } catch {
            textBuffer = line + '\n' + textBuffer;
            break;
          }
        }
      }

      if (currentSources.length > 0) {
        setWebSources((prev) => { const n = new Map(prev); n.set(newMessages.length, currentSources); return n; });
      }
      const report = parseCareerReport(assistantContentRef.current);
      if (report) {
        setReports((prev) => { const n = new Map(prev); n.set(newMessages.length, report); return n; });
      }
    } catch (e: any) {
      console.error('Career agent error:', e);
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${e.message || '网络错误，请重试'}` }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, [messages, isLoading]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const getDisplayContent = (content: string) => content.replace(/```career-report[\s\S]*?```/g, '').trim();

  const markdownComponents = {
    a: ({ href, children, ...props }: any) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-[hsl(var(--dream-violet))] underline underline-offset-2 hover:text-[hsl(var(--dream-pink))] inline-flex items-center gap-0.5 transition-colors"
        {...props}
      >
        {children}
        <ExternalLink className="w-3 h-3 inline-block" />
      </a>
    ),
  };

  return (
    <div className="flex flex-col h-screen relative" style={{ background: 'var(--gradient-dream)' }}>
      <DreamyBackground />

      {/* Header - frosted glass */}
      <header className="shrink-0 relative z-10 border-b border-white/30 bg-white/50 backdrop-blur-xl px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0 rounded-xl hover:bg-white/50"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] blur-md opacity-40 scale-125" />
            <div className="relative w-10 h-10 rounded-2xl bg-gradient-to-br from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] flex items-center justify-center shadow-dream">
              <Moon className="w-5 h-5 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              职业规划 Agent
              <Sparkles className="w-3.5 h-3.5 text-[hsl(var(--dream-violet))]" />
            </h1>
            <p className="text-xs text-muted-foreground">梦想启航 · 遇见未来的自己</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto relative z-10">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-20 space-y-8 animate-fade-in">
              {/* Dreamy hero */}
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(var(--dream-violet)/0.3)] to-[hsl(var(--dream-pink)/0.3)] blur-2xl scale-150 dream-pulse" />
                <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-gradient-to-br from-[hsl(var(--dream-violet)/0.15)] via-white/80 to-[hsl(var(--dream-pink)/0.15)] flex items-center justify-center border border-white/50 shadow-dream backdrop-blur-sm">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-[hsl(var(--dream-violet))] via-[hsl(var(--dream-pink))] to-[hsl(var(--dream-blue))] flex items-center justify-center shadow-lg">
                    <Moon className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-lg" />
                  </div>
                </div>
                {/* Floating stars */}
                <Star className="absolute -top-2 -right-3 w-4 h-4 text-[hsl(var(--dream-peach))] dream-pulse" style={{ animationDelay: '0.5s' }} />
                <Star className="absolute -bottom-1 -left-4 w-3 h-3 text-[hsl(var(--dream-violet))] dream-pulse" style={{ animationDelay: '1.5s' }} />
                <Sparkles className="absolute top-0 -left-6 w-4 h-4 text-[hsl(var(--dream-mint))] dream-pulse" style={{ animationDelay: '2.5s' }} />
              </div>

              <div className="text-center space-y-3">
                <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-[hsl(var(--dream-violet))] via-[hsl(var(--dream-pink))] to-[hsl(var(--dream-blue))] bg-clip-text text-transparent">
                  遇见未来的自己
                </h2>
                <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  在这里，AI将温柔地了解你的性格、梦想和热爱，
                  <br className="hidden sm:block" />
                  为你绘制一幅专属的职业蓝图 ✨
                </p>
              </div>

              {/* Dreamy quick starters */}
              <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
                {QUICK_STARTERS.map((qs, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qs.message)}
                    className={cn(
                      "flex-1 px-4 py-4 rounded-2xl border border-white/40 bg-white/40 backdrop-blur-sm text-sm text-foreground",
                      "hover:shadow-dream hover:border-[hsl(var(--dream-violet)/0.3)] hover:bg-white/60",
                      "transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]",
                      "flex items-center sm:flex-col sm:items-center gap-3 sm:gap-2"
                    )}
                  >
                    <span className="text-2xl">{qs.icon}</span>
                    <span className="font-medium">{qs.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const reportData = reports.get(i);
            const sources = webSources.get(i);
            const displayContent = msg.role === 'assistant' ? getDisplayContent(msg.content) : msg.content;

            return (
              <div key={i} className={cn('flex animate-fade-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] text-white shadow-dream'
                      : 'bg-white/70 backdrop-blur-sm border border-white/50 shadow-sm'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-4">
                      {sources && <SourceCards sources={sources} />}
                      {displayContent && (
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                            {displayContent}
                          </ReactMarkdown>
                        </div>
                      )}
                      {reportData && <CareerReport data={reportData} />}
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
            <div className="flex justify-start animate-fade-in">
              <div className="bg-white/70 backdrop-blur-sm border border-white/50 rounded-2xl px-4 py-3 shadow-sm">
                <ThinkingIndicator />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input - frosted glass */}
      <div className="shrink-0 relative z-10 border-t border-white/30 bg-white/50 backdrop-blur-xl px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的想法..."
            className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-white/60 backdrop-blur-sm border-white/40 focus:border-[hsl(var(--dream-violet)/0.5)] focus:ring-[hsl(var(--dream-violet)/0.2)]"
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 rounded-2xl h-[44px] w-[44px] bg-gradient-to-br from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] hover:opacity-90 shadow-dream border-0"
          >
            <Send className="w-4 h-4 text-white" />
          </Button>
        </div>
      </div>
    </div>
  );
}
