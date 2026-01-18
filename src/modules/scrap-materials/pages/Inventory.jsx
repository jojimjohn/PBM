import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import MaterialEntryForm from '../components/MaterialEntryForm'
import inventoryService from '../../../services/inventoryService'
import materialService from '../../../services/materialService'
import { 
  Eye, 
  Edit, 
  Package, 
  Truck, 
  Banknote,
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
      
      // Load inventory data using API service
      const inventoryData = await inventoryService.getInventory()
      const companyInventory = inventoryData || []
      
      // Load materials data using API service
      const materialsData = await materialService.getMaterials()
      const companyMaterials = materialsData || []
      
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
      customer: { label: t('customer', 'Customer'), icon: User, color: '#3b82f6' },
      supplier: { label: t('supplier', 'Supplier'), icon: Truck, color: '#8b5cf6' },
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
          const badge = getConditionBadge(row.condition, isTyre)

          return (
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <strong className="text-gray-900 font-semibold">{material.name || row.materialCode}</strong>
                {isTyre && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-[11px] font-medium">
                    <Camera size={10} />
                    {t('tyre', 'Tyre')}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500 font-mono">{row.materialCode}</span>
                {row.condition && badge && (
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${
                    badge.class === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {badge.label}
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
            <div className="flex items-center gap-2">
              <TypeIcon size={14} style={{ color: typeInfo.color }} />
              <span className="text-sm text-gray-700">{typeInfo.label}</span>
            </div>
          )
        }
      },
      {
        key: 'sourceDetails',
        header: t('source', 'Source'),
        render: (value, row) => (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900">{value?.name || 'N/A'}</span>
            {value?.type && <span className="text-xs text-gray-500">{value.type}</span>}
          </div>
        )
      },
      {
        key: 'currentStock',
        header: t('quantity', 'Quantity'),
        sortable: true,
        type: 'number',
        render: (value, row) => (
          <div className="flex items-baseline gap-1.5">
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{value?.toLocaleString()}</span>
            <span className="text-xs text-gray-500">{row.unit}</span>
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
          if (!value || value.length === 0) return <span className="text-gray-400">—</span>

          return (
            <div className="flex items-center gap-1.5 text-blue-600">
              <Camera size={14} />
              <span className="text-sm">{value.length} {t('photos', 'photos')}</span>
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
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); console.log('View details:', row) }}
              className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-white text-blue-500 hover:bg-blue-50 hover:border-blue-500 transition-colors"
              title={t('viewDetails', 'View Details')}
            >
              <Eye size={14} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); handleEditEntry(row) }}
              className="inline-flex items-center justify-center w-8 h-8 border border-gray-300 rounded-md bg-white text-amber-500 hover:bg-amber-50 hover:border-amber-500 transition-colors"
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <LoadingSpinner size="large" />
        <p className="text-gray-600">{t('loadingInventory', 'Loading inventory...')}</p>
      </div>
    )
  }

  return (
    <div className="p-0">
      {/* Page Header */}
      <div className="flex justify-between items-start mb-8 gap-8 max-md:flex-col max-md:gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{t('materialInventory', 'Material Inventory')}</h1>
          <p className="text-gray-600">
            {t('trackMaterialsAndTyres', 'Track materials, tyres, and collection sources')}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {hasPermission('MANAGE_INVENTORY') && (
            <button
              className="btn btn-primary"
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
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6 mb-8">
        <div className="summary-card">
          <div className="summary-icon !bg-blue-500/10 !text-blue-500">
            <Package size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">{stats.totalEntries}</p>
            <p className="summary-label">{t('totalMaterials', 'Total Materials')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon !bg-emerald-500/10 !text-emerald-500">
            <Banknote size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">{formatCurrency(stats.totalValue)}</p>
            <p className="summary-label">{t('totalValue', 'Total Value')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon !bg-violet-500/10 !text-violet-500">
            <Camera size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">{stats.tyreEntries}</p>
            <p className="summary-label">{t('tyres', 'Tyres')}</p>
            {stats.tyreEntries > 0 && (
              <div className="flex items-center gap-2 mt-1 text-xs">
                <span className="text-emerald-500 font-medium">{stats.goodTyres} {t('good', 'Good')}</span>
                <span className="text-gray-400">•</span>
                <span className="text-red-500 font-medium">{stats.badTyres} {t('bad', 'Bad')}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t('search', 'Search')}</label>
          <input
            type="text"
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            placeholder={t('searchMaterials', 'Search materials, sources...')}
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t('category', 'Category')}</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
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

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t('transactionType', 'Transaction Type')}</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
            value={filters.transactionType}
            onChange={(e) => setFilters(prev => ({ ...prev, transactionType: e.target.value }))}
          >
            <option value="all">{t('allTypes', 'All Types')}</option>
            <option value="collected">{t('collected', 'Collected')}</option>
            <option value="customer">{t('customer', 'Customer')}</option>
            <option value="supplier">{t('supplier', 'Supplier')}</option>
            <option value="walk_in">{t('walkIn', 'Walk-in')}</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-gray-700">{t('condition', 'Condition')}</label>
          <select
            className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
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
      <div className="flex justify-end mb-4">
        <div className="flex border border-gray-300 rounded-lg overflow-hidden">
          <button
            className={`flex items-center gap-2 px-3 py-2 text-sm ${viewMode === 'table' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setViewMode('table')}
          >
            <List size={16} />
            {t('table', 'Table')}
          </button>
          <button
            className={`flex items-center gap-2 px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            onClick={() => setViewMode('grid')}
          >
            <Grid3X3 size={16} />
            {t('grid', 'Grid')}
          </button>
        </div>
      </div>

      {/* Inventory Data Display */}
      <div>
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
          <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
            {getFilteredInventory().map(item => {
              const material = getMaterialInfo(item.materialId)
              const typeInfo = getTransactionTypeInfo(item.transactionType)
              const TypeIcon = typeInfo.icon
              const isTyre = item.materialCategory === 'tyres'

              return (
                <div key={item.materialId} className="bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden">
                  <div className="flex justify-between items-start p-4 border-b border-gray-100">
                    <div className="font-semibold text-gray-900">
                      {material.name || item.materialCode}
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <TypeIcon size={14} style={{ color: typeInfo.color }} />
                      {typeInfo.label}
                    </div>
                  </div>

                  <div className="p-4">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('quantity', 'Quantity')}:</span>
                        <span className="font-medium text-gray-900">{item.currentStock} {item.unit}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('totalValue', 'Value')}:</span>
                        <span className="font-medium text-gray-900">{formatCurrency(item.totalValue)}</span>
                      </div>
                      {item.condition && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">{t('condition', 'Condition')}:</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.condition === 'good' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {getConditionBadge(item.condition, isTyre)?.label}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">{t('source', 'Source')}:</span>
                        <span className="font-medium text-gray-900">{item.sourceDetails?.name || 'N/A'}</span>
                      </div>
                    </div>

                    {item.photos && item.photos.length > 0 && (
                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 text-sm text-gray-600">
                        <Camera size={16} />
                        <span>{item.photos.length} {t('photos', 'photos')}</span>
                      </div>
                    )}
                  </div>

                  {hasPermission('MANAGE_INVENTORY') && (
                    <div className="flex items-center justify-end gap-2 px-4 py-3 bg-gray-50 border-t border-gray-100">
                      <button
                        onClick={() => console.log('View details:', item)}
                        className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleEditEntry(item)}
                        className="p-2 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors"
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