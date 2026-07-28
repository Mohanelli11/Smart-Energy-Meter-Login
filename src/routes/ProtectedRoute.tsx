import React from 'react';
import { useAuth } from '../features/authentication/hooks/useAuth';
interface Props {
  children: React.ReactNode;
}
export function ProtectedRoute({
  children
}: Props) {
  const {
    isAuthenticated
  } = useAuth();
  if (!isAuthenticated) {
    return null;
  }
  return <>{children}</>;
}