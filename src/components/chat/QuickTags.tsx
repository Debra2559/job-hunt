import { quickTags } from '@/data/campusData';
import { cn } from '@/lib/utils';

interface QuickTagsProps {
  onTagClick: (message: string) => void;
  variant?: 'grid' | 'horizontal';
}

export function QuickTags({ onTagClick, variant = 'grid' }: QuickTagsProps) {
  if (variant === 'horizontal') {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide animate-fade-in">
        {quickTags.slice(0, 5).map((tag, index) => (
          <button
            key={tag.id}
            onClick={() => onTagClick(tag.description)}
            className={cn(
              "flex-shrink-0 p-4 rounded-xl text-left transition-all duration-300",
              "bg-card border border-border/60",
              "hover:border-primary/40 hover:bg-accent/50"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className="font-medium text-foreground text-sm mb-1">
              {tag.title}
            </div>
            <div className="text-muted-foreground text-xs whitespace-nowrap">
              {tag.description}
            </div>
          </button>
        ))}
      </div>
    );
  }

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
          <div className="flex-1">
            <div className="font-semibold text-foreground text-sm mb-1.5 group-hover:text-primary transition-colors">
              {tag.title}
            </div>
            <div className="text-muted-foreground text-xs leading-relaxed">
              {tag.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
