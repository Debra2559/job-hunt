import { AlertTriangle, CheckCircle2, Lightbulb } from 'lucide-react';
import type { AISuggestion } from '@/lib/resumeWorkspace';

type ResumeAISuggestionsProps = {
  suggestions: AISuggestion[];
  onApplySuggestion?: (suggestion: AISuggestion) => void;
};

const severityStyle: Record<AISuggestion['severity'], string> = {
  high: 'bg-rose-50 text-rose-700 border-rose-100',
  medium: 'bg-amber-50 text-amber-700 border-amber-100',
  low: 'bg-sky-50 text-sky-700 border-sky-100',
};

export default function ResumeAISuggestions({
  suggestions,
  onApplySuggestion,
}: ResumeAISuggestionsProps) {
  if (suggestions.length === 0) {
    return (
      <aside className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
        <div className="flex items-start gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-extrabold">AI 建议</h3>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">暂未发现明显问题。继续补充真实细节和量化结果即可。</p>
          </div>
        </div>
      </aside>
    );
  }

  return (
    <aside className="rounded-3xl border border-white/70 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <Lightbulb className="w-4 h-4 text-amber-500" />
        <h3 className="text-sm font-extrabold">AI 修改建议</h3>
        <span className="ml-auto text-[11px] text-muted-foreground">{suggestions.length} 条</span>
      </div>

      <div className="space-y-3">
        {suggestions.map((suggestion) => (
          <div key={suggestion.id} className="rounded-2xl border border-border/50 bg-white p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-bold">{suggestion.type}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold ${severityStyle[suggestion.severity]}`}>
                    {suggestion.severity === 'high' ? '高优先级' : suggestion.severity === 'medium' ? '中优先级' : '低优先级'}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 font-bold">{suggestion.section}</span>
                </div>
                <p className="text-xs font-semibold leading-relaxed">{suggestion.problem}</p>
                <p className="text-xs text-muted-foreground leading-relaxed mt-1">{suggestion.suggestion}</p>
                {suggestion.suggestedRewrite && (
                  <div className="mt-2 rounded-xl bg-sky-50 border border-sky-100 p-2 text-[11px] leading-relaxed text-sky-900">
                    <span className="font-bold">建议改写：</span>{suggestion.suggestedRewrite}
                  </div>
                )}
                {onApplySuggestion && (
                  <button
                    onClick={() => onApplySuggestion(suggestion)}
                    className="mt-2 text-[11px] font-bold text-sky-600 hover:text-sky-700"
                  >
                    应用建议
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
