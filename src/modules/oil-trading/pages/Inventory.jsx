/**
 * Inventory Page - Refactored
 * Uses extracted hooks for data, alerts, composition, and material CRUD
 *
 * Original: 1629 lines → Refactored: ~500 lines
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import useProjects from '../../../hooks/useProjects'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'

// UI Components
import DataTable from '../../../components/ui/DataTable'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import InventoryCharts from '../../../components/InventoryCharts'
import MaterialFormModal from '../../../components/MaterialFormModal'
import StockReportModal from '../../../components/StockReportModal'
import StockAdjustmentModal from '../../../components/StockAdjustmentModal'
import TimelineView from '../components/TimelineView'

// Extracted Components
import AlertDropdown from '../components/AlertDropdown'
import StockHistoryModal from '../components/StockHistoryModal'
import BatchDetailsModal from '../components/BatchDetailsModal'
import CompositeAdjustModal from '../components/CompositeAdjustModal'

// Custom Hooks
import {
  useInventoryData,
  useStockAlerts,
  useMaterialComposition,
  useMaterialMaster
} from '../hooks'

// Table Configurations
import {
  getStockOverviewColumns,
  prepareStockOverviewData,
  getMaterialMasterColumns,
  prepareMaterialMasterData,
  getStockMovementsColumns,
  prepareStockMovementsData,
  transformMovementForDisplay
} from '../config'

// Services
import inventoryService from '../../../services/inventoryService'
import transactionService from '../../../services/transactionService'

// Icons
import { Package, Plus, TrendingUp, Droplets, Clock, Banknote, BarChart3 } from 'lucide-react'

// Styles
import '../styles/Inventory.css'

const Inventory = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate } = useSystemSettings()
  const { selectedProjectId } = useProjects()
  const [searchParams] = useSearchParams()
  const urlSearchTerm = searchParams.get('search') || ''

  // =============================================
  // LOCAL UI STATE
  // =============================================
  const [activeTab, setActiveTab] = useState('stock')
  const [showCharts, setShowCharts] = useState(false)
  const [showPurchaseForm, setShowPurchaseForm] = useState(false)
  const [showStockReport, setShowStockReport] = useState(false)
  const [showStockAdjustment, setShowStockAdjustment] = useState(false)
  const [adjustmentMaterialId, setAdjustmentMaterialId] = useState('')
  const [expandedRows, setExpandedRows] = useState(new Set())
  const [message, setMessage] = useState(null)

  // Stock history modal state
  const [showStockHistory, setShowStockHistory] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [materialMovements, setMaterialMovements] = useState([])
  const [loadingMaterialMovements, setLoadingMaterialMovements] = useState(false)

  // Batch modal state
  const [showBatchModal, setShowBatchModal] = useState(false)
  const [selectedMaterialBatches, setSelectedMaterialBatches] = useState(null)

  // Stock movements for transactions tab
  const [stockMovements, setStockMovements] = useState([])
  const [loadingMovements, setLoadingMovements] = useState(false)

  // =============================================
  // CUSTOM HOOKS
  // =============================================
  const {
    loading,
    inventory,
    materials,
    branches,
    vendors,
    materialCompositions,
    filteredMaterials,
    refresh: refreshInventory
  } = useInventoryData({ projectId: selectedProjectId, companyId: selectedCompany?.id })

  const {
    alerts,
    criticalAlerts,
    showAlertDropdown,
    getStockStatus,
    toggleAlertDropdown,
    closeAlertDropdown
  } = useStockAlerts({ inventory, materials, materialCompositions })

  const {
    showCompositeAdjustModal,
    compositeAdjustData,
    saving: savingComposite,
    openCompositeAdjustment,
    updateComponentStock,
    saveCompositeAdjustment,
    closeModal: closeCompositeModal
  } = useMaterialComposition({
    inventory,
    materialCompositions,
    onSuccess: refreshInventory
  })

  const {
    showMaterialForm,
    editingMaterial,
    materialCategories,
    loading: materialLoading,
    handleAddMaterial,
    handleEditMaterial,
    handleSaveMaterial,
    closeForm: closeMaterialForm
  } = useMaterialMaster({ onRefresh: refreshInventory })

  // =============================================
  // EFFECTS
  // =============================================

  // Load stock movements when transactions tab is activated
  useEffect(() => {
    if (activeTab === 'transactions') {
      loadStockMovements()
    }
  }, [activeTab])

  // Close alert dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showAlertDropdown && !e.target.closest('.alert-dropdown-container')) {
        closeAlertDropdown()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showAlertDropdown, closeAlertDropdown])

  // =============================================
  // HANDLERS
  // =============================================

  const loadStockMovements = async () => {
    try {
      setLoadingMovements(true)
      const movements = await transactionService.getStockMovements({ limit: 100 })
      setStockMovements(movements)
    } catch (error) {
      setStockMovements([])
    } finally {
      setLoadingMovements(false)
    }
  }

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0
    return `OMR ${numAmount.toFixed(3)}`
  }

  const toggleExpandRow = useCallback((materialId) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(materialId)) {
        newSet.delete(materialId)
      } else {
        newSet.add(materialId)
      }
      return newSet
    })
  }, [])

  const showMessage = useCallback((type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }, [])

  const handleCreatePurchaseOrder = () => {
    setShowPurchaseForm(true)
  }

  const handleViewBatches = useCallback((material) => {
    const materialId = Number(material.id)
    const materialInventory = inventory[materialId]

    if (materialInventory?.batches) {
      setSelectedMaterialBatches({
        material,
        batches: materialInventory.batches,
        totalStock: materialInventory.currentStock,
        unit: materialInventory.unit || material.unit
      })
      setShowBatchModal(true)
    } else {
      showMessage('info', 'No batch data available for this material')
    }
  }, [inventory, showMessage])

  const handleViewHistory = useCallback(async (material) => {
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
        const transformed = response.data.movements.map(m => transformMovementForDisplay(m, material))
        setMaterialMovements(transformed)
      } else {
        setMaterialMovements([])
      }
    } catch (error) {
      setMaterialMovements([])
    } finally {
      setLoadingMaterialMovements(false)
    }
  }, [])

  const handleAdjustStock = useCallback(async (material) => {
    if (material.is_composite) {
      const opened = openCompositeAdjustment(material)
      if (!opened) {
        showMessage('warning', 'No component information available for this composite material')
      }
      return
    }

    // For non-composite: use the stock adjustment modal
    setAdjustmentMaterialId(material.id)
    setShowStockAdjustment(true)
  }, [openCompositeAdjustment, showMessage])

  const handleCompositeStockSave = async () => {
    const result = await saveCompositeAdjustment()
    if (result.success) {
      showMessage('success', `Updated ${result.successCount} component(s) successfully`)
    } else if (result.errorCount > 0) {
      showMessage('warning', `Updated ${result.successCount}, failed ${result.errorCount} component(s)`)
    }
  }

  // =============================================
  // COMPUTED VALUES
  // =============================================
  const totalMaterials = materials.filter(m => !m.is_composite).length
  const totalInventoryValue = Object.entries(inventory).reduce((sum, [id, stock]) => {
    const material = materials.find(m => Number(m.id) === Number(id))
    if (material?.is_composite) return sum
    return sum + (stock.currentStock * (material?.standardPrice || 0))
  }, 0)

  // =============================================
  // TABLE COLUMNS (using extracted configs)
  // =============================================
  const stockOverviewColumns = getStockOverviewColumns({
    t,
    expandedRows,
    materialCompositions,
    branches,
    toggleExpandRow,
    formatCurrency,
    handleViewBatches,
    handleAdjustStock,
    handleViewHistory
  })

  const materialMasterColumns = getMaterialMasterColumns({
    t,
    expandedRows,
    materialCompositions,
    toggleExpandRow,
    formatCurrency,
    handleEditMaterial,
    handleViewHistory
  })

  const stockMovementsColumns = getStockMovementsColumns({
    t,
    formatDate,
    branches
  })

  // =============================================
  // HEADER ACTIONS
  // =============================================
  const stockOverviewHeaderActions = (
    <div className="inventory-toolbar">
      <AlertDropdown
        alerts={alerts}
        criticalAlerts={criticalAlerts}
        isOpen={showAlertDropdown}
        onToggle={toggleAlertDropdown}
        onClose={closeAlertDropdown}
        onCreatePurchaseOrder={handleCreatePurchaseOrder}
      />

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

      <button className="btn btn-outline" onClick={() => setShowCharts(!showCharts)}>
        <BarChart3 size={16} />
        {showCharts ? 'Hide Charts' : 'Charts'}
      </button>
      <button className="btn btn-outline" onClick={() => setShowStockReport(true)}>
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

  // =============================================
  // RENDER
  // =============================================
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

      {/* Stock Overview Tab */}
      {activeTab === 'stock' && (
        <DataTable
          data={prepareStockOverviewData({
            materials: filteredMaterials,
            inventory,
            expandedRows,
            materialCompositions,
            getStockStatus
          })}
          columns={stockOverviewColumns}
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
          initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* Transactions Timeline Tab */}
      {activeTab === 'movements' && (
        <div className="movements-timeline-view data-table-container">
          <div className="data-table-header">
            <h2 className="data-table-title">{t('transactions', 'Transactions')}</h2>
            <p className="data-table-subtitle">{t('transactionsSubtitle', 'View and filter all inventory transactions')}</p>
          </div>
          <TimelineView />
        </div>
      )}

      {/* Material Master Tab */}
      {activeTab === 'master' && (
        <DataTable
          data={prepareMaterialMasterData({
            materials: filteredMaterials,
            expandedRows,
            materialCompositions
          })}
          columns={materialMasterColumns}
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
          initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* Stock Movements Tab */}
      {activeTab === 'transactions' && (
        <DataTable
          data={prepareStockMovementsData({ stockMovements, materials })}
          columns={stockMovementsColumns}
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
          initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* =============================================
          MODALS
          ============================================= */}

      {/* Purchase Order Form */}
      {showPurchaseForm && (
        <PurchaseOrderForm
          isOpen={showPurchaseForm}
          onClose={() => setShowPurchaseForm(false)}
          onSave={() => {
            setShowPurchaseForm(false)
            showMessage('success', 'Purchase order created successfully!')
          }}
          vendors={vendors}
          materials={materials}
          title="Create Purchase Order"
        />
      )}

      {/* Stock History Modal */}
      <StockHistoryModal
        isOpen={showStockHistory}
        onClose={() => setShowStockHistory(false)}
        material={selectedMaterial}
        movements={materialMovements}
        loading={loadingMaterialMovements}
        currentStock={selectedMaterial ? (inventory[Number(selectedMaterial.id)]?.currentStock || 0) : 0}
        stockStatus={selectedMaterial ? getStockStatus(selectedMaterial.id) : 'good'}
        onAdjustStock={handleAdjustStock}
        t={t}
        formatDate={formatDate}
      />

      {/* Batch Details Modal */}
      <BatchDetailsModal
        isOpen={showBatchModal}
        onClose={() => {
          setShowBatchModal(false)
          setSelectedMaterialBatches(null)
        }}
        batchData={selectedMaterialBatches}
      />

      {/* Composite Adjust Modal */}
      <CompositeAdjustModal
        isOpen={showCompositeAdjustModal}
        onClose={closeCompositeModal}
        adjustData={compositeAdjustData}
        onUpdateStock={updateComponentStock}
        onSave={handleCompositeStockSave}
        saving={savingComposite}
      />

      {/* Stock Report Modal */}
      <StockReportModal
        isOpen={showStockReport}
        onClose={() => setShowStockReport(false)}
        inventory={inventory}
        materials={materials}
        t={t}
        formatCurrency={formatCurrency}
      />

      {/* Stock Adjustment Modal */}
      <StockAdjustmentModal
        isOpen={showStockAdjustment}
        onClose={() => setShowStockAdjustment(false)}
        materials={materials}
        inventory={inventory}
        preselectedMaterialId={adjustmentMaterialId}
        onSuccess={refreshInventory}
      />

      {/* Material Form Modal */}
      <MaterialFormModal
        isOpen={showMaterialForm}
        onClose={closeMaterialForm}
        onSave={handleSaveMaterial}
        editingMaterial={editingMaterial}
        categories={materialCategories}
        allMaterials={materials}
      />
    </div>
  )
}

export default Inventory
