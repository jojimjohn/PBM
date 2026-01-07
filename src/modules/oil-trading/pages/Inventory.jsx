import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import Modal from '../../../components/ui/Modal'
import InventoryCharts from '../../../components/InventoryCharts'
import MaterialFormModal from '../../../components/MaterialFormModal'
import StockReportModal from '../../../components/StockReportModal'
import StockAdjustmentModal from '../../../components/StockAdjustmentModal'
import inventoryService from '../../../services/inventoryService'
import materialService from '../../../services/materialService'
import supplierService from '../../../services/supplierService'
import branchService from '../../../services/branchService'
import materialCompositionService from '../../../services/materialCompositionService'
import transactionService from '../../../services/transactionService'
import TimelineView from '../components/TimelineView'
import { Package, Plus, AlertTriangle, TrendingUp, TrendingDown, Droplets, Drum, Fuel, Factory, ShoppingCart, Edit, FileText, Banknote, BarChart3, ChevronDown, ChevronRight, Building, Layers, Clock, X } from 'lucide-react'
import '../styles/Inventory.css'

const Inventory = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate } = useSystemSettings()
  const [loading, setLoading] = useState(true)
  const [loadingMovements, setLoadingMovements] = useState(false)
  const [activeTab, setActiveTab] = useState('stock')
  const [inventory, setInventory] = useState([])
  const [materials, setMaterials] = useState([])
  const [materialCategories, setMaterialCategories] = useState([])
  const [vendors, setVendors] = useState([])
  const [branches, setBranches] = useState([])
  const [stockMovements, setStockMovements] = useState([])
  const [alerts, setAlerts] = useState([])
  const [showAlertDropdown, setShowAlertDropdown] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showStockHistory, setShowStockHistory] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [materialMovements, setMaterialMovements] = useState([])
  const [loadingMaterialMovements, setLoadingMaterialMovements] = useState(false)
  const [showCharts, setShowCharts] = useState(false)
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [message, setMessage] = useState(null)
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedMaterialBatches, setSelectedMaterialBatches] = useState(null)

  // Composite stock adjustment modal state
  const [showCompositeAdjustModal, setShowCompositeAdjustModal] = useState(false)
  const [compositeAdjustData, setCompositeAdjustData] = useState(null)

  // Stock report modal state
  const [showStockReport, setShowStockReport] = useState(false)

  // Stock adjustment modal state
  const [showStockAdjustment, setShowStockAdjustment] = useState(false)
  const [adjustmentMaterialId, setAdjustmentMaterialId] = useState('')

  // Material composition state
  const [expandedRows, setExpandedRows] = useState(new Set())
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

  useEffect(() => {
    loadInventoryData()
    loadMaterialCategories()
  }, [])

  // Load stock movements when Transactions tab is activated
  useEffect(() => {
    if (activeTab === 'transactions') {
      loadStockMovements()
    }
  }, [activeTab])

  // Close alert dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAlertDropdown && !e.target.closest('.alert-dropdown-container')) {
        setShowAlertDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAlertDropdown])

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

      // Load supplier/vendor data using API service
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
        setVendors([])
      }

      // Create alerts for low stock items
      const lowStockItems = Object.values(inventoryByMaterial).filter(item =>
        item.currentStock <= item.reorderLevel && item.reorderLevel > 0
      )
      setAlerts(lowStockItems.map((item, index) => ({
        id: `alert-${item.materialId || index}`,
        type: 'warning',
        severity: item.currentStock <= item.reorderLevel * 0.5 ? 'critical' : 'warning',
        material: item.materialName || item.materialCode,
        currentStock: item.currentStock,
        reorderLevel: item.reorderLevel,
        unit: item.unit,
        message: `Low stock alert: ${item.materialCode} (${item.currentStock} ${item.unit})`
      })))

    } catch (error) {
      console.error('Error loading inventory data:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadStockMovements = async () => {
    try {
      setLoadingMovements(true)
      const movements = await transactionService.getStockMovements({ limit: 100 })
      setStockMovements(movements)
    } catch (error) {
      console.error('Error loading stock movements:', error)
      setStockMovements([])
    } finally {
      setLoadingMovements(false)
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

  const getEffectiveStock = (materialId) => {
    const matId = Number(materialId)
    const material = materials.find(m => Number(m.id) === matId)

    if (material?.is_composite) {
      const components = materialCompositions[matId] || []
      if (components.length === 0) return { currentStock: 0, reorderLevel: 0 }

      let minUnits = Infinity
      for (const comp of components) {
        const compStock = inventory[comp.component_material_id]?.currentStock || 0
        const qtyPerComposite = parseFloat(comp.quantity_per_composite) || 1
        const availableUnits = qtyPerComposite > 0 ? Math.floor(compStock / qtyPerComposite) : 0
        minUnits = Math.min(minUnits, availableUnits)
      }

      return {
        currentStock: minUnits === Infinity ? 0 : minUnits,
        reorderLevel: material.minimumStockLevel || 0
      }
    }

    const stock = inventory[matId]
    return stock || { currentStock: 0, reorderLevel: 0 }
  }

  const getStockStatus = (materialId) => {
    const stock = getEffectiveStock(materialId)

    if (stock.currentStock === 0) return 'out-of-stock'
    if (stock.reorderLevel > 0) {
      if (stock.currentStock <= stock.reorderLevel * 0.5) return 'critical'
      if (stock.currentStock <= stock.reorderLevel) return 'low'
    }
    return 'good'
  }

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0
    return `OMR ${numAmount.toFixed(3)}`
  }

  const handleCreatePurchaseOrder = (materialId = null) => {
    setShowPurchaseForm(true)
  }

  const handleViewAllCategory = (categoryKey) => {
    setActiveTab('master')
  }

  const handleAdjustStock = async (material) => {
    const matId = Number(material.id)

    if (material.is_composite) {
      const components = materialCompositions[matId] || []
      if (components.length > 0) {
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

    const currentStock = inventory[matId]?.currentStock || 0
    const newStock = prompt(`Enter new stock level for ${material.name}:`, currentStock)

    if (newStock !== null && !isNaN(newStock)) {
      const newQuantity = parseFloat(newStock)
      const inventoryRecord = inventory[matId]

      try {
        let result

        if (!inventoryRecord?.batches?.length) {
          result = await inventoryService.setOpeningStock(matId, {
            quantity: newQuantity,
            batchNumber: `MANUAL-${Date.now()}`,
            averageCost: 0,
            location: 'Main Warehouse',
            notes: 'Created via manual stock adjustment'
          })
        } else {
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

  const handleCompositeStockSave = async () => {
    if (!compositeAdjustData) return

    setLoading(true)
    let successCount = 0
    let errorCount = 0

    for (const comp of compositeAdjustData.components) {
      if (comp.newStock === comp.currentStock) continue

      try {
        let result

        if (!comp.inventoryRecord?.batches?.length) {
          result = await inventoryService.setOpeningStock(comp.componentId, {
            quantity: comp.newStock,
            batchNumber: `MANUAL-${Date.now()}-${comp.componentId}`,
            averageCost: 0,
            location: 'Main Warehouse',
            notes: `Created via composite adjustment (${compositeAdjustData.compositeMaterial.name})`
          })
        } else {
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

  const handleViewHistory = async (material) => {
    setSelectedMaterial(material)
    setShowStockHistory(true)
    setMaterialMovements([])
    setLoadingMaterialMovements(true)

    try {
      const response = await inventoryService.getBatchMovements({
        materialId: material.id,
        limit: 50
      })

      if (response.success && response.data?.movements) {
        const transformedMovements = response.data.movements.map(movement => {
          const isInflow = movement.quantity > 0
          const type = isInflow ? 'in' : 'out'

          let reference = ''
          if (movement.batchNumber) {
            reference = movement.batchNumber
          }
          if (movement.referenceType && movement.referenceType !== 'seed_data') {
            reference = reference ? `${reference} (${movement.referenceType})` : movement.referenceType
          }

          const movementTypeLabels = {
            'receipt': 'Stock Receipt',
            'sale': 'Sale',
            'wastage': 'Wastage',
            'adjustment': 'Adjustment',
            'transfer': 'Transfer'
          }
          let reason = movementTypeLabels[movement.movementType] || movement.movementType
          if (movement.notes) {
            reason = `${reason}: ${movement.notes}`
          }

          return {
            id: movement.id,
            type,
            quantity: Math.abs(movement.quantity),
            reason,
            reference,
            date: movement.movementDate,
            runningBalance: movement.runningBalance,
            unitCost: movement.unitCost,
            totalValue: movement.totalValue,
            batchNumber: movement.batchNumber,
            supplierName: movement.supplierName
          }
        })

        setMaterialMovements(transformedMovements)
      } else {
        setMaterialMovements([])
      }
    } catch (error) {
      console.error('Error loading material movements:', error)
      setMaterialMovements([])
    } finally {
      setLoadingMaterialMovements(false)
    }
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
    alert('Purchase order created successfully!')
    setShowPurchaseForm(false)
  }

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
    return materials.filter(m => !componentMaterialIds.includes(Number(m.id)))
  }

  const handleAddMaterial = () => {
    setEditingMaterial(null)
    setShowMaterialForm(true)
  }

  const handleEditMaterial = async (material) => {
    try {
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
        response = await materialService.update(materialId, materialData)
      } else {
        response = await materialService.create(materialData)
      }

      if (response.success) {
        setMessage({
          type: 'success',
          text: materialId ? 'Material updated successfully' : 'Material created successfully'
        })
        setTimeout(() => setMessage(null), 3000)
        await loadInventoryData()
        setShowMaterialForm(false)
        setEditingMaterial(null)
      } else {
        throw new Error(response.error || 'Failed to save material')
      }
    } catch (error) {
      console.error('Error saving material:', error)
      throw error
    }
  }

  // Calculate stats for header
  const totalMaterials = materials.filter(m => !m.is_composite).length
  const totalInventoryValue = Object.entries(inventory).reduce((sum, [id, stock]) => {
    const materialId = Number(id)
    const material = materials.find(m => Number(m.id) === materialId)
    if (material?.is_composite) return sum
    return sum + (stock.currentStock * (material?.standardPrice || 0))
  }, 0)
  const criticalAlerts = alerts.filter(a => a.severity === 'critical').length

  // Header actions for Stock Overview tab
  const stockOverviewHeaderActions = (
    <div className="inventory-toolbar">
      {/* Alert Dropdown */}
      {alerts.length > 0 && (
        <div className="alert-dropdown-container">
          <button
            className={`btn btn-outline alert-trigger ${criticalAlerts > 0 ? 'has-critical' : ''}`}
            onClick={() => setShowAlertDropdown(!showAlertDropdown)}
          >
            <AlertTriangle size={16} />
            <span>{alerts.length} Alert{alerts.length !== 1 ? 's' : ''}</span>
            {criticalAlerts > 0 && <span className="critical-badge">{criticalAlerts}</span>}
            <ChevronDown size={14} className={showAlertDropdown ? 'rotated' : ''} />
          </button>

          {showAlertDropdown && (
            <div className="alert-dropdown">
              <div className="alert-dropdown-header">
                <span>Stock Alerts</span>
                <button className="close-btn" onClick={() => setShowAlertDropdown(false)}>
                  <X size={14} />
                </button>
              </div>
              <div className="alert-dropdown-list">
                {alerts.slice(0, 5).map(alert => (
                  <div key={alert.id} className={`alert-dropdown-item ${alert.severity}`}>
                    <div className="alert-item-content">
                      <span className={`alert-severity-dot ${alert.severity}`}></span>
                      <div className="alert-item-info">
                        <span className="alert-item-material">{alert.material}</span>
                        <span className="alert-item-stock">
                          {alert.currentStock} / {alert.reorderLevel} {alert.unit}
                        </span>
                      </div>
                    </div>
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => {
                        handleCreatePurchaseOrder(alert.id)
                        setShowAlertDropdown(false)
                      }}
                    >
                      <ShoppingCart size={12} />
                    </button>
                  </div>
                ))}
              </div>
              {alerts.length > 5 && (
                <div className="alert-dropdown-footer">
                  <span className="more-alerts">+{alerts.length - 5} more alerts</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="quick-stat">
          <Package size={14} />
          <span>{totalMaterials} Materials</span>
        </div>
        <div className="quick-stat">
          <Banknote size={14} />
          <span>{formatCurrency(totalInventoryValue)}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <button
        className="btn btn-outline"
        onClick={() => setShowCharts(!showCharts)}
      >
        <BarChart3 size={16} />
        {showCharts ? 'Hide Charts' : 'Charts'}
      </button>
      <button
        className="btn btn-outline"
        onClick={() => setShowStockReport(true)}
      >
        <TrendingUp size={16} />
        Report
      </button>
      <button
        className="btn btn-primary"
        onClick={() => {
          setAdjustmentMaterialId('')
          setShowStockAdjustment(true)
        }}
      >
        <Plus size={16} />
        Adjustment
      </button>
    </div>
  )

  return (
    <div className="oil-inventory-page">
      {/* Message Display */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
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
          className={`tab-btn ${activeTab === 'movements' ? 'active' : ''}`}
          onClick={() => setActiveTab('movements')}
        >
          <Clock size={16} />
          {t('transactionsTab', 'Transactions')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <TrendingUp size={16} />
          {t('stockMovementsTab', 'Stock Movements')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'master' ? 'active' : ''}`}
          onClick={() => setActiveTab('master')}
        >
          <Droplets size={16} />
          Material Master
        </button>
      </div>

      {/* Charts Section */}
      {showCharts && activeTab === 'stock' && (
        <div className="charts-section">
          <InventoryCharts materials={materials} />
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'stock' && (
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

            if (material.is_composite && expandedRows.has(material.id)) {
              const components = materialCompositions[material.id] || []
              components.forEach(comp => {
                const compStock = inventory[comp.component_material_id]
                const compCurrentStock = compStock?.currentStock || 0
                const compReorderLevel = compStock?.reorderLevel || 0
                let compStatus = 'good'
                if (compCurrentStock === 0) compStatus = 'out-of-stock'
                else if (compReorderLevel > 0) {
                  if (compCurrentStock <= compReorderLevel * 0.5) compStatus = 'critical'
                  else if (compCurrentStock <= compReorderLevel) compStatus = 'low'
                }

                rows.push({
                  id: `${material.id}-comp-${comp.component_material_id}`,
                  componentMaterialId: comp.component_material_id,
                  parentId: material.id,
                  name: comp.component_material_name,
                  code: comp.component_material_code,
                  category: '',
                  stock: { currentStock: compCurrentStock, unit: comp.unit, reorderLevel: compReorderLevel },
                  status: compStatus,
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
                  return (
                    <div className="cell-row component-row">
                      <span className="cell-text">{value}</span>
                      <span className={`status-badge ${row.componentType}`}>
                        {row.componentType === 'container' ? 'Container' : 'Content'}
                      </span>
                    </div>
                  )
                }

                const isComposite = !!row.is_composite
                const isExpanded = expandedRows.has(row.id)
                const hasComponents = isComposite && materialCompositions[row.id]?.length > 0

                return (
                  <div className="cell-row">
                    {isComposite && hasComponents && (
                      <span
                        className="expand-icon"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleExpandRow(row.id)
                        }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    )}
                    <div className="cell-info">
                      <span className="cell-text">{value}</span>
                      <span className="cell-code">{row.code}</span>
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
                if (row.isComponent) return null
                if (!row.categoryInfo?.icon) {
                  return <span className="category-text">{value || 'N/A'}</span>
                }
                const CategoryIcon = row.categoryInfo.icon
                return (
                  <div className="cell-icon">
                    <CategoryIcon size={14} />
                    {row.categoryInfo.name}
                  </div>
                )
              }
            },
            {
              key: 'branchName',
              header: 'Location',
              sortable: true,
              filterable: true,
              render: (value, row) => {
                if (row.isComponent) return null
                const branchName = row.stock?.branchName || branches.find(b => b.id === row.stock?.branch_id)?.name || 'Main'
                return (
                  <span className="location-cell">
                    <Building size={14} />
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
              render: (value, row) => {
                if (row.is_composite && !row.isComponent) {
                  return <span className="cell-number muted">See components</span>
                }
                return (
                  <span className="cell-number">
                    {value} {row.stock.unit}
                  </span>
                )
              }
            },
            {
              key: 'stock.reorderLevel',
              header: t('reorderLevel'),
              type: 'number',
              sortable: true,
              render: (value, row) => {
                if (row.is_composite && !row.isComponent) {
                  return <span className="reorder-level muted">—</span>
                }
                return (
                  <span className="reorder-level">
                    {value > 0 ? `${value} ${row.stock.unit}` : 'Not set'}
                  </span>
                )
              }
            },
            {
              key: 'status',
              header: t('status'),
              sortable: true,
              filterable: true,
              render: (value) => (
                <span className={`status-badge ${value}`}>
                  {value === 'good' ? 'In Stock' :
                   value === 'low' ? 'Low Stock' :
                   value === 'critical' ? 'Critical' : 'Out of Stock'}
                </span>
              )
            },
            {
              key: 'stockValue',
              header: t('stockValue'),
              type: 'currency',
              align: 'right',
              sortable: true,
              render: (value) => <span className="cell-number">{formatCurrency(value)}</span>
            },
            {
              key: 'actions',
              header: t('actions'),
              sortable: false,
              render: (value, row) => {
                if (row.is_composite && !row.isComponent) {
                  return <span className="no-actions">—</span>
                }

                const materialForAction = row.isComponent
                  ? { ...row, id: row.componentMaterialId, name: row.name, code: row.code, unit: row.stock?.unit || 'units' }
                  : row

                return (
                  <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
                    <button className="btn btn-icon" onClick={() => handleViewBatches(materialForAction)} title="View Batches">
                      <Layers size={14} />
                    </button>
                    <button className="btn btn-icon" onClick={() => handleAdjustStock(materialForAction)} title="Adjust Stock">
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-icon" onClick={() => handleViewHistory(materialForAction)} title="View History">
                      <FileText size={14} />
                    </button>
                  </div>
                )
              }
            }
          ]}
          title="Inventory Management"
          subtitle="Track stock levels, movements, and material status"
          headerActions={stockOverviewHeaderActions}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noMaterialsFound')}
          className="inventory-table"
          initialPageSize={20}
        />
      )}

      {activeTab === 'movements' && (
        <div className="movements-timeline-view data-table-container">
          <div className="data-table-header">
            <h2 className="data-table-title">{t('transactions', 'Transactions')}</h2>
            <p className="data-table-subtitle">{t('transactionsSubtitle', 'View and filter all inventory transactions')}</p>
          </div>
          <TimelineView />
        </div>
      )}

      {activeTab === 'master' && (
        <DataTable
          data={getFilteredMaterials().flatMap(material => {
            const category = categoryDisplayConfig[material.category]
            const rows = [{ ...material, categoryInfo: category, isComponent: false }]

            if (material.is_composite && expandedRows.has(material.id)) {
              const components = materialCompositions[material.id] || []
              components.forEach(comp => {
                rows.push({
                  id: `${material.id}-comp-${comp.component_material_id}`,
                  componentMaterialId: comp.component_material_id,
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
                  return (
                    <div className="cell-row component-row">
                      <span className="cell-text">{value}</span>
                      <span className={`status-badge ${row.componentType}`}>
                        {row.componentType === 'container' ? 'Container' : 'Content'}
                      </span>
                    </div>
                  )
                }

                const isComposite = !!row.is_composite
                const isExpanded = expandedRows.has(row.id)
                const hasComponents = isComposite && materialCompositions[row.id]?.length > 0

                return (
                  <div className="cell-row">
                    {isComposite && hasComponents && (
                      <span
                        className="expand-icon"
                        onClick={(e) => { e.stopPropagation(); toggleExpandRow(row.id) }}
                      >
                        {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                      </span>
                    )}
                    <div className="cell-info">
                      <span className="cell-text">{value}</span>
                      <span className="cell-code">{row.code}</span>
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
                  return <span className="category-text">{value || 'N/A'}</span>
                }
                const CategoryIcon = row.categoryInfo.icon
                return (
                  <div className="cell-icon">
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
              render: (value) => <span className="cell-code accent">{value}</span>
            },
            {
              key: 'unit',
              header: 'Unit',
              sortable: true,
              render: (value) => <span className="status-badge">{value}</span>
            },
            {
              key: 'standardPrice',
              header: 'Standard Price',
              type: 'currency',
              sortable: true,
              render: (value, row) => (
                <span className="cell-number">
                  {formatCurrency(value)} / {row.unit}
                </span>
              )
            },
            {
              key: 'actions',
              header: 'Actions',
              sortable: false,
              render: (value, row) => {
                if (row.isComponent) return null

                return (
                  <div className="cell-actions">
                    <button className="btn btn-icon" onClick={() => handleEditMaterial(row)} title="Edit Material">
                      <Edit size={14} />
                    </button>
                    <button className="btn btn-icon" onClick={() => handleViewHistory(row)} title="View Details">
                      <FileText size={14} />
                    </button>
                  </div>
                )
              }
            }
          ]}
          title="Materials Catalog"
          subtitle="Manage material definitions and pricing"
          headerActions={
            <button className="btn btn-primary" onClick={handleAddMaterial}>
              <Plus size={16} />
              Add Material
            </button>
          }
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noMaterialsFound')}
          className="materials-table"
          initialPageSize={10}
        />
      )}

      {activeTab === 'transactions' && (
        <DataTable
          data={stockMovements
            .filter(movement => {
              const material = materials.find(m => Number(m.id) === Number(movement.materialId))
              return material || movement.materialName
            })
            .map(movement => {
              const material = materials.find(m => Number(m.id) === Number(movement.materialId))
              const resolvedMaterial = material || {
                name: movement.materialName || 'Unknown',
                code: movement.materialCode || '',
                unit: ''
              }
              return {
                ...movement,
                materialName: resolvedMaterial.name,
                material: resolvedMaterial
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
                <span className="movement-date">
                  {value ? formatDate(new Date(value)) : '-'}
                </span>
              )
            },
            {
              key: 'materialName',
              header: t('material'),
              sortable: true,
              filterable: true,
              render: (value, row) => (
                <div className="cell-info">
                  <span className="cell-text">{row.material.name}</span>
                  <span className="cell-code">{row.material.code}</span>
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
                  {value === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {value === 'in' ? 'Stock In' : 'Stock Out'}
                </span>
              )
            },
            {
              key: 'branchName',
              header: 'Location',
              sortable: true,
              filterable: true,
              render: (value, row) => {
                const branchName = row.branchName || branches.find(b => b.id === row.branchId)?.name || 'Main'
                return (
                  <span className="location-cell">
                    <Building size={14} />
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
              render: (value) => <span className="movement-reason">{value}</span>
            },
            {
              key: 'reference',
              header: t('reference', 'Reference'),
              sortable: true,
              render: (value) => value ? <code className="reference-code">{value}</code> : '-'
            }
          ]}
          title="Stock Movements"
          subtitle="Track inventory inflows and outflows"
          loading={loadingMovements}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noMovementsFound', 'No stock movements found')}
          className="movements-table"
          initialPageSize={10}
        />
      )}

      {/* Modals */}
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

      {showStockHistory && selectedMaterial && (
        <Modal
          isOpen={true}
          title={`Stock History - ${selectedMaterial.name}`}
          onClose={() => setShowStockHistory(false)}
          size="lg"
        >
          <div className="stock-history-modal">
            <div className="history-summary">
              <div className="summary-item">
                <label>Material Code</label>
                <span>{selectedMaterial.code}</span>
              </div>
              <div className="summary-item">
                <label>Current Stock</label>
                <span className="stock-value">
                  {inventory[Number(selectedMaterial.id)]?.currentStock || 0} {selectedMaterial.unit}
                </span>
              </div>
              <div className="summary-item">
                <label>Status</label>
                <span className={`status-badge ${getStockStatus(selectedMaterial.id)}`}>
                  {getStockStatus(selectedMaterial.id)}
                </span>
              </div>
            </div>

            {loadingMaterialMovements ? (
              <div className="loading-state">
                <p>{t('loading')}</p>
              </div>
            ) : materialMovements.length > 0 ? (
              <div className="movements-table-container">
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>{t('type')}</th>
                      <th className="text-right">{t('quantity')}</th>
                      <th className="text-right">Balance</th>
                      <th>{t('reason')}</th>
                      <th>{t('reference')}</th>
                      <th>{t('date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {materialMovements.map((movement, index) => (
                      <tr key={movement.id} className={index % 2 === 0 ? 'even' : 'odd'}>
                        <td>
                          <span className={`movement-type-badge ${movement.type}`}>
                            {movement.type === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                            {movement.type === 'in' ? 'In' : 'Out'}
                          </span>
                        </td>
                        <td className={`text-right quantity ${movement.type}`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity} {selectedMaterial.unit}
                        </td>
                        <td className="text-right balance">
                          {movement.runningBalance !== undefined
                            ? `${movement.runningBalance.toFixed(2)} ${selectedMaterial.unit}`
                            : '-'}
                        </td>
                        <td className="reason">{movement.reason || '-'}</td>
                        <td>
                          {movement.reference ? <code className="reference-code">{movement.reference}</code> : '-'}
                        </td>
                        <td className="date">{movement.date ? formatDate(new Date(movement.date)) : '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-state">
                <Clock size={48} />
                <p>{t('noMovementsFound')}</p>
              </div>
            )}

            <div className="modal-footer">
              <button className="btn btn-outline" onClick={() => setShowStockHistory(false)}>
                {t('close')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setShowStockHistory(false)
                  handleAdjustStock(selectedMaterial)
                }}
              >
                {t('adjustStock')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <StockReportModal
        isOpen={showStockReport}
        onClose={() => setShowStockReport(false)}
        inventory={inventory}
        materials={materials}
        t={t}
        formatCurrency={formatCurrency}
      />

      <StockAdjustmentModal
        isOpen={showStockAdjustment}
        onClose={() => setShowStockAdjustment(false)}
        materials={materials}
        inventory={inventory}
        preselectedMaterialId={adjustmentMaterialId}
        onSuccess={() => loadInventoryData()}
      />

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
          <div className="batch-modal">
            <div className="batch-summary">
              <div className="summary-item">
                <label>Material Code</label>
                <span>{selectedMaterialBatches.material.code}</span>
              </div>
              <div className="summary-item">
                <label>Total Stock</label>
                <span className="stock-value">
                  {selectedMaterialBatches.totalStock} {selectedMaterialBatches.unit}
                </span>
              </div>
              <div className="summary-item">
                <label>Batches</label>
                <span>{selectedMaterialBatches.batches.length}</span>
              </div>
            </div>

            <div className="batch-table-container">
              <table className="batch-table">
                <thead>
                  <tr>
                    <th>Batch Number</th>
                    <th className="text-right">Quantity</th>
                    <th className="text-right">Cost/Unit</th>
                    <th className="text-right">Total Value</th>
                    <th>Location</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMaterialBatches.batches.map((batch, index) => (
                    <tr key={batch.id || index} className={index % 2 === 0 ? 'even' : 'odd'}>
                      <td><code className="batch-code">{batch.batchNumber || 'N/A'}</code></td>
                      <td className="text-right">{parseFloat(batch.quantity || batch.currentStock || 0).toFixed(2)} {selectedMaterialBatches.unit}</td>
                      <td className="text-right">OMR {parseFloat(batch.averageCost || batch.lastPurchasePrice || 0).toFixed(3)}</td>
                      <td className="text-right">OMR {(parseFloat(batch.quantity || batch.currentStock || 0) * parseFloat(batch.averageCost || batch.lastPurchasePrice || 0)).toFixed(3)}</td>
                      <td className="location">{batch.location || 'Main Warehouse'}</td>
                      <td className="notes">{batch.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td>Total</td>
                    <td className="text-right">{selectedMaterialBatches.totalStock} {selectedMaterialBatches.unit}</td>
                    <td></td>
                    <td className="text-right">
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
              <div className="empty-state">
                <Layers size={48} />
                <p>No batch records found for this material.</p>
              </div>
            )}

            <div className="modal-footer">
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
          </div>
        </Modal>
      )}

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
            <div className="composite-info-banner">
              <AlertTriangle size={20} />
              <div>
                <strong>Composite Material</strong>
                <p>This material is composed of multiple components. Adjust each component's stock level below.</p>
              </div>
            </div>

            <div className="composite-summary">
              <div className="summary-item">
                <label>Composite Material</label>
                <span>{compositeAdjustData.compositeMaterial.name}</span>
              </div>
              <div className="summary-item">
                <label>Material Code</label>
                <span>{compositeAdjustData.compositeMaterial.code}</span>
              </div>
            </div>

            <div className="component-stocks">
              <h4>Component Stock Levels</h4>
              <table className="component-table">
                <thead>
                  <tr>
                    <th>Component</th>
                    <th>Type</th>
                    <th className="text-right">Current Stock</th>
                    <th className="text-right">New Stock</th>
                  </tr>
                </thead>
                <tbody>
                  {compositeAdjustData.components.map((comp, index) => (
                    <tr key={comp.componentId}>
                      <td>
                        <div className="component-info">
                          <span className="name">{comp.componentName}</span>
                          <span className="code">{comp.componentCode}</span>
                        </div>
                      </td>
                      <td>
                        <span className={`component-type-badge ${comp.componentType}`}>
                          {comp.componentType === 'container' ? 'Container' : 'Content'}
                        </span>
                      </td>
                      <td className="text-right muted">{comp.currentStock} {comp.unit}</td>
                      <td className="text-right">
                        <div className="stock-input">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={comp.newStock}
                            onChange={(e) => {
                              const newComponents = [...compositeAdjustData.components]
                              newComponents[index] = { ...newComponents[index], newStock: parseFloat(e.target.value) || 0 }
                              setCompositeAdjustData({ ...compositeAdjustData, components: newComponents })
                            }}
                          />
                          <span className="unit">{comp.unit}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="modal-footer">
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowCompositeAdjustModal(false)
                  setCompositeAdjustData(null)
                }}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleCompositeStockSave} disabled={loading}>
                {loading ? 'Saving...' : 'Save All Changes'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}

export default Inventory
