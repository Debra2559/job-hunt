import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Check, Sparkles, BookOpen, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { ASSISTANTS, type Assistant } from '@/data/assistants';
import { useAssistant } from '@/hooks/useAssistant';

export default function AssistantHub() {
  const { assistant: claimed, claim, release } = useAssistant();
  const [previewId, setPreviewId] = useState<string | null>(null);
  const preview: Assistant | null = previewId
    ? ASSISTANTS.find(a => a.id === previewId) || null
    : (claimed || ASSISTANTS[0]);

  const handleClaim = (id: string) => {
    claim(id);
    const a = ASSISTANTS.find(x => x.id === id)!;
    toast({
      title: `✨ 已认领 ${a.name}`,
      description: `${a.role}已悬浮在右下角，随时可以聊。`,
    });
  };

  const isClaimed = (id: string) => claimed?.id === id;

  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-violet-50 via-fuchsia-50 to-rose-50">
      {/* deco */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[6%] left-[8%] text-3xl opacity-30">✨</div>
        <div className="absolute top-[14%] right-[12%] text-4xl opacity-25">📚</div>
        <div className="absolute bottom-[10%] right-[8%] text-3xl opacity-25">🪄</div>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/65 border-b border-white/40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link to="/" className="w-9 h-9 rounded-xl bg-white/80 border border-white flex items-center justify-center shadow-sm hover:scale-105 active:scale-95 transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl bg-gradient-to-br from-violet-400 via-purple-500 to-fuchsia-500 shadow-lg">
            <span className="drop-shadow-sm">🤖</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold leading-tight">认领你的专属 AI 助理</h1>
            <p className="text-[11px] text-muted-foreground">已吸收行业经典内容，认领后悬浮在屏幕，随时可聊</p>
          </div>
          {claimed && (
            <button
              onClick={() => { release(); toast({ title: '已释放', description: '可以重新挑一个' }); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full bg-white border border-border/60 text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              释放
            </button>
          )}
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6">
        {/* ===== left: assistant gallery ===== */}
        <section>
          <div className="rounded-3xl bg-gradient-to-br from-violet-100/80 via-white to-fuchsia-50/80 border border-white/70 backdrop-blur p-5 mb-5 shadow-sm">
            <div className="flex items-center gap-2 mb-1.5">
              <Sparkles className="w-4 h-4 text-violet-600" />
              <h2 className="font-bold">8 位「行业老师傅」AI 助理</h2>
            </div>
            <p className="text-[13px] text-foreground/75 leading-relaxed">
              每位助理都已经被「投喂」过该领域的经典书籍、行业访谈、KOL 视频与头部公司公开内容。
              认领后会以小球形式悬浮在右下角，点开就能像问学长学姐一样聊任何专业问题。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {ASSISTANTS.map((a) => {
              const active = (preview?.id === a.id);
              const claimedThis = isClaimed(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => setPreviewId(a.id)}
                  className={cn(
                    'group text-left rounded-2xl p-4 transition-all border-2 relative overflow-hidden',
                    'bg-white/90 backdrop-blur shadow-sm hover:-translate-y-0.5 hover:shadow-md',
                    active ? 'border-violet-400 ring-2 ring-violet-200' : 'border-white/80',
                  )}
                >
                  {claimedThis && (
                    <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded-full bg-violet-600 text-white font-bold inline-flex items-center gap-0.5">
                      <Check className="w-2.5 h-2.5" strokeWidth={3} /> 已认领
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={cn('w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 bg-gradient-to-br shadow-lg', a.gradient)}>
                      <span className="drop-shadow-sm">{a.emoji}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm leading-tight truncate">{a.name} <span className="text-[11px] font-normal text-muted-foreground">· {a.role}</span></h3>
                      <p className="text-[11px] text-foreground/75 mt-1 line-clamp-2 leading-relaxed">{a.tagline}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {a.expertise.slice(0, 2).map((e) => (
                          <span key={e} className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted/70 text-foreground/70">{e}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ===== right: detail panel ===== */}
        {preview && (
          <aside className="lg:sticky lg:top-[80px] self-start h-fit rounded-3xl bg-white/90 backdrop-blur border border-white/70 shadow-xl overflow-hidden">
            <div className={cn('p-5 text-white bg-gradient-to-br', preview.gradient)}>
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-white/25 backdrop-blur flex items-center justify-center text-3xl shadow-inner">
                  {preview.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-extrabold text-xl leading-tight">{preview.name}</h3>
                  <p className="text-[12px] opacity-90 font-semibold">{preview.role}</p>
                </div>
              </div>
              <p className="text-[13px] mt-3 leading-relaxed opacity-95">{preview.tagline}</p>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <h4 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-1.5">擅长领域</h4>
                <div className="flex flex-wrap gap-1.5">
                  {preview.expertise.map((e) => (
                    <span key={e} className="text-[11px] px-2 py-1 rounded-full bg-violet-50 text-violet-700 border border-violet-100 font-medium">{e}</span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-1.5 inline-flex items-center gap-1">
                  <BookOpen className="w-3 h-3" /> 投喂的素材
                </h4>
                <ul className="space-y-1">
                  {preview.sources.map((s) => (
                    <li key={s} className="text-[12px] text-foreground/75 flex gap-1.5">
                      <span className="text-violet-400 shrink-0">·</span>{s}
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="text-[11px] font-bold tracking-[0.18em] text-muted-foreground mb-1.5 inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> 可以这样开聊
                </h4>
                <div className="space-y-1.5">
                  {preview.starterPrompts.slice(0, 3).map((p) => (
                    <div key={p} className="text-[12px] text-foreground/80 px-2.5 py-1.5 rounded-lg bg-muted/60 border border-border/40 leading-relaxed">
                      💬 {p}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={() => handleClaim(preview.id)}
                disabled={isClaimed(preview.id)}
                className={cn(
                  'w-full h-11 rounded-2xl font-bold text-white shadow-lg bg-gradient-to-r',
                  preview.gradient,
                  isClaimed(preview.id) && 'opacity-60 cursor-not-allowed',
                )}
              >
                {isClaimed(preview.id) ? <><Check className="w-4 h-4 mr-1" /> 已认领，去右下角找它</> : <><Sparkles className="w-4 h-4 mr-1" /> 认领 {preview.name}</>}
              </Button>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
