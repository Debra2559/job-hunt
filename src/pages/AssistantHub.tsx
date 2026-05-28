import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, BookOpen, MessageCircle, Wand2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ASSISTANTS, type Assistant } from '@/data/assistants';
import { useAssistant } from '@/hooks/useAssistant';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { SELECTED_JOBS_LS_KEY } from './CareerRecommend';

type PickedJob = { title: string; category?: string; skills?: string[] };

function readSelectedJobs(): PickedJob[] {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

// 关键词 → 助理 id 的匹配表，按优先级判断
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
  // 计数得分，取得分最高的
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

  // 已认领过则自动完成关卡（兼容老用户）
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
      title: `✨ 已认领 ${a.name}`,
      description: `${a.role}已悬浮在右下角，随时可以聊。`,
    });
  };

  const isClaimed = (id: string) => claimed?.id === id;
  const others = ASSISTANTS.filter(a => a.id !== recommended?.id);

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-violet-50 via-fuchsia-50 to-rose-50">
      {/* deco */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[6%] left-[8%] text-3xl opacity-30">✨</div>
        <div className="absolute top-[14%] right-[12%] text-4xl opacity-25">📚</div>
        <div className="absolute bottom-[10%] right-[8%] text-3xl opacity-25">🪄</div>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/65 border-b border-white/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/career/map" className="w-9 h-9 rounded-xl bg-white/80 border border-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 shadow-lg">
            <span className="drop-shadow-sm">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold leading-tight">认领你的专属 AI 助理</h1>
            <p className="text-[11px] text-muted-foreground">已根据你选的岗位匹配好一位，一键认领即可</p>
          </div>
          {claimed && (
            <button
              onClick={() => { release(); toast({ title: '已释放', description: '可以重新挑一个' }); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              释放
            </button>
          )}
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        <section>
          {/* ===== 推荐区：根据已选岗位匹配 ===== */}
          {recommended ? (
            <div className={cn(
              'relative rounded-3xl p-5 mb-5 text-white overflow-hidden shadow-xl bg-gradient-to-br',
              recommended.gradient,
            )}>
              <div className="absolute -top-8 -right-8 text-[120px] opacity-15 select-none">{recommended.emoji}</div>
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/25 backdrop-blur text-[11px] font-bold mb-3">
                  <Wand2 className="w-3 h-3" /> 已根据你选的「{jobs[0]?.title || '岗位'}{jobs.length > 1 ? ` 等 ${jobs.length} 个方向` : ''}」匹配
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-16 h-16 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-3xl shadow-inner shrink-0">
                    {recommended.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="font-extrabold text-xl leading-tight">{recommended.name}</h2>
                    <p className="text-[12px] opacity-95 font-semibold">{recommended.role} · 你的专属 AI 学长</p>
                    <p className="text-[12px] mt-1 opacity-95 line-clamp-2 leading-relaxed">{recommended.tagline}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {recommended.expertise.slice(0, 4).map(e => (
                    <span key={e} className="text-[11px] px-2 py-0.5 rounded-full bg-white/20 backdrop-blur font-medium">{e}</span>
                  ))}
                </div>
                <Button
                  onClick={() => handleClaim(recommended.id)}
                  disabled={isClaimed(recommended.id)}
                  className={cn(
                    'mt-4 w-full h-11 rounded-2xl font-bold bg-white text-foreground hover:bg-white/90 shadow-lg',
                    isClaimed(recommended.id) && 'opacity-80',
                  )}
                >
                  {isClaimed(recommended.id) ? (
                    <><Check className="w-4 h-4 mr-1" /> 已认领，去右下角找它</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-1" /> 一键认领 {recommended.name}</>
                  )}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-5">
              <JobPrereqInline
                gradient="from-violet-400 via-purple-500 to-fuchsia-500"
                title="先告诉我你想冲哪个岗位？"
                subtitle="选一个目标，立刻给你匹配一位最对口的 AI 学长。"
                onSaved={() => window.location.reload()}
              />
            </div>
          )}

          {/* ===== 其他方向 ===== */}
          <div className="flex items-center gap-2 mb-2.5 mt-1">
            <h3 className="text-[12px] font-bold tracking-[0.18em] text-muted-foreground uppercase">
              {recommended ? '其他方向也可以认领' : '所有 AI 学长'}
            </h3>
            <div className="flex-1 h-px bg-border/60" />
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
                    'group text-left rounded-2xl p-4 transition-all border-2 relative overflow-hidden',
                    'bg-white/90 backdrop-blur shadow-sm hover:-translate-y-0.5 hover:shadow-md',
                    active ? 'border-violet-400 ring-2 ring-violet-200' : 'border-white/80',
                  )}
                >
                  {claimedThis && (
                    <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600 text-white font-bold inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> 已认领
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br shadow-lg', a.gradient)}>
                      <span className="drop-shadow-sm">{a.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight truncate">{a.name} <span className="text-[11px] font-normal text-muted-foreground">· {a.role}</span></h3>
                      <p className="text-[11px] text-foreground/75 mt-1 line-clamp-2 leading-relaxed">{a.tagline}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.expertise.slice(0, 2).map((e) => (
                          <span key={e} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/70 text-foreground/70">{e}</span>
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
          <aside className="lg:sticky lg:top-[80px] self-start h-fit rounded-3xl bg-white/90 backdrop-blur border border-white/70 shadow-xl overflow-hidden">
            <div className={cn('p-5 text-white bg-gradient-to-br', preview.gradient)}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-3xl shadow-inner">
                  {preview.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xl leading-tight">{preview.name}</h3>
                  <p className="text-[12px] opacity-90 font-semibold">{preview.role}</p>
                </div>
              </div>
              <p className="text-[13px] mt-3 leading-relaxed opacity-95">{preview.tagline}</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-1.5">擅长领域</h4>
                <div className="flex flex-wrap gap-1.5">
                  {preview.expertise.map((e) => (
                    <span key={e} className="text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium">{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-1.5 inline-flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> 投喂的素材
                </h4>
                <ul className="space-y-1">
                  {preview.sources.map((s) => (
                    <li key={s} className="text-[12px] text-foreground/75 flex gap-1.5">
                      <span className="text-violet-400 shrink-0">·</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-1.5 inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> 可以这样开聊
                </h4>
                <div className="space-y-1.5">
                  {preview.starterPrompts.slice(0, 3).map((p) => (
                    <div key={p} className="text-[12px] text-foreground/80 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border/40 leading-relaxed">
                      💬 {p}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleClaim(preview.id)}
                disabled={isClaimed(preview.id)}
                className={cn(
                  'w-full h-11 rounded-2xl font-bold text-white shadow-lg bg-gradient-to-r',
                  preview.gradient,
                  isClaimed(preview.id) && 'opacity-60 cursor-not-allowed',
                )}
              >
                {isClaimed(preview.id) ? <><Check className="w-4 h-4 mr-1" /> 已认领，去右下角找它</> : <><Sparkles className="w-4 h-4 mr-1" /> 认领 {preview.name}</>}
              </Button>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
