import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useVerifiedProfile } from '@/hooks/useVerifiedProfile';

function FullPageLoading({ label }: { label?: string }) {
  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        {label ? <p className="text-muted-foreground">{label}</p> : null}
      </div>
    </div>
  );
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useVerifiedProfile(user?.id);

  if (authLoading || profileLoading) return <FullPageLoading label="加载中..." />;

  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  if (!profile?.is_verified) {
    return <Navigate to="/auth" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}

export function AuthRoute({ children }: { children: ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: profileLoading } = useVerifiedProfile(user?.id);

  if (authLoading || profileLoading) return <FullPageLoading />;

  if (user && profile?.is_verified) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
