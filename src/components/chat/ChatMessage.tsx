import { useState } from 'react';
import { Bookmark, BookmarkCheck, ThumbsUp, ThumbsDown, FileText, ChevronDown, ChevronUp, X, Send, Volume2, Square } from 'lucide-react';
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

// Predefined feedback tags
const POSITIVE_TAGS = [
  { id: 'accurate', label: '回答准确' },
  { id: 'clear', label: '解释清晰' },
  { id: 'helpful', label: '很有帮助' },
  { id: 'fast', label: '响应迅速' },
  { id: 'professional', label: '专业可靠' },
];

const NEGATIVE_TAGS = [
  { id: 'inaccurate', label: '回答不准确' },
  { id: 'unclear', label: '解释不清' },
  { id: 'irrelevant', label: '答非所问' },
  { id: 'incomplete', label: '回答不完整' },
  { id: 'slow', label: '响应太慢' },
];

export function ChatMessage({ message, onToggleFavorite, userId, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === 'user';
  const [feedbackType, setFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [showFeedbackInput, setShowFeedbackInput] = useState(false);
  const [feedbackContent, setFeedbackContent] = useState('');
  const [pendingFeedbackType, setPendingFeedbackType] = useState<'positive' | 'negative' | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  
  const hasSources = message.sources && message.sources.length > 0;
  const isCurrentlyStreaming = isStreaming && message.id.startsWith('temp-');
  // Don't render empty messages
  if (!message.content || message.content.trim() === '') {
    return null;
  }

  const handlePlayTTS = () => {
    // Check if browser supports speech synthesis
    if (!('speechSynthesis' in window)) {
      toast.error('您的浏览器不支持语音朗读功能');
      return;
    }
    
    // If already playing, stop
    if (isPlaying) {
      window.speechSynthesis.cancel();
      setIsPlaying(false);
      return;
    }

    // Create utterance with message content
    const utterance = new SpeechSynthesisUtterance(message.content);
    utterance.lang = 'zh-CN'; // Chinese language
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Normal pitch
    
    // Try to find a Chinese voice
    const voices = window.speechSynthesis.getVoices();
    const chineseVoice = voices.find(voice => 
      voice.lang.includes('zh') || voice.lang.includes('CN')
    );
    if (chineseVoice) {
      utterance.voice = chineseVoice;
    }
    
    utterance.onstart = () => {
      setIsPlaying(true);
    };
    
    utterance.onend = () => {
      setIsPlaying(false);
    };
    
    utterance.onerror = (event) => {
      console.error('TTS Error:', event);
      setIsPlaying(false);
      if (event.error !== 'canceled') {
        toast.error('语音朗读失败');
      }
    };
    
    window.speechSynthesis.speak(utterance);
  };

  const handleFeedbackClick = (type: 'positive' | 'negative') => {
    if (!userId || submitting || message.id.startsWith('temp-')) return;
    
    // If clicking the same feedback, remove it
    if (feedbackType === type) {
      setFeedbackType(null);
      setShowFeedbackInput(false);
      return;
    }

    // Show input for both positive and negative feedback
    setPendingFeedbackType(type);
    setSelectedTags([]);
    setShowFeedbackInput(true);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(t => t !== tagId)
        : [...prev, tagId]
    );
  };

  const submitFeedback = async (type: 'positive' | 'negative', content: string, tags: string[]) => {
    if (!userId || submitting) return;

    setSubmitting(true);
    try {
      // Get user display name for notification
      const { data: profileData } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('user_id', userId)
        .single();

      const { data: feedbackData, error } = await supabase
        .from('feedbacks')
        .insert({
          user_id: userId,
          message_id: message.id,
          feedback_type: type,
          content: content || null,
          tags: tags.length > 0 ? tags : null,
        })
        .select()
        .single();

      if (error) throw error;
      
      // Send email notification for negative feedback
      if (type === 'negative' && feedbackData) {
        try {
          // Get admin notification emails from settings
          const { data: settingsData } = await supabase
            .from('system_settings')
            .select('value')
            .eq('key', 'admin_notification_emails')
            .single();

          const settingsValue = settingsData?.value as { emails?: string[] } | null;
          const adminEmails = settingsValue?.emails || [];
          
          if (adminEmails.length > 0) {
            await supabase.functions.invoke('send-feedback-notification', {
              body: {
                feedback_id: feedbackData.id,
                feedback_type: type,
                content: content,
                user_display_name: profileData?.display_name || '匿名用户',
                message_content: message.content,
                admin_emails: adminEmails,
              },
            });
          }
        } catch (notifyError) {
          // Don't fail the feedback submission if notification fails
          console.error('Failed to send notification:', notifyError);
        }
      }
      
      setFeedbackType(type);
      setShowFeedbackInput(false);
      setFeedbackContent('');
      setSelectedTags([]);
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
      submitFeedback(pendingFeedbackType, feedbackContent, selectedTags);
    }
  };

  const handleCancelFeedback = () => {
    setShowFeedbackInput(false);
    setFeedbackContent('');
    setSelectedTags([]);
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
          <div className="mt-3">
            <button
              onClick={() => setShowSources(!showSources)}
              className={cn(
                "inline-flex items-center gap-1.5 text-xs font-medium transition-all duration-200 px-3 py-1.5 rounded-full",
                showSources 
                  ? "bg-primary/10 text-primary border border-primary/20" 
                  : "text-muted-foreground hover:text-primary hover:bg-primary/5 border border-transparent"
              )}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>参考来源 ({message.sources!.length})</span>
              {showSources ? (
                <ChevronUp className="w-3 h-3 ml-0.5" />
              ) : (
                <ChevronDown className="w-3 h-3 ml-0.5" />
              )}
            </button>
            
            {showSources && (
              <div className="mt-2 overflow-hidden rounded-xl border border-border/40 bg-gradient-to-b from-muted/20 to-muted/40 backdrop-blur-sm">
                {message.sources!.map((source, index) => (
                  <div 
                    key={index} 
                    className={cn(
                      "flex items-center justify-between gap-3 px-4 py-2.5 transition-colors hover:bg-muted/30",
                      index !== message.sources!.length - 1 && "border-b border-border/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm truncate text-foreground/80">{source.fileName}</span>
                    </div>
                    <div className={cn(
                      "text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0",
                      source.similarity >= 0.9 
                        ? "bg-green-500/10 text-green-600" 
                        : source.similarity >= 0.7 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                    )}>
                      {(source.similarity * 100).toFixed(0)}%
                    </div>
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
                
                {/* TTS Play button */}
                <button
                  onClick={handlePlayTTS}
                  className={cn(
                    "p-1 rounded-md transition-all duration-200",
                    isPlaying
                      ? "text-primary bg-primary/10"
                      : "text-muted-foreground hover:text-primary hover:bg-primary/10"
                  )}
                  title={isPlaying ? "停止朗读" : "朗读"}
                >
                  {isPlaying ? (
                    <Square className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
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
          <div className={cn(
            "mt-2 p-3 rounded-lg border animate-fade-in",
            pendingFeedbackType === 'positive' 
              ? "bg-green-500/5 border-green-500/20" 
              : "bg-muted/50 border-border/50"
          )}>
            <div className="flex items-center gap-2 mb-2">
              {pendingFeedbackType === 'positive' ? (
                <>
                  <ThumbsUp className="w-4 h-4 text-green-500" />
                  <span className="text-sm font-medium text-green-600">好评反馈</span>
                  <span className="text-xs text-muted-foreground">(可选填写)</span>
                </>
              ) : (
                <>
                  <ThumbsDown className="w-4 h-4 text-red-500" />
                  <span className="text-sm font-medium text-red-600">改进建议</span>
                </>
              )}
            </div>
            
            {/* Tags selection */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {(pendingFeedbackType === 'positive' ? POSITIVE_TAGS : NEGATIVE_TAGS).map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={cn(
                    "px-2 py-0.5 text-xs rounded-full border transition-all",
                    selectedTags.includes(tag.id)
                      ? pendingFeedbackType === 'positive'
                        ? "bg-green-500 text-white border-green-500"
                        : "bg-red-500 text-white border-red-500"
                      : "bg-background hover:bg-muted border-border"
                  )}
                >
                  {tag.label}
                </button>
              ))}
            </div>
            
            <div className="flex items-start gap-2">
              <Textarea
                value={feedbackContent}
                onChange={(e) => setFeedbackContent(e.target.value)}
                placeholder={pendingFeedbackType === 'positive' 
                  ? "告诉我们您满意的地方...（可选）" 
                  : "请告诉我们哪里需要改进..."
                }
                className="min-h-[60px] text-sm resize-none"
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
                disabled={submitting || (pendingFeedbackType === 'negative' && !feedbackContent.trim() && selectedTags.length === 0)}
                className={pendingFeedbackType === 'positive' ? "bg-green-500 hover:bg-green-600" : ""}
              >
                <Send className="w-3.5 h-3.5 mr-1" />
                {pendingFeedbackType === 'positive' ? '提交好评' : '提交反馈'}
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
