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
import { Eye, Edit, FileText, Banknote, Calendar, User, AlertTriangle, CheckCircle, Truck, XCircle, Clock, Trash2 } from 'lucide-react'
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
              <FileText size={14} style={{ color: '#10b981' }} />
              <span style={{ color: '#10b981', fontWeight: '500' }}>
                {value || row.invoiceNumber}
              </span>
            </div>
          )
        }
        return <span style={{ color: '#6b7280' }}>-</span>
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
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
                className="btn btn-outline btn-sm"
                title={t('delete') || 'Delete'}
                style={{ color: '#dc2626' }}
                onClick={() => handleDeleteOrder(row)}
              >
                <Trash2 size={14} />
              </button>
            )}
            {/* Invoice Actions */}
            {(row.status === 'confirmed' || row.status === 'delivered') && (
              row.invoiceNumber ? (
                <button
                  className="btn btn-outline btn-sm"
                  title={`Invoice: ${row.invoiceNumber}`}
                  style={{ color: '#10b981' }}
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
      
      <div className="page-header">
        <div className="header-left">
          <h1>Sales Management</h1>
          <p>Manage sales orders and invoices</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-outline">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7,10 12,15 17,10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>
          <button className="btn btn-primary" onClick={() => handleCreateOrder()} data-tour="new-sales-order-button">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Sale Order
          </button>
        </div>
      </div>

      <div className="sales-content">
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
            data-tour="sales-orders-tab"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10,9 9,9 8,9" />
            </svg>
            Sales Orders
          </button>
          <button 
            className={`tab-btn ${activeTab === 'invoices' ? 'active' : ''}`}
            onClick={() => setActiveTab('invoices')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
              <line x1="12" y1="11" x2="12" y2="17" />
              <path d="M9 14h6" />
            </svg>
            Invoices
          </button>
        </div>

        <div className="filters-bar">
          <div className="search-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input 
              type="text" 
              placeholder={t('searchSalesOrders')}
              className="search-input"
            />
          </div>
          <div className="filter-buttons">
            <select className="filter-select">
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <select className="filter-select">
              <option value="all">All Customers</option>
              <option value="almaha">Al Maha Petroleum</option>
              <option value="gulf">Gulf Construction LLC</option>
            </select>
            <DatePicker
              value={filterFromDate}
              onChange={setFilterFromDate}
              placeholder={t('fromDate') || 'From Date'}
              className="filter-datepicker"
              size="small"
            />
            <DatePicker
              value={filterToDate}
              onChange={setFilterToDate}
              placeholder={t('toDate') || 'To Date'}
              className="filter-datepicker"
              size="small"
            />
          </div>
        </div>

        {activeTab === 'orders' && (
          <div className="sales-orders">
            <DataTable
              data={salesOrders}
              columns={salesOrderColumns}
              title={t('salesOrders')}
              subtitle={t('salesOrdersSubtitle')}
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
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="sales-invoices">
            <DataTable
              data={salesOrders.filter(order => order.invoiceNumber)}
              columns={[
                {
                  key: 'invoiceNumber',
                  header: t('invoiceNumber'),
                  sortable: true,
                  render: (value) => (
                    <div className="invoice-number">
                      <FileText size={14} style={{ color: '#10b981' }} />
                      <strong>{value}</strong>
                    </div>
                  )
                },
                {
                  key: 'orderNumber',
                  header: t('orderNumber'),
                  sortable: true,
                  render: (value) => <span style={{ color: '#6b7280' }}>{value}</span>
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
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
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
              subtitle="Generated sales invoices"
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              selectable={false}
              emptyMessage="No invoices generated yet. Generate invoices from confirmed sales orders."
              className="invoices-table"
              initialPageSize={10}
            />
          </div>
        )}

        <div className="sales-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect width="20" height="12" x="2" y="6" rx="2" />
                  <circle cx="12" cy="12" r="2" />
                  <path d="M6 12h.01M18 12h.01" />
                </svg>
              </div>
              <div className="summary-info">
                <p className="summary-value">OMR {(parseFloat(todaysSummary.totalSales) || 0).toFixed(2)}</p>
                <p className="summary-label">Total Sales (Today)</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                </svg>
              </div>
              <div className="summary-info">
                <p className="summary-value">{todaysSummary.totalOrders}</p>
                <p className="summary-label">Orders (Today)</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
              </div>
              <div className="summary-info">
                <p className="summary-value">{todaysSummary.pendingOrders}</p>
                <p className="summary-label">Pending Orders</p>
              </div>
            </div>
          </div>
        </div>
      </div>

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