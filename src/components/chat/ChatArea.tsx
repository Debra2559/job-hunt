import { useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { QuickTags } from './QuickTags';
import { ChatInput, ChatInputRef } from './ChatInput';
import { ThinkingIndicator } from './ThinkingIndicator';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string, files?: File[]) => void;
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
  const chatInputRef = useRef<ChatInputRef>(null);
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

  const handleTagClick = useCallback((text: string) => {
    chatInputRef.current?.fillInput(text);
  }, []);

  const handleToolSelect = useCallback((toolId: string, toolName: string) => {
    // Map tool IDs to prompts that will be sent to the AI
    const toolPrompts: Record<string, string> = {
      schedule: '请帮我查询本周的课表',
      grade: '请帮我分析一下我的历史成绩趋势',
      library: '请帮我查询图书借阅信息',
      repair: '我想提交一个宿舍报修申请',
    };
    
    const prompt = toolPrompts[toolId] || `请帮我使用${toolName}功能`;
    onSendMessage(prompt);
  }, [onSendMessage]);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-background to-muted/30 w-full min-w-0">
      {/* Messages Area */}
      <div ref={containerRef} className="flex-1 overflow-y-auto scroll-smooth">
        {showWelcome ? (
          <div className="h-full flex flex-col items-center justify-center px-4 pt-14 lg:pt-0">
            <div className="text-center mb-8 sm:mb-10 animate-fade-in max-w-md">
              {/* AI Teacher Avatar with soft blend */}
              <div className="relative mx-auto mb-5 sm:mb-6 w-20 h-20 sm:w-24 sm:h-24">
                {/* Soft glow background */}
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/30 to-secondary/20 blur-xl scale-125" />
                {/* Avatar container */}
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gradient-to-br from-background to-muted/50 p-0.5">
                  <div className="w-full h-full rounded-full overflow-hidden bg-background">
                    <img 
                      src={aiTeacherAvatar} 
                      alt="AI辅导员" 
                      className="w-full h-full object-cover scale-110"
                    />
                  </div>
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-2 sm:mb-3">
                Hi，{userName || '同学'}~
              </h1>
              <p className="text-muted-foreground text-base sm:text-lg px-4">
                我是你的校园AI辅导员，有什么可以帮助你的吗？
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 sm:py-8 px-3 sm:px-6 space-y-4 sm:space-y-6 pt-16 lg:pt-8">
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
          <QuickTags onTagClick={handleTagClick} variant="horizontal" />
        </div>
      )}

      {/* Input Area */}
      <ChatInput 
        ref={chatInputRef} 
        onSendMessage={onSendMessage} 
        isTyping={isTyping} 
        onToolSelect={handleToolSelect}
      />
    </div>
  );
}
