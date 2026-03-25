import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/components/chat/Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { FavoritesView } from '@/components/chat/FavoritesView';
import { Message, Conversation, KnowledgeSource } from '@/types/chat';
import { Menu } from 'lucide-react';
import { cn } from '@/lib/utils';
import { streamChat } from '@/lib/chatApi';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { useConversations } from '@/hooks/useConversations';
import { useUserRole } from '@/hooks/useUserRole';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  display_name: string | null;
  avatar_url: string | null;
  is_verified: boolean;
  college: string | null;
  grade: string | null;
}

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
    deleteConversation,
    renameConversation,
    pinConversation,
  } = useConversations(user?.id);
  const { isAdmin, isSuperAdmin } = useUserRole(user?.id);

  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showFavorites, setShowFavorites] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const assistantContentRef = useRef<string>("");
  const assistantMessageIdRef = useRef<string | null>(null);
  const assistantSourcesRef = useRef<KnowledgeSource[]>([]);

  // Load user profile
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('display_name, avatar_url, is_verified, college, grade')
          .eq('user_id', user.id)
          .maybeSingle();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error('Error loading profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  const activeConversation = conversations.find((c) => c.id === activeConversationId);
  const messages = activeConversation?.messages || [];

  // Get all favorite messages
  const favoriteMessages = conversations.flatMap((conv) =>
    conv.messages.filter((m) => m.isFavorite)
  );

  const handleSendMessage = useCallback(
    async (content: string, files?: File[]) => {
      if (isTyping) return;
      
      // If not logged in, save pending message and redirect to auth
      if (!user) {
        sessionStorage.setItem('pendingMessage', content);
        navigate('/auth', { state: { from: '/' } });
        return;
      }
      
      // If files are attached, add file info to the message content
      let messageContent = content;
      if (files && files.length > 0) {
        const fileNames = files.map(f => f.name).join(', ');
        if (!content.trim()) {
          messageContent = `请分析这些文件: ${fileNames}`;
        }
      }

      let targetConvId = activeConversationId;
      let currentConv = conversations.find(c => c.id === targetConvId);

      // If no active conversation, create one first
      if (!targetConvId) {
        setIsTyping(true);
        const newConv = await createConversation(
          content.slice(0, 20) + (content.length > 20 ? '...' : '')
        );
        if (!newConv) {
          toast.error('创建对话失败');
          setIsTyping(false);
          return;
        }
        targetConvId = newConv.id;
        setActiveConversationId(newConv.id);
        currentConv = newConv;
      } else {
        setIsTyping(true);
      }

      // Add user message
      const userMsg = await addMessage(targetConvId, 'user', messageContent);
      if (!userMsg) {
        toast.error('发送消息失败');
        setIsTyping(false);
        return;
      }

      assistantContentRef.current = "";
      assistantSourcesRef.current = [];

      // Create placeholder for assistant message
      const tempAssistantId = `temp-ai-${Date.now()}`;
      assistantMessageIdRef.current = tempAssistantId;

      // Get conversation history for context (exclude temp messages)
      const historyMessages = currentConv?.messages.filter(m => !m.id.startsWith('temp-')) || [];
      const apiMessages = [
        ...historyMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
        { role: "user" as const, content: messageContent }
      ];

      await streamChat({
        messages: apiMessages,
        files: files,
        onDelta: (chunk) => {
          assistantContentRef.current += chunk;
          updateLocalMessage(targetConvId!, tempAssistantId, assistantContentRef.current, assistantSourcesRef.current);
        },
        onSources: (sources) => {
          assistantSourcesRef.current = sources;
          updateLocalMessage(targetConvId!, tempAssistantId, assistantContentRef.current, sources);
        },
        onDone: async () => {
          // Remove temp message first
          updateLocalMessage(targetConvId!, tempAssistantId, '');
          
          // Save the final assistant message to database
          if (assistantContentRef.current.trim()) {
            await addMessage(targetConvId!, 'assistant', assistantContentRef.current, assistantSourcesRef.current);
          }
          setIsTyping(false);
          assistantMessageIdRef.current = null;
        },
        onError: (error) => {
          updateLocalMessage(targetConvId!, tempAssistantId, '');
          setIsTyping(false);
          toast.error(error);
          assistantMessageIdRef.current = null;
        },
      });
    },
    [activeConversationId, conversations, user, createConversation, addMessage, updateLocalMessage, isTyping]
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

  const handleGoToConversationFromFavorites = useCallback((conversationId: string) => {
    setActiveConversationId(conversationId);
    setShowFavorites(false);
  }, []);

  const handleDeleteConversation = useCallback(async (id: string) => {
    const success = await deleteConversation(id);
    if (success) {
      toast.success('对话已删除');
      if (activeConversationId === id) {
        setActiveConversationId(null);
      }
    } else {
      toast.error('删除失败');
    }
  }, [deleteConversation, activeConversationId]);

  const handleRenameConversation = useCallback(async (id: string, newTitle: string) => {
    const success = await renameConversation(id, newTitle);
    if (success) {
      toast.success('标题已更新');
    } else {
      toast.error('重命名失败');
    }
  }, [renameConversation]);

  const handlePinConversation = useCallback(async (id: string, pinned: boolean) => {
    const success = await pinConversation(id, pinned);
    if (success) {
      toast.success(pinned ? '已置顶' : '已取消置顶');
    } else {
      toast.error('操作失败');
    }
  }, [pinConversation]);

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (error) {
      toast.error('退出登录失败');
    } else {
      toast.success('已退出登录');
      navigate('/auth', { replace: true });
    }
  };

  const handleVerified = () => {
    setProfile({ display_name: null, avatar_url: null, is_verified: true, college: null, grade: null });
    // Reload profile to get updated data
    if (user) {
      supabase
        .from('profiles')
        .select('display_name, avatar_url, is_verified, college, grade')
        .eq('user_id', user.id)
        .maybeSingle()
        .then(({ data }) => {
          if (data) setProfile(data);
        });
    }
  };

  const handleProfileUpdated = (updatedProfile: {
    display_name: string | null;
    avatar_url: string | null;
    college: string | null;
    grade: string | null;
  }) => {
    setProfile((prev) => prev ? { ...prev, ...updatedProfile } : null);
  };

  // Show loading while checking auth
  if (authLoading || convsLoading || profileLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // NOTE: route guarding is handled in App.tsx; Index assumes authenticated + verified.

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile Menu Button */}
      <button
        onClick={() => setSidebarOpen(!sidebarOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 rounded-xl bg-card/95 backdrop-blur-sm shadow-lg border border-border/60"
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
          onDeleteConversation={handleDeleteConversation}
          onRenameConversation={handleRenameConversation}
          onPinConversation={handlePinConversation}
          showFavorites={showFavorites}
          onToggleFavorites={() => setShowFavorites(!showFavorites)}
          userId={user?.id || ''}
          userName={profile?.display_name || undefined}
          userCollege={profile?.college || undefined}
          userGrade={profile?.grade || undefined}
          userAvatarUrl={profile?.avatar_url || undefined}
          onSignOut={handleSignOut}
          onProfileUpdated={handleProfileUpdated}
          isNewConversation={activeConversationId === null && !showFavorites}
          isAdmin={isAdmin || isSuperAdmin}
        />
      </div>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/20 z-30"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      {showFavorites ? (
        <FavoritesView
          conversations={conversations}
          onToggleFavorite={handleToggleFavorite}
          onBack={() => setShowFavorites(false)}
          onGoToConversation={handleGoToConversationFromFavorites}
          userId={user?.id}
        />
      ) : (
        <ChatArea
          messages={messages}
          onSendMessage={handleSendMessage}
          onToggleFavorite={handleToggleFavorite}
          isTyping={isTyping}
          userName={profile?.display_name || undefined}
          userId={user?.id}
        />
      )}
    </div>
  );
};

export default Index;
