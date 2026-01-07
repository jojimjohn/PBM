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
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import PermissionMatrix from '../components/ui/PermissionMatrix'
import {
  Shield,
  ShieldPlus,
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
import './RoleManagement.css'

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

  // Load roles
  const loadRoles = useCallback(async () => {
    if (!canViewRoles) return

    try {
      setLoading(true)
      setError(null)

      const result = await roleService.getAll()

      if (result.success) {
        // Backend returns data as array directly, not nested as { roles: [...] }
        setRoles(Array.isArray(result.data) ? result.data : result.data?.roles || [])
      } else {
        setError(result.error || 'Failed to load roles')
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
          <div className="role-name-cell">
            <Shield className="role-icon" size={18} />
            <div>
              <span className="role-name">{row.name}</span>
              {row.description && (
                <span className="role-description">{row.description}</span>
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
        return <span className="hierarchy-badge">Level {row.hierarchy_level}</span>
      }
    },
    {
      key: 'permissions',
      header: t('permissions') || 'Permissions',
      render: (value, row) => {
        if (!row) return null
        const count = row.permissions?.length || 0
        return (
          <span className="permissions-count">
            {count} {count === 1 ? 'permission' : 'permissions'}
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
            className="users-count-btn"
            onClick={(e) => {
              e.stopPropagation()
              openUsersModal(row)
            }}
          >
            <Users size={14} />
            {row.user_count || 0}
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
        emptyMessage={t('noRolesFound') || 'No roles found'}
        onRowClick={(row) => !row.is_system && canManageRoles && openEditModal(row)}
        headerActions={
          <div className="header-actions-group">
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
        title={
          <div className="role-modal-title">
            <Shield size={20} />
            <span>{showCreateModal ? (t('createRole') || 'Create Role') : (t('editRole') || 'Edit Role')}</span>
            {selectedRole?.is_system && (
              <span className="status-badge info">{t('systemRole') || 'System Role'}</span>
            )}
          </div>
        }
        size="large"
      >
        <div className="role-form">
          {/* System Role Info Banner */}
          {selectedRole?.is_system && (
            <div className="system-role-banner">
              <Lock size={16} />
              <span>{t('cannotEditSystemRole') || 'System roles cannot be edited'} - {t('viewOnly') || 'View Only'}</span>
            </div>
          )}

          {/* Role Details Section */}
          <div className="form-section">
            <div className="section-header">
              <h3>{t('roleDetails') || 'Role Details'}</h3>
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">
                  {t('roleName') || 'Role Name'}
                  {!selectedRole?.is_system && <span className="required">*</span>}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={t('enterRoleName') || 'Enter role name'}
                  disabled={selectedRole?.is_system}
                />
              </div>

              <div className="form-group">
                <label className="form-label">{t('hierarchyLevel') || 'Hierarchy Level'}</label>
                <select
                  className="form-select"
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
                <span className="form-hint">
                  {t('hierarchyLevelHint') || 'Users can only manage roles with lower hierarchy levels'}
                </span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t('description') || 'Description'}</label>
              <textarea
                className="form-textarea"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('enterDescription') || 'Enter description'}
                rows={2}
                disabled={selectedRole?.is_system}
              />
            </div>
          </div>

          {/* Permissions Section */}
          <div className="form-section permissions-section">
            <div className="section-header">
              <h3>{t('permissions') || 'Permissions'}</h3>
              {formData.permissions.length > 0 && (
                <span className="permissions-counter">
                  {formData.permissions.length} {t('permissionsSelected') || 'permissions selected'}
                </span>
              )}
            </div>
            <p className="form-hint section-hint">
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
          <div className="modal-actions">
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
        <div className="clone-form">
          {cloneSuccess ? (
            <>
              <div className="success-message">
                <CheckCircle size={48} className="success-icon" />
                <p>{t('roleClonedSuccess') || 'Role cloned successfully!'}</p>
                <p className="text-muted">
                  {t('newRoleCreated') || 'New role'} <strong>{cloneName}</strong> {t('hasBeenCreated') || 'has been created.'}
                </p>
              </div>
              <div className="modal-actions">
                <button className="btn btn-primary" onClick={handleCloseCloneModal}>
                  {t('close') || 'Close'}
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="text-muted">
                {t('cloneRoleDescription') || 'Create a copy of'} <strong>{selectedRole?.name}</strong>
              </p>

              <div className="form-group">
                <label>{t('newRoleName') || 'New Role Name'} *</label>
                <input
                  type="text"
                  className="form-input"
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder={t('enterNewName') || 'Enter new name'}
                />
              </div>

              <div className="modal-actions">
                <button className="btn btn-outline" onClick={handleCloseCloneModal}>
                  {t('cancel') || 'Cancel'}
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCloneRole}
                  disabled={actionLoading || !cloneName.trim() || cloneSuccess}
                >
                  {actionLoading ? (t('cloning') || 'Cloning...') : (t('clone') || 'Clone')}
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
        <div className="delete-confirmation">
          <AlertTriangle size={48} className="warning-icon" />
          <p>
            {t('deleteRoleConfirmation') || 'Are you sure you want to delete'} <strong>{selectedRole?.name}</strong>?
          </p>
          {selectedRole?.user_count > 0 && (
            <div className="warning-message">
              <AlertTriangle size={16} />
              {t('roleHasUsers') || 'This role has'} {selectedRole?.user_count} {t('usersAssigned') || 'users assigned'}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setShowDeleteModal(false)}>
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteRole}
              disabled={actionLoading}
            >
              {actionLoading ? (t('deleting') || 'Deleting...') : (t('delete') || 'Delete')}
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
        <div className="role-users-modal">
          {roleUsers.length === 0 ? (
            <div className="empty-users">
              <Users size={32} />
              <p>{t('noUsersWithRole') || 'No users have this role'}</p>
            </div>
          ) : (
            <div className="users-list">
              {roleUsers.map(user => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <span className="user-name">{user.firstName} {user.lastName}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <span className={`status-badge ${user.is_active ? 'success' : 'neutral'}`}>
                    {user.is_active ? t('active') || 'Active' : t('inactive') || 'Inactive'}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
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
