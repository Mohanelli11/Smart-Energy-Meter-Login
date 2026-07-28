import { Role } from '../types';
export function canAccessRole(userRole: Role | undefined, allowedRoles: Role[]): boolean {
  if (!userRole) {
    return false;
  }
  return allowedRoles.includes(userRole);
}