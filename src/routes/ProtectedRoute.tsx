import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2Icon, ShieldAlertIcon } from 'lucide-react';
import { useAuth } from '../features/authentication/hooks/useAuth';
import { hasRole, type Role, type SessionKind } from '../features/authentication/types';

interface Props {
  children: React.ReactNode;
  /** Which kind of session is required. Defaults to a staff/admin session. */
  kind?: SessionKind;
  /** Restrict to these roles (staff sessions only). */
  roles?: Role[];
}

export function ProtectedRoute({ children, kind = 'user', roles }: Props) {
  const { status, user, meter } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" role="status" aria-live="polite">
        <Loader2Icon className="h-8 w-8 text-blue-600 animate-spin" aria-hidden="true" />
        <span className="sr-only">Checking your session…</span>
      </div>
    );
  }

  const signedIn = kind === 'meter' ? meter !== null : user !== null;
  if (!signedIn) {
    const to = kind === 'meter' ? '/meter-login' : '/login';
    return <Navigate to={to} replace state={{ from: location.pathname }} />;
  }

  if (kind === 'user' && roles && !hasRole(user?.role, roles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md bg-white rounded-lg shadow p-8 text-center">
          <ShieldAlertIcon className="h-10 w-10 text-red-500 mx-auto mb-3" aria-hidden="true" />
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access denied</h1>
          <p className="text-gray-600">Your account doesn't have permission to view this page.</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
