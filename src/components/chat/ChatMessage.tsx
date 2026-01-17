import { Bookmark, BookmarkCheck } from 'lucide-react';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatMessageProps {
  message: Message;
  onToggleFavorite: (id: string) => void;
}

export function ChatMessage({ message, onToggleFavorite }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn(
        "group flex gap-3 animate-fade-in",
        isUser ? "justify-end" : "justify-start"
      )}
    >
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
          <span className="text-primary-foreground text-sm font-medium">AI</span>
        </div>
      )}
      
      <div
        className={cn(
          "max-w-[70%] rounded-2xl px-4 py-3 relative",
          isUser
            ? "bg-chat-user text-foreground"
            : "bg-chat-ai border border-border text-foreground shadow-sm"
        )}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        
        <button
          onClick={() => onToggleFavorite(message.id)}
          className={cn(
            "absolute -right-8 top-1/2 -translate-y-1/2 p-1 rounded-full transition-all",
            "opacity-0 group-hover:opacity-100",
            message.isFavorite 
              ? "text-primary" 
              : "text-muted-foreground hover:text-primary"
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
        <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
          <span className="text-accent-foreground text-sm font-medium">我</span>
        </div>
      )}
    </div>
  );
}
