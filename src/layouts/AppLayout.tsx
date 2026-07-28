import React from 'react';
interface Props {
  children: React.ReactNode;
}
export function AppLayout({
  children
}: Props) {
  return <>{children}</>;
}