import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, MessageSquare, Trash2, Pencil, Check, X, Settings, ChevronDown, Compass, Pin, FolderPlus, Folder, FolderOpen, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Conversation } from '@/types/chat';
import { UserProfile } from './UserProfile';
import aiTeacherAvatar from '@/assets/ai-teacher-avatar.png';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ConversationFolder } from '@/hooks/useConversationFolders';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

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
  // Folder props
  folders?: ConversationFolder[];
  onCreateFolder?: (name: string) => Promise<ConversationFolder | null>;
  onRenameFolder?: (id: string, name: string) => Promise<boolean>;
  onDeleteFolder?: (id: string) => Promise<boolean>;
  onMoveToFolder?: (conversationId: string, folderId: string | null) => Promise<boolean>;
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
  folders = [],
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveToFolder,
}: SidebarProps) {
  const navigate = useNavigate();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editingFolderId, setEditingFolderId] = useState<string | null>(null);
  const [editFolderName, setEditFolderName] = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);
  const newFolderInputRef = useRef<HTMLInputElement>(null);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    pinned: true,
    today: true,
    yesterday: true,
    week: true,
    older: true,
  });
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [draggedConvId, setDraggedConvId] = useState<string | null>(null);
  const [dragOverFolderId, setDragOverFolderId] = useState<string | null>(null);
  const [dragOverUnfolder, setDragOverUnfolder] = useState(false);

  // Separate career conversations from regular ones
  const { regularConversations } = useMemo(() => {
    const career: Conversation[] = [];
    const regular: Conversation[] = [];
    conversations.forEach(conv => {
      if (conv.groupId === 'career') career.push(conv);
      else regular.push(conv);
    });
    return { careerConversations: career, regularConversations: regular };
  }, [conversations]);

  // Conversations in folders vs ungrouped
  const { folderedConversations, unfolderedConversations } = useMemo(() => {
    const foldered: Record<string, Conversation[]> = {};
    const unfoldered: Conversation[] = [];

    regularConversations.forEach(conv => {
      if (conv.folderId) {
        if (!foldered[conv.folderId]) foldered[conv.folderId] = [];
        foldered[conv.folderId].push(conv);
      } else {
        unfoldered.push(conv);
      }
    });

    return { folderedConversations: foldered, unfolderedConversations: unfoldered };
  }, [regularConversations]);

  // Group unfoldered conversations by pinned + time
  const groupedConversations = useMemo((): ConversationGroup[] => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    const groups: Record<string, Conversation[]> = {
      pinned: [],
      today: [],
      yesterday: [],
      week: [],
      older: [],
    };

    unfolderedConversations.forEach((conv) => {
      if (conv.isPinned) {
        groups.pinned.push(conv);
        return;
      }
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
    if (groups.pinned.length > 0) result.push({ label: '📌 置顶', key: 'pinned', conversations: groups.pinned });
    if (groups.today.length > 0) result.push({ label: '今天', key: 'today', conversations: groups.today });
    if (groups.yesterday.length > 0) result.push({ label: '昨天', key: 'yesterday', conversations: groups.yesterday });
    if (groups.week.length > 0) result.push({ label: '过去7天', key: 'week', conversations: groups.week });
    if (groups.older.length > 0) result.push({ label: '更早', key: 'older', conversations: groups.older });

    return result;
  }, [unfolderedConversations]);

  const toggleGroup = (groupKey: string) => {
    setExpandedGroups((prev) => ({ ...prev, [groupKey]: !prev[groupKey] }));
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => ({ ...prev, [folderId]: !prev[folderId] }));
  };

  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (editingFolderId && folderInputRef.current) {
      folderInputRef.current.focus();
      folderInputRef.current.select();
    }
  }, [editingFolderId]);

  useEffect(() => {
    if (creatingFolder && newFolderInputRef.current) {
      newFolderInputRef.current.focus();
    }
  }, [creatingFolder]);

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
    if (e.key === 'Enter') handleConfirmEdit();
    else if (e.key === 'Escape') handleCancelEdit();
  };

  const handleCreateFolder = async () => {
    if (newFolderName.trim() && onCreateFolder) {
      await onCreateFolder(newFolderName.trim());
    }
    setCreatingFolder(false);
    setNewFolderName('');
  };

  const handleConfirmFolderEdit = async () => {
    if (editingFolderId && editFolderName.trim() && onRenameFolder) {
      await onRenameFolder(editingFolderId, editFolderName.trim());
    }
    setEditingFolderId(null);
    setEditFolderName('');
  };

  const renderConversationItem = useCallback((conv: Conversation) => (
    <div
      key={conv.id}
      className={cn("relative group", draggedConvId === conv.id && "opacity-40")}
      draggable
      onDragStart={(e) => {
        setDraggedConvId(conv.id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', conv.id);
      }}
      onDragEnd={() => {
        setDraggedConvId(null);
        setDragOverFolderId(null);
        setDragOverUnfolder(false);
      }}
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
          <button onClick={handleConfirmEdit} className="p-1.5 rounded-lg text-primary hover:bg-primary/10">
            <Check className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCancelEdit} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <>
          <button
            onClick={() => onSelectConversation(conv.id)}
            className={cn(
              "w-full px-3 py-2 rounded-xl flex items-center gap-3 text-sm transition-all duration-200 text-left pr-20",
              activeConversationId === conv.id
                ? "bg-primary/10 text-primary font-medium"
                : "hover:bg-sidebar-accent/70 text-sidebar-foreground"
            )}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate">{conv.title}</span>
          </button>

          {/* Action buttons with folder move */}
          <div
            className={cn(
              "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-0.5 transition-all duration-200",
              hoveredId === conv.id ? "opacity-100" : "opacity-0"
            )}
          >
            {/* More menu with folder move */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="p-1.5 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10">
                  <MoreHorizontal className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                {onPinConversation && (
                  <DropdownMenuItem onClick={() => onPinConversation(conv.id, !conv.isPinned)}>
                    <Pin className="w-3.5 h-3.5 mr-2" />
                    {conv.isPinned ? '取消置顶' : '置顶'}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => handleStartEdit(conv)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  重命名
                </DropdownMenuItem>
                {folders.length > 0 && onMoveToFolder && (
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <Folder className="w-3.5 h-3.5 mr-2" />
                      移动到分组
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {conv.folderId && (
                        <DropdownMenuItem onClick={() => onMoveToFolder(conv.id, null)}>
                          <X className="w-3.5 h-3.5 mr-2" />
                          移出分组
                        </DropdownMenuItem>
                      )}
                      {conv.folderId && folders.length > 0 && <DropdownMenuSeparator />}
                      {folders.map((folder) => (
                        <DropdownMenuItem
                          key={folder.id}
                          onClick={() => onMoveToFolder(conv.id, folder.id)}
                          disabled={conv.folderId === folder.id}
                        >
                          <Folder className="w-3.5 h-3.5 mr-2" />
                          {folder.name}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDeleteConversation(conv.id)}
                  className="text-destructive focus:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
    </div>
  ), [editingId, editTitle, hoveredId, activeConversationId, folders, onPinConversation, onMoveToFolder, onDeleteConversation, onSelectConversation, draggedConvId]);

  return (
    <div className="w-[280px] sm:w-72 h-full bg-gradient-to-b from-sidebar to-sidebar/95 flex flex-col border-r border-sidebar-border">
      {/* Header with AI Teacher Avatar */}
      <div className="p-5 flex items-center gap-3">
        <div className="relative w-11 h-11">
          <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/10 blur-md scale-125" />
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
          onClick={() => onNewConversation()}
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
          <div className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm bg-primary/10 text-primary font-medium animate-fade-in mb-2">
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="truncate text-muted-foreground italic">新对话</span>
          </div>
        )}

        {/* Career Planning Section */}
        <div className="mb-3">
          <button
            onClick={() => navigate('/career')}
            className="w-full px-3 py-2.5 rounded-xl flex items-center gap-3 text-sm transition-all duration-200 hover:bg-sidebar-accent/70 text-sidebar-foreground"
          >
            <Compass className="w-4 h-4 text-primary" />
            <span>职业规划</span>
            <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary font-medium">NEW</span>
          </button>
        </div>

        {/* No results */}
        {conversations.length === 0 && folders.length === 0 && (
          <div className="text-center py-8 text-sm text-muted-foreground">
            暂无对话
          </div>
        )}

        {/* User-defined Folders */}
        {folders.length > 0 && (
          <div className="space-y-1 mb-3">
            {folders.map((folder) => {
              const folderConvs = folderedConversations[folder.id] || [];
              const isExpanded = expandedFolders[folder.id] ?? true;

              return (
                <Collapsible
                  key={folder.id}
                  open={isExpanded}
                  onOpenChange={() => toggleFolder(folder.id)}
                >
                  <div className="group/folder flex items-center">
                    <CollapsibleTrigger className="flex items-center gap-2 flex-1 px-1 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                      <ChevronDown
                        className={cn(
                          "w-3.5 h-3.5 transition-transform duration-200",
                          !isExpanded && "-rotate-90"
                        )}
                      />
                      {isExpanded ? (
                        <FolderOpen className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <Folder className="w-3.5 h-3.5 text-primary" />
                      )}
                      {editingFolderId === folder.id ? (
                        <input
                          ref={folderInputRef}
                          type="text"
                          value={editFolderName}
                          onChange={(e) => setEditFolderName(e.target.value)}
                          onKeyDown={(e) => {
                            e.stopPropagation();
                            if (e.key === 'Enter') handleConfirmFolderEdit();
                            else if (e.key === 'Escape') {
                              setEditingFolderId(null);
                              setEditFolderName('');
                            }
                          }}
                          onBlur={handleConfirmFolderEdit}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 px-1 py-0.5 text-xs rounded bg-background border border-border focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                      ) : (
                        <>
                          <span className="font-medium">{folder.name}</span>
                          <span className="text-muted-foreground/60">({folderConvs.length})</span>
                        </>
                      )}
                    </CollapsibleTrigger>
                    {/* Folder actions */}
                    <div className="opacity-0 group-hover/folder:opacity-100 transition-opacity flex items-center gap-0.5 mr-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingFolderId(folder.id);
                          setEditFolderName(folder.name);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-primary hover:bg-primary/10"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteFolder?.(folder.id);
                        }}
                        className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <CollapsibleContent className="space-y-1 mt-1 ml-2">
                    {folderConvs.length === 0 ? (
                      <div className="text-xs text-muted-foreground/50 px-3 py-2">空分组</div>
                    ) : (
                      folderConvs.map((conv) => renderConversationItem(conv))
                    )}
                  </CollapsibleContent>
                </Collapsible>
              );
            })}
          </div>
        )}

        {/* Create folder input */}
        {creatingFolder && (
          <div className="flex items-center gap-1 px-2 py-1.5 mb-2">
            <Folder className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <input
              ref={newFolderInputRef}
              type="text"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreateFolder();
                else if (e.key === 'Escape') {
                  setCreatingFolder(false);
                  setNewFolderName('');
                }
              }}
              onBlur={handleCreateFolder}
              placeholder="分组名称"
              className="flex-1 px-2 py-1 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
        )}

        {/* New Folder Button */}
        {onCreateFolder && (
          <button
            onClick={() => setCreatingFolder(true)}
            className="w-full px-3 py-2 rounded-xl flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/70 transition-colors mb-3"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span>新建分组</span>
          </button>
        )}

        {/* Ungrouped conversations by time */}
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
                  {group.conversations.map((conv) => renderConversationItem(conv))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </div>

      {/* Admin Entry */}
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
