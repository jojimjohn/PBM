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
import { Badge } from '../components/ui/Badge'
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
  Search,
  Filter,
  Lock,
  Unlock,
  ChevronDown,
  ChevronUp,
  Check,
  Eye
} from 'lucide-react'
import './RoleManagement.css'

const RoleManagement = () => {
  const { user } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()

  // Data state
  const [roles, setRoles] = useState([])
  const [permissionGroups, setPermissionGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    isActive: '',
    isSystem: '',
    search: ''
  })

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

  // Check permissions
  const canManageRoles = hasPermission(PERMISSIONS.MANAGE_ROLES)
  const canViewRoles = hasPermission(PERMISSIONS.VIEW_ROLES) || canManageRoles

  // Load roles
  const loadRoles = useCallback(async () => {
    if (!canViewRoles) return

    try {
      setLoading(true)
      setError(null)

      const result = await roleService.getAll(filters)

      if (result.success) {
        setRoles(result.data?.roles || [])
      } else {
        setError(result.error || 'Failed to load roles')
      }
    } catch (err) {
      console.error('Error loading roles:', err)
      setError(err.message || 'Failed to load roles')
    } finally {
      setLoading(false)
    }
  }, [canViewRoles, filters])

  // Load available permissions
  const loadPermissions = useCallback(async () => {
    try {
      const result = await roleService.getPermissions()
      if (result.success) {
        setPermissionGroups(result.data?.permissions || [])
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
    try {
      setActionLoading(true)
      const result = await roleService.clone(selectedRole.id, cloneName)

      if (result.success) {
        setShowCloneModal(false)
        showMessage('success', result.message || 'Role cloned successfully')
        loadRoles()
      } else {
        showMessage('error', result.error || 'Failed to clone role')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to clone role')
    } finally {
      setActionLoading(false)
    }
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

  // Toggle permission in form
  const togglePermission = (permissionKey) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionKey)
        ? prev.permissions.filter(p => p !== permissionKey)
        : [...prev.permissions, permissionKey]
    }))
  }

  // Toggle all permissions in a module
  const toggleModulePermissions = (module) => {
    const modulePermissionKeys = module.permissions.map(p => p.key)
    const allSelected = modulePermissionKeys.every(key => formData.permissions.includes(key))

    setFormData(prev => ({
      ...prev,
      permissions: allSelected
        ? prev.permissions.filter(p => !modulePermissionKeys.includes(p))
        : [...new Set([...prev.permissions, ...modulePermissionKeys])]
    }))
  }

  // Get role type badge
  const getRoleTypeBadge = (role) => {
    if (role.is_system) {
      return <Badge variant="info" size="sm"><Lock size={12} /> System</Badge>
    }
    return <Badge variant="secondary" size="sm"><Unlock size={12} /> Custom</Badge>
  }

  // Get status badge
  const getStatusBadge = (isActive) => {
    return isActive
      ? <Badge variant="success" size="sm"><CheckCircle size={12} /> Active</Badge>
      : <Badge variant="danger" size="sm"><XCircle size={12} /> Inactive</Badge>
  }

  // Table columns
  const columns = [
    {
      key: 'name',
      label: t('roleName') || 'Role Name',
      sortable: true,
      render: (row) => (
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
    },
    {
      key: 'type',
      label: t('type') || 'Type',
      render: (row) => getRoleTypeBadge(row)
    },
    {
      key: 'hierarchy_level',
      label: t('hierarchyLevel') || 'Level',
      sortable: true,
      render: (row) => (
        <span className="hierarchy-badge">Level {row.hierarchy_level}</span>
      )
    },
    {
      key: 'permissions_count',
      label: t('permissions') || 'Permissions',
      render: (row) => {
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
      label: t('users') || 'Users',
      render: (row) => (
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
    },
    {
      key: 'is_active',
      label: t('status') || 'Status',
      render: (row) => getStatusBadge(row.is_active)
    },
    {
      key: 'actions',
      label: t('actions') || 'Actions',
      render: (row) => (
        <div className="actions-cell">
          {canManageRoles && !row.is_system && (
            <>
              <button
                className="action-btn edit"
                onClick={(e) => {
                  e.stopPropagation()
                  openEditModal(row)
                }}
                title={t('edit') || 'Edit'}
              >
                <Edit size={16} />
              </button>
              <button
                className="action-btn clone"
                onClick={(e) => {
                  e.stopPropagation()
                  openCloneModal(row)
                }}
                title={t('clone') || 'Clone'}
              >
                <Copy size={16} />
              </button>
              <button
                className="action-btn delete"
                onClick={(e) => {
                  e.stopPropagation()
                  openDeleteModal(row)
                }}
                title={t('delete') || 'Delete'}
              >
                <Trash2 size={16} />
              </button>
            </>
          )}
          {canManageRoles && row.is_system && (
            <button
              className="action-btn view"
              onClick={(e) => {
                e.stopPropagation()
                openEditModal(row)
              }}
              title={t('viewPermissions') || 'View Permissions'}
            >
              <Eye size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  // Access denied state
  if (!canViewRoles) {
    return (
      <div className="role-management-page">
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>{t('accessDenied') || 'Access Denied'}</h2>
          <p>{t('noPermissionViewRoles') || 'You do not have permission to view roles.'}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="role-management-page">
      {/* Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>
            <Shield size={24} />
            {t('roleManagement') || 'Role Management'}
          </h1>
          <p>{t('roleManagementDescription') || 'Manage roles and their permissions'}</p>
        </div>

        {canManageRoles && (
          <button className="btn-primary" onClick={openCreateModal}>
            <ShieldPlus size={18} />
            {t('createRole') || 'Create Role'}
          </button>
        )}
      </div>

      {/* Messages */}
      {message && (
        <div className={`alert alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={20} />
          <span>{error}</span>
          <button onClick={loadRoles} className="retry-btn">Retry</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <Search size={18} />
          <input
            type="text"
            placeholder={t('searchRoles') || 'Search roles...'}
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>

        <div className="filter-group">
          <Filter size={18} />
          <select
            value={filters.isSystem}
            onChange={(e) => setFilters({ ...filters, isSystem: e.target.value })}
          >
            <option value="">{t('allTypes') || 'All Types'}</option>
            <option value="true">{t('systemRoles') || 'System Roles'}</option>
            <option value="false">{t('customRoles') || 'Custom Roles'}</option>
          </select>

          <select
            value={filters.isActive}
            onChange={(e) => setFilters({ ...filters, isActive: e.target.value })}
          >
            <option value="">{t('allStatuses') || 'All Statuses'}</option>
            <option value="true">{t('active') || 'Active'}</option>
            <option value="false">{t('inactive') || 'Inactive'}</option>
          </select>
        </div>
      </div>

      {/* Roles Table */}
      <DataTable
        columns={columns}
        data={roles}
        loading={loading}
        emptyMessage={t('noRolesFound') || 'No roles found'}
        onRowClick={(row) => !row.is_system && canManageRoles && openEditModal(row)}
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
        <div className="role-form">
          <div className="form-section">
            <h3>{t('roleDetails') || 'Role Details'}</h3>

            <div className="form-group">
              <label>{t('roleName') || 'Role Name'} *</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder={t('enterRoleName') || 'Enter role name'}
                disabled={selectedRole?.is_system}
              />
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

            <div className="form-group">
              <label>{t('hierarchyLevel') || 'Hierarchy Level'}</label>
              <select
                value={formData.hierarchyLevel}
                onChange={(e) => setFormData({ ...formData, hierarchyLevel: parseInt(e.target.value) })}
                disabled={selectedRole?.is_system}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8].map(level => (
                  <option key={level} value={level}>
                    Level {level} {level === 1 ? '(Lowest)' : level === 8 ? '(Highest Custom)' : ''}
                  </option>
                ))}
              </select>
              <span className="form-hint">
                {t('hierarchyLevelHint') || 'Users can only manage roles with lower hierarchy levels'}
              </span>
            </div>
          </div>

          <div className="form-section">
            <h3>{t('permissions') || 'Permissions'}</h3>
            <p className="form-hint">
              {t('selectPermissionsHint') || 'Select the permissions this role should have'}
            </p>

            <div className="permissions-grid">
              {permissionGroups.map((module) => (
                <PermissionModule
                  key={module.key}
                  module={module}
                  selectedPermissions={formData.permissions}
                  onTogglePermission={togglePermission}
                  onToggleModule={toggleModulePermissions}
                  disabled={selectedRole?.is_system}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button
              className="btn-secondary"
              onClick={() => {
                setShowCreateModal(false)
                setShowEditModal(false)
              }}
            >
              {t('cancel') || 'Cancel'}
            </button>
            {!selectedRole?.is_system && (
              <button
                className="btn-primary"
                onClick={showCreateModal ? handleCreateRole : handleUpdateRole}
                disabled={actionLoading || !formData.name.trim()}
              >
                {actionLoading ? (t('saving') || 'Saving...') : (showCreateModal ? (t('create') || 'Create') : (t('save') || 'Save'))}
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* Clone Modal */}
      <Modal
        isOpen={showCloneModal}
        onClose={() => setShowCloneModal(false)}
        title={t('cloneRole') || 'Clone Role'}
        size="small"
      >
        <div className="clone-form">
          <p>
            {t('cloneRoleDescription') || 'Create a copy of'} <strong>{selectedRole?.name}</strong>
          </p>

          <div className="form-group">
            <label>{t('newRoleName') || 'New Role Name'} *</label>
            <input
              type="text"
              value={cloneName}
              onChange={(e) => setCloneName(e.target.value)}
              placeholder={t('enterNewName') || 'Enter new name'}
            />
          </div>

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowCloneModal(false)}>
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn-primary"
              onClick={handleCloneRole}
              disabled={actionLoading || !cloneName.trim()}
            >
              {actionLoading ? (t('cloning') || 'Cloning...') : (t('clone') || 'Clone')}
            </button>
          </div>
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
            <button className="btn-secondary" onClick={() => setShowDeleteModal(false)}>
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn-danger"
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
        <div className="role-users-list">
          {roleUsers.length === 0 ? (
            <p className="no-users">{t('noUsersWithRole') || 'No users have this role'}</p>
          ) : (
            <div className="users-table">
              {roleUsers.map(user => (
                <div key={user.id} className="user-row">
                  <div className="user-info">
                    <span className="user-name">{user.firstName} {user.lastName}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <Badge variant={user.is_active ? 'success' : 'secondary'} size="sm">
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              ))}
            </div>
          )}

          <div className="modal-actions">
            <button className="btn-secondary" onClick={() => setShowUsersModal(false)}>
              {t('close') || 'Close'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// Permission Module Component with collapsible sections
const PermissionModule = ({ module, selectedPermissions, onTogglePermission, onToggleModule, disabled }) => {
  const [expanded, setExpanded] = useState(false)

  const modulePermissionKeys = module.permissions.map(p => p.key)
  const selectedCount = modulePermissionKeys.filter(key => selectedPermissions.includes(key)).length
  const allSelected = selectedCount === modulePermissionKeys.length

  return (
    <div className={`permission-module ${expanded ? 'expanded' : ''}`}>
      <div className="module-header" onClick={() => setExpanded(!expanded)}>
        <div className="module-title">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={() => !disabled && onToggleModule(module)}
            onClick={(e) => e.stopPropagation()}
            disabled={disabled}
          />
          <span>{module.label}</span>
          <span className="selected-count">
            ({selectedCount}/{module.permissions.length})
          </span>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {expanded && (
        <div className="module-permissions">
          {module.permissions.map((perm) => (
            <label key={perm.key} className="permission-item">
              <input
                type="checkbox"
                checked={selectedPermissions.includes(perm.key)}
                onChange={() => onTogglePermission(perm.key)}
                disabled={disabled}
              />
              <div className="permission-info">
                <span className="permission-label">{perm.label}</span>
                {perm.description && (
                  <span className="permission-description">{perm.description}</span>
                )}
              </div>
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

export default RoleManagement
