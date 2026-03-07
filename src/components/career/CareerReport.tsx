import { useMemo } from 'react';
import { TrendingUp, TrendingDown, Minus, Award, Target, BookOpen, Briefcase, Star, ExternalLink, Link2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CareerReportData {
  personality: {
    type: string;
    traits: { name: string; score: number; label: string }[];
    summary: string;
  };
  analysis: {
    strengths: string[];
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
  }[];
  trends: { industry: string; trend: string; description: string }[];
  learningPath: { phase: string; duration: string; actions: string[] }[];
  resources?: { title: string; url: string; description: string }[];
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
  const size = 240;
  const center = size / 2;
  const radius = 90;
  const levels = 4;

  const points = useMemo(() => {
    const angleStep = (2 * Math.PI) / traits.length;
    return traits.map((t, i) => {
      const angle = angleStep * i - Math.PI / 2;
      const r = (t.score / 100) * radius;
      return {
        x: center + r * Math.cos(angle),
        y: center + r * Math.sin(angle),
        labelX: center + (radius + 28) * Math.cos(angle),
        labelY: center + (radius + 28) * Math.sin(angle),
        name: t.name,
        score: t.score,
      };
    });
  }, [traits]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[280px] mx-auto">
      {/* Grid levels */}
      {Array.from({ length: levels }, (_, i) => {
        const r = (radius * (i + 1)) / levels;
        const angleStep = (2 * Math.PI) / traits.length;
        const gridPoints = traits.map((_, j) => {
          const angle = angleStep * j - Math.PI / 2;
          return `${center + r * Math.cos(angle)},${center + r * Math.sin(angle)}`;
        });
        return (
          <polygon
            key={i}
            points={gridPoints.join(' ')}
            fill="none"
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.5}
          />
        );
      })}
      {/* Axes */}
      {traits.map((_, i) => {
        const angle = ((2 * Math.PI) / traits.length) * i - Math.PI / 2;
        return (
          <line
            key={i}
            x1={center}
            y1={center}
            x2={center + radius * Math.cos(angle)}
            y2={center + radius * Math.sin(angle)}
            stroke="hsl(var(--border))"
            strokeWidth="1"
            opacity={0.4}
          />
        );
      })}
      {/* Data polygon */}
      <polygon
        points={polygon}
        fill="hsl(var(--primary) / 0.15)"
        stroke="hsl(var(--primary))"
        strokeWidth="2"
      />
      {/* Data points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="hsl(var(--primary))" />
      ))}
      {/* Labels */}
      {points.map((p, i) => (
        <text
          key={i}
          x={p.labelX}
          y={p.labelY}
          textAnchor="middle"
          dominantBaseline="middle"
          className="text-[10px] fill-muted-foreground"
        >
          {p.name}
        </text>
      ))}
    </svg>
  );
}

function MatchBar({ match }: { match: number }) {
  const color = match >= 85 ? 'bg-primary' : match >= 70 ? 'bg-accent-foreground' : 'bg-muted-foreground';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${match}%` }} />
      </div>
      <span className="text-sm font-bold text-primary">{match}%</span>
    </div>
  );
}

const trendIcon = (trend: string) => {
  if (trend === '上升') return <TrendingUp className="w-4 h-4 text-primary" />;
  if (trend === '下降') return <TrendingDown className="w-4 h-4 text-destructive" />;
  return <Minus className="w-4 h-4 text-muted-foreground" />;
};

export function CareerReport({ data }: { data: CareerReportData }) {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Personality Section */}
      <div className="rounded-2xl border bg-card p-5 space-y-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
            <Star className="w-4 h-4 text-primary" />
          </div>
          <h3 className="font-semibold text-foreground">性格画像</h3>
          <span className="ml-auto px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold">
            {data.personality.type}
          </span>
        </div>
        <RadarChart traits={data.personality.traits} />
        <p className="text-sm text-muted-foreground leading-relaxed">{data.personality.summary}</p>
      </div>

      {/* Strengths & Interests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Award className="w-4 h-4 text-primary" /> 核心优势
          </div>
          <ul className="space-y-1">
            {data.analysis.strengths.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-1">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Target className="w-4 h-4 text-primary" /> 兴趣方向
          </div>
          <ul className="space-y-1">
            {data.analysis.interests.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-1">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border bg-card p-4 space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <BookOpen className="w-4 h-4 text-primary" /> 价值观
          </div>
          <ul className="space-y-1">
            {data.analysis.values.map((s, i) => (
              <li key={i} className="text-sm text-muted-foreground flex items-start gap-1.5">
                <span className="text-primary mt-1">•</span> {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Job Recommendations */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-foreground">推荐岗位</h3>
        </div>
        {data.recommendations.map((job, i) => (
          <div key={i} className="rounded-2xl border bg-card p-5 space-y-3 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h4 className="font-semibold text-foreground">{job.title}</h4>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{job.category}</span>
                  <span className="text-xs text-muted-foreground">💰 {job.salary}</span>
                </div>
              </div>
              <div className="text-right shrink-0">
                <div className="text-2xl font-bold text-primary">{job.match}%</div>
                <div className="text-xs text-muted-foreground">匹配度</div>
              </div>
            </div>
            <MatchBar match={job.match} />
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">📈 {job.outlook}</p>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((skill, j) => (
                  <span key={j} className="text-xs px-2 py-1 rounded-lg bg-accent text-accent-foreground">
                    {skill}
                  </span>
                ))}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">推荐理由：</span>
                {job.reasons.join('；')}
              </div>
              <div className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">成长路径：</span>
                {job.path}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Industry Trends */}
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> 行业趋势
        </h3>
        <div className="space-y-2">
          {data.trends.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
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
      <div className="rounded-2xl border bg-card p-5 space-y-3">
        <h3 className="font-semibold text-foreground flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" /> 学习路径规划
        </h3>
        <div className="relative pl-6 space-y-4">
          <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-primary/20" />
          {data.learningPath.map((phase, i) => (
            <div key={i} className="relative">
              <div className="absolute -left-[18px] top-1 w-3 h-3 rounded-full bg-primary border-2 border-background" />
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
        <div className="rounded-2xl border bg-card p-5 space-y-3">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <Link2 className="w-5 h-5 text-primary" /> 相关资源
          </h3>
          <div className="space-y-2">
            {data.resources.map((res, i) => (
              <a
                key={i}
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-3 rounded-xl bg-muted/30 hover:bg-accent/50 transition-colors group"
              >
                <ExternalLink className="w-4 h-4 text-primary mt-0.5 shrink-0 group-hover:scale-110 transition-transform" />
                <div className="min-w-0">
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{res.title}</div>
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
