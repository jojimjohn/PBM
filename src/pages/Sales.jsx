import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import LoadingSpinner from '../components/LoadingSpinner'
import DataTable from '../components/ui/DataTable'
import SalesOrderForm from '../modules/oil-trading/components/SalesOrderForm'
import inventoryService from '../services/inventoryService'
import financialService from '../services/financialService'
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

  const sampleOrders = [
    {
      id: 'SO-2024-089',
      customer: 'ABC Manufacturing LLC',
      date: '2024-01-15',
      deliveryDate: '2024-01-22',
      items: [
        { name: 'Diesel', quantity: 500, unit: 'L', rate: 0.450, amount: 225 }
      ],
      notes: 'Urgent delivery required for production line',
      specialInstructions: 'Handle with care, quality inspection required',
      total: 225,
      status: 'confirmed',
      paymentStatus: 'paid'
    },
    {
      id: 'SO-2024-088',
      customer: 'XYZ Power Plant',
      date: '2024-01-14',
      deliveryDate: '2024-01-21',
      items: [
        { name: 'Engine Oil without Drums', quantity: 10, unit: 'liters', rate: 2.500, amount: 25 }
      ],
      notes: 'Regular monthly order',
      specialInstructions: 'Standard delivery terms',
      total: 25,
      status: 'pending',
      paymentStatus: 'pending'
    }
  ]

  useEffect(() => {
    // Load sales orders
    const timer = setTimeout(() => {
      setSalesOrders(sampleOrders)
      setLoading(false)
    }, 1300)
    
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
    
    return () => clearTimeout(timer)
  }, [])

  const handleCreateOrder = (selectedCustomer = null) => {
    setSelectedCustomer(selectedCustomer)
    setShowOrderForm(true)
  }

  const handleSaveOrder = async (orderData) => {
    try {
      // Step 1: Validate inventory availability
      const companyId = selectedCompany?.id || 'alramrami'
      const orderItems = orderData.items.map(item => ({
        materialId: item.materialId,
        quantity: parseFloat(item.quantity)
      }))

      console.log('Validating inventory for sales order:', orderData.orderNumber)
      
      // Check stock availability before proceeding
      const validation = inventoryService.validateStockAvailability(companyId, orderItems)
      
      if (!validation.isValid) {
        // Show detailed error message about insufficient stock
        const errorDetails = validation.insufficientItems.map(item => 
          `• Material ${item.materialId}: Requested ${item.requested}, Available ${item.available}`
        ).join('\n')
        
        throw new Error(`Insufficient stock for the following items:\n${errorDetails}`)
      }

      // Step 2: Create the sales order with pending status
      const salesOrder = {
        ...orderData,
        status: 'pending',
        createdAt: new Date().toISOString(), // July 25, 2025
        updatedAt: new Date().toISOString()
      }

      // Step 3: Reduce inventory stock
      console.log('Reducing inventory stock for order:', salesOrder.orderNumber)
      const stockReduction = await inventoryService.reduceStock(
        companyId, 
        orderItems, 
        salesOrder.orderNumber
      )

      if (!stockReduction.success) {
        throw new Error(`Failed to update inventory: ${stockReduction.error}`)
      }

      // Step 4: Record financial transaction
      console.log('Recording sales transaction for order:', salesOrder.orderNumber)
      const salesTransaction = financialService.recordSalesTransaction(salesOrder, companyId)
      
      // Step 5: Update order status to confirmed and add inventory + financial info
      salesOrder.status = 'confirmed'
      salesOrder.inventoryReduction = {
        timestamp: new Date().toISOString(),
        items: stockReduction.updatedItems,
        message: stockReduction.message
      }
      salesOrder.financialTransaction = {
        transactionId: salesTransaction.id,
        amount: salesTransaction.netAmount,
        timestamp: salesTransaction.createdAt
      }

      // Add to local state
      setSalesOrders(prev => [salesOrder, ...prev])
      
      // Reset form state
      setSelectedCustomer(null)
      setShowOrderForm(false)
      
      // Show success message with inventory and financial details
      const inventoryDetails = stockReduction.updatedItems.map(item => 
        `${item.materialId}: ${item.quantityReduced} units reduced (${item.newStock} remaining)`
      ).join('\n')
      
      alert(`✅ Sales order created successfully!\n\nInventory Updated:\n${inventoryDetails}\n\n💰 Financial Transaction: ${salesTransaction.id}\nRevenue: OMR ${salesTransaction.netAmount.toFixed(2)}`)
      
      console.log('Sales order saved successfully:', salesOrder)
      console.log('Financial transaction recorded:', salesTransaction)
      
    } catch (error) {
      console.error('Error saving sales order:', error)
      
      // Show user-friendly error message
      alert(`❌ Failed to create sales order:\n\n${error.message}`)
      throw error
    }
  }

  const handleViewSalesOrder = (order) => {
    setViewingOrder(order)
  }

  const handleEditSalesOrder = (order) => {
    setEditingOrder(order)
    setShowOrderForm(true)
  }

  const handleGenerateInvoice = (order) => {
    alert(`🧾 Generating invoice for order: ${order.id}\n\nThis feature will be implemented in the next phase.`)
  }

  // Define table columns for sales orders
  const salesOrderColumns = [
    {
      key: 'id',
      header: t('orderNumber'),
      sortable: true,
      render: (value) => (
        <div className="order-id">
          <strong>{value}</strong>
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
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'date',
      header: t('date'),
      type: 'date',
      sortable: true
    },
    {
      key: 'items',
      header: t('items'),
      sortable: false,
      render: (value) => (
        <div className="items-summary">
          <div className="item-count">{value.length} {t('items')}</div>
          <div className="item-details">
            {value.slice(0, 2).map((item, index) => (
              <span key={index} className="item-name">
                {item.name} ({item.quantity}{item.unit})
              </span>
            ))}
            {value.length > 2 && (
              <span className="more-items">+{value.length - 2} {t('more')}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'total',
      header: t('total'),
      type: 'currency',
      align: 'right',
      sortable: true
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
                <p className="summary-value">OMR 250.00</p>
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
                <p className="summary-value">2</p>
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
                <p className="summary-value">1</p>
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
                <p><strong>Order ID:</strong> {viewingOrder.id}</p>
                <p><strong>Customer:</strong> {viewingOrder.customer}</p>
                <p><strong>Date:</strong> {viewingOrder.date}</p>
                <p><strong>Status:</strong> {viewingOrder.status}</p>
                <p><strong>Payment Status:</strong> {viewingOrder.paymentStatus}</p>
                <p><strong>Total:</strong> OMR {viewingOrder.total.toFixed(2)}</p>
                
                <h4>Items:</h4>
                <ul>
                  {viewingOrder.items.map((item, index) => (
                    <li key={index}>
                      {item.name} - {item.quantity} {item.unit} @ OMR {item.rate.toFixed(3)}
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