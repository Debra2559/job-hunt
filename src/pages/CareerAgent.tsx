import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bot, User, Send, Loader2, Plus, X, Sparkles, ArrowRight, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { streamCh2 } from '@/lib/ch2Stream';

const LS_KEY = 'career:agent:materials:v1';

type Material = { id: string; kind: '播客' | '文章' | '书摘' | '社媒' | '其他'; title: string; content: string };
type Msg = { role: 'user' | 'assistant'; content: string };

const KIND_OPTIONS: Material['kind'][] = ['播客', '文章', '书摘', '社媒', '其他'];

function readMaterials(): Material[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function saveMaterials(m: Material[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(m)); } catch {}
}

export default function CareerAgent() {
  const [materials, setMaterials] = useState<Material[]>(readMaterials);
  const [draft, setDraft] = useState<{ kind: Material['kind']; title: string; content: string }>({ kind: '文章', title: '', content: '' });
  const [showAdd, setShowAdd] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();
  const stopRef = useRef<() => void>();

  const addMaterial = () => {
    if (!draft.title.trim() || !draft.content.trim()) {
      toast({ title: '标题和内容都要填', description: '哪怕粘一段也行' });
      return;
    }
    const next = [...materials, { id: crypto.randomUUID(), ...draft }];
    setMaterials(next);
    saveMaterials(next);
    setDraft({ kind: '文章', title: '', content: '' });
    setShowAdd(false);
  };

  const removeMaterial = (id: string) => {
    const next = materials.filter(m => m.id !== id);
    setMaterials(next);
    saveMaterials(next);
  };

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (materials.length === 0) {
      toast({ title: '先喂点素材', description: 'Agent 需要至少 1 段素材才能模仿你的偏好' });
      return;
    }
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: text }, { role: 'assistant', content: '' }]);
    setStreaming(true);

    const context = materials.map(m => `【${m.kind}：${m.title}】\n${m.content}`).join('\n\n---\n\n');

    try {
      const stop = await streamCh2({
        mode: 'agent',
        input: text,
        context,
        onDelta: (chunk) => {
          setMessages(prev => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: next[next.length - 1].content + chunk };
            return next;
          });
        },
        onDone: () => {
          setStreaming(false);
          if (!isDone('agent')) {
            markDone('agent');
            onStageCompleted('agent');
            setCompleted(true);
            toast({ title: '🎉 第 4 关通关', description: '第二章「准备出发」全部完成！' });
          } else {
            setCompleted(true);
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
      emoji="🤖"
      title="训练专属 Agent"
      subtitle="喂它你看过的播客 / 文章 / 书摘，它就成为你专属的求职军师"
      gradient="from-violet-400 via-purple-500 to-fuchsia-500"
      footer={
        completed ? (
          <>
            <div className="flex-1 text-xs text-muted-foreground inline-flex items-center gap-1.5"><Trophy className="w-3.5 h-3.5 text-amber-500" /> 第二章已全部通关！回到地图开启下一章</div>
            <Link
              to="/"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 text-white font-bold shadow-lg hover:opacity-95"
            >
              返回地图 <ArrowRight className="w-4 h-4" />
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
              placeholder={materials.length === 0 ? '先在上面喂点素材…' : '问 Agent 任何求职问题…'}
              className="flex-1 h-11 px-4 rounded-2xl border border-violet-200 bg-white/95 text-sm focus:outline-none focus:ring-2 focus:ring-violet-300 disabled:opacity-50"
            />
            <Button
              onClick={send}
              disabled={streaming || !input.trim() || materials.length === 0}
              className="shrink-0 rounded-2xl px-4 h-11 bg-gradient-to-r from-violet-400 via-purple-500 to-fuchsia-500 text-white font-bold shadow-lg disabled:opacity-40"
            >
              {streaming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </>
        )
      }
    >
      {/* materials section */}
      <section className="mb-5">
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-violet-500" />
            已投喂素材
            <span className="text-[11px] text-muted-foreground font-normal">({materials.length})</span>
          </h2>
          <button
            onClick={() => setShowAdd(s => !s)}
            className="text-[11px] px-2.5 py-1 rounded-full bg-violet-100 text-violet-700 hover:bg-violet-200 font-bold inline-flex items-center gap-1"
          >
            <Plus className="w-3 h-3" /> 添加素材
          </button>
        </div>

        {showAdd && (
          <div className="rounded-2xl bg-white/90 border border-violet-200 p-4 mb-3 shadow-sm space-y-2.5">
            <div className="flex gap-2">
              <select
                value={draft.kind}
                onChange={(e) => setDraft({ ...draft, kind: e.target.value as Material['kind'] })}
                className="h-9 px-2.5 rounded-lg border border-violet-200 bg-white text-sm"
              >
                {KIND_OPTIONS.map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                placeholder="素材标题，比如「张潇雨：商业就是这样」"
                className="flex-1 h-9 px-3 rounded-lg border border-violet-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-300"
              />
            </div>
            <Textarea
              value={draft.content}
              onChange={(e) => setDraft({ ...draft, content: e.target.value })}
              placeholder="把核心观点 / 摘抄 / 笔记粘进来。300-2000 字最佳。"
              rows={5}
              className="resize-none text-sm bg-white border-violet-200"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowAdd(false)} className="text-xs px-3 py-1.5 rounded-lg text-muted-foreground hover:bg-muted">取消</button>
              <Button onClick={addMaterial} size="sm" className="rounded-lg bg-violet-600 hover:bg-violet-700 text-white">保存素材</Button>
            </div>
          </div>
        )}

        {materials.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-violet-200 bg-violet-50/40 p-6 text-center">
            <div className="text-4xl mb-2">📚</div>
            <p className="text-sm font-bold text-violet-900 mb-1">先喂它一段你最近读过的内容</p>
            <p className="text-xs text-violet-700/80">可以是播客摘要、知乎高赞、书的金句、博主帖子…越个性化，Agent 越像你自己。</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {materials.map((m) => (
              <div key={m.id} className="rounded-2xl bg-white/90 border border-white p-3 shadow-sm relative">
                <button
                  onClick={() => removeMaterial(m.id)}
                  className="absolute top-2 right-2 w-6 h-6 rounded-full hover:bg-rose-50 text-muted-foreground hover:text-rose-600 flex items-center justify-center"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-violet-100 text-violet-700 font-bold">{m.kind}</span>
                  <span className="text-xs font-bold truncate pr-6">{m.title}</span>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed">{m.content}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* chat with agent */}
      {messages.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-bold flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-violet-500" /> 与 Agent 对话
          </h2>
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-2.5 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${m.role === 'user' ? 'bg-gradient-to-br from-sky-400 to-blue-500' : 'bg-gradient-to-br from-violet-400 to-fuchsia-500'}`}>
                {m.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
              </div>
              <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap leading-relaxed ${m.role === 'user' ? 'bg-gradient-to-br from-sky-50 to-blue-50 border border-sky-100' : 'bg-white border border-violet-100 shadow-sm'}`}>
                {m.content || (streaming && i === messages.length - 1 ? <span className="inline-block w-1.5 h-4 bg-violet-500 animate-pulse" /> : null)}
              </div>
            </div>
          ))}
        </section>
      )}
    </Ch2PageShell>
  );
}
