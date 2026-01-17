import { useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
}

export function ChatArea({
  messages,
  onSendMessage,
  onToggleFavorite,
  isTyping,
  userName,
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
        <AnimatePresence mode="wait">
          {showWelcome ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="h-full flex flex-col items-center justify-center px-4"
            >
              <div className="text-center mb-10">
                {/* AI Teacher Avatar */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-primary/20 mx-auto mb-6"
                >
                  <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                  className="text-3xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-3"
                >
                  Hi，{userName || '同学'}~
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3, duration: 0.4 }}
                  className="text-muted-foreground text-lg"
                >
                  我是你的校园AI辅导员，有什么可以帮助你的吗？
                </motion.p>
              </div>
              <QuickTags onTagClick={onSendMessage} />
            </motion.div>
          ) : (
            <motion.div
              key="messages"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="max-w-3xl mx-auto py-8 px-6 space-y-6"
            >
              {messages.map((message) => (
                <ChatMessage
                  key={message.id}
                  message={message}
                  onToggleFavorite={onToggleFavorite}
                />
              ))}
              <div ref={messagesEndRef} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Input Area */}
      <ChatInput onSendMessage={onSendMessage} isTyping={isTyping} />
    </div>
  );
}
