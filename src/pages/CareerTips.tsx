import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Send, Sparkles, Loader2, ArrowRight, User, Bot } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { streamCh2 } from '@/lib/ch2Stream';

const QUICK_PROMPTS = [
  '简历投递黄金时间是什么时候？',
  '面试官问"你还有什么问题吗"该怎么答？',
  '面试着装到底要不要穿西装？',
  '收到 offer 后能再谈薪资吗？',
  '小公司 vs 大厂，应届生怎么选？',
  '投递后多久没回复就该放弃？',
  '面试时被问到弱点怎么回答最稳？',
  '群面 / 无领导小组怎么不当背景板？',
];

type Msg = { role: 'user' | 'assistant'; content: string };

export default function CareerTips() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();
  const stopRef = useRef<() => void>();

  const send = async (prompt?: string) => {
    const text = (prompt ?? input).trim();
    if (!text || streaming) return;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    try {
      const stop = await streamCh2({
        mode: 'tips',
        input: text,
        onDelta: (chunk) => {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + chunk };
            return next;
          });
        },
        onDone: () => {
          setStreaming(false);
          if (!isDone('tips')) {
            markDone('tips');
            onStageCompleted('tips');
            setCompleted(true);
            toast({ title: '🎉 第 2 关通关', description: '问完一个，可以继续多问几个' });
          }
        },
        onError: (e) => {
          setStreaming(false);
          toast({ title: '出错了', description: e, variant: 'destructive' });
          setMessages(prev => prev.slice(0, -1));
        },
      });
      stopRef.current = stop;
    } catch (e: any) {
      setStreaming(false);
      toast({ title: '请求失败', description: e?.message || '稍后再试', variant: 'destructive' });
    }
  };

  return (
    <Ch2PageShell
      emoji="💡"
      title="求职小 Tips"
      subtitle="任何流程 & 细节问题，30 秒内拿到可执行答案"
      gradient="from-amber-400 via-yellow-500 to-orange-500"
      footer={
        completed ? (
          <>
            <div className="flex-1 text-xs text-muted-foreground">🎉 第 2 关已通关，进入「了解公司」</div>
            <Link
              to="/career/company"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white font-bold shadow-lg hover:opacity-95"
            >
              下一关 · 了解公司 <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send())}
              disabled={streaming}
              placeholder="问我任何求职细节…"
              className="flex-1 h-11 px-4 rounded-2xl border border-amber-200 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-amber-300"
            />
            <Button
              onClick={() => send()}
              disabled={streaming || !input.trim()}
              className="shrink-0 rounded-2xl px-4 h-11 bg-gradient-to-r from-amber-400 via-yellow-500 to-orange-500 text-white font-bold shadow-lg disabled:opacity-40"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </>
        )
      }
    >
      {messages.length === 0 ? (
        <div className="space-y-4">
          <div className="rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 p-5">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-600" />
              <h3 className="font-bold text-amber-900">从一个真问题开始</h3>
            </div>
            <p className="text-sm text-amber-800/90">这里不讲大道理，只解决你今天真的卡住的事。点下面任意一个开始，或者直接打字提问。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                className="text-left rounded-2xl border border-white/80 bg-white/85 backdrop-blur p-3.5 text-sm hover:border-amber-300 hover:bg-amber-50/80 hover:-translate-y-0.5 transition-all shadow-sm"
              >
                <span className="mr-1.5">💬</span>{p}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gradient-to-br from-amber-400 to-orange-500'}`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100' : 'bg-white border border-amber-100 shadow-sm'}`}>
                {m.content || (streaming && i === messages.length - 1 ? <span className="inline-block w-1.5 h-4 bg-amber-500 animate-pulse" /> : null)}
                {streaming && i === messages.length - 1 && m.content && (
                  <span className="inline-block w-1.5 h-4 bg-amber-500 ml-0.5 align-middle animate-pulse" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Ch2PageShell>
  );
}
