import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

export function ThinkingIndicator() {
  return (
    <div className="flex gap-3 justify-start animate-fade-in">
      <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-2 ring-primary/20 flex-shrink-0">
        <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
      </div>
      
      <div className="flex flex-col gap-1">
        <div className="bg-card border border-border/60 rounded-2xl px-5 py-4 shadow-elegant">
          <div className="flex items-center gap-1.5">
            <span
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce-dot"
              style={{ animationDelay: '0ms' }}
            />
            <span
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce-dot"
              style={{ animationDelay: '150ms' }}
            />
            <span
              className="w-2 h-2 bg-primary/70 rounded-full animate-bounce-dot"
              style={{ animationDelay: '300ms' }}
            />
          </div>
        </div>
        <span className="text-[10px] text-muted-foreground/60 px-1">
          正在思考...
        </span>
      </div>
    </div>
  );
}
