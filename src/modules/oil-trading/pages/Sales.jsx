/**
 * Oil Trading Sales Page
 *
 * Main page for managing sales orders and invoices.
 * Uses composition of hooks and components for clean separation of concerns.
 *
 * Refactored from 704-line monolith to ~350 lines.
 * Updated to use showToast and ConfirmDialog instead of native dialogs.
 *
 * @module pages/Sales
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import useProjects from '../../../hooks/useProjects'
import DataTable from '../../../components/ui/DataTable'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AlertDialog from '../../../components/ui/AlertDialog'
import showToast from '../../../components/ui/Toast'
import SalesOrderForm from '../components/SalesOrderForm'
import SalesOrderViewModal from '../../../components/SalesOrderViewModal'
import SalesSummaryCards from '../components/SalesSummaryCards'
import { useSalesOrders } from '../hooks'
import salesOrderService from '../../../services/salesOrderService'
import { getSalesOrderColumns, STATUS_LABELS } from './salesOrdersTableConfig'
import { getInvoiceColumns, filterOrdersWithInvoices } from './invoicesTableConfig'
import { Plus, ClipboardList, Receipt, AlertTriangle, RefreshCw } from 'lucide-react'

/**
 * Sales Page Component
 */
const Sales = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate } = useSystemSettings()
  const { selectedProjectId, getProjectQueryParam } = useProjects()
  const [searchParams] = useSearchParams()

  // URL search param (from dashboard task links)
  const urlSearchTerm = searchParams.get('search') || ''

  // Use the useSalesOrders hook for data management
  const {
    orders: salesOrders,
    todaysSummary,
    loading,
    error,
    refresh: loadSalesData,
    loadOrder,
    updateStatus: hookUpdateStatus,
    deleteOrder: hookDeleteOrder,
    generateInvoice: hookGenerateInvoice
  } = useSalesOrders({
    projectId: selectedProjectId,
    getProjectQueryParam
  })

  // UI state
  const [activeTab, setActiveTab] = useState('orders')
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Modal state
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)

  // Dialog state
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, order: null, action: null, newStatus: null })
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', variant: 'error' })

  // Check for pre-selected customer from customer module on mount
  useEffect(() => {
    const storedCustomer = sessionStorage.getItem('selectedCustomerForOrder')
    if (storedCustomer) {
      try {
        const customer = JSON.parse(storedCustomer)
        setSelectedCustomer(customer)
        setShowOrderForm(true)
        sessionStorage.removeItem('selectedCustomerForOrder')
      } catch {
        sessionStorage.removeItem('selectedCustomerForOrder')
      }
    }
  }, [])

  // Event handlers
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    await loadSalesData()
    setIsRefreshing(false)
    showToast.success(t('dataRefreshed', 'Data refreshed'))
  }, [loadSalesData, t])

  const handleCreateOrder = useCallback((customer = null) => {
    setSelectedCustomer(customer)
    setEditingOrder(null)
    setShowOrderForm(true)
  }, [])

  const handleViewOrder = useCallback(async (order) => {
    try {
      const result = await loadOrder(order.id)
      setViewingOrder(result.success && result.data ? result.data : order)
    } catch {
      setViewingOrder(order)
    }
  }, [loadOrder])

  const handleEditOrder = useCallback(async (order) => {
    try {
      const result = await loadOrder(order.id)

      if (result.success && result.data) {
        setEditingOrder(result.data)
        setSelectedCustomer({ id: result.data.customerId, name: result.data.customerName })
      } else {
        setEditingOrder(order)
        setSelectedCustomer({ id: order.customerId, name: order.customerName })
      }
      setShowOrderForm(true)
    } catch {
      setEditingOrder(order)
      setSelectedCustomer({ id: order.customerId, name: order.customerName })
      setShowOrderForm(true)
    }
  }, [loadOrder])

  const handleSaveOrder = useCallback(async (orderData) => {
    try {
      const result = editingOrder
        ? await salesOrderService.update(editingOrder.id, orderData)
        : await salesOrderService.create(orderData)

      if (!result.success) {
        throw new Error(result.error || `Failed to ${editingOrder ? 'update' : 'create'} sales order`)
      }

      await loadSalesData()
      setSelectedCustomer(null)
      setShowOrderForm(false)
      setEditingOrder(null)

      const totalAmount = parseFloat(result.data.totalAmount) || 0
      const action = editingOrder ? t('updated', 'updated') : t('created', 'created')
      showToast.success(
        `${t('salesOrder', 'Sales order')} ${action}!\n${t('orderNumber', 'Order Number')}: ${result.data.orderNumber}\n${t('total', 'Total')}: OMR ${totalAmount.toFixed(2)}`,
        t('success', 'Success')
      )
    } catch (err) {
      showToast.error(err.message, t('error', 'Error'))
    }
  }, [editingOrder, loadSalesData, t])

  const handleStatusChange = useCallback(async (order, newStatus) => {
    if (order.status === 'delivered' && order.invoiceNumber && newStatus !== 'delivered') {
      setAlertDialog({
        isOpen: true,
        title: t('cannotChangeStatus', 'Cannot Change Status'),
        message: t('cannotChangeDeliveredOrderStatus', 'Cannot change status of a delivered order with an invoice.'),
        variant: 'warning'
      })
      return
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      order,
      action: 'status',
      newStatus
    })
  }, [t])

  const handleStatusChangeConfirm = useCallback(async () => {
    const { order, newStatus } = confirmDialog
    setConfirmDialog({ isOpen: false, order: null, action: null, newStatus: null })

    try {
      const result = await hookUpdateStatus(order.id, newStatus)

      if (result.success) {
        showToast.success(t('statusUpdated', 'Status updated successfully'))
      } else {
        throw new Error(result.error || 'Failed to update status')
      }
    } catch (err) {
      showToast.error(err.message, t('error', 'Error'))
    }
  }, [confirmDialog, hookUpdateStatus, t])

  const handleDeleteOrder = useCallback(async (order) => {
    const deletableStatuses = ['draft', 'cancelled']
    if (!deletableStatuses.includes(order.status)) {
      setAlertDialog({
        isOpen: true,
        title: t('cannotDelete', 'Cannot Delete'),
        message: t('cannotDeleteOrderWithStatus', `Cannot delete order with status "${order.status}". Only Draft and Cancelled orders can be deleted.`),
        variant: 'error'
      })
      return
    }

    // Show confirmation dialog
    setConfirmDialog({
      isOpen: true,
      order,
      action: 'delete',
      newStatus: null
    })
  }, [t])

  const handleDeleteConfirm = useCallback(async () => {
    const { order } = confirmDialog
    setConfirmDialog({ isOpen: false, order: null, action: null, newStatus: null })

    try {
      const result = await hookDeleteOrder(order.id)

      if (result.success) {
        showToast.success(`${t('order', 'Order')} ${order.orderNumber} ${t('deletedSuccessfully', 'deleted successfully')}`)
      } else {
        throw new Error(result.error || 'Failed to delete order')
      }
    } catch (err) {
      showToast.error(err.message, t('error', 'Error'))
    }
  }, [confirmDialog, hookDeleteOrder, t])

  const handleGenerateInvoice = useCallback(async (order) => {
    try {
      const result = await hookGenerateInvoice(order.id)

      if (result.success) {
        showToast.success(
          `${t('invoice', 'Invoice')} ${result.data.invoiceNumber} ${t('generatedFor', 'generated for')} ${t('order', 'order')} ${order.orderNumber}!`,
          t('success', 'Success')
        )
      } else {
        throw new Error(result.error || 'Failed to generate invoice')
      }
    } catch (err) {
      showToast.error(err.message, t('error', 'Error'))
    }
  }, [hookGenerateInvoice, t])

  const handleDownloadInvoice = useCallback((invoice) => {
    showToast.info(t('downloadComingSoon', 'Download invoice functionality coming soon'))
  }, [t])

  const handleCloseForm = useCallback(() => {
    setEditingOrder(null)
    setSelectedCustomer(null)
    setShowOrderForm(false)
  }, [])

  // Handle confirm dialog action
  const handleConfirmAction = useCallback(() => {
    if (confirmDialog.action === 'status') {
      handleStatusChangeConfirm()
    } else if (confirmDialog.action === 'delete') {
      handleDeleteConfirm()
    }
  }, [confirmDialog.action, handleStatusChangeConfirm, handleDeleteConfirm])

  // Get confirm dialog content
  const getConfirmDialogContent = () => {
    const { order, action, newStatus } = confirmDialog

    if (action === 'status') {
      return {
        title: t('confirmStatusChange', 'Confirm Status Change'),
        message: `${t('changeOrderStatus', 'Change order')} ${order?.orderNumber} ${t('statusFrom', 'status from')} "${STATUS_LABELS[order?.status]}" ${t('to', 'to')} "${STATUS_LABELS[newStatus]}"?`,
        variant: 'warning',
        confirmText: t('changeStatus', 'Change Status')
      }
    }

    if (action === 'delete') {
      return {
        title: t('confirmDelete', 'Confirm Delete'),
        message: `${t('deleteOrder', 'Delete order')} ${order?.orderNumber}?\n\n${t('actionCannotBeUndone', 'This action cannot be undone.')}`,
        variant: 'danger',
        confirmText: t('delete', 'Delete')
      }
    }

    return { title: '', message: '', variant: 'default', confirmText: t('confirm', 'Confirm') }
  }

  const dialogContent = getConfirmDialogContent()

  // Table columns
  const salesOrderColumns = getSalesOrderColumns({
    t,
    formatDate,
    onView: handleViewOrder,
    onEdit: handleEditOrder,
    onStatusChange: handleStatusChange,
    onDelete: handleDeleteOrder,
    onGenerateInvoice: handleGenerateInvoice
  })

  const invoiceColumns = getInvoiceColumns({
    t,
    formatDate,
    onView: handleViewOrder,
    onDownload: handleDownloadInvoice
  })

  return (
    <div className="p-0">
      {/* Error Banner */}
      {error && (
        <div className="error-banner">
          <AlertTriangle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
          onClick={() => setActiveTab('orders')}
          data-tour="sales-orders-tab"
        >
          <ClipboardList size={16} />
          {t('salesOrders', 'Sales Orders')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
          onClick={() => setActiveTab('invoices')}
        >
          <Receipt size={16} />
          {t('invoices', 'Invoices')}
        </button>
      </div>

      {/* Summary Cards */}
      <SalesSummaryCards summary={todaysSummary} t={t} />

      {/* Sales Orders Tab */}
      {activeTab === 'orders' && (
        <DataTable
          data={salesOrders}
          columns={salesOrderColumns}
          title={t('salesOrders', 'Sales Orders')}
          subtitle={`${t('salesOrdersSubtitle', 'Manage and track all sales orders')} - ${salesOrders.length} ${t('orders', 'orders')}`}
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
              <button
                className="btn btn-primary"
                onClick={() => handleCreateOrder()}
                data-tour="new-sales-order-button"
              >
                <Plus size={16} />
                {t('newSaleOrder', 'New Sale Order')}
              </button>
            </div>
          }
          loading={loading}
          searchable
          filterable
          sortable
          paginated
          exportable
          selectable={false}
          emptyMessage={t('noOrdersFound', 'No orders found')}
          className="sales-orders-table"
          initialPageSize={10}
          initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <DataTable
          data={filterOrdersWithInvoices(salesOrders)}
          columns={invoiceColumns}
          title={t('invoices', 'Invoices')}
          subtitle={t('invoicesSubtitle', 'Generated sales invoices')}
          headerActions={
            <button
              className="btn btn-outline"
              onClick={handleRefresh}
              disabled={isRefreshing}
              title={t('refresh', 'Refresh')}
            >
              <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            </button>
          }
          loading={loading}
          searchable
          filterable
          sortable
          paginated
          exportable
          selectable={false}
          emptyMessage={t('noInvoicesYet', 'No invoices generated yet. Generate invoices from confirmed sales orders.')}
          className="invoices-table"
          initialPageSize={10}
          initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* Sales Order Form Modal */}
      <SalesOrderForm
        isOpen={showOrderForm}
        onClose={handleCloseForm}
        onSave={handleSaveOrder}
        selectedCustomer={selectedCustomer}
        editingOrder={editingOrder}
      />

      {/* View Sales Order Modal */}
      <SalesOrderViewModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        orderData={viewingOrder}
        onEdit={handleEditOrder}
        t={t}
      />

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, order: null, action: null, newStatus: null })}
        onConfirm={handleConfirmAction}
        title={dialogContent.title}
        message={dialogContent.message}
        variant={dialogContent.variant}
        confirmText={dialogContent.confirmText}
        cancelText={t('cancel', 'Cancel')}
        t={t}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', variant: 'error' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        t={t}
      />
    </div>
  )
}

export default Sales
