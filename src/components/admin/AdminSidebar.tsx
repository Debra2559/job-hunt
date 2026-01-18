import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  BarChart3, 
  MessageSquare, 
  Shield, 
  BookOpen,
  ArrowLeft,
  Settings
} from 'lucide-react';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  isSuperAdmin: boolean;
  onBack: () => void;
}

const menuItems = [
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'data', label: '数据管理', icon: BarChart3 },
  { id: 'feedback', label: '反馈管理', icon: MessageSquare },
  { id: 'knowledge', label: '知识库', icon: BookOpen },
  { id: 'notifications', label: '通知设置', icon: Settings },
];

const superAdminItems = [
  { id: 'roles', label: '权限管理', icon: Shield },
];

export const AdminSidebar = ({ 
  activeTab, 
  onTabChange, 
  isSuperAdmin,
  onBack 
}: AdminSidebarProps) => {
  const allItems = isSuperAdmin 
    ? [...menuItems, ...superAdminItems] 
    : menuItems;

  return (
    <div className="w-64 min-h-screen bg-sidebar-background border-r border-sidebar-border flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="hover:bg-sidebar-accent shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Settings className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-sidebar-foreground">后台管理</h1>
              <p className="text-xs text-muted-foreground">
                {isSuperAdmin ? '超级管理员' : '管理员'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        {allItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
              activeTab === item.id
                ? 'bg-sidebar-accent text-sidebar-primary'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        <p className="text-xs text-muted-foreground text-center">
          AI校园助手管理后台
        </p>
      </div>
    </div>
  );
};
