import { quickTags } from '@/data/campusData';
import { cn } from '@/lib/utils';
import { ArrowRight } from 'lucide-react';

interface QuickTagsProps {
  onTagClick: (message: string) => void;
}

export function QuickTags({ onTagClick }: QuickTagsProps) {
  return (
    <div className="grid grid-cols-2 gap-4 max-w-2xl mx-auto animate-fade-in">
      {quickTags.slice(0, 4).map((tag, index) => (
        <button
          key={tag.id}
          onClick={() => onTagClick(tag.description)}
          className={cn(
            "group p-5 rounded-2xl text-left transition-all duration-300",
            "bg-card border border-border/60 shadow-elegant",
            "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
            "hover:bg-gradient-to-br hover:from-white hover:to-accent/30"
          )}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="font-semibold text-foreground text-sm mb-1.5 group-hover:text-primary transition-colors">
                {tag.title}
              </div>
              <div className="text-muted-foreground text-xs leading-relaxed">
                {tag.description}
              </div>
            </div>
            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:bg-primary">
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-white transition-colors" />
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
