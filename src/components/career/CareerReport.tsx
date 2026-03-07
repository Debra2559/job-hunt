import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Target, BookOpen, Briefcase, Star, ExternalLink, Link2, Sparkles, FileText } from 'lucide-react';
import { openCareerReportPage } from './CareerReportHTML';
import { cn } from '@/lib/utils';

export interface BossJobListing {
  title: string;
  company: string;
  salary: string;
  location: string;
  url: string;
  tags: string[];
}

export interface CareerReportData {
  personality: {
    type: string;
    traits: { name: string; score: number; label: string }[];
    summary: string;
  };
  analysis: {
    strengths: string[];
    weaknesses?: string[];
    interests: string[];
    values: string[];
  };
  recommendations: {
    title: string;
    match: number;
    category: string;
    salary: string;
    outlook: string;
    reasons: string[];
    skills: string[];
    path: string;
    risks?: string;
  }[];
  trends: { industry: string; trend: string; description: string }[];
  learningPath: { phase: string; duration: string; actions: string[] }[];
  jobListings?: BossJobListing[];
}

export function parseCareerReport(content: string): CareerReportData | null {
  const match = content.match(/```career-report\s*([\s\S]*?)```/);
  if (!match) return null;
  try {
    return JSON.parse(match[1].trim());
  } catch {
    return null;
  }
}

function RadarChart({ traits }: { traits: { name: string; score: number }[] }) {
  const size = 260;
  const center = size / 2;
  const radius = 95;
  const levels = 4;

  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / traits.length;
    return traits.map((t, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const r = (t.score / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 30) * Math.cos(angle),
        labelY: center + (radius + 30) * Math.sin(angle),
        name: t.name,
        score: t.score,
      };
    });
  }, [traits]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      <defs>
        <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(270, 60%, 70%)" stopOpacity="0.25" />
          <stop offset="100%" stopColor="hsl(330, 70%, 76%)" stopOpacity="0.15" />
        </linearGradient>
        <linearGradient id="radarStroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="hsl(270, 60%, 70%)" />
          <stop offset="100%" stopColor="hsl(330, 70%, 76%)" />
        </linearGradient>
      </defs>
      {Array.from({ length: levels }, (_, i) => {
        const r = (radius * (i + 1)) / levels;
        const angleStep = (2 * Math.PI) / traits.length;
        const gridPoints = traits.map((_, j) => {
          const angle = angleStep * j - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        });
        return (
          <polygon key={i} points={gridPoints.join(' ')} fill="none" stroke="hsl(270, 30%, 90%)" strokeWidth="1" />
        );
      })}
      {traits.map((_, i) => {
        const angle = ((2 * Math.PI) / traits.length) * i - Math.PI / 2;
        return (
          <line key={i} x1={center} y1={center} x2={center + radius * Math.cos(angle)} y2={center + radius * Math.sin(angle)}
            stroke="hsl(270, 30%, 90%)" strokeWidth="1" />
        );
      })}
      <polygon points={polygon} fill="url(#radarFill)" stroke="url(#radarStroke)" strokeWidth="2.5" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4.5" fill="hsl(270, 60%, 70%)" stroke="white" strokeWidth="2" />
      ))}
      {points.map((p, i) => (
        <text key={i} x={p.labelX} y={p.labelY} textAnchor="middle" dominantBaseline="middle"
          className="text-[10px]" fill="hsl(222, 20%, 45%)" fontWeight="500">
          {p.name}
        </text>
      ))}
    </svg>
  );
}

function DreamyMatchBar({ match }: { match: number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2.5 rounded-full bg-[hsl(270,30%,93%)] overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] transition-all duration-1000"
          style={{ width: `${match}%` }}
        />
      </div>
      <span className="text-sm font-bold bg-gradient-to-r from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] bg-clip-text text-transparent">
        {match}%
      </span>
    </div>
  );
}

const trendIcon = (trend: string) => {
  if (trend === '上升') return <TrendingUp className="w-4 h-4 text-[hsl(var(--dream-mint))]" />;
  if (trend === '下降') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

const sectionColors = [
  { bg: 'from-[hsl(var(--dream-violet)/0.08)] to-transparent', border: 'border-[hsl(var(--dream-violet)/0.15)]', icon: 'text-[hsl(var(--dream-violet))]', iconBg: 'bg-[hsl(var(--dream-violet)/0.1)]' },
  { bg: 'from-[hsl(var(--dream-pink)/0.08)] to-transparent', border: 'border-[hsl(var(--dream-pink)/0.15)]', icon: 'text-[hsl(var(--dream-pink))]', iconBg: 'bg-[hsl(var(--dream-pink)/0.1)]' },
  { bg: 'from-[hsl(var(--dream-blue)/0.08)] to-transparent', border: 'border-[hsl(var(--dream-blue)/0.15)]', icon: 'text-[hsl(var(--dream-blue))]', iconBg: 'bg-[hsl(var(--dream-blue)/0.1)]' },
];

export function CareerReport({ data }: { data: CareerReportData }) {
  return (
    <div className="space-y-5 animate-fade-in">
      {/* Export button */}
      <button
        onClick={() => openCareerReportPage(data)}
        className="w-full py-3 rounded-2xl text-sm font-semibold bg-gradient-to-r from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] text-white hover:opacity-90 transition-all duration-300 active:scale-[0.98] shadow-[0_4px_14px_-3px_hsl(var(--dream-violet)/0.4)] flex items-center justify-center gap-2"
      >
        <FileText className="w-4 h-4" />
        查看完整报告页面
      </button>

      {/* Personality Section */}
      <div className="rounded-2xl border border-[hsl(var(--dream-violet)/0.2)] bg-gradient-to-br from-[hsl(var(--dream-violet)/0.06)] to-white/80 backdrop-blur-sm p-5 space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--dream-violet)/0.2)] to-[hsl(var(--dream-pink)/0.15)] flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[hsl(var(--dream-violet))]" />
          </div>
          <h3 className="font-semibold text-foreground">性格画像</h3>
          <span className="ml-auto px-3 py-1 rounded-full bg-gradient-to-r from-[hsl(var(--dream-violet)/0.15)] to-[hsl(var(--dream-pink)/0.1)] text-[hsl(var(--dream-violet))] text-sm font-bold border border-[hsl(var(--dream-violet)/0.2)]">
            {data.personality.type}
          </span>
        </div>
        <RadarChart traits={data.personality.traits} />
        <p className="text-sm text-muted-foreground leading-relaxed">{data.personality.summary}</p>
      </div>

      {/* Strengths & Interests & Values */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { title: '核心优势', icon: Award, items: data.analysis.strengths, colorIdx: 0 },
          { title: '兴趣方向', icon: Target, items: data.analysis.interests, colorIdx: 1 },
          { title: '价值观', icon: BookOpen, items: data.analysis.values, colorIdx: 2 },
        ].map((section) => {
          const c = sectionColors[section.colorIdx];
          return (
            <div key={section.title} className={cn("rounded-2xl border bg-gradient-to-b backdrop-blur-sm p-4 space-y-2", c.border, c.bg)}>
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", c.iconBg)}>
                  <section.icon className={cn("w-3.5 h-3.5", c.icon)} />
                </div>
                {section.title}
              </div>
              <ul className="space-y-1.5">
                {section.items.map((s, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                    <span className={cn("mt-1.5 w-1.5 h-1.5 rounded-full shrink-0", c.iconBg)} /> {s}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>

      {/* Job Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[hsl(var(--dream-pink)/0.2)] to-[hsl(var(--dream-peach)/0.15)] flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-[hsl(var(--dream-pink))]" />
          </div>
          <h3 className="font-semibold text-foreground">推荐岗位</h3>
        </div>
        {data.recommendations.map((job, i) => (
          <div key={i} className="rounded-2xl border border-[hsl(var(--dream-pink)/0.15)] bg-gradient-to-br from-white/80 to-[hsl(var(--dream-pink)/0.04)] backdrop-blur-sm p-5 space-y-3 hover:shadow-dream transition-all duration-300">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-foreground">{job.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--dream-violet)/0.1)] text-[hsl(var(--dream-violet))] border border-[hsl(var(--dream-violet)/0.15)]">{job.category}</span>
                  <span className="text-xs text-muted-foreground">💰 {job.salary}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] bg-clip-text text-transparent">{job.match}%</div>
                <div className="text-[10px] text-muted-foreground">匹配度</div>
              </div>
            </div>
            <DreamyMatchBar match={job.match} />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">📈 {job.outlook}</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill, j) => (
                  <span key={j} className="text-xs px-2.5 py-1 rounded-xl bg-[hsl(var(--dream-blue)/0.1)] text-[hsl(var(--dream-blue))] border border-[hsl(var(--dream-blue)/0.15)]">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">✨ 推荐理由：</span>
                {job.reasons.join('；')}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">🛤️ 成长路径：</span>
                {job.path}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Industry Trends */}
      <div className="rounded-2xl border border-[hsl(var(--dream-mint)/0.2)] bg-gradient-to-br from-[hsl(var(--dream-mint)/0.06)] to-white/80 backdrop-blur-sm p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--dream-mint)/0.15)] flex items-center justify-center">
            <TrendingUp className="w-4 h-4 text-[hsl(var(--dream-mint))]" />
          </div>
          <h3 className="font-semibold text-foreground">行业趋势</h3>
        </div>
        <div className="space-y-2">
          {data.trends.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-[hsl(var(--dream-mint)/0.1)]">
              {trendIcon(t.trend)}
              <div>
                <div className="text-sm font-medium text-foreground">{t.industry}</div>
                <div className="text-xs text-muted-foreground">{t.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Learning Path */}
      <div className="rounded-2xl border border-[hsl(var(--dream-blue)/0.2)] bg-gradient-to-br from-[hsl(var(--dream-blue)/0.06)] to-white/80 backdrop-blur-sm p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--dream-blue)/0.15)] flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-[hsl(var(--dream-blue))]" />
          </div>
          <h3 className="font-semibold text-foreground">学习路径规划</h3>
        </div>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gradient-to-b from-[hsl(var(--dream-violet))] via-[hsl(var(--dream-pink))] to-[hsl(var(--dream-blue))] opacity-30" />
          {data.learningPath.map((phase, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-gradient-to-br from-[hsl(var(--dream-violet))] to-[hsl(var(--dream-pink))] border-2 border-white shadow-sm" />
              <div>
                <div className="text-sm font-medium text-foreground">
                  {phase.phase} <span className="text-muted-foreground font-normal">({phase.duration})</span>
                </div>
                <ul className="mt-1 space-y-0.5">
                  {phase.actions.map((a, j) => (
                    <li key={j} className="text-xs text-muted-foreground">• {a}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      {data.resources && data.resources.length > 0 && (
        <div className="rounded-2xl border border-[hsl(var(--dream-peach)/0.2)] bg-gradient-to-br from-[hsl(var(--dream-peach)/0.06)] to-white/80 backdrop-blur-sm p-5 space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[hsl(var(--dream-peach)/0.15)] flex items-center justify-center">
              <Link2 className="w-4 h-4 text-[hsl(var(--dream-peach))]" />
            </div>
            <h3 className="font-semibold text-foreground">相关资源</h3>
          </div>
          <div className="space-y-2">
            {data.resources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-[hsl(var(--dream-peach)/0.1)] hover:shadow-dream hover:border-[hsl(var(--dream-peach)/0.3)] transition-all duration-300 group"
              >
                <ExternalLink className="w-4 h-4 text-[hsl(var(--dream-peach))] mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-[hsl(var(--dream-violet))] transition-colors">{res.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{res.description}</div>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
