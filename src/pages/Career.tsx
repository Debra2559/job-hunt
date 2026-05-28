import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Send, ExternalLink, RotateCcw, X, FileText, GraduationCap, Briefcase, Plane, Compass, Target, Lightbulb, Sparkles, Rocket, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { parseCareerReport, type CareerReportData, type BossJobListing } from '@/components/career/CareerReport';
import { generateCareerReportHTML } from '@/components/career/CareerReportHTML';
import { ThinkingIndicator } from '@/components/chat/ThinkingIndicator';
import { VoiceInput } from '@/components/chat/VoiceInput';
import { useCareerConversation } from '@/hooks/useCareerConversation';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { useAuth } from '@/hooks/useAuth';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

type WebSource = { url: string; title: string; snippet: string };
import { parseOptions, type ParsedOption } from '@/lib/parseOptions';

const OPTION_PALETTE = [
  { iconBg: 'bg-blue-50', iconText: 'text-blue-600', selectedBorder: 'border-blue-500', selectedDot: 'bg-blue-500 border-blue-500', hoverIconBg: 'group-hover:bg-blue-100' },
  { iconBg: 'bg-amber-50', iconText: 'text-amber-600', selectedBorder: 'border-amber-500', selectedDot: 'bg-amber-500 border-amber-500', hoverIconBg: 'group-hover:bg-amber-100' },
  { iconBg: 'bg-indigo-50', iconText: 'text-indigo-600', selectedBorder: 'border-indigo-500', selectedDot: 'bg-indigo-500 border-indigo-500', hoverIconBg: 'group-hover:bg-indigo-100' },
  { iconBg: 'bg-rose-50', iconText: 'text-rose-600', selectedBorder: 'border-rose-500', selectedDot: 'bg-rose-500 border-rose-500', hoverIconBg: 'group-hover:bg-rose-100' },
  { iconBg: 'bg-emerald-50', iconText: 'text-emerald-600', selectedBorder: 'border-emerald-500', selectedDot: 'bg-emerald-500 border-emerald-500', hoverIconBg: 'group-hover:bg-emerald-100' },
  { iconBg: 'bg-violet-50', iconText: 'text-violet-600', selectedBorder: 'border-violet-500', selectedDot: 'bg-violet-500 border-violet-500', hoverIconBg: 'group-hover:bg-violet-100' },
];

function pickIcon(label: string, index: number) {
  const l = label;
  if (/(保研|考研|深造|读研|博士|硕士|升学)/.test(l)) return GraduationCap;
  if (/(就业|工作|求职|入职|找工作)/.test(l)) return Briefcase;
  if (/(留学|海外|出国|境外)/.test(l)) return Plane;
  if (/(还没|不确定|看一步|未定|犹豫|迷茫)/.test(l)) return Compass;
  const cycle = [Target, Lightbulb, Sparkles, Rocket, Compass, Briefcase];
  return cycle[index % cycle.length];
}

function OptionButtons({ options, onSelect, disabled }: { options: ParsedOption[]; onSelect: (label: string) => void; disabled: boolean }) {
  const [selected, setSelected] = useState<Set<number>>(new Set());

  if (options.length === 0) return null;

  const handleClick = (index: number) => {
    if (disabled) return;
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSubmit = () => {
    if (selected.size === 0 || disabled) return;
    const labels = Array.from(selected).sort().map(i => options[i].label);
    onSelect(labels.join('、'));
    setSelected(new Set());
  };

  return (
    <div className="mt-3 animate-fade-in space-y-3">
      <div className="flex items-center gap-2 px-1">
        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">点击选择 · 可多选</span>
      </div>
      <div className="space-y-2.5">
        {options.map((opt, i) => {
          const isSelected = selected.has(i);
          const palette = OPTION_PALETTE[i % OPTION_PALETTE.length];
          const Icon = pickIcon(opt.label, i);
          // Split label into main + parenthetical for nicer typography
          const m = opt.label.match(/^(.+?)[（(](.+?)[)）]\s*$/);
          const mainText = m ? m[1].trim() : opt.label;
          const subText = m ? m[2].trim() : '';

          return (
            <button
              key={i}
              onClick={() => handleClick(i)}
              disabled={disabled}
              className={cn(
                'group relative w-full flex items-center p-3.5 bg-card rounded-2xl border-2 shadow-sm transition-all duration-200 text-left',
                'disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.99]',
                isSelected
                  ? cn(palette.selectedBorder, 'shadow-md')
                  : 'border-transparent hover:border-border hover:shadow-md'
              )}
            >
              <div className={cn('shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors', palette.iconBg, palette.iconText, palette.hoverIconBg)}>
                <Icon className="w-5 h-5" strokeWidth={2} />
              </div>
              <div className="ml-3.5 flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  {mainText}
                  {subText && <span className="text-muted-foreground font-normal ml-1.5 text-xs">（{subText}）</span>}
                </p>
              </div>
              <div className="shrink-0 ml-3">
                <div className={cn(
                  'w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-200',
                  isSelected ? cn(palette.selectedDot, 'scale-100') : 'border-muted-foreground/25 bg-background scale-90 group-hover:border-muted-foreground/50'
                )}>
                  {isSelected && <Check className="w-3 h-3 text-white" strokeWidth={4} />}
                </div>
              </div>
            </button>
          );
        })}
      </div>
      {selected.size > 0 && (
        <button
          onClick={handleSubmit}
          disabled={disabled}
          className={cn(
            'w-full py-3 rounded-2xl text-sm font-semibold transition-all duration-300',
            'bg-primary text-primary-foreground hover:bg-primary/90',
            'shadow-[0_4px_14px_-3px_hsl(var(--primary)/0.4)]',
            'active:scale-[0.98] animate-fade-in'
          )}
        >
          确认选择（{selected.size}项）→
        </button>
      )}
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

const REPORT_LS_KEY = 'career:report:v1';

export default function Career() {
  const { user } = useAuth();
  const { messages, isLoading, loadingHistory, sendMessage, autoGreet, hasGreeted, clearHistory } = useCareerConversation(user?.id);
  const [input, setInput] = useState('');
  const [reports, setReports] = useState<Map<number, CareerReportData>>(new Map());
  const [webSources, setWebSources] = useState<Map<number, WebSource[]>>(new Map());
  const [bossJobs, setBossJobs] = useState<BossJobListing[]>([]);
  const [activeReport, setActiveReport] = useState<CareerReportData | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { markDone } = useQuestProgress();
  const { onStageCompleted, bumpDaily } = useGameProgress();

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 50);
  };

  // Auto-greet when there are no existing messages
  useEffect(() => {
    if (!loadingHistory && messages.length === 0 && !hasGreeted.current) {
      autoGreet();
    }
  }, [loadingHistory, messages.length, autoGreet]);

  // Scroll on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Parse reports from loaded messages & auto-open panel
  const openedReportsRef = useRef<Set<number>>(new Set());
  
  useEffect(() => {
    if (!loadingHistory) {
      const newReports = new Map<number, CareerReportData>();
      messages.forEach((msg, i) => {
        if (msg.role === 'assistant') {
          const report = parseCareerReport(msg.content);
          if (report) {
            // Inject boss jobs if available
            if (bossJobs.length > 0) {
              report.jobListings = bossJobs;
            }
            newReports.set(i, report);
            if (!openedReportsRef.current.has(i) && !isLoading) {
              openedReportsRef.current.add(i);
              setTimeout(() => setActiveReport(report), 300);
            }
          }
        }
      });
      if (newReports.size > 0) {
        setReports(newReports);
        // 持久化最近一次报告，供后续章节读取
        const latest = Array.from(newReports.values()).pop();
        if (latest) {
          try {
            localStorage.setItem(REPORT_LS_KEY, JSON.stringify({
              data: latest,
              userId: user?.id ?? null,
              savedAt: new Date().toISOString(),
            }));
          } catch { /* ignore quota */ }
        }
        // Chapter 1 通关：生成报告即意味着「认识自己」三个关卡完成
        ['assess', 'recommend', 'jd'].forEach(id => {
          markDone(id);
          onStageCompleted(id);
        });
      }
    }
  }, [loadingHistory, messages, isLoading, bossJobs, markDone, onStageCompleted, user?.id]);

  // Generate HTML for iframe
  const reportHTML = useMemo(() => {
    if (!activeReport) return '';
    return generateCareerReportHTML(activeReport);
  }, [activeReport]);

  const reportBlobUrl = useMemo(() => {
    if (!reportHTML) return '';
    const blob = new Blob([reportHTML], { type: 'text/html' });
    return URL.createObjectURL(blob);
  }, [reportHTML]);

  // Cleanup blob URL
  useEffect(() => {
    return () => { if (reportBlobUrl) URL.revokeObjectURL(reportBlobUrl); };
  }, [reportBlobUrl]);


  const handleSend = async (content: string) => {
    if (!content.trim() || isLoading) return;
    setInput('');
    bumpDaily('ask_career');
    await sendMessage(
      content,
      (index, sources) => {
        setWebSources(prev => { const n = new Map(prev); n.set(index, sources); return n; });
      },
      (jobs) => {
        setBossJobs(jobs);
      }
    );
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // 中文输入法 compose 中不发送，避免 IME 终稿回写残留
    if ((e.nativeEvent as any).isComposing || (e as any).keyCode === 229) return;
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      const content = input;
      setInput('');
      handleSend(content);
    }
  };

  const handleClearHistory = async () => {
    setReports(new Map());
    setWebSources(new Map());
    setBossJobs([]);
    setActiveReport(null);
    await clearHistory();
    setTimeout(() => autoGreet(), 100);
  };

  // 移除已完成的 ```career-report``` 块；若仍在流式生成（已开启但未闭合），整段移除等待状态另行展示
  const getDisplayContent = (content: string) =>
    content
      .replace(/```career-report[\s\S]*?```/g, '')
      .replace(/```career-report[\s\S]*$/, '')
      .trim();
  const isReportStreaming = (content: string) =>
    /```career-report/.test(content) && !/```career-report[\s\S]*?```/.test(content);

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

  if (loadingHistory) {
    return (
      <div className="map-aurora flex items-center justify-center h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100">
        <ThinkingIndicator />
      </div>
    );
  }

  return (
    <div className="map-aurora relative flex h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100">
      {/* 浮云装饰，与地图风格一致 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[6%] left-[6%] text-3xl opacity-50 animate-[float_8s_ease-in-out_infinite]">☁️</div>
        <div className="absolute top-[12%] right-[8%] text-4xl opacity-40 animate-[float_10s_ease-in-out_infinite]" style={{ animationDelay: '1.5s' }}>☁️</div>
        <div className="absolute top-[4%] left-[48%] text-2xl opacity-45 animate-[float_12s_ease-in-out_infinite]" style={{ animationDelay: '3s' }}>🌤️</div>
      </div>

      {/* Chat Panel */}
      <div className={cn(
        "relative z-10 flex flex-col transition-all duration-500 ease-out",
        activeReport ? "w-1/2 border-r border-white/40" : "w-full"
      )}>
        {/* Header */}
        <header className="shrink-0 border-b border-white/40 backdrop-blur-2xl bg-white/65 px-4 py-3 flex items-center gap-3">
          <a href="/" className="shrink-0 w-9 h-9 rounded-2xl hover:bg-emerald-100/70 flex items-center justify-center transition-colors" title="返回闯关地图">
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
          </a>
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative w-9 h-9 rounded-2xl overflow-hidden bg-gradient-to-br from-emerald-200 via-teal-200 to-cyan-200 shrink-0 shadow-sm">
              <img src={aiTeacherAvatar} alt="职业规划" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold flex items-center gap-1.5 leading-tight">
                <span className="aurora-text">第一章 · 认识自己</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white font-semibold tracking-wide">智联 AI</span>
              </h1>
              <p className="text-[11px] text-muted-foreground truncate">
                🧭 共 8-12 题 · 5-10 分钟 · 当前第 {Math.min(messages.filter(m => m.role === 'user').length + 1, 12)} 题
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            disabled={isLoading}
            className="shrink-0 rounded-2xl hover:bg-emerald-100/70"
            title="清空对话历史"
          >
            <RotateCcw className="w-4 h-4 text-emerald-700" />
          </Button>
        </header>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          <div className={cn("mx-auto px-3 sm:px-6 py-6 sm:py-8 space-y-4 sm:space-y-6", activeReport ? "max-w-2xl" : "max-w-3xl")}>
            {messages.map((msg, i) => {
              const reportData = reports.get(i);
              const sources = webSources.get(i);
              const displayContent = msg.role === 'assistant' ? getDisplayContent(msg.content) : msg.content;
              const isLastAssistant = msg.role === 'assistant' && i === messages.length - 1 && !isLoading;
              const options = isLastAssistant && !reportData ? parseOptions(displayContent) : [];

              return (
                <div key={i} className="animate-fade-in">
                  <div className={cn('flex', msg.role === 'user' ? 'justify-end' : 'justify-start')}>
                    {msg.role === 'assistant' && (
                      <div className="shrink-0 w-8 h-8 rounded-full overflow-hidden mr-3 mt-1 bg-gradient-to-br from-primary/20 to-accent/30">
                        <img src={aiTeacherAvatar} alt="" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div
                      className={cn(
                        'max-w-[85%] rounded-3xl px-4 py-3 text-sm',
                        msg.role === 'user'
                          ? 'bg-gradient-to-br from-emerald-100 to-teal-100 text-foreground shadow-[0_6px_18px_-10px_rgba(16,185,129,0.4)]'
                          : 'bg-white/85 backdrop-blur-sm border border-white/70 shadow-[0_8px_24px_-12px_rgba(16,185,129,0.25)]'
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
                          {isReportStreaming(msg.content) && !reportData && (
                            <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-cyan-50 border border-emerald-200/60">
                              <div className="relative w-8 h-8 shrink-0">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 opacity-30 animate-ping" />
                                <div className="relative w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
                                  <FileText className="w-4 h-4 text-white" />
                                </div>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-emerald-800">职业规划报告生成中…</p>
                                <p className="text-[11px] text-emerald-700/70">正在整理你的画像、岗位推荐与成长路径</p>
                              </div>
                            </div>
                          )}
                          {reportData && (
                            <button
                              onClick={() => setActiveReport(reportData)}
                              className={cn(
                                "w-full mt-2 py-3 rounded-2xl text-sm font-bold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2",
                                activeReport === reportData
                                  ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                                  : "bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-[0_10px_28px_-10px_rgba(16,185,129,0.55)] hover:opacity-95 hover:-translate-y-0.5"
                              )}
                            >
                              <FileText className="w-4 h-4" />
                              {activeReport === reportData ? '报告预览中' : '查看职业规划报告'}
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                      )}
                    </div>
                  </div>
                  {options.length > 0 && (
                    <div className="ml-11 mt-2">
                      <OptionButtons options={options} onSelect={handleSend} disabled={isLoading} />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="animate-fade-in">
                <ThinkingIndicator />
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="shrink-0 border-t border-white/40 backdrop-blur-2xl bg-white/65 px-4 py-3">
          <div className={cn("mx-auto flex items-end gap-2", activeReport ? "max-w-2xl" : "max-w-3xl")}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="优先点选上方选项；如需补充可在此输入或语音..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-white/80 border-white/70 focus:border-emerald-400/60 focus:ring-emerald-300/30"
              rows={1}
            />
            <VoiceInput
              onTranscript={(text) => setInput(prev => (prev ? prev + ' ' : '') + text)}
              disabled={isLoading}
            />
            <Button
              onClick={() => handleSend(input)}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="shrink-0 rounded-2xl h-[44px] w-[44px] bg-gradient-to-br from-emerald-400 via-teal-500 to-cyan-500 hover:opacity-95 shadow-[0_8px_22px_-8px_rgba(16,185,129,0.55)] border-0"
            >
              <Send className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </div>

      {/* Artifact Preview Panel */}
      {activeReport && (
        <div className="relative z-10 w-1/2 flex flex-col bg-white/85 backdrop-blur-xl animate-slide-in-right">
          {/* Panel Header */}
          <div className="shrink-0 border-b border-white/40 bg-white/65 backdrop-blur-2xl px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-200 flex items-center justify-center shadow-sm">
                <FileText className="w-3.5 h-3.5 text-emerald-700" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">职业规划报告</p>
                <p className="text-[11px] text-muted-foreground">第一章 · 认识自己 · 已保存</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg"
              onClick={() => setActiveReport(null)}
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </Button>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            <iframe
              src={reportBlobUrl}
              className="w-full h-full border-0"
              title="职业规划报告预览"
              sandbox="allow-scripts"
            />
          </div>

          {/* 下一关 CTA */}
          <div className="shrink-0 border-t border-white/40 bg-white/75 backdrop-blur-2xl px-4 py-3">
            <a
              href="/?next=ch2"
              className="group flex items-center justify-between gap-3 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white shadow-[0_10px_28px_-10px_rgba(16,185,129,0.55)] hover:opacity-95 hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex flex-col items-start leading-tight">
                <span className="text-[11px] uppercase tracking-wider opacity-90">第一章已通关 🎉</span>
                <span className="text-sm font-bold">进入第二章 · 应聘准备</span>
              </div>
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
