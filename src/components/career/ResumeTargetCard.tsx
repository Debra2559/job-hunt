import { useEffect, useState } from 'react';
import { CheckCircle2, Pencil, Target } from 'lucide-react';
import { cn } from '@/lib/utils';
import JobPrereqInline from '@/components/career/JobPrereqInline';
import { readResumeRoleContext, type ResumeRoleContext } from '@/lib/resumeRoleContext';

type Props = {
  gradient?: string;
  onChange?: (ctx: ResumeRoleContext | null) => void;
};

export default function ResumeTargetCard({
  gradient = 'from-sky-400 via-cyan-500 to-blue-500',
  onChange,
}: Props) {
  const [context, setContext] = useState<ResumeRoleContext | null>(() => readResumeRoleContext());
  const [editing, setEditing] = useState(false);

  const refresh = () => {
    const next = readResumeRoleContext();
    setContext(next);
    onChange?.(next);
  };

  useEffect(() => {
    onChange?.(context);
    const onStorage = () => refresh();
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!context || editing) {
    return (
      <div className="mb-4">
        <JobPrereqInline
          gradient={gradient}
          title={context ? '更换目标岗位' : '先确认这份简历要投什么岗位'}
          subtitle="简历会围绕目标岗位筛选经历、突出能力和调整表达重点。"
          onSaved={() => {
            refresh();
            setEditing(false);
          }}
        />
        {editing && (
          <button
            onClick={() => setEditing(false)}
            className="mt-2 text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1 px-2 py-1"
          >
            取消更换
          </button>
        )}
      </div>
    );
  }

  return (
    <section className="mb-4 overflow-hidden rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-sm">
      <div className={cn('p-4 sm:p-5 text-white bg-gradient-to-br', gradient)}>
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-white/25 flex items-center justify-center shrink-0">
            <Target className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-bold tracking-[0.18em] opacity-90">目标岗位承接</p>
            <h2 className="text-lg sm:text-xl font-extrabold leading-tight mt-1">{context.targetRole}</h2>
            <p className="text-[12px] opacity-95 mt-1">{context.roleCategory}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="shrink-0 rounded-xl bg-white/20 hover:bg-white/30 px-2.5 py-1.5 text-[11px] font-semibold inline-flex items-center gap-1"
          >
            <Pencil className="w-3 h-3" /> 更换
          </button>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">
        <div>
          <div className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground mb-1.5">匹配原因</div>
          <p className="text-sm leading-relaxed text-foreground/85">{context.matchReason}</p>
        </div>

        <div>
          <div className="text-[11px] font-bold tracking-[0.16em] text-muted-foreground mb-2">核心能力要求</div>
          <div className="flex flex-wrap gap-1.5">
            {context.requiredAbilities.map((ability) => (
              <span key={ability} className="text-[11px] px-2 py-1 rounded-full bg-sky-50 text-sky-700 border border-sky-100 font-semibold">
                {ability}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-3">
          <div className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
            <div>
              <div className="text-xs font-bold text-cyan-900">简历生成策略</div>
              <p className="text-[12px] leading-relaxed text-cyan-900/80 mt-1">{context.resumeFocus}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
