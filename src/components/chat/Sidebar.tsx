import { useState } from 'react';
import { Search, Bookmark, FolderOpen, Plus, ChevronDown, MessageSquare, GraduationCap, Home, Heart, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { groups, initialConversations } from '@/data/campusData';
import { Conversation, Group } from '@/types/chat';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
}

const iconMap: Record<string, React.ReactNode> = {
  GraduationCap: <GraduationCap className="w-4 h-4" />,
  Home: <Home className="w-4 h-4" />,
  Heart: <Heart className="w-4 h-4" />,
  FileText: <FileText className="w-4 h-4" />,
};

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  showFavorites,
  onToggleFavorites,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedGroups, setExpandedGroups] = useState<string[]>(['academic', 'life', 'mental', 'admin']);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) =>
      prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId]
    );
  };

  const filteredConversations = conversations.filter((conv) =>
    conv.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="w-64 h-full bg-sidebar flex flex-col border-r border-sidebar-border">
      {/* Header */}
      <div className="p-4 flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-primary-foreground" />
        </div>
        <span className="font-semibold text-sidebar-foreground">校园AI辅导员</span>
      </div>

      {/* Search */}
      <div className="px-3 mb-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="搜索校园服务"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-sidebar-accent border-0 h-9 text-sm"
          />
        </div>
      </div>

      {/* Favorites */}
      <button
        onClick={onToggleFavorites}
        className={cn(
          "mx-3 mb-2 px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors",
          showFavorites
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "hover:bg-sidebar-accent text-sidebar-foreground"
        )}
      >
        <Bookmark className="w-4 h-4" />
        <span>全部收藏</span>
      </button>

      {/* Groups */}
      <div className="px-3 mb-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground uppercase tracking-wide mb-2">
          <span>分组</span>
          <button className="hover:text-foreground transition-colors">
            <Plus className="w-4 h-4" />
          </button>
        </div>
        {groups.map((group) => (
          <div key={group.id} className="mb-1">
            <button
              onClick={() => toggleGroup(group.id)}
              className="w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
            >
              {iconMap[group.icon]}
              <span className="flex-1 text-left">{group.name}</span>
              <ChevronDown
                className={cn(
                  "w-4 h-4 transition-transform",
                  expandedGroups.includes(group.id) ? "rotate-0" : "-rotate-90"
                )}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-3">
        <div className="text-xs text-muted-foreground uppercase tracking-wide mb-2">
          聊天
        </div>
        <div className="space-y-1">
          {filteredConversations.map((conv) => (
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "w-full px-3 py-2 rounded-lg flex items-center gap-2 text-sm transition-colors text-left",
                activeConversationId === conv.id
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "hover:bg-sidebar-accent/50 text-sidebar-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
        </div>
      </div>

      {/* New Conversation Button */}
      <div className="p-3 border-t border-sidebar-border">
        <button
          onClick={onNewConversation}
          className="w-full px-3 py-2 rounded-lg bg-primary text-primary-foreground flex items-center justify-center gap-2 text-sm font-medium hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          新对话
        </button>
      </div>
    </div>
  );
}
