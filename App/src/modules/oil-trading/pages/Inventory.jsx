import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import Modal from '../../../components/ui/Modal'
import { Package, Plus, AlertTriangle, TrendingUp, TrendingDown, Droplets, Drum, Fuel, Factory, ShoppingCart, Edit, FileText, DollarSign } from 'lucide-react'
import '../../../styles/theme.css'
import './Inventory.css'

const Inventory = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [inventory, setInventory] = useState({})
  const [materials, setMaterials] = useState([])
  const [vendors, setVendors] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [alerts, setAlerts] = useState([])
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showStockHistory, setShowStockHistory] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)

  // Material categories based on PRD
  const materialCategories = {
    'engine-oils': {
      name: 'Engine Oils',
      icon: Droplets,
      color: 'var(--blue-600)',
      subcategories: ['with-drums', 'without-drums', 'transformer-oil', 'lube-oil', 'cooking-oil']
    },
    'diesel': {
      name: 'Diesel',
      icon: Fuel,
      color: 'var(--orange-600)',
      subcategories: ['unused', 'used']
    },
    'drums': {
      name: 'Empty Drums',
      icon: Drum,
      color: 'var(--gray-600)',
      subcategories: ['collection']
    },
    'crude-sludge': {
      name: 'Crude Sludge',
      icon: Factory,
      color: 'var(--purple-600)',
      subcategories: ['raw']
    }
  }

  // Sample inventory data based on PRD material types
  const sampleInventoryData = {
    'ENG-001': { currentStock: 250, unit: 'L', reorderLevel: 100, status: 'sealed', category: 'engine-oils' },
    'ENG-002': { currentStock: 180, unit: 'L', reorderLevel: 150, status: 'used', category: 'engine-oils' },
    'ENG-003': { currentStock: 45, unit: 'L', reorderLevel: 80, status: 'sealed', category: 'engine-oils' }, // Low stock
    'DSL-001': { currentStock: 1500, unit: 'L', reorderLevel: 500, status: 'unused', category: 'diesel' },
    'DSL-002': { currentStock: 300, unit: 'L', reorderLevel: 200, status: 'used', category: 'diesel' },
    'DRM-001': { currentStock: 150, unit: 'pcs', reorderLevel: 200, status: 'collected', category: 'drums' }, // Low stock
    'CRD-001': { currentStock: 2500, unit: 'kg', reorderLevel: 1000, status: 'raw', category: 'crude-sludge' }
  }

  const sampleMaterials = [
    { id: 'ENG-001', name: 'Engine Oil 20W-50 (with drums)', category: 'engine-oils', unit: 'L', standardPrice: 2.500 },
    { id: 'ENG-002', name: 'Engine Oil 10W-40 (without drums)', category: 'engine-oils', unit: 'L', standardPrice: 2.200 },
    { id: 'ENG-003', name: 'Transformer Oil', category: 'engine-oils', unit: 'L', standardPrice: 1.800 },
    { id: 'DSL-001', name: 'Diesel Fuel', category: 'diesel', unit: 'L', standardPrice: 0.450 },
    { id: 'DSL-002', name: 'Used Diesel', category: 'diesel', unit: 'L', standardPrice: 0.300 },
    { id: 'DRM-001', name: 'Empty Oil Drums', category: 'drums', unit: 'pcs', standardPrice: 5.000 },
    { id: 'CRD-001', name: 'Crude Sludge', category: 'crude-sludge', unit: 'kg', standardPrice: 0.150 }
  ]

  const sampleMovements = [
    { id: 1, materialId: 'ENG-001', type: 'in', quantity: 100, date: '2024-01-20', reason: 'Purchase Order PO-2024-045', reference: 'PO-2024-045' },
    { id: 2, materialId: 'DSL-001', type: 'out', quantity: 500, date: '2024-01-19', reason: 'Sales Order SO-2024-089', reference: 'SO-2024-089' },
    { id: 3, materialId: 'ENG-003', type: 'out', quantity: 35, date: '2024-01-18', reason: 'Sales Order SO-2024-088', reference: 'SO-2024-088' },
    { id: 4, materialId: 'DRM-001', type: 'in', quantity: 50, date: '2024-01-17', reason: 'Customer Return - Al Maha Petroleum', reference: 'RET-2024-012' },
    { id: 5, materialId: 'CRD-001', type: 'in', quantity: 1000, date: '2024-01-16', reason: 'Purchase Order PO-2024-044', reference: 'PO-2024-044' }
  ]

  useEffect(() => {
    loadInventoryData()
  }, [])

  const loadInventoryData = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // Load vendor data
      try {
        const vendorsResponse = await fetch('/data/vendors.json')
        const vendorsData = await vendorsResponse.json()
        const companyVendors = vendorsData.vendors[selectedCompany?.id] || []
        setVendors(companyVendors)
      } catch (vendorError) {
        console.error('Error loading vendors:', vendorError)
        setVendors([])
      }
      
      setMaterials(sampleMaterials)
      setInventory(sampleInventoryData)
      setStockMovements(sampleMovements)
      
      // Generate alerts for low stock items
      const lowStockAlerts = Object.entries(sampleInventoryData)
        .filter(([materialId, data]) => data.currentStock <= data.reorderLevel)
        .map(([materialId, data]) => {
          const material = sampleMaterials.find(m => m.id === materialId)
          return {
            id: materialId,
            type: 'low_stock',
            material: material.name,
            currentStock: data.currentStock,
            reorderLevel: data.reorderLevel,
            unit: data.unit,
            severity: data.currentStock < (data.reorderLevel * 0.5) ? 'critical' : 'warning'
          }
        })
      
      setAlerts(lowStockAlerts)
      setLoading(false)
    } catch (error) {
      console.error('Error loading inventory data:', error)
      setLoading(false)
    }
  }

  const getMaterialsByCategory = (categoryKey) => {
    return materials.filter(material => material.category === categoryKey)
  }

  const getCategoryStats = (categoryKey) => {
    const categoryMaterials = getMaterialsByCategory(categoryKey)
    const totalItems = categoryMaterials.length
    const totalValue = categoryMaterials.reduce((sum, material) => {
      const stock = inventory[material.id]
      return sum + (stock ? stock.currentStock * material.standardPrice : 0)
    }, 0)
    const lowStockCount = categoryMaterials.filter(material => {
      const stock = inventory[material.id]
      return stock && stock.currentStock <= stock.reorderLevel
    }).length
    
    return { totalItems, totalValue, lowStockCount }
  }

  const getStockStatus = (materialId) => {
    const stock = inventory[materialId]
    if (!stock) return 'out-of-stock'
    
    if (stock.currentStock === 0) return 'out-of-stock'
    if (stock.currentStock <= stock.reorderLevel * 0.5) return 'critical'
    if (stock.currentStock <= stock.reorderLevel) return 'low'
    return 'good'
  }

  const formatCurrency = (amount) => `OMR ${amount.toFixed(3)}`

  // Handler functions for button functionality
  const handleCreatePurchaseOrder = (materialId = null) => {
    console.log('Creating purchase order for material:', materialId)
    setShowPurchaseForm(true)
  }

  const handleViewAllCategory = (categoryKey) => {
    console.log('Viewing all materials for category:', categoryKey)
    setActiveTab('materials')
  }

  const handleAdjustStock = (material) => {
    console.log('Adjusting stock for material:', material)
    const newStock = prompt(`Enter new stock level for ${material.name}:`, inventory[material.id]?.currentStock || 0)
    if (newStock !== null && !isNaN(newStock)) {
      const updatedInventory = {
        ...inventory,
        [material.id]: {
          ...inventory[material.id],
          currentStock: parseFloat(newStock)
        }
      }
      setInventory(updatedInventory)
      alert(`✅ Stock level updated for ${material.name}`)
    }
  }

  const handleViewHistory = (material) => {
    console.log('Viewing history for material:', material)
    setSelectedMaterial(material)
    setShowStockHistory(true)
  }

  const handleSavePurchaseOrder = (orderData) => {
    console.log('Saving purchase order:', orderData)
    alert('✅ Purchase order created successfully!')
    setShowPurchaseForm(false)
  }

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message="Loading inventory data..." size="large" />
      </div>
    )
  }

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Inventory Management</h1>
          <p>Track stock levels, movements, and material status</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <TrendingUp size={16} />
            Stock Report
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            Stock Adjustment
          </button>
        </div>
      </div>

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="alerts-section">
          <h3 className="alerts-title">
            <AlertTriangle size={20} />
            Stock Alerts ({alerts.length})
          </h3>
          <div className="alerts-grid">
            {alerts.map(alert => (
              <div key={alert.id} className={`alert-card ${alert.severity}`}>
                <div className="alert-content">
                  <div className="alert-header">
                    <span className="alert-type">Low Stock Alert</span>
                    <span className={`alert-badge ${alert.severity}`}>
                      {alert.severity === 'critical' ? 'Critical' : 'Warning'}
                    </span>
                  </div>
                  <p className="alert-material">{alert.material}</p>
                  <p className="alert-details">
                    Current: {alert.currentStock} {alert.unit} | 
                    Reorder Level: {alert.reorderLevel} {alert.unit}
                  </p>
                </div>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => handleCreatePurchaseOrder(alert.id)}
                >
                  <ShoppingCart size={14} />
                  Create Purchase Order
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <Package size={16} />
          Overview
        </button>
        <button 
          className={`tab-btn ${activeTab === 'materials' ? 'active' : ''}`}
          onClick={() => setActiveTab('materials')}
        >
          <Droplets size={16} />
          Materials
        </button>
        <button 
          className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <TrendingUp size={16} />
          Stock Movements
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="inventory-overview">
          {/* Summary Stats */}
          <div className="overview-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Package size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-value">{materials.length}</p>
                <p className="stat-label">Total Materials</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon warning">
                <AlertTriangle size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-value">{alerts.length}</p>
                <p className="stat-label">Low Stock Alerts</p>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon success">
                <DollarSign size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-value">{formatCurrency(
                  Object.entries(inventory).reduce((sum, [id, stock]) => {
                    const material = materials.find(m => m.id === id)
                    return sum + (stock.currentStock * (material?.standardPrice || 0))
                  }, 0)
                )}</p>
                <p className="stat-label">Total Inventory Value</p>
              </div>
            </div>
          </div>

          {/* All Materials DataTable */}
          <DataTable
            data={materials.map(material => {
              const stock = inventory[material.id]
              const status = getStockStatus(material.id)
              const stockValue = stock ? stock.currentStock * material.standardPrice : 0
              const category = materialCategories[material.category]
              
              return {
                ...material,
                stock: stock || { currentStock: 0, unit: material.unit, reorderLevel: 0 },
                status,
                stockValue,
                categoryInfo: category
              }
            })}
            columns={[
              {
                key: 'name',
                header: t('material'),
                sortable: true,
                filterable: true,
                render: (value, row) => (
                  <div className="material-info">
                    <span className="material-name">{value}</span>
                    <span className="material-id">{row.id}</span>
                  </div>
                )
              },
              {
                key: 'category',
                header: t('category'),
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  const CategoryIcon = row.categoryInfo.icon
                  return (
                    <div className="category-badge">
                      <CategoryIcon size={14} />
                      {row.categoryInfo.name}
                    </div>
                  )
                }
              },
              {
                key: 'stock.currentStock',
                header: t('currentStock'),
                type: 'number',
                sortable: true,
                render: (value, row) => (
                  <span className="stock-quantity">
                    {value} {row.stock.unit}
                  </span>
                )
              },
              {
                key: 'stock.reorderLevel',
                header: t('reorderLevel'),
                type: 'number',
                sortable: true,
                render: (value, row) => (
                  <span className="reorder-level">
                    {value > 0 ? `${value} ${row.stock.unit}` : 'Not set'}
                  </span>
                )
              },
              {
                key: 'status',
                header: t('status'),
                sortable: true,
                filterable: true,
                render: (value) => (
                  <span className={`status-badge ${value}`}>
                    {value === 'good' ? t('goodStock') : 
                     value === 'low' ? t('lowStock') :
                     value === 'critical' ? t('critical') : t('outOfStock')}
                  </span>
                )
              },
              {
                key: 'stockValue',
                header: t('stockValue'),
                type: 'currency',
                align: 'right',
                sortable: true,
                render: (value) => formatCurrency(value)
              },
              {
                key: 'actions',
                header: t('actions'),
                sortable: false,
                render: (value, row) => (
                  <div className="action-buttons">
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleAdjustStock(row)}
                      title="Adjust Stock"
                    >
                      <Edit size={14} />
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleViewHistory(row)}
                      title="View History"
                    >
                      <FileText size={14} />
                    </button>
                  </div>
                )
              }
            ]}
            title={t('inventoryOverview')}
            subtitle={t('completeInventorySummary')}
            loading={loading}
            searchable={true}
            filterable={true}
            sortable={true}
            paginated={true}
            exportable={true}
            selectable={false}
            emptyMessage={t('noMaterialsFound')}
            className="inventory-overview-table"
            initialPageSize={20}
            stickyHeader={true}
            enableColumnToggle={true}
          />
        </div>
      )}

      {activeTab === 'materials' && (
        <div className="materials-view">
          <DataTable
            data={materials.map(material => {
              const stock = inventory[material.id]
              const status = getStockStatus(material.id)
              const stockValue = stock ? stock.currentStock * material.standardPrice : 0
              const category = materialCategories[material.category]
              
              return {
                ...material,
                stock: stock || { currentStock: 0, unit: material.unit, reorderLevel: 0 },
                status,
                stockValue,
                categoryInfo: category
              }
            })}
            columns={[
              {
                key: 'name',
                header: t('material'),
                sortable: true,
                filterable: true,
                render: (value, row) => (
                  <div className="material-info">
                    <span className="material-name">{value}</span>
                    <span className="material-id">{row.id}</span>
                  </div>
                )
              },
              {
                key: 'category',
                header: t('category'),
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  const CategoryIcon = row.categoryInfo.icon
                  return (
                    <div className="category-badge">
                      <CategoryIcon size={14} />
                      {row.categoryInfo.name}
                    </div>
                  )
                }
              },
              {
                key: 'stock.currentStock',
                header: t('currentStock'),
                type: 'number',
                sortable: true,
                render: (value, row) => (
                  <span className="stock-quantity">
                    {value} {row.stock.unit}
                  </span>
                )
              },
              {
                key: 'stock.reorderLevel',
                header: t('reorderLevel'),
                type: 'number',
                sortable: true,
                render: (value, row) => (
                  <span className="reorder-level">
                    {value > 0 ? `${value} ${row.stock.unit}` : 'Not set'}
                  </span>
                )
              },
              {
                key: 'status',
                header: t('status'),
                sortable: true,
                filterable: true,
                render: (value) => (
                  <span className={`status-badge ${value}`}>
                    {value === 'good' ? t('goodStock') : 
                     value === 'low' ? t('lowStock') :
                     value === 'critical' ? t('critical') : t('outOfStock')}
                  </span>
                )
              },
              {
                key: 'stockValue',
                header: t('stockValue'),
                type: 'currency',
                align: 'right',
                sortable: true,
                render: (value) => formatCurrency(value)
              },
              {
                key: 'actions',
                header: t('actions'),
                sortable: false,
                render: (value, row) => (
                  <div className="action-buttons">
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleAdjustStock(row)}
                    >
                      <Edit size={14} />
                      {t('adjust')}
                    </button>
                    <button 
                      className="btn btn-outline btn-sm"
                      onClick={() => handleViewHistory(row)}
                    >
                      <FileText size={14} />
                      {t('history')}
                    </button>
                  </div>
                )
              }
            ]}
            title={t('materialInventory')}
            subtitle={t('materialInventorySubtitle')}
            loading={loading}
            searchable={true}
            filterable={true}
            sortable={true}
            paginated={true}
            exportable={true}
            selectable={false}
            emptyMessage={t('noMaterialsFound')}
            className="inventory-table"
            initialPageSize={10}
            stickyHeader={true}
            enableColumnToggle={true}
          />
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="movements-view">
          <DataTable
            data={stockMovements.map(movement => {
              const material = materials.find(m => m.id === movement.materialId)
              return {
                ...movement,
                material: material || { name: 'Unknown', unit: '' }
              }
            })}
            columns={[
              {
                key: 'date',
                header: t('date', 'Date'),
                type: 'date',
                sortable: true,
                filterable: true,
                render: (value) => (
                  <span className="movement-date">{value}</span>
                )
              },
              {
                key: 'materialId',
                header: t('material'),
                sortable: true,
                filterable: true,
                render: (value, row) => (
                  <div className="material-info">
                    <span className="material-name">{row.material.name}</span>
                    <span className="material-id">{value}</span>
                  </div>
                )
              },
              {
                key: 'type',
                header: t('type', 'Type'),
                sortable: true,
                filterable: true,
                render: (value) => (
                  <span className={`movement-type ${value}`}>
                    {value === 'in' ? (
                      <>
                        <TrendingUp size={14} />
                        {t('stockIn', 'Stock In')}
                      </>
                    ) : (
                      <>
                        <TrendingDown size={14} />
                        {t('stockOut', 'Stock Out')}
                      </>
                    )}
                  </span>
                )
              },
              {
                key: 'quantity',
                header: t('quantity', 'Quantity'),
                type: 'number',
                sortable: true,
                render: (value, row) => (
                  <span className="movement-quantity">
                    {value} {row.material.unit}
                  </span>
                )
              },
              {
                key: 'reason',
                header: t('reason', 'Reason'),
                sortable: true,
                filterable: true,
                render: (value) => (
                  <span className="movement-reason">{value}</span>
                )
              },
              {
                key: 'reference',
                header: t('reference', 'Reference'),
                sortable: true,
                render: (value) => (
                  <span className="movement-reference">{value}</span>
                )
              }
            ]}
            title={t('stockMovements', 'Stock Movements')}
            subtitle={t('stockMovementsSubtitle', 'Track inventory in and out movements')}
            loading={loading}
            searchable={true}
            filterable={true}
            sortable={true}
            paginated={true}
            exportable={true}
            selectable={false}
            emptyMessage={t('noMovementsFound', 'No stock movements found')}
            className="movements-table"
            initialPageSize={10}
            stickyHeader={true}
            enableColumnToggle={true}
          />
        </div>
      )}

      {/* Purchase Order Form Modal */}
      {showPurchaseForm && (
        <PurchaseOrderForm
          isOpen={showPurchaseForm}
          onClose={() => setShowPurchaseForm(false)}
          onSave={handleSavePurchaseOrder}
          vendors={vendors}
          materials={materials}
          title="Create Purchase Order"
        />
      )}

      {/* Stock History Modal */}
      {showStockHistory && selectedMaterial && (
        <Modal 
          title={`Stock History - ${selectedMaterial.name}`}
          onClose={() => setShowStockHistory(false)}
          className="modal-lg"
        >
          <div className="stock-history-content">
            <div className="material-summary">
              <div className="summary-grid">
                <div className="summary-item">
                  <label>Material ID</label>
                  <span>{selectedMaterial.id}</span>
                </div>
                <div className="summary-item">
                  <label>Current Stock</label>
                  <span>{inventory[selectedMaterial.id]?.currentStock || 0} {selectedMaterial.unit}</span>
                </div>
                <div className="summary-item">
                  <label>Reorder Level</label>
                  <span>{inventory[selectedMaterial.id]?.reorderLevel || 0} {selectedMaterial.unit}</span>
                </div>
                <div className="summary-item">
                  <label>Status</label>
                  <span className={`status-badge ${getStockStatus(selectedMaterial.id)}`}>
                    {getStockStatus(selectedMaterial.id)}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="history-timeline">
              <h4>Recent Stock Movements</h4>
              {stockMovements
                .filter(movement => movement.materialId === selectedMaterial.id)
                .map(movement => (
                  <div key={movement.id} className="movement-item">
                    <div className={`movement-icon ${movement.type}`}>
                      {movement.type === 'in' ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                    </div>
                    <div className="movement-details">
                      <div className="movement-header">
                        <span className="movement-type">
                          {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                        </span>
                        <span className="movement-date">{movement.date}</span>
                      </div>
                      <p className="movement-quantity">
                        {movement.type === 'in' ? '+' : '-'}{movement.quantity} {selectedMaterial.unit}
                      </p>
                      <p className="movement-reason">{movement.reason}</p>
                      <p className="movement-reference">Ref: {movement.reference}</p>
                    </div>
                  </div>
                ))}
              
              {stockMovements.filter(movement => movement.materialId === selectedMaterial.id).length === 0 && (
                <div className="no-movements">
                  <p>No stock movements found for this material.</p>
                </div>
              )}
            </div>
          </div>
          
          <div className="modal-actions">
            <button className="btn btn-outline" onClick={() => setShowStockHistory(false)}>
              Close
            </button>
            <button 
              className="btn btn-primary" 
              onClick={() => {
                setShowStockHistory(false)
                handleAdjustStock(selectedMaterial)
              }}
            >
              Adjust Stock
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Inventory