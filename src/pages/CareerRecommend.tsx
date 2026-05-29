import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Sparkles, Target, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import type { CareerReportData } from '@/components/career/CareerReport';

const REPORT_LS_KEY = 'career:report:v1';
export const SELECTED_JOBS_LS_KEY = 'career:selected_jobs:v1';

type StoredReport = { data: CareerReportData; userId: string | null; savedAt: string };

function readReport(): CareerReportData | null {
  try {
    const raw = localStorage.getItem(REPORT_LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredReport;
    return parsed?.data ?? null;
  } catch { return null; }
}

export default function CareerRecommend() {
  const navigate = useNavigate();
  const [report, setReport] = useState<CareerReportData | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const { markDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  useEffect(() => {
    setReport(readReport());
    // 预选已保存的
    try {
      const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
      if (raw) {
        const arr = JSON.parse(raw) as { title: string }[];
        const titles = new Set(arr.map(j => j.title));
        const rep = readReport();
        if (rep) {
          const idxs = rep.recommendations.map((r, i) => titles.has(r.title) ? i : -1).filter(i => i >= 0);
          setSelected(new Set(idxs));
        }
      }
    } catch { /* ignore */ }
  }, []);

  const jobs = report?.recommendations ?? [];

  const toggle = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i); else next.add(i);
      return next;
    });
  };

  const handleNext = () => {
    if (selected.size === 0 || !report) return;
    const picked = Array.from(selected).sort().map(i => report.recommendations[i]);
    try {
      localStorage.setItem(SELECTED_JOBS_LS_KEY, JSON.stringify(picked.map(p => ({
        title: p.title,
        category: p.category,
        skills: p.skills,
        reasons: p.reasons,
        path: p.path,
        salary: p.salary,
        outlook: p.outlook,
        match: p.match,
      }))));
    } catch { /* quota */ }
    markDone('recommend');
    onStageCompleted('recommend');
    setTimeout(() => navigate('/career/jd'), 400);
  };

  if (!report) {
    return (
      <div className="map-aurora min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100">
        <header className="sticky top-0 z-20 border-b border-white/40 backdrop-blur-2xl bg-white/65 px-4 py-3 flex items-center gap-3">
          <Link to="/" className="shrink-0 w-9 h-9 rounded-2xl hover:bg-emerald-100/70 flex items-center justify-center transition-colors" title="返回闯关地图">
            <ArrowLeft className="w-4 h-4 text-emerald-700" />
          </Link>
          <div className="min-w-0 flex-1">
            <h1 className="text-sm sm:text-base font-bold leading-tight aurora-text">第一章 · 第 2 关 · 岗位推荐</h1>
            <p className="text-[11px] text-muted-foreground truncate">🎯 还没有测评报告？先选一个目标岗位也能继续闯关</p>
          </div>
        </header>
        <main className="max-w-2xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <div className="rounded-2xl border border-amber-200/70 bg-amber-50/70 backdrop-blur-sm p-4 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="min-w-0 text-sm leading-relaxed">
              <p className="font-semibold text-amber-900">你跳过了第 1 关，还没有职业规划报告</p>
              <p className="text-amber-800/80 text-xs mt-1">
                可以在下面直接挑一个想冲的岗位继续闯关；或者
                <Link to="/career" className="text-emerald-700 font-semibold hover:underline mx-1">去做测评</Link>
                得到更精准的推荐。
              </p>
            </div>
          </div>
          <JobPrereqInline
            title="先告诉我，你想冲哪个岗位？"
            subtitle="选一个目标方向，第 2 关就算通关，可以进入下一步。"
            onSaved={() => {
              markDone('recommend');
              onStageCompleted('recommend');
              setTimeout(() => navigate('/career/jd'), 600);
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="map-aurora min-h-screen bg-gradient-to-b from-sky-100 via-emerald-50 to-teal-100">
      {/* Header */}
      <header className="sticky top-0 z-20 border-b border-white/40 backdrop-blur-2xl bg-white/65 px-4 py-3 flex items-center gap-3">
        <Link to="/" className="shrink-0 w-9 h-9 rounded-2xl hover:bg-emerald-100/70 flex items-center justify-center transition-colors" title="返回闯关地图">
          <ArrowLeft className="w-4 h-4 text-emerald-700" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-sm sm:text-base font-bold leading-tight aurora-text">第一章 · 第 2 关 · 岗位推荐</h1>
          <p className="text-[11px] text-muted-foreground truncate">🎯 基于你的职业规划报告 · 勾选你感兴趣的岗位（可多选）</p>
        </div>
        <div className="shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-emerald-100/80 text-emerald-700 font-semibold">已选 {selected.size}/{jobs.length}</div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-32 space-y-4">
        {/* 你的画像 mini 卡 */}
        <div className="rounded-2xl border border-emerald-200/60 bg-white/80 backdrop-blur-sm p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-200 to-teal-200 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-emerald-700" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs text-muted-foreground">你的画像</p>
            <p className="text-sm font-semibold truncate">
              {report.personality.type}
              <span className="text-muted-foreground font-normal ml-2">· 优势：{report.analysis.strengths.slice(0, 3).join('、')}</span>
            </p>
          </div>
        </div>

        {/* 岗位卡列表 */}
        <div className="space-y-3">
          {jobs.map((job, i) => {
            const isSelected = selected.has(i);
            return (
              <button
                key={i}
                onClick={() => toggle(i)}
                className={cn(
                  'w-full text-left rounded-2xl border-2 transition-all duration-200 backdrop-blur-sm p-5 group',
                  isSelected
                    ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-teal-50 shadow-[0_12px_30px_-12px_rgba(16,185,129,0.45)]'
                    : 'border-white/70 bg-white/80 hover:border-emerald-300 hover:shadow-md'
                )}
              >
                <div className="flex items-start gap-3">
                  <div className={cn(
                    'shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center mt-0.5 transition-all',
                    isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-muted-foreground/30 bg-background group-hover:border-emerald-400'
                  )}>
                    {isSelected && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-bold text-foreground">{job.title}</h3>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-[11px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">{job.category}</span>
                          <span className="text-[11px] text-muted-foreground">💰 {job.salary}</span>
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        <div className="text-xl font-bold bg-gradient-to-r from-emerald-500 to-teal-500 bg-clip-text text-transparent">{job.match}%</div>
                        <div className="text-[10px] text-muted-foreground">匹配度</div>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      <span className="font-medium text-foreground">推荐理由：</span>{job.reasons.join('；')}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills.map((s, j) => (
                        <span key={j} className="text-[11px] px-2 py-0.5 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">{s}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </main>

      {/* 底部 CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-20 px-4 py-3 backdrop-blur-2xl bg-white/75 border-t border-white/40">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <div className="flex-1 text-xs text-muted-foreground">
            {selected.size === 0 ? '至少选择 1 个感兴趣的岗位继续' : `已选 ${selected.size} 个岗位，下一关将为这些方向汇集 JD 与项目要求`}
          </div>
          <Button
            onClick={handleNext}
            disabled={selected.size === 0}
            className="shrink-0 rounded-2xl px-5 h-11 bg-gradient-to-r from-emerald-400 via-teal-500 to-cyan-500 text-white font-bold shadow-[0_10px_28px_-10px_rgba(16,185,129,0.55)] hover:opacity-95 disabled:opacity-40"
          >
            <Target className="w-4 h-4 mr-1.5" />
            下一关 · JD 汇总
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
}
