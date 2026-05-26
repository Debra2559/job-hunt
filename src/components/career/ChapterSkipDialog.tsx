import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { FastForward, Check, AlertTriangle } from 'lucide-react';
import type { ChapterId, SkipPayload } from '@/hooks/useChapterSkip';

const POSITION_PRESETS = [
  '产品经理', '前端工程师', '后端工程师', '算法工程师', '数据分析师',
  '运营', '市场营销', '人力资源', 'UI/UX 设计师', '财务/审计',
  '咨询顾问', '销售', '项目经理', '内容创作', '法务',
];

const CITY_PRESETS = ['北京', '上海', '广州', '深圳', '杭州', '成都', '南京', '武汉', '苏州', '远程'];

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  chapterId: ChapterId;
  chapterTitle: string;
  chapterEmoji: string;
  onConfirm: (payload: SkipPayload[ChapterId]) => void;
};

export default function ChapterSkipDialog({ open, onOpenChange, chapterId, chapterTitle, chapterEmoji, onConfirm }: Props) {
  // Chapter 1 state
  const [positions, setPositions] = useState<string[]>([]);
  const [customPos, setCustomPos] = useState('');
  const [cities, setCities] = useState<string[]>([]);
  const [note, setNote] = useState('');
  // Chapter 2/3 state
  const [text1, setText1] = useState('');

  const toggle = (list: string[], setList: (v: string[]) => void, v: string) => {
    setList(list.includes(v) ? list.filter(x => x !== v) : [...list, v]);
  };

  const addCustomPos = () => {
    const v = customPos.trim();
    if (!v || positions.includes(v)) return;
    setPositions([...positions, v]);
    setCustomPos('');
  };

  const canConfirm = useMemo(() => {
    if (chapterId === 'ch1') return positions.length >= 2;
    if (chapterId === 'ch2') return text1.trim().length >= 20;
    if (chapterId === 'ch3') return text1.trim().length >= 5;
    return true;
  }, [chapterId, positions, text1]);

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (chapterId === 'ch1') {
      onConfirm({ positions, cities: cities.length ? cities : undefined, note: note.trim() || undefined });
    } else if (chapterId === 'ch2') {
      onConfirm({ resumeHighlights: text1.trim() });
    } else if (chapterId === 'ch3') {
      onConfirm({ targetCompanies: text1.trim() });
    } else {
      onConfirm({});
    }
    // reset
    setPositions([]); setCities([]); setNote(''); setText1(''); setCustomPos('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg">
            <span className="text-2xl leading-none">{chapterEmoji}</span>
            <span>跳过「{chapterTitle}」</span>
          </DialogTitle>
          <DialogDescription className="text-xs leading-relaxed">
            跳过前请先补充上一阶段的关键产出，AI 会基于这些信息继续后面的章节。
          </DialogDescription>
        </DialogHeader>

        {/* Warning strip */}
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-[12px] text-amber-800">
          <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          <span>跳过会把本章关卡全部标记为已完成，但不会得到通关 XP / 徽章。</span>
        </div>

        {/* Chapter-specific form */}
        {chapterId === 'ch1' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-foreground">倾向岗位 <span className="text-rose-500">*</span> <span className="text-muted-foreground font-normal">（至少选 2 个）</span></label>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {POSITION_PRESETS.map(p => {
                  const on = positions.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      onClick={() => toggle(positions, setPositions, p)}
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
                  value={customPos}
                  onChange={e => setCustomPos(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addCustomPos(); } }}
                  placeholder="自定义岗位，回车添加"
                  className="h-8 text-xs"
                />
                <Button type="button" size="sm" variant="outline" onClick={addCustomPos} disabled={!customPos.trim()}>添加</Button>
              </div>
              {positions.filter(p => !POSITION_PRESETS.includes(p)).length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {positions.filter(p => !POSITION_PRESETS.includes(p)).map(p => (
                    <Badge key={p} variant="secondary" className="text-[10px] cursor-pointer" onClick={() => toggle(positions, setPositions, p)}>
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
                  const on = cities.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggle(cities, setCities, c)}
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
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="比如：技术栈偏好、行业偏好、不能接受 996 等"
                className="mt-2 text-xs min-h-[60px]"
              />
            </div>
          </div>
        )}

        {chapterId === 'ch2' && (
          <div>
            <label className="text-xs font-bold text-foreground">简历核心亮点 <span className="text-rose-500">*</span> <span className="text-muted-foreground font-normal">（至少 20 字）</span></label>
            <Textarea
              value={text1}
              onChange={e => setText1(e.target.value)}
              placeholder="请用 3-5 句话概括你的核心经历、技能和亮点项目，AI 会以此作为后续投递依据。"
              className="mt-2 text-xs min-h-[120px]"
            />
            <p className="text-[10px] text-muted-foreground mt-1">{text1.trim().length} 字</p>
          </div>
        )}

        {chapterId === 'ch3' && (
          <div>
            <label className="text-xs font-bold text-foreground">目标公司/已投递情况 <span className="text-rose-500">*</span></label>
            <Textarea
              value={text1}
              onChange={e => setText1(e.target.value)}
              placeholder="例如：已投递阿里、字节、美团的产品岗，或锁定 3-5 家目标公司"
              className="mt-2 text-xs min-h-[100px]"
            />
          </div>
        )}

        {chapterId === 'ch4' && (
          <div className="text-sm text-muted-foreground p-4 text-center">
            这是最后一章，直接跳过即可标记完成。
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            onClick={handleConfirm}
            disabled={!canConfirm}
            className="bg-gradient-to-r from-emerald-500 via-cyan-500 to-violet-500 text-white hover:opacity-90"
          >
            <FastForward className="w-4 h-4 mr-1" />
            确认跳过本章
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
