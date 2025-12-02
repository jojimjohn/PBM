import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import Modal from '../../../components/ui/Modal'
import StockChart from '../../../components/StockChart'
import MaterialFormModal from '../../../components/MaterialFormModal'
import inventoryService from '../../../services/inventoryService'
import materialService from '../../../services/materialService'
import supplierService from '../../../services/supplierService'
import branchService from '../../../services/branchService'
import materialCompositionService from '../../../services/materialCompositionService'
import { Package, Plus, AlertTriangle, TrendingUp, TrendingDown, Droplets, Drum, Fuel, Factory, ShoppingCart, Edit, FileText, DollarSign, BarChart3, Calendar, ChevronDown, ChevronRight, Building, Layers } from 'lucide-react'
import '../../../styles/theme.css'
import '../styles/Inventory.css'

const Inventory = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('stock')
  const [inventory, setInventory] = useState([])
  const [materials, setMaterials] = useState([])
  const [materialCategories, setMaterialCategories] = useState([])
  const [vendors, setVendors] = useState([])
  const [branches, setBranches] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [alerts, setAlerts] = useState([])
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showStockHistory, setShowStockHistory] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [showOpeningStockModal, setShowOpeningStockModal] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [message, setMessage] = useState(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedMaterialBatches, setSelectedMaterialBatches] = useState(null)

  // Composite stock adjustment modal state
  const [showCompositeAdjustModal, setShowCompositeAdjustModal] = useState(false)
  const [compositeAdjustData, setCompositeAdjustData] = useState(null)

  // Material composition state
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [showComponents, setShowComponents] = useState(() => {
    // Load preference from localStorage
    const saved = localStorage.getItem('inventory_showComponents')
    return saved === 'true'
  })
  const [componentMaterialIds, setComponentMaterialIds] = useState([])
  const [materialCompositions, setMaterialCompositions] = useState({})

  // Material category display config based on PRD
  const categoryDisplayConfig = {
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
    loadMaterialCategories()
  }, [])

  // Save filter preference to localStorage
  useEffect(() => {
    localStorage.setItem('inventory_showComponents', showComponents)
  }, [showComponents])

  const loadMaterialCategories = async () => {
    try {
      const categoriesResult = await materialService.getCategories()
      if (categoriesResult.success) {
        setMaterialCategories(categoriesResult.data || [])
      }
    } catch (error) {
      console.error('Error loading material categories:', error)
    }
  }

  const loadInventoryData = async () => {
    try {
      setLoading(true)

      // Load inventory data using API service
      const inventoryResult = await inventoryService.getAll()
      const inventoryArray = inventoryResult.success ? inventoryResult.data : []

      // Transform array to object keyed by materialId, aggregating multiple batches
      const inventoryByMaterial = {}
      for (const item of inventoryArray) {
        // Ensure consistent numeric key type
        const matId = Number(item.materialId)
        if (!inventoryByMaterial[matId]) {
          inventoryByMaterial[matId] = {
            materialId: matId,
            materialName: item.materialName,
            materialCode: item.materialCode,
            category: item.category,
            unit: item.unit,
            currentStock: 0,
            reservedQuantity: 0,
            availableQuantity: 0,
            totalValue: 0,
            averageCost: item.averageCost || 0,
            standardPrice: item.standardPrice || 0,
            minimumStockLevel: item.minimumStockLevel || 0,
            maximumStockLevel: item.maximumStockLevel || 0,
            reorderLevel: item.minimumStockLevel || 0,
            batches: []
          }
        }
        // Aggregate quantities across all batches for this material
        inventoryByMaterial[matId].currentStock += parseFloat(item.currentStock || item.quantity || 0)
        inventoryByMaterial[matId].reservedQuantity += parseFloat(item.reservedQuantity || 0)
        inventoryByMaterial[matId].availableQuantity += parseFloat(item.availableQuantity || item.currentStock || 0)
        inventoryByMaterial[matId].totalValue += parseFloat(item.totalValue || 0)
        inventoryByMaterial[matId].batches.push(item)
      }

      setInventory(inventoryByMaterial)

      // Load materials data using API service
      const materialsResult = await materialService.getAll()
      const companyMaterials = materialsResult.success ? materialsResult.data : []
      setMaterials(companyMaterials)

      // Load component material IDs for filtering
      const componentIds = await materialCompositionService.getComponentMaterialIds()
      setComponentMaterialIds(componentIds)

      // Load compositions for composite materials
      const compositions = {}
      for (const material of companyMaterials) {
        if (material.is_composite) {
          const compResult = await materialCompositionService.getByComposite(material.id)
          if (compResult.success && compResult.data) {
            // Attach stock levels to each component
            compositions[material.id] = compResult.data.map(comp => {
              const compStock = inventoryByMaterial[comp.component_material_id]
              return {
                ...comp,
                currentStock: compStock?.currentStock || 0,
                unit: compStock?.unit || comp.capacity_unit || 'units'
              }
            })
          }
        }
      }
      setMaterialCompositions(compositions)

      // Load branches data using API service
      try {
        const branchesResult = await branchService.getAll()
        const companyBranches = branchesResult.success ? branchesResult.data : []
        setBranches(companyBranches)
      } catch (branchError) {
        console.error('Error loading branches:', branchError)
        setBranches([])
      }

      // Load supplier/vendor data using API service (Al Ramrami may not have suppliers)
      // Check if company uses suppliers before attempting to load
      if (selectedCompany?.id !== 'al_ramrami') {
        try {
          const suppliersResult = await supplierService.getAll()
          const companyVendors = suppliersResult.success ? suppliersResult.data : []
          setVendors(companyVendors)
        } catch (vendorError) {
          console.error('Error loading vendors:', vendorError)
          setVendors([])
        }
      } else {
        // Al Ramrami doesn't use suppliers in their business model
        setVendors([])
      }

      // Create alerts for low stock items
      const lowStockItems = Object.values(inventoryByMaterial).filter(item =>
        item.currentStock <= item.reorderLevel && item.reorderLevel > 0
      )
      setAlerts(lowStockItems.map(item => ({
        type: 'warning',
        message: `Low stock alert: ${item.materialCode} (${item.currentStock} ${item.unit})`
      })))

    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
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
      const stock = inventory[Number(material.id)]
      return sum + (stock ? stock.currentStock * material.standardPrice : 0)
    }, 0)
    const lowStockCount = categoryMaterials.filter(material => {
      const stock = inventory[Number(material.id)]
      return stock && stock.currentStock <= stock.reorderLevel
    }).length

    return { totalItems, totalValue, lowStockCount }
  }

  const getStockStatus = (materialId) => {
    const stock = inventory[Number(materialId)]
    if (!stock) return 'out-of-stock'
    
    if (stock.currentStock === 0) return 'out-of-stock'
    if (stock.currentStock <= stock.reorderLevel * 0.5) return 'critical'
    if (stock.currentStock <= stock.reorderLevel) return 'low'
    return 'good'
  }

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0
    return `OMR ${numAmount.toFixed(3)}`
  }

  // Handler functions for button functionality
  const handleCreatePurchaseOrder = (materialId = null) => {
    console.log('Creating purchase order for material:', materialId)
    setShowPurchaseForm(true)
  }

  const handleViewAllCategory = (categoryKey) => {
    console.log('Viewing all materials for category:', categoryKey)
    setActiveTab('master')
  }

  const handleAdjustStock = async (material) => {
    const matId = Number(material.id)

    // Check if material is composite - show component adjustment modal instead
    if (material.is_composite) {
      const components = materialCompositions[matId] || []
      if (components.length > 0) {
        // Build component data with current stock levels
        const componentData = components.map(comp => ({
          componentId: comp.component_material_id,
          componentName: comp.component_material_name || comp.componentName,
          componentCode: comp.component_material_code || comp.componentCode,
          componentType: comp.component_type,
          currentStock: inventory[comp.component_material_id]?.currentStock || 0,
          newStock: inventory[comp.component_material_id]?.currentStock || 0,
          unit: comp.capacity_unit || inventory[comp.component_material_id]?.unit || 'units',
          inventoryRecord: inventory[comp.component_material_id]
        }))

        setCompositeAdjustData({
          compositeMaterial: material,
          components: componentData
        })
        setShowCompositeAdjustModal(true)
      } else {
        setMessage({ type: 'warning', text: 'No component information available for this composite material' })
        setTimeout(() => setMessage(null), 3000)
      }
      return
    }

    // Regular (non-composite) material adjustment
    const currentStock = inventory[matId]?.currentStock || 0
    const newStock = prompt(`Enter new stock level for ${material.name}:`, currentStock)

    if (newStock !== null && !isNaN(newStock)) {
      const newQuantity = parseFloat(newStock)
      const inventoryRecord = inventory[matId]

      try {
        let result

        if (!inventoryRecord?.batches?.length) {
          // NO EXISTING INVENTORY - Create new inventory record via opening stock
          result = await inventoryService.setOpeningStock(matId, {
            quantity: newQuantity,
            batchNumber: `MANUAL-${Date.now()}`,
            averageCost: 0,
            location: 'Main Warehouse',
            notes: 'Created via manual stock adjustment'
          })
        } else {
          // EXISTING INVENTORY - Adjust the first batch
          const batchToUpdate = inventoryRecord.batches[0]
          result = await inventoryService.adjustStock(batchToUpdate.id, {
            adjustmentType: 'set',
            quantity: newQuantity,
            reason: 'Manual stock adjustment',
            notes: `Set to ${newQuantity} ${material.unit} (was ${currentStock})`
          })
        }

        if (result.success) {
          setMessage({ type: 'success', text: `Stock updated for ${material.name}` })
          await loadInventoryData()
        } else {
          setMessage({ type: 'error', text: result.error || 'Failed to update stock' })
        }
      } catch (error) {
        console.error('Error updating stock:', error)
        setMessage({ type: 'error', text: 'Failed to update stock' })
      }
      setTimeout(() => setMessage(null), 3000)
    }
  }

  // Handle composite component stock adjustment from modal
  const handleCompositeStockSave = async () => {
    if (!compositeAdjustData) return

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const comp of compositeAdjustData.components) {
      // Skip if no change
      if (comp.newStock === comp.currentStock) continue

      try {
        let result

        if (!comp.inventoryRecord?.batches?.length) {
          // Create new inventory record
          result = await inventoryService.setOpeningStock(comp.componentId, {
            quantity: comp.newStock,
            batchNumber: `MANUAL-${Date.now()}-${comp.componentId}`,
            averageCost: 0,
            location: 'Main Warehouse',
            notes: `Created via composite adjustment (${compositeAdjustData.compositeMaterial.name})`
          })
        } else {
          // Adjust existing inventory
          const batchToUpdate = comp.inventoryRecord.batches[0]
          result = await inventoryService.adjustStock(batchToUpdate.id, {
            adjustmentType: 'set',
            quantity: comp.newStock,
            reason: `Composite adjustment (${compositeAdjustData.compositeMaterial.name})`,
            notes: `Set to ${comp.newStock} ${comp.unit} (was ${comp.currentStock})`
          })
        }

        if (result.success) {
          successCount++
        } else {
          errorCount++
        }
      } catch (error) {
        console.error(`Error adjusting ${comp.componentName}:`, error)
        errorCount++
      }
    }

    await loadInventoryData()
    setShowCompositeAdjustModal(false)
    setCompositeAdjustData(null)
    setLoading(false)

    if (errorCount === 0 && successCount > 0) {
      setMessage({ type: 'success', text: `Updated ${successCount} component(s) successfully` })
    } else if (errorCount > 0) {
      setMessage({ type: 'warning', text: `Updated ${successCount}, failed ${errorCount} component(s)` })
    }
    setTimeout(() => setMessage(null), 3000)
  }

  const handleViewHistory = (material) => {
    setSelectedMaterial(material)
    setShowStockHistory(true)
  }

  const handleViewBatches = (material) => {
    const materialId = Number(material.id)
    const materialInventory = inventory[materialId]

    if (materialInventory && materialInventory.batches) {
      setSelectedMaterialBatches({
        material: material,
        batches: materialInventory.batches,
        totalStock: materialInventory.currentStock,
        unit: materialInventory.unit || material.unit
      })
      setShowBatchModal(true)
    } else {
      setMessage({ type: 'info', text: 'No batch data available for this material' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSavePurchaseOrder = (orderData) => {
    console.log('Saving purchase order:', orderData)
    alert('✅ Purchase order created successfully!')
    setShowPurchaseForm(false)
  }

  // Material composition handlers
  const toggleExpandRow = (materialId) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(materialId)) {
      newExpanded.delete(materialId)
    } else {
      newExpanded.add(materialId)
    }
    setExpandedRows(newExpanded)
  }

  const getFilteredMaterials = () => {
    if (showComponents) {
      // Show all materials
      return materials
    } else {
      // Hide component materials
      return materials.filter(m => !componentMaterialIds.includes(m.id))
    }
  }

  // Material management handlers
  const handleAddMaterial = () => {
    setEditingMaterial(null)
    setShowMaterialForm(true)
  }

  const handleEditMaterial = async (material) => {
    try {
      // Load full material data with compositions
      const materialResult = await materialService.getById(material.id)
      if (materialResult.success) {
        setEditingMaterial(materialResult.data)
        setShowMaterialForm(true)
      } else {
        setMessage({ type: 'error', text: 'Failed to load material details' })
        setTimeout(() => setMessage(null), 3000)
      }
    } catch (error) {
      console.error('Error loading material:', error)
      setMessage({ type: 'error', text: 'Failed to load material details' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  const handleSaveMaterial = async (materialData, materialId) => {
    try {
      let response
      if (materialId) {
        // Update existing material
        response = await materialService.update(materialId, materialData)
      } else {
        // Create new material
        response = await materialService.create(materialData)
      }

      if (response.success) {
        setMessage({
          type: 'success',
          text: materialId ? 'Material updated successfully' : 'Material created successfully'
        })
        setTimeout(() => setMessage(null), 3000)

        // Reload materials
        await loadInventoryData()
        setShowMaterialForm(false)
        setEditingMaterial(null)
      } else {
        throw new Error(response.error || 'Failed to save material')
      }
    } catch (error) {
      console.error('Error saving material:', error)
      throw error // Re-throw to let modal handle the error
    }
  }

  // Remove early return - let DataTable handle loading state with skeleton

  return (
    <div className="inventory-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Inventory Management</h1>
          <p>Track stock levels, movements, and material status</p>
        </div>
        <div className="header-actions">
          <button 
            className="btn btn-outline"
            onClick={() => setShowOpeningStockModal(true)}
          >
            <Calendar size={16} />
            {t('setOpeningStock')}
          </button>
          <button 
            className="btn btn-outline"
            onClick={() => setShowCharts(!showCharts)}
          >
            <BarChart3 size={16} />
            {showCharts ? t('hideCharts') : t('showCharts', 'Show Charts')}
          </button>
          <button className="btn btn-outline">
            <TrendingUp size={16} />
            {t('stockReport', 'Stock Report')}
          </button>
          <button className="btn btn-primary">
            <Plus size={16} />
            {t('stockAdjustment', 'Stock Adjustment')}
          </button>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.type}`} style={{ marginBottom: '1rem' }}>
          {message.text}
        </div>
      )}

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

      {/* Charts Section */}
      {showCharts && (
        <div className="charts-section">
          <StockChart 
            inventoryData={inventory}
            title={t('inventoryOverview', 'Inventory Overview')}
            height={400}
          />
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'stock' ? 'active' : ''}`}
          onClick={() => setActiveTab('stock')}
        >
          <Package size={16} />
          Stock Overview
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <TrendingUp size={16} />
          Transactions
        </button>
        <button
          className={`tab-btn ${activeTab === 'master' ? 'active' : ''}`}
          onClick={() => setActiveTab('master')}
        >
          <Droplets size={16} />
          Material Master
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'stock' && (
        <div className="inventory-overview">
          {/* Summary Stats */}
          <div className="overview-stats">
            <div className="stat-card">
              <div className="stat-icon">
                <Package size={24} />
              </div>
              <div className="stat-info">
                <p className="stat-value">{materials.filter(m => !m.is_composite).length}</p>
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
                    // Only count actual materials, not composite groupings
                    if (material?.is_composite) return sum
                    return sum + (stock.currentStock * (material?.standardPrice || 0))
                  }, 0)
                )}</p>
                <p className="stat-label">Total Inventory Value</p>
              </div>
            </div>
          </div>

          {/* Filter Controls */}
          <div className="filter-controls" style={{ marginBottom: '1rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={showComponents}
                onChange={(e) => setShowComponents(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <span>Show component materials</span>
            </label>
            {!showComponents && componentMaterialIds.length > 0 && (
              <span style={{ color: '#6b7280', fontSize: '0.9em' }}>
                ({componentMaterialIds.length} component material{componentMaterialIds.length !== 1 ? 's' : ''} hidden)
              </span>
            )}
          </div>

          {/* All Materials DataTable */}
          <DataTable
            data={getFilteredMaterials().flatMap(material => {
              const stock = inventory[Number(material.id)]
              const status = getStockStatus(material.id)
              const stockValue = stock ? stock.currentStock * material.standardPrice : 0
              const category = categoryDisplayConfig[material.category]

              const rows = [{
                ...material,
                stock: stock || { currentStock: 0, unit: material.unit, reorderLevel: 0 },
                status,
                stockValue,
                categoryInfo: category,
                isComponent: false
              }]

              // If composite material is expanded, add component rows
              if (material.is_composite && expandedRows.has(material.id)) {
                const components = materialCompositions[material.id] || []
                components.forEach(comp => {
                  rows.push({
                    id: `${material.id}-comp-${comp.component_material_id}`,
                    parentId: material.id,
                    name: comp.component_material_name,
                    code: comp.component_material_code,
                    category: '',
                    stock: { currentStock: comp.currentStock, unit: comp.unit },
                    status: 'component',
                    stockValue: 0,
                    componentType: comp.component_type,
                    categoryInfo: null,
                    isComponent: true
                  })
                })
              }

              return rows
            })}
            columns={[
              {
                key: 'name',
                header: t('material'),
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  if (row.isComponent) {
                    // Component row - indented with type badge
                    return (
                      <div className="material-info component-row" style={{ paddingLeft: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-name">{value}</span>
                          <span className={`component-type-badge component-type-${row.componentType}`}>
                            {row.componentType === 'container' ? '📦 container' : '🛢️ content'}
                          </span>
                        </div>
                        <span className="component-details" style={{ color: '#6b7280', fontSize: '0.85em' }}>
                          Stock: {row.stock.currentStock} {row.stock.unit}
                        </span>
                      </div>
                    )
                  }

                  // Regular material row
                  const isComposite = !!row.is_composite
                  const isExpanded = expandedRows.has(row.id)
                  const hasComponents = isComposite && materialCompositions[row.id]?.length > 0

                  return (
                    <div className="material-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isComposite && hasComponents ? (
                          <span
                            className="expand-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpandRow(row.id)
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        ) : null}
                        <div>
                          <span className="material-name">{value}</span>
                          <span className="material-code" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>{row.code}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
              },
              {
                key: 'category',
                header: t('category'),
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  if (row.isComponent) {
                    return null // No category for component rows
                  }
                  if (!row.categoryInfo?.icon) {
                    return <span>{value || 'N/A'}</span>
                  }
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
                key: 'branchName',
                header: 'Branch/Location',
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  if (row.isComponent) {
                    return null // No branch for component rows
                  }
                  // Get branch name from inventory data or default to 'Main'
                  const branchName = row.stock?.branchName || branches.find(b => b.id === row.stock?.branch_id)?.name || 'Main'
                  return (
                    <span style={{ fontSize: '0.9em', color: '#6b7280' }}>
                      <Building size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {branchName}
                    </span>
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
                render: (value, row) => {
                  // Don't show actions for component rows
                  if (row.isComponent) {
                    return null
                  }

                  return (
                    <div className="action-buttons" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewBatches(row)
                        }}
                        title="View Batches"
                      >
                        <Layers size={14} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleAdjustStock(row)
                        }}
                        title="Adjust Stock"
                      >
                        <Edit size={14} />
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleViewHistory(row)
                        }}
                        title="View History"
                      >
                        <FileText size={14} />
                      </button>
                    </div>
                  )
                }
              }
            ]}
            title="Current Inventory Stock"
            subtitle="Physical stock levels, locations, and values"
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

      {activeTab === 'master' && (
        <div className="materials-view">
          <div className="materials-header" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="filter-controls" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={showComponents}
                  onChange={(e) => setShowComponents(e.target.checked)}
                  style={{ cursor: 'pointer' }}
                />
                <span>Show component materials</span>
              </label>
              {!showComponents && componentMaterialIds.length > 0 && (
                <span style={{ color: '#6b7280', fontSize: '0.9em' }}>
                  ({componentMaterialIds.length} component material{componentMaterialIds.length !== 1 ? 's' : ''} hidden)
                </span>
              )}
            </div>
            <button className="btn btn-primary" onClick={handleAddMaterial}>
              <Plus size={16} />
              {t('addMaterial', 'Add Material')}
            </button>
          </div>
          <DataTable
            data={getFilteredMaterials().flatMap(material => {
              const category = categoryDisplayConfig[material.category]
              const rows = [{
                ...material,
                categoryInfo: category,
                isComponent: false
              }]

              // If composite material is expanded, add component rows
              if (material.is_composite && expandedRows.has(material.id)) {
                const components = materialCompositions[material.id] || []
                components.forEach(comp => {
                  rows.push({
                    id: `${material.id}-comp-${comp.component_material_id}`,
                    parentId: material.id,
                    name: comp.component_material_name,
                    code: comp.component_material_code,
                    category: '',
                    unit: comp.unit,
                    standardPrice: 0,
                    currentStock: comp.currentStock,
                    componentType: comp.component_type,
                    categoryInfo: null,
                    isComponent: true
                  })
                })
              }

              return rows
            })}
            columns={[
              {
                key: 'name',
                header: t('material'),
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  if (row.isComponent) {
                    // Component row - indented with type badge
                    return (
                      <div className="material-info component-row" style={{ paddingLeft: '40px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span className="material-name">{value}</span>
                          <span className={`component-type-badge component-type-${row.componentType}`}>
                            {row.componentType === 'container' ? '📦 container' : '🛢️ content'}
                          </span>
                        </div>
                        <span className="component-details" style={{ color: '#6b7280', fontSize: '0.85em' }}>
                          Stock: {row.currentStock} {row.unit}
                        </span>
                      </div>
                    )
                  }

                  // Regular material row
                  const isComposite = !!row.is_composite
                  const isExpanded = expandedRows.has(row.id)
                  const hasComponents = isComposite && materialCompositions[row.id]?.length > 0

                  return (
                    <div className="material-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {isComposite && hasComponents ? (
                          <span
                            className="expand-icon"
                            onClick={(e) => {
                              e.stopPropagation()
                              toggleExpandRow(row.id)
                            }}
                            style={{ cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </span>
                        ) : null}
                        <div>
                          <span className="material-name">{value}</span>
                          <span className="material-code" style={{ display: 'block', fontSize: '0.75rem', color: '#6b7280' }}>{row.code}</span>
                        </div>
                      </div>
                    </div>
                  )
                }
              },
              {
                key: 'category',
                header: t('category'),
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  if (!row.categoryInfo?.icon) {
                    return <span>{value || 'N/A'}</span>
                  }
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
                key: 'code',
                header: 'Material Code',
                sortable: true,
                filterable: true,
                render: (value) => (
                  <span className="material-code">{value}</span>
                )
              },
              {
                key: 'unit',
                header: 'Unit',
                sortable: true,
                render: (value) => (
                  <span className="unit-badge">{value}</span>
                )
              },
              {
                key: 'standardPrice',
                header: 'Standard Price',
                type: 'currency',
                sortable: true,
                render: (value, row) => (
                  <span className="price-display">
                    {formatCurrency(value)} / {row.unit}
                  </span>
                )
              },
              {
                key: 'actions',
                header: 'Actions',
                sortable: false,
                render: (value, row) => {
                  // Don't show actions for component rows
                  if (row.isComponent) {
                    return null
                  }

                  return (
                    <div className="action-buttons">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleEditMaterial(row)}
                        title="Edit Material"
                      >
                        <Edit size={14} />
                        Edit
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleViewHistory(row)}
                        title="View Material Details"
                      >
                        <FileText size={14} />
                        Details
                      </button>
                    </div>
                  )
                }
              }
            ]}
            title="Materials Catalog"
            subtitle="Available materials for purchase and trading"
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

      {activeTab === 'transactions' && (
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
                key: 'branchName',
                header: 'Branch/Location',
                sortable: true,
                filterable: true,
                render: (value, row) => {
                  const branchName = row.branchName || branches.find(b => b.id === row.branch_id)?.name || 'Main'
                  return (
                    <span style={{ fontSize: '0.9em', color: '#6b7280' }}>
                      <Building size={14} style={{ display: 'inline', marginRight: '4px', verticalAlign: 'middle' }} />
                      {branchName}
                    </span>
                  )
                }
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
          isOpen={true}
          title={`Stock History - ${selectedMaterial.name}`}
          onClose={() => setShowStockHistory(false)}
          size="lg"
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
                  <span>{inventory[Number(selectedMaterial.id)]?.currentStock || 0} {selectedMaterial.unit}</span>
                </div>
                <div className="summary-item">
                  <label>Reorder Level</label>
                  <span>{inventory[Number(selectedMaterial.id)]?.reorderLevel || 0} {selectedMaterial.unit}</span>
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

      {/* Opening Stock Modal */}
      {showOpeningStockModal && (
        <OpeningStockModal
          isOpen={showOpeningStockModal}
          onClose={() => setShowOpeningStockModal(false)}
          inventory={inventory}
          setInventory={setInventory}
          materials={materials}
        />
      )}

      {/* Material Form Modal */}
      <MaterialFormModal
        isOpen={showMaterialForm}
        onClose={() => {
          setShowMaterialForm(false)
          setEditingMaterial(null)
        }}
        onSave={handleSaveMaterial}
        editingMaterial={editingMaterial}
        categories={materialCategories}
        allMaterials={materials}
      />

      {/* Batch Details Modal */}
      {showBatchModal && selectedMaterialBatches && (
        <Modal
          isOpen={true}
          title={`Inventory Batches - ${selectedMaterialBatches.material.name}`}
          onClose={() => {
            setShowBatchModal(false)
            setSelectedMaterialBatches(null)
          }}
          size="lg"
        >
          <div className="batch-modal-content">
            {/* Summary Header */}
            <div className="batch-summary" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Material Code</label>
                <span style={{ fontWeight: '600' }}>{selectedMaterialBatches.material.code}</span>
              </div>
              <div>
                <label style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Total Stock</label>
                <span style={{ fontWeight: '600', color: '#059669' }}>
                  {selectedMaterialBatches.totalStock} {selectedMaterialBatches.unit}
                </span>
              </div>
              <div>
                <label style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Number of Batches</label>
                <span style={{ fontWeight: '600' }}>{selectedMaterialBatches.batches.length}</span>
              </div>
            </div>

            {/* Batch Table */}
            <div className="batch-table-container" style={{ overflowX: 'auto' }}>
              <table className="batch-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Batch Number</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Quantity</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Cost/Unit</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Total Value</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Location</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMaterialBatches.batches.map((batch, index) => (
                    <tr
                      key={batch.id || index}
                      style={{
                        borderBottom: '1px solid #e2e8f0',
                        backgroundColor: index % 2 === 0 ? '#fff' : '#f8fafc'
                      }}
                    >
                      <td style={{ padding: '0.75rem' }}>
                        <code style={{
                          backgroundColor: '#e0f2fe',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          color: '#0369a1'
                        }}>
                          {batch.batchNumber || 'N/A'}
                        </code>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                        {parseFloat(batch.quantity || batch.currentStock || 0).toFixed(2)} {selectedMaterialBatches.unit}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        OMR {parseFloat(batch.averageCost || batch.lastPurchasePrice || 0).toFixed(3)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                        OMR {(parseFloat(batch.quantity || batch.currentStock || 0) * parseFloat(batch.averageCost || batch.lastPurchasePrice || 0)).toFixed(3)}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280' }}>
                        {batch.location || 'Main Warehouse'}
                      </td>
                      <td style={{ padding: '0.75rem', color: '#6b7280', fontSize: '0.85rem' }}>
                        {batch.notes || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: '#f1f5f9', fontWeight: '600' }}>
                    <td style={{ padding: '0.75rem' }}>Total</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      {selectedMaterialBatches.totalStock} {selectedMaterialBatches.unit}
                    </td>
                    <td style={{ padding: '0.75rem' }}></td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      OMR {selectedMaterialBatches.batches.reduce((sum, b) =>
                        sum + (parseFloat(b.quantity || b.currentStock || 0) * parseFloat(b.averageCost || b.lastPurchasePrice || 0)), 0
                      ).toFixed(3)}
                    </td>
                    <td colSpan="2"></td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {selectedMaterialBatches.batches.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                <Layers size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
                <p>No batch records found for this material.</p>
              </div>
            )}
          </div>

          <div className="modal-actions" style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              className="btn btn-outline"
              onClick={() => {
                setShowBatchModal(false)
                setSelectedMaterialBatches(null)
              }}
            >
              Close
            </button>
          </div>
        </Modal>
      )}

      {/* Composite Stock Adjustment Modal */}
      {showCompositeAdjustModal && compositeAdjustData && (
        <Modal
          isOpen={true}
          title={`Adjust Component Stocks - ${compositeAdjustData.compositeMaterial.name}`}
          onClose={() => {
            setShowCompositeAdjustModal(false)
            setCompositeAdjustData(null)
          }}
          size="lg"
        >
          <div className="composite-adjust-modal">
            {/* Info Banner */}
            <div style={{
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '8px',
              padding: '1rem',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem'
            }}>
              <AlertTriangle size={20} style={{ color: '#d97706', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#92400e' }}>Composite Material</strong>
                <p style={{ margin: '0.25rem 0 0 0', color: '#92400e', fontSize: '0.875rem' }}>
                  This material is composed of multiple components. Adjust each component's stock level below.
                  The composite material itself is not stored in inventory - only its components are tracked.
                </p>
              </div>
            </div>

            {/* Composite Summary */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              borderRadius: '8px'
            }}>
              <div>
                <label style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Composite Material</label>
                <span style={{ fontWeight: '600' }}>{compositeAdjustData.compositeMaterial.name}</span>
              </div>
              <div>
                <label style={{ color: '#6b7280', fontSize: '0.85rem', display: 'block' }}>Material Code</label>
                <span style={{ fontWeight: '600' }}>{compositeAdjustData.compositeMaterial.code}</span>
              </div>
            </div>

            {/* Component Stock Inputs */}
            <div style={{ marginBottom: '1.5rem' }}>
              <h4 style={{ margin: '0 0 1rem 0', fontSize: '1rem', fontWeight: '600' }}>
                Component Stock Levels
              </h4>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Component</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0' }}>Type</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>Current Stock</th>
                    <th style={{ padding: '0.75rem', borderBottom: '1px solid #e2e8f0', textAlign: 'right' }}>New Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {compositeAdjustData.components.map((comp, index) => (
                    <tr key={comp.componentId} style={{ borderBottom: '1px solid #e2e8f0' }}>
                      <td style={{ padding: '0.75rem' }}>
                        <div>
                          <span style={{ fontWeight: '500' }}>{comp.componentName}</span>
                          <span style={{ display: 'block', fontSize: '0.8rem', color: '#6b7280' }}>
                            {comp.componentCode}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          backgroundColor: comp.componentType === 'container' ? '#dbeafe' : '#dcfce7',
                          color: comp.componentType === 'container' ? '#1e40af' : '#166534'
                        }}>
                          {comp.componentType === 'container' ? 'Container' : 'Content'}
                        </span>
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', color: '#6b7280' }}>
                        {comp.currentStock} {comp.unit}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={comp.newStock}
                            onChange={(e) => {
                              const newComponents = [...compositeAdjustData.components]
                              newComponents[index] = {
                                ...newComponents[index],
                                newStock: parseFloat(e.target.value) || 0
                              }
                              setCompositeAdjustData({
                                ...compositeAdjustData,
                                components: newComponents
                              })
                            }}
                            style={{
                              width: '100px',
                              padding: '0.5rem',
                              border: '1px solid #d1d5db',
                              borderRadius: '6px',
                              textAlign: 'right'
                            }}
                          />
                          <span style={{ color: '#6b7280', fontSize: '0.875rem', minWidth: '40px' }}>
                            {comp.unit}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowCompositeAdjustModal(false)
                  setCompositeAdjustData(null)
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleCompositeStockSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

// Opening Stock Modal Component
const OpeningStockModal = ({ isOpen, onClose, inventory, setInventory, materials }) => {
  const { t } = useLocalization()
  const [selectedMaterial, setSelectedMaterial] = useState('')
  const [openingStockData, setOpeningStockData] = useState({
    quantity: '',
    value: '',
    date: new Date().toISOString().split('T')[0]
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!selectedMaterial) {
      alert(t('pleaseSelect', 'Please select') + ' ' + t('material'))
      return
    }

    // Update inventory with opening stock
    const updatedInventory = inventory.map(item => {
      if (item.materialId === selectedMaterial) {
        return {
          ...item,
          openingStock: parseFloat(openingStockData.quantity),
          openingStockValue: parseFloat(openingStockData.value),
          openingStockDate: openingStockData.date + 'T00:00:00Z'
        }
      }
      return item
    })

    setInventory(updatedInventory)
    
    // Reset form
    setSelectedMaterial('')
    setOpeningStockData({
      quantity: '',
      value: '',
      date: new Date().toISOString().split('T')[0]
    })

    onClose()
    alert(t('openingStockUpdated', 'Opening stock updated successfully'))
  }

  const selectedInventoryItem = inventory.find(item => item.materialId === selectedMaterial)
  const selectedMaterialInfo = materials.find(mat => mat.id === selectedMaterial)

  return (
    <Modal
      title={t('setOpeningStock')}
      onClose={onClose}
      className="modal-md"
    >
      <form onSubmit={handleSubmit} className="opening-stock-form">
        <div className="form-section">
          <div className="form-group">
            <label>{t('material')} *</label>
            <select
              value={selectedMaterial}
              onChange={(e) => setSelectedMaterial(e.target.value)}
              required
            >
              <option value="">{t('selectMaterial', 'Select Material')}</option>
              {materials.map(material => (
                <option key={material.id} value={material.id}>
                  {material.name} ({material.code})
                </option>
              ))}
            </select>
          </div>

          {selectedMaterial && selectedInventoryItem && (
            <div className="current-stock-info">
              <div className="info-grid">
                <div className="info-item">
                  <label>{t('currentStock')}</label>
                  <span>{selectedInventoryItem.currentStock} {selectedInventoryItem.unit}</span>
                </div>
                <div className="info-item">
                  <label>{t('currentOpeningStock', 'Current Opening Stock')}</label>
                  <span>
                    {selectedInventoryItem.openingStock || 0} {selectedInventoryItem.unit}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="form-group">
            <label>{t('openingStock')} *</label>
            <div className="input-with-unit">
              <input
                type="number"
                step="0.01"
                value={openingStockData.quantity}
                onChange={(e) => setOpeningStockData({
                  ...openingStockData,
                  quantity: e.target.value
                })}
                placeholder="0.00"
                required
              />
              {selectedInventoryItem && (
                <span className="unit-label">{selectedInventoryItem.unit}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label>{t('openingStockValue')} *</label>
            <div className="input-with-unit">
              <input
                type="number"
                step="0.001"
                value={openingStockData.value}
                onChange={(e) => setOpeningStockData({
                  ...openingStockData,
                  value: e.target.value
                })}
                placeholder="0.000"
                required
              />
              <span className="unit-label">OMR</span>
            </div>
          </div>

          <div className="form-group">
            <label>{t('openingStockDate')} *</label>
            <input
              type="date"
              value={openingStockData.date}
              onChange={(e) => setOpeningStockData({
                ...openingStockData,
                date: e.target.value
              })}
              required
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('updateOpeningStock', 'Update Opening Stock')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default Inventory