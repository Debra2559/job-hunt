import { quickTags } from '@/data/campusData';
import { cn } from '@/lib/utils';

interface QuickTagsProps {
  onTagClick: (message: string) => void;
}

export function QuickTags({ onTagClick }: QuickTagsProps) {
  return (
    <div className="grid grid-cols-2 gap-3 max-w-2xl mx-auto animate-fade-in">
      {quickTags.slice(0, 4).map((tag, index) => (
        <button
          key={tag.id}
          onClick={() => onTagClick(tag.description)}
          className={cn(
            "group p-4 rounded-xl text-left transition-all duration-200",
            "bg-card border border-border hover:border-primary/30",
            "hover:shadow-md hover:bg-quicktag-hover"
          )}
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="font-medium text-foreground text-sm mb-1 group-hover:text-primary transition-colors">
            {tag.title}
          </div>
          <div className="text-muted-foreground text-xs">
            {tag.description}
          </div>
        </button>
      ))}
    </div>
  );
}
