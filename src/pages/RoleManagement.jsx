/**
 * Role Management Page
 *
 * Admin interface for managing roles and permissions:
 * - View all roles with filtering
 * - Create new custom roles
 * - Edit role permissions
 * - Clone existing roles
 * - Delete custom roles
 * - View users assigned to roles
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS } from '../config/roles'
import roleService from '../services/roleService'
import dataCacheService from '../services/dataCacheService'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import PermissionMatrix from '../components/ui/PermissionMatrix'
import {
  Shield,
  ShieldPlus,
  ShieldCheck,
  Edit,
  Trash2,
  Copy,
  Users,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Lock,
  Unlock,
  Eye,
  RefreshCw,
  ToggleLeft,
  ToggleRight
} from 'lucide-react'
// CSS moved to global index.css - using Tailwind classes

const RoleManagement = ({ embedded = false }) => {
  const { user } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()

  // Data state
  const [roles, setRoles] = useState([])
  const [permissionGroups, setPermissionGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Note: Filters are handled by DataTable's built-in filtering

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showCloneModal, setShowCloneModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [selectedRole, setSelectedRole] = useState(null)
  const [roleUsers, setRoleUsers] = useState([])
  const [actionLoading, setActionLoading] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    hierarchyLevel: 5,
    permissions: []
  })
  const [cloneName, setCloneName] = useState('')
  const [cloneSuccess, setCloneSuccess] = useState(false)

  // Check permissions
  const canManageRoles = hasPermission(PERMISSIONS.MANAGE_ROLES)
  const canManageUsers = hasPermission(PERMISSIONS.MANAGE_USERS)
  const canViewRoles = hasPermission(PERMISSIONS.VIEW_ROLES) || canManageRoles || canManageUsers

  // Load roles - PERFORMANCE FIX: Use dataCacheService for cached roles (5 min TTL)
  const loadRoles = useCallback(async (forceRefresh = false) => {
    if (!canViewRoles) return

    try {
      setLoading(true)
      setError(null)

      // If force refresh requested, invalidate cache first
      if (forceRefresh) {
        dataCacheService.invalidateRoles()
      }

      // Use dataCacheService for instant loading after first fetch
      const rolesData = await dataCacheService.getRoles().catch(err => {
        console.error('Error loading roles:', err)
        return null
      })

      if (rolesData) {
        // dataCacheService returns result.data which can be array or object with roles
        setRoles(Array.isArray(rolesData) ? rolesData : rolesData?.roles || [])
      } else {
        setError('Failed to load roles')
      }
    } catch (err) {
      console.error('Error loading roles:', err)
      setError(err.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [canViewRoles])

  // Load available permissions
  const loadPermissions = useCallback(async () => {
    try {
      const result = await roleService.getPermissions()
      if (result.success) {
        // Backend returns { byModule: {...}, allKeys: [...] }
        setPermissionGroups(result.data?.byModule || result.data?.permissions || [])
      }
    } catch (err) {
      console.error('Error loading permissions:', err)
    }
  }, [])

  useEffect(() => {
    loadRoles()
    loadPermissions()
  }, [loadRoles, loadPermissions])

  // Show message with auto-dismiss
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Reset form data
  const resetFormData = () => {
    setFormData({
      name: '',
      description: '',
      hierarchyLevel: 5,
      permissions: []
    })
  }

  // Open create modal
  const openCreateModal = () => {
    resetFormData()
    setShowCreateModal(true)
  }

  // Open edit modal
  const openEditModal = (role) => {
    setSelectedRole(role)
    setFormData({
      name: role.name,
      description: role.description || '',
      hierarchyLevel: role.hierarchy_level,
      permissions: role.permissions || []
    })
    setShowEditModal(true)
  }

  // Open clone modal
  const openCloneModal = (role) => {
    setSelectedRole(role)
    setCloneName(`${role.name} (Copy)`)
    setShowCloneModal(true)
  }

  // Open delete modal
  const openDeleteModal = (role) => {
    setSelectedRole(role)
    setShowDeleteModal(true)
  }

  // Open users modal
  const openUsersModal = async (role) => {
    setSelectedRole(role)
    setShowUsersModal(true)
    try {
      const result = await roleService.getUsers(role.id)
      if (result.success) {
        setRoleUsers(result.data?.users || [])
      }
    } catch (err) {
      console.error('Error loading role users:', err)
      setRoleUsers([])
    }
  }

  // Handle create role
  const handleCreateRole = async () => {
    try {
      setActionLoading(true)
      const result = await roleService.create(formData)

      if (result.success) {
        setShowCreateModal(false)
        showMessage('success', result.message || 'Role created successfully')
        loadRoles()
      } else {
        showMessage('error', result.error || 'Failed to create role')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to create role')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle update role
  const handleUpdateRole = async () => {
    try {
      setActionLoading(true)
      const result = await roleService.update(selectedRole.id, formData)

      if (result.success) {
        setShowEditModal(false)
        showMessage('success', result.message || 'Role updated successfully')
        loadRoles()
      } else {
        showMessage('error', result.error || 'Failed to update role')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update role')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle clone role
  const handleCloneRole = async () => {
    if (cloneSuccess) return  // Prevent double-click after success

    try {
      setActionLoading(true)
      console.log('Cloning role:', selectedRole?.id, 'with name:', cloneName)
      const result = await roleService.clone(selectedRole.id, cloneName)
      console.log('Clone result:', result)

      if (result.success) {
        console.log('Clone successful, setting cloneSuccess to true')
        setCloneSuccess(true)  // Show success state instead of closing
        loadRoles()
      } else {
        showMessage('error', result.error || 'Failed to clone role')
      }
    } catch (err) {
      console.error('Clone error:', err)
      showMessage('error', err.message || 'Failed to clone role')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle closing clone modal
  const handleCloseCloneModal = () => {
    setShowCloneModal(false)
    setCloneSuccess(false)
    setCloneName('')
  }

  // Handle delete role
  const handleDeleteRole = async () => {
    try {
      setActionLoading(true)
      const result = await roleService.delete(selectedRole.id)

      if (result.success) {
        setShowDeleteModal(false)
        showMessage('success', result.message || 'Role deleted successfully')
        loadRoles()
      } else {
        showMessage('error', result.error || 'Failed to delete role')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to delete role')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle toggle role status
  const handleToggleStatus = async (role) => {
    try {
      const newStatus = !role.is_active
      const result = await roleService.toggleActive(role.id, newStatus)

      if (result.success) {
        showMessage('success', `Role ${newStatus ? 'activated' : 'deactivated'} successfully`)
        loadRoles()
      } else {
        showMessage('error', result.error || 'Failed to update role status')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update role status')
    }
  }

  // Get role type badge
  const getRoleTypeBadge = (role) => {
    if (!role) return null
    if (role.is_system) {
      return <span className="status-badge info"><Lock size={12} /> System</span>
    }
    return <span className="status-badge neutral"><Unlock size={12} /> Custom</span>
  }

  // Get status badge
  const getStatusBadge = (isActive) => {
    if (isActive === undefined || isActive === null) return null
    return isActive
      ? <span className="status-badge success"><CheckCircle size={12} /> Active</span>
      : <span className="status-badge danger"><XCircle size={12} /> Inactive</span>
  }

  // Table columns
  // NOTE: DataTable render functions receive (value, row) where value is the cell value
  // and row is the full row object
  const columns = [
    {
      key: 'name',
      header: t('roleName') || 'Role Name',
      sortable: true,
      render: (value, row) => {
        if (!row) return null
        return (
          <div className="flex items-center gap-3">
            <Shield className="text-blue-500 flex-shrink-0" size={18} />
            <div className="flex flex-col">
              <span className="font-medium text-slate-900 dark:text-slate-100">{row.name}</span>
              {row.description && (
                <span className="text-xs text-slate-500 dark:text-slate-400">{row.description}</span>
              )}
            </div>
          </div>
        )
      }
    },
    {
      key: 'is_system',
      header: t('type') || 'Type',
      filterable: true,
      filterOptions: [
        { value: true, label: t('systemRoles') || 'System' },
        { value: false, label: t('customRoles') || 'Custom' }
      ],
      render: (value, row) => getRoleTypeBadge(row)
    },
    {
      key: 'hierarchy_level',
      header: t('hierarchyLevel') || 'Level',
      sortable: true,
      render: (value, row) => {
        if (!row) return null
        return (
          <span className="inline-flex items-center px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full text-xs font-medium">
            {t('level') || 'Level'} {row.hierarchy_level}
          </span>
        )
      }
    },
    {
      key: 'permissions',
      header: t('permissions') || 'Permissions',
      render: (value, row) => {
        if (!row) return null
        const count = row.permissions?.length || 0
        return (
          <span className="text-sm text-slate-600 dark:text-slate-400">
            {count} {count === 1 ? (t('permission') || 'permission') : (t('permissions') || 'permissions')}
          </span>
        )
      }
    },
    {
      key: 'user_count',
      header: t('users') || 'Users',
      render: (value, row) => {
        if (!row) return null
        return (
          <button
            className="btn btn-outline btn-sm user-count-btn"
            onClick={(e) => {
              e.stopPropagation()
              openUsersModal(row)
            }}
            title={t('viewRoleUsers') || 'View Role Users'}
          >
            <Users size={14} />
            <span className="user-count-badge">{row.user_count || 0}</span>
          </button>
        )
      }
    },
    {
      key: 'is_active',
      header: t('status') || 'Status',
      filterable: true,
      filterOptions: [
        { value: true, label: t('active') || 'Active' },
        { value: false, label: t('inactive') || 'Inactive' }
      ],
      render: (value, row) => row ? getStatusBadge(row.is_active) : null
    },
    {
      key: 'actions',
      header: t('actions') || 'Actions',
      render: (value, row) => {
        if (!row) return null
        return (
          <div className="cell-actions">
            {canManageRoles && !row.is_system && (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    openEditModal(row)
                  }}
                  title={t('edit') || 'Edit'}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    openCloneModal(row)
                  }}
                  title={t('clone') || 'Clone'}
                >
                  <Copy size={14} />
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeleteModal(row)
                  }}
                  title={t('delete') || 'Delete'}
                  disabled={row.user_count > 0}
                >
                  <Trash2 size={14} />
                </button>
                <button
                  className={`btn btn-sm ${row.is_active ? 'btn-warning' : 'btn-success'}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleStatus(row)
                  }}
                  title={row.is_active ? (t('deactivate') || 'Deactivate') : (t('activate') || 'Activate')}
                >
                  {row.is_active ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                </button>
              </>
            )}
            {canManageRoles && row.is_system && (
              <button
                className="btn btn-outline btn-sm"
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal(row)
                }}
                title={t('viewPermissions') || 'View Permissions'}
              >
                <Eye size={14} />
              </button>
            )}
          </div>
        )
      }
    }
  ]

  // Access denied state
  if (!canViewRoles) {
    return (
      <div className="page-container">
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>{t('accessDenied') || 'Access Denied'}</h2>
          <p>{t('noPermissionViewRoles') || 'You do not have permission to view roles.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={embedded ? 'role-management-embedded' : 'page-container'}>
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

      {/* Roles Table - uses DataTable's built-in filtering like UserManagement */}
      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        searchable={true}
        filterable={true}
        sortable={true}
        paginated={true}
        initialPageSize={10}
        title={!embedded ? t('roles', 'Roles') : undefined}
        subtitle={!embedded ? t('manageUsersDescription', 'Manage user accounts, roles, and permissions') : undefined}
        emptyMessage={t('noRolesFound') || 'No roles found'}
        onRowClick={(row) => !row.is_system && canManageRoles && openEditModal(row)}
        headerActions={
          <div className="flex items-center gap-3">
            <button
              className="btn btn-outline"
              onClick={loadRoles}
              disabled={loading}
              title={t('refresh') || 'Refresh'}
            >
              <RefreshCw size={16} className={loading ? 'spinning' : ''} />
            </button>
            {canManageRoles && (
              <button
                className="btn btn-primary"
                onClick={openCreateModal}
              >
                <ShieldPlus size={16} />
                {t('createRole') || 'Create Role'}
              </button>
            )}
          </div>
        }
      />

      {/* Create/Edit Modal */}
      <Modal
        isOpen={showCreateModal || showEditModal}
        onClose={() => {
          setShowCreateModal(false)
          setShowEditModal(false)
        }}
        title={showCreateModal ? (t('createRole') || 'Create Role') : (t('editRole') || 'Edit Role')}
        size="large"
      >
        <div className="space-y-5">
          {/* System Role Info Banner */}
          {selectedRole?.is_system && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <Lock size={18} className="flex-shrink-0" />
              <span>{t('cannotEditSystemRole') || 'System roles cannot be edited'} - {t('viewOnly') || 'View Only'}</span>
            </div>
          )}

          {/* Role Details Section */}
          <div className="form-section">
            <h4 className="form-section-title">
              <Shield size={16} />
              {t('roleDetails') || 'Role Details'}
            </h4>

            <div className="form-grid">
              <div className="form-group">
                <label>
                  {t('roleName') || 'Role Name'}
                  {!selectedRole?.is_system && <span className="text-red-500">*</span>}
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('enterRoleName') || 'Enter role name'}
                  disabled={selectedRole?.is_system}
                />
              </div>

              <div className="form-group">
                <label>{t('hierarchyLevel') || 'Hierarchy Level'}</label>
                <select
                  value={formData.hierarchyLevel}
                  onChange={(e) => setFormData({ ...formData, hierarchyLevel: parseInt(e.target.value) })}
                  disabled={selectedRole?.is_system}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                    <option key={level} value={level}>
                      {t('level') || 'Level'} {level} {level === 1 ? `(${t('levelLowest') || 'Lowest'})` : level === 8 ? `(${t('levelHighestCustom') || 'Highest Custom'})` : ''}
                    </option>
                  ))}
                </select>
                <span className="text-xs text-slate-500 mt-1">
                  {t('hierarchyLevelHint') || 'Users can only manage roles with lower hierarchy levels'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label>{t('description') || 'Description'}</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('enterDescription') || 'Enter description'}
                rows={2}
                disabled={selectedRole?.is_system}
              />
            </div>
          </div>

          {/* Permissions Section */}
          <div className="form-section">
            <div className="flex items-center justify-between mb-4">
              <h4 className="form-section-title !mb-0">
                <ShieldCheck size={16} />
                {t('permissions') || 'Permissions'}
              </h4>
              {formData.permissions.length > 0 && (
                <span className="inline-flex items-center px-2.5 py-1 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded-full text-xs font-semibold">
                  {formData.permissions.length} {t('permissionsSelected') || 'selected'}
                </span>
              )}
            </div>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              {t('selectPermissionsHint') || 'Select the permissions this role should have'}
            </p>

            <PermissionMatrix
              permissions={permissionGroups}
              selectedPermissions={formData.permissions}
              onChange={(perms) => setFormData({ ...formData, permissions: perms })}
              readonly={selectedRole?.is_system}
              loading={permissionGroups.length === 0}
            />
          </div>

          {/* Modal Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
              }}
            >
              {selectedRole?.is_system ? (t('close') || 'Close') : (t('cancel') || 'Cancel')}
            </button>
            {!selectedRole?.is_system && (
              <button
                className="btn btn-primary"
                onClick={showCreateModal ? handleCreateRole : handleUpdateRole}
                disabled={actionLoading || !formData.name.trim()}
              >
                {actionLoading ? (
                  <>
                    <RefreshCw size={14} className="spinning" />
                    {t('saving') || 'Saving...'}
                  </>
                ) : (
                  showCreateModal ? (t('create') || 'Create') : (t('save') || 'Save')
                )}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Clone Modal */}
      <Modal
        isOpen={showCloneModal}
        onClose={handleCloseCloneModal}
        title={cloneSuccess ? (t('roleCloned') || 'Role Cloned') : (t('cloneRole') || 'Clone Role')}
        size="small"
      >
        <div className="space-y-5">
          {cloneSuccess ? (
            <>
              <div className="flex flex-col items-center text-center py-6">
                <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <p className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  {t('roleClonedSuccess') || 'Role cloned successfully!'}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  {t('newRoleCreated') || 'New role'} <strong className="text-slate-700 dark:text-slate-200">{cloneName}</strong> {t('hasBeenCreated') || 'has been created.'}
                </p>
              </div>
              <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
                <button className="btn btn-primary" onClick={handleCloseCloneModal}>
                  {t('close') || 'Close'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                {t('cloneRoleDescription') || 'Create a copy of'} <strong className="text-slate-900 dark:text-slate-100">{selectedRole?.name}</strong>
              </p>

              <div className="form-group">
                <label>{t('newRoleName') || 'New Role Name'} <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder={t('enterNewName') || 'Enter new name'}
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button className="btn btn-outline" onClick={handleCloseCloneModal}>
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCloneRole}
                  disabled={actionLoading || !cloneName.trim() || cloneSuccess}
                >
                  {actionLoading ? (
                    <>
                      <RefreshCw size={14} className="spinning" />
                      {t('cloning') || 'Cloning...'}
                    </>
                  ) : (
                    <>
                      <Copy size={14} />
                      {t('clone') || 'Clone'}
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* Delete Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('deleteRole') || 'Delete Role'}
        size="small"
      >
        <div className="space-y-5">
          <div className="flex flex-col items-center text-center py-4">
            <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center mb-4">
              <AlertTriangle size={32} className="text-red-600 dark:text-red-400" />
            </div>
            <p className="text-slate-700 dark:text-slate-300">
              {t('deleteRoleConfirmation') || 'Are you sure you want to delete'} <strong className="text-slate-900 dark:text-slate-100">{selectedRole?.name}</strong>?
            </p>
          </div>

          {selectedRole?.user_count > 0 && (
            <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-200">
              <AlertTriangle size={18} className="flex-shrink-0" />
              <span>{t('roleHasUsers') || 'This role has'} <strong>{selectedRole?.user_count}</strong> {t('usersAssigned') || 'users assigned'}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteRole}
              disabled={actionLoading}
            >
              {actionLoading ? (
                <>
                  <RefreshCw size={14} className="spinning" />
                  {t('deleting') || 'Deleting...'}
                </>
              ) : (
                <>
                  <Trash2 size={14} />
                  {t('delete') || 'Delete'}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Users Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => {
          setShowUsersModal(false)
          setRoleUsers([])
        }}
        title={`${t('usersWithRole') || 'Users with role'}: ${selectedRole?.name}`}
        size="medium"
      >
        <div className="space-y-5">
          {roleUsers.length === 0 ? (
            <div className="flex flex-col items-center text-center py-8">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-4">
                <Users size={32} className="text-slate-400 dark:text-slate-500" />
              </div>
              <p className="text-slate-500 dark:text-slate-400">{t('noUsersWithRole') || 'No users have this role'}</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-200 dark:divide-slate-700 border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
              {roleUsers.map(user => {
                // Handle both snake_case and camelCase property names
                const isActive = user.is_active ?? user.isActive ?? true
                return (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium text-slate-900 dark:text-slate-100">{user.firstName} {user.lastName}</span>
                      <span className="text-xs text-slate-500 dark:text-slate-400">{user.email}</span>
                    </div>
                    <span className={`status-badge ${isActive ? 'success' : 'neutral'}`}>
                      {isActive ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                    </span>
                  </div>
                )
              })}
            </div>
          )}

          <div className="flex items-center justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <button className="btn btn-outline" onClick={() => setShowUsersModal(false)}>
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default RoleManagement
