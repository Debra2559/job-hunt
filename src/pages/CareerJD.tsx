import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, AlertCircle, ExternalLink, Briefcase, ScrollText, Sparkles, Clock, ThumbsUp, ThumbsDown, MessageCircle, Video, Image as ImageIcon, Loader2, RefreshCcw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { SELECTED_JOBS_LS_KEY } from './CareerRecommend';
import { supabase } from '@/integrations/supabase/client';

type PickedJob = {
  title: string;
  category: string;
  skills: string[];
  reasons: string[];
  path: string;
  salary: string;
  outlook: string;
  match: number;
};

function readPicked(): PickedJob[] {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

const PLATFORMS = [
  { name: 'Boss直聘', color: 'bg-[#00beab]/10 text-[#00a89d] border-[#00beab]/30 hover:bg-[#00beab]/20', build: (q: string) => `https://www.zhipin.com/web/geek/job?query=${encodeURIComponent(q)}` },
  { name: '猎聘', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', build: (q: string) => `https://www.liepin.com/zhaopin/?key=${encodeURIComponent(q)}` },
  { name: '拉勾', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', build: (q: string) => `https://www.lagou.com/wn/jobs?kd=${encodeURIComponent(q)}` },
  { name: '智联招聘', color: 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100', build: (q: string) => `https://sou.zhaopin.com/?kw=${encodeURIComponent(q)}` },
];

// 社媒「岗位日常 / 评价 / 视频图片」召回入口
const SOCIAL = [
  { name: '小红书', emoji: '📕', desc: '真实日常 & 吐槽', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100', build: (q: string) => `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q + ' 日常')}` },
  { name: 'B站', emoji: '📺', desc: '工作 Vlog & 拆解', color: 'bg-sky-50 text-sky-700 border-sky-200 hover:bg-sky-100', build: (q: string) => `https://search.bilibili.com/all?keyword=${encodeURIComponent(q + ' 一天')}` },
  { name: '知乎', emoji: '💡', desc: '深度问答 & 经验', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100', build: (q: string) => `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(q + ' 是什么样的体验')}` },
  { name: '抖音', emoji: '🎵', desc: '短视频职场', color: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200 hover:bg-fuchsia-100', build: (q: string) => `https://www.douyin.com/search/${encodeURIComponent(q + ' 日常')}` },
  { name: '脉脉', emoji: '🪪', desc: '在职员工真实声音', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100', build: (q: string) => `https://maimai.cn/web/search_center?type=feed&query=${encodeURIComponent(q)}` },
  { name: '微博', emoji: '🌐', desc: '行业热点 & 风评', color: 'bg-orange-50 text-orange-700 border-orange-200 hover:bg-orange-100', build: (q: string) => `https://s.weibo.com/weibo?q=${encodeURIComponent(q)}` },
];

type JobInsight = {
  tagline?: string;
  dailyRoutine?: { time: string; activity: string }[];
  pros?: string[];
  cons?: string[];
  voices?: { platform: string; quote: string; stance: '正面' | '中性' | '反面' }[];
  growthMyth?: string;
  hashtags?: string[];
};

const INSIGHT_LS_PREFIX = 'career:insight:v1:';

export default function CareerJD() {
  const [picked, setPicked] = useState<PickedJob[]>([]);
  const [activeIdx, setActiveIdx] = useState(0);
  const [viewedJobs, setViewedJobs] = useState<Set<number>>(new Set([0]));
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();
  const [completed, setCompleted] = useState(false);
  const [insights, setInsights] = useState<Record<string, JobInsight>>({});
  const [insightLoading, setInsightLoading] = useState<Record<string, boolean>>({});
  const [insightError, setInsightError] = useState<Record<string, string>>({});

  useEffect(() => {
    setPicked(readPicked());
    setCompleted(isDone('jd'));
  }, [isDone]);

  const active = picked[activeIdx];

  // 拉取当前岗位的"岗位画像"（带 localStorage 缓存）
  useEffect(() => {
    if (!active) return;
    const key = active.title;
    if (insights[key] || insightLoading[key]) return;
    const cacheKey = INSIGHT_LS_PREFIX + key;
    try {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        setInsights(prev => ({ ...prev, [key]: JSON.parse(cached) }));
        return;
      }
    } catch { /* noop */ }
    fetchInsight(key, { category: active.category, skills: active.skills });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.title]);

  const fetchInsight = async (title: string, ctx: { category?: string; skills?: string[] }, force = false) => {
    setInsightLoading(prev => ({ ...prev, [title]: true }));
    setInsightError(prev => ({ ...prev, [title]: '' }));
    try {
      if (force) {
        try { localStorage.removeItem(INSIGHT_LS_PREFIX + title); } catch { /* noop */ }
      }
      const { data, error } = await supabase.functions.invoke('job-insights', {
        body: { title, category: ctx.category, skills: ctx.skills },
      });
      if (error) throw error;
      const insight = (data as { insight?: JobInsight })?.insight || {};
      setInsights(prev => ({ ...prev, [title]: insight }));
      try { localStorage.setItem(INSIGHT_LS_PREFIX + title, JSON.stringify(insight)); } catch { /* noop */ }
    } catch (e) {
      setInsightError(prev => ({ ...prev, [title]: (e as Error).message || '加载失败' }));
    } finally {
      setInsightLoading(prev => ({ ...prev, [title]: false }));
    }
  };


  const handleSelectJob = (i: number) => {
    setActiveIdx(i);
    setViewedJobs(prev => new Set(prev).add(i));
  };

  const canComplete = picked.length > 0 && viewedJobs.size >= picked.length && !completed;

  const handleComplete = () => {
    if (completed) return;
    markDone('jd');
    onStageCompleted('jd');
    setCompleted(true);
  };

  if (picked.length === 0) {
    return (
      <div className="map-aurora min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white/85 backdrop-blur-xl rounded-3xl border border-white/60 shadow-[0_24px_60px_-20px_rgba(16,185,129,0.35)] p-8 text-center space-y-4">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 flex items-center justify-center">
            <AlertCircle className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-lg font-bold">还没选过感兴趣的岗位</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">先去第 2 关「岗位推荐」挑选 1 个或多个你感兴趣的方向，再回来查看真实在招与项目要求。</p>
          <Link to="/career/recommend" className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-2xl bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white font-semibold shadow-[0_10px_28px_-10px_rgba(16,185,129,0.55)]">
            去挑选岗位 <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="map-aurora min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100">
      <header className="sticky top-0 z-20 border-b border-white/40 backdrop-blur-2xl bg-white/65 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="shrink-0 w-9 h-9 rounded-2xl hover:bg-emerald-100/70 flex items-center justify-center transition-colors" title="返回闯关地图">
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-bold leading-tight aurora-text">第一章 · 第 3 关 · 岗位 JD 汇总</h1>
          <p className="text-[11px] text-muted-foreground truncate">🔍 为你勾选的 {picked.length} 个岗位汇集真实在招、技能与项目要求</p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6 pb-32">
        {/* 岗位 Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-hide -mx-1 px-1">
          {picked.map((j, i) => {
            const isActive = i === activeIdx;
            const isViewed = viewedJobs.has(i);
            return (
              <button
                key={i}
                onClick={() => handleSelectJob(i)}
                className={cn(
                  'shrink-0 px-4 py-2 rounded-2xl text-sm font-semibold border-2 transition-all whitespace-nowrap',
                  isActive
                    ? 'bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white border-transparent shadow-[0_8px_22px_-8px_rgba(16,185,129,0.55)]'
                    : 'bg-white/80 text-foreground border-white/70 hover:border-emerald-300'
                )}
              >
                {isViewed && !isActive && <span className="mr-1 text-emerald-500">✓</span>}
                {j.title}
              </button>
            );
          })}
        </div>

        {active && (
          <div className="space-y-4 mt-2 animate-fade-in" key={activeIdx}>
            {/* 岗位概览 */}
            <div className="rounded-2xl border border-emerald-200/60 bg-white/85 backdrop-blur-sm p-5 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="text-lg font-bold">{active.title}</h2>
                  <div className="flex flex-wrap items-center gap-2 mt-1.5">
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{active.category}</span>
                    <span className="text-[11px] text-muted-foreground">💰 {active.salary}</span>
                    <span className="text-[11px] text-muted-foreground">📈 {active.outlook}</span>
                  </div>
                </div>
                <div className="shrink-0 text-right">
                  <div className="text-2xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{active.match}%</div>
                  <div className="text-[10px] text-muted-foreground">与你的匹配</div>
                </div>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">为什么适合你：</span>{active.reasons.join('；')}
              </p>
            </div>

            {/* 真实在招 */}
            <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 flex items-center justify-center">
                  <Briefcase className="w-4 h-4 text-emerald-700" />
                </div>
                <h3 className="font-bold">真实在招 · 一键跳转</h3>
              </div>
              <p className="text-xs text-muted-foreground">点击主流招聘平台直达搜索结果，看真实薪资、要求与公司</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {PLATFORMS.map(p => (
                  <a
                    key={p.name}
                    href={p.build(active.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors', p.color)}
                  >
                    <span className="truncate">{p.name}</span>
                    <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-1" />
                  </a>
                ))}
              </div>
            </div>

            {/* 岗位画像（AI 生成：一天日常 + 网友声音 + 爽点/累点） */}
            <JobInsightCard
              title={active.title}
              insight={insights[active.title]}
              loading={!!insightLoading[active.title]}
              error={insightError[active.title]}
              onRetry={() => fetchInsight(active.title, { category: active.category, skills: active.skills }, true)}
            />

            {/* 去社媒看真实日常 / 视频 / 图片 */}
            <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur-sm p-5 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-100 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-rose-600" />
                </div>
                <h3 className="font-bold">去社媒看真实日常</h3>
              </div>
              <p className="text-xs text-muted-foreground">小红书的吐槽、B站的 Vlog、知乎的深度问答、抖音短视频…一键带话题搜索</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {SOCIAL.map(s => (
                  <a
                    key={s.name}
                    href={s.build(active.title)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn('group flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-semibold transition-colors', s.color)}
                  >
                    <span className="text-lg leading-none">{s.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1">
                        <span className="truncate">{s.name}</span>
                        <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                      </div>
                      <div className="text-[10px] font-normal opacity-75 truncate">{s.desc}</div>
                    </div>
                  </a>
                ))}
              </div>

              {/* 视频 / 图片专项搜索 */}
              <div className="pt-1 grid grid-cols-2 gap-2">
                <a
                  href={`https://search.bilibili.com/video?keyword=${encodeURIComponent(active.title + ' 工作日常')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-sky-500/10 text-sky-700 border border-sky-300/40 hover:bg-sky-500/15"
                >
                  <Video className="w-3.5 h-3.5" /> 视频：B站「{active.title} 工作日常」
                </a>
                <a
                  href={`https://image.baidu.com/search/index?tn=baiduimage&word=${encodeURIComponent(active.title + ' 工作环境')}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-emerald-500/10 text-emerald-700 border border-emerald-300/40 hover:bg-emerald-500/15"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> 图片：「{active.title} 工作环境」
                </a>
              </div>

              {insights[active.title]?.hashtags && insights[active.title]!.hashtags!.length > 0 && (
                <div className="pt-1">
                  <p className="text-[11px] text-muted-foreground mb-1.5">💡 推荐搜索话题</p>
                  <div className="flex flex-wrap gap-1.5">
                    {insights[active.title]!.hashtags!.map((h, i) => (
                      <a
                        key={i}
                        href={`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(h)}`}
                        target="_blank" rel="noopener noreferrer"
                        className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                      >
                        #{h}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur-sm p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center">
                  <ScrollText className="w-4 h-4 text-sky-700" />
                </div>
                <h3 className="font-bold">关键技能 & 项目要求</h3>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">📚 必备技能栈</p>
                <div className="flex flex-wrap gap-1.5">
                  {active.skills.map((s, i) => (
                    <span key={i} className="text-xs px-2.5 py-1 rounded-xl bg-sky-50 text-sky-700 border border-sky-200">{s}</span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">🛠️ 在校期间值得做的项目方向</p>
                <ul className="space-y-1.5">
                  {buildProjectIdeas(active).map((p, i) => (
                    <li key={i} className="text-sm text-foreground flex items-start gap-2">
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground mb-2">🛤️ 成长路径建议</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{active.path}</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* 底部完成 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 backdrop-blur-2xl bg-white/75 border-t border-white/40">
        <div className="max-w-5xl mx-auto flex items-center gap-3">
          <div className="flex-1 text-xs text-muted-foreground">
            {completed
              ? '🎉 第一章已通关，去看看第二章的准备清单'
              : canComplete
                ? '已查看全部岗位，可以完成本关'
                : `已查看 ${viewedJobs.size}/${picked.length} 个岗位，逐个看完即可通关`}
          </div>
          {completed ? (
            <Link
              to="/?next=ch2"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white font-bold shadow-[0_10px_28px_-10px_rgba(16,185,129,0.55)] hover:opacity-95"
            >
              <Sparkles className="w-4 h-4" />
              进入第二章 · 准备出发
              <ArrowRight className="w-4 h-4" />
            </Link>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!canComplete}
              className="shrink-0 rounded-2xl px-5 h-11 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white font-bold shadow-[0_10px_28px_-10px_rgba(16,185,129,0.55)] hover:opacity-95 disabled:opacity-40"
            >
              完成第 3 关 · 通关第一章
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function buildProjectIdeas(job: PickedJob): string[] {
  const t = job.title;
  const skills = job.skills.slice(0, 3).join(' / ');
  return [
    `围绕「${t}」选择 1-2 个完整的端到端项目，覆盖${skills}等核心技能`,
    `结合所在专业课程作业升级为可展示作品，写清楚问题、方案、结果与数据`,
    `参与开源、竞赛或校企合作项目，积累 1 段可量化成果的实践经历`,
    `准备一份 STAR 法则故事卡，匹配 JD 中常见的 3-5 条任职要求`,
  ];
}
