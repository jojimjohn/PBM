import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import LoadingSpinner from '../components/LoadingSpinner'
import DataTable from '../components/ui/DataTable'
import Modal from '../components/ui/Modal'
import StockChart from '../components/StockChart'
import { 
  Plus, 
  AlertTriangle, 
  Eye, 
  Edit, 
  Trash2, 
  Calendar,
  DollarSign,
  Package,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  BarChart3,
  Download
} from 'lucide-react'
import './Wastage.css'

const Wastage = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [wastages, setWastages] = useState([])
  const [wasteTypes, setWasteTypes] = useState({})
  const [materials, setMaterials] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedWastage, setSelectedWastage] = useState(null)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showChartsModal, setShowChartsModal] = useState(false)
  const [filters, setFilters] = useState({
    status: 'all',
    wasteType: 'all',
    dateRange: 'all'
  })

  useEffect(() => {
    loadWastageData()
  }, [selectedCompany])

  const loadWastageData = async () => {
    try {
      setLoading(true)
      
      // Load wastage data
      const wastageResponse = await fetch('/data/wastages.json')
      const wastageData = await wastageResponse.json()
      const companyWastages = wastageData.wastages[selectedCompany?.id] || []
      setWastages(companyWastages)
      setWasteTypes(wastageData.wasteTypes)
      
      // Load materials
      const materialsResponse = await fetch('/data/materials.json')
      const materialsData = await materialsResponse.json()
      const companyMaterials = materialsData.materials[selectedCompany?.id] || []
      setMaterials(companyMaterials)
      
    } catch (error) {
      console.error('Error loading wastage data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return `OMR ${parseFloat(amount).toFixed(3)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_approval: { label: t('pendingApproval', 'Pending Approval'), class: 'warning' },
      approved: { label: t('approved', 'Approved'), class: 'success' },
      rejected: { label: t('rejected', 'Rejected'), class: 'danger' }
    }
    
    return statusConfig[status] || { label: status, class: 'default' }
  }

  const getWasteTypeInfo = (wasteType) => {
    return wasteTypes[wasteType] || { name: wasteType, color: '#666' }
  }

  const calculateTotalWasteCost = () => {
    return wastages.reduce((sum, wastage) => sum + (wastage.totalCost || 0), 0)
  }

  const getWastagesByMonth = () => {
    const monthlyData = {}
    
    wastages.forEach(wastage => {
      const month = new Date(wastage.date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' })
      if (!monthlyData[month]) {
        monthlyData[month] = { quantity: 0, cost: 0, count: 0 }
      }
      monthlyData[month].quantity += wastage.quantity
      monthlyData[month].cost += wastage.totalCost
      monthlyData[month].count += 1
    })
    
    return Object.entries(monthlyData).map(([month, data]) => ({
      name: month,
      materialCode: month,
      currentStock: data.quantity,  // Use quantity as currentStock for display
      totalValue: data.cost,        // Use cost as totalValue
      openingStock: 0,              // Not applicable for monthly data
      reorderLevel: data.count,     // Use count as reorderLevel
      count: data.count
    }))
  }

  const handleAddWastage = () => {
    setSelectedWastage(null)
    setShowAddForm(true)
  }

  const handleEditWastage = (wastage) => {
    setSelectedWastage(wastage)
    setShowEditForm(true)
  }

  const handleViewWastage = (wastage) => {
    setSelectedWastage(wastage)
    setShowViewModal(true)
  }

  const handleDeleteWastage = (wastageId) => {
    if (window.confirm(t('confirmDelete', 'Are you sure you want to delete this item?'))) {
      setWastages(prev => prev.filter(w => w.id !== wastageId))
    }
  }

  const filteredWastages = wastages.filter(wastage => {
    if (filters.status !== 'all' && wastage.status !== filters.status) return false
    if (filters.wasteType !== 'all' && wastage.wasteType !== filters.wasteType) return false
    return true
  })

  const wasteChartData = Object.entries(wasteTypes).map(([key, type]) => {
    const typeWastages = wastages.filter(w => w.wasteType === key)
    const totalCost = typeWastages.reduce((sum, w) => sum + w.totalCost, 0)
    const totalQuantity = typeWastages.reduce((sum, w) => sum + w.quantity, 0)
    
    return {
      name: type.name,
      materialCode: type.name,
      currentStock: totalQuantity, // Use totalQuantity as currentStock for display
      totalValue: totalCost,       // Use totalCost as totalValue
      openingStock: 0,             // Not applicable for wastage
      reorderLevel: typeWastages.length, // Use count as reorderLevel
      count: typeWastages.length
    }
  }).filter(item => item.count > 0)

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message={t('loadingWastageData', 'Loading wastage data...')} size="large" />
      </div>
    )
  }

  return (
    <div className="wastage-page">
      <div className="page-header">
        <div className="header-left">
          <h1>{t('wastageManagement', 'Wastage Management')}</h1>
          <p>{t('trackWastageAndLosses', 'Track material wastage and losses')}</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowChartsModal(true)}
          >
            <BarChart3 size={16} />
            {t('viewAnalytics', 'View Analytics')}
          </button>
          <button 
            className="btn btn-primary"
            onClick={handleAddWastage}
          >
            <Plus size={16} />
            {t('reportWastage', 'Report Wastage')}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon warning">
            <AlertTriangle size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">{wastages.length}</div>
            <div className="card-label">{t('totalWastages', 'Total Wastages')}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon danger">
            <DollarSign size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">{formatCurrency(calculateTotalWasteCost())}</div>
            <div className="card-label">{t('totalWasteCost', 'Total Waste Cost')}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon info">
            <Clock size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">
              {wastages.filter(w => w.status === 'pending_approval').length}
            </div>
            <div className="card-label">{t('pendingApproval', 'Pending Approval')}</div>
          </div>
        </div>
        
        <div className="summary-card">
          <div className="card-icon success">
            <CheckCircle size={24} />
          </div>
          <div className="card-content">
            <div className="card-value">
              {wastages.filter(w => w.status === 'approved').length}
            </div>
            <div className="card-label">{t('approved', 'Approved')}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <label>{t('status')}:</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({...filters, status: e.target.value})}
          >
            <option value="all">{t('allStatus', 'All Status')}</option>
            <option value="pending_approval">{t('pendingApproval', 'Pending Approval')}</option>
            <option value="approved">{t('approved', 'Approved')}</option>
            <option value="rejected">{t('rejected', 'Rejected')}</option>
          </select>
        </div>

        <div className="filter-group">
          <label>{t('wasteType', 'Waste Type')}:</label>
          <select
            value={filters.wasteType}
            onChange={(e) => setFilters({...filters, wasteType: e.target.value})}
          >
            <option value="all">{t('allTypes', 'All Types')}</option>
            {Object.entries(wasteTypes).map(([key, type]) => (
              <option key={key} value={key}>{type.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Wastage Data Table */}
      <div className="wastage-table">
        <DataTable
          data={filteredWastages.map(wastage => ({
            ...wastage,
            wasteTypeInfo: getWasteTypeInfo(wastage.wasteType),
            statusInfo: getStatusBadge(wastage.status),
            formattedDate: formatDate(wastage.date),
            formattedCost: formatCurrency(wastage.totalCost)
          }))}
          columns={[
            {
              key: 'materialCode',
              header: t('material'),
              sortable: true,
              filterable: true
            },
            {
              key: 'wasteType',
              header: t('wasteType', 'Waste Type'),
              sortable: true,
              filterable: true,
              render: (value, row) => (
                <span className="waste-type-badge" style={{ backgroundColor: row.wasteTypeInfo.color + '20', color: row.wasteTypeInfo.color }}>
                  {row.wasteTypeInfo.name}
                </span>
              )
            },
            {
              key: 'quantity',
              header: t('quantity'),
              sortable: true,
              align: 'right',
              render: (value, row) => `${value} ${row.unit}`
            },
            {
              key: 'totalCost',
              header: t('totalCost', 'Total Cost'),
              sortable: true,
              align: 'right',
              render: (value) => formatCurrency(value)
            },
            {
              key: 'formattedDate',
              header: t('date'),
              sortable: true
            },
            {
              key: 'status',
              header: t('status'),
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
              header: t('actions'),
              sortable: false,
              render: (value, row) => (
                <div className="action-buttons">
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => handleViewWastage(row)}
                    title={t('viewDetails')}
                  >
                    <Eye size={14} />
                  </button>
                  {hasPermission('EDIT_WASTAGE') && (
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => handleEditWastage(row)}
                      title={t('edit')}
                    >
                      <Edit size={14} />
                    </button>
                  )}
                  {hasPermission('DELETE_WASTAGE') && (
                    <button
                      className="btn btn-outline btn-sm btn-danger"
                      onClick={() => handleDeleteWastage(row.id)}
                      title={t('delete')}
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              )
            }
          ]}
          title={t('wastageRecords', 'Wastage Records')}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          emptyMessage={t('noWastageRecords', 'No wastage records found')}
        />
      </div>

      {/* Charts Modal */}
      {showChartsModal && (
        <Modal
          title={t('wastageAnalytics', 'Wastage Analytics')}
          onClose={() => setShowChartsModal(false)}
          className="modal-xl"
        >
          <div className="charts-container">
            <StockChart
              inventoryData={wasteChartData}
              title={t('wastageByType', 'Wastage by Type')}
              height={350}
              fieldLabels={{
                currentStock: t('totalQuantity', 'Total Quantity'),
                openingStock: t('baselineQuantity', 'Baseline'),
                reorderLevel: t('wasteCount', 'Waste Count'),
                totalValue: t('totalCost', 'Total Cost')
              }}
            />
            
            <div className="monthly-chart">
              <StockChart
                inventoryData={getWastagesByMonth()}
                title={t('monthlyWastageTrends', 'Monthly Wastage Trends')}
                height={350}
                fieldLabels={{
                  currentStock: t('monthlyQuantity', 'Monthly Quantity'),
                  openingStock: t('baselineQuantity', 'Baseline'),
                  reorderLevel: t('incidentCount', 'Incident Count'),
                  totalValue: t('monthlyCost', 'Monthly Cost')
                }}
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Wastage