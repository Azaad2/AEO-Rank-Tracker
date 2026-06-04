import { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useUserRole } from '@/hooks/useUserRole';
import { Header } from '@/components/Header';
import type { AppRole } from '@/lib/admin';

interface AdminGuardProps {
  children: ReactNode;
  /** Required role. Defaults to 'admin'. */
  role?: AppRole;
}

/**
 * Wraps AuthGuard with a role check against the user_roles table.
 * Use this on every admin/staff page going forward.
 */
export function AdminGuard({ children, role = 'admin' }: AdminGuardProps) {
  return (
    <AuthGuard>
      <RoleGate role={role}>{children}</RoleGate>
    </AuthGuard>
  );
}

function RoleGate({ children, role }: { children: ReactNode; role: AppRole }) {
  const { roles, loading } = useUserRole();

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-yellow-400" />
      </div>
    );
  }

  if (!roles.includes(role)) {
    return (
      <div className="min-h-screen bg-black text-white">
        <Header />
        <main className="pt-32 px-6 max-w-3xl mx-auto">
          <h1 className="text-2xl text-yellow-400" style={{ fontFamily: "'Press Start 2P', cursive" }}>
            Forbidden
          </h1>
          <p className="text-gray-400 mt-3">
            This page requires the <code className="text-yellow-400">{role}</code> role.
          </p>
        </main>
      </div>
    );
  }

  return <>{children}</>;
}
