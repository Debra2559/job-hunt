import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserManagement } from '@/components/admin/UserManagement';
import { DataManagement } from '@/components/admin/DataManagement';
import { FeedbackManagement } from '@/components/admin/FeedbackManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { ArrowLeft, Users, BarChart3, MessageSquare, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Admin = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole(user?.id);
  const [activeTab, setActiveTab] = useState('users');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!authLoading && !roleLoading && user && !isAdmin) {
      navigate('/', { replace: true });
    }
  }, [authLoading, roleLoading, user, isAdmin, navigate]);

  if (authLoading || roleLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/')}
              className="hover:bg-muted"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">后台管理</h1>
              <p className="text-sm text-muted-foreground">
                {isSuperAdmin ? '超级管理员' : '管理员'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-2xl grid-cols-4 bg-muted/50">
            <TabsTrigger value="users" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              <span className="hidden sm:inline">用户管理</span>
            </TabsTrigger>
            <TabsTrigger value="data" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">数据管理</span>
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              <span className="hidden sm:inline">反馈管理</span>
            </TabsTrigger>
            {isSuperAdmin && (
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                <span className="hidden sm:inline">权限管理</span>
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="users" className="space-y-4">
            <UserManagement />
          </TabsContent>

          <TabsContent value="data" className="space-y-4">
            <DataManagement />
          </TabsContent>

          <TabsContent value="feedback" className="space-y-4">
            <FeedbackManagement />
          </TabsContent>

          {isSuperAdmin && (
            <TabsContent value="roles" className="space-y-4">
              <RoleManagement />
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Admin;
