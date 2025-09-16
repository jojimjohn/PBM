import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import LoadingSpinner from '../components/LoadingSpinner'
import DataTable from '../components/ui/DataTable'
import inventoryService from '../services/inventoryService'
import financialService from '../services/financialService'
import supplierService from '../services/supplierService'
import purchaseOrderService from '../services/purchaseOrderService'
import expenseService from '../services/expenseService'
import PurchaseOrderForm from '../modules/oil-trading/components/PurchaseOrderForm'
import { CheckCircle, Package, AlertTriangle, Truck, Eye, Edit, Plus, FileText, Download, DollarSign } from 'lucide-react'
import '../styles/Purchase.css'

const Purchase = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('orders') // 'orders', 'expenses', or 'vendors'
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [processingOrder, setProcessingOrder] = useState(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)

  useEffect(() => {
    if (selectedCompany) {
      loadPurchaseData()
    }
  }, [selectedCompany])

  const loadPurchaseData = async () => {
    try {
      setLoading(true)
      
      // Load suppliers from API instead of vendors from JSON
      const suppliersResult = await supplierService.getAll()
      if (suppliersResult.success) {
        setSuppliers(suppliersResult.data)
        console.log('Suppliers loaded:', suppliersResult.data.length)
      } else {
        console.error('Failed to load suppliers:', suppliersResult.error)
        alert(`Failed to load suppliers: ${suppliersResult.error}`)
      }
      
      // Load purchase orders from API
      const ordersResult = await purchaseOrderService.getAll()
      if (ordersResult.success) {
        setPurchaseOrders(ordersResult.data)
        console.log('Purchase orders loaded:', ordersResult.data.length)
      } else {
        console.error('Failed to load purchase orders:', ordersResult.error)
        alert(`Failed to load purchase orders: ${ordersResult.error}`)
      }
      
      // Load purchase expenses from unified expense API
      const expensesResult = await expenseService.getPurchaseExpenses()
      if (expensesResult.success) {
        setExpenses(expensesResult.data)
        console.log('Purchase expenses loaded:', expensesResult.data.length)
      } else {
        console.error('Failed to load purchase expenses:', expensesResult.error)
        // Don't show alert for expenses as it's not critical
      }
      
    } catch (error) {
      console.error('Error loading purchase data:', error)
      alert('Failed to load purchase data')
    } finally {
      setLoading(false)
    }
  }

  const handleMarkAsReceived = async (order) => {
    if (!order || processingOrder === order.id) return
    
    try {
      setProcessingOrder(order.id)
      console.log('Processing receipt for purchase order:', order.id)
      
      // Step 1: Prepare items for inventory addition
      const companyId = selectedCompany?.id || 'alramrami'
      const inventoryItems = order.items.map(item => ({
        materialId: item.materialId,
        materialCode: item.materialId, // Could be enhanced with actual material codes
        quantity: parseFloat(item.quantity),
        cost: parseFloat(item.rate),
        unit: item.unit
      }))

      // Step 2: Add inventory using the inventory service
      const stockAddition = await inventoryService.addStock(
        companyId,
        inventoryItems,
        order.id
      )

      if (!stockAddition.success) {
        throw new Error(`Failed to update inventory: ${stockAddition.error}`)
      }

      // Step 3: Record financial transaction
      console.log('Recording purchase transaction for order:', order.id)
      const purchaseTransaction = financialService.recordPurchaseTransaction(order, companyId)
      
      // Step 4: Update purchase order status
      const updatedOrder = {
        ...order,
        status: 'received',
        receivedDate: new Date().toISOString(), // July 25, 2025
        inventoryAddition: {
          timestamp: new Date().toISOString(),
          items: stockAddition.updatedItems,
          message: stockAddition.message
        },
        financialTransaction: {
          transactionId: purchaseTransaction.id,
          amount: purchaseTransaction.netAmount,
          timestamp: purchaseTransaction.createdAt
        }
      }

      // Update local state
      setPurchaseOrders(prev => 
        prev.map(po => po.id === order.id ? updatedOrder : po)
      )

      // Show success message with inventory and financial details
      const inventoryDetails = stockAddition.updatedItems.map(item => 
        `${item.materialId}: +${item.quantityAdded} units (${item.newStock} total)`
      ).join('\n')
      
      alert(`✅ Purchase order marked as received!\n\nInventory Updated:\n${inventoryDetails}\n\n💰 Financial Transaction: ${purchaseTransaction.id}\nCost: OMR ${purchaseTransaction.netAmount.toFixed(2)}`)
      
      console.log('Purchase order processed successfully:', updatedOrder)
      console.log('Financial transaction recorded:', purchaseTransaction)

    } catch (error) {
      console.error('Error marking order as received:', error)
      alert(`❌ Failed to mark order as received:\n\n${error.message}`)
    } finally {
      setProcessingOrder(null)
    }
  }

  const handleCreatePurchaseOrder = () => {
    setEditingOrder(null)
    setShowOrderForm(true)
  }

  const handleViewOrder = (order) => {
    console.log('Viewing order:', order)
    setViewingOrder(order)
  }

  const handleEditOrder = (order) => {
    setEditingOrder(order)
    setShowOrderForm(true)
  }

  const handleSavePurchaseOrder = (orderData) => {
    try {
      if (editingOrder) {
        // Update existing order
        setPurchaseOrders(prev => 
          prev.map(po => po.id === editingOrder.id ? { ...orderData, id: editingOrder.id } : po)
        )
        alert('✅ Purchase order updated successfully!')
      } else {
        // Create new order
        const newOrder = {
          ...orderData,
          id: `PO-2025-${Date.now().toString().slice(-3)}`,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          paymentStatus: 'pending'
        }
        setPurchaseOrders(prev => [newOrder, ...prev])
        alert('✅ Purchase order created successfully!')
      }
      
      setShowOrderForm(false)
      setEditingOrder(null)
    } catch (error) {
      console.error('Error saving purchase order:', error)
      alert(`❌ Failed to save purchase order: ${error.message}`)
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message="Loading purchase data..." size="large" />
      </div>
    )
  }

  return (
    <div className="purchase-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Purchase Management</h1>
          <p>Manage purchase orders and expenses</p>
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
          <button className="btn btn-primary" onClick={handleCreatePurchaseOrder}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            New Purchase Order
          </button>
        </div>
      </div>

      <div className="purchase-content">
        <div className="tab-navigation">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="9" cy="21" r="1" />
              <circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
            </svg>
            Purchase Orders
          </button>
          <button 
            className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
            onClick={() => setActiveTab('expenses')}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Expenses
          </button>
          <button 
            className={`tab-btn ${activeTab === 'vendors' ? 'active' : ''}`}
            onClick={() => {
              // Redirect to suppliers module instead of showing vendors tab
              window.location.href = '/suppliers';
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
              <path d="m22 2-5 10-5-5 10-5z" />
            </svg>
            Vendor Management
          </button>
        </div>


        {activeTab === 'orders' && (
          <div className="purchase-orders">
            <DataTable
              data={purchaseOrders.map(order => ({
                ...order,
                itemsSummary: order.items.map(item => item.name).slice(0, 2).join(', ') + 
                             (order.items.length > 2 ? ` +${order.items.length - 2} more` : ''),
                statusDisplay: order.status.charAt(0).toUpperCase() + order.status.slice(1),
                paymentStatusDisplay: order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)
              }))}
              columns={[
                {
                  key: 'id',
                  header: 'Order ID',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <div className="order-id-cell">
                      <strong>{value}</strong>
                      <small>{row.date}</small>
                    </div>
                  )
                },
                {
                  key: 'supplier',
                  header: 'Supplier',
                  sortable: true,
                  filterable: true
                },
                {
                  key: 'itemsSummary',
                  header: 'Items',
                  sortable: false,
                  filterable: true,
                  render: (value, row) => (
                    <div className="items-cell">
                      <span>{row.items.length} items</span>
                      <small>{value}</small>
                    </div>
                  )
                },
                {
                  key: 'total',
                  header: 'Total',
                  type: 'currency',
                  sortable: true,
                  align: 'right',
                  render: (value) => `OMR ${value.toFixed(2)}`
                },
                {
                  key: 'status',
                  header: 'Status',
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
                  header: 'Payment',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className={`payment-badge ${value}`}>
                      {value.charAt(0).toUpperCase() + value.slice(1)}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  sortable: false,
                  render: (value, row) => (
                    <div className="table-actions">
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleViewOrder(row)}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => handleEditOrder(row)}
                        title="Edit Order"
                      >
                        <Edit size={14} />
                      </button>
                      {row.status === 'pending' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => handleMarkAsReceived(row)}
                          disabled={processingOrder === row.id}
                          title="Mark as Received"
                        >
                          {processingOrder === row.id ? (
                            <div className="loading-spinner-small"></div>
                          ) : (
                            <CheckCircle size={14} />
                          )}
                        </button>
                      )}
                      {row.status === 'received' && (
                        <div className="received-indicator" title={`Received on ${row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : 'N/A'}`}>
                          <Truck size={14} />
                        </div>
                      )}
                    </div>
                  )
                }
              ]}
              title="Purchase Orders"
              subtitle="Manage scrap material purchase orders and track deliveries"
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              selectable={false}
              emptyMessage="No purchase orders found"
              className="purchase-orders-table"
              initialPageSize={10}
              stickyHeader={true}
              enableColumnToggle={true}
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="purchase-expenses">
            <DataTable
              data={expenses.map(expense => ({
                ...expense,
                statusDisplay: expense.status.charAt(0).toUpperCase() + expense.status.slice(1)
              }))}
              columns={[
                {
                  key: 'id',
                  header: 'Expense ID',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <div className="expense-id-cell">
                      <strong>{value}</strong>
                      <small>{row.date}</small>
                    </div>
                  )
                },
                {
                  key: 'category',
                  header: 'Category',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className="category-badge">
                      <DollarSign size={14} />
                      {value}
                    </span>
                  )
                },
                {
                  key: 'description',
                  header: 'Description',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <div className="description-cell">
                      <span>{value}</span>
                    </div>
                  )
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  type: 'currency',
                  sortable: true,
                  align: 'right',
                  render: (value) => (
                    <strong>OMR {value.toFixed(2)}</strong>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
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
                  header: 'Actions',
                  sortable: false,
                  render: (value, row) => (
                    <div className="table-actions">
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => alert(`Viewing expense: ${row.id}`)}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button 
                        className="btn btn-outline btn-sm"
                        onClick={() => alert(`Editing expense: ${row.id}`)}
                        title="Edit Expense"
                      >
                        <Edit size={14} />
                      </button>
                      {row.status === 'pending' && (
                        <button 
                          className="btn btn-success btn-sm"
                          onClick={() => alert(`Approving expense: ${row.id}`)}
                          title="Approve Expense"
                        >
                          <CheckCircle size={14} />
                        </button>
                      )}
                    </div>
                  )
                }
              ]}
              title="Purchase Expenses"
              subtitle="Manage transportation, maintenance, and other purchase-related expenses"
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              selectable={false}
              emptyMessage="No expenses found"
              className="purchase-expenses-table"
              initialPageSize={10}
              stickyHeader={true}
              enableColumnToggle={true}
            />
          </div>
        )}

        <div className="purchase-summary">
          <div className="summary-cards">
            <div className="summary-card">
              <div className="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="9" cy="21" r="1" />
                  <circle cx="20" cy="21" r="1" />
                  <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
                </svg>
              </div>
              <div className="summary-info">
                <p className="summary-value">OMR 1,200.00</p>
                <p className="summary-label">Total Purchases (Month)</p>
              </div>
            </div>
            
            <div className="summary-card">
              <div className="summary-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <div className="summary-info">
                <p className="summary-value">OMR 175.00</p>
                <p className="summary-label">Total Expenses (Month)</p>
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

      {/* Purchase Order Form Modal */}
      {showOrderForm && (
        <PurchaseOrderForm
          isOpen={showOrderForm}
          onClose={() => {
            setShowOrderForm(false)
            setEditingOrder(null)
          }}
          onSave={handleSavePurchaseOrder}
          suppliers={suppliers}
          materials={[]} // TODO: Add materials loading
          editingOrder={editingOrder}
        />
      )}

      {/* View Order Modal */}
      {viewingOrder && (
        <div className="modal-backdrop" onClick={() => setViewingOrder(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Purchase Order Details</h3>
              <button className="modal-close" onClick={() => setViewingOrder(null)}>×</button>
            </div>
            <div className="modal-body">
              <div className="order-details">
                <p><strong>Order ID:</strong> {viewingOrder.id}</p>
                <p><strong>Supplier:</strong> {viewingOrder.supplier}</p>
                <p><strong>Date:</strong> {viewingOrder.date}</p>
                <p><strong>Status:</strong> {viewingOrder.status}</p>
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

export default Purchase