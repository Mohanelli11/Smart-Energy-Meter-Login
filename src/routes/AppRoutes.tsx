import React from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import { Dashboard } from '../components/Dashboard';
import { IndividualMeterView } from '../components/IndividualMeterView';
import { LoginPage } from '../components/LoginPage';
import { MeterLoginPage } from '../components/MeterLoginPage';
import { authService, useAuth, type NewAccountInput } from '../features/authentication';
import { toApiError } from '../services/api/client';
import { ProtectedRoute } from './ProtectedRoute';
import { ROUTES } from './route.config';

/** Sends people who are already signed in away from the login screens. */
function PublicOnly({ children, kind = 'user' }: { children: React.ReactNode; kind?: 'user' | 'meter' }) {
  const { status, user, meter } = useAuth();
  if (status === 'ready' && kind === 'user' && user) return <Navigate to={ROUTES.dashboard} replace />;
  if (status === 'ready' && kind === 'meter' && meter) return <Navigate to={ROUTES.meter} replace />;
  return <>{children}</>;
}

function DashboardRoute() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleCreateAccount = async (input: NewAccountInput): Promise<{ ok: true } | { ok: false; error: string }> => {
    try {
      await authService.createStaffAccount(input);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: toApiError(err).message };
    }
  };

  return (
    <Dashboard
      user={user}
      onLogout={async () => {
        await logout('user');
        navigate(ROUTES.login, { replace: true });
      }}
      onCreateAccount={handleCreateAccount}
      onMeterLogin={() => navigate(ROUTES.meterLogin)}
    />
  );
}

function MeterRoute() {
  const { meter, logout } = useAuth();
  const navigate = useNavigate();
  if (!meter) return null;
  return (
    <IndividualMeterView
      meter={meter}
      onLogout={async () => {
        await logout('meter');
        navigate(ROUTES.meterLogin, { replace: true });
      }}
    />
  );
}

export function AppRoutes() {
  return (
    <Routes>
      <Route
        path={ROUTES.login}
        element={
          <PublicOnly>
            <LoginPage />
          </PublicOnly>
        }
      />
      <Route
        path={ROUTES.meterLogin}
        element={
          <PublicOnly kind="meter">
            <MeterLoginPage />
          </PublicOnly>
        }
      />
      <Route
        path={ROUTES.dashboard}
        element={
          <ProtectedRoute>
            <DashboardRoute />
          </ProtectedRoute>
        }
      />
      <Route
        path={ROUTES.meter}
        element={
          <ProtectedRoute kind="meter">
            <MeterRoute />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to={ROUTES.dashboard} replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
