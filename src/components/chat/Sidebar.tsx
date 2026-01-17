import { Bookmark, Plus, MessageSquare } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
  userEmail?: string;
  userName?: string;
  userAvatarUrl?: string;
  onSignOut: () => void;
}

const listVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 25,
    },
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: { duration: 0.2 }
  }
};

export function Sidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  showFavorites,
  onToggleFavorites,
  userEmail,
  userName,
  userAvatarUrl,
  onSignOut,
}: SidebarProps) {
  return (
    <div className="w-72 h-full bg-gradient-to-b from-sidebar to-sidebar/95 flex flex-col border-r border-sidebar-border">
      {/* Header with AI Teacher Avatar */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="p-5 flex items-center gap-3"
      >
        <motion.div 
          whileHover={{ scale: 1.05, rotate: 5 }}
          className="w-11 h-11 rounded-xl overflow-hidden shadow-md ring-2 ring-primary/20"
        >
          <img src={aiTeacherAvatar} alt="AI辅导员" className="w-full h-full object-cover" />
        </motion.div>
        <span className="font-bold text-lg text-sidebar-foreground">AI辅导员</span>
      </motion.div>

      {/* New Chat Button */}
      <div className="px-4 mb-4">
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            onNewConversation();
          }}
          className="group w-full px-4 py-3 rounded-xl gradient-primary text-white flex items-center justify-center gap-2 text-sm font-semibold shadow-glow hover:shadow-lg transition-all duration-300"
        >
          <motion.div
            whileHover={{ rotate: 90 }}
            transition={{ duration: 0.3 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
          新建聊天
        </motion.button>
      </div>

      {/* Favorites */}
      <motion.button
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.3 }}
        whileHover={{ x: 4 }}
        whileTap={{ scale: 0.98 }}
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
      </motion.button>

      {/* Conversations */}
      <div className="flex-1 overflow-y-auto px-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-xs text-muted-foreground uppercase tracking-wider mb-2 px-1"
        >
          聊天记录
        </motion.div>
        <motion.div 
          variants={listVariants}
          initial="hidden"
          animate="visible"
          className="space-y-1"
        >
          <AnimatePresence mode="popLayout">
            {conversations.map((conv) => (
              <motion.button
                key={conv.id}
                variants={itemVariants}
                layout
                whileHover={{ x: 4 }}
                whileTap={{ scale: 0.98 }}
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
              </motion.button>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* User Profile at Bottom Left */}
      <UserProfile 
        email={userEmail}
        displayName={userName}
        avatarUrl={userAvatarUrl}
        onSignOut={onSignOut}
      />
    </div>
  );
}
