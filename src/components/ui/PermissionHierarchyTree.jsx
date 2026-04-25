/**
 * Permission Hierarchy Tree Component
 *
 * Displays permissions in a hierarchical tree structure showing:
 * - Parent permissions that imply child permissions
 * - Module-level grouping
 * - _ALL vs _OWN scoping
 */

import React, { useState } from 'react'
import { ChevronDown, ChevronRight, CheckCircle, Circle, Shield } from 'lucide-react'

/**
 * Permission Hierarchy Configuration
 * Defines parent-child relationships between permissions
 */
const PERMISSION_HIERARCHY = {
  MANAGE_USERS:          { children: ['VIEW_USERS',          'CREATE_USERS',          'EDIT_USERS',          'DELETE_USERS']          },
  MANAGE_ROLES:          { children: ['VIEW_ROLES']          },
  MANAGE_COMPANIES:      { children: ['VIEW_COMPANIES',       'SWITCH_COMPANIES']      },
  MANAGE_SUPPLIERS:      { children: ['VIEW_SUPPLIERS',       'CREATE_SUPPLIERS',      'EDIT_SUPPLIERS',      'DELETE_SUPPLIERS']      },
  MANAGE_CUSTOMERS:      { children: ['VIEW_CUSTOMERS',       'CREATE_CUSTOMERS',      'EDIT_CUSTOMERS',      'DELETE_CUSTOMERS']      },
  MANAGE_MATERIALS:      { children: ['VIEW_MATERIALS',       'CREATE_MATERIALS',      'EDIT_MATERIALS',      'DELETE_MATERIALS']      },
  MANAGE_INVENTORY:      { children: ['VIEW_INVENTORY',       'EDIT_INVENTORY']        },
  MANAGE_CONTRACTS:      { children: ['VIEW_CONTRACTS',       'CREATE_CONTRACTS',      'EDIT_CONTRACTS',      'DELETE_CONTRACTS']      },
  MANAGE_COLLECTIONS:    { children: ['VIEW_COLLECTIONS',     'CREATE_COLLECTIONS',    'EDIT_COLLECTIONS',    'DELETE_COLLECTIONS']    },
  MANAGE_SALES:          { children: ['VIEW_SALES',           'CREATE_SALES',          'EDIT_SALES',          'DELETE_SALES']          },
  MANAGE_PURCHASE:       { children: ['VIEW_PURCHASE',        'CREATE_PURCHASE',       'EDIT_PURCHASE',       'DELETE_PURCHASE']       },
  MANAGE_WASTAGE:        { children: ['VIEW_WASTAGE',         'CREATE_WASTAGE',        'EDIT_WASTAGE',        'DELETE_WASTAGE']        },
  MANAGE_PETTY_CASH:     { children: ['VIEW_PETTY_CASH',      'CREATE_PETTY_CASH',     'EDIT_PETTY_CASH',     'DELETE_PETTY_CASH']     },
  MANAGE_FINANCE:        { children: ['VIEW_FINANCE',         'CREATE_FINANCE',        'EDIT_FINANCE',        'DELETE_FINANCE']        },
  MANAGE_INVOICES:       { children: ['VIEW_INVOICES',        'CREATE_INVOICES',       'EDIT_INVOICES',       'DELETE_INVOICES']       },
  MANAGE_BANKING:        { children: ['VIEW_BANKING',         'CREATE_BANKING',        'EDIT_BANKING',        'DELETE_BANKING']        },
  MANAGE_REPORTS:        { children: ['VIEW_REPORTS']         },
  MANAGE_SETTINGS:       { children: ['VIEW_SETTINGS',        'MANAGE_BACKUPS']        },
  MANAGE_PROJECTS:       { children: ['VIEW_PROJECTS',        'CREATE_PROJECTS',       'EDIT_PROJECTS',       'DELETE_PROJECTS']       },
  MANAGE_EMPLOYEES:      { children: ['VIEW_EMPLOYEES',       'CREATE_EMPLOYEES',      'EDIT_EMPLOYEES',      'DELETE_EMPLOYEES']      },
  MANAGE_VEHICLES:       { children: ['VIEW_VEHICLES',        'CREATE_VEHICLES',       'EDIT_VEHICLES',       'DELETE_VEHICLES']       },
  MANAGE_TANK_LOGS:      { children: ['VIEW_TANK_LOGS',       'CREATE_TANK_LOGS',      'EDIT_TANK_LOGS',      'DELETE_TANK_LOGS']      },
  MANAGE_EXPENSE_SHEETS: { children: ['VIEW_EXPENSE_SHEETS',  'CREATE_EXPENSE_SHEETS', 'EDIT_EXPENSE_SHEETS', 'DELETE_EXPENSE_SHEETS'] },
}

/**
 * Format permission key to readable text
 */
const formatPermission = (key) => {
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

/**
 * Check if user has permission (with hierarchical support)
 */
const hasPermission = (userPermissions, permission) => {
  // Direct permission check
  if (userPermissions.includes(permission)) return true

  // Check if user has parent permission that implies this one
  for (const [parentPerm, config] of Object.entries(PERMISSION_HIERARCHY)) {
    if (config.children?.includes(permission) && userPermissions.includes(parentPerm)) {
      return true
    }
  }

  // Hierarchical permission checking: _ALL implies _OWN
  if (permission.endsWith('_OWN')) {
    const allPermission = permission.replace('_OWN', '_ALL')
    if (userPermissions.includes(allPermission)) return true
  }

  return false
}

/**
 * Permission Tree Node Component
 */
const PermissionNode = ({
  permission,
  userPermissions,
  level = 0,
  showImplied = true,
  readonly = false,
  onChange = null
}) => {
  const [isExpanded, setIsExpanded] = useState(level < 1) // Auto-expand first level

  const hasDirectPermission = userPermissions.includes(permission)
  const hasImpliedPermission = !hasDirectPermission && hasPermission(userPermissions, permission)
  const children = PERMISSION_HIERARCHY[permission]?.children || []
  const hasChildren = children.length > 0

  const indentClass = level === 0 ? '' : `ml-${Math.min(level * 4, 12)}`

  /**
   * Handle permission toggle
   * Adds/removes permission from list
   */
  const handleToggle = (e) => {
    e.stopPropagation()
    if (readonly || !onChange) return

    if (hasDirectPermission) {
      // Remove this permission
      onChange(userPermissions.filter(p => p !== permission))
    } else {
      // Add this permission
      onChange([...userPermissions, permission])
    }
  }

  return (
    <div className={`${indentClass}`}>
      {/* Permission Item */}
      <div
        onClick={readonly ? undefined : handleToggle}
        className={`
          flex items-center gap-2 p-2 rounded-lg transition-all
          ${readonly
            ? 'hover:bg-slate-50 dark:hover:bg-slate-700/30'
            : 'cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50'
          }
          ${hasDirectPermission ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''}
          ${hasImpliedPermission && showImplied ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        `}
      >
        {/* Expand/Collapse Button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
          </button>
        ) : (
          <span className="w-4" /> // Spacer for alignment
        )}

        {/* Permission Icon */}
        {hasDirectPermission ? (
          <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
        ) : hasImpliedPermission && showImplied ? (
          <CheckCircle size={14} className="text-blue-500 dark:text-blue-400 opacity-60" />
        ) : (
          <Circle size={14} className="text-slate-300 dark:text-slate-600" />
        )}

        {/* Permission Label */}
        <span
          className={`
            text-sm font-medium
            ${hasDirectPermission
              ? 'text-emerald-700 dark:text-emerald-300'
              : hasImpliedPermission && showImplied
              ? 'text-blue-600 dark:text-blue-400 italic'
              : 'text-slate-600 dark:text-slate-400'
            }
          `}
        >
          {formatPermission(permission)}
        </span>

        {/* Implied Badge */}
        {hasImpliedPermission && showImplied && !hasDirectPermission && (
          <span className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full">
            Implied
          </span>
        )}

        {/* Parent Badge */}
        {hasChildren && (
          <span className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full">
            {children.length} {children.length === 1 ? 'child' : 'children'}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="ml-6 mt-1 border-l-2 border-slate-200 dark:border-slate-700 pl-2">
          {children.map(childPerm => (
            <PermissionNode
              key={childPerm}
              permission={childPerm}
              userPermissions={userPermissions}
              level={level + 1}
              showImplied={showImplied}
              readonly={readonly}
              onChange={onChange}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * Group permissions by module with hierarchy
 * @param {Array} permissionGroups - Permissions grouped by module from backend
 *   Format: [{ key: 'users', label: 'User Management', permissions: [{key, label, description}, ...] }, ...]
 * @param {string[]} selectedPermissions - Currently selected permissions
 * @returns {Array} Modules with their permissions organized hierarchically
 */
const organizePermissionsByModule = (permissionGroups, selectedPermissions) => {
  const modules = []

  // Get all child permissions globally
  const allChildPermissions = new Set()
  Object.values(PERMISSION_HIERARCHY).forEach(config => {
    config.children?.forEach(child => allChildPermissions.add(child))
  })

  // permissionGroups is an array of module objects from backend
  permissionGroups.forEach(module => {
    // Extract permission keys from the module's permissions array
    const permissionKeys = module.permissions.map(p => p.key)

    // Build set of permissions in THIS module
    const modulePermSet = new Set(permissionKeys)

    // Find root permissions (those with children or not children of others)
    const roots = []
    const standalone = []

    permissionKeys.forEach(perm => {
      const hasChildren = PERMISSION_HIERARCHY[perm]?.children?.length > 0
      const isChild = allChildPermissions.has(perm)

      if (hasChildren) {
        // This permission has children - it's a root
        roots.push(perm)
      } else if (isChild) {
        // This is a child permission - check if its parent is in THIS module
        let parentInModule = false
        for (const [parentPerm, config] of Object.entries(PERMISSION_HIERARCHY)) {
          if (config.children?.includes(perm) && modulePermSet.has(parentPerm)) {
            parentInModule = true
            break
          }
        }

        // If parent is not in this module, treat as standalone
        if (!parentInModule) {
          standalone.push(perm)
        }
        // Otherwise, it will be rendered as a child of its parent
      } else {
        // Not a child, not a parent - standalone permission
        standalone.push(perm)
      }
    })

    // Sort roots and standalone permissions
    const sortedRoots = [...roots].sort()
    const sortedStandalone = [...standalone].sort()

    modules.push({
      name: module.label || module.key, // Use label for display, fallback to key
      key: module.key,
      roots: sortedRoots,
      standalone: sortedStandalone,
      allPermissions: permissionKeys
    })
  })

  return modules
}

/**
 * Build a fallback single-module tree when permissionGroups is not provided.
 * Uses the local PERMISSION_HIERARCHY to identify roots vs standalone perms.
 */
const buildFallbackModules = (perms) => {
  if (!perms || perms.length === 0) return []

  const allChildPermissions = new Set()
  Object.values(PERMISSION_HIERARCHY).forEach(config => {
    config.children?.forEach(child => allChildPermissions.add(child))
  })

  const roots = []
  const standalone = []

  perms.forEach(perm => {
    const hasChildren = PERMISSION_HIERARCHY[perm]?.children?.length > 0
    const isChild = allChildPermissions.has(perm)
    if (hasChildren) {
      roots.push(perm)
    } else if (!isChild) {
      standalone.push(perm)
    }
    // pure children are rendered under their parent — skip here
  })

  return [{
    key: 'permissions',
    name: 'Permissions',
    roots: roots.sort(),
    standalone: standalone.sort(),
    allPermissions: perms
  }]
}

/**
 * Permission Hierarchy Tree Component
 *
 * @param {string[]} permissions - Array of selected permission keys
 * @param {Array} permissionGroups - Permissions grouped by module from backend
 *   Format: [{ key: 'users', label: 'User Management', permissions: [{key, label, description}, ...] }, ...]
 * @param {string} title - Optional title for the tree
 * @param {boolean} showImplied - Show implied permissions in different color
 * @param {boolean} readonly - If true, tree is read-only (default: true)
 * @param {function} onChange - Callback when permissions change (required if not readonly)
 */
const PermissionHierarchyTree = ({
  permissions = [],
  permissionGroups = null,
  title = 'Permissions',
  showImplied = true,
  readonly = true,
  onChange = null
}) => {
  // Organize permissions by module if groups provided; fall back to hierarchy-only grouping
  const modules = permissionGroups
    ? organizePermissionsByModule(permissionGroups, permissions)
    : buildFallbackModules(permissions)

  return (
    <div className="space-y-4">
      {/* Header */}
      {title && (
        <div className="flex items-center gap-2 pb-3 border-b border-slate-200 dark:border-slate-700">
          <Shield size={18} className="text-blue-500" />
          <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">{title}</h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({permissions.length} direct {permissions.length === 1 ? 'permission' : 'permissions'})
          </span>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-lg text-xs">
        <div className="flex items-center gap-2">
          <CheckCircle size={12} className="text-emerald-600 dark:text-emerald-400" />
          <span className="text-slate-600 dark:text-slate-400">Direct Permission</span>
        </div>
        {showImplied && (
          <div className="flex items-center gap-2">
            <CheckCircle size={12} className="text-blue-500 dark:text-blue-400 opacity-60" />
            <span className="text-slate-600 dark:text-slate-400">Implied Permission</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Circle size={12} className="text-slate-300 dark:text-slate-600" />
          <span className="text-slate-600 dark:text-slate-400">Not Granted</span>
        </div>
        {!readonly && (
          <div className="ml-auto flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <span className="font-semibold">Click to toggle permissions</span>
          </div>
        )}
      </div>

      {/* Module-Based Tree */}
      {modules.length > 0 ? (
        <div className="space-y-4">
          {modules.map(module => (
            <div key={module.key} className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {/* Module Header */}
              <div className="bg-gradient-to-r from-slate-100 to-slate-50 dark:from-slate-800 dark:to-slate-750 px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                <h4 className="font-semibold text-sm text-slate-700 dark:text-slate-300">
                  {module.name}
                </h4>
              </div>

              {/* Module Permissions */}
              <div className="p-3 space-y-1">
                {/* Root Permissions with Children */}
                {module.roots.map(rootPerm => (
                  <PermissionNode
                    key={rootPerm}
                    permission={rootPerm}
                    userPermissions={permissions}
                    level={0}
                    showImplied={showImplied}
                    readonly={readonly}
                    onChange={onChange}
                  />
                ))}

                {/* Standalone Permissions */}
                {module.standalone.map(standalonePerm => (
                  <PermissionNode
                    key={standalonePerm}
                    permission={standalonePerm}
                    userPermissions={permissions}
                    level={0}
                    showImplied={showImplied}
                    readonly={readonly}
                    onChange={onChange}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-center text-sm text-slate-500 dark:text-slate-400 italic py-8">
          No permissions available
        </p>
      )}
    </div>
  )
}

export default PermissionHierarchyTree
