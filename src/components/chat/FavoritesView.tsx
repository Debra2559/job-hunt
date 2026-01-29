import { useState } from 'react';
import { Message, Conversation } from '@/types/chat';
import { ChatMessage } from './ChatMessage';
import { Bookmark, ArrowLeft, Search, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';
import { cn } from '@/lib/utils';

interface FavoriteItem {
  message: Message;
  conversationId: string;
  conversationTitle: string;
}

interface FavoritesViewProps {
  conversations: Conversation[];
  onToggleFavorite: (messageId: string) => void;
  onBack: () => void;
  onGoToConversation: (conversationId: string) => void;
  userId?: string;
}

export function FavoritesView({
  conversations,
  onToggleFavorite,
  onBack,
  onGoToConversation,
  userId,
}: FavoritesViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Collect all favorite messages with their conversation context
  const favoriteItems: FavoriteItem[] = conversations.flatMap((conv) =>
    conv.messages
      .filter((m) => m.isFavorite)
      .map((message) => ({
        message,
        conversationId: conv.id,
        conversationTitle: conv.title,
      }))
  );

  // Filter by search
  const filteredItems = searchQuery.trim()
    ? favoriteItems.filter((item) =>
        item.message.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.conversationTitle.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : favoriteItems;

  // Group by conversation
  const groupedByConversation = filteredItems.reduce((acc, item) => {
    if (!acc[item.conversationId]) {
      acc[item.conversationId] = {
        title: item.conversationTitle,
        messages: [],
      };
    }
    acc[item.conversationId].messages.push(item.message);
    return acc;
  }, {} as Record<string, { title: string; messages: Message[] }>);

  const conversationIds = Object.keys(groupedByConversation);

  return (
    <div className="flex-1 flex flex-col h-full bg-gradient-to-b from-background to-muted/30">
      {/* Header */}
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bookmark className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">我的收藏</h1>
                <p className="text-sm text-muted-foreground">
                  共 {favoriteItems.length} 条收藏
                </p>
              </div>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索收藏内容..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background/50"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {filteredItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4">
            <div className="text-center">
              <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-lg ring-4 ring-primary/20 mx-auto mb-6 opacity-50">
                <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
              </div>
              <h2 className="text-xl font-semibold text-muted-foreground mb-2">
                {searchQuery ? '未找到匹配的收藏' : '暂无收藏'}
              </h2>
              <p className="text-muted-foreground text-sm">
                {searchQuery
                  ? '试试其他关键词'
                  : '点击消息右侧的书签图标即可收藏'}
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-6 space-y-8">
            {conversationIds.map((convId) => {
              const group = groupedByConversation[convId];
              return (
                <div key={convId} className="space-y-4">
                  {/* Conversation header */}
                  <button
                    onClick={() => onGoToConversation(convId)}
                    className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors group"
                  >
                    <MessageSquare className="w-4 h-4" />
                    <span className="group-hover:underline">{group.title}</span>
                    <span className="text-xs">({group.messages.length})</span>
                  </button>

                  {/* Messages */}
                  <div className="space-y-4 pl-4 border-l-2 border-primary/20">
                    {group.messages.map((message) => (
                      <div key={message.id} className="relative">
                        <ChatMessage
                          message={message}
                          onToggleFavorite={onToggleFavorite}
                          userId={userId}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
