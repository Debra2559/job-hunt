import { useNavigate } from 'react-router-dom';
import { Compass, Target, FileSearch, FileText, Lightbulb, Building2, Bot, Sparkles, Send, Scissors, MessageSquare, Mic, Lock, Check, ChevronRight, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

type Stage = {
  id: string;
  title: string;
  desc: string;
  icon: any;
  status: 'done' | 'active' | 'available' | 'locked';
  to?: string;
  priority?: 'P0' | 'P1';
};

type Chapter = {
  num: string;
  title: string;
  subtitle: string;
  emoji: string;
  gradient: string;
  ring: string;
  stages: Stage[];
};

const chapters: Chapter[] = [
  {
    num: '01',
    title: '认识自己',
    subtitle: '搞清楚我是谁、我适合什么',
    emoji: '🧭',
    gradient: 'from-emerald-400 to-teal-500',
    ring: 'ring-emerald-200',
    stages: [
      { id: 'assess', title: '性格 & 能力测评', desc: '8-12 题点选，5-10 分钟', icon: Compass, status: 'available', to: '/career', priority: 'P0' },
      { id: 'recommend', title: '岗位推荐', desc: '基于你的画像智能匹配', icon: Target, status: 'available', to: '/career', priority: 'P0' },
      { id: 'jd', title: '岗位 JD 汇总', desc: '一键跳转查看真实在招岗位', icon: FileSearch, status: 'available', to: '/career', priority: 'P0' },
    ],
  },
  {
    num: '02',
    title: '准备出发',
    subtitle: '梳理经历，打磨简历，弹药上膛',
    emoji: '🎒',
    gradient: 'from-sky-400 to-indigo-500',
    ring: 'ring-sky-200',
    stages: [
      { id: 'resume', title: '对话式一键简历', desc: '支持文字 / 图片 / PDF / 语音', icon: FileText, status: 'locked', priority: 'P0' },
      { id: 'tips', title: '求职小 Tips', desc: '流程 & 细节随时问', icon: Lightbulb, status: 'locked', priority: 'P0' },
      { id: 'company', title: '了解公司', desc: '业务、文化、最新动态', icon: Building2, status: 'locked', priority: 'P1' },
      { id: 'agent', title: '训练专属 Agent', desc: '吸收播客 / 社媒 / 书籍经验', icon: Bot, status: 'locked', priority: 'P0' },
    ],
  },
  {
    num: '03',
    title: '投递闯关',
    subtitle: '让对的机会主动找到你',
    emoji: '🚀',
    gradient: 'from-violet-400 to-fuchsia-500',
    ring: 'ring-violet-200',
    stages: [
      { id: 'feed', title: '每日机会 Feed', desc: '一键推荐卡片', icon: Sparkles, status: 'locked', priority: 'P0' },
      { id: 'apply', title: '一键投递', desc: '简历直达 HR 信箱', icon: Send, status: 'locked', priority: 'P0' },
      { id: 'jd-break', title: 'JD 拆解', desc: '逐条对照你的优势', icon: Scissors, status: 'locked', priority: 'P1' },
    ],
  },
  {
    num: '04',
    title: '面试通关',
    subtitle: '在镜头前从容做自己',
    emoji: '🎤',
    gradient: 'from-orange-400 to-rose-500',
    ring: 'ring-orange-200',
    stages: [
      { id: 'qa', title: '逐字稿 & QA', desc: '高频问题人话版回答', icon: MessageSquare, status: 'locked', priority: 'P0' },
      { id: 'mock', title: '模拟面试', desc: '语音对练 + 即时反馈', icon: Mic, status: 'locked', priority: 'P1' },
    ],
  },
];

export default function CareerMap() {
  const navigate = useNavigate();
  const totalStages = chapters.reduce((s, c) => s + c.stages.length, 0);
  const availableStages = chapters.flatMap(c => c.stages).filter(s => s.status !== 'locked').length;

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/40 via-background to-violet-50/30">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-xl bg-background/70 border-b border-border/60">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-3.5 flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-accent/40 shrink-0">
            <img src={aiTeacherAvatar} alt="" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-1.5">
              求职闯关地图
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold">智联 AI</span>
            </h1>
            <p className="text-xs text-muted-foreground">从认识自己到拿下 offer，一关一关来</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-card border border-border/60 shadow-sm">
            <MapIcon className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">{availableStages}/{totalStages}</span>
            <span className="text-[11px] text-muted-foreground">已开放</span>
          </div>
        </div>
      </header>

      {/* Map */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-16 sm:space-y-20">
        {chapters.map((ch, ci) => (
          <section key={ch.num} className="relative animate-fade-in" style={{ animationDelay: `${ci * 80}ms` }}>
            {/* Chapter banner */}
            <div className="relative mb-8 sm:mb-10">
              <div className={cn('relative overflow-hidden rounded-3xl p-5 sm:p-6 bg-gradient-to-br text-white shadow-[0_10px_40px_-12px_rgba(0,0,0,0.25)]', ch.gradient)}>
                <div className="absolute -right-6 -top-6 text-[120px] sm:text-[140px] leading-none opacity-20 select-none">{ch.emoji}</div>
                <div className="absolute -left-2 top-1/2 -translate-y-1/2 text-[80px] sm:text-[100px] leading-none font-black opacity-10 select-none tracking-tighter">{ch.num}</div>
                <div className="relative">
                  <p className="text-[11px] font-bold tracking-[0.2em] opacity-90">CHAPTER {ch.num}</p>
                  <h2 className="text-2xl sm:text-3xl font-extrabold mt-1 tracking-tight">第{['一','二','三','四'][ci]}章 · {ch.title}</h2>
                  <p className="text-sm sm:text-base opacity-95 mt-1.5">{ch.subtitle}</p>
                </div>
              </div>
            </div>

            {/* Stage path */}
            <div className="relative space-y-5 sm:space-y-6">
              {ch.stages.map((st, si) => {
                const isLeft = si % 2 === 0;
                const isLocked = st.status === 'locked';
                const Icon = st.icon;
                return (
                  <div key={st.id} className={cn('flex', isLeft ? 'justify-start' : 'justify-end')}>
                    <button
                      onClick={() => st.to && navigate(st.to)}
                      disabled={isLocked}
                      className={cn(
                        'group relative w-[88%] sm:w-[78%] text-left rounded-3xl p-4 sm:p-5 bg-card border-2 transition-all duration-300',
                        'flex items-center gap-4',
                        isLocked
                          ? 'border-dashed border-border/70 opacity-70 cursor-not-allowed'
                          : cn('border-transparent shadow-[0_8px_24px_-12px_rgba(16,185,129,0.35)] hover:-translate-y-0.5 hover:shadow-[0_14px_36px_-12px_rgba(16,185,129,0.45)] active:scale-[0.99]', ch.ring, 'hover:ring-4')
                      )}
                    >
                      {/* Stage number badge */}
                      <div
                        className={cn(
                          'shrink-0 relative w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-white shadow-md',
                          isLocked ? 'bg-muted text-muted-foreground shadow-none' : cn('bg-gradient-to-br', ch.gradient)
                        )}
                      >
                        {isLocked ? <Lock className="w-5 h-5" /> : <Icon className="w-6 h-6 sm:w-7 sm:h-7" strokeWidth={2.2} />}
                        {!isLocked && (
                          <span className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-white text-foreground text-[11px] font-bold flex items-center justify-center shadow-sm border border-border/60">
                            {si + 1}
                          </span>
                        )}
                      </div>

                      {/* Body */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={cn('text-sm sm:text-base font-bold', isLocked ? 'text-muted-foreground' : 'text-foreground')}>
                            {st.title}
                          </h3>
                          {st.priority && (
                            <span className={cn(
                              'text-[10px] px-1.5 py-0.5 rounded-md font-semibold',
                              st.priority === 'P0' ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600'
                            )}>
                              {st.priority}
                            </span>
                          )}
                          {isLocked && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-muted text-muted-foreground">敬请期待</span>
                          )}
                          {!isLocked && st.status === 'done' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-md font-semibold bg-emerald-50 text-emerald-600 inline-flex items-center gap-0.5">
                              <Check className="w-2.5 h-2.5" strokeWidth={3} /> 已通关
                            </span>
                          )}
                        </div>
                        <p className={cn('text-xs sm:text-[13px] mt-1 leading-relaxed', isLocked ? 'text-muted-foreground/80' : 'text-muted-foreground')}>
                          {st.desc}
                        </p>
                      </div>

                      {/* Arrow */}
                      {!isLocked && (
                        <ChevronRight className="shrink-0 w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Connector to next chapter */}
            {ci < chapters.length - 1 && (
              <div className="flex justify-center mt-10 sm:mt-12">
                <div className="flex flex-col items-center gap-1.5">
                  <div className="w-px h-8 bg-gradient-to-b from-border to-transparent" />
                  <div className="w-2 h-2 rounded-full bg-border" />
                  <div className="w-2 h-2 rounded-full bg-border/60" />
                  <div className="w-2 h-2 rounded-full bg-border/40" />
                </div>
              </div>
            )}
          </section>
        ))}

        {/* Finale */}
        <section className="relative">
          <div className="rounded-3xl p-8 text-center bg-gradient-to-br from-amber-100 via-rose-100 to-violet-100 border border-white shadow-[0_10px_40px_-12px_rgba(244,114,182,0.35)]">
            <div className="text-5xl mb-3">🏆</div>
            <h3 className="text-xl font-extrabold text-foreground">拿下心仪 Offer</h3>
            <p className="text-sm text-muted-foreground mt-1.5">通关后欢迎回来分享你的故事</p>
          </div>
        </section>
      </div>
    </div>
  );
}
