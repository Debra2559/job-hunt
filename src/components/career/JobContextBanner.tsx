import { useEffect, useState } from 'react';
import { Target, Pencil, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SELECTED_JOBS_LS_KEY } from '@/pages/CareerRecommend';
import JobPrereqInline from '@/components/career/JobPrereqInline';

type PickedJob = { title: string; category?: string };

function read(): PickedJob[] {
  try {
    const raw = localStorage.getItem(SELECTED_JOBS_LS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

type Props = {
  /** 配色：与所在关卡保持一致 */
  gradient?: string;
  /** 文案：解释为什么这一关需要目标岗位 */
  hint?: string;
};

/**
 * 关卡顶部的「目标岗位」上下文条。
 * - 已设定：显示 chip，可点开重新选
 * - 未设定：内联展开 JobPrereqInline，让用户立即补齐
 */
export default function JobContextBanner({
  gradient = 'from-emerald-400 via-teal-500 to-cyan-500',
  hint = '设定目标岗位后，这一关给你的内容会更贴合你的方向。',
}: Props) {
  const [jobs, setJobs] = useState<PickedJob[]>(() => read());
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    const onChange = () => setJobs(read());
    window.addEventListener('storage', onChange);
    return () => window.removeEventListener('storage', onChange);
  }, []);

  if (jobs.length === 0 || editing) {
    return (
      <div className="mb-4">
        <JobPrereqInline
          gradient={gradient}
          title={jobs.length === 0 ? '先告诉我你想冲哪个岗位？' : '换一个目标岗位'}
          subtitle={hint}
          onSaved={() => { setJobs(read()); setEditing(false); }}
        />
        {editing && (
          <button
            onClick={() => setEditing(false)}
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1"
          >
            取消
          </button>
        )}
      </div>
    );
  }

  const primary = jobs[0];
  const extra = jobs.length - 1;

  return (
    <div className={cn(
      'mb-4 flex items-center gap-2 px-3 py-2 rounded-2xl border border-white/70 bg-white/85 backdrop-blur shadow-sm',
    )}>
      <div className={cn('w-7 h-7 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br text-white shadow-sm', gradient)}>
        <Target className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0 text-[12px] flex items-center gap-1.5 flex-wrap">
        <span className="text-muted-foreground">目标岗位：</span>
        <span className="font-bold text-foreground truncate">{primary.title}</span>
        {extra > 0 && <span className="text-muted-foreground">+{extra}</span>}
        <Check className="w-3 h-3 text-emerald-500" />
      </div>
      <button
        onClick={() => setEditing(true)}
        className="shrink-0 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-muted"
        title="修改目标岗位"
      >
        <Pencil className="w-3 h-3" /> 改
      </button>
    </div>
  );
}
