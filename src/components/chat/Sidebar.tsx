import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bookmark, Plus, MessageSquare, Trash2, Pencil, Check, X, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/chat';
import { UserProfile } from './UserProfile';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  userName?: string;
  userCollege?: string;
  userAvatarUrl?: string;
  onSignOut: () => void;
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
  showFavorites,
  onToggleFavorites,
  userName,
  userCollege,
  userAvatarUrl,
  onSignOut,
  isNewConversation,
  isAdmin,
}: SidebarProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

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
    <div className="w-72 h-full bg-gradient-to-b from-sidebar to-sidebar/95 flex flex-col border-r border-sidebar-border">
      {/* Header with AI Teacher Avatar */}
      <div className="p-5 flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl overflow-hidden shadow-md ring-2 ring-primary/20">
          <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
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


      {/* Favorites */}
      <button
        onClick={onToggleFavorites}
        className={cn(
          "mx-4 mb-3 px-4 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all duration-200",
          showFavorites
            ? "bg-primary/10 text-primary font-medium"
            : "hover:bg-sidebar-accent text-sidebar-foreground"
        )}
      >
        <Bookmark className="w-4 h-4" />
        <span>全部收藏</span>
      </button>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-4">
        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1">
          聊天记录
        </div>
        <div className="space-y-1">
          {/* Temporary new conversation placeholder */}
          {isNewConversation && (
            <div
              className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm bg-primary/10 text-primary font-medium animate-fade-in"
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate text-muted-foreground italic">新对话</span>
            </div>
          )}
          {conversations.map((conv) => (
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
                      "w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all duration-200 text-left pr-16",
                      activeConversationId === conv.id
                        ? "bg-primary/10 text-primary font-medium"
                        : "hover:bg-sidebar-accent/70 text-sidebar-foreground"
                    )}
                  >
                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{conv.title}</span>
                  </button>
                  
                  {/* Action buttons */}
                  <div
                    className={cn(
                      "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all duration-200",
                      hoveredId === conv.id ? "opacity-100" : "opacity-0"
                    )}
                  >
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
        </div>
      </div>

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
        college={userCollege}
        displayName={userName}
        avatarUrl={userAvatarUrl}
        onSignOut={onSignOut}
      />
    </div>
  );
}
