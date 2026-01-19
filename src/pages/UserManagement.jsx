/**
 * User Management Page (Task 49)
 *
 * Admin interface for managing users:
 * - View all users with filtering
 * - Create new users
 * - Edit user details and roles
 * - Deactivate/reactivate users
 * - Reset passwords
 * - Force logout sessions
 * - Manage permission overrides
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS, getRoleDisplayName, getRoleColor } from '../config/roles'
import userService from '../services/userService'
import roleService from '../services/roleService'
import DataTable from '../components/ui/DataTable'
import RoleManagement from './RoleManagement'
import Modal from '../components/ui/Modal'
import {
  Users,
  User,
  UserPlus,
  Edit,
  Trash2,
  Key,
  LogOut,
  Shield,
  ShieldCheck,
  ShieldOff,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mail,
  Clock,
  RefreshCw,
  MoreVertical,
  Eye,
  Search,
  Filter,
  Copy,
  Circle
} from 'lucide-react'
// CSS moved to global index.css - using Tailwind classes

// Permission categories for grouping display
const PERMISSION_CATEGORIES = {
  'User Management': ['MANAGE_USERS', 'VIEW_USERS', 'ASSIGN_ROLES', 'MANAGE_ROLES', 'VIEW_ROLES'],
  'Company': ['MANAGE_COMPANIES', 'VIEW_COMPANIES', 'SWITCH_COMPANIES'],
  'Customers': ['MANAGE_CUSTOMERS', 'VIEW_CUSTOMERS'],
  'Suppliers & Vendors': ['MANAGE_SUPPLIERS', 'VIEW_SUPPLIERS', 'MANAGE_VENDORS', 'VIEW_VENDORS'],
  'Inventory': ['MANAGE_INVENTORY', 'VIEW_INVENTORY', 'UPDATE_STOCK'],
  'Sales': ['CREATE_SALES', 'VIEW_SALES', 'EDIT_SALES', 'DELETE_SALES', 'APPROVE_SALES'],
  'Purchase': ['CREATE_PURCHASE', 'VIEW_PURCHASE', 'EDIT_PURCHASE', 'DELETE_PURCHASE', 'APPROVE_PURCHASE',
               'CREATE_PURCHASE_ORDER', 'VIEW_PURCHASE_ORDER', 'EDIT_PURCHASE_ORDER', 'DELETE_PURCHASE_ORDER', 'APPROVE_PURCHASE_ORDER'],
  'Contracts': ['MANAGE_CONTRACTS', 'VIEW_CONTRACTS', 'APPROVE_CONTRACTS'],
  'Collections': ['VIEW_COLLECTIONS', 'CREATE_COLLECTIONS', 'EDIT_COLLECTIONS', 'DELETE_COLLECTIONS', 'APPROVE_COLLECTIONS'],
  'Finance': ['VIEW_FINANCIALS', 'MANAGE_EXPENSES', 'APPROVE_EXPENSES', 'MANAGE_PETTY_CASH', 'VIEW_PROFIT_LOSS'],
  'Petty Cash': ['VIEW_PETTY_CASH', 'CREATE_EXPENSE', 'APPROVE_EXPENSE', 'RELOAD_CARD', 'VIEW_EXPENSE_REPORTS'],
  'Invoices': ['CREATE_INVOICES', 'VIEW_INVOICES', 'EDIT_INVOICES'],
  'Wastage': ['VIEW_WASTAGE', 'CREATE_WASTAGE', 'EDIT_WASTAGE', 'DELETE_WASTAGE', 'APPROVE_WASTAGE'],
  'Reports': ['VIEW_REPORTS', 'EXPORT_REPORTS', 'CREATE_CUSTOM_REPORTS'],
  'System': ['MANAGE_SETTINGS', 'VIEW_AUDIT_LOGS', 'VIEW_DASHBOARD']
}

// Format permission key to readable text
const formatPermission = (key) => {
  return key
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, c => c.toUpperCase())
}

// Group permissions by category
const groupPermissions = (permissions) => {
  const grouped = {}
  const categorizedPermissions = new Set()

  // Group permissions into their categories
  Object.entries(PERMISSION_CATEGORIES).forEach(([category, categoryPerms]) => {
    const matches = permissions.filter(p => categoryPerms.includes(p))
    if (matches.length > 0) {
      grouped[category] = matches
      matches.forEach(p => categorizedPermissions.add(p))
    }
  })

  // Add any uncategorized permissions to 'Other'
  const uncategorized = permissions.filter(p => !categorizedPermissions.has(p))
  if (uncategorized.length > 0) {
    grouped['Other'] = uncategorized
  }

  return grouped
}

/**
 * Role Info Panel Component
 * Displays permissions for a selected role in a collapsible, categorized format
 */
const RoleInfoPanel = ({ role, expanded = false, onToggle, t }) => {
  const [isExpanded, setIsExpanded] = useState(expanded)

  if (!role) return null

  const permissions = role.permissions || []
  const groupedPermissions = groupPermissions(permissions)
  const categoryCount = Object.keys(groupedPermissions).length

  const handleToggle = () => {
    setIsExpanded(!isExpanded)
    onToggle?.(!isExpanded)
  }

  return (
    <div className="mt-3 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-white dark:bg-slate-800">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors text-left"
        onClick={handleToggle}
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-2">
          <Shield size={16} className="text-blue-500" />
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
            {role.label} - <strong className="text-blue-600 dark:text-blue-400">{permissions.length}</strong> {t('permissions', 'permissions')}
          </span>
          {role.is_system && <span className="status-badge info text-xs">{t('system', 'System')}</span>}
        </div>
        <span className={`text-slate-400 text-xs transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
      </button>

      {isExpanded && (
        <div className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-4">
          {role.description && (
            <p className="text-sm text-slate-600 dark:text-slate-400 italic">{role.description}</p>
          )}

          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
            {t('accessLevel', 'Access Level')}: <strong>{role.level}</strong> / 10
          </div>

          <div className="space-y-4">
            {Object.entries(groupedPermissions).map(([category, perms]) => (
              <div key={category} className="bg-slate-50 dark:bg-slate-700/30 rounded-lg p-3">
                <h5 className="flex items-center justify-between text-xs font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider mb-2">
                  {category}
                  <span className="inline-flex items-center justify-center w-5 h-5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-full text-[10px] font-bold">
                    {perms.length}
                  </span>
                </h5>
                <div className="flex flex-wrap gap-1.5">
                  {perms.map(perm => (
                    <span
                      key={perm}
                      className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded text-xs font-medium"
                    >
                      <CheckCircle size={10} />
                      {formatPermission(perm)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {permissions.length === 0 && (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4 italic">
              {t('noPermissions', 'No permissions assigned to this role.')}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

const UserManagement = () => {
  const { user } = useAuth()
  const { t } = useLocalization()
  const { formatDate: systemFormatDate, formatDateTime: systemFormatDateTime } = useSystemSettings()
  const { hasPermission, userRole } = usePermissions()

  // Tab state
  const [activeTab, setActiveTab] = useState('users')

  // Data state
  const [users, setUsers] = useState([])
  const [availableRoles, setAvailableRoles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    role: '',
    isActive: '',
    search: ''
  })

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showPermissionsModal, setShowPermissionsModal] = useState(false)
  const [selectedUser, setSelectedUser] = useState(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Temp password modal state
  const [tempPasswordData, setTempPasswordData] = useState(null)

  // Check permissions
  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS)
  const canViewUsers = hasPermission(PERMISSIONS.VIEW_USERS) || canManageUsers

  // Load users
  const loadUsers = useCallback(async () => {
    if (!canViewUsers) {
      return
    }

    try {
      setLoading(true)
      setError(null)

      const result = await userService.getAll(filters)

      if (result.success) {
        setUsers(result.data || [])
      } else {
        setError(result.error || 'Failed to load users')
      }
    } catch (err) {
      console.error('Error loading users:', err)
      setError(err.message || 'Failed to load users')
    } finally {
      setLoading(false)
    }
  }, [canViewUsers, filters])

  // Load available roles from API
  const loadRoles = useCallback(async () => {
    try {
      const result = await roleService.getAll({ isActive: true })
      if (result.success) {
        // Backend returns data as array directly, not { roles: [...] }
        setAvailableRoles(Array.isArray(result.data) ? result.data : result.data?.roles || [])
      }
    } catch (err) {
      console.error('Error loading roles:', err)
    }
  }, [])

  useEffect(() => {
    loadUsers()
    loadRoles()
  }, [loadUsers, loadRoles])

  // Show message with auto-dismiss
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Handle user creation
  const handleCreateUser = async (userData) => {
    try {
      setActionLoading(true)
      const result = await userService.create(userData)

      if (result.success) {
        setShowCreateModal(false)
        // If temp password is returned, show persistent modal
        if (result.data?.tempPassword) {
          setTempPasswordData({
            email: userData.email,
            password: result.data.tempPassword,
            userName: `${userData.firstName} ${userData.lastName}`,
            action: 'created'
          })
        } else {
          showMessage('success', result.message || 'User created successfully')
        }
        loadUsers()
      } else {
        showMessage('error', result.error || 'Failed to create user')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to create user')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle user update
  const handleUpdateUser = async (userId, userData) => {
    try {
      setActionLoading(true)
      const result = await userService.update(userId, userData)

      if (result.success) {
        showMessage('success', result.message || 'User updated successfully')
        setShowEditModal(false)
        setSelectedUser(null)
        loadUsers()
      } else {
        showMessage('error', result.error || 'Failed to update user')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update user')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle user deactivation
  const handleDeactivate = async (targetUser) => {
    if (!window.confirm(`Are you sure you want to deactivate ${targetUser.firstName} ${targetUser.lastName}?`)) {
      return
    }

    try {
      setActionLoading(true)
      const result = await userService.deactivate(targetUser.id)

      if (result.success) {
        showMessage('success', 'User deactivated successfully')
        loadUsers()
      } else {
        showMessage('error', result.error || 'Failed to deactivate user')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to deactivate user')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle user reactivation
  const handleReactivate = async (targetUser) => {
    try {
      setActionLoading(true)
      const result = await userService.reactivate(targetUser.id)

      if (result.success) {
        showMessage('success', 'User reactivated successfully')
        loadUsers()
      } else {
        showMessage('error', result.error || 'Failed to reactivate user')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to reactivate user')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle password reset
  const handleResetPassword = async (targetUser) => {
    if (!window.confirm(`Reset password for ${targetUser.firstName} ${targetUser.lastName}? A temporary password will be generated.`)) {
      return
    }

    try {
      setActionLoading(true)
      const result = await userService.resetPassword(targetUser.id, { sendEmail: true })

      if (result.success) {
        // Show temp password in persistent modal
        if (result.data?.tempPassword) {
          setTempPasswordData({
            email: targetUser.email,
            password: result.data.tempPassword,
            userName: `${targetUser.firstName} ${targetUser.lastName}`,
            action: 'reset'
          })
        } else if (result.data?.emailSent) {
          showMessage('success', 'Password reset. Email sent to user.')
        } else {
          showMessage('success', 'Password reset successfully')
        }
        loadUsers()
      } else {
        showMessage('error', result.error || 'Failed to reset password')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to reset password')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle force logout
  const handleForceLogout = async (targetUser) => {
    if (!window.confirm(`Force logout ${targetUser.firstName} ${targetUser.lastName} from all sessions?`)) {
      return
    }

    try {
      setActionLoading(true)
      const result = await userService.forceLogout(targetUser.id)

      if (result.success) {
        const count = result.data?.invalidatedSessions || 0
        showMessage('success', `User logged out from ${count} session(s)`)
      } else {
        showMessage('error', result.error || 'Failed to force logout')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to force logout')
    } finally {
      setActionLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return t('never', 'Never')
    return systemFormatDate ? systemFormatDate(dateString) : new Date(dateString).toLocaleDateString()
  }

  // Format date with time for display (for last login - includes seconds)
  const formatDateTime = (dateString) => {
    if (!dateString) return t('never', 'Never')
    // Pass includeSeconds=true for last login to show full timestamp
    return systemFormatDateTime ? systemFormatDateTime(dateString, undefined, undefined, true) : new Date(dateString).toLocaleString()
  }

  // Check if current user can manage target user
  // Uses backend's canManage field which properly handles all role format variations
  const canManageTargetUser = (targetUser) => {
    if (!canManageUsers) return false
    if (targetUser.id === user?.id) return false // Can't manage self
    // Use backend's pre-computed canManage field for proper role hierarchy handling
    // This handles cases where role might be null/undefined or in different formats
    return targetUser.canManage === true
  }

  // DataTable columns
  const columns = [
    {
      key: 'name',
      header: t('name', 'Name'),
      render: (_, row) => (
        <div className="user-name-cell">
          <div className={`user-avatar ${row.isOnline ? 'online' : ''}`}>
            {row.firstName?.[0]}{row.lastName?.[0]}
            {row.isOnline && <span className="online-indicator" title={t('online', 'Online')} />}
          </div>
          <div className="user-info">
            <span className="user-fullname">
              {row.firstName} {row.lastName}
              {row.isOnline && (
                <span className="online-status online">
                  <Circle size={8} fill="currentColor" /> {t('online', 'Online')}
                </span>
              )}
            </span>
            <span className="user-email">{row.email}</span>
          </div>
        </div>
      )
    },
    {
      key: 'role',
      header: t('role', 'Role'),
      filterable: true,
      render: (value, row) => {
        // Map role slug to design-system badge variant
        const roleVariantMap = {
          'SUPER_ADMIN': 'danger',
          'super-admin': 'danger',
          'super_admin': 'danger',
          'COMPANY_ADMIN': 'warning',
          'company-admin': 'warning',
          'company_admin': 'warning',
          'MANAGER': 'info',
          'manager': 'info',
          'SALES_STAFF': 'success',
          'sales-staff': 'success',
          'sales_staff': 'success',
          'PURCHASE_STAFF': 'success',
          'purchase-staff': 'success',
          'purchase_staff': 'success',
          'ACCOUNTS_STAFF': 'success',
          'accounts-staff': 'success',
          'accounts_staff': 'success'
        }
        const variant = roleVariantMap[value] || 'neutral'
        // Use roleDisplayName from API (from roles table) or fallback to local function
        const displayName = row.roleDisplayName || row.roleName || getRoleDisplayName(value)
        return (
          <span className={`status-badge ${variant}`}>
            {displayName}
          </span>
        )
      }
    },
    {
      key: 'isActive',
      header: t('status', 'Status'),
      filterable: true,
      filterOptions: [
        { value: '1', label: t('active', 'Active') },
        { value: '0', label: t('inactive', 'Inactive') }
      ],
      render: (value) => (
        <span className={`status-badge ${value ? 'active' : 'inactive'}`}>
          {value ? (
            <><CheckCircle size={14} /> Active</>
          ) : (
            <><XCircle size={14} /> Inactive</>
          )}
        </span>
      )
    },
    {
      key: 'mfaEnabled',
      header: t('mfa', 'MFA'),
      render: (value) => (
        <span className={`mfa-badge ${value ? 'enabled' : 'disabled'}`}>
          {value ? (
            <><ShieldCheck size={14} /> Enabled</>
          ) : (
            <><ShieldOff size={14} /> Disabled</>
          )}
        </span>
      )
    },
    {
      key: 'lastLoginAt',
      header: t('lastLogin', 'Last Login'),
      type: 'date',
      render: (value) => (
        <span className="last-login">
          <Clock size={14} />
          {formatDate(value)}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      sortable: false,
      render: (_, row) => (
        <div className="cell-actions">
          {canManageTargetUser(row) && (
            <>
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedUser(row)
                  setShowEditModal(true)
                }}
                title={t('edit', 'Edit')}
              >
                <Edit size={14} />
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleResetPassword(row)
                }}
                title={t('resetPassword', 'Reset Password')}
              >
                <Key size={14} />
              </button>

              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleForceLogout(row)
                }}
                title={t('forceLogout', 'Force Logout')}
              >
                <LogOut size={14} />
              </button>

              {row.isActive ? (
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeactivate(row)
                  }}
                  title={t('deactivate', 'Deactivate')}
                >
                  <Trash2 size={14} />
                </button>
              ) : (
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReactivate(row)
                  }}
                  title={t('reactivate', 'Reactivate')}
                >
                  <RefreshCw size={14} />
                </button>
              )}
            </>
          )}

          {!canManageTargetUser(row) && row.id !== user?.id && (
            <span className="text-muted">—</span>
          )}

          {row.id === user?.id && (
            <span className="status-badge neutral">{t('you', 'You')}</span>
          )}
        </div>
      )
    }
  ]

  // Access denied
  if (!canViewUsers) {
    return (
      <div className="page-container">
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>{t('accessDenied', 'Access Denied')}</h2>
          <p>{t('noPermissionUsers', 'You do not have permission to view users.')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container">
      {/* Message Toast */}
      {message && (
        <div className={`message-toast ${message.type}`} onClick={() => setMessage(null)}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          <span>{message.text}</span>
          <button className="toast-close">×</button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
          onClick={() => setActiveTab('users')}
        >
          <Users size={18} />
          {t('users', 'Users')}
          <span className="tab-count">{users.length}</span>
        </button>
        {(hasPermission(PERMISSIONS.VIEW_ROLES) || hasPermission(PERMISSIONS.MANAGE_USERS)) && (
          <button
            className={`tab-btn ${activeTab === 'roles' ? 'active' : ''}`}
            onClick={() => setActiveTab('roles')}
          >
            <Shield size={18} />
            {t('roles', 'Roles')}
          </button>
        )}
      </div>

      {/* Users Tab */}
      {activeTab === 'users' && (
        <DataTable
          data={users}
          columns={columns}
          loading={loading}
          title={t('userManagement', 'User Management')}
          subtitle={t('manageUsersDescription', 'Create, edit, and manage user accounts and permissions')}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={canManageUsers}
          initialPageSize={10}
          emptyMessage={t('noUsersFound', 'No users found')}
          headerActions={
            <div className="flex items-center gap-3">
              <button
                className="btn btn-outline"
                onClick={loadUsers}
                disabled={loading}
                title={t('refresh', 'Refresh')}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
              {canManageUsers && (
                <button
                  className="btn btn-primary"
                  onClick={() => setShowCreateModal(true)}
                >
                  <UserPlus size={16} />
                  {t('createUser', 'Create User')}
                </button>
              )}
            </div>
          }
        />
      )}

      {/* Roles Tab */}
      {activeTab === 'roles' && (hasPermission(PERMISSIONS.VIEW_ROLES) || hasPermission(PERMISSIONS.MANAGE_USERS)) && (
        <RoleManagement embedded={true} />
      )}

      {/* Create User Modal */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateUser}
        loading={actionLoading}
        currentUserRole={userRole}
        availableRoles={availableRoles}
        t={t}
      />

      {/* Edit User Modal */}
      <EditUserModal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false)
          setSelectedUser(null)
        }}
        onSubmit={(data) => handleUpdateUser(selectedUser?.id, data)}
        user={selectedUser}
        loading={actionLoading}
        currentUserRole={userRole}
        availableRoles={availableRoles}
        t={t}
        formatDate={systemFormatDate}
        formatDateTime={systemFormatDateTime}
      />

      {/* Temp Password Modal - Persistent */}
      <TempPasswordModal
        isOpen={!!tempPasswordData}
        onClose={() => setTempPasswordData(null)}
        data={tempPasswordData}
        t={t}
      />
    </div>
  )
}

/**
 * Create User Modal (Task 50)
 */
const CreateUserModal = ({ isOpen, onClose, onSubmit, loading, currentUserRole, availableRoles = [], t }) => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    firstName: '',
    lastName: '',
    roleId: '',
    sendWelcomeEmail: true,
    createPettyCashAccount: true
  })
  const [errors, setErrors] = useState({})

  // Get assignable roles based on hierarchy
  // Support multiple role format conventions for compatibility
  const getAssignableRoles = useCallback(() => {
    const levelMap = {
      // Support UPPERCASE (legacy), kebab-case (frontend), and snake_case (database)
      'SUPER_ADMIN': 10, 'super-admin': 10, 'super_admin': 10,
      'COMPANY_ADMIN': 9, 'company-admin': 9, 'company_admin': 9,
      'MANAGER': 7, 'manager': 7,
      'SALES_STAFF': 3, 'sales-staff': 3, 'sales_staff': 3,
      'PURCHASE_STAFF': 3, 'purchase-staff': 3, 'purchase_staff': 3,
      'ACCOUNTS_STAFF': 3, 'accounts-staff': 3, 'accounts_staff': 3
    }
    const currentLevel = levelMap[currentUserRole] || 0

    // Debug: log if role format is unrecognized
    if (!currentLevel && currentUserRole) {
      console.warn('CreateUserModal: Unknown role format for hierarchy:', currentUserRole)
    }

    // Filter to roles with lower hierarchy level, include full role data
    return availableRoles.filter(role =>
      role.is_active && role.hierarchy_level < currentLevel
    ).map(role => ({
      value: role.id,
      label: role.name,
      slug: role.slug,
      level: role.hierarchy_level,
      description: role.description,
      color: role.color,
      permissions: role.permissions || [],
      is_system: role.is_system
    }))
  }, [availableRoles, currentUserRole])

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      const assignable = getAssignableRoles()
      setFormData({
        email: '',
        username: '',
        firstName: '',
        lastName: '',
        roleId: assignable.length > 0 ? assignable[assignable.length - 1].value : '',
        sendWelcomeEmail: true,
        createPettyCashAccount: true
      })
      setErrors({})
    }
  }, [isOpen, getAssignableRoles])

  const validate = () => {
    const newErrors = {}

    if (!formData.email) {
      newErrors.email = t('emailRequired', 'Email is required')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = t('invalidEmailFormat', 'Invalid email format')
    }

    // Username validation - optional but if provided, must follow rules
    if (formData.username) {
      if (formData.username.length < 3) {
        newErrors.username = t('usernameMinLength', 'Username must be at least 3 characters')
      } else if (formData.username.length > 30) {
        newErrors.username = t('usernameMaxLength', 'Username must be less than 30 characters')
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = t('usernameInvalidChars', 'Username can only contain letters, numbers, and underscores')
      }
    }

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = t('firstNameMinLength', 'First name must be at least 2 characters')
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = t('lastNameMinLength', 'Last name must be at least 2 characters')
    }

    if (!formData.roleId) {
      newErrors.roleId = t('roleRequired', 'Role is required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const assignableRoles = getAssignableRoles()

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('createUser', 'Create User')}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Account Information Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            <Mail size={16} />
            {t('accountInformation', 'Account Information')}
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="email">
                {t('email', 'Email')} <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="user@company.com"
                disabled={loading}
                className={errors.email ? 'border-red-500' : ''}
              />
              {errors.email && <span className="text-xs text-red-500 mt-1">{errors.email}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="username">
                {t('username', 'Username')} <span className="text-slate-400 text-xs font-normal">({t('optional', 'Optional')})</span>
              </label>
              <input
                type="text"
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, '') })}
                placeholder="john_doe"
                disabled={loading}
                className={errors.username ? 'border-red-500' : ''}
                maxLength={30}
              />
              <span className="text-xs text-slate-500 mt-1">{t('usernameHint', 'Letters, numbers, and underscores only. Can be used for login.')}</span>
              {errors.username && <span className="text-xs text-red-500 mt-1">{errors.username}</span>}
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            <User size={16} />
            {t('personalInformation', 'Personal Information')}
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="firstName">
                {t('firstName', 'First Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="firstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                placeholder="John"
                disabled={loading}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && <span className="text-xs text-red-500 mt-1">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="lastName">
                {t('lastName', 'Last Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="lastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                placeholder="Doe"
                disabled={loading}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && <span className="text-xs text-red-500 mt-1">{errors.lastName}</span>}
            </div>
          </div>
        </div>

        {/* Role & Permissions Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            <Shield size={16} />
            {t('rolePermissions', 'Role & Permissions')}
          </h4>
          <div className="form-group">
            <label htmlFor="roleId">
              {t('role', 'Role')} <span className="text-red-500">*</span>
            </label>
            <select
              id="roleId"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value, 10) })}
              disabled={loading}
              className={errors.roleId ? 'border-red-500' : ''}
            >
              <option value="">{t('selectRole', 'Select a role...')}</option>
              {assignableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} ({role.permissions?.length || 0} {t('permissions', 'permissions')})
                </option>
              ))}
            </select>
            {errors.roleId && <span className="text-xs text-red-500 mt-1">{errors.roleId}</span>}

            {/* Role Info Panel - shows permissions when a role is selected */}
            {formData.roleId && (
              <RoleInfoPanel
                role={assignableRoles.find(r => r.value === formData.roleId)}
                expanded={false}
                t={t}
              />
            )}
          </div>
        </div>

        {/* Options Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            {t('options', 'Options')}
          </h4>
          <div className="space-y-3">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.sendWelcomeEmail}
                  onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                  disabled={loading}
                />
                <span>{t('sendWelcomeEmail', 'Send welcome email with temporary password')}</span>
              </label>
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.createPettyCashAccount}
                  onChange={(e) => setFormData({ ...formData, createPettyCashAccount: e.target.checked })}
                  disabled={loading}
                />
                <span>{t('createPettyCashAccount', 'Create petty cash account')}</span>
              </label>
              <span className="text-xs text-slate-500 mt-1 ml-7">
                {t('pettyCashAccountHint', 'Account will be activated when a petty cash card is assigned')}
              </span>
            </div>
          </div>
        </div>

        {/* Info Alert */}
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle size={18} className="flex-shrink-0" />
          <span>
            {t('tempPasswordInfo', 'A temporary password will be generated. The user will be required to change it on first login.')}
          </span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spinning" />
                {t('creating', 'Creating...')}
              </>
            ) : (
              <>
                <UserPlus size={16} />
                {t('createUser', 'Create User')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Edit User Modal (Task 51)
 * Updated to use API-loaded roles instead of hardcoded roles
 */
const EditUserModal = ({ isOpen, onClose, onSubmit, user, loading, currentUserRole, availableRoles = [], t, formatDate, formatDateTime }) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    roleId: '',
    isActive: true
  })
  const [errors, setErrors] = useState({})

  // Get assignable roles based on hierarchy (same logic as CreateUserModal)
  // Support multiple role format conventions for compatibility
  const getAssignableRoles = useCallback(() => {
    const levelMap = {
      // Support UPPERCASE (legacy), kebab-case (frontend), and snake_case (database)
      'SUPER_ADMIN': 10, 'super-admin': 10, 'super_admin': 10,
      'COMPANY_ADMIN': 9, 'company-admin': 9, 'company_admin': 9,
      'MANAGER': 7, 'manager': 7,
      'SALES_STAFF': 3, 'sales-staff': 3, 'sales_staff': 3,
      'PURCHASE_STAFF': 3, 'purchase-staff': 3, 'purchase_staff': 3,
      'ACCOUNTS_STAFF': 3, 'accounts-staff': 3, 'accounts_staff': 3
    }
    const currentLevel = levelMap[currentUserRole] || 0

    // Debug: log if role format is unrecognized
    if (!currentLevel && currentUserRole) {
      console.warn('EditUserModal: Unknown role format for hierarchy:', currentUserRole)
    }

    // Filter to roles with lower hierarchy level, include full role data
    return availableRoles.filter(role =>
      role.is_active && role.hierarchy_level < currentLevel
    ).map(role => ({
      value: role.id,
      label: role.name,
      slug: role.slug,
      level: role.hierarchy_level,
      description: role.description,
      color: role.color,
      permissions: role.permissions || [],
      is_system: role.is_system
    }))
  }, [availableRoles, currentUserRole])

  // Update form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        roleId: user.roleId || user.role_id || '',
        isActive: user.isActive !== false
      })
      setErrors({})
    }
  }, [user])

  const validate = () => {
    const newErrors = {}

    if (!formData.firstName || formData.firstName.length < 2) {
      newErrors.firstName = t('firstNameMinLength', 'First name must be at least 2 characters')
    }

    if (!formData.lastName || formData.lastName.length < 2) {
      newErrors.lastName = t('lastNameMinLength', 'Last name must be at least 2 characters')
    }

    if (!formData.roleId) {
      newErrors.roleId = t('roleRequired', 'Role is required')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      onSubmit(formData)
    }
  }

  const assignableRoles = getAssignableRoles()

  if (!user) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('editUser', 'Edit User')}
      description={user?.email}
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* User Summary Header */}
        <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-lg font-semibold">
            {user.firstName?.[0]}{user.lastName?.[0]}
          </div>
          <div className="flex flex-col gap-1">
            <strong className="text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</strong>
            <span className="text-sm text-slate-600 dark:text-slate-400">{user.email}</span>
            {user.username && (
              <span className="status-badge info w-fit">@{user.username}</span>
            )}
            <span className="text-xs text-slate-500 dark:text-slate-500">
              {t('created', 'Created')}: {formatDate(user.createdAt)}
              {user.lastLoginAt && ` • ${t('lastLogin', 'Last login')}: ${formatDateTime(user.lastLoginAt)}`}
            </span>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            <User size={16} />
            {t('personalInformation', 'Personal Information')}
          </h4>
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="editFirstName">
                {t('firstName', 'First Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="editFirstName"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                disabled={loading}
                className={errors.firstName ? 'border-red-500' : ''}
              />
              {errors.firstName && <span className="text-xs text-red-500 mt-1">{errors.firstName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="editLastName">
                {t('lastName', 'Last Name')} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="editLastName"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                disabled={loading}
                className={errors.lastName ? 'border-red-500' : ''}
              />
              {errors.lastName && <span className="text-xs text-red-500 mt-1">{errors.lastName}</span>}
            </div>
          </div>
        </div>

        {/* Role & Permissions Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            <Shield size={16} />
            {t('rolePermissions', 'Role & Permissions')}
          </h4>
          <div className="form-group">
            <label htmlFor="editRoleId">
              {t('role', 'Role')} <span className="text-red-500">*</span>
            </label>
            <select
              id="editRoleId"
              value={formData.roleId}
              onChange={(e) => setFormData({ ...formData, roleId: parseInt(e.target.value, 10) })}
              disabled={loading}
              className={errors.roleId ? 'border-red-500' : ''}
            >
              <option value="">{t('selectRole', 'Select a role...')}</option>
              {assignableRoles.map(role => (
                <option key={role.value} value={role.value}>
                  {role.label} ({role.permissions?.length || 0} {t('permissions', 'permissions')})
                </option>
              ))}
            </select>
            {errors.roleId && <span className="text-xs text-red-500 mt-1">{errors.roleId}</span>}

            {/* Role Info Panel - shows permissions when a role is selected */}
            {formData.roleId && (
              <RoleInfoPanel
                role={assignableRoles.find(r => r.value === formData.roleId)}
                expanded={false}
                t={t}
              />
            )}
          </div>
        </div>

        {/* Account Status Section */}
        <div className="form-section">
          <h4 className="form-section-title">
            {t('accountStatus', 'Account Status')}
          </h4>
          <div className="space-y-3">
            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  disabled={loading}
                />
                <span>{t('accountActive', 'Account is active')}</span>
              </label>
            </div>

            {/* MFA Status (read-only) */}
            <div className={`flex items-center gap-3 p-3 rounded-lg text-sm ${
              user.mfaEnabled
                ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                : 'bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
            }`}>
              {user.mfaEnabled ? (
                <>
                  <ShieldCheck size={18} />
                  <span>{t('mfaEnabled', 'Two-factor authentication is enabled')}</span>
                </>
              ) : (
                <>
                  <ShieldOff size={18} />
                  <span>{t('mfaDisabled', 'Two-factor authentication is not enabled')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spinning" />
                {t('saving', 'Saving...')}
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {t('saveChanges', 'Save Changes')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Temp Password Modal - Persistent display for temporary passwords
 * Requires manual dismiss to ensure password is copied
 */
const TempPasswordModal = ({ isOpen, onClose, data, t }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(data?.password || '')
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = data?.password || ''
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (!isOpen || !data) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('tempPasswordGenerated', 'Temporary Password Generated')}
      size="sm"
    >
      <div className="space-y-5">
        {/* User Info */}
        <div className="flex flex-col items-center text-center">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white text-lg font-semibold mb-3">
            <Key size={24} />
          </div>
          <strong className="text-slate-900 dark:text-slate-100">{data.userName}</strong>
          <span className="text-sm text-slate-500 dark:text-slate-400">{data.email}</span>
        </div>

        {/* Password Box */}
        <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
          <code className="flex-1 font-mono text-lg font-semibold text-blue-600 dark:text-blue-400 tracking-wider select-all">
            {data.password}
          </code>
          <button
            className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline'}`}
            onClick={handleCopy}
            title={t('copyPassword', 'Copy Password')}
          >
            {copied ? (
              <><CheckCircle size={14} /> {t('tempPasswordCopied', 'Copied!')}</>
            ) : (
              <><Copy size={14} /> {t('copyPassword', 'Copy')}</>
            )}
          </button>
        </div>

        {/* Instructions */}
        <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
          <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
          <span>{t('passwordCopyInstructions', 'Copy this password and share it securely with the user. They will be required to change it on first login.')}</span>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            className="btn btn-primary"
            onClick={onClose}
          >
            <CheckCircle size={16} />
            {t('closeModal', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default UserManagement
