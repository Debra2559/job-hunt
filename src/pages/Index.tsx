import { useState, useCallback, useRef } from 'react';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { Message, Conversation } from '@/types/chat';
import { initialConversations } from '@/data/campusData';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat } from '@/lib/chatApi';
import { toast } from 'sonner';

const Index = () => {
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Get all favorite messages
  const favoriteMessages = conversations.flatMap((conv) =>
    conv.messages.filter((m) => m.isFavorite)
  );

  const assistantContentRef = useRef<string>("");

  const handleSendMessage = useCallback(
    async (content: string) => {
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        role: 'user',
        content,
        timestamp: new Date(),
      };

      let targetConvId = activeConversationId;

      // If no active conversation, create one
      if (!targetConvId) {
        const newConv: Conversation = {
          id: `conv-${Date.now()}`,
          title: content.slice(0, 20) + (content.length > 20 ? '...' : ''),
          messages: [userMessage],
          groupId: 'academic',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        setConversations((prev) => [newConv, ...prev]);
        setActiveConversationId(newConv.id);
        targetConvId = newConv.id;
      } else {
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === targetConvId
              ? { ...conv, messages: [...conv.messages, userMessage], updatedAt: new Date() }
              : conv
          )
        );
      }

      setIsTyping(true);
      assistantContentRef.current = "";

      const assistantMessageId = `ai-${Date.now()}`;

      // Get conversation history for context
      const currentConv = conversations.find(c => c.id === targetConvId);
      const historyMessages = currentConv?.messages || [];
      const apiMessages = [
        ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content }
      ];

      await streamChat({
        messages: apiMessages,
        onDelta: (chunk) => {
          assistantContentRef.current += chunk;
          
          setConversations((prev) =>
            prev.map((conv) => {
              if (conv.id !== targetConvId) return conv;
              
              const existingAssistant = conv.messages.find(m => m.id === assistantMessageId);
              if (existingAssistant) {
                return {
                  ...conv,
                  messages: conv.messages.map(m =>
                    m.id === assistantMessageId
                      ? { ...m, content: assistantContentRef.current }
                      : m
                  ),
                  updatedAt: new Date(),
                };
              } else {
                return {
                  ...conv,
                  messages: [
                    ...conv.messages,
                    {
                      id: assistantMessageId,
                      role: 'assistant' as const,
                      content: assistantContentRef.current,
                      timestamp: new Date(),
                    },
                  ],
                  updatedAt: new Date(),
                };
              }
            })
          );
        },
        onDone: () => {
          setIsTyping(false);
        },
        onError: (error) => {
          setIsTyping(false);
          toast.error(error);
        },
      });
    },
    [activeConversationId, conversations]
  );

  const handleToggleFavorite = useCallback(
    (messageId: string) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === activeConversationId
            ? {
                ...conv,
                messages: conv.messages.map((m) =>
                  m.id === messageId ? { ...m, isFavorite: !m.isFavorite } : m
                ),
              }
            : conv
        )
      );
    },
    [activeConversationId]
  );

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setShowFavorites(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setShowFavorites(false);
  }, []);

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-md border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Sidebar */}
      <div
        className={cn(
          "fixed lg:relative z-40 h-full transition-transform duration-300",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <Sidebar
          conversations={conversations}
          activeConversationId={activeConversationId}
          onSelectConversation={handleSelectConversation}
          onNewConversation={handleNewConversation}
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Chat Area */}
      <ChatArea
        messages={showFavorites ? favoriteMessages : messages}
        onSendMessage={handleSendMessage}
        onToggleFavorite={handleToggleFavorite}
        isTyping={isTyping}
      />
    </div>
  );
};

export default Index;
