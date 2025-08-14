import React from 'react'
import { usePermissions } from '../hooks/usePermissions'

const PermissionGate = ({ 
  permission, 
  permissions, 
  role,
  roles,
  requireAll = false,
  fallback = null,
  children 
}) => {
  const { 
    hasPermission, 
    hasAnyPermission, 
    hasAllPermissions, 
    userRole 
  } = usePermissions()

  // Check role-based access
  if (role && userRole !== role) {
    return fallback
  }

  if (roles && Array.isArray(roles) && !roles.includes(userRole)) {
    return fallback
  }

  // Check permission-based access
  if (permission && !hasPermission(permission)) {
    return fallback
  }

  if (permissions && Array.isArray(permissions)) {
    const hasAccess = requireAll 
      ? hasAllPermissions(permissions)
      : hasAnyPermission(permissions)
    
    if (!hasAccess) {
      return fallback
    }
  }

  return children
}

export default PermissionGate