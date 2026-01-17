import { Bookmark, BookmarkCheck, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

interface ChatMessageProps {
  message: Message;
  onToggleFavorite: (id: string) => void;
}

export function ChatMessage({ message, onToggleFavorite }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "group flex gap-4 animate-fade-in",
        isUser ? "justify-start" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-2 ring-primary/20 flex-shrink-0">
          <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[75%] rounded-2xl px-5 py-3.5 relative transition-all duration-200",
          isUser
            ? "bg-gradient-to-br from-accent to-accent/60 text-foreground shadow-sm"
            : "bg-card border border-border/60 text-foreground shadow-elegant"
        )}
      >
        {isUser ? (
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="prose prose-sm max-w-none text-sm leading-relaxed">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        
        <button
          onClick={() => onToggleFavorite(message.id)}
          className={cn(
            "absolute -right-10 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-all duration-200",
            "opacity-0 group-hover:opacity-100 hover:scale-110",
            message.isFavorite 
              ? "text-primary bg-primary/10" 
              : "text-muted-foreground hover:text-primary hover:bg-primary/10"
          )}
        >
          {message.isFavorite ? (
            <BookmarkCheck className="w-4 h-4" />
          ) : (
            <Bookmark className="w-4 h-4" />
          )}
        </button>
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-secondary to-muted flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-foreground text-sm font-semibold">我</span>
        </div>
      )}
    </div>
  );
}
