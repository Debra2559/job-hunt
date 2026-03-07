import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Settings, ChevronDown, Compass, Pin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/chat';
import { UserProfile } from './UserProfile';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface ConversationGroup {
  label: string;
  key: string;
  conversations: Conversation[];
}

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onPinConversation?: (id: string, pinned: boolean) => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  userId: string;
  userName?: string;
  userCollege?: string;
  userGrade?: string;
  userAvatarUrl?: string;
  onSignOut: () => void;
  onProfileUpdated: (profile: {
    display_name: string | null;
    avatar_url: string | null;
    college: string | null;
    grade: string | null;
  }) => void;
  isNewConversation?: boolean;
  isAdmin?: boolean;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onRenameConversation,
  onPinConversation,
  showFavorites,
  onToggleFavorites,
  userId,
  userName,
  userCollege,
  userGrade,
  userAvatarUrl,
  onSignOut,
  onProfileUpdated,
  isNewConversation,
  isAdmin,
}: SidebarProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    pinned: true,
    today: true,
    yesterday: true,
    week: true,
    older: true,
  });

  // Group conversations by pinned + time
  const groupedConversations = useMemo((): ConversationGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<string, Conversation[]> = {
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    filteredConversations.forEach((conv) => {
      const convDate = new Date(conv.updatedAt);
      if (convDate >= today) {
        groups.today.push(conv);
      } else if (convDate >= yesterday) {
        groups.yesterday.push(conv);
      } else if (convDate >= weekAgo) {
        groups.week.push(conv);
      } else {
        groups.older.push(conv);
      }
    });

    const result: ConversationGroup[] = [];
    if (groups.today.length > 0) result.push({ label: '今天', key: 'today', conversations: groups.today });
    if (groups.yesterday.length > 0) result.push({ label: '昨天', key: 'yesterday', conversations: groups.yesterday });
    if (groups.week.length > 0) result.push({ label: '过去7天', key: 'week', conversations: groups.week });
    if (groups.older.length > 0) result.push({ label: '更早', key: 'older', conversations: groups.older });

    return result;
  }, [filteredConversations]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  const handleStartEdit = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditTitle(conv.title);
  };

  const handleConfirmEdit = () => {
    if (editingId && editTitle.trim()) {
      onRenameConversation(editingId, editTitle.trim());
    }
    setEditingId(null);
    setEditTitle('');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleConfirmEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  return (
    <div className="w-[280px] sm:w-72 h-full bg-gradient-to-b from-sidebar to-sidebar/95 flex flex-col border-r border-sidebar-border">
      {/* Header with AI Teacher Avatar */}
      <div className="p-5 flex items-center gap-3">
        <div className="relative w-11 h-11">
          {/* Soft glow background */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/10 blur-md scale-125" />
          {/* Avatar container */}
          <div className="relative w-11 h-11 rounded-full overflow-hidden bg-gradient-to-br from-background to-muted/30 p-0.5">
            <div className="w-full h-full rounded-full overflow-hidden bg-background">
              <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover scale-110" />
            </div>
          </div>
        </div>
        <span className="font-bold text-lg text-sidebar-foreground">AI辅导员</span>
      </div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <button
          onClick={() => {
            onNewConversation();
          }}
          className="group w-full px-4 py-3 rounded-xl gradient-primary text-white flex items-center justify-center gap-2 text-sm font-semibold shadow-glow hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.95]"
        >
          <Plus className="w-5 h-5 transition-transform duration-300 group-hover:rotate-90" />
          新建聊天
        </button>
      </div>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-4">
        {/* Temporary new conversation placeholder */}
        {isNewConversation && (
          <div
            className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm bg-primary/10 text-primary font-medium animate-fade-in mb-2"
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate text-muted-foreground italic">新对话</span>
          </div>
        )}

        {/* Career Planning Entry */}
        <button
          onClick={() => navigate('/career')}
          className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all duration-200 hover:bg-accent text-foreground border border-border hover:border-primary/30 mb-2"
        >
          <Compass className="w-4 h-4 text-primary" />
          <span>职业规划</span>
          <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">NEW</span>
        </button>
        
        {/* No results */}
        {filteredConversations.length === 0 && conversations.length > 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            未找到匹配的对话
          </div>
        )}
        
        {/* Grouped conversations */}
        <div className="space-y-3">
          {groupedConversations.map((group) => {
            const isExpanded = expandedGroups[group.key];
            
            return (
              <Collapsible
                key={group.key}
                open={isExpanded}
                onOpenChange={() => toggleGroup(group.key)}
              >
                <CollapsibleTrigger className="flex items-center gap-2 w-full px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                  <ChevronDown 
                    className={cn(
                      "w-3.5 h-3.5 transition-transform duration-200",
                      !isExpanded && "-rotate-90"
                    )} 
                  />
                  <span className="font-medium">{group.label}</span>
                  <span className="text-muted-foreground/60">({group.conversations.length})</span>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-1 mt-1">
                  {group.conversations.map((conv) => (
                    <div
                      key={conv.id}
                      className="relative group"
                      onMouseEnter={() => setHoveredId(conv.id)}
                      onMouseLeave={() => setHoveredId(null)}
                    >
                      {editingId === conv.id ? (
                        <div className="flex items-center gap-1 px-2 py-1.5">
                          <input
                            ref={inputRef}
                            type="text"
                            value={editTitle}
                            onChange={(e) => setEditTitle(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={handleConfirmEdit}
                            className="flex-1 px-2 py-1.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
                          />
                          <button
                            onClick={handleConfirmEdit}
                            className="p-1.5 rounded-lg text-primary hover:bg-primary/10"
                          >
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => onSelectConversation(conv.id)}
                            className={cn(
                              "w-full px-3 py-2 rounded-xl flex flex-col gap-1 text-sm transition-all duration-200 text-left pr-20",
                              activeConversationId === conv.id
                                ? "bg-primary/10 text-primary font-medium"
                                : "hover:bg-sidebar-accent/70 text-sidebar-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <MessageSquare className="w-4 h-4 flex-shrink-0" />
                              <span className="truncate">{conv.title}</span>
                            </div>
                            {/* Show assigned tags */}
                            {getConversationTags && (() => {
                              const convTags = getConversationTags(conv.id);
                              if (convTags.length === 0) return null;
                              return (
                                <div className="flex gap-1 ml-7 flex-wrap">
                                  {convTags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag.id}
                                      className="px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground"
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                  {convTags.length > 3 && (
                                    <span className="text-[10px] text-muted-foreground">+{convTags.length - 3}</span>
                                  )}
                                </div>
                              );
                            })()}
                          </button>
                          
                          {/* Action buttons */}
                          <div
                            className={cn(
                              "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all duration-200",
                              hoveredId === conv.id ? "opacity-100" : "opacity-0"
                            )}
                          >
                            {/* Tag selector */}
                            {onAssignTag && onRemoveTag && onCreateTag && getConversationTags && (
                              <ConversationTagSelector
                                conversationId={conv.id}
                                allTags={tags}
                                assignedTags={getConversationTags(conv.id)}
                                onAssignTag={onAssignTag}
                                onRemoveTag={onRemoveTag}
                                onCreateTag={onCreateTag}
                              />
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStartEdit(conv);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                onDeleteConversation(conv.id);
                              }}
                              className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Tag Manager */}
      {onCreateTag && onUpdateTag && onDeleteTag && (
        <div className="px-4 mb-2">
          <TagManager
            tags={tags}
            onCreateTag={onCreateTag}
            onUpdateTag={onUpdateTag}
            onDeleteTag={onDeleteTag}
            onReorderTags={onReorderTags}
          />
        </div>
      )}


      {/* Admin Entry - Above User Profile */}
      {isAdmin && (
        <div className="px-4 mb-2">
          <button
            onClick={() => navigate('/admin')}
            className="w-full px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all duration-200 hover:bg-primary/10 text-primary border border-primary/20"
          >
            <Settings className="w-4 h-4" />
            <span>后台管理</span>
          </button>
        </div>
      )}

      {/* User Profile at Bottom Left */}
      <UserProfile 
        userId={userId}
        college={userCollege}
        grade={userGrade}
        displayName={userName}
        avatarUrl={userAvatarUrl}
        onSignOut={onSignOut}
        onProfileUpdated={onProfileUpdated}
      />
    </div>
  );
}
