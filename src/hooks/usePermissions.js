import { useMemo } from 'react'
import { useAuth } from '../context/AuthContext'
import { 
  USER_ROLES, 
  PERMISSIONS, 
  ROLE_PERMISSIONS, 
  ROLE_HIERARCHY
} from '../config/roles'
import { MODULE_PERMISSIONS } from '../config/modules'

export const usePermissions = () => {
  const { user, selectedCompany } = useAuth()

  const userRole = user?.role || USER_ROLES.SALES

  const userPermissions = useMemo(() => {
    if (!userRole) return []
    
    let permissions = ROLE_PERMISSIONS[userRole] || []
    
    // Add module-specific permissions based on company configuration
    if (selectedCompany?.modules?.enabled) {
      const additionalPermissions = []
      selectedCompany.modules.enabled.forEach(moduleId => {
        const moduleConfig = MODULE_PERMISSIONS[moduleId]
        if (moduleConfig?.additionalPermissions) {
          additionalPermissions.push(...moduleConfig.additionalPermissions)
        }
      })
      permissions = [...permissions, ...additionalPermissions]
    }
    
    return [...new Set(permissions)] // Remove duplicates
  }, [userRole, selectedCompany])

  const hasPermission = (permission) => {
    if (!permission) return false
    if (!user) return false
    
    // Super admin has all permissions
    if (userRole === USER_ROLES.SUPER_ADMIN) return true
    
    return userPermissions.includes(permission)
  }

  const hasAnyPermission = (permissions) => {
    if (!permissions || !Array.isArray(permissions)) return false
    return permissions.some(permission => hasPermission(permission))
  }

  const hasAllPermissions = (permissions) => {
    if (!permissions || !Array.isArray(permissions)) return false
    return permissions.every(permission => hasPermission(permission))
  }

  const canAccessModule = (moduleName) => {
    if (!selectedCompany || !moduleName) return false
    
    // Check if module is enabled for this company
    if (!selectedCompany.modules?.enabled?.includes(moduleName)) return false
    
    // Check if user has required permissions for this module
    const moduleConfig = MODULE_PERMISSIONS[moduleName]
    if (!moduleConfig) return true // If no config, allow access
    
    // Super admin bypasses permission checks
    if (userRole === USER_ROLES.SUPER_ADMIN) return true
    
    // Check if user has any of the required permissions for this module
    const requiredPermissions = moduleConfig.requiredPermissions || []
    if (requiredPermissions.length === 0) return true // No permissions required
    
    return requiredPermissions.some(permission => hasPermission(permission))
  }

  const getRoleHierarchyLevel = (role) => {
    return ROLE_HIERARCHY[role] || 0
  }

  const canManageUser = (targetUserRole) => {
    if (!targetUserRole) return false
    
    const currentUserLevel = getRoleHierarchyLevel(userRole)
    const targetUserLevel = getRoleHierarchyLevel(targetUserRole)
    
    // Can only manage users with lower hierarchy level
    return currentUserLevel > targetUserLevel
  }

  const getAccessibleModules = () => {
    if (!selectedCompany?.modules?.enabled) return []
    
    // Super admin gets access to all enabled modules for the company
    if (userRole === USER_ROLES.SUPER_ADMIN) {
      return selectedCompany.modules.enabled
    }
    
    // Filter modules based on user permissions
    return selectedCompany.modules.enabled.filter(moduleId => {
      return canAccessModule(moduleId)
    })
  }

  const canEdit = (permission) => {
    const editPermissions = {
      'customers': PERMISSIONS.MANAGE_CUSTOMERS,
      'suppliers': PERMISSIONS.MANAGE_SUPPLIERS,
      'inventory': PERMISSIONS.MANAGE_INVENTORY,
      'sales': PERMISSIONS.EDIT_SALES,
      'purchase': PERMISSIONS.EDIT_PURCHASE,
      'contracts': PERMISSIONS.MANAGE_CONTRACTS,
      'expenses': PERMISSIONS.MANAGE_EXPENSES,
      'invoices': PERMISSIONS.EDIT_INVOICES
    }
    
    return hasPermission(editPermissions[permission])
  }

  const canDelete = (permission) => {
    const deletePermissions = {
      'sales': PERMISSIONS.DELETE_SALES,
      'purchase': PERMISSIONS.DELETE_PURCHASE
    }
    
    return hasPermission(deletePermissions[permission])
  }

  const canApprove = (permission) => {
    const approvePermissions = {
      'sales': PERMISSIONS.APPROVE_SALES,
      'purchase': PERMISSIONS.APPROVE_PURCHASE,
      'contracts': PERMISSIONS.APPROVE_CONTRACTS,
      'expenses': PERMISSIONS.APPROVE_EXPENSES
    }
    
    return hasPermission(approvePermissions[permission])
  }

  return {
    userRole,
    userPermissions,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    canAccessModule,
    canManageUser,
    getAccessibleModules,
    canEdit,
    canDelete,
    canApprove,
    getRoleHierarchyLevel
  }
}

export default usePermissions