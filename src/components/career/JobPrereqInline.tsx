import { useState } from 'react';
import { Sparkles, Target, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { SELECTED_JOBS_LS_KEY } from '@/pages/CareerRecommend';

const PRESETS: { title: string; category: string; emoji: string }[] = [
  { title: '产品经理', category: '互联网', emoji: '🧭' },
  { title: '互联网运营', category: '互联网', emoji: '📣' },
  { title: '前端工程师', category: '研发', emoji: '💻' },
  { title: '数据分析师', category: '数据', emoji: '📊' },
  { title: '市场营销', category: '市场', emoji: '🎯' },
  { title: '人力资源 HR', category: 'HR', emoji: '🤝' },
  { title: 'UI / UX 设计', category: '设计', emoji: '🎨' },
  { title: '财务 / 金融', category: '财务', emoji: '💼' },
];

type Props = {
  /** 用于配色 */
  gradient?: string;
  /** 主标题 */
  title?: string;
  /** 副标题 */
  subtitle?: string;
  /** 保存后回调（页面据此刷新） */
  onSaved?: (job: { title: string; category: string }) => void;
};

export default function JobPrereqInline({
  gradient = 'from-emerald-400 via-teal-500 to-cyan-500',
  title = '先告诉我，你想冲哪个岗位？',
  subtitle = '选一个最贴近的就行，后面随时能改。',
  onSaved,
}: Props) {
  const [custom, setCustom] = useState('');
  const [saving, setSaving] = useState(false);

  const save = (job: { title: string; category?: string }) => {
    const t = job.title.trim();
    if (!t) {
      toast({ title: '岗位名不能为空' });
      return;
    }
    setSaving(true);
    try {
      const payload = [{
        title: t,
        category: job.category || '自定义',
        skills: [],
        reasons: ['你手动选择的目标方向'],
        path: '',
        salary: '—',
        outlook: '—',
        match: 80,
      }];
      localStorage.setItem(SELECTED_JOBS_LS_KEY, JSON.stringify(payload));
      toast({ title: `✨ 已设定目标：${t}`, description: '这一关现在可以正常进行啦' });
      onSaved?.(payload[0]);
      // 触发本地存储事件，便于同页其他组件刷新
      window.dispatchEvent(new Event('storage'));
    } catch {
      toast({ title: '保存失败', description: '稍后再试', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl border border-white/70 bg-white/90 backdrop-blur shadow-[0_18px_50px_-18px_rgba(16,185,129,0.35)] overflow-hidden">
      <div className={cn('p-5 text-white bg-gradient-to-br', gradient)}>
        <div className="flex items-center gap-2.5">
          <div className="w-11 h-11 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center shrink-0">
            <Target className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="font-extrabold text-base sm:text-lg leading-tight">{title}</h2>
            <p className="text-[12px] opacity-95 mt-0.5">{subtitle}</p>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-4">
        {/* 预设方向 */}
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-2">快速选择</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {PRESETS.map(p => (
              <button
                key={p.title}
                onClick={() => save(p)}
                disabled={saving}
                className="group text-left rounded-2xl border border-border/60 bg-white p-2.5 hover:border-emerald-300 hover:bg-emerald-50/60 hover:-translate-y-0.5 transition-all shadow-sm disabled:opacity-50"
              >
                <div className="text-lg leading-none mb-1">{p.emoji}</div>
                <div className="text-[12px] font-bold truncate">{p.title}</div>
                <div className="text-[10px] text-muted-foreground truncate">{p.category}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 自定义 */}
        <div>
          <div className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-2">或者手动输入</div>
          <div className="flex gap-2">
            <input
              type="text"
              value={custom}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save({ title: custom })}
              placeholder="例如：游戏策划 / 行政专员 / 投行分析师"
              maxLength={40}
              className="flex-1 h-11 px-4 rounded-2xl border border-border/60 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
            <Button
              onClick={() => save({ title: custom })}
              disabled={saving || !custom.trim()}
              className={cn('shrink-0 rounded-2xl px-4 h-11 text-white font-bold shadow-lg bg-gradient-to-r', gradient)}
            >
              {saving ? <Check className="w-4 h-4 mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
              保存
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-muted-foreground leading-relaxed">
          想要更精准的推荐？也可以先回去做{' '}
          <a href="/career" className="text-emerald-600 font-semibold hover:underline">性格测评</a>{' '}
          或{' '}
          <a href="/career/recommend" className="text-emerald-600 font-semibold hover:underline">岗位推荐</a>。
        </p>
      </div>
    </div>
  );
}
