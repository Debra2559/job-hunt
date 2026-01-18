import { useState } from 'react';
import { Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, FileText, ChevronDown, ChevronUp, X, Send } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '@/types/chat';
import { cn } from '@/lib/utils';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ChatMessageProps {
  message: Message;
  onToggleFavorite: (id: string) => void;
  userId?: string;
  isStreaming?: boolean;
}

function formatTime(date: Date | undefined): string {
  if (!date) return '';
  try {
    return format(date, 'HH:mm');
  } catch {
    return '';
  }
}

export function ChatMessage({ message, onToggleFavorite, userId, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [pendingFeedbackType, setPendingFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const hasSources = message.sources && message.sources.length > 0;
  const isCurrentlyStreaming = isStreaming && message.id.startsWith('temp-');

  // Don't render empty messages
  if (!message.content || message.content.trim() === '') {
    return null;
  }

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    if (!userId || submitting || message.id.startsWith('temp-')) return;
    
    // If clicking the same feedback, remove it
    if (feedbackType === type) {
      setFeedbackType(null);
      setShowFeedbackInput(false);
      return;
    }

    // For negative feedback, show input first
    if (type === 'negative') {
      setPendingFeedbackType(type);
      setShowFeedbackInput(true);
    } else {
      // For positive, submit directly
      submitFeedback(type, '');
    }
  };

  const submitFeedback = async (type: 'positive' | 'negative', content: string) => {
    if (!userId || submitting) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: userId,
          message_id: message.id,
          feedback_type: type,
          content: content || null,
        });

      if (error) throw error;
      
      setFeedbackType(type);
      setShowFeedbackInput(false);
      setFeedbackContent('');
      setPendingFeedbackType(null);
      toast.success(type === 'positive' ? '感谢您的好评！' : '感谢您的反馈，我们会继续改进');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('反馈提交失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFeedback = () => {
    if (pendingFeedbackType) {
      submitFeedback(pendingFeedbackType, feedbackContent);
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedbackInput(false);
    setFeedbackContent('');
    setPendingFeedbackType(null);
  };

  return (
    <div
      className={cn(
        "group flex gap-3",
        isUser ? "justify-end animate-pop-in" : "justify-start animate-fade-in"
      )}
    >
      {!isUser && (
        <div className="w-9 h-9 rounded-xl overflow-hidden shadow-md ring-2 ring-primary/20 flex-shrink-0">
          <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
        </div>
      )}
      
      <div className="flex flex-col gap-1">
        <div
          className={cn(
            "max-w-full rounded-2xl px-5 py-3.5 relative transition-all duration-200",
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
              {isCurrentlyStreaming && (
                <span className="inline-block w-2 h-4 ml-0.5 bg-primary/80 animate-pulse rounded-sm" />
              )}
            </div>
          )}
        </div>
        
        {/* Knowledge Sources for AI messages */}
        {!isUser && hasSources && (
          <div className="mt-2">
            <button
              onClick={() => setShowSources(!showSources)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>参考来源 ({message.sources!.length})</span>
              {showSources ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
            
            {showSources && (
              <div className="mt-2 p-2.5 bg-muted/50 rounded-lg space-y-1.5">
                {message.sources!.map((source, index) => (
                  <div key={index} className="flex items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FileText className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                      <span className="truncate font-medium">{source.fileName}</span>
                    </div>
                    <Badge variant="secondary" className="text-[10px] px-1.5 py-0 flex-shrink-0">
                      {(source.similarity * 100).toFixed(0)}%
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Actions and Timestamp for AI messages */}
        {!isUser && (
          <div className="flex items-center gap-2 px-1">
            <span className="text-[10px] text-muted-foreground/60">
              {formatTime(message.timestamp)}
            </span>
            
            {/* Feedback buttons */}
            {!message.id.startsWith('temp-') && (
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleFeedbackClick('positive')}
                  disabled={submitting}
                  className={cn(
                    "p-1 rounded-md transition-all duration-200",
                    feedbackType === 'positive'
                      ? "text-green-500 bg-green-500/10"
                      : "text-muted-foreground hover:text-green-500 hover:bg-green-500/10"
                  )}
                  title="有帮助"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleFeedbackClick('negative')}
                  disabled={submitting}
                  className={cn(
                    "p-1 rounded-md transition-all duration-200",
                    feedbackType === 'negative'
                      ? "text-red-500 bg-red-500/10"
                      : "text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                  )}
                  title="需改进"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
                
                {/* Favorite button */}
                <button
                  onClick={() => onToggleFavorite(message.id)}
                  className={cn(
                    "p-1 rounded-md transition-all duration-200",
                    message.isFavorite 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                  title="收藏"
                >
                  {message.isFavorite ? (
                    <BookmarkCheck className="w-3.5 h-3.5" />
                  ) : (
                    <Bookmark className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Feedback input form */}
        {showFeedbackInput && (
          <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border/50 animate-fade-in">
            <div className="flex items-start gap-2">
              <Textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder="请告诉我们哪里需要改进..."
                className="min-h-[60px] text-sm resize-none"
                autoFocus
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCancelFeedback}
                disabled={submitting}
              >
                <X className="w-3.5 h-3.5 mr-1" />
                取消
              </Button>
              <Button
                size="sm"
                onClick={handleSubmitFeedback}
                disabled={submitting || !feedbackContent.trim()}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                提交反馈
              </Button>
            </div>
          </div>
        )}
        
        {/* Timestamp for user messages */}
        {isUser && (
          <span className="text-[10px] text-muted-foreground/60 px-2 text-right">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>

      {isUser && (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center flex-shrink-0 shadow-sm">
          <span className="text-primary-foreground text-sm font-semibold">我</span>
        </div>
      )}
    </div>
  );
}
