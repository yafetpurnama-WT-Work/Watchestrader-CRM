'use client'

import { useAuth } from '@/hooks/use-auth'

/**
 * Hook for checking user permissions (RBAC).
 * Returns utility functions: can, canAny, canAll, hasRole, and roleLevel.
 */
export function usePermissions() {
  const { profile } = useAuth()

  const userPermissions: string[] =
    (profile as any)?.role_relation?.permissions?.map((p: any) => p.slug) || []

  const userRole: string = (profile as any)?.role_relation?.slug || profile?.role || ''
  const userRoleLevel: number = (profile as any)?.role_relation?.level || 0

  /**
   * Check if the user has a specific permission.
   * Super Admin always returns true.
   */
  const can = (permission: string): boolean => {
    if (userRole === 'super_admin') return true
    return userPermissions.includes(permission)
  }

  /**
   * Check if the user has ANY of the specified permissions.
   */
  const canAny = (permissions: string[]): boolean => {
    if (userRole === 'super_admin') return true
    return permissions.some((p) => userPermissions.includes(p))
  }

  /**
   * Check if the user has ALL of the specified permissions.
   */
  const canAll = (permissions: string[]): boolean => {
    if (userRole === 'super_admin') return true
    return permissions.every((p) => userPermissions.includes(p))
  }

  /**
   * Check if the user has a specific role.
   */
  const hasRole = (role: string): boolean => {
    return userRole === role
  }

  /**
   * Check if the user's role level meets the threshold.
   */
  const hasMinLevel = (level: number): boolean => {
    return userRoleLevel >= level
  }

  return {
    can,
    canAny,
    canAll,
    hasRole,
    hasMinLevel,
    userRole,
    userRoleLevel,
    userPermissions,
  }
}
