import { useRef, useEffect } from 'react';
import { Message } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { QuickTags } from './QuickTags';
import { ChatInput } from './ChatInput';
import { Sparkles } from 'lucide-react';

interface ChatAreaProps {
  messages: Message[];
  onSendMessage: (message: string) => void;
  onToggleFavorite: (id: string) => void;
  isTyping: boolean;
}

export function ChatArea({
  messages,
  onSendMessage,
  onToggleFavorite,
  isTyping,
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
              {/* Logo/Icon */}
              <div className="w-16 h-16 rounded-2xl gradient-primary shadow-glow flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-3">
                Hi，同学~
              </h1>
              <p className="text-muted-foreground text-lg">
                我是你的校园AI辅导员，有什么可以帮助你的吗？
              </p>
            </div>
            <QuickTags onTagClick={onSendMessage} />
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-8 px-6 space-y-6">
            {messages.map((message) => (
              <ChatMessage
                key={message.id}
                message={message}
                onToggleFavorite={onToggleFavorite}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} isTyping={isTyping} />
    </div>
  );
}
