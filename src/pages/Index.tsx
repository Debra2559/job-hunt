import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { Message, Conversation } from '@/types/chat';
import { Menu, LogOut, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat } from '@/lib/chatApi';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    conversations,
    loading: convsLoading,
    createConversation,
    addMessage,
    updateMessageContent,
    toggleFavorite,
    updateLocalMessage,
  } = useConversations(user?.id);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const assistantContentRef = useRef<string>("");
  const assistantMessageIdRef = useRef<string | null>(null);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Get all favorite messages
  const favoriteMessages = conversations.flatMap((conv) =>
    conv.messages.filter((m) => m.isFavorite)
  );

  const handleSendMessage = useCallback(
    async (content: string) => {
      if (!user) return;

      let targetConvId = activeConversationId;
      let currentConv = conversations.find(c => c.id === targetConvId);

      // If no active conversation, create one
      if (!targetConvId) {
        const newConv = await createConversation(
          content.slice(0, 20) + (content.length > 20 ? '...' : '')
        );
        if (!newConv) {
          toast.error('创建对话失败');
          return;
        }
        targetConvId = newConv.id;
        setActiveConversationId(newConv.id);
        currentConv = newConv;
      }

      // Add user message
      const userMsg = await addMessage(targetConvId, 'user', content);
      if (!userMsg) {
        toast.error('发送消息失败');
        return;
      }

      setIsTyping(true);
      assistantContentRef.current = "";

      // Create placeholder for assistant message
      const tempAssistantId = `temp-ai-${Date.now()}`;
      assistantMessageIdRef.current = tempAssistantId;

      // Get conversation history for context
      const historyMessages = currentConv?.messages || [];
      const apiMessages = [
        ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content }
      ];

      await streamChat({
        messages: apiMessages,
        onDelta: (chunk) => {
          assistantContentRef.current += chunk;
          updateLocalMessage(targetConvId!, tempAssistantId, assistantContentRef.current);
        },
        onDone: async () => {
          // Save the final assistant message to database
          if (assistantContentRef.current.trim()) {
            const savedMsg = await addMessage(targetConvId!, 'assistant', assistantContentRef.current);
            if (savedMsg) {
              // Update local state to use the real message ID
              updateLocalMessage(targetConvId!, tempAssistantId, '');
            }
          }
          setIsTyping(false);
          assistantMessageIdRef.current = null;
        },
        onError: (error) => {
          setIsTyping(false);
          toast.error(error);
          assistantMessageIdRef.current = null;
        },
      });
    },
    [activeConversationId, conversations, user, createConversation, addMessage, updateLocalMessage]
  );

  const handleToggleFavorite = useCallback(
    (messageId: string) => {
      toggleFavorite(messageId);
    },
    [toggleFavorite]
  );

  const handleNewConversation = useCallback(() => {
    setActiveConversationId(null);
    setShowFavorites(false);
  }, []);

  const handleSelectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    setShowFavorites(false);
  }, []);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('退出登录失败');
    } else {
      toast.success('已退出登录');
      navigate('/auth', { replace: true });
    }
  };

  // Show loading while checking auth
  if (authLoading || convsLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-card shadow-md border border-border"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* User Menu - Top Right */}
      <div className="fixed top-4 right-4 z-50">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card shadow-md border border-border hover:bg-accent transition-colors">
              <User className="w-4 h-4" />
              <span className="text-sm hidden sm:inline">{user?.email?.split('@')[0] || '用户'}</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-popover">
            <DropdownMenuItem onClick={handleSignOut} className="text-destructive">
              <LogOut className="w-4 h-4 mr-2" />
              退出登录
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

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
