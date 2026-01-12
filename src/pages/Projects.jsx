/**
 * Projects Management Page
 *
 * Admin interface for managing projects and user assignments:
 * - View all projects with filtering
 * - Create new projects
 * - Edit project details
 * - Manage user assignments
 * - Update project status
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS } from '../config/roles'
import projectsService from '../services/projectsService'
import userService from '../services/userService'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import {
  FolderKanban,
  Plus,
  Edit,
  Trash2,
  Users,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  Clock,
  Pause,
  RefreshCw,
  Calendar,
  AlertTriangle,
  FileText
} from 'lucide-react'
import FileUpload from '../components/ui/FileUpload'
import FileViewer from '../components/ui/FileViewer'
import uploadService from '../services/uploadService'
import './Projects.css'

const Projects = () => {
  const { user } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()

  // Data state
  const [projects, setProjects] = useState([])
  const [statistics, setStatistics] = useState(null)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState(null)

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [showUsersModal, setShowUsersModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState(null)
  const [projectUsers, setProjectUsers] = useState([])
  const [actionLoading, setActionLoading] = useState(false)
  const [attachments, setAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    status: 'active',
    start_date: '',
    end_date: ''
  })

  // Assignment form state
  const [assignFormData, setAssignFormData] = useState({
    userId: '',
    roleInProject: 'contributor'
  })

  // Check permissions
  const canManageProjects = hasPermission(PERMISSIONS.MANAGE_PROJECTS)
  const canViewProjects = hasPermission(PERMISSIONS.VIEW_PROJECTS) || canManageProjects

  // Load projects
  const loadProjects = useCallback(async () => {
    if (!canViewProjects) return

    try {
      setLoading(true)
      setError(null)

      const [projectsResult, statsResult] = await Promise.all([
        projectsService.getAll(),
        projectsService.getStatistics()
      ])

      if (projectsResult.success) {
        setProjects(projectsResult.data || [])
      } else {
        setError(projectsResult.error || 'Failed to load projects')
      }

      if (statsResult.success) {
        setStatistics(statsResult.data)
      }
    } catch (err) {
      console.error('Error loading projects:', err)
      setError(err.message || 'Failed to load projects')
    } finally {
      setLoading(false)
    }
  }, [canViewProjects])

  // Load users for assignment
  const loadUsers = useCallback(async () => {
    try {
      const result = await userService.getAll()
      if (result.success) {
        setUsers(result.data || [])
      }
    } catch (err) {
      console.error('Error loading users:', err)
    }
  }, [])

  useEffect(() => {
    loadProjects()
    loadUsers()
  }, [loadProjects, loadUsers])

  // Load S3 attachments when editing a project
  useEffect(() => {
    const loadAttachments = async () => {
      if (showEditModal && selectedProject?.id) {
        setLoadingAttachments(true)
        try {
          const result = await uploadService.getS3Files('projects', selectedProject.id)
          if (result.success) {
            const mappedFiles = (result.data || []).map(file => ({
              id: file.id,
              originalFilename: file.original_filename || file.originalFilename,
              contentType: file.content_type || file.contentType,
              fileSize: file.file_size || file.fileSize,
              downloadUrl: file.download_url || file.downloadUrl
            }))
            setAttachments(mappedFiles)
          }
        } catch (error) {
          console.error('Error loading attachments:', error)
        } finally {
          setLoadingAttachments(false)
        }
      } else {
        setAttachments([])
      }
    }
    loadAttachments()
  }, [showEditModal, selectedProject?.id])

  // Show message with auto-dismiss
  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 5000)
  }

  // Reset form data
  const resetFormData = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      status: 'active',
      start_date: '',
      end_date: ''
    })
  }

  // Open create modal
  const openCreateModal = () => {
    resetFormData()
    setShowCreateModal(true)
  }

  // Open edit modal
  const openEditModal = (project) => {
    setSelectedProject(project)
    setFormData({
      code: project.code,
      name: project.name,
      description: project.description || '',
      status: project.status,
      start_date: project.start_date ? project.start_date.split('T')[0] : '',
      end_date: project.end_date ? project.end_date.split('T')[0] : ''
    })
    setShowEditModal(true)
  }

  // Open delete modal
  const openDeleteModal = (project) => {
    setSelectedProject(project)
    setShowDeleteModal(true)
  }

  // Open users modal
  const openUsersModal = async (project) => {
    setSelectedProject(project)
    setActionLoading(true)
    try {
      const result = await projectsService.getProjectUsers(project.id)
      if (result.success) {
        setProjectUsers(result.data || [])
      }
    } catch (err) {
      console.error('Error loading project users:', err)
    } finally {
      setActionLoading(false)
    }
    setShowUsersModal(true)
  }

  // Open assign user modal (loads project users to filter already-assigned)
  const openAssignModal = async (project) => {
    setSelectedProject(project)
    setAssignFormData({ userId: '', roleInProject: 'contributor' })
    setActionLoading(true)
    try {
      // Load current project users to filter them out from available users
      const result = await projectsService.getProjectUsers(project.id)
      if (result.success) {
        setProjectUsers(result.data || [])
      }
    } catch (err) {
      console.error('Error loading project users:', err)
    } finally {
      setActionLoading(false)
    }
    setShowAssignModal(true)
  }

  // Handle create project
  const handleCreateProject = async () => {
    try {
      setActionLoading(true)

      // Validate code format
      if (!/^[A-Z0-9_-]+$/.test(formData.code)) {
        showMessage('error', 'Project code must contain only uppercase letters, numbers, underscores, and hyphens')
        return
      }

      // Clean up empty date strings to null for backend validation
      const cleanedData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      }

      const result = await projectsService.create(cleanedData)

      if (result.success) {
        setShowCreateModal(false)
        showMessage('success', result.message || 'Project created successfully')
        loadProjects()
      } else {
        showMessage('error', result.error || 'Failed to create project')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to create project')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle update project
  const handleUpdateProject = async () => {
    try {
      setActionLoading(true)

      // Clean up empty date strings to null for backend validation
      const cleanedData = {
        ...formData,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null
      }

      const result = await projectsService.update(selectedProject.id, cleanedData)

      if (result.success) {
        setShowEditModal(false)
        showMessage('success', result.message || 'Project updated successfully')
        loadProjects()
      } else {
        showMessage('error', result.error || 'Failed to update project')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to update project')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle delete project
  const handleDeleteProject = async () => {
    try {
      setActionLoading(true)
      const result = await projectsService.delete(selectedProject.id)

      if (result.success) {
        setShowDeleteModal(false)
        showMessage('success', result.message || 'Project closed successfully')
        loadProjects()
      } else {
        showMessage('error', result.error || 'Failed to close project')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to close project')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle assign user
  const handleAssignUser = async () => {
    try {
      setActionLoading(true)
      const result = await projectsService.assignUser(
        selectedProject.id,
        parseInt(assignFormData.userId),
        assignFormData.roleInProject
      )

      if (result.success) {
        setShowAssignModal(false)
        showMessage('success', result.message || 'User assigned successfully')
        // Refresh project users if the users modal is open
        if (showUsersModal) {
          const usersResult = await projectsService.getProjectUsers(selectedProject.id)
          if (usersResult.success) {
            setProjectUsers(usersResult.data || [])
          }
        }
        loadProjects()
      } else {
        showMessage('error', result.error || 'Failed to assign user')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to assign user')
    } finally {
      setActionLoading(false)
    }
  }

  // Handle remove user
  const handleRemoveUser = async (userId) => {
    try {
      setActionLoading(true)
      const result = await projectsService.removeUser(selectedProject.id, userId)

      if (result.success) {
        showMessage('success', result.message || 'User removed successfully')
        const usersResult = await projectsService.getProjectUsers(selectedProject.id)
        if (usersResult.success) {
          setProjectUsers(usersResult.data || [])
        }
        loadProjects()
      } else {
        showMessage('error', result.error || 'Failed to remove user')
      }
    } catch (err) {
      showMessage('error', err.message || 'Failed to remove user')
    } finally {
      setActionLoading(false)
    }
  }

  // Get role badge class - using design-system status-badge
  const getRoleBadgeClass = (role) => {
    const roleMap = {
      lead: 'warning',
      contributor: 'info',
      viewer: 'neutral'
    }
    return roleMap[role] || 'neutral'
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString()
  }

  // Table columns - using design-system patterns
  const columns = [
    {
      key: 'code',
      header: t('projectCode') || 'Code',
      sortable: true,
      render: (value, row) => {
        if (!row) return null
        return (
          <div>
            <strong>{row.code}</strong>
          </div>
        )
      }
    },
    {
      key: 'name',
      header: t('projectName') || 'Name',
      sortable: true,
      render: (value, row) => {
        if (!row) return null
        return (
          <div>
            <strong>{row.name}</strong>
            {row.description && (
              <div className="text-muted">{row.description.substring(0, 50)}{row.description.length > 50 ? '...' : ''}</div>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: t('status') || 'Status',
      sortable: true,
      filterable: true,
      filterOptions: [
        { value: 'active', label: t('active') || 'Active' },
        { value: 'closed', label: t('closed') || 'Closed' },
        { value: 'on_hold', label: t('onHold') || 'On Hold' },
        { value: 'pending', label: t('pending') || 'Pending' }
      ],
      render: (value, row) => {
        if (!row) return null
        const statusMap = {
          active: 'success',
          closed: 'danger',
          on_hold: 'warning',
          pending: 'info'
        }
        return (
          <span className={`status-badge ${statusMap[row.status] || 'neutral'}`}>
            {row.status === 'active' && <CheckCircle size={12} />}
            {row.status === 'closed' && <XCircle size={12} />}
            {row.status === 'on_hold' && <Pause size={12} />}
            {row.status === 'pending' && <Clock size={12} />}
            {row.status === 'active' ? t('active') || 'Active' :
             row.status === 'closed' ? t('closed') || 'Closed' :
             row.status === 'on_hold' ? t('onHold') || 'On Hold' :
             t('pending') || 'Pending'}
          </span>
        )
      }
    },
    {
      key: 'userCount',
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
            title={t('viewProjectUsers') || 'View Project Users'}
          >
            <Users size={14} />
            <span className="user-count-badge">{row.userCount || 0}</span>
          </button>
        )
      }
    },
    {
      key: 'start_date',
      header: t('startDate') || 'Start Date',
      sortable: true,
      render: (value, row) => {
        if (!row) return null
        return <span className="text-muted">{formatDate(row.start_date)}</span>
      }
    },
    {
      key: 'end_date',
      header: t('endDate') || 'End Date',
      sortable: true,
      render: (value, row) => {
        if (!row) return null
        return <span className="text-muted">{formatDate(row.end_date)}</span>
      }
    },
    {
      key: 'actions',
      header: t('actions') || 'Actions',
      render: (value, row) => {
        if (!row) return null
        const isGeneral = row.code === 'GENERAL'

        return (
          <div className="cell-actions">
            {canManageProjects && (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    openAssignModal(row)
                  }}
                  title={t('assignUser') || 'Assign User'}
                >
                  <UserPlus size={14} />
                </button>
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
                {!isGeneral && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      openDeleteModal(row)
                    }}
                    title={t('close') || 'Close'}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </>
            )}
          </div>
        )
      }
    }
  ]

  // Available users for assignment (not already assigned)
  const availableUsers = users.filter(u =>
    !projectUsers.some(pu => pu.id === u.id)
  )

  if (!canViewProjects) {
    return (
      <div className="access-denied">
        <AlertTriangle size={48} />
        <h2>{t('accessDenied') || 'Access Denied'}</h2>
        <p>{t('noPermissionToViewProjects') || 'You do not have permission to view projects.'}</p>
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

      {/* Summary Cards */}
      {statistics && (
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon info">
              <FolderKanban size={22} />
            </div>
            <div>
              <div className="summary-value">{statistics.total || 0}</div>
              <div className="summary-label">{t('totalProjects') || 'Total Projects'}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon success">
              <CheckCircle size={22} />
            </div>
            <div>
              <div className="summary-value">{statistics.byStatus?.active || 0}</div>
              <div className="summary-label">{t('activeProjects') || 'Active'}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon warning">
              <Pause size={22} />
            </div>
            <div>
              <div className="summary-value">{statistics.byStatus?.on_hold || 0}</div>
              <div className="summary-label">{t('onHoldProjects') || 'On Hold'}</div>
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-icon danger">
              <XCircle size={22} />
            </div>
            <div>
              <div className="summary-value">{statistics.byStatus?.closed || 0}</div>
              <div className="summary-label">{t('closedProjects') || 'Closed'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Projects Table */}
      <DataTable
        columns={columns}
        data={projects}
        loading={loading}
        title={t('projectManagement') || 'Project Management'}
        subtitle={t('projectManagementDesc') || 'Manage projects and user assignments for access control'}
        headerActions={
          <div className="header-actions-group">
            <button className="btn btn-outline" onClick={loadProjects}>
              <RefreshCw size={16} />
              {t('refresh') || 'Refresh'}
            </button>
            {canManageProjects && (
              <button className="btn btn-primary" onClick={openCreateModal}>
                <Plus size={16} />
                {t('createProject') || 'Create Project'}
              </button>
            )}
          </div>
        }
        searchable
        searchPlaceholder={t('searchProjects') || 'Search projects...'}
        emptyMessage={t('noProjectsFound') || 'No projects found'}
        onRowClick={canManageProjects ? openEditModal : undefined}
      />

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('createProject') || 'Create Project'}
        size="md"
      >
        <div className="project-form">
          <div className="form-grid">
            <div className="form-group">
              <label>{t('projectCode') || 'Project Code'} <span className="required">*</span></label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., PROJ-001"
              />
              <span className="form-hint">{t('projectCodeHint') || 'Uppercase letters, numbers, underscores, hyphens only'}</span>
            </div>
            <div className="form-group">
              <label>{t('status') || 'Status'}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">{t('active') || 'Active'}</option>
                <option value="pending">{t('pending') || 'Pending'}</option>
                <option value="on_hold">{t('onHold') || 'On Hold'}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('projectName') || 'Project Name'} <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder={t('enterProjectName') || 'Enter project name'}
            />
          </div>

          <div className="form-group">
            <label>{t('description') || 'Description'}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder={t('enterDescription') || 'Enter project description'}
              rows={3}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{t('startDate') || 'Start Date'}</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('endDate') || 'End Date'}</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowCreateModal(false)}
              disabled={actionLoading}
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleCreateProject}
              disabled={actionLoading || !formData.code || !formData.name}
            >
              {actionLoading ? t('creating') || 'Creating...' : t('create') || 'Create'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editProject') || 'Edit Project'}
        size="md"
      >
        <div className="project-form">
          <div className="form-grid">
            <div className="form-group">
              <label>{t('projectCode') || 'Project Code'}</label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                disabled={selectedProject?.code === 'GENERAL'}
              />
            </div>
            <div className="form-group">
              <label>{t('status') || 'Status'}</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="active">{t('active') || 'Active'}</option>
                <option value="pending">{t('pending') || 'Pending'}</option>
                <option value="on_hold">{t('onHold') || 'On Hold'}</option>
                <option value="closed">{t('closed') || 'Closed'}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>{t('projectName') || 'Project Name'} <span className="required">*</span></label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>{t('description') || 'Description'}</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{t('startDate') || 'Start Date'}</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>{t('endDate') || 'End Date'}</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
              />
            </div>
          </div>

          {/* S3 Attachments Section */}
          {selectedProject?.id && (
            <div className="form-section">
              <h4><FileText size={16} /> {t('attachments') || 'Attachments'}</h4>

              <FileUpload
                onUpload={async (files) => {
                  try {
                    const result = await uploadService.uploadMultipleToS3(files, 'projects', selectedProject.id)
                    if (result.success) {
                      // Refresh attachments list
                      const refreshResult = await uploadService.getS3Files('projects', selectedProject.id)
                      if (refreshResult.success) {
                        setAttachments(refreshResult.data.map(file => ({
                          id: file.id,
                          originalFilename: file.original_filename,
                          contentType: file.content_type,
                          fileSize: file.file_size,
                          downloadUrl: file.download_url
                        })))
                      }
                      setMessage({ type: 'success', text: t('filesUploadedSuccessfully') || 'Files uploaded successfully' })
                    }
                  } catch (err) {
                    setMessage({ type: 'error', text: err.message || t('uploadFailed') || 'Upload failed' })
                  }
                }}
                accept="*/*"
                maxFiles={10}
                maxSize={25 * 1024 * 1024}
              />

              {loadingAttachments ? (
                <div className="attachments-loading">{t('loadingAttachments') || 'Loading attachments...'}</div>
              ) : attachments.length > 0 ? (
                <FileViewer
                  files={attachments}
                  onDelete={async (fileId) => {
                    try {
                      const result = await uploadService.deleteS3File(fileId)
                      if (result.success) {
                        setAttachments(prev => prev.filter(f => f.id !== fileId))
                        setMessage({ type: 'success', text: t('fileDeletedSuccessfully') || 'File deleted successfully' })
                      }
                    } catch (err) {
                      setMessage({ type: 'error', text: err.message || t('deleteFailed') || 'Delete failed' })
                    }
                  }}
                  showDownload={true}
                  showDelete={true}
                />
              ) : (
                <div className="empty-state text-sm">{t('noAttachments')}</div>
              )}
            </div>
          )}

          <div className="form-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowEditModal(false)}
              disabled={actionLoading}
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleUpdateProject}
              disabled={actionLoading || !formData.name}
            >
              {actionLoading ? t('saving') || 'Saving...' : t('save') || 'Save'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title={t('closeProject') || 'Close Project'}
        size="sm"
      >
        <div className="delete-confirmation">
          <AlertTriangle size={48} className="warning-icon" />
          <p>
            {t('closeProjectConfirmation') || 'Are you sure you want to close this project?'}
          </p>
          <p className="project-info">
            <strong>{selectedProject?.code}</strong> - {selectedProject?.name}
          </p>
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowDeleteModal(false)}
              disabled={actionLoading}
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleDeleteProject}
              disabled={actionLoading}
            >
              {actionLoading ? t('closing') || 'Closing...' : t('close') || 'Close Project'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Project Users Modal */}
      <Modal
        isOpen={showUsersModal}
        onClose={() => setShowUsersModal(false)}
        title={`${t('projectUsers') || 'Project Users'} - ${selectedProject?.name || ''}`}
        size="md"
      >
        <div className="project-users-modal">
          {canManageProjects && selectedProject?.code !== 'GENERAL' && (
            <div className="users-header">
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowUsersModal(false)
                  openAssignModal(selectedProject)
                }}
                title={t('assignUser') || 'Assign User'}
              >
                <UserPlus size={16} />
                <span>{t('assignUser') || 'Assign User'}</span>
              </button>
            </div>
          )}

          {projectUsers.length === 0 ? (
            <div className="empty-users">
              <Users size={32} />
              <p>{t('noUsersAssigned') || 'No users assigned to this project'}</p>
            </div>
          ) : (
            <div className="users-list">
              {projectUsers.map((user) => (
                <div key={user.id} className="user-item">
                  <div className="user-info">
                    <span className="user-name">{user.firstName} {user.lastName}</span>
                    <span className="user-email">{user.email}</span>
                  </div>
                  <span className={`status-badge ${getRoleBadgeClass(user.role_in_project)}`}>
                    {user.role_in_project === 'lead' ? t('lead') || 'Lead' :
                     user.role_in_project === 'contributor' ? t('contributor') || 'Contributor' :
                     t('viewer') || 'Viewer'}
                  </span>
                  {canManageProjects && selectedProject?.code !== 'GENERAL' && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={actionLoading}
                      title={t('removeUser') || 'Remove User'}
                    >
                      <UserMinus size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

      {/* Assign User Modal */}
      <Modal
        isOpen={showAssignModal}
        onClose={() => setShowAssignModal(false)}
        title={`${t('assignUser') || 'Assign User'} - ${selectedProject?.name || ''}`}
        size="sm"
      >
        <div className="assign-user-form">
          <div className="form-group">
            <label>{t('selectUser') || 'Select User'} <span className="required">*</span></label>
            <select
              value={assignFormData.userId}
              onChange={(e) => setAssignFormData({ ...assignFormData, userId: e.target.value })}
            >
              <option value="">{t('selectUser') || 'Select a user...'}</option>
              {availableUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.email})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>{t('roleInProject') || 'Role in Project'}</label>
            <select
              value={assignFormData.roleInProject}
              onChange={(e) => setAssignFormData({ ...assignFormData, roleInProject: e.target.value })}
            >
              <option value="lead">{t('lead') || 'Lead'}</option>
              <option value="contributor">{t('contributor') || 'Contributor'}</option>
              <option value="viewer">{t('viewer') || 'Viewer'}</option>
            </select>
            <span className="form-hint">
              {assignFormData.roleInProject === 'lead' && (t('leadHint') || 'Full access to project data and management')}
              {assignFormData.roleInProject === 'contributor' && (t('contributorHint') || 'Can create and edit project data')}
              {assignFormData.roleInProject === 'viewer' && (t('viewerHint') || 'Read-only access to project data')}
            </span>
          </div>

          <div className="form-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowAssignModal(false)}
              disabled={actionLoading}
            >
              {t('cancel') || 'Cancel'}
            </button>
            <button
              className="btn btn-primary"
              onClick={handleAssignUser}
              disabled={actionLoading || !assignFormData.userId}
            >
              {actionLoading ? t('assigning') || 'Assigning...' : t('assign') || 'Assign'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default Projects
