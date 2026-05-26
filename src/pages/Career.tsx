import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { ArrowLeft, Send, ExternalLink, RotateCcw, X, Eye, Code, Copy, Download, FileText, GraduationCap, Briefcase, Plane, Compass, Target, Lightbulb, Sparkles, Rocket, Check } from 'lucide-react';
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

export default function Career() {
  const { messages, isLoading, loadingHistory, sendMessage, autoGreet, hasGreeted, clearHistory } = useCareerConversation(undefined);
  const [input, setInput] = useState('');
  const [reports, setReports] = useState<Map<number, CareerReportData>>(new Map());
  const [webSources, setWebSources] = useState<Map<number, WebSource[]>>(new Map());
  const [bossJobs, setBossJobs] = useState<BossJobListing[]>([]);
  const [activeReport, setActiveReport] = useState<CareerReportData | null>(null);
  const [previewMode, setPreviewMode] = useState<'preview' | 'code'>('preview');
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
        // Chapter 1 通关：生成报告即意味着「认识自己」三个关卡完成
        ['assess', 'recommend', 'jd'].forEach(id => {
          markDone(id);
          onStageCompleted(id);
        });
      }
    }
  }, [loadingHistory, messages, isLoading, bossJobs, markDone, onStageCompleted]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(input);
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

  if (loadingHistory) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-b from-background to-muted/30">
        <ThinkingIndicator />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Chat Panel */}
      <div className={cn(
        "flex flex-col transition-all duration-500 ease-out",
        activeReport ? "w-1/2 border-r border-border" : "w-full"
      )}>
        {/* Header */}
        <header className="shrink-0 border-b border-border bg-background/80 backdrop-blur-sm px-4 py-3 flex items-center gap-3">
          <a href="/" className="shrink-0 w-9 h-9 rounded-xl hover:bg-muted flex items-center justify-center transition-colors" title="返回闯关地图">
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </a>
          <div className="flex items-center gap-3 flex-1">
            <div className="relative w-9 h-9 rounded-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/30">
              <img src={aiTeacherAvatar} alt="职业规划" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                职业规划
                <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">AI</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                共约 8-12 题 · 5-10 分钟 · 当前第 {Math.min(messages.filter(m => m.role === 'user').length + 1, 12)} 题
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClearHistory}
            disabled={isLoading}
            className="shrink-0 rounded-xl hover:bg-muted"
            title="清空对话历史"
          >
            <RotateCcw className="w-4 h-4 text-muted-foreground" />
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
              const options = isLastAssistant ? parseOptions(msg.content) : [];

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
                        'max-w-[85%] rounded-2xl px-4 py-3 text-sm',
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
                          {reportData && (
                            <button
                              onClick={() => setActiveReport(reportData)}
                              className={cn(
                                "w-full mt-2 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 active:scale-[0.98] flex items-center justify-center gap-2",
                                activeReport === reportData
                                  ? "bg-primary/10 text-primary border border-primary/20"
                                  : "bg-gradient-to-r from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] text-white shadow-[0_4px_14px_-3px_hsl(var(--dream-violet)/0.4)] hover:opacity-90"
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
        <div className="shrink-0 border-t border-border bg-background/80 backdrop-blur-sm px-4 py-3">
          <div className={cn("mx-auto flex items-end gap-2", activeReport ? "max-w-2xl" : "max-w-3xl")}>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="优先点选上方选项；如需补充可在此输入或语音..."
              className="min-h-[44px] max-h-[120px] resize-none rounded-2xl bg-input border-border focus:border-primary/50 focus:ring-primary/20"
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
              className="shrink-0 rounded-2xl h-[44px] w-[44px] bg-primary hover:bg-primary/90 shadow-sm border-0"
            >
              <Send className="w-4 h-4 text-primary-foreground" />
            </Button>
          </div>
        </div>
      </div>

      {/* Artifact Preview Panel */}
      {activeReport && (
        <div className="w-1/2 flex flex-col bg-background animate-slide-in-right">
          {/* Panel Header */}
          <div className="shrink-0 border-b border-border bg-background px-4 py-2.5 flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[hsl(var(--dream-violet)/0.15)] to-[hsl(var(--dream-pink)/0.1)] flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-[hsl(var(--dream-violet))]" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">职业规划报告</p>
                <p className="text-[11px] text-muted-foreground">HTML Document</p>
              </div>
            </div>

            {/* Mode tabs */}
            <div className="flex items-center rounded-lg border border-border bg-muted/50 p-0.5">
              <button
                onClick={() => setPreviewMode('preview')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                  previewMode === 'preview'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Eye className="w-3.5 h-3.5" />
                预览
              </button>
              <button
                onClick={() => setPreviewMode('code')}
                className={cn(
                  "px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all",
                  previewMode === 'code'
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Code className="w-3.5 h-3.5" />
                源码
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                title="复制HTML"
                onClick={() => { navigator.clipboard.writeText(reportHTML); }}
              >
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                title="下载HTML"
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = reportBlobUrl;
                  a.download = `职业规划报告.html`;
                  a.click();
                }}
              >
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                title="在新标签页打开"
                onClick={() => window.open(reportBlobUrl, '_blank')}
              >
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-lg"
                onClick={() => setActiveReport(null)}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </Button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-hidden">
            {previewMode === 'preview' ? (
              <iframe
                src={reportBlobUrl}
                className="w-full h-full border-0"
                title="职业规划报告预览"
                sandbox="allow-scripts"
              />
            ) : (
              <div className="h-full overflow-auto bg-[#1e1e2e] p-4">
                <pre className="text-[13px] leading-relaxed font-mono text-[#cdd6f4] whitespace-pre-wrap break-words">
                  <code>{reportHTML}</code>
                </pre>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
