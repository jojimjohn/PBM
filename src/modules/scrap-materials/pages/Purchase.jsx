import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import DataTable from '../../../components/ui/DataTable'
import inventoryService from '../../../services/inventoryService'
import financialService from '../../../services/financialService'
import purchaseOrderService from '../../../services/purchaseOrderService'
import expenseService from '../../../services/expenseService'
import dataCacheService from '../../../services/dataCacheService'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import Collections from './Collections'
import PurchaseOrderViewModal from '../../../components/PurchaseOrderViewModal'
import PurchaseOrderStats from '../../../components/purchase/PurchaseOrderStats'
import CollectionStats from '../../../components/purchase/CollectionStats'
import ExpenseStats from '../../../components/purchase/ExpenseStats'
import WorkflowStepper from '../../../components/purchase/WorkflowStepper'
import { CheckCircle, Package, AlertTriangle, Truck, Eye, Edit, Plus, FileText, Download, Banknote, MapPin, Edit3 } from 'lucide-react'
// CSS migrated to Tailwind - design-system.css provides base classes

const Purchase = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('collections') // Workflow order: 'collections', 'orders', 'expenses', or 'vendors'
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [collectionOrders, setCollectionOrders] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [expenses, setExpenses] = useState([])
  const [processingOrder, setProcessingOrder] = useState(null)
  const [showOrderForm, setShowOrderForm] = useState(false)
  const [editingOrder, setEditingOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)

  // Read tab from URL on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tabFromUrl = params.get('tab');
    const validTabs = ['orders', 'collections', 'expenses', 'vendors'];

    if (tabFromUrl && validTabs.includes(tabFromUrl)) {
      setActiveTab(tabFromUrl);
    }
  }, []);

  // Update URL when tab changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    params.set('tab', activeTab);
    window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
  }, [activeTab]);

  useEffect(() => {
    if (selectedCompany) {
      loadPurchaseData()
    }
  }, [selectedCompany])

  const loadPurchaseData = async () => {
    try {
      setLoading(true)

      // PERFORMANCE FIX: Use dataCacheService for instant loading of cached data
      const [suppliersData, ordersResult, collectionsData, expensesResult] = await Promise.all([
        // Suppliers - CACHED (5 min TTL)
        dataCacheService.getSuppliers().catch(err => {
          console.error('Error loading suppliers:', err)
          return []
        }),
        purchaseOrderService.getAll(),
        // Collection orders - CACHED (2 min TTL)
        dataCacheService.getCollectionOrders().catch(err => {
          console.error('Error loading collections:', err)
          return []
        }),
        expenseService.getPurchaseExpenses()
      ])

      // Process suppliers (dataCacheService returns array directly)
      setSuppliers(suppliersData || [])

      // Process purchase orders
      if (ordersResult.success) {
        setPurchaseOrders(ordersResult.data)
      } else {
        console.error('Failed to load purchase orders:', ordersResult.error)
        setPurchaseOrders([])
      }

      // Process collection orders (dataCacheService returns array directly)
      setCollectionOrders(collectionsData || [])

      // Process purchase expenses
      if (expensesResult.success) {
        setExpenses(expensesResult.data)
      } else {
        console.error('Failed to load purchase expenses:', expensesResult.error)
        setExpenses([])
      }

    } catch (error) {
      console.error('Error loading purchase data:', error)
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

  /**
   * Task 3.5: Render tab-specific statistics
   * Dynamically displays statistics based on active tab
   */
  const renderTabStatistics = (activeTab) => {
    switch (activeTab) {
      case 'orders':
        return <PurchaseOrderStats purchaseOrders={purchaseOrders} />
      case 'collections':
        return <CollectionStats collectionOrders={collectionOrders} />
      case 'expenses':
        return <ExpenseStats expenses={expenses} />
      case 'vendors':
        return null // No stats for vendors tab (redirects to /suppliers)
      default:
        return null
    }
  }

  /**
   * Task 3.6: Render tab-specific action buttons
   * Shows context-appropriate actions for each tab
   */
  const renderTabActions = (activeTab) => {
    switch (activeTab) {
      case 'orders':
        return (
          <button className="btn btn-primary" onClick={handleCreatePurchaseOrder}>
            <Plus size={18} />
            {t('newPurchaseOrder')}
          </button>
        )
      case 'collections':
        return (
          <button className="btn btn-primary" onClick={() => window.location.href = '/collections'}>
            <Plus size={18} />
            {t('newCollectionOrder')}
          </button>
        )
      case 'expenses':
        return (
          <button className="btn btn-primary" onClick={() => alert('Add Expense functionality coming soon')}>
            <Plus size={18} />
            {t('addExpense')}
          </button>
        )
      case 'vendors':
        return (
          <button className="btn btn-outline" onClick={() => window.location.href = '/suppliers'}>
            <MapPin size={18} />
            {t('goToSuppliers')} →
          </button>
        )
      default:
        return null
    }
  }

  return (
    <div className="p-0">
      <div className="page-header">
        <div className="header-left">
          <h1>Purchase Management</h1>
          <p>Manage purchase orders and expenses</p>
        </div>
      </div>

      {/* Task 3.7a: Render tab-specific statistics */}
      <div className="mb-6">
        {renderTabStatistics(activeTab)}
      </div>

      {/* Workflow Guidance - Shows purchase workflow progression */}
      <WorkflowStepper
        activeTab={activeTab}
        onStepClick={(tab) => setActiveTab(tab)}
      />

      <div className="flex flex-col gap-8">
        {/* Tabs ordered by workflow: Collections first → Purchase Orders → Expenses → Vendors */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'collections' ? 'active' : ''}`}
            onClick={() => setActiveTab('collections')}
          >
            <MapPin className="w-4 h-4" />
            Collections
          </button>
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
              <rect width="20" height="12" x="2" y="6" rx="2" />
              <circle cx="12" cy="12" r="2" />
              <path d="M6 12h.01M18 12h.01" />
            </svg>
            Expenses
          </button>
        </div>


        {activeTab === 'orders' && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Purchase Orders</h3>
              <button className="btn btn-primary" onClick={handleCreatePurchaseOrder}>
                <Plus size={18} />
                {t('newPurchaseOrder')}
              </button>
            </div>
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
                    <div className="flex flex-col">
                      <strong className="text-gray-900 font-semibold">{value}</strong>
                      <small className="text-xs text-gray-500">{row.date}</small>
                    </div>
                  )
                },
                {
                  key: 'source_type',
                  header: 'Source',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => {
                    if (value === 'wcn_auto') {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-wide bg-emerald-100 text-emerald-700 border border-emerald-300" title={`Auto-generated from WCN ${row.wcn_number || ''}`}>
                          <Truck size={12} />
                          AUTO
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-semibold uppercase tracking-wide bg-blue-100 text-blue-700 border border-blue-300" title={row.collection_order_id ? `Linked to WCN ${row.wcn_number || ''}` : 'Manually created'}>
                          <Edit3 size={12} />
                          MANUAL
                        </span>
                      );
                    }
                  }
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
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{row.items.length} items</span>
                      <small className="text-xs text-gray-500">{value}</small>
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
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      value === 'paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                    }`}>
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
                            <div className="w-3.5 h-3.5 border-2 border-transparent border-t-current rounded-full animate-spin"></div>
                          ) : (
                            <CheckCircle size={14} />
                          )}
                        </button>
                      )}
                      {row.status === 'received' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-md text-[13px] font-medium" title={`Received on ${row.receivedDate ? new Date(row.receivedDate).toLocaleDateString() : 'N/A'}`}>
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
          <div>
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
                    <div className="flex flex-col">
                      <strong className="text-gray-900 font-semibold">{value}</strong>
                      <small className="text-xs text-gray-500">{row.date}</small>
                    </div>
                  )
                },
                {
                  key: 'category',
                  header: 'Category',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-sm font-medium">
                      <Banknote size={14} />
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
                    <span className="text-sm text-gray-700 line-clamp-2">{value}</span>
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

        {activeTab === 'collections' && (
          <Collections />
        )}
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

      {/* View Order Modal - Sprint 4.5 Enhanced */}
      <PurchaseOrderViewModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        orderData={viewingOrder}
        onEdit={handleEditOrder}
        onRefresh={loadPurchaseData}
        t={t}
      />
    </div>
  )
}

export default Purchase