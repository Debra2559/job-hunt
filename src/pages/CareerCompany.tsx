import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Loader2, Sparkles, ArrowRight, Building2, Heart, AlertTriangle, ExternalLink, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import Ch2PageShell from '@/components/career/Ch2PageShell';
import { useQuestProgress } from '@/hooks/useQuestProgress';
import { useGameProgress } from '@/hooks/useGameProgress';
import { supabase } from '@/integrations/supabase/client';
import JobContextBanner from '@/components/career/JobContextBanner';

type CompanyData = {
  tagline?: string;
  business?: string;
  culture?: string[];
  highlights?: string[];
  concerns?: string[];
  interviewFocus?: string[];
  searchKeywords?: string[];
};

const PRESETS = ['字节跳动', '腾讯', '阿里巴巴', '美团', '小米', '宁德时代', '比亚迪', '华为'];

const SOCIAL_LINKS = (q: string) => [
  { name: '小红书', emoji: '📕', url: `https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(q + ' 工作体验')}` },
  { name: '脉脉', emoji: '🪪', url: `https://maimai.cn/web/search_center?type=feed&query=${encodeURIComponent(q)}` },
  { name: '知乎', emoji: '💡', url: `https://www.zhihu.com/search?type=content&q=${encodeURIComponent(q + ' 怎么样')}` },
  { name: 'B站', emoji: '📺', url: `https://search.bilibili.com/all?keyword=${encodeURIComponent(q + ' 公司')}` },
  { name: '看准网', emoji: '🔍', url: `https://www.kanzhun.com/search/?query=${encodeURIComponent(q)}` },
  { name: '官网', emoji: '🌐', url: `https://www.baidu.com/s?wd=${encodeURIComponent(q + ' 官网')}` },
];

export default function CareerCompany() {
  const [query, setQuery] = useState('');
  const [activeName, setActiveName] = useState('');
  const [data, setData] = useState<CompanyData | null>(null);
  const [loading, setLoading] = useState(false);
  const [completed, setCompleted] = useState(false);
  const { markDone, isDone } = useQuestProgress();
  const { onStageCompleted } = useGameProgress();

  const research = async (name?: string) => {
    const q = (name ?? query).trim();
    if (!q) {
      toast({ title: '先输入公司名', description: '可以是「字节跳动」「华为」这种' });
      return;
    }
    setActiveName(q);
    setData(null);
    setLoading(true);
    try {
      const { data: resp, error } = await supabase.functions.invoke('ch2-toolkit', {
        body: { mode: 'company', input: q },
      });
      if (error) throw error;
      const d = (resp as any)?.data as CompanyData;
      setData(d);
      if (!isDone('company')) {
        markDone('company');
        onStageCompleted('company');
        setCompleted(true);
        toast({ title: '🎉 第 3 关通关', description: '可以继续搜索更多公司，或前往下一关' });
      } else {
        setCompleted(true);
      }
    } catch (e: any) {
      toast({ title: '生成失败', description: e?.message || '稍后再试', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Ch2PageShell
      emoji="🏢"
      title="了解公司"
      subtitle="搜一家公司，30 秒拿到业务、文化、面试侧重 + 社媒入口"
      gradient="from-emerald-400 via-green-500 to-teal-500"
      footer={
        completed ? (
          <>
            <div className="flex-1 text-xs text-muted-foreground">🎉 第 3 关已通关，继续训练你的专属 Agent</div>
            <Link
              to="/career/agent"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-2xl px-5 h-11 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white font-bold shadow-lg hover:opacity-95"
            >
              下一关 · 训练 Agent <ArrowRight className="w-4 h-4" />
            </Link>
          </>
        ) : (
          <div className="flex-1 text-xs text-muted-foreground text-center">先搜一家公司试试 ↑</div>
        )
      }
    >
      <JobContextBanner
        gradient="from-emerald-400 via-green-500 to-teal-500"
        hint="设定目标岗位后，公司调研会突出该岗位在这家公司的面试侧重。"
      />
      {/* search bar */}
      <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur p-4 mb-5 shadow-sm">

        <div className="flex gap-2">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && research()}
              placeholder="例如：字节跳动 / 华为 / 宁德时代"
              className="w-full h-11 pl-10 pr-3 rounded-xl border border-emerald-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-300"
            />
          </div>
          <Button
            onClick={() => research()}
            disabled={loading || !query.trim()}
            className="shrink-0 rounded-xl px-4 h-11 bg-gradient-to-r from-emerald-400 via-green-500 to-teal-500 text-white font-bold shadow-lg disabled:opacity-40"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            研究一下
          </Button>
        </div>
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setQuery(p); research(p); }}
              className="text-[11px] px-2 py-1 rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100 font-medium"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="rounded-2xl border border-white/70 bg-white/85 backdrop-blur p-10 text-center">
          <Loader2 className="w-6 h-6 animate-spin mx-auto text-emerald-500 mb-3" />
          <p className="text-sm text-muted-foreground">正在调研「{activeName}」…</p>
        </div>
      )}

      {data && !loading && (
        <div className="space-y-4">
          {/* hero */}
          <div className="rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-teal-50 border border-emerald-200 p-5 shadow-sm">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shrink-0">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-extrabold">{activeName}</h2>
                {data.tagline && <p className="text-sm font-semibold text-emerald-700">{data.tagline}</p>}
                {data.business && <p className="text-sm text-foreground/85 mt-2 leading-relaxed">{data.business}</p>}
              </div>
            </div>
            {data.culture && data.culture.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {data.culture.map((c, i) => (
                  <span key={i} className="text-[11px] px-2 py-1 rounded-full bg-white text-emerald-700 border border-emerald-200 font-bold">#{c}</span>
                ))}
              </div>
            )}
          </div>

          {/* highlights / concerns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.highlights && data.highlights.length > 0 && (
              <div className="rounded-2xl bg-white/90 border border-emerald-100 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-sm mb-2">
                  <Heart className="w-4 h-4" /> 近期亮点
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/85">
                  {data.highlights.map((h, i) => <li key={i} className="flex gap-1.5"><span className="text-emerald-500 shrink-0">·</span><span>{h}</span></li>)}
                </ul>
              </div>
            )}
            {data.concerns && data.concerns.length > 0 && (
              <div className="rounded-2xl bg-white/90 border border-amber-100 p-4 shadow-sm">
                <div className="flex items-center gap-1.5 text-amber-700 font-bold text-sm mb-2">
                  <AlertTriangle className="w-4 h-4" /> 注意事项
                </div>
                <ul className="space-y-1.5 text-sm text-foreground/85">
                  {data.concerns.map((h, i) => <li key={i} className="flex gap-1.5"><span className="text-amber-500 shrink-0">·</span><span>{h}</span></li>)}
                </ul>
              </div>
            )}
          </div>

          {data.interviewFocus && data.interviewFocus.length > 0 && (
            <div className="rounded-2xl bg-white/90 border border-violet-100 p-4 shadow-sm">
              <div className="flex items-center gap-1.5 text-violet-700 font-bold text-sm mb-2">
                <Target className="w-4 h-4" /> 面试常考点
              </div>
              <div className="flex flex-wrap gap-1.5">
                {data.interviewFocus.map((f, i) => (
                  <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-200">{f}</span>
                ))}
              </div>
            </div>
          )}

          {/* social */}
          <div className="rounded-2xl bg-white/90 border border-white p-4 shadow-sm">
            <div className="text-sm font-bold mb-2.5">📡 去这些地方挖更多真实声音</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {SOCIAL_LINKS(activeName).map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 rounded-xl border border-border/60 bg-white hover:bg-emerald-50 hover:border-emerald-200 text-sm font-medium transition-all"
                >
                  <span className="text-lg">{s.emoji}</span>
                  <span className="flex-1">{s.name}</span>
                  <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                </a>
              ))}
            </div>
            {data.searchKeywords && data.searchKeywords.length > 0 && (
              <div className="mt-3 pt-3 border-t border-border/40">
                <p className="text-[11px] text-muted-foreground mb-1.5">推荐搜索词：</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.searchKeywords.map((k, i) => (
                    <a
                      key={i}
                      href={`https://www.xiaohongshu.com/search_result?keyword=${encodeURIComponent(k)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100"
                    >#{k}</a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Ch2PageShell>
  );
}
