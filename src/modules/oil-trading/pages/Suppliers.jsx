/**
 * Oil Trading Suppliers Page
 *
 * Main page for managing oil trading suppliers.
 * Uses composition of hooks and components for clean separation of concerns.
 * Updated to use showToast and ConfirmDialog instead of native dialogs.
 *
 * Refactored from 1255-line monolith to ~260 lines.
 */

import React, { useState, useCallback } from 'react'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import DataTable from '../../../components/ui/DataTable'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import showToast from '../../../components/ui/Toast'
import SupplierLocationManager from '../../../components/suppliers/SupplierLocationManager'
import { useSuppliers } from '../hooks/useSuppliers'
import SupplierFormModal from '../components/suppliers/SupplierFormModal'
import SupplierDetailsModal from '../components/suppliers/SupplierDetailsModal'
import { getTableColumns } from './suppliersTableConfig'
import {
  Plus,
  User,
  Building,
  Package,
  Banknote,
  Users,
  MapPin,
  RefreshCw
} from 'lucide-react'

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => `OMR ${amount.toFixed(2)}`

/**
 * Oil Trading Suppliers Page Component
 */
const OilTradingSuppliers = () => {
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()

  // Supplier data and operations
  const {
    suppliers,
    supplierTypes,
    regions,
    specializations,
    loading,
    createSupplier,
    updateSupplier,
    deleteSupplier,
    generateNextCode,
    getSummaryStats,
    refreshSuppliers
  } = useSuppliers()

  // Refresh state
  const [isRefreshing, setIsRefreshing] = useState(false)

  // UI State
  const [activeTab, setActiveTab] = useState('suppliers')
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [saving, setSaving] = useState(false)

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, supplierId: null })

  // Event Handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await refreshSuppliers()
    setIsRefreshing(false)
  }, [refreshSuppliers])

  const handleAddSupplier = useCallback(() => {
    setSelectedSupplier(null)
    setShowAddModal(true)
  }, [])

  const handleViewSupplier = useCallback((supplier) => {
    setSelectedSupplier(supplier)
    setShowViewModal(true)
  }, [])

  const handleEditSupplier = useCallback((supplier) => {
    setSelectedSupplier(supplier)
    setShowEditModal(true)
  }, [])

  const handleDeleteSupplier = useCallback((supplierId) => {
    setConfirmDialog({ isOpen: true, supplierId })
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    const { supplierId } = confirmDialog
    setConfirmDialog({ isOpen: false, supplierId: null })

    const result = await deleteSupplier(supplierId)
    if (result.success) {
      showToast.success(t('supplierDeleted', 'Supplier deleted successfully'))
    } else {
      showToast.error(t('errorDeleting', 'Error deleting supplier'))
    }
  }, [confirmDialog, deleteSupplier, t])

  const handleSaveSupplier = useCallback(async (supplierData, isEdit) => {
    setSaving(true)
    try {
      const result = isEdit
        ? await updateSupplier(supplierData.id, supplierData)
        : await createSupplier(supplierData)

      if (result.success) {
        setShowAddModal(false)
        setShowEditModal(false)
        setSelectedSupplier(null)
        showToast.success(t(isEdit ? 'supplierUpdated' : 'supplierCreated',
          isEdit ? 'Supplier updated successfully!' : 'Supplier created successfully!'))
      } else {
        showToast.error(t('errorSaving', 'Error saving supplier'))
      }
    } finally {
      setSaving(false)
    }
  }, [createSupplier, updateSupplier, t])

  const handleEditFromView = useCallback(() => {
    setShowViewModal(false)
    setShowEditModal(true)
  }, [])

  const handleCreatePurchaseOrder = useCallback(() => {
    // Navigate to purchase order creation with supplier pre-selected
    showToast.info(t('purchaseOrderNotImplemented', 'Purchase Order creation not yet implemented'))
  }, [t])

  // Table columns
  const columns = getTableColumns({
    t,
    supplierTypes,
    onViewDetails: handleViewSupplier,
    onEdit: handleEditSupplier,
    onDelete: handleDeleteSupplier
  })

  // Summary stats
  const stats = getSummaryStats()

  return (
    <div className="flex flex-col min-h-full bg-gray-50">
      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Users size={16} />
          {t('suppliers', 'Suppliers')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          <MapPin size={16} />
          {t('supplierLocations', 'Supplier Locations')}
        </button>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          {/* Summary Cards */}
          <SummaryCards stats={stats} t={t} formatCurrency={formatCurrency} />

          {/* Suppliers Table */}
          <div className="suppliers-table-container">
            <DataTable
              data={suppliers}
              columns={columns}
              title={t('supplierManagement', 'Supplier Management')}
              subtitle={`${t('supplierSubtitle', 'Manage oil trading suppliers and collection partners')} - ${suppliers.length} ${t('suppliers', 'suppliers')}`}
              headerActions={
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-outline"
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title={t('refresh', 'Refresh')}
                  >
                    <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                  </button>
                  {hasPermission('MANAGE_SUPPLIERS') && (
                    <button className="btn btn-primary" onClick={handleAddSupplier}>
                      <Plus size={16} />
                      {t('addSupplier')}
                    </button>
                  )}
                </div>
              }
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              selectable={false}
              onRowClick={handleViewSupplier}
              emptyMessage={t('noSuppliersFound', 'No suppliers found')}
              className="suppliers-table"
              initialPageSize={10}
              stickyHeader={true}
              enableColumnToggle={true}
            />
          </div>
        </>
      )}

      {/* Supplier Locations Tab */}
      {activeTab === 'locations' && (
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <SupplierLocationManager />
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddModal && (
        <SupplierFormModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSave={handleSaveSupplier}
          supplier={null}
          supplierTypes={supplierTypes}
          regions={regions}
          specializations={specializations}
          nextCode={generateNextCode()}
          loading={saving}
          t={t}
        />
      )}

      {/* Edit Supplier Modal */}
      {showEditModal && selectedSupplier && (
        <SupplierFormModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false)
            setSelectedSupplier(null)
          }}
          onSave={handleSaveSupplier}
          supplier={selectedSupplier}
          supplierTypes={supplierTypes}
          regions={regions}
          specializations={specializations}
          nextCode=""
          loading={saving}
          t={t}
        />
      )}

      {/* View Supplier Modal */}
      {showViewModal && selectedSupplier && (
        <SupplierDetailsModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedSupplier(null)
          }}
          onEdit={handleEditFromView}
          onCreatePurchaseOrder={handleCreatePurchaseOrder}
          supplier={selectedSupplier}
          supplierTypes={supplierTypes}
          t={t}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, supplierId: null })}
        onConfirm={handleDeleteConfirm}
        title={t('confirmDelete', 'Confirm Delete')}
        message={t('confirmDeleteSupplier', 'Are you sure you want to delete this supplier?')}
        variant="danger"
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
        t={t}
      />
    </div>
  )
}

/**
 * Summary cards showing supplier statistics
 */
const SummaryCards = ({ stats, t, formatCurrency }) => (
  <div className="grid grid-cols-4 gap-4 mb-6 max-lg:grid-cols-2 max-md:grid-cols-1">
    <div className="summary-card">
      <div className="summary-icon">
        <User size={24} />
      </div>
      <div className="summary-info">
        <p className="summary-value">{stats.totalSuppliers}</p>
        <p className="summary-label">{t('totalSuppliers', 'Total Suppliers')}</p>
      </div>
    </div>

    <div className="summary-card">
      <div className="summary-icon !bg-emerald-500">
        <Building size={24} />
      </div>
      <div className="summary-info">
        <p className="summary-value">{stats.businessSuppliers}</p>
        <p className="summary-label">{t('businessSuppliers', 'Business Suppliers')}</p>
      </div>
    </div>

    <div className="summary-card">
      <div className="summary-icon !bg-blue-500">
        <Package size={24} />
      </div>
      <div className="summary-info">
        <p className="summary-value">{stats.monthlyVolume.toLocaleString()} L</p>
        <p className="summary-label">{t('monthlyVolume', 'Monthly Volume')}</p>
      </div>
    </div>

    <div className="summary-card">
      <div className="summary-icon !bg-amber-500">
        <Banknote size={24} />
      </div>
      <div className="summary-info">
        <p className="summary-value">{formatCurrency(stats.totalValue)}</p>
        <p className="summary-label">{t('totalValue', 'Total Value')}</p>
      </div>
    </div>
  </div>
)

export default OilTradingSuppliers
