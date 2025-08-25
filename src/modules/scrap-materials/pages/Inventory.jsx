import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import MaterialEntryForm from '../components/MaterialEntryForm'
import { 
  Eye, 
  Edit, 
  Package, 
  Truck, 
  DollarSign, 
  Plus, 
  Camera,
  Filter,
  Download,
  Grid3X3,
  List,
  CheckCircle,
  AlertTriangle,
  Calendar,
  User,
  MapPin
} from 'lucide-react'
import '../styles/Inventory.css'

const ScrapMaterialsInventory = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState([])
  const [materials, setMaterials] = useState([])
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingEntry, setEditingEntry] = useState(null)
  const [viewMode, setViewMode] = useState('table') // 'grid' or 'table'
  const [activeTab, setActiveTab] = useState('materials') // 'materials' or 'storage'
  const [filters, setFilters] = useState({
    materialCategory: 'all',
    transactionType: 'all',
    condition: 'all',
    search: ''
  })

  // Load data on component mount
  useEffect(() => {
    loadInventoryData()
  }, [selectedCompany])

  const loadInventoryData = async () => {
    try {
      setLoading(true)
      
      // Load inventory data
      const inventoryResponse = await fetch('/data/inventory.json')
      const inventoryData = await inventoryResponse.json()
      const companyInventory = inventoryData.inventory[selectedCompany?.id] || []
      
      // Load materials data
      const materialsResponse = await fetch('/data/materials.json')
      const materialsData = await materialsResponse.json()
      const companyMaterials = materialsData.materials[selectedCompany?.id] || []
      
      setInventory(companyInventory)
      setMaterials(companyMaterials)
    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `OMR ${parseFloat(amount).toFixed(3)}`
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB')

  const getTransactionTypeInfo = (type) => {
    const types = {
      collected: { label: t('collected', 'Collected'), icon: Package, color: '#059669' },
      purchased: { label: t('purchased', 'Purchased'), icon: Truck, color: '#3b82f6' },
      supplied: { label: t('supplied', 'Supplied'), icon: User, color: '#8b5cf6' },
      walk_in: { label: t('walkIn', 'Walk-in'), icon: MapPin, color: '#f59e0b' }
    }
    return types[type] || { label: type, icon: Package, color: '#6b7280' }
  }

  const getConditionBadge = (condition, isTyre) => {
    if (!isTyre || !condition) return null
    
    const configs = {
      good: { label: t('good', 'Good'), class: 'success', icon: CheckCircle },
      bad: { label: t('bad', 'Bad'), class: 'danger', icon: AlertTriangle }
    }
    
    const config = configs[condition] || { label: condition, class: 'default', icon: Package }
    return config
  }

  const getMaterialInfo = (materialId) => {
    return materials.find(m => m.id === materialId) || {}
  }

  const getFilteredInventory = () => {
    return inventory.filter(item => {
      const material = getMaterialInfo(item.materialId)
      
      // Filter by material category
      if (filters.materialCategory !== 'all' && item.materialCategory !== filters.materialCategory) {
        return false
      }
      
      // Filter by transaction type
      if (filters.transactionType !== 'all' && item.transactionType !== filters.transactionType) {
        return false
      }
      
      // Filter by condition (tyres only)
      if (filters.condition !== 'all') {
        if (filters.condition === 'with_condition' && !item.condition) return false
        if (filters.condition !== 'with_condition' && item.condition !== filters.condition) return false
      }
      
      // Search filter
      if (filters.search) {
        const searchLower = filters.search.toLowerCase()
        const searchFields = [
          item.materialCode,
          material.name,
          item.sourceDetails?.name,
          item.notes
        ].filter(Boolean)
        
        return searchFields.some(field => 
          field.toLowerCase().includes(searchLower)
        )
      }
      
      return true
    })
  }

  const handleSaveMaterial = async (materialData) => {
    try {
      console.log('Saving material entry:', materialData)
      
      // In a real app, this would be an API call
      if (editingEntry) {
        // Update existing entry
        setInventory(prev => prev.map(item => 
          item.materialId === editingEntry.materialId ? materialData : item
        ))
      } else {
        // Add new entry
        setInventory(prev => [...prev, materialData])
      }
      
      setShowMaterialForm(false)
      setEditingEntry(null)
    } catch (error) {
      console.error('Error saving material entry:', error)
    }
  }

  const handleEditEntry = (entry) => {
    setEditingEntry(entry)
    setShowMaterialForm(true)
  }

  // Define columns for DataTable
  const getTableColumns = () => {
    const columns = [
      {
        key: 'materialInfo',
        header: t('material', 'Material'),
        sortable: true,
        render: (value, row) => {
          const material = getMaterialInfo(row.materialId)
          const isTyre = row.materialCategory === 'tyres'
          
          return (
            <div className="material-info-cell">
              <div className="material-primary">
                <strong>{material.name || row.materialCode}</strong>
                {isTyre && (
                  <div className="tyre-indicator">
                    <Camera size={12} />
                    <span>{t('tyre', 'Tyre')}</span>
                  </div>
                )}
              </div>
              <div className="material-secondary">
                <span className="material-code">{row.materialCode}</span>
                {row.condition && (
                  <span className={`condition-badge ${getConditionBadge(row.condition, isTyre)?.class}`}>
                    {getConditionBadge(row.condition, isTyre)?.label}
                  </span>
                )}
              </div>
            </div>
          )
        }
      },
      {
        key: 'transactionType',
        header: t('transactionType', 'Transaction Type'),
        filterable: true,
        render: (value, row) => {
          const typeInfo = getTransactionTypeInfo(value)
          const TypeIcon = typeInfo.icon
          
          return (
            <div className="transaction-type-cell">
              <TypeIcon size={14} style={{ color: typeInfo.color }} />
              <span>{typeInfo.label}</span>
            </div>
          )
        }
      },
      {
        key: 'sourceDetails',
        header: t('source', 'Source'),
        render: (value, row) => (
          <div className="source-info">
            <div className="source-name">{value?.name || 'N/A'}</div>
            <div className="source-type">{value?.type || ''}</div>
          </div>
        )
      },
      {
        key: 'currentStock',
        header: t('quantity', 'Quantity'),
        sortable: true,
        type: 'number',
        render: (value, row) => (
          <div className="quantity-cell">
            <span className="quantity">{value?.toLocaleString()}</span>
            <span className="unit">{row.unit}</span>
          </div>
        )
      },
      {
        key: 'averageCost',
        header: t('avgCost', 'Avg Cost'),
        sortable: true,
        type: 'currency',
        render: (value) => formatCurrency(value || 0)
      },
      {
        key: 'totalValue',
        header: t('totalValue', 'Total Value'),
        sortable: true,
        type: 'currency',
        render: (value) => formatCurrency(value || 0)
      },
      {
        key: 'dateOfEntry',
        header: t('dateOfEntry', 'Date of Entry'),
        sortable: true,
        render: (value) => value ? formatDate(value) : 'N/A'
      }
    ]

    // Add photos column if user can view images
    if (hasPermission('VIEW_INVENTORY')) {
      columns.push({
        key: 'photos',
        header: t('photos', 'Photos'),
        render: (value, row) => {
          if (!value || value.length === 0) return <span className="no-photos">—</span>
          
          return (
            <div className="photos-preview">
              <Camera size={16} />
              <span>{value.length} {t('photos', 'photos')}</span>
            </div>
          )
        }
      })
    }

    // Add actions column if user has permissions
    if (hasPermission('MANAGE_INVENTORY')) {
      columns.push({
        key: 'actions',
        header: t('actions', 'Actions'),
        render: (value, row) => (
          <div className="action-buttons">
            <button
              onClick={() => console.log('View details:', row)}
              className="action-btn view"
              title={t('viewDetails', 'View Details')}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={() => handleEditEntry(row)}
              className="action-btn edit"
              title={t('edit', 'Edit')}
            >
              <Edit size={14} />
            </button>
          </div>
        )
      })
    }

    return columns
  }

  // Calculate summary statistics
  const getSummaryStats = () => {
    const filtered = getFilteredInventory()
    
    const totalEntries = filtered.length
    const totalValue = filtered.reduce((sum, item) => sum + (item.totalValue || 0), 0)
    const tyreEntries = filtered.filter(item => item.materialCategory === 'tyres').length
    const goodTyres = filtered.filter(item => item.condition === 'good').length
    const badTyres = filtered.filter(item => item.condition === 'bad').length
    
    return {
      totalEntries,
      totalValue,
      tyreEntries,
      goodTyres,
      badTyres
    }
  }

  const stats = getSummaryStats()

  if (loading) {
    return (
      <div className="inventory-loading">
        <LoadingSpinner size="large" />
        <p>{t('loadingInventory', 'Loading inventory...')}</p>
      </div>
    )
  }

  return (
    <div className="scrap-inventory-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>{t('materialInventory', 'Material Inventory')}</h1>
          <p className="page-subtitle">
            {t('trackMaterialsAndTyres', 'Track materials, tyres, and collection sources')}
          </p>
        </div>
        
        <div className="header-actions">
          {hasPermission('MANAGE_INVENTORY') && (
            <button
              className="btn-primary add-material-btn"
              onClick={() => {
                setEditingEntry(null)
                setShowMaterialForm(true)
              }}
            >
              <Plus size={20} />
              {t('addMaterial', 'Add Material')}
            </button>
          )}
        </div>
      </div>

      {/* Summary Stats Cards */}
      <div className="summary-stats">
        <div className="stat-card">
          <div className="stat-icon">
            <Package />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalEntries}</div>
            <div className="stat-label">{t('totalMaterials', 'Total Materials')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon">
            <DollarSign />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(stats.totalValue)}</div>
            <div className="stat-label">{t('totalValue', 'Total Value')}</div>
          </div>
        </div>
        
        <div className="stat-card tyre-card">
          <div className="stat-icon">
            <Camera />
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.tyreEntries}</div>
            <div className="stat-label">{t('tyres', 'Tyres')}</div>
            {stats.tyreEntries > 0 && (
              <div className="tyre-breakdown">
                <span className="good-tyres">{stats.goodTyres} {t('good', 'Good')}</span>
                <span className="separator">•</span>
                <span className="bad-tyres">{stats.badTyres} {t('bad', 'Bad')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="inventory-filters">
        <div className="filter-group">
          <label>{t('search', 'Search')}</label>
          <input
            type="text"
            placeholder={t('searchMaterials', 'Search materials, sources...')}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>
        
        <div className="filter-group">
          <label>{t('category', 'Category')}</label>
          <select
            value={filters.materialCategory}
            onChange={(e) => setFilters(prev => ({ ...prev, materialCategory: e.target.value }))}
          >
            <option value="all">{t('allCategories', 'All Categories')}</option>
            <option value="tyres">{t('tyres', 'Tyres')}</option>
            <option value="metal_scrap">{t('metalScrap', 'Metal Scrap')}</option>
            <option value="plastic_scrap">{t('plasticScrap', 'Plastic Scrap')}</option>
            <option value="electronic_waste">{t('electronicWaste', 'Electronic Waste')}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>{t('transactionType', 'Transaction Type')}</label>
          <select
            value={filters.transactionType}
            onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
          >
            <option value="all">{t('allTypes', 'All Types')}</option>
            <option value="collected">{t('collected', 'Collected')}</option>
            <option value="purchased">{t('purchased', 'Purchased')}</option>
            <option value="supplied">{t('supplied', 'Supplied')}</option>
            <option value="walk_in">{t('walkIn', 'Walk-in')}</option>
          </select>
        </div>
        
        <div className="filter-group">
          <label>{t('condition', 'Condition')}</label>
          <select
            value={filters.condition}
            onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
          >
            <option value="all">{t('allConditions', 'All Conditions')}</option>
            <option value="good">{t('good', 'Good')}</option>
            <option value="bad">{t('bad', 'Bad')}</option>
            <option value="with_condition">{t('withCondition', 'Items with Condition')}</option>
          </select>
        </div>
      </div>

      {/* View Mode Toggle */}
      <div className="view-controls">
        <div className="view-toggle">
          <button
            className={`toggle-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
          >
            <List size={16} />
            {t('table', 'Table')}
          </button>
          <button
            className={`toggle-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 size={16} />
            {t('grid', 'Grid')}
          </button>
        </div>
      </div>

      {/* Inventory Data Display */}
      <div className="inventory-content">
        {viewMode === 'table' ? (
          <DataTable
            data={getFilteredInventory()}
            columns={getTableColumns()}
            searchable={false} // We have custom search
            exportable={true}
            title={t('materialInventory', 'Material Inventory')}
            emptyMessage={t('noMaterialsFound', 'No materials found')}
          />
        ) : (
          <div className="inventory-grid">
            {getFilteredInventory().map(item => {
              const material = getMaterialInfo(item.materialId)
              const typeInfo = getTransactionTypeInfo(item.transactionType)
              const TypeIcon = typeInfo.icon
              const isTyre = item.materialCategory === 'tyres'
              
              return (
                <div key={item.materialId} className="material-card">
                  <div className="card-header">
                    <div className="material-name">
                      {material.name || item.materialCode}
                    </div>
                    <div className="transaction-type">
                      <TypeIcon size={14} style={{ color: typeInfo.color }} />
                      {typeInfo.label}
                    </div>
                  </div>
                  
                  <div className="card-content">
                    <div className="material-details">
                      <div className="detail-row">
                        <span className="label">{t('quantity', 'Quantity')}:</span>
                        <span className="value">{item.currentStock} {item.unit}</span>
                      </div>
                      <div className="detail-row">
                        <span className="label">{t('totalValue', 'Value')}:</span>
                        <span className="value">{formatCurrency(item.totalValue)}</span>
                      </div>
                      {item.condition && (
                        <div className="detail-row">
                          <span className="label">{t('condition', 'Condition')}:</span>
                          <span className={`condition-badge ${getConditionBadge(item.condition, isTyre)?.class}`}>
                            {getConditionBadge(item.condition, isTyre)?.label}
                          </span>
                        </div>
                      )}
                      <div className="detail-row">
                        <span className="label">{t('source', 'Source')}:</span>
                        <span className="value">{item.sourceDetails?.name || 'N/A'}</span>
                      </div>
                    </div>
                    
                    {item.photos && item.photos.length > 0 && (
                      <div className="card-photos">
                        <Camera size={16} />
                        <span>{item.photos.length} {t('photos', 'photos')}</span>
                      </div>
                    )}
                  </div>
                  
                  {hasPermission('MANAGE_INVENTORY') && (
                    <div className="card-actions">
                      <button
                        onClick={() => console.log('View details:', item)}
                        className="action-btn view"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditEntry(item)}
                        className="action-btn edit"
                      >
                        <Edit size={14} />
                      </button>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Material Entry Form Modal */}
      <MaterialEntryForm
        isOpen={showMaterialForm}
        onClose={() => {
          setShowMaterialForm(false)
          setEditingEntry(null)
        }}
        onSave={handleSaveMaterial}
        initialData={editingEntry}
        availableMaterials={materials}
      />
    </div>
  )
}

export default ScrapMaterialsInventory