import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft, Send, ShieldCheck, Heart, Building2, MapPin, DollarSign,
  Target, Check, AlertCircle, ExternalLink, Sparkles,
  FileText, Search, ClipboardCheck, Mail, Loader2, ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { streamCh2 } from '@/lib/ch2Stream';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';

// ========== Types ==========
type JobCard = {
  id: string;
  title: string;
  company: string;
  city: string;
  salary: string;
  matchReason: string;
  strengths: string[];
  gap: string;
  platform: string;
  matchScore: number;
};

type ResumeCheck = {
  keywordCoverage: { found: string[]; missing: string[] };
  openingStrength: 'good' | 'needs_work';
  openingNote: string;
  quantification: { count: number; sufficient: boolean; suggestion: string };
  overall: string;
};

type ApplyRecord = {
  job: JobCard;
  appliedAt: string;
  channel: string;
  resumeVersion: string;
  note: string;
  status: '已投递';
};

// ========== LocalStorage ==========
const FEED_CARDS_LS = 'career:feed:cards:v2';
const FEED_FAVORITES_LS = 'career:feed:favorites:v1';
const APPLY_HISTORY_LS = 'career:apply:history:v1';

function loadFavorites(): JobCard[] {
  try {
    const favIds: string[] = JSON.parse(localStorage.getItem(FEED_FAVORITES_LS) || '[]');
    const allCards: JobCard[] = JSON.parse(localStorage.getItem(FEED_CARDS_LS) || '[]');
    // Also check mock-fallback: cards might have 'mock-' prefix IDs
    const idSet = new Set(favIds);
    return allCards.filter(c => idSet.has(c.id));
  } catch { return []; }
}

function loadHistory(): ApplyRecord[] {
  try {
    return JSON.parse(localStorage.getItem(APPLY_HISTORY_LS) || '[]');
  } catch { return []; }
}

function saveHistory(records: ApplyRecord[]) {
  try { localStorage.setItem(APPLY_HISTORY_LS, JSON.stringify(records)); } catch {}
}

// ========== Platform colors ==========
const PLATFORM_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'Boss直聘': { bg: 'bg-cyan-50', text: 'text-cyan-700', icon: '💼' },
  '拉勾': { bg: 'bg-green-50', text: 'text-green-700', icon: '🌱' },
  '猎聘': { bg: 'bg-amber-50', text: 'text-amber-700', icon: '🎯' },
  'LinkedIn': { bg: 'bg-blue-50', text: 'text-blue-700', icon: '🔗' },
  '智联招聘': { bg: 'bg-orange-50', text: 'text-orange-700', icon: '🔶' },
  '应届生求职网': { bg: 'bg-purple-50', text: 'text-purple-700', icon: '🎓' },
};

// ========== Main Component ==========
export default function CareerApply() {
  const { markDone, completed } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  const [favorites, setFavorites] = useState<JobCard[]>(loadFavorites);
  const [selectedJob, setSelectedJob] = useState<JobCard | null>(null);
  const [resumeCheck, setResumeCheck] = useState<ResumeCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [history, setHistory] = useState<ApplyRecord[]>(loadHistory);
  const [applied, setApplied] = useState(false);

  // Mark quest on first visit
  useEffect(() => {
    if (!completed.includes('apply')) {
      markDone('apply');
      onStageCompleted('apply');
    }
  }, [completed, markDone, onStageCompleted]);

  // Check if already applied to this job
  const alreadyApplied = selectedJob && history.some(r => r.job.id === selectedJob.id);

  // ========== Resume quick-check ==========
  const runResumeCheck = async (job: JobCard) => {
    setSelectedJob(job);
    setResumeCheck(null);
    setApplied(false);
    setChecking(true);

    // Try to read resume from localStorage (various possible keys)
    let resumeContent = '';
    try {
      const keys = Object.keys(localStorage).filter(k => k.includes('resume') && k !== 'career:feed:resume:v1');
      for (const k of keys) {
        const val = localStorage.getItem(k);
        if (val && val.length > 100) {
          resumeContent = val.slice(0, 3000);
          break;
        }
      }
    } catch {}

    if (!resumeContent) {
      // No resume found — generate a minimal check
      setResumeCheck({
        keywordCoverage: { found: [], missing: ['简历未找到，建议先完成第二章"一键简历"'] },
        openingStrength: 'needs_work',
        openingNote: '无法检查 — 请先前往简历关卡生成简历',
        quantification: { count: 0, sufficient: false, suggestion: '完成简历后再进行投递前检查' },
        overall: '需要先完成简历',
      });
      setChecking(false);
      return;
    }

    const jdText = `${job.title} - ${job.company} - ${job.matchReason} - 技能要求: ${job.strengths.join(', ')}`;

    const prompt = `你是一位专业的简历教练。请对以下简历和JD做三项快速校验，严格按JSON格式输出。

JD信息：${jdText}

简历内容：${resumeContent}

输出严格的JSON（不要markdown）：
{
  "keywordCoverage": { "found": ["JD中出现在简历中的关键词"], "missing": ["JD中简历里缺失的关键词"] },
  "openingStrength": "good或needs_work",
  "openingNote": "一句话点评简历开头力度",
  "quantification": { "count": 数字, "sufficient": true或false, "suggestion": "如不足则给出具体修改建议" },
  "overall": "整体一句话建议"
}`;

    let fullResponse = '';
    try {
      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('超时')), 12000);
        streamCh2({
          mode: 'assistant',
          input: prompt,
          systemPrompt: '只输出JSON，不说其他话。',
          history: [],
          onDelta: (chunk) => { fullResponse += chunk; },
          onDone: () => { clearTimeout(timer); resolve(); },
          onError: (e) => { clearTimeout(timer); reject(new Error(e)); },
        });
      });

      let jsonStr = fullResponse.trim();
      const fence = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (fence) jsonStr = fence[1].trim();
      const objMatch = jsonStr.match(/(\{[\s\S]*\})/);
      if (objMatch) jsonStr = objMatch[1];

      const result: ResumeCheck = JSON.parse(jsonStr);
      setResumeCheck(result);
    } catch (e: any) {
      console.error('Resume check failed:', e?.message);
      // Fallback: basic heuristic check
      const jdWords = jdText.toLowerCase().split(/\s+/).filter(w => w.length > 1);
      const resumeWords = new Set(resumeContent.toLowerCase().split(/\s+/).filter(w => w.length > 1));
      const found = jdWords.filter(w => resumeWords.has(w)).slice(0, 5);
      const missing = jdWords.filter(w => !resumeWords.has(w) && w.length > 2).slice(0, 5);
      const hasQuant = /\d+%|\d+倍|\d+人|\d+万|\d+k|\d+个/.test(resumeContent);

      setResumeCheck({
        keywordCoverage: { found, missing },
        openingStrength: resumeContent.length > 50 ? 'good' : 'needs_work',
        openingNote: resumeContent.length > 50 ? '开头概要基本清晰' : '建议补充个人介绍段落',
        quantification: {
          count: hasQuant ? 1 : 0,
          sufficient: hasQuant,
          suggestion: hasQuant ? '量化数据基本足够' : '建议在经历描述中加入至少2处量化成果（如提升X%、覆盖N人）',
        },
        overall: hasQuant ? '简历基本就绪，可以投递' : '建议补充量化数据后再投递',
      });
    } finally {
      setChecking(false);
    }
  };

  // ========== Execute apply ==========
  const doApply = () => {
    if (!selectedJob) return;

    const record: ApplyRecord = {
      job: selectedJob,
      appliedAt: new Date().toLocaleString('zh-CN'),
      channel: selectedJob.platform,
      resumeVersion: '优化版',
      note: '',
      status: '已投递',
    };

    const updated = [record, ...history];
    setHistory(updated);
    saveHistory(updated);
    setApplied(true);

    toast({ title: '📮 投递已记录', description: `${selectedJob.company} · ${selectedJob.title}` });
  };

  // ========== Render ==========
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#faf9f7] via-white to-[#f7f6f1]">
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[8%] -left-20 w-80 h-80 rounded-full bg-sky-100/20 blur-3xl" />
        <div className="absolute bottom-[12%] -right-16 w-72 h-72 rounded-full bg-emerald-100/20 blur-3xl" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#faf9f7]/85 border-b border-stone-200/70">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/career/map" className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-sm">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-semibold leading-tight text-foreground">一键投递</h1>
              <span className="shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-600 border border-rose-200 text-[10px] font-semibold">
                <ShieldCheck className="w-3 h-3" strokeWidth={2.5} />
                第三章·投递闯关
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              {selectedJob ? `投递：${selectedJob.company} · ${selectedJob.title}` : '选择收藏的职位，一键投递'}
            </p>
          </div>
          {selectedJob && (
            <button onClick={() => { setSelectedJob(null); setResumeCheck(null); setApplied(false); }} className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-stone-200 text-muted-foreground hover:text-foreground transition-colors">
              返回列表
            </button>
          )}
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-3 sm:px-6 py-5 sm:py-8 space-y-4">
        {/* ===== Favorites list ===== */}
        {!selectedJob && (
          <>
            <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-2.5 mb-1">
                <Heart className="w-5 h-5 text-rose-500 fill-current" />
                <h2 className="font-bold text-foreground">我的收藏</h2>
                <span className="text-[12px] text-muted-foreground">({favorites.length} 个职位)</span>
              </div>
              <p className="text-[12px] text-muted-foreground">
                在「每日机会 Feed」中收藏的职位会出现在这里，选择一个开始投递
              </p>
            </div>

            {favorites.length === 0 ? (
              <div className="rounded-3xl bg-white border border-stone-200 p-10 text-center shadow-sm">
                <div className="text-5xl mb-4">💝</div>
                <h3 className="font-bold text-lg text-foreground mb-2">还没有收藏职位</h3>
                <p className="text-[13px] text-muted-foreground mb-5">
                  去「每日机会 Feed」逛一逛，点击卡片右上角的 ♡ 收藏心仪职位
                </p>
                <Link to="/career/feed">
                  <Button className="rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white font-semibold">
                    去 Feed 看看 →
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {favorites.map(job => {
                  const plat = PLATFORM_COLORS[job.platform] || PLATFORM_COLORS['Boss直聘'];
                  return (
                    <button
                      key={job.id}
                      onClick={() => runResumeCheck(job)}
                      className="w-full text-left rounded-2xl bg-white border border-stone-200 p-4 hover:border-sky-300 hover:shadow-md hover:-translate-y-0.5 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-bold text-sm text-foreground">{job.title}</h3>
                          <p className="text-[12px] text-muted-foreground mt-0.5">{job.company}</p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3" />{job.city}
                            </span>
                            <span className="text-[11px] text-muted-foreground inline-flex items-center gap-1">
                              <DollarSign className="w-3 h-3" />{job.salary}
                            </span>
                            <span className={cn('text-[10px] px-1.5 py-0.5 rounded-full font-medium', plat.bg, plat.text)}>
                              {plat.icon} {job.platform}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <span className="text-[11px] font-bold text-foreground">{job.matchScore}</span>
                          <span className="text-[10px] text-muted-foreground">分</span>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ===== Resume check loading ===== */}
        {selectedJob && checking && (
          <div className="rounded-3xl bg-white border border-stone-200 p-10 text-center shadow-sm">
            <Loader2 className="w-10 h-10 text-sky-500 animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-foreground mb-1">正在分析简历匹配度…</h3>
            <p className="text-[13px] text-muted-foreground">
              对比 {selectedJob.title} JD 与你的简历
            </p>
          </div>
        )}

        {/* ===== Resume check result ===== */}
        {selectedJob && resumeCheck && !checking && !applied && (
          <div className="space-y-4">
            {/* Job info card */}
            <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-100 flex items-center justify-center text-lg">{'📋'}</div>
                <div>
                  <h3 className="font-bold text-sm text-foreground">{selectedJob.title}</h3>
                  <p className="text-[12px] text-muted-foreground">{selectedJob.company} · {selectedJob.city} · {selectedJob.salary}</p>
                </div>
              </div>
            </div>

            {/* Resume check result */}
            <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2">
                <ClipboardCheck className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-foreground">投递前小提醒 ✍️</h3>
              </div>

              {/* Keywords */}
              <div className="space-y-2">
                {resumeCheck.keywordCoverage.missing.length > 0 && (
                  <div className="rounded-xl bg-amber-50/50 border border-amber-100 p-3">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-medium text-amber-800">⚠️ JD 关键词在简历中未体现</p>
                        <p className="text-[12px] text-amber-700 mt-0.5">
                          {resumeCheck.keywordCoverage.missing.join('、')}
                        </p>
                        <p className="text-[12px] text-amber-700 mt-1">
                          → 建议在项目经历中补充这些关键词
                        </p>
                      </div>
                    </div>
                  </div>
                )}
                {resumeCheck.keywordCoverage.found.length > 0 && (
                  <div className="rounded-xl bg-emerald-50/50 border border-emerald-100 p-3">
                    <div className="flex items-start gap-2">
                      <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-[13px] font-medium text-emerald-800">✅ 已覆盖关键词</p>
                        <p className="text-[12px] text-emerald-700 mt-0.5">
                          {resumeCheck.keywordCoverage.found.join('、')}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Opening strength */}
              <div className={cn(
                'rounded-xl p-3',
                resumeCheck.openingStrength === 'good' ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-amber-50/50 border border-amber-100',
              )}>
                <div className="flex items-start gap-2">
                  {resumeCheck.openingStrength === 'good'
                    ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={cn('text-[13px] font-medium', resumeCheck.openingStrength === 'good' ? 'text-emerald-800' : 'text-amber-800')}>
                      {resumeCheck.openingStrength === 'good' ? '✅ 开头概要' : '⚠️ 开头概要'}：{resumeCheck.openingNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quantification */}
              <div className={cn(
                'rounded-xl p-3',
                resumeCheck.quantification.sufficient ? 'bg-emerald-50/50 border border-emerald-100' : 'bg-amber-50/50 border border-amber-100',
              )}>
                <div className="flex items-start gap-2">
                  {resumeCheck.quantification.sufficient
                    ? <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    : <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                  }
                  <div>
                    <p className={cn('text-[13px] font-medium', resumeCheck.quantification.sufficient ? 'text-emerald-800' : 'text-amber-800')}>
                      {resumeCheck.quantification.sufficient ? '✅ 数字化量化' : '⚠️ 数字化量化'}：{resumeCheck.quantification.suggestion}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">
                      检测到 {resumeCheck.quantification.count} 处量化数据{resumeCheck.quantification.sufficient ? '' : '，建议至少 2 处'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Overall */}
              <div className="rounded-xl bg-sky-50/50 border border-sky-100 p-3">
                <p className="text-[13px] text-sky-800">{resumeCheck.overall}</p>
              </div>
            </div>

            {/* Apply button */}
            <div className="flex items-center gap-3">
              <Button
                onClick={doApply}
                className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 text-white font-semibold shadow-md hover:opacity-95 py-5 text-sm"
              >
                <Send className="w-4 h-4 mr-1.5" /> 直接投递
              </Button>
              <Link
                to="/career/resume"
                className="shrink-0 px-4 py-2.5 rounded-xl bg-white border border-stone-200 text-[12px] text-muted-foreground hover:text-foreground transition-colors text-center"
              >
                先改简历
              </Link>
            </div>
          </div>
        )}

        {/* ===== Applied confirmation ===== */}
        {selectedJob && applied && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200 p-6 text-center shadow-sm">
              <div className="text-4xl mb-3">📮</div>
              <h3 className="font-bold text-lg text-foreground mb-2">投递已确认</h3>
              <p className="text-[13px] text-muted-foreground">
                你的简历已优化并准备投递至 {selectedJob.company}
              </p>
            </div>

            <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm space-y-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-sky-500" />
                <h3 className="font-bold text-sm text-foreground">📮 投递信息确认</h3>
              </div>
              <div className="space-y-2 text-[13px]">
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-muted-foreground">职位</span>
                  <span className="font-semibold text-foreground">{selectedJob.title}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-muted-foreground">公司</span>
                  <span className="font-semibold text-foreground">{selectedJob.company}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-muted-foreground">投递渠道</span>
                  <span className="font-semibold text-foreground">{selectedJob.platform}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-muted-foreground">城市 / 薪资</span>
                  <span className="font-semibold text-foreground">{selectedJob.city} · {selectedJob.salary}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-stone-100">
                  <span className="text-muted-foreground">简历版本</span>
                  <span className="font-semibold text-foreground">优化版</span>
                </div>
                <div className="flex justify-between py-1.5">
                  <span className="text-muted-foreground">投递时间</span>
                  <span className="font-semibold text-foreground">{new Date().toLocaleString('zh-CN')}</span>
                </div>
              </div>
            </div>

            <Button
              onClick={() => { setSelectedJob(null); setResumeCheck(null); setApplied(false); }}
              className="w-full rounded-xl bg-white border border-stone-200 text-foreground font-semibold hover:bg-stone-50"
            >
              选择下一个职位投递
            </Button>
          </div>
        )}

        {/* ===== Apply history ===== */}
        {!selectedJob && history.length > 0 && (
          <div className="rounded-2xl bg-white border border-stone-200 p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-emerald-500" />
              <h3 className="font-bold text-sm text-foreground">投递记录 ({history.length})</h3>
            </div>
            <div className="space-y-2">
              {history.slice(0, 10).map((r, i) => (
                <div key={i} className="flex items-center justify-between py-2 border-b border-stone-100 last:border-0 text-[12px]">
                  <div>
                    <span className="font-semibold text-foreground">{r.job.company}</span>
                    <span className="text-muted-foreground"> · {r.job.title}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <span>{r.channel}</span>
                    <span>{r.appliedAt}</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-semibold">{r.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
