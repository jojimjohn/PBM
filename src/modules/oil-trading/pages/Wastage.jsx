import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import wastageService from '../../../services/wastageService'
import materialService from '../../../services/materialService'
import WastageForm from '../components/WastageForm'
import WastageDetails from '../components/WastageDetails'
import WastageAnalytics from '../components/WastageAnalytics'
import {
  Plus,
  AlertTriangle,
  Eye,
  Edit,
  Trash2,
  Banknote,
  CheckCircle,
  Clock,
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
  const { hasPermission } = usePermissions()

  // Data state
  const [loading, setLoading] = useState(true)
  const [wastages, setWastages] = useState([])
  const [wasteTypes, setWasteTypes] = useState([])
  const [wasteTypesMap, setWasteTypesMap] = useState({})
  const [materials, setMaterials] = useState([])
  const [error, setError] = useState(null)

  // Summary data state
  const [summaryData, setSummaryData] = useState({
    totalWastages: 0,
    totalCost: 0,
    pendingCount: 0,
    approvedCount: 0
  })

  // Modal state
  const [showWastageForm, setShowWastageForm] = useState(false)
  const [showWastageDetails, setShowWastageDetails] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [selectedWastage, setSelectedWastage] = useState(null)
  const [editingWastage, setEditingWastage] = useState(null)

  // Filter state
  const [filters, setFilters] = useState({
    status: 'all',
    wasteType: 'all'
  })
  const [pendingFilterActive, setPendingFilterActive] = useState(false)

  useEffect(() => {
    loadWastageData()
  }, [selectedCompany])

  const loadWastageData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Load wastage data from backend
      const wastageResult = await wastageService.getAll()
      if (wastageResult.success) {
        const wastageData = wastageResult.data || []
        setWastages(wastageData)

        // Calculate summary from loaded data
        const pending = wastageData.filter(w => w.status === 'pending' || w.status === 'pending_approval').length
        const approved = wastageData.filter(w => w.status === 'approved').length
        const totalCost = wastageData.reduce((sum, w) => sum + (w.totalCost || (w.quantity * w.unitCost) || 0), 0)

        setSummaryData({
          totalWastages: wastageData.length,
          totalCost,
          pendingCount: pending,
          approvedCount: approved
        })
      } else {
        throw new Error(wastageResult.error || 'Failed to load wastages')
      }

      // Load wastage types
      const typesResult = await wastageService.getTypes()
      if (typesResult.success && typesResult.data) {
        // Convert to array format for dropdowns
        const typesArray = typesResult.data.map(type => ({
          value: type.key || type.value,
          label: type.name || type.label
        }))
        setWasteTypes(typesArray)

        // Also create a map for quick lookup
        const typesObj = {}
        typesResult.data.forEach(type => {
          typesObj[type.key || type.value] = {
            name: type.name || type.label,
            color: type.color || WASTAGE_TYPE_COLORS[type.key || type.value] || WASTAGE_TYPE_COLORS.other
          }
        })
        setWasteTypesMap(typesObj)
      }

      // Load materials
      const materialsResult = await materialService.getAll()
      if (materialsResult.success) {
        setMaterials(materialsResult.data || [])
      }

    } catch (error) {
      console.error('Error loading wastage data:', error)
      setError(error.message)
      setWastages([])
      setMaterials([])
    } finally {
      setLoading(false)
    }
  }

  // Refresh summary data after operations
  const refreshSummary = async () => {
    try {
      const result = await wastageService.getAnalytics({})
      if (result.success && result.data?.summary) {
        setSummaryData({
          totalWastages: result.data.summary.totalWastages || 0,
          totalCost: result.data.summary.totalCost || 0,
          pendingCount: result.data.summary.pendingCount || 0,
          approvedCount: result.data.summary.approvedCount || 0
        })
      }
    } catch (error) {
      console.error('Error refreshing summary:', error)
    }
  }

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

  // Handlers
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
    await loadWastageData()
  }

  const handleFormClose = () => {
    setShowWastageForm(false)
    setEditingWastage(null)
  }

  const handleDetailsClose = () => {
    setShowWastageDetails(false)
    setSelectedWastage(null)
  }

  const handleApproveWastage = async (wastageId, approvalData) => {
    try {
      const result = await wastageService.approve(wastageId, approvalData)
      if (result.success) {
        await loadWastageData()
        setShowWastageDetails(false)
        setSelectedWastage(null)
      } else {
        throw new Error(result.error || 'Failed to approve wastage')
      }
    } catch (error) {
      console.error('Error approving wastage:', error)
      throw error // Re-throw for WastageDetails to handle
    }
  }

  const handleRejectWastage = async (wastageId, rejectionData) => {
    try {
      const result = await wastageService.reject(wastageId, rejectionData)
      if (result.success) {
        await loadWastageData()
        setShowWastageDetails(false)
        setSelectedWastage(null)
      } else {
        throw new Error(result.error || 'Failed to reject wastage')
      }
    } catch (error) {
      console.error('Error rejecting wastage:', error)
      throw error // Re-throw for WastageDetails to handle
    }
  }

  const handleDeleteWastage = async (wastageId) => {
    if (window.confirm(t('confirmDelete', 'Are you sure you want to delete this item?'))) {
      try {
        setLoading(true)
        const result = await wastageService.delete(wastageId)

        if (result.success) {
          await loadWastageData()
        } else {
          throw new Error(result.error || 'Failed to delete wastage')
        }
      } catch (error) {
        console.error('Error deleting wastage:', error)
        setError(error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  // Handle pending card click
  const handlePendingCardClick = () => {
    if (!hasPermission('APPROVE_WASTAGE')) return

    if (pendingFilterActive) {
      // Remove filter
      setFilters(prev => ({ ...prev, status: 'all' }))
      setPendingFilterActive(false)
    } else {
      // Apply pending filter
      setFilters(prev => ({ ...prev, status: 'pending' }))
      setPendingFilterActive(true)
    }
  }

  // Filter wastages
  const filteredWastages = wastages.filter(wastage => {
    if (filters.status !== 'all') {
      // Handle both 'pending' and 'pending_approval' status values
      if (filters.status === 'pending') {
        if (wastage.status !== 'pending' && wastage.status !== 'pending_approval') return false
      } else if (wastage.status !== filters.status) {
        return false
      }
    }
    if (filters.wasteType !== 'all' && wastage.wasteType !== filters.wasteType) return false
    return true
  })

  return (
    <div className="page-container">
      {/* Error Display */}
      {error && (
        <div className="alert-error mb-4">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn-icon-close">×</button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon warning">
            <AlertTriangle size={22} />
          </div>
          <div>
            <div className="summary-value">{summaryData.totalWastages}</div>
            <div className="summary-label">{t('totalWastages', 'Total Wastages')}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon danger">
            <Banknote size={22} />
          </div>
          <div>
            <div className="summary-value">{formatCurrency(summaryData.totalCost)}</div>
            <div className="summary-label">{t('totalWasteCost', 'Total Waste Cost')}</div>
          </div>
        </div>

        <div
          className={`summary-card ${hasPermission('APPROVE_WASTAGE') ? 'clickable' : ''} ${pendingFilterActive ? 'active' : ''}`}
          onClick={handlePendingCardClick}
          title={hasPermission('APPROVE_WASTAGE') ? t('clickToFilter', 'Click to filter pending wastages') : ''}
        >
          <div className="summary-icon info">
            <Clock size={22} />
          </div>
          <div>
            <div className="summary-value">{summaryData.pendingCount}</div>
            <div className="summary-label">{t('pendingApproval', 'Pending Approval')}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon success">
            <CheckCircle size={22} />
          </div>
          <div>
            <div className="summary-value">{summaryData.approvedCount}</div>
            <div className="summary-label">{t('approved', 'Approved')}</div>
          </div>
        </div>
      </div>

      {/* Wastage Data Table - DataTable has built-in filtering */}
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
                      className="btn btn-outline btn-sm btn-danger"
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
        loading={loading}
        searchable={true}
        filterable={true}
        sortable={true}
        paginated={true}
        exportable={true}
        emptyMessage={t('noWastageRecords', 'No wastage records found')}
      />

      {/* WastageForm Modal */}
      <WastageForm
        isOpen={showWastageForm}
        onClose={handleFormClose}
        onSave={handleFormSave}
        materials={materials}
        wasteTypes={wasteTypes}
        initialData={editingWastage}
        isEditing={!!editingWastage}
      />

      {/* WastageDetails Modal */}
      <WastageDetails
        isOpen={showWastageDetails}
        onClose={handleDetailsClose}
        wastage={selectedWastage}
        materials={materials}
        wasteTypes={wasteTypes}
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
