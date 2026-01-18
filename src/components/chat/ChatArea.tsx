import { useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { QuickTags } from './QuickTags';
import { ChatInput } from './ChatInput';
import { ThinkingIndicator } from './ThinkingIndicator';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onToggleFavorite: (id: string) => void;
  isTyping: boolean;
  userName?: string;
  userId?: string;
}

export function ChatArea({
  messages,
  onSendMessage,
  onToggleFavorite,
  isTyping,
  userName,
  userId,
}: ChatAreaProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevMessagesLengthRef = useRef(messages.length);

  const smoothScrollToBottom = useCallback(() => {
    if (!containerRef.current) return;
    
    const container = containerRef.current;
    const targetScroll = container.scrollHeight - container.clientHeight;
    const startScroll = container.scrollTop;
    const distance = targetScroll - startScroll;
    
    if (distance <= 0) return;
    
    const duration = Math.min(500, Math.max(200, distance * 0.5));
    const startTime = performance.now();
    
    const easeOutCubic = (t: number): number => 1 - Math.pow(1 - t, 3);
    
    const animateScroll = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOutCubic(progress);
      
      container.scrollTop = startScroll + distance * easedProgress;
      
      if (progress < 1) {
        requestAnimationFrame(animateScroll);
      }
    };
    
    requestAnimationFrame(animateScroll);
  }, []);

  useEffect(() => {
    // Only scroll when new messages are added
    if (messages.length > prevMessagesLengthRef.current) {
      // Small delay to allow DOM to update
      requestAnimationFrame(() => {
        smoothScrollToBottom();
      });
    }
    prevMessagesLengthRef.current = messages.length;
  }, [messages, smoothScrollToBottom]);

  // Also scroll when typing indicator appears
  useEffect(() => {
    if (isTyping) {
      requestAnimationFrame(() => {
        smoothScrollToBottom();
      });
    }
  }, [isTyping, smoothScrollToBottom]);

  const showWelcome = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scroll-smooth">
        {showWelcome ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center mb-10 animate-fade-in">
              {/* AI Teacher Avatar */}
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-primary/20 mx-auto mb-6">
                <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-3">
                Hi，{userName || '同学'}~
              </h1>
              <p className="text-muted-foreground text-lg">
                我是你的校园AI辅导员，有什么可以帮助你的吗？
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
            {messages.map((message, index) => (
              <ChatMessage
                key={message.id}
                message={message}
                onToggleFavorite={onToggleFavorite}
                userId={userId}
                isStreaming={isTyping && index === messages.length - 1}
              />
            ))}
            {/* Show thinking indicator when waiting for AI response */}
            {isTyping && messages.length > 0 && messages[messages.length - 1].role === 'user' && (
              <ThinkingIndicator />
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Quick Tags above input - only show when no messages */}
      {showWelcome && (
        <div className="max-w-3xl mx-auto w-full px-4 mb-3">
          <QuickTags onTagClick={onSendMessage} variant="horizontal" />
        </div>
      )}

      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} isTyping={isTyping} />
    </div>
  );
}
