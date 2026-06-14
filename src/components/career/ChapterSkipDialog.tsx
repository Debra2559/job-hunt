import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FastForward, Check, AlertTriangle, ChevronLeft, FileText, Route } from 'lucide-react';
import type { ChapterId, SkipPayload } from '@/hooks/useChapterSkip';
import { SELECTED_JOBS_LS_KEY } from '@/pages/CareerRecommend';
import { readResumeWorkspaceState } from '@/lib/resumeWorkspace';

const REPORT_LS_KEY = 'career:report:v1';

type JobOption = {
  title: string;
  category: string;
  emoji?: string;
  skills?: string[];
  reasons?: string[];
  path?: string;
  salary?: string;
  outlook?: string;
  match?: number;
};

const FALLBACK_JOB_OPTIONS: JobOption[] = [
  { title: '产品经理', category: '互联网', emoji: '🧭' },
  { title: '互联网运营', category: '互联网', emoji: '📣' },
  { title: '数据分析师', category: '数据', emoji: '📊' },
  { title: '前端工程师', category: '研发', emoji: '💻' },
  { title: '人力资源 HR', category: 'HR', emoji: '🤝' },
  { title: '市场营销', category: '市场', emoji: '🎯' },
  { title: 'UI / UX 设计', category: '设计', emoji: '🎨' },
  { title: '财务 / 金融', category: '财务', emoji: '💼' },
];

const CITY_PRESETS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '苏州', '远程'];

export type SkipChapterMeta = { id: ChapterId; title: string; emoji: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 需要依次收集材料的章节队列（从前到后）。最后一个一般是目标章节。 */
  chapters: SkipChapterMeta[];
  /** 提交时回传每个章节的材料 */
  onConfirm: (results: Partial<SkipPayload>) => void;
};

type StepState = {
  targetRole: string;
  targetCategory: string;
  customPos: string;
  cities: string[];
  note: string;
  text1: string;
};

const emptyStep = (): StepState => ({ targetRole: '', targetCategory: '', customPos: '', cities: [], note: '', text1: '' });

function normalizeJobOption(raw: any): JobOption | null {
  const title = typeof raw?.title === 'string' ? raw.title.trim() : '';
  if (!title) return null;
  return {
    title,
    category: raw?.category || '自定义',
    emoji: raw?.emoji,
    skills: Array.isArray(raw?.skills) ? raw.skills.filter(Boolean) : [],
    reasons: Array.isArray(raw?.reasons) ? raw.reasons.filter(Boolean) : [],
    path: raw?.path || '',
    salary: raw?.salary || '—',
    outlook: raw?.outlook || '—',
    match: typeof raw?.match === 'number' ? raw.match : 80,
  };
}

function readSelectedJobOptions(): JobOption[] {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    const jobs = raw ? JSON.parse(raw) : [];
    return Array.isArray(jobs) ? jobs.map(normalizeJobOption).filter(Boolean) as JobOption[] : [];
  } catch {
    return [];
  }
}

function readReportJobOptions(): JobOption[] {
  try {
    const raw = localStorage.getItem(REPORT_LS_KEY);
    const stored = raw ? JSON.parse(raw) : null;
    const recs = stored?.data?.recommendations;
    return Array.isArray(recs) ? recs.map(normalizeJobOption).filter(Boolean) as JobOption[] : [];
  } catch {
    return [];
  }
}

function uniqueJobs(jobs: JobOption[]) {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = job.title.trim();
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export default function ChapterSkipDialog({ open, onOpenChange, chapters, onConfirm }: Props) {
  const [stepIdx, setStepIdx] = useState(0);
  // 每个章节一份状态
  const [steps, setSteps] = useState<Record<string, StepState>>({});

  useEffect(() => {
    if (open) {
      setStepIdx(0);
      const init: Record<string, StepState> = {};
      chapters.forEach(c => { init[c.id] = emptyStep(); });
      setSteps(init);
    }
  }, [open, chapters]);

  const current = chapters[stepIdx];
  const total = chapters.length;
  const isLast = stepIdx === total - 1;
  const cur: StepState = (current && steps[current.id]) || emptyStep();
  const selectedJobOptions = useMemo(() => readSelectedJobOptions(), [open]);
  const reportJobOptions = useMemo(() => readReportJobOptions(), [open]);
  const ch1JobOptions = useMemo(
    () => uniqueJobs([...selectedJobOptions, ...reportJobOptions, ...FALLBACK_JOB_OPTIONS]),
    [selectedJobOptions, reportJobOptions],
  );
  const hasAssessmentOptions = reportJobOptions.length > 0;
  const hasResumeWorkspace = useMemo(
    () => current?.id === 'ch2' && Boolean(readResumeWorkspaceState()),
    [current?.id, open],
  );

  const setCur = (patch: Partial<StepState>) => {
    if (!current) return;
    setSteps(prev => ({ ...prev, [current.id]: { ...(prev[current.id] || emptyStep()), ...patch } }));
  };

  const toggle = (list: string[], key: 'cities', v: string) => {
    setCur({ [key]: list.includes(v) ? list.filter(x => x !== v) : [...list, v] } as any);
  };

  const addCustomPos = () => {
    const v = cur.customPos.trim();
    if (!v) return;
    setCur({ targetRole: v, targetCategory: '自定义', customPos: '' });
  };

  const canNext = useMemo(() => {
    if (!current) return false;
    if (current.id === 'ch1') return cur.targetRole.trim().length > 0;
    if (current.id === 'ch2') return hasResumeWorkspace;
    if (current.id === 'ch3') return cur.text1.trim().length >= 5;
    return true;
  }, [current, cur, hasResumeWorkspace]);

  const buildPayload = (chId: ChapterId, s: StepState): any => {
    if (chId === 'ch1') return {
      targetRole: s.targetRole,
      targetCategory: s.targetCategory || '自定义',
      positions: s.targetRole ? [s.targetRole] : [],
      cities: s.cities.length ? s.cities : undefined,
      note: s.note.trim() || undefined,
    };
    if (chId === 'ch2') return { resumeWorkspaceReady: Boolean(readResumeWorkspaceState()) };
    if (chId === 'ch3') return { targetCompanies: s.text1.trim() };
    return {};
  };

  const handleNext = () => {
    if (!canNext) return;
    if (!isLast) {
      setStepIdx(i => i + 1);
      return;
    }
    const results: Partial<SkipPayload> = {};
    chapters.forEach(c => {
      (results as any)[c.id] = buildPayload(c.id, steps[c.id] || emptyStep());
    });
    onConfirm(results);
  };

  if (!current) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl leading-none">{current.emoji}</span>
            <span>
              {current.id === 'ch1'
                ? '先确认你的主目标岗位'
                : current.id === 'ch2'
                  ? '先准备一份简历底稿'
                  : `补充「${current.title}」的关键材料`}
            </span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            {current.id === 'ch1'
              ? '后续简历、面试情报站、自我介绍和题库都会围绕这个岗位生成。你之后可以修改，但现在需要先选一个主方向。'
              : current.id === 'ch2'
                ? '第二章不再让你临时补亮点。后续模块会直接读取简历底稿；如果还没有简历，请先上传旧简历或从 0 创建。'
                : '你正在跳过多个章节，请先依次补齐前面章节的关键产出，AI 会基于这些信息继续推进后续。'}
          </DialogDescription>
        </DialogHeader>

        {/* 步骤指示 */}
        {total > 1 && (
          <div className="flex items-center gap-1.5">
            {chapters.map((c, i) => (
              <div key={c.id} className="flex-1 flex items-center gap-1.5">
                <div className={cn(
                  'flex-1 h-1.5 rounded-full transition-all',
                  i < stepIdx ? 'bg-emerald-500' : i === stepIdx ? 'bg-emerald-300' : 'bg-muted'
                )} />
              </div>
            ))}
            <span className="text-[10px] font-semibold text-muted-foreground tabular-nums shrink-0 ml-1">
              {stepIdx + 1}/{total}
            </span>
          </div>
        )}

        {/* Warning strip */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>跳过的章节会标记为已完成，但不会获得通关 XP / 徽章。</span>
        </div>

        {/* Chapter-specific form */}
        {current.id === 'ch1' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground">主目标岗位 <span className="text-rose-500">*</span> <span className="text-muted-foreground font-normal">（必选 1 个）</span></label>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                后续简历、面试情报站、自我介绍和题库都会围绕这个岗位生成。你之后可以修改，但现在需要先选一个主方向。
              </p>
              <p className="mt-2 text-[11px] font-bold text-emerald-700">
                {hasAssessmentOptions ? '基于你的测评结果推荐' : '先选择一个常见求职方向'}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ch1JobOptions.map(job => {
                  const on = cur.targetRole === job.title;
                  return (
                    <button
                      key={job.title}
                      type="button"
                      onClick={() => setCur({ targetRole: job.title, targetCategory: job.category })}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                        on ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-background border-border hover:border-emerald-300'
                      )}
                    >
                      {on && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                      {job.emoji ? `${job.emoji} ` : ''}{job.title}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-2 mt-2">
                <Input
                  value={cur.customPos}
                  onChange={e => setCur({ customPos: e.target.value })}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomPos(); } }}
                  placeholder="自定义岗位，回车添加"
                  className="h-8 text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCustomPos} disabled={!cur.customPos.trim()}>添加</Button>
              </div>
              {cur.targetRole && !ch1JobOptions.some(job => job.title === cur.targetRole) && (
                <Badge variant="secondary" className="mt-2 text-[10px]">
                  自定义：{cur.targetRole}
                </Badge>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">期望城市 <span className="text-muted-foreground font-normal">（可选）</span></label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {CITY_PRESETS.map(c => {
                  const on = cur.cities.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle(cur.cities, 'cities', c)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                        on ? 'bg-cyan-500 text-white border-cyan-500' : 'bg-background border-border hover:border-cyan-300'
                      )}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground">补充说明 <span className="text-muted-foreground font-normal">（可选）</span></label>
              <Textarea
                value={cur.note}
                onChange={e => setCur({ note: e.target.value })}
                placeholder="比如：技术栈偏好、行业偏好、不能接受 996 等"
                className="mt-2 text-xs min-h-[60px]"
              />
            </div>
          </div>
        )}

        {current.id === 'ch2' && (
          <div className="space-y-3">
            {hasResumeWorkspace ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                <div className="flex items-center gap-2 font-bold">
                  <Check className="h-4 w-4" />
                  已检测到简历底稿
                </div>
                <p className="mt-2 text-xs leading-relaxed">
                  可以继续跳过本章。后续面试情报站、自我介绍和题库会直接读取这份简历，不再依赖临时填写的亮点摘要。
                </p>
              </div>
            ) : (
              <div className="rounded-2xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
                <div className="flex items-center gap-2 font-bold">
                  <FileText className="h-4 w-4" />
                  还没有可用的简历底稿
                </div>
                <p className="mt-2 text-xs leading-relaxed text-sky-800">
                  请先上传旧简历，或从 0 一键生成简历。生成后系统会写入 resumeWorkspaceState，再回到地图继续推进。
                </p>
                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <Button type="button" asChild className="bg-sky-600 text-white hover:bg-sky-700">
                    <a href="/career/resume">
                      <FileText className="mr-1 h-4 w-4" /> 上传旧简历
                    </a>
                  </Button>
                  <Button type="button" asChild variant="outline">
                    <a href="/career/resume-quest">
                      <Route className="mr-1 h-4 w-4" /> 从 0 创建
                    </a>
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {current.id === 'ch3' && (
          <div>
            <label className="text-xs font-bold text-foreground">目标公司 / 已投递情况 <span className="text-rose-500">*</span></label>
            <Textarea
              value={cur.text1}
              onChange={e => setCur({ text1: e.target.value })}
              placeholder="例如：已投递阿里、字节、美团的产品岗，或锁定 3-5 家目标公司"
              className="mt-2 text-xs min-h-[100px]"
            />
          </div>
        )}

        {(current.id === 'ch4' || current.id === 'ch5' || current.id === 'ch6' || current.id === 'ch7') && (
          <div className="text-sm text-muted-foreground p-4 text-center">
            本章无需额外材料，可直接进入下一步。
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {stepIdx > 0 ? (
            <Button variant="outline" onClick={() => setStepIdx(i => Math.max(0, i - 1))}>
              <ChevronLeft className="w-4 h-4 mr-1" /> 上一步
            </Button>
          ) : (
            <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          )}
          <Button
            onClick={handleNext}
            disabled={!canNext}
            className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white hover:opacity-90"
          >
            <FastForward className="w-4 h-4 mr-1" />
            {isLast ? '确认跳过' : `下一步（还剩 ${total - stepIdx - 1}）`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
