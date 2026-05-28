import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Loader2, Copy, RotateCcw, Check, ArrowRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { streamCh2 } from '@/lib/ch2Stream';
import JobContextBanner from '@/components/career/JobContextBanner';

const QUESTIONS = [
  { key: 'basic', label: '基本信息', placeholder: '姓名 / 学校专业 / 年级 / 联系方式 / 求职方向（写多少都行）' },
  { key: 'edu', label: '教育经历', placeholder: '学历、成绩、奖学金、相关课程、辅修双学位…' },
  { key: 'intern', label: '实习 / 工作', placeholder: '在哪、做了什么、用什么方法、带来什么数字结果。每段实习一行就行。' },
  { key: 'project', label: '项目 / 比赛', placeholder: '课程项目、独立项目、开源、竞赛、获奖。哪怕只有想法也写出来。' },
  { key: 'campus', label: '校园经历', placeholder: '社团 / 学生会 / 志愿者 / 班委 / 组织活动…' },
  { key: 'skill', label: '技能 & 证书', placeholder: '语言、工具、编程、设计软件、四六级、行业证书…' },
] as const;

export default function CareerResume() {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [output, setOutput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();
  const stopRef = useRef<() => void>();

  const hasInput = Object.values(answers).some(v => v && v.trim());

  const handleGenerate = async () => {
    if (!hasInput) {
      toast({ title: '至少先填一栏', description: '哪怕只写一两句也可以，AI 会帮你补结构' });
      return;
    }
    setOutput('');
    setStreaming(true);

    const userText = QUESTIONS
      .map(q => answers[q.key]?.trim() ? `【${q.label}】\n${answers[q.key]}` : null)
      .filter(Boolean)
      .join('\n\n');

    try {
      const stop = await streamCh2({
        mode: 'resume',
        input: userText,
        onDelta: (chunk) => setOutput(prev => prev + chunk),
        onDone: () => {
          setStreaming(false);
          if (!isDone('resume')) {
            markDone('resume');
            onStageCompleted('resume');
            setCompleted(true);
            toast({ title: '🎉 第 1 关通关', description: '简历草稿已生成，记得手动核对' });
          } else {
            setCompleted(true);
          }
        },
        onError: (e) => {
          setStreaming(false);
          toast({ title: '生成失败', description: e, variant: 'destructive' });
        },
      });
      stopRef.current = stop;
    } catch (e: any) {
      setStreaming(false);
      toast({ title: '请求失败', description: e?.message || '稍后再试', variant: 'destructive' });
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleReset = () => {
    setOutput('');
    setAnswers({});
  };

  return (
    <Ch2PageShell
      emoji="📝"
      title="对话式一键简历"
      subtitle="挨个填、想到啥写啥，AI 自动润色 + STAR 法则量化"
      gradient="from-sky-400 via-cyan-500 to-blue-500"
      footer={
        completed ? (
          <>
            <div className="flex-1 text-xs text-muted-foreground">🎉 第 1 关已通关，继续看看下一关</div>
            <Link
              to="/career/tips"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-500 text-white font-bold shadow-lg hover:opacity-95"
            >
              下一关 · 求职小 Tips <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <div className="flex-1 text-xs text-muted-foreground">
              {streaming ? 'AI 正在为你拼装简历…' : hasInput ? '填得越具体，AI 还原越准' : '至少填一栏，例如「实习 / 项目」'}
            </div>
            <Button
              onClick={handleGenerate}
              disabled={streaming || !hasInput}
              className="shrink-0 rounded-2xl px-5 h-11 bg-gradient-to-r from-sky-400 via-cyan-500 to-blue-500 text-white font-bold shadow-lg disabled:opacity-40"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
              {streaming ? '生成中' : '一键生成简历'}
            </Button>
          </>
        )
      }
    >
      <div className="space-y-3 mb-6">
        {QUESTIONS.map((q, i) => (
          <div key={q.key} className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-6 h-6 rounded-full bg-gradient-to-br from-sky-400 to-cyan-500 text-white text-[11px] font-bold flex items-center justify-center">{i + 1}</span>
              <h3 className="text-sm font-bold">{q.label}</h3>
              <span className="text-[10px] text-muted-foreground">可跳过</span>
            </div>
            <Textarea
              value={answers[q.key] || ''}
              onChange={(e) => setAnswers(prev => ({ ...prev, [q.key]: e.target.value }))}
              placeholder={q.placeholder}
              rows={3}
              className="resize-none text-sm bg-white/70 border-white"
            />
          </div>
        ))}
      </div>

      {(output || streaming) && (
        <div className="rounded-2xl border border-sky-200 bg-gradient-to-br from-white/95 to-sky-50/80 backdrop-blur shadow-lg overflow-hidden mb-6">
          <div className="flex items-center justify-between px-4 py-2.5 bg-gradient-to-r from-sky-50 to-cyan-50 border-b border-sky-100">
            <div className="flex items-center gap-2 text-sm font-bold">
              <FileText className="w-4 h-4 text-sky-600" /> 生成的简历草稿
            </div>
            <div className="flex items-center gap-1.5">
              <button onClick={handleReset} className="text-[11px] text-muted-foreground hover:text-foreground inline-flex items-center gap-1">
                <RotateCcw className="w-3 h-3" /> 重来
              </button>
              <button onClick={handleCopy} disabled={!output} className="text-[11px] text-sky-700 font-semibold hover:text-sky-800 inline-flex items-center gap-1 disabled:opacity-40">
                {copied ? <><Check className="w-3 h-3" /> 已复制</> : <><Copy className="w-3 h-3" /> 复制</>}
              </button>
            </div>
          </div>
          <pre className="text-[13px] leading-relaxed whitespace-pre-wrap break-words p-4 font-sans text-foreground/90 max-h-[60vh] overflow-y-auto">
            {output}
            {streaming && <span className="inline-block w-1.5 h-4 bg-sky-500 ml-0.5 align-middle animate-pulse" />}
          </pre>
        </div>
      )}
    </Ch2PageShell>
  );
}
