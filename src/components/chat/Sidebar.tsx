import { useState } from 'react';
import { Bookmark, Plus, ChevronDown, MessageSquare, GraduationCap, Home, Heart, FileText, Briefcase, Book, Users, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/chat';
import { UserProfile } from './UserProfile';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  showFavorites: boolean;
  onToggleFavorites: () => void;
  userName?: string;
  userCollege?: string;
  userAvatarUrl?: string;
  onSignOut: () => void;
  isNewConversation?: boolean;
}

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  showFavorites,
  onToggleFavorites,
  userName,
  userCollege,
  userAvatarUrl,
  onSignOut,
  isNewConversation,
}: SidebarProps) {
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
            <button
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className={cn(
                "w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all duration-200 text-left",
                activeConversationId === conv.id
                  ? "bg-primary/10 text-primary font-medium"
                  : "hover:bg-sidebar-accent/70 text-sidebar-foreground"
              )}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">{conv.title}</span>
            </button>
          ))}
        </div>
      </div>

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
