import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FastForward, Check, AlertTriangle, ChevronLeft } from 'lucide-react';
import type { ChapterId, SkipPayload } from '@/hooks/useChapterSkip';

const POSITION_PRESETS = [
  '产品经理', '前端工程师', '后端工程师', '算法工程师', '数据分析师',
  '运营', '市场营销', '人力资源', 'UI/UX 设计师', '财务/审计',
  '咨询顾问', '销售', '项目经理', '内容创作', '法务',
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
  positions: string[];
  customPos: string;
  cities: string[];
  note: string;
  text1: string;
};

const emptyStep = (): StepState => ({ positions: [], customPos: '', cities: [], note: '', text1: '' });

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

  const setCur = (patch: Partial<StepState>) => {
    if (!current) return;
    setSteps(prev => ({ ...prev, [current.id]: { ...(prev[current.id] || emptyStep()), ...patch } }));
  };

  const toggle = (list: string[], key: 'positions' | 'cities', v: string) => {
    setCur({ [key]: list.includes(v) ? list.filter(x => x !== v) : [...list, v] } as any);
  };

  const addCustomPos = () => {
    const v = cur.customPos.trim();
    if (!v || cur.positions.includes(v)) return;
    setCur({ positions: [...cur.positions, v], customPos: '' });
  };

  const canNext = useMemo(() => {
    if (!current) return false;
    if (current.id === 'ch1') return cur.positions.length >= 2;
    if (current.id === 'ch2') return cur.text1.trim().length >= 20;
    if (current.id === 'ch3') return cur.text1.trim().length >= 5;
    return true;
  }, [current, cur]);

  const buildPayload = (chId: ChapterId, s: StepState): any => {
    if (chId === 'ch1') return { positions: s.positions, cities: s.cities.length ? s.cities : undefined, note: s.note.trim() || undefined };
    if (chId === 'ch2') return { resumeHighlights: s.text1.trim() };
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
            <span>补充「{current.title}」的关键材料</span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            你正在跳过多个章节，请先依次补齐前面章节的关键产出，AI 会基于这些信息继续推进后续。
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
              <label className="text-xs font-bold text-foreground">倾向岗位 <span className="text-rose-500">*</span> <span className="text-muted-foreground font-normal">（至少选 2 个）</span></label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POSITION_PRESETS.map(p => {
                  const on = cur.positions.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggle(cur.positions, 'positions', p)}
                      className={cn(
                        'px-2.5 py-1 rounded-full text-xs font-medium border transition-all',
                        on ? 'bg-emerald-500 text-white border-emerald-500 shadow-sm' : 'bg-background border-border hover:border-emerald-300'
                      )}
                    >
                      {on && <Check className="inline w-3 h-3 mr-0.5" strokeWidth={3} />}
                      {p}
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
              {cur.positions.filter(p => !POSITION_PRESETS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {cur.positions.filter(p => !POSITION_PRESETS.includes(p)).map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => toggle(cur.positions, 'positions', p)}>
                      {p} ×
                    </Badge>
                  ))}
                </div>
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
          <div>
            <label className="text-xs font-bold text-foreground">简历核心亮点 <span className="text-rose-500">*</span> <span className="text-muted-foreground font-normal">（至少 20 字）</span></label>
            <Textarea
              value={cur.text1}
              onChange={e => setCur({ text1: e.target.value })}
              placeholder="请用 3-5 句话概括你的核心经历、技能和亮点项目，AI 会以此作为后续投递依据。"
              className="mt-2 text-xs min-h-[120px]"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{cur.text1.trim().length} 字</p>
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
