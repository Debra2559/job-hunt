import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Send, Compass, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { CareerReport, parseCareerReport, type CareerReportData } from '@/components/career/CareerReport';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';

type Msg = { role: 'user' | 'assistant'; content: string };

const CAREER_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/career-agent`;

const QUICK_STARTERS = [
  { label: '🎯 开始职业测评', message: '你好，我想做一个职业规划测评，帮我分析一下适合什么岗位。' },
  { label: '🔄 换个方向聊聊', message: '我对目前的专业方向不太确定，想探索其他可能性。' },
  { label: '📊 了解行业趋势', message: '我想了解一下当前就业市场的热门行业和发展趋势。' },
];

export default function Career() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [reports, setReports] = useState<Map<number, CareerReportData>>(new Map());
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
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantContentRef.current } : m);
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

      // Check for career report in final content
      const report = parseCareerReport(assistantContentRef.current);
      if (report) {
        setReports((prev) => {
          const next = new Map(prev);
          next.set(newMessages.length, report); // index of assistant msg
          return next;
        });
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

  // Extract text content without the report JSON block
  const getDisplayContent = (content: string) => {
    return content.replace(/```career-report[\s\S]*?```/g, '').trim();
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <header className="shrink-0 border-b bg-card/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-sm">
            <Compass className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground">职业规划 Agent</h1>
            <p className="text-xs text-muted-foreground">AI驱动的个性化职业测评</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-accent flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-primary" />
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-xl font-bold text-foreground">发现你的职业方向 ✨</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  通过AI对话，分析你的性格、专业、兴趣和价值观，结合行业趋势为你推荐最适合的职业方向。
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2">
                {QUICK_STARTERS.map((qs, i) => (
                  <button
                    key={i}
                    onClick={() => sendMessage(qs.message)}
                    className="px-4 py-2.5 rounded-xl border bg-card text-sm text-foreground hover:bg-accent hover:border-primary/30 transition-all"
                  >
                    {qs.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg, i) => {
            const reportData = reports.get(i);
            const displayContent = msg.role === 'assistant' ? getDisplayContent(msg.content) : msg.content;

            return (
              <div key={i} className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-card border'
                  )}
                >
                  {msg.role === 'assistant' ? (
                    <div className="space-y-4">
                      {displayContent && (
                        <div className="prose prose-sm max-w-none text-foreground">
                          <ReactMarkdown remarkPlugins={[remarkGfm]}>{displayContent}</ReactMarkdown>
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
            <div className="flex justify-start">
              <div className="bg-card border rounded-2xl px-4 py-3">
                <ThinkingIndicator />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 border-t bg-card/80 backdrop-blur-sm px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-end gap-2">
          <Textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的回答..."
            className="min-h-[44px] max-h-[120px] resize-none rounded-xl bg-background"
            rows={1}
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={!input.trim() || isLoading}
            size="icon"
            className="shrink-0 rounded-xl h-[44px] w-[44px]"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
