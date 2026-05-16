import { useState, useEffect } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { UserManagement } from '@/components/admin/UserManagement';
import { DataManagement } from '@/components/admin/DataManagement';
import { FeedbackManagement } from '@/components/admin/FeedbackManagement';
import { RoleManagement } from '@/components/admin/RoleManagement';
import { KnowledgeManagement } from '@/components/admin/KnowledgeManagement';
import { NotificationSettings } from '@/components/admin/NotificationSettings';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

const VALID_TABS = ['users', 'data', 'feedback', 'knowledge', 'notifications', 'roles'];

const Admin = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isSuperAdmin, loading: roleLoading } = useUserRole(user?.id);
  const initialTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(
    initialTab && VALID_TABS.includes(initialTab) ? initialTab : 'users'
  );

  // Keep URL ?tab= in sync so deep links from admin emails open the right tab
  useEffect(() => {
    const current = searchParams.get('tab');
    if (current !== activeTab) {
      const next = new URLSearchParams(searchParams);
      next.set('tab', activeTab);
      setSearchParams(next, { replace: true });
    }
  }, [activeTab, searchParams, setSearchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { replace: true });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    // Only redirect if we've finished loading and confirmed user is not admin
    if (!authLoading && !roleLoading && user && !isAdmin) {
      // Add a small delay to ensure role is properly loaded
      const timer = setTimeout(() => {
        if (!isAdmin) {
          navigate('/', { replace: true });
        }
      }, 500);
      return () => clearTimeout(timer);
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

  const renderContent = () => {
    switch (activeTab) {
      case 'users':
        return <UserManagement />;
      case 'data':
        return <DataManagement />;
      case 'feedback':
        return <FeedbackManagement />;
      case 'knowledge':
        return <KnowledgeManagement />;
      case 'notifications':
        return <NotificationSettings />;
      case 'roles':
        return isSuperAdmin ? <RoleManagement /> : null;
      default:
        return <UserManagement />;
    }
  };

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isSuperAdmin={isSuperAdmin}
        onBack={() => navigate('/')}
      />
      
      <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto pt-16 lg:pt-8">
        {/* Mobile back button */}
        <div className="lg:hidden flex items-center gap-2 mb-4 -mt-2">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>返回前台</span>
          </button>
        </div>
        {renderContent()}
      </main>
    </div>
  );
};

export default Admin;
