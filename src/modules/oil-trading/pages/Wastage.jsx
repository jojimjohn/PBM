/**
 * Wastage Page
 *
 * Main page for wastage management. Uses custom hooks for:
 * - Data loading (useWastages)
 * - Filter management (useWastageFilters)
 * - Approval workflow (useWastageApproval)
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useProjects } from '../../../context/ProjectContext'
import { usePermissions } from '../../../hooks/usePermissions'
import DataTable from '../../../components/ui/DataTable'
import wastageService from '../../../services/wastageService'
import WastageForm from '../components/WastageForm'
import WastageDetails from '../components/WastageDetails'
import WastageAnalytics from '../components/WastageAnalytics'
import { WastageSummaryCards } from '../components/wastage'
// Import custom hooks
import { useWastages } from '../hooks/useWastages'
import { useWastageFilters } from '../hooks/useWastageFilters'
import { useWastageApproval } from '../hooks/useWastageApproval'
import {
  Plus,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  BarChart3
} from 'lucide-react'
import '../styles/Wastage.css'

// Wastage type colors for consistent styling across components
export const WASTAGE_TYPE_COLORS = {
  spillage: '#ef4444',        // red
  contamination: '#f97316',   // orange
  expiry: '#eab308',          // yellow
  damage: '#84cc16',          // lime
  theft: '#14b8a6',           // teal
  evaporation: '#06b6d4',     // cyan
  sorting_loss: '#3b82f6',    // blue
  quality_rejection: '#8b5cf6', // violet
  transport_loss: '#d946ef',  // fuchsia
  handling_damage: '#f43f5e', // rose
  other: '#6b7280'            // gray
}

const Wastage = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { selectedProjectId } = useProjects()
  const { hasPermission } = usePermissions()
  const [searchParams] = useSearchParams()

  // Read search param from URL (used when clicking tasks from dashboard)
  const urlSearchTerm = searchParams.get('search') || ''

  // ═══════════════════════════════════════════════════════════════════════════
  // HOOK: useWastages - Data loading with parallel fetching
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    wastages,
    isLoading,
    error: loadError,
    materials,
    wastageTypes,
    refresh: refreshData
  } = useWastages({
    autoLoad: true,
    projectId: selectedProjectId
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // HOOK: useWastageFilters - Filter state management
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    filters,
    setFilter,
    hasActiveFilters
  } = useWastageFilters({
    initialFilters: { searchTerm: urlSearchTerm }
  })

  // ═══════════════════════════════════════════════════════════════════════════
  // HOOK: useWastageApproval - Approval/rejection workflow
  // ═══════════════════════════════════════════════════════════════════════════
  const {
    approve,
    reject,
    isApproving,
    isRejecting,
    error: approvalError,
    clearError: clearApprovalError
  } = useWastageApproval({
    onSuccess: async () => {
      // Refresh data and close details modal after successful action
      await refreshData()
      setShowWastageDetails(false)
      setSelectedWastage(null)
    }
  })

  // Reload data when company or project changes
  useEffect(() => {
    refreshData()
  }, [selectedCompany, selectedProjectId])

  // ═══════════════════════════════════════════════════════════════════════════
  // LOCAL STATE - UI modals and selections
  // ═══════════════════════════════════════════════════════════════════════════
  const [showWastageForm, setShowWastageForm] = useState(false)
  const [showWastageDetails, setShowWastageDetails] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedWastage, setSelectedWastage] = useState(null)
  const [editingWastage, setEditingWastage] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [pendingFilterActive, setPendingFilterActive] = useState(false)

  // Combine errors from different sources
  const error = loadError || deleteError || approvalError

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED: Summary statistics from wastages data
  // ═══════════════════════════════════════════════════════════════════════════
  const summaryData = useMemo(() => {
    if (!wastages.length) {
      return { totalWastages: 0, totalCost: 0, pendingCount: 0, approvedCount: 0 }
    }

    const pending = wastages.filter(w => w.status === 'pending' || w.status === 'pending_approval').length
    const approved = wastages.filter(w => w.status === 'approved').length
    const totalCost = wastages.reduce((sum, w) => sum + (w.totalCost || (w.quantity * w.unitCost) || 0), 0)

    return {
      totalWastages: wastages.length,
      totalCost,
      pendingCount: pending,
      approvedCount: approved
    }
  }, [wastages])

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED: Wastage types map for quick lookup
  // ═══════════════════════════════════════════════════════════════════════════
  const wasteTypesMap = useMemo(() => {
    const map = {}
    wastageTypes.forEach(type => {
      const key = type.key || type.value
      map[key] = {
        name: type.name || type.label,
        color: type.color || WASTAGE_TYPE_COLORS[key] || WASTAGE_TYPE_COLORS.other
      }
    })
    return map
  }, [wastageTypes])

  // Convert wastageTypes to format needed by WastageForm
  const wasteTypesForForm = useMemo(() => {
    return wastageTypes.map(type => ({
      value: type.key || type.value,
      label: type.name || type.label
    }))
  }, [wastageTypes])

  // ═══════════════════════════════════════════════════════════════════════════
  // COMPUTED: Filtered wastages based on current filters
  // ═══════════════════════════════════════════════════════════════════════════
  const filteredWastages = useMemo(() => {
    return wastages.filter(wastage => {
      // Status filter
      if (filters.status !== 'all') {
        if (filters.status === 'pending') {
          if (wastage.status !== 'pending' && wastage.status !== 'pending_approval') return false
        } else if (wastage.status !== filters.status) {
          return false
        }
      }

      // Material filter
      if (filters.materialId !== 'all' && String(wastage.materialId) !== String(filters.materialId)) {
        return false
      }

      // Wastage type filter
      if (filters.wastageTypeId !== 'all' && wastage.wasteType !== filters.wastageTypeId) {
        return false
      }

      return true
    })
  }, [wastages, filters])

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS: Formatting functions
  // ═══════════════════════════════════════════════════════════════════════════
  const formatCurrency = (amount) => {
    return `OMR ${parseFloat(amount || 0).toFixed(3)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: t('pendingApproval', 'Pending Approval'), class: 'warning' },
      pending_approval: { label: t('pendingApproval', 'Pending Approval'), class: 'warning' },
      approved: { label: t('approved', 'Approved'), class: 'success' },
      rejected: { label: t('rejected', 'Rejected'), class: 'danger' }
    }
    return statusConfig[status] || { label: status, class: 'default' }
  }

  const getWasteTypeInfo = (wasteType) => {
    return wasteTypesMap[wasteType] || { name: wasteType, color: WASTAGE_TYPE_COLORS.other }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HANDLERS: User interactions
  // ═══════════════════════════════════════════════════════════════════════════
  const handleAddWastage = () => {
    setEditingWastage(null)
    setShowWastageForm(true)
  }

  const handleEditWastage = (wastage) => {
    setEditingWastage(wastage)
    setShowWastageForm(true)
  }

  const handleViewWastage = (wastage) => {
    setSelectedWastage(wastage)
    setShowWastageDetails(true)
  }

  const handleFormSave = async () => {
    setShowWastageForm(false)
    setEditingWastage(null)
    await refreshData()
  }

  const handleFormClose = () => {
    setShowWastageForm(false)
    setEditingWastage(null)
  }

  const handleDetailsClose = () => {
    setShowWastageDetails(false)
    setSelectedWastage(null)
    clearApprovalError()
  }

  // Approval handler - uses useWastageApproval hook
  const handleApproveWastage = useCallback(async (wastageId, approvalData) => {
    const success = await approve(String(wastageId), approvalData.approvalNotes)
    if (!success) {
      throw new Error(approvalError || 'Failed to approve wastage')
    }
  }, [approve, approvalError])

  // Rejection handler - uses useWastageApproval hook
  const handleRejectWastage = useCallback(async (wastageId, rejectionData) => {
    const success = await reject(String(wastageId), rejectionData.approvalNotes)
    if (!success) {
      throw new Error(approvalError || 'Failed to reject wastage')
    }
  }, [reject, approvalError])

  // Delete handler
  const handleDeleteWastage = async (wastageId) => {
    if (window.confirm(t('confirmDelete', 'Are you sure you want to delete this item?'))) {
      try {
        setDeleteError(null)
        const result = await wastageService.delete(wastageId)

        if (result.success) {
          await refreshData()
        } else {
          throw new Error(result.error || 'Failed to delete wastage')
        }
      } catch (err) {
        setDeleteError(err.message)
      }
    }
  }

  // Handle pending card click - toggles pending filter
  const handlePendingCardClick = () => {
    if (!hasPermission('APPROVE_WASTAGE')) return

    if (pendingFilterActive) {
      setFilter('status', 'all')
      setPendingFilterActive(false)
    } else {
      setFilter('status', 'pending')
      setPendingFilterActive(true)
    }
  }

  // Clear all errors
  const clearAllErrors = () => {
    setDeleteError(null)
    clearApprovalError()
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="page-container">
      {/* Error Display */}
      {error && (
        <div className="alert-error mb-4">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={clearAllErrors} className="btn-icon-close">×</button>
        </div>
      )}

      {/* Summary Cards - Using reusable WastageSummaryCards component */}
      <WastageSummaryCards
        totalWastages={summaryData.totalWastages}
        totalCost={summaryData.totalCost}
        pendingCount={summaryData.pendingCount}
        approvedCount={summaryData.approvedCount}
        loading={isLoading}
        onPendingClick={hasPermission('APPROVE_WASTAGE') ? handlePendingCardClick : undefined}
        pendingFilterActive={pendingFilterActive}
      />

      {/* Wastage Data Table */}
      <DataTable
        data={filteredWastages.map(wastage => ({
          ...wastage,
          wasteTypeInfo: getWasteTypeInfo(wastage.wasteType),
          statusInfo: getStatusBadge(wastage.status),
          formattedDate: formatDate(wastage.wastageDate || wastage.date),
          formattedCost: formatCurrency(wastage.totalCost || (wastage.quantity * wastage.unitCost))
        }))}
        columns={[
          {
            key: 'materialCode',
            header: t('material', 'Material'),
            sortable: true,
            filterable: true,
            render: (value, row) => {
              const material = materials.find(m => m.id === row.materialId || m.materialCode === value)
              return (
                <div className="cell-info">
                  <span className="cell-code">{value || row.materialCode || '-'}</span>
                  {material && <span className="cell-text-secondary">{material.name}</span>}
                </div>
              )
            }
          },
          {
            key: 'wasteType',
            header: t('wasteType', 'Waste Type'),
            sortable: true,
            filterable: true,
            render: (value, row) => (
              <span className={`waste-type-badge ${value || 'other'}`}>
                {row.wasteTypeInfo?.name || value}
              </span>
            )
          },
          {
            key: 'quantity',
            header: t('quantity', 'Quantity'),
            sortable: true,
            align: 'right',
            render: (value, row) => `${value} ${row.unit || ''}`
          },
          {
            key: 'totalCost',
            header: t('totalCost', 'Total Cost'),
            sortable: true,
            align: 'right',
            render: (value, row) => row.formattedCost
          },
          {
            key: 'formattedDate',
            header: t('date', 'Date'),
            sortable: true
          },
          {
            key: 'status',
            header: t('status', 'Status'),
            sortable: true,
            filterable: true,
            render: (value, row) => (
              <span className={`status-badge ${row.statusInfo.class}`}>
                {row.statusInfo.label}
              </span>
            )
          },
          {
            key: 'actions',
            header: t('actions', 'Actions'),
            sortable: false,
            render: (value, row) => (
              <div className="cell-actions">
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => handleViewWastage(row)}
                  title={t('viewDetails', 'View Details')}
                >
                  <Eye size={14} />
                </button>
                {hasPermission('EDIT_WASTAGE') && (row.status === 'pending' || row.status === 'pending_approval') && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleEditWastage(row)}
                    title={t('edit', 'Edit')}
                  >
                    <Edit size={14} />
                  </button>
                )}
                {hasPermission('DELETE_WASTAGE') && (row.status === 'pending' || row.status === 'pending_approval') && (
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteWastage(row.id)}
                    title={t('delete', 'Delete')}
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            )
          }
        ]}
        title={t('wastageManagement', 'Wastage Management')}
        subtitle={t('trackWastageAndLosses', 'Track material wastage and losses')}
        headerActions={
          <>
            <button
              className="btn btn-outline"
              onClick={() => setShowAnalytics(true)}
            >
              <BarChart3 size={16} />
              {t('viewAnalytics', 'View Analytics')}
            </button>
            {hasPermission('CREATE_WASTAGE') && (
              <button
                className="btn btn-primary"
                onClick={handleAddWastage}
              >
                <Plus size={16} />
                {t('reportWastage', 'Report Wastage')}
              </button>
            )}
          </>
        }
        loading={isLoading}
        searchable={true}
        filterable={true}
        sortable={true}
        paginated={true}
        exportable={true}
        emptyMessage={t('noWastageRecords', 'No wastage records found')}
        initialSearchTerm={urlSearchTerm}
      />

      {/* WastageForm Modal */}
      <WastageForm
        isOpen={showWastageForm}
        onClose={handleFormClose}
        onSave={handleFormSave}
        materials={materials}
        wasteTypes={wasteTypesForForm}
        initialData={editingWastage}
        isEditing={!!editingWastage}
      />

      {/* WastageDetails Modal */}
      <WastageDetails
        isOpen={showWastageDetails}
        onClose={handleDetailsClose}
        wastage={selectedWastage}
        materials={materials}
        wasteTypes={wasteTypesForForm}
        onApprove={handleApproveWastage}
        onReject={handleRejectWastage}
        canApprove={hasPermission('APPROVE_WASTAGE')}
      />

      {/* WastageAnalytics Modal */}
      <WastageAnalytics
        isOpen={showAnalytics}
        onClose={() => setShowAnalytics(false)}
      />
    </div>
  )
}

export default Wastage
