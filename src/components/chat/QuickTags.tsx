import { useState } from 'react';
import { quickTags } from '@/data/campusData';
import { cn } from '@/lib/utils';

interface QuickTagsProps {
  onTagClick: (message: string) => void;
  variant?: 'grid' | 'horizontal';
}

export function QuickTags({ onTagClick, variant = 'grid' }: QuickTagsProps) {
  const [clickedTagId, setClickedTagId] = useState<string | null>(null);

  const handleTagClick = (tagId: string, description: string) => {
    setClickedTagId(tagId);
    onTagClick(description);
    // Reset after animation
    setTimeout(() => setClickedTagId(null), 300);
  };

  if (variant === 'horizontal') {
    return (
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide animate-fade-in -mx-1 px-1">
        {quickTags.slice(0, 5).map((tag, index) => (
          <button
            key={tag.id}
            onClick={() => handleTagClick(tag.id, tag.description)}
            className={cn(
              "flex-shrink-0 p-3 sm:p-4 rounded-xl text-left transition-all duration-300",
              "bg-card border border-border/60",
              "hover:border-primary/40 hover:bg-accent/50",
              "active:scale-95",
              clickedTagId === tag.id && "scale-95 border-primary bg-primary/10"
            )}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={cn(
              "font-medium text-xs sm:text-sm mb-1 transition-colors duration-200",
              clickedTagId === tag.id ? "text-primary" : "text-foreground"
            )}>
              {tag.title}
            </div>
            <div className="text-muted-foreground text-[10px] sm:text-xs whitespace-nowrap">
              {tag.description}
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-4 max-w-2xl mx-auto animate-fade-in">
      {quickTags.slice(0, 4).map((tag, index) => (
        <button
          key={tag.id}
          onClick={() => handleTagClick(tag.id, tag.description)}
          className={cn(
            "group p-3 sm:p-5 rounded-xl sm:rounded-2xl text-left transition-all duration-300",
            "bg-card border border-border/60 shadow-elegant",
            "hover:border-primary/40 hover:shadow-lg hover:-translate-y-1",
            "hover:bg-gradient-to-br hover:from-white hover:to-accent/30",
            "active:scale-95",
            clickedTagId === tag.id && "scale-95 border-primary bg-primary/10"
          )}
          style={{ animationDelay: `${index * 80}ms` }}
        >
          <div className="flex-1">
            <div className={cn(
              "font-semibold text-xs sm:text-sm mb-1 sm:mb-1.5 transition-colors",
              clickedTagId === tag.id ? "text-primary" : "text-foreground group-hover:text-primary"
            )}>
              {tag.title}
            </div>
            <div className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed line-clamp-2">
              {tag.description}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
