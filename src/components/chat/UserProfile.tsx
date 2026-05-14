import { LogOut, ChevronUp, Settings, LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ProfileEditor } from './ProfileEditor';

interface UserProfileProps {
  userId: string;
  college?: string;
  grade?: string;
  displayName?: string;
  avatarUrl?: string;
  onSignOut: () => void;
  onProfileUpdated: (profile: {
    display_name: string | null;
    avatar_url: string | null;
    college: string | null;
    grade: string | null;
  }) => void;
}

export function UserProfile({ 
  userId,
  college, 
  grade,
  displayName, 
  avatarUrl, 
  onSignOut,
  onProfileUpdated,
}: UserProfileProps) {
  const navigate = useNavigate();
  const name = displayName || '用户';

  if (!userId) {
    return (
      <div className="p-4 border-t border-sidebar-border/60">
        <button
          onClick={() => navigate('/auth')}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/70 transition-all duration-200 group"
        >
          <Avatar className="w-9 h-9 ring-2 ring-primary/20">
            <AvatarFallback className="gradient-primary text-white">
              <LogIn className="w-4 h-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 text-left min-w-0">
            <div className="text-sm font-medium text-sidebar-foreground">登录 / 注册</div>
            <div className="text-xs text-muted-foreground">点击进入登录页</div>
          </div>
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 border-t border-sidebar-border/60">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/70 transition-all duration-200 group">
            <Avatar className="w-9 h-9 ring-2 ring-primary/20">
              <AvatarImage src={avatarUrl} alt={name} />
              <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
                {name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {name}
              </div>
              {college && (
                <div className="text-xs text-muted-foreground truncate">
                  {college}
                </div>
              )}
            </div>
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56 bg-popover shadow-lg border border-border/60 rounded-xl p-1 mb-1">
          <ProfileEditor
            userId={userId}
            displayName={displayName}
            avatarUrl={avatarUrl}
            college={college}
            grade={grade}
            onProfileUpdated={onProfileUpdated}
          >
            <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="rounded-lg px-3 py-2.5 cursor-pointer">
              <Settings className="w-4 h-4 mr-2" />
              编辑资料
            </DropdownMenuItem>
          </ProfileEditor>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={onSignOut} className="text-destructive rounded-lg px-3 py-2.5 cursor-pointer hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
