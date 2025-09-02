import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import LoadingSpinner from '../components/LoadingSpinner'
import DataTable from '../components/ui/DataTable'
import SalesOrderForm from '../modules/oil-trading/components/SalesOrderForm'
import salesOrderService from '../services/salesOrderService'
import customerService from '../services/customerService'
import { Eye, Edit, FileText, DollarSign, Calendar, User, AlertTriangle, CheckCircle } from 'lucide-react'
import '../styles/Sales.css'

const Sales = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders') // 'orders' or 'invoices'
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [salesOrders, setSalesOrders] = useState([])
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [editingOrder, setEditingOrder] = useState(null)
  const [todaysSummary, setTodaysSummary] = useState({ totalSales: 0, totalOrders: 0, pendingOrders: 0 })
  const [error, setError] = useState(null)

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
        console.log('Auto-opening sales order form for customer:', customer.name)
        setSelectedCustomer(customer)
        setShowOrderForm(true)
        // Clear the stored customer after using it
        sessionStorage.removeItem('selectedCustomerForOrder')
      } catch (error) {
        console.error('Error parsing stored customer:', error)
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
      console.log('Creating sales order:', orderData)
      
      // Create sales order via backend API
      const result = await salesOrderService.create(orderData)
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to create sales order')
      }
      
      console.log('Sales order created successfully:', result.data)
      
      // Refresh the sales orders list
      await loadSalesData()
      
      // Reset form state
      setSelectedCustomer(null)
      setShowOrderForm(false)
      setEditingOrder(null)
      
      // Show success message
      alert(`✅ Sales order created successfully!\n\nOrder Number: ${result.data.orderNumber}\nTotal: OMR ${result.data.totalAmount?.toFixed(2) || 0}`)
      
    } catch (error) {
      console.error('Error saving sales order:', error)
      setError(error.message)
      alert(`❌ Failed to create sales order:\n\n${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleViewSalesOrder = (order) => {
    setViewingOrder(order)
  }

  const handleEditSalesOrder = (order) => {
    setEditingOrder(order)
    setSelectedCustomer({ id: order.customerId, name: order.customerName })
    setShowOrderForm(true)
  }

  const handleGenerateInvoice = async (order) => {
    try {
      setLoading(true)
      const result = await salesOrderService.generateInvoice(order.id)
      
      if (result.success) {
        alert(`🧾 Invoice generated successfully for order: ${order.orderNumber}\n\nInvoice Number: ${result.data.invoiceNumber}`)
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

  // Define table columns for sales orders
  const salesOrderColumns = [
    {
      key: 'id',
      header: t('orderNumber'),
      sortable: true,
      render: (value) => (
        <div className="order-id">
          <strong>{value || row.orderNumber}</strong>
        </div>
      )
    },
    {
      key: 'customer',
      header: t('customer'),
      sortable: true,
      filterable: true,
      render: (value) => (
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
        const date = new Date(value)
        return date.toLocaleDateString()
      }
    },
    {
      key: 'items',
      header: t('items'),
      sortable: false,
      render: (value, row) => {
        const items = value || row.salesOrderItems || []
        return (
          <div className="items-summary">
            <div className="item-count">{items.length} {t('items')}</div>
            <div className="item-details">
              {items.slice(0, 2).map((item, index) => (
                <span key={index} className="item-name">
                  {item.materialName || item.name} ({item.quantity}{item.unit})
                </span>
              ))}
              {items.length > 2 && (
                <span className="more-items">+{items.length - 2} {t('more')}</span>
              )}
            </div>
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
        const total = value || row.totalAmount || 0
        return `OMR ${total.toFixed(2)}`
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
      key: 'paymentStatus',
      header: t('paymentStatus'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`payment-badge ${value || 'pending'}`}>
          {value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Pending'}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      width: '150px',
      render: (value, row) => (
        <div className="table-actions">
          <button 
            className="btn-icon" 
            title={t('view')}
            onClick={() => handleViewSalesOrder(row)}
          >
            <Eye size={16} />
          </button>
          <button 
            className="btn-icon" 
            title={t('edit')}
            onClick={() => handleEditSalesOrder(row)}
          >
            <Edit size={16} />
          </button>
          <button 
            className="btn-icon primary" 
            title={t('generateInvoice')}
            onClick={() => handleGenerateInvoice(row)}
          >
            <FileText size={16} />
          </button>
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message="Loading sales data..." size="large" />
      </div>
    )
  }

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
          <button className="btn btn-primary" onClick={() => handleCreateOrder()}>
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
            <input 
              type="date" 
              className="filter-select"
              placeholder="From Date"
            />
            <input 
              type="date" 
              className="filter-select"
              placeholder="To Date"
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
              loading={false}
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
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="12" y1="11" x2="12" y2="17" />
                <path d="M9 14h6" />
              </svg>
              <h3>No invoices generated yet</h3>
              <p>Create sales orders first, then generate invoices from them</p>
            </div>
          </div>
        )}

        <div className="sales-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="summary-info">
                <p className="summary-value">OMR {todaysSummary.totalSales.toFixed(2)}</p>
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
          setShowOrderForm(false)
          setSelectedCustomer(null)
          setEditingOrder(null)
        }}
        onSave={handleSaveOrder}
        selectedCustomer={selectedCustomer}
        editingOrder={editingOrder}
      />

      {/* View Sales Order Modal */}
      {viewingOrder && (
        <div className="modal-backdrop" onClick={() => setViewingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Sales Order Details</h3>
              <button className="modal-close" onClick={() => setViewingOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <p><strong>Order Number:</strong> {viewingOrder.orderNumber || viewingOrder.id}</p>
                <p><strong>Customer:</strong> {viewingOrder.customerName || viewingOrder.customer}</p>
                <p><strong>Date:</strong> {new Date(viewingOrder.orderDate || viewingOrder.date).toLocaleDateString()}</p>
                <p><strong>Status:</strong> {viewingOrder.status}</p>
                <p><strong>Payment Status:</strong> {viewingOrder.paymentStatus}</p>
                <p><strong>Total:</strong> OMR {(viewingOrder.totalAmount || viewingOrder.total || 0).toFixed(2)}</p>
                {viewingOrder.notes && <p><strong>Notes:</strong> {viewingOrder.notes}</p>}
                
                <h4>Items:</h4>
                <ul>
                  {(viewingOrder.salesOrderItems || viewingOrder.items || []).map((item, index) => (
                    <li key={index}>
                      {item.materialName || item.name} - {item.quantity} {item.unit} @ OMR {(item.unitPrice || item.rate || 0).toFixed(3)}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Sales