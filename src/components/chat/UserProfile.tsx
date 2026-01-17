import { LogOut, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserProfileProps {
  email?: string;
  avatarUrl?: string;
  onSignOut: () => void;
}

export function UserProfile({ email, avatarUrl, onSignOut }: UserProfileProps) {
  const displayName = email?.split('@')[0] || '用户';
  
  return (
    <div className="p-4 border-t border-sidebar-border/60">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-sidebar-accent/70 transition-all duration-200 group">
            <Avatar className="w-9 h-9 ring-2 ring-primary/20">
              <AvatarImage src={avatarUrl} alt={displayName} />
              <AvatarFallback className="gradient-primary text-white text-sm font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-medium text-sidebar-foreground truncate">
                {displayName}
              </div>
              <div className="text-xs text-muted-foreground truncate">
                {email}
              </div>
            </div>
            <ChevronUp className="w-4 h-4 text-muted-foreground group-hover:text-sidebar-foreground transition-colors" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" side="top" className="w-56 bg-popover shadow-lg border border-border/60 rounded-xl p-1 mb-1">
          <DropdownMenuItem onClick={onSignOut} className="text-destructive rounded-lg px-3 py-2.5 cursor-pointer hover:bg-destructive/10">
            <LogOut className="w-4 h-4 mr-2" />
            退出登录
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
