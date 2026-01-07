import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import DataTable from '../../../components/ui/DataTable'
import DatePicker from '../../../components/ui/DatePicker'
import SalesOrderForm from '../components/SalesOrderForm'
import SalesOrderViewModal from '../../../components/SalesOrderViewModal'
import salesOrderService from '../../../services/salesOrderService'
import customerService from '../../../services/customerService'
import { Eye, Edit, FileText, Banknote, Calendar, User, AlertTriangle, CheckCircle, Truck, XCircle, Clock, Trash2, Plus, Download, ClipboardList, Receipt } from 'lucide-react'
import '../styles/Sales.css'

const Sales = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate, toAPIDateFormat } = useSystemSettings()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' or 'invoices'
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [salesOrders, setSalesOrders] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [todaysSummary, setTodaysSummary] = useState({ totalSales: 0, totalOrders: 0, pendingOrders: 0 })
  const [error, setError] = useState(null)
  const [filterFromDate, setFilterFromDate] = useState(null)
  const [filterToDate, setFilterToDate] = useState(null)

  // Load sales orders and summary data from backend
  const loadSalesData = async () => {
    try {
      setError(null)
      
      // Load sales orders
      const ordersResult = await salesOrderService.getAll()
      if (ordersResult.success) {
        setSalesOrders(ordersResult.data || [])
      } else {
        throw new Error(ordersResult.error || 'Failed to load sales orders')
      }
      
      // Load today's summary
      const summaryResult = await salesOrderService.getTodaysSummary()
      if (summaryResult.success && summaryResult.data) {
        setTodaysSummary({
          totalSales: summaryResult.data.totalSales || 0,
          totalOrders: summaryResult.data.totalOrders || 0,
          pendingOrders: summaryResult.data.pendingOrders || 0
        })
      }
      
    } catch (error) {
      console.error('Error loading sales data:', error)
      setError(error.message)
      // Fallback to empty data on error
      setSalesOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Load sales orders from backend
    loadSalesData()
    
    // Check for pre-selected customer from customer module
    const storedCustomer = sessionStorage.getItem('selectedCustomerForOrder')
    if (storedCustomer) {
      try {
        const customer = JSON.parse(storedCustomer)
        setSelectedCustomer(customer)
        setShowOrderForm(true)
        // Clear the stored customer after using it
        sessionStorage.removeItem('selectedCustomerForOrder')
      } catch (error) {
        sessionStorage.removeItem('selectedCustomerForOrder')
      }
    }
  }, [])

  const handleCreateOrder = (selectedCustomer = null) => {
    setSelectedCustomer(selectedCustomer)
    setShowOrderForm(true)
  }

  const handleSaveOrder = async (orderData) => {
    try {
      setLoading(true)

      let result

      // Check if editing existing order or creating new one
      if (editingOrder) {
        result = await salesOrderService.update(editingOrder.id, orderData)

        if (!result.success) {
          throw new Error(result.error || 'Failed to update sales order')
        }
      } else {
        result = await salesOrderService.create(orderData)

        if (!result.success) {
          throw new Error(result.error || 'Failed to create sales order')
        }
      }

      // Refresh the sales orders list
      await loadSalesData()

      // Reset form state
      setSelectedCustomer(null)
      setShowOrderForm(false)
      setEditingOrder(null)

      // Show success message
      const totalAmount = parseFloat(result.data.totalAmount) || 0
      const action = editingOrder ? 'updated' : 'created'
      alert(`✅ Sales order ${action} successfully!\n\nOrder Number: ${result.data.orderNumber}\nTotal: OMR ${totalAmount.toFixed(2)}`)

    } catch (error) {
      console.error('Error saving sales order:', error)
      setError(error.message)
      const action = editingOrder ? 'update' : 'create'
      alert(`❌ Failed to ${action} sales order:\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSalesOrder = async (order) => {
    try {
      setLoading(true)
      // Fetch full order details including items
      const result = await salesOrderService.getById(order.id)

      if (result.success && result.data) {
        setViewingOrder(result.data)
      } else {
        // Fallback to basic order if fetch fails
        console.warn('Failed to fetch full order details, showing basic data')
        setViewingOrder(order)
      }
    } catch (error) {
      console.error('Error fetching order details:', error)
      // Fallback to basic order on error
      setViewingOrder(order)
    } finally {
      setLoading(false)
    }
  }

  const handleEditSalesOrder = async (order) => {
    try {
      setLoading(true)
      // Fetch full order details including items
      const result = await salesOrderService.getById(order.id)

      if (result.success && result.data) {
        setEditingOrder(result.data)
        setSelectedCustomer({ id: result.data.customerId, name: result.data.customerName })
      } else {
        // Fallback to basic order if fetch fails
        console.warn('Failed to fetch full order details for edit, using basic data')
        setEditingOrder(order)
        setSelectedCustomer({ id: order.customerId, name: order.customerName })
      }
      setShowOrderForm(true)
    } catch (error) {
      console.error('Error fetching order details for edit:', error)
      // Fallback to basic order on error
      setEditingOrder(order)
      setSelectedCustomer({ id: order.customerId, name: order.customerName })
      setShowOrderForm(true)
    } finally {
      setLoading(false)
    }
  }

  const handleGenerateInvoice = async (order) => {
    try {
      setLoading(true)
      const result = await salesOrderService.generateInvoice(order.id)

      if (result.success) {
        alert(`🧾 Invoice generated successfully for order: ${order.orderNumber}\n\nInvoice Number: ${result.data.invoiceNumber}`)
        // Refresh sales orders to show updated invoice number
        await loadSalesData()
      } else {
        throw new Error(result.error || 'Failed to generate invoice')
      }
    } catch (error) {
      console.error('Error generating invoice:', error)
      alert(`❌ Failed to generate invoice:\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Quick status change handler
  const handleQuickStatusChange = async (order, newStatus) => {
    // Prevent changing from delivered if it has an invoice
    if (order.status === 'delivered' && order.invoiceNumber && newStatus !== 'delivered') {
      alert('Cannot change status of a delivered order with an invoice.')
      return
    }

    // Confirm status change
    const statusLabels = {
      draft: 'Draft',
      confirmed: 'Confirmed',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    }

    const confirmMessage = `Change order ${order.orderNumber} status from "${statusLabels[order.status]}" to "${statusLabels[newStatus]}"?`
    if (!window.confirm(confirmMessage)) return

    try {
      setLoading(true)
      const result = await salesOrderService.updateStatus(order.id, newStatus)

      if (result.success) {
        // Refresh the data to show updated status
        await loadSalesData()
      } else {
        throw new Error(result.error || 'Failed to update status')
      }
    } catch (error) {
      console.error('Error updating status:', error)
      alert(`❌ Failed to update status:\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Get next possible status transitions for an order
  const getNextStatuses = (currentStatus) => {
    const transitions = {
      draft: ['confirmed', 'cancelled'],
      confirmed: ['delivered', 'cancelled'],
      delivered: ['cancelled'],
      cancelled: []
    }
    return transitions[currentStatus] || []
  }

  // Delete order handler with validation
  const handleDeleteOrder = async (order) => {
    // Check if order can be deleted based on status
    const deletableStatuses = ['draft', 'cancelled']

    if (!deletableStatuses.includes(order.status)) {
      alert(`❌ Cannot delete order with status "${order.status}".\n\nOnly Draft and Cancelled orders can be deleted.`)
      return
    }

    // Confirm deletion
    const confirmMessage = `Are you sure you want to delete order ${order.orderNumber}?\n\nThis action cannot be undone.`
    if (!window.confirm(confirmMessage)) return

    try {
      setLoading(true)
      const result = await salesOrderService.delete(order.id)

      if (result.success) {
        // Refresh the data to show updated list
        await loadSalesData()
        alert(`✅ Order ${order.orderNumber} deleted successfully.`)
      } else {
        throw new Error(result.error || 'Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
      alert(`❌ Failed to delete order:\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Check if order can be deleted
  const canDeleteOrder = (order) => {
    return ['draft', 'cancelled'].includes(order.status)
  }

  // Define table columns for sales orders
  const salesOrderColumns = [
    {
      key: 'orderNumber',
      header: t('orderNumber'),
      sortable: true,
      render: (value, row) => (
        <div className="order-id">
          <strong>{value || row.orderNumber || row.id}</strong>
        </div>
      )
    },
    {
      key: 'customer',
      header: t('customer'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="customer-info">
          <User size={14} />
          <span>{value || row.customerName}</span>
        </div>
      )
    },
    {
      key: 'date',
      header: t('date'),
      type: 'date',
      sortable: true,
      render: (value) => {
        if (!value) return '-'
        return formatDate ? formatDate(value) : new Date(value).toLocaleDateString()
      }
    },
    {
      key: 'itemCount',
      header: t('items'),
      sortable: true,
      render: (value, row) => {
        const count = parseInt(value) || 0
        return (
          <div className="items-count-badge">
            <span className="count-number">{count}</span>
            <span className="count-label">{count === 1 ? t('item') || 'item' : t('items')}</span>
          </div>
        )
      }
    },
    {
      key: 'total',
      header: t('total'),
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (value, row) => {
        const total = parseFloat(value || row.totalAmount) || 0
        return `OMR ${total.toFixed(2)}`
      }
    },
    {
      key: 'invoiceNumber',
      header: t('invoice'),
      sortable: true,
      render: (value, row) => {
        if (value || row.invoiceNumber) {
          return (
            <div className="invoice-info">
              <FileText size={14} />
              <span>{value || row.invoiceNumber}</span>
            </div>
          )
        }
        return <span className="text-muted">-</span>
      }
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`status-badge ${value}`}>
          {value.charAt(0).toUpperCase() + value.slice(1)}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      width: '220px',
      render: (value, row) => {
        const nextStatuses = getNextStatuses(row.status)
        return (
          <div className="cell-actions">
            <button
              className="btn btn-outline btn-sm"
              title={t('view')}
              onClick={() => handleViewSalesOrder(row)}
            >
              <Eye size={14} />
            </button>
            <button
              className="btn btn-outline btn-sm"
              title={t('edit')}
              onClick={() => handleEditSalesOrder(row)}
            >
              <Edit size={14} />
            </button>
            {/* Quick Status Actions */}
            {row.status === 'draft' && (
              <button
                className="btn btn-primary btn-sm"
                title={t('confirm') || 'Confirm'}
                onClick={() => handleQuickStatusChange(row, 'confirmed')}
              >
                <CheckCircle size={14} />
              </button>
            )}
            {row.status === 'confirmed' && (
              <button
                className="btn btn-success btn-sm"
                title={t('markDelivered') || 'Mark Delivered'}
                onClick={() => handleQuickStatusChange(row, 'delivered')}
              >
                <Truck size={14} />
              </button>
            )}
            {nextStatuses.includes('cancelled') && !row.invoiceNumber && (
              <button
                className="btn btn-danger btn-sm"
                title={t('cancel') || 'Cancel'}
                onClick={() => handleQuickStatusChange(row, 'cancelled')}
              >
                <XCircle size={14} />
              </button>
            )}
            {/* Delete Button - Only for draft/cancelled orders */}
            {canDeleteOrder(row) && (
              <button
                className="btn btn-outline btn-danger btn-sm"
                title={t('delete') || 'Delete'}
                onClick={() => handleDeleteOrder(row)}
              >
                <Trash2 size={14} />
              </button>
            )}
            {/* Invoice Actions */}
            {(row.status === 'confirmed' || row.status === 'delivered') && (
              row.invoiceNumber ? (
                <button
                  className="btn btn-outline btn-success btn-sm"
                  title={`Invoice: ${row.invoiceNumber}`}
                >
                  <FileText size={14} />
                </button>
              ) : (
                <button
                  className="btn btn-outline btn-sm"
                  title={t('generateInvoice')}
                  onClick={() => handleGenerateInvoice(row)}
                >
                  <FileText size={14} />
                </button>
              )
            )}
          </div>
        )
      }
    }
  ]

  // Remove early return - let DataTable handle loading state with skeleton

  return (
    <div className="sales-page">
      {/* Error Display */}
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

      {/* Sales Summary Cards */}
      <div className="sales-summary">
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-icon success">
              <Banknote size={24} />
            </div>
            <div className="summary-info">
              <p className="summary-value">OMR {(parseFloat(todaysSummary.totalSales) || 0).toFixed(2)}</p>
              <p className="summary-label">{t('totalSalesToday', 'Total Sales (Today)')}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon primary">
              <FileText size={24} />
            </div>
            <div className="summary-info">
              <p className="summary-value">{todaysSummary.totalOrders}</p>
              <p className="summary-label">{t('ordersToday', 'Orders (Today)')}</p>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-icon warning">
              <Clock size={24} />
            </div>
            <div className="summary-info">
              <p className="summary-value">{todaysSummary.pendingOrders}</p>
              <p className="summary-label">{t('pendingOrders', 'Pending Orders')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Orders Tab */}
      {activeTab === 'orders' && (
        <DataTable
          data={salesOrders}
          columns={salesOrderColumns}
          title={t('salesOrders', 'Sales Orders')}
          subtitle={`${t('salesOrdersSubtitle', 'Manage and track all sales orders')} - ${salesOrders.length} ${t('orders', 'orders')}`}
          headerActions={
            <button
              className="btn btn-primary"
              onClick={() => handleCreateOrder()}
              data-tour="new-sales-order-button"
            >
              <Plus size={16} />
              {t('newSaleOrder', 'New Sale Order')}
            </button>
          }
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noOrdersFound')}
          className="sales-orders-table"
          initialPageSize={10}
        />
      )}

      {/* Invoices Tab */}
      {activeTab === 'invoices' && (
        <DataTable
          data={salesOrders.filter(order => order.invoiceNumber)}
          columns={[
            {
              key: 'invoiceNumber',
              header: t('invoiceNumber'),
              sortable: true,
              render: (value) => (
                <div className="invoice-number">
                  <FileText size={14} />
                  <strong>{value}</strong>
                </div>
              )
            },
            {
              key: 'orderNumber',
              header: t('orderNumber'),
              sortable: true,
              render: (value) => <span className="text-muted">{value}</span>
            },
            {
              key: 'customer',
              header: t('customer'),
              sortable: true,
              render: (value, row) => (
                <div className="customer-info">
                  <User size={14} />
                  <span>{value || row.customerName}</span>
                </div>
              )
            },
            {
              key: 'invoiceGeneratedAt',
              header: t('generatedDate'),
              type: 'date',
              sortable: true,
              render: (value) => {
                if (!value) return '-'
                const date = new Date(value)
                const formattedDate = formatDate ? formatDate(value) : date.toLocaleDateString()
                return formattedDate + ' ' + date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
              }
            },
            {
              key: 'total',
              header: t('amount'),
              type: 'currency',
              align: 'right',
              sortable: true,
              render: (value, row) => {
                const total = parseFloat(value || row.totalAmount) || 0
                return `OMR ${total.toFixed(2)}`
              }
            },
            {
              key: 'status',
              header: t('orderStatus'),
              sortable: true,
              render: (value) => (
                <span className={`status-badge ${value}`}>
                  {value.charAt(0).toUpperCase() + value.slice(1)}
                </span>
              )
            },
            {
              key: 'actions',
              header: t('actions'),
              sortable: false,
              width: '120px',
              render: (value, row) => (
                <div className="cell-actions">
                  <button
                    className="btn btn-outline btn-sm"
                    title={t('view')}
                    onClick={() => handleViewSalesOrder(row)}
                  >
                    <Eye size={14} />
                  </button>
                  <button
                    className="btn btn-outline btn-sm"
                    title={t('downloadInvoice')}
                    onClick={() => alert('Download invoice functionality coming soon')}
                  >
                    <FileText size={14} />
                  </button>
                </div>
              )
            }
          ]}
          title={t('invoices')}
          subtitle={t('invoicesSubtitle', 'Generated sales invoices')}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noInvoicesYet', 'No invoices generated yet. Generate invoices from confirmed sales orders.')}
          className="invoices-table"
          initialPageSize={10}
        />
      )}

      {/* Sales Order Form Modal */}
      <SalesOrderForm
        isOpen={showOrderForm}
        onClose={() => {
          setEditingOrder(null)      // Clear editing state first
          setSelectedCustomer(null)  // Clear customer
          setShowOrderForm(false)    // Close form last
        }}
        onSave={handleSaveOrder}
        selectedCustomer={selectedCustomer}
        editingOrder={editingOrder}
      />

      {/* View Sales Order Modal */}
      <SalesOrderViewModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        orderData={viewingOrder}
        onEdit={handleEditSalesOrder}
        t={t}
      />
    </div>
  )
}

export default Sales