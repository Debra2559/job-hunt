import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, BookOpen, MessageCircle, Wand2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ASSISTANTS, type Assistant } from '@/data/assistants';
import { useAssistant } from '@/hooks/useAssistant';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { SELECTED_JOBS_LS_KEY } from './CareerRecommend';
import JobPrereqInline from '@/components/career/JobPrereqInline';

type PickedJob = { title: string; category?: string; skills?: string[] };

function readSelectedJobs(): PickedJob[] {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

const KEYWORD_MAP: Array<{ id: string; keywords: string[] }> = [
  { id: 'pm',        keywords: ['产品经理', '产品', 'PM', 'product'] },
  { id: 'frontend',  keywords: ['前端', 'frontend', 'react', 'vue', 'web', '客户端', '工程师', '研发', '开发'] },
  { id: 'data',      keywords: ['数据分析', '数据', '分析师', 'data', 'analyst', 'bi'] },
  { id: 'operator',  keywords: ['运营', '增长', 'operation', 'growth', '内容', '社群', '用户运营'] },
  { id: 'marketing', keywords: ['市场', '品牌', '营销', 'marketing', 'brand', '公关', 'pr'] },
  { id: 'hr',        keywords: ['hr', '人力', '招聘', 'hrbp', '人事', '组织'] },
  { id: 'designer',  keywords: ['设计', 'ui', 'ux', 'designer', '视觉', '交互'] },
  { id: 'finance',   keywords: ['财务', '金融', '投行', '会计', 'cfa', 'cpa', '券商', '基金', '投资', 'finance'] },
];

function matchAssistantId(jobs: PickedJob[]): string | null {
  if (jobs.length === 0) return null;
  const haystack = jobs
    .flatMap(j => [j.title, j.category, ...(j.skills || [])])
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  let best: { id: string; score: number } | null = null;
  for (const row of KEYWORD_MAP) {
    let score = 0;
    for (const kw of row.keywords) {
      if (haystack.includes(kw.toLowerCase())) score += 1;
    }
    if (score > 0 && (!best || score > best.score)) best = { id: row.id, score };
  }
  return best?.id ?? null;
}

export default function AssistantHub() {
  const navigate = useNavigate();
  const { assistant: claimed, claim, release } = useAssistant();
  const { markDone, completed } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  const [jobs] = useState<PickedJob[]>(() => readSelectedJobs());
  const recommendedId = useMemo(() => matchAssistantId(jobs), [jobs]);
  const recommended: Assistant | null = recommendedId ? (ASSISTANTS.find(a => a.id === recommendedId) || null) : null;

  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview: Assistant | null = previewId
    ? ASSISTANTS.find(a => a.id === previewId) || null
    : (claimed || recommended || ASSISTANTS[0]);

  useEffect(() => {
    if (claimed && !completed.includes('claim_assistant')) {
      markDone('claim_assistant');
      onStageCompleted('claim_assistant');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claimed]);

  const handleClaim = (id: string) => {
    claim(id);
    const a = ASSISTANTS.find(x => x.id === id)!;
    markDone('claim_assistant');
    onStageCompleted('claim_assistant');
    toast({
      title: `已认领 ${a.name}`,
      description: `${a.role}已悬浮在右下角，随时可以聊。`,
    });
  };

  const isClaimed = (id: string) => claimed?.id === id;
  const others = ASSISTANTS.filter(a => a.id !== recommended?.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f7f6f1]">
      {/* 极淡的中性氛围光斑 */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[10%] -left-16 w-72 h-72 rounded-full bg-emerald-100/40 blur-3xl" />
        <div className="absolute bottom-[15%] -right-20 w-80 h-80 rounded-full bg-stone-200/50 blur-3xl" />
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-[#f7f6f1]/85 border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/career/map"
            className="w-9 h-9 rounded-xl bg-white border border-stone-200 flex items-center justify-center shadow-sm hover:bg-stone-50 transition-colors"
            aria-label="返回"
          >
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-700 shadow-sm">
            <Sparkles className="w-5 h-5 text-white" strokeWidth={2.2} />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-semibold leading-tight text-foreground">认领你的专属 AI 助理</h1>
            <p className="text-[11px] text-muted-foreground mt-0.5">已根据你选的岗位匹配好一位，一键认领即可</p>
          </div>
          {claimed && (
            <button
              onClick={() => { release(); toast({ title: '已释放', description: '可以重新挑一个' }); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-stone-200 text-muted-foreground hover:text-foreground hover:bg-stone-50 transition-colors"
            >
              释放
            </button>
          )}
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-3 sm:px-6 py-5 sm:py-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-5 sm:gap-6">
        <section>
          {/* ===== 推荐区 ===== */}
          {recommended ? (
            <div className="relative rounded-3xl p-6 mb-6 overflow-hidden bg-white border border-stone-200 shadow-[0_18px_40px_-22px_rgba(4,120,87,0.25)]">
              {/* 左侧墨绿色品牌色条 */}
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-700" />
              <div className="absolute -top-12 -right-12 text-[160px] leading-none opacity-[0.06] select-none pointer-events-none">{recommended.emoji}</div>

              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-semibold mb-4 border border-emerald-100">
                  <Wand2 className="w-3 h-3" strokeWidth={2.4} />
                  根据「{jobs[0]?.title || '岗位'}{jobs.length > 1 ? ` 等 ${jobs.length} 个方向` : ''}」匹配
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-stone-50 border border-stone-200 flex items-center justify-center text-3xl shrink-0">
                    {recommended.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-bold text-xl leading-tight text-foreground">{recommended.name}</h2>
                    <p className="text-[12px] text-muted-foreground font-medium mt-0.5">{recommended.role} · 你的专属 AI 学长</p>
                    <p className="text-[13px] mt-2 text-foreground/80 line-clamp-2 leading-relaxed">{recommended.tagline}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-4">
                  {recommended.expertise.slice(0, 4).map(e => (
                    <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-stone-100 text-foreground/70 font-medium">{e}</span>
                  ))}
                </div>
                <Button
                  onClick={() => handleClaim(recommended.id)}
                  disabled={isClaimed(recommended.id)}
                  className={cn(
                    'mt-5 w-full h-11 rounded-2xl font-semibold bg-emerald-700 hover:bg-emerald-800 text-white shadow-sm',
                    isClaimed(recommended.id) && 'opacity-80',
                  )}
                >
                  {isClaimed(recommended.id) ? (
                    <><Check className="w-4 h-4 mr-1" strokeWidth={3} /> 已认领，去右下角找它</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-1" /> 一键认领 {recommended.name}</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <JobPrereqInline
                gradient="from-emerald-600 to-emerald-800"
                title="先告诉我你想冲哪个岗位？"
                subtitle="选一个目标，立刻给你匹配一位最对口的 AI 学长。"
                onSaved={() => window.location.reload()}
              />
            </div>
          )}

          {/* ===== 其他方向 ===== */}
          <div className="flex items-center gap-3 mb-3 mt-1">
            <h3 className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground uppercase">
              {recommended ? '其他方向也可以认领' : '所有 AI 学长'}
            </h3>
            <div className="flex-1 h-px bg-stone-200" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(recommended ? others : ASSISTANTS).map((a) => {
              const active = (preview?.id === a.id);
              const claimedThis = isClaimed(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setPreviewId(a.id)}
                  className={cn(
                    'group text-left rounded-2xl p-4 transition-all bg-white relative overflow-hidden',
                    'border hover:-translate-y-0.5 hover:shadow-md',
                    active
                      ? 'border-emerald-600 shadow-[0_8px_24px_-12px_rgba(4,120,87,0.4)]'
                      : 'border-stone-200 shadow-sm',
                  )}
                >
                  {claimedThis && (
                    <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-700 text-white font-semibold inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> 已认领
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-stone-50 border border-stone-200">
                      {a.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-sm leading-tight truncate text-foreground">
                        {a.name}
                        <span className="text-[11px] font-normal text-muted-foreground ml-1">· {a.role}</span>
                      </h3>
                      <p className="text-[11px] text-foreground/65 mt-1 line-clamp-2 leading-relaxed">{a.tagline}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.expertise.slice(0, 2).map((e) => (
                          <span key={e} className="text-[10px] px-1.5 py-0.5 rounded-full bg-stone-100 text-foreground/65">{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== 详情面板 ===== */}
        {preview && (
          <aside className="lg:sticky lg:top-[80px] self-start h-fit rounded-3xl bg-white border border-stone-200 shadow-[0_18px_40px_-22px_rgba(0,0,0,0.15)] overflow-hidden">
            <div className="p-5 bg-emerald-900 text-white relative overflow-hidden">
              <div className="absolute -bottom-8 -right-6 text-[110px] leading-none opacity-[0.08] select-none pointer-events-none">{preview.emoji}</div>
              <div className="relative flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur flex items-center justify-center text-3xl">
                  {preview.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-xl leading-tight">{preview.name}</h3>
                  <p className="text-[12px] opacity-80 font-medium mt-0.5">{preview.role}</p>
                </div>
              </div>
              <p className="relative text-[13px] mt-3 leading-relaxed opacity-90">{preview.tagline}</p>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h4 className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground mb-2 uppercase">擅长领域</h4>
                <div className="flex flex-wrap gap-1.5">
                  {preview.expertise.map((e) => (
                    <span key={e} className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100 font-medium">{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground mb-2 uppercase inline-flex items-center gap-1.5">
                  <BookOpen className="w-3 h-3" /> 投喂的素材
                </h4>
                <ul className="space-y-1.5">
                  {preview.sources.map((s) => (
                    <li key={s} className="text-[12px] text-foreground/75 flex gap-2 leading-relaxed">
                      <span className="text-emerald-600 shrink-0 mt-0.5">·</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-semibold tracking-[0.22em] text-muted-foreground mb-2 uppercase inline-flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" /> 可以这样开聊
                </h4>
                <div className="space-y-1.5">
                  {preview.starterPrompts.slice(0, 3).map((p) => (
                    <div key={p} className="text-[12px] text-foreground/80 px-3 py-2 rounded-xl bg-stone-50 border border-stone-200 leading-relaxed">
                      {p}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleClaim(preview.id)}
                disabled={isClaimed(preview.id)}
                className={cn(
                  'w-full h-11 rounded-2xl font-semibold text-white shadow-sm bg-emerald-700 hover:bg-emerald-800',
                  isClaimed(preview.id) && 'opacity-60 cursor-not-allowed',
                )}
              >
                {isClaimed(preview.id) ? <><Check className="w-4 h-4 mr-1" strokeWidth={3} /> 已认领，去右下角找它</> : <><Sparkles className="w-4 h-4 mr-1" /> 认领 {preview.name}</>}
              </Button>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
