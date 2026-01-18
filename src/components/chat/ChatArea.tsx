import { useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { QuickTags } from './QuickTags';
import { ChatInput } from './ChatInput';
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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const showWelcome = messages.length === 0;

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto">
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
