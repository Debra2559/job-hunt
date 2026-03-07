import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Sparkles, ExternalLink, Compass } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CareerReport, parseCareerReport, type CareerReportData } from '@/components/career/CareerReport';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

type Msg = { role: 'user' | 'assistant'; content: string };
type WebSource = { url: string; title: string; snippet: string };
type ParsedOption = { label: string; emoji?: string };

const CAREER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-agent`;

// Parse numbered/lettered options from AI message for interactive buttons
function parseOptions(content: string): ParsedOption[] {
  const options: ParsedOption[] = [];
  // Match patterns like: A. xxx / A）xxx / 1. xxx / - **xxx**
  // Look for option blocks: lines starting with letter/number + dot/bracket
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmed = line.trim();
    // Pattern: "A. text" or "A）text" or "A、text"
    let match = trimmed.match(/^([A-Z])[.）、]\s*\*{0,2}(.+?)\*{0,2}$/);
    if (!match) {
      // Pattern: "1. **text**" or numbered
      match = trimmed.match(/^\d+[.）、]\s*\*{0,2}(.+?)\*{0,2}$/);
      if (match) {
        const text = match[1].replace(/\*{1,2}/g, '').trim();
        // Skip if it's a full question (too long) or contains question mark
        if (text.length > 40 || text.includes('？') || text.includes('?')) continue;
        // Only treat as option if it looks like a short choice
        if (text.length > 2 && text.length <= 35) {
          options.push({ label: text });
        }
        continue;
      }
    }
    if (match && match.length >= 3) {
      const text = match[2].replace(/\*{1,2}/g, '').trim();
      if (text.length > 2 && text.length <= 40) {
        options.push({ label: text, emoji: undefined });
      }
    }
  }

  // Also try to extract from patterns like 「选项」or "选项" inline
  if (options.length === 0) {
    const inlinePattern = /[「""]([^「""」]{2,25})[」""]/g;
    let inlineMatch;
    const candidates: string[] = [];
    while ((inlineMatch = inlinePattern.exec(content)) !== null) {
      candidates.push(inlineMatch[1]);
    }
    // Only use if we found 2+ candidates (likely options)
    if (candidates.length >= 2) {
      candidates.forEach(c => options.push({ label: c }));
    }
  }

  return options;
}

function OptionButtons({ options, onSelect, disabled }: { options: ParsedOption[]; onSelect: (label: string) => void; disabled: boolean }) {
  if (options.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2 mt-3 animate-fade-in">
      {options.map((opt, i) => (
        <button
          key={i}
          onClick={() => !disabled && onSelect(opt.label)}
          disabled={disabled}
          className={cn(
            "px-4 py-2.5 rounded-2xl text-sm font-medium border transition-all duration-200",
            "bg-background border-border text-foreground",
            "hover:bg-accent hover:border-primary/30 hover:shadow-sm",
            "active:scale-[0.97]",
            "disabled:opacity-50 disabled:cursor-not-allowed"
          )}
        >
          {opt.label}
        </button>
      ))}
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
          className="shrink-0 max-w-[220px] p-3 rounded-2xl border border-border bg-card/80 backdrop-blur-sm hover:shadow-md hover:border-primary/30 transition-all duration-300 group"
        >
          <div className="flex items-start gap-2">
            <ExternalLink className="w-3.5 h-3.5 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
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
  const hasGreeted = useRef(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  const streamResponse = useCallback(async (allMessages: Msg[]) => {
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
        body: JSON.stringify({ messages: allMessages }),
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
        setWebSources((prev) => { const n = new Map(prev); n.set(allMessages.length, currentSources); return n; });
      }
      const report = parseCareerReport(assistantContentRef.current);
      if (report) {
        setReports((prev) => { const n = new Map(prev); n.set(allMessages.length, report); return n; });
      }
    } catch (e: any) {
      console.error('Career agent error:', e);
      setMessages((prev) => [...prev, { role: 'assistant', content: `⚠️ ${e.message || '网络错误，请重试'}` }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;
    const userMsg: Msg = { role: 'user', content: content.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    await streamResponse(newMessages);
  }, [messages, isLoading, streamResponse]);

  // Auto-greet on mount: send an invisible system-like user message to trigger AI greeting
  useEffect(() => {
    if (hasGreeted.current) return;
    hasGreeted.current = true;
    
    const greetMessages: Msg[] = [
      { role: 'user', content: '你好，我想进行职业规划。' },
    ];
    // Don't show user message, just trigger AI response
    setIsLoading(true);
    assistantContentRef.current = '';

    (async () => {
      try {
        const resp = await fetch(CAREER_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({ messages: greetMessages }),
        });

        if (!resp.ok || !resp.body) throw new Error('AI服务暂时不可用');

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
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                assistantContentRef.current += delta;
                setMessages([{ role: 'assistant', content: assistantContentRef.current }]);
                scrollToBottom();
              }
            } catch {
              textBuffer = line + '\n' + textBuffer;
              break;
            }
          }
        }
      } catch (e: any) {
        setMessages([{ role: 'assistant', content: '你好！👋 我是你的职业规划助手，很高兴为你服务。先聊聊你的专业和兴趣吧，你目前学的什么专业呢？' }]);
      } finally {
        setIsLoading(false);
        scrollToBottom();
      }
    })();
  }, []);

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
        className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-0.5 transition-colors"
        {...props}
      >
        {children}
        <ExternalLink className="w-3 h-3 inline-block" />
      </a>
    ),
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Header - clean style matching main chat */}
      <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
          className="shrink-0 rounded-xl hover:bg-muted"
        >
          <ArrowLeft className="w-5 h-5 text-foreground" />
        </Button>
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/30">
            <img src={aiTeacherAvatar} alt="职业规划" className="w-full h-full object-cover" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              职业规划
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">AI</span>
            </h1>
            <p className="text-xs text-muted-foreground">对话式职业测评与规划</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6">
          {messages.map((msg, i) => {
            const reportData = reports.get(i);
            const sources = webSources.get(i);
            const displayContent = msg.role === 'assistant' ? getDisplayContent(msg.content) : msg.content;

            return (
              <div key={i} className={cn('flex animate-fade-in', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                {msg.role === 'assistant' && (
                  <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden mr-3 mt-1 bg-gradient-to-br from-primary/20 to-accent/30">
                    <img src={aiTeacherAvatar} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div
                  className={cn(
                    'max-w-[80%] rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-[hsl(var(--chat-bubble-user))] text-foreground'
                      : 'bg-[hsl(var(--chat-bubble-ai))] border border-border/50 shadow-sm'
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
              <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden mr-3 mt-1 bg-gradient-to-br from-primary/20 to-accent/30">
                <img src={aiTeacherAvatar} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="bg-[hsl(var(--chat-bubble-ai))] border border-border/50 rounded-2xl px-4 py-3 shadow-sm">
                <ThinkingIndicator />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input Area - matching main chat style */}
      <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说说你的想法、专业、兴趣..."
            className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-input border-border focus:border-primary/50 focus:ring-primary/20"
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 rounded-2xl h-[44px] w-[44px] bg-primary hover:bg-primary/90 shadow-sm border-0"
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );
}
