import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import DataTable from '../../../components/ui/DataTable'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import PurchaseOrderReceipt from '../../../components/PurchaseOrderReceipt'
import PurchaseExpenseForm from '../../../components/PurchaseExpenseForm'
import VendorManager from '../../../components/VendorManager'
import StorageLocationManager from '../../../components/StorageLocationManager'
import purchaseOrderService from '../../../services/purchaseOrderService'
import supplierService from '../../../services/supplierService'
import materialService from '../../../services/materialService'
import { 
  Plus, Search, Filter, Eye, Edit, Truck, Package, 
  CheckCircle, Clock, AlertTriangle, FileText, Download,
  DollarSign, MapPin, Building, Calculator, Receipt,
  Users, Settings
} from 'lucide-react'
import '../styles/Purchase.css'

const Purchase = () => {
  const { selectedCompany } = useAuth()
  const { hasPermission } = usePermissions()
  const { formatDate, formatCurrency } = useSystemSettings()
  
  // Tab management
  const [activeTab, setActiveTab] = useState('orders')
  
  // Data states
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [purchaseExpenses, setPurchaseExpenses] = useState([])
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [orderStatuses, setOrderStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showReceiptForm, setShowReceiptForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showVendorManager, setShowVendorManager] = useState(false)
  const [showLocationManager, setShowLocationManager] = useState(false)
  const [receivingOrder, setReceivingOrder] = useState(false)

  useEffect(() => {
    loadPurchaseData()
  }, [selectedCompany])

  const loadPurchaseData = async () => {
    try {
      setLoading(true)
      
      // Load purchase orders using API service
      const ordersResult = await purchaseOrderService.getAll()
      const companyOrders = ordersResult.success ? ordersResult.data : []
      setPurchaseOrders(companyOrders)
      
      // Load purchase expenses - Mock for now
      setPurchaseExpenses([
        {
          id: 1,
          purchaseOrderId: 1,
          orderNumber: 'PO-2024-001',
          category: 'transportation',
          description: 'Transportation from Sohar to Muscat',
          amount: 500.00,
          vendor: 'Express Logistics',
          expenseDate: '2024-08-20',
          status: 'approved'
        },
        {
          id: 2,
          purchaseOrderId: 1,
          orderNumber: 'PO-2024-001',
          category: 'loading_unloading',
          description: 'Loading and unloading charges',
          amount: 150.00,
          vendor: 'Port Services LLC',
          expenseDate: '2024-08-20',
          status: 'approved'
        }
      ])
      
      // Set default order statuses
      setOrderStatuses({
        draft: { name: 'Draft', color: '#6b7280' },
        pending: { name: 'Pending Approval', color: '#f59e0b' },
        approved: { name: 'Approved', color: '#10b981' },
        sent: { name: 'Sent to Vendor', color: '#3b82f6' },
        received: { name: 'Received', color: '#059669' },
        completed: { name: 'Completed', color: '#059669' },
        cancelled: { name: 'Cancelled', color: '#ef4444' }
      })

      // Load suppliers using API service (vendors = suppliers for oil business)
      const suppliersResult = await supplierService.getAll()
      if (suppliersResult.success) {
        // Map suppliers to vendor format for compatibility
        const supplierVendors = suppliersResult.data.map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          vendorCode: supplier.supplierCode || `VEN-${supplier.id.toString().padStart(3, '0')}`,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email
        }))
        setVendors(supplierVendors)
        console.log('Suppliers loaded as vendors:', supplierVendors.length)
      } else {
        console.error('Failed to load suppliers:', suppliersResult.error)
        setVendors([]) // Set empty array on failure
      }

      // Load materials using API service
      const materialsResult = await materialService.getAll()
      const companyMaterials = materialsResult.success ? materialsResult.data : []
      setMaterials(companyMaterials)
      
    } catch (error) {
      console.error('Error loading purchase data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateOrder = () => {
    setShowCreateForm(true)
  }

  const handleEditOrder = (order) => {
    setSelectedOrder(order)
    setShowEditForm(true)
  }

  const handleReceiveOrder = (order) => {
    setSelectedOrder(order)
    setShowReceiptForm(true)
  }

  const handleAddExpense = (order) => {
    setSelectedOrder(order)
    setShowExpenseForm(true)
  }

  const handleReceiveSubmit = async (receiptData) => {
    if (!selectedOrder) return

    try {
      setReceivingOrder(true)
      
      // Call the receive API endpoint which will automatically update inventory
      const result = await purchaseOrderService.receive(selectedOrder.id, receiptData)
      
      if (result.success) {
        // Update the order status locally
        setPurchaseOrders(prev => prev.map(order => 
          order.id === selectedOrder.id 
            ? { ...order, status: 'received', actualDeliveryDate: new Date().toISOString() }
            : order
        ))
        
        // Close the receipt form
        setShowReceiptForm(false)
        setSelectedOrder(null)
        
        alert('Purchase order received successfully! Inventory has been updated automatically.')
        
        // Optionally reload data to get the latest state
        await loadPurchaseData()
      } else {
        alert(`Failed to receive purchase order: ${result.error}`)
      }
    } catch (error) {
      console.error('Error receiving purchase order:', error)
      alert('Failed to receive purchase order. Please try again.')
    } finally {
      setReceivingOrder(false)
    }
  }

  const handleSaveOrder = async (orderData) => {
    try {
      setLoading(true)
      
      let result
      if (selectedOrder) {
        // Update existing order
        result = await purchaseOrderService.update(selectedOrder.id, orderData)
        if (result.success) {
          setPurchaseOrders(prev => prev.map(order => 
            order.id === selectedOrder.id ? { ...result.data } : order
          ))
        }
      } else {
        // Create new order
        result = await purchaseOrderService.create(orderData)
        if (result.success) {
          setPurchaseOrders(prev => [...prev, result.data])
        }
      }

      if (result && result.success) {
        // Close forms on success
        setShowCreateForm(false)
        setShowEditForm(false) 
        setSelectedOrder(null)
      } else {
        alert(`Failed to save purchase order: ${result?.error || 'Unknown error'}`)
      }
      
    } catch (error) {
      console.error('Error saving purchase order:', error)
      alert('Failed to save purchase order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpense = async (expenseData) => {
    try {
      // Mock expense saving - replace with actual API call
      const newExpense = {
        ...expenseData,
        id: Math.max(...purchaseExpenses.map(e => e.id), 0) + 1,
        orderNumber: selectedOrder.orderNumber,
        status: 'pending'
      }
      
      setPurchaseExpenses(prev => [...prev, ...newExpense.expenses.map((exp, index) => ({
        ...exp,
        id: newExpense.id + index,
        purchaseOrderId: newExpense.purchaseOrderId,
        orderNumber: selectedOrder.orderNumber,
        status: 'pending'
      }))])
      
      setShowExpenseForm(false)
      setSelectedOrder(null)
      alert('Purchase expenses added successfully!')
    } catch (error) {
      console.error('Error saving expense:', error)
      alert('Failed to save expense. Please try again.')
    }
  }

  const handleViewOrder = (order) => {
    console.log('Viewing purchase order:', order)
    setSelectedOrder(order)
    alert(`✅ Viewing details for order ${order.orderNumber}`)
  }

  const handleApproveOrder = async (order) => {
    const approvalNotes = prompt(`Approve Purchase Order ${order.orderNumber}?\nOptional approval notes:`, '')
    
    if (approvalNotes === null) return // User cancelled
    
    try {
      const result = await purchaseOrderService.approve(order.id, { approvalNotes })
      
      if (result.success) {
        setPurchaseOrders(prev => prev.map(po => 
          po.id === order.id ? { ...po, orderStatus: 'approved' } : po
        ))
        alert(`✅ Purchase order ${order.orderNumber} approved successfully!`)
      } else {
        alert(`❌ Failed to approve order: ${result.error}`)
      }
    } catch (error) {
      console.error('Error approving order:', error)
      alert(`❌ Failed to approve order: ${error.message}`)
    }
  }

  const handleStatusUpdate = async (order, newStatus) => {
    const statusNotes = prompt(`Update status of Purchase Order ${order.orderNumber} to "${newStatus}"?\nOptional notes:`, '')
    
    if (statusNotes === null) return // User cancelled
    
    try {
      const result = await purchaseOrderService.updateStatus(order.id, newStatus, { notes: statusNotes })
      
      if (result.success) {
        setPurchaseOrders(prev => prev.map(po => 
          po.id === order.id ? { ...po, orderStatus: newStatus } : po
        ))
        alert(`✅ Purchase order ${order.orderNumber} status updated to ${newStatus}!`)
      } else {
        alert(`❌ Failed to update status: ${result.error}`)
      }
    } catch (error) {
      console.error('Error updating order status:', error)
      alert(`❌ Failed to update status: ${error.message}`)
    }
  }

  const handleDownloadOrder = (order) => {
    console.log('Downloading purchase order:', order)
    alert(`✅ Downloading purchase order ${order.orderNumber}`)
  }

  const calculateOrderSummary = () => {
    const summary = {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter(o => o.status === 'pending').length,
      approved: purchaseOrders.filter(o => o.status === 'approved').length,
      delivered: purchaseOrders.filter(o => o.status === 'delivered').length,
      totalValue: purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0),
      totalExpenses: purchaseExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0)
    }
    return summary
  }

  const getStatusColor = (status) => {
    return orderStatuses[status]?.color || '#6b7280'
  }

  const getStatusName = (status) => {
    return orderStatuses[status]?.name || status
  }

  const getStatusIcon = (status) => {
    switch(status) {
      case 'pending': return <Clock size={14} />
      case 'approved': return <CheckCircle size={14} />
      case 'delivered': return <Package size={14} />
      case 'cancelled': return <AlertTriangle size={14} />
      default: return <FileText size={14} />
    }
  }

  const summary = calculateOrderSummary()

  const tabs = [
    { id: 'orders', name: 'Purchase Orders', icon: FileText },
    { id: 'expenses', name: 'Purchase Expenses', icon: DollarSign },
    { id: 'vendors', name: 'Vendor Management', icon: Users },
    { id: 'locations', name: 'Storage Locations', icon: MapPin },
    { id: 'analytics', name: 'Analytics', icon: Calculator }
  ]

  if (loading && purchaseOrders.length === 0) {
    return (
      <div className="purchase-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading purchase data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>Purchase Management</h1>
          <p>Complete vendor procurement and expense tracking for {selectedCompany?.name}</p>
        </div>
        
        <div className="page-actions">
          <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE_ORDER}>
            <button 
              className="btn btn-primary"
              onClick={handleCreateOrder}
            >
              <Plus size={20} />
              New Purchase Order
            </button>
          </PermissionGate>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="purchase-summary">
        <div className="summary-card">
          <div className="summary-icon total">
            <FileText size={24} />
          </div>
          <div className="summary-content">
            <h3>Total Orders</h3>
            <p className="summary-number">{summary.total}</p>
            <p className="summary-change">All time</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon pending">
            <Clock size={24} />
          </div>
          <div className="summary-content">
            <h3>Pending Orders</h3>
            <p className="summary-number">{summary.pending}</p>
            <p className="summary-change">Awaiting approval</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon approved">
            <CheckCircle size={24} />
          </div>
          <div className="summary-content">
            <h3>Order Value</h3>
            <p className="summary-number">{formatCurrency(summary.totalValue)}</p>
            <p className="summary-change">Total purchase value</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon value">
            <DollarSign size={24} />
          </div>
          <div className="summary-content">
            <h3>Total Expenses</h3>
            <p className="summary-number">{formatCurrency(summary.totalExpenses)}</p>
            <p className="summary-change">Additional costs</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="purchase-tabs">
        <div className="tab-buttons">
          {tabs.map(tab => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={18} />
                {tab.name}
              </button>
            )
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'orders' && (
          <div className="orders-tab">
            <div className="tab-header">
              <h3>Purchase Orders</h3>
            </div>

            <DataTable
              data={purchaseOrders.map(order => ({
                ...order,
                vendorInfo: vendors.find(v => v.id === order.vendorId) || { name: order.vendorName },
                statusInfo: orderStatuses[order.status] || { name: order.status, color: '#6b7280' },
                itemsCount: order.items?.length || 0,
                itemsSummary: (order.items || []).slice(0, 2).map(item => item.materialName).join(', ') + 
                              ((order.items?.length || 0) > 2 ? ` +${order.items.length - 2} more` : '')
              }))}
              columns={[
                {
                  key: 'orderNumber',
                  header: 'Order Number',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <div>
                      <div style={{ fontWeight: '600', color: '#1f2937' }}>{value}</div>
                      <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{formatDate(row.orderDate)}</div>
                    </div>
                  )
                },
                {
                  key: 'vendorName',
                  header: 'Vendor',
                  sortable: true,
                  filterable: true
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span 
                      style={{ 
                        backgroundColor: getStatusColor(value),
                        color: 'white',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        fontSize: '0.75rem',
                        fontWeight: '500',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.25rem'
                      }}
                    >
                      {getStatusIcon(value)}
                      {getStatusName(value)}
                    </span>
                  )
                },
                {
                  key: 'totalAmount',
                  header: 'Order Value',
                  type: 'currency',
                  sortable: true,
                  align: 'right',
                  render: (value) => (
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatCurrency(value)}</span>
                  )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  sortable: false,
                  render: (value, row) => (
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      <PermissionGate permission={PERMISSIONS.VIEW_PURCHASE_ORDER}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleViewOrder(row)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </PermissionGate>
                      
                      <PermissionGate permission={PERMISSIONS.EDIT_PURCHASE_ORDER}>
                        <button 
                          className="btn btn-outline btn-sm"
                          onClick={() => handleEditOrder(row)}
                          title="Edit"
                          disabled={row.status === 'received' || row.status === 'completed'}
                        >
                          <Edit size={14} />
                        </button>
                      </PermissionGate>

                      <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE}>
                        {row.status === 'approved' && (
                          <button 
                            className="btn btn-success btn-sm"
                            onClick={() => handleReceiveOrder(row)}
                            title="Receive Order & Update Inventory"
                          >
                            <Package size={14} />
                          </button>
                        )}
                      </PermissionGate>

                      <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE}>
                        {(row.status === 'received' || row.status === 'completed') && (
                          <button 
                            className="btn btn-info btn-sm"
                            onClick={() => handleAddExpense(row)}
                            title="Add Purchase Expenses"
                          >
                            <DollarSign size={14} />
                          </button>
                        )}
                      </PermissionGate>
                    </div>
                  )
                }
              ]}
              title="Purchase Orders"
              subtitle={`${summary.total} orders • ${summary.pending} pending • ${formatCurrency(summary.totalValue)} total value`}
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              selectable={false}
              emptyMessage="No purchase orders found"
              className="purchase-orders-table"
            />
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-tab">
            <div className="tab-header">
              <h3>Purchase Expenses</h3>
              <p>Track transportation, loading, and other purchase-related costs</p>
            </div>

            <DataTable
              data={purchaseExpenses}
              columns={[
                {
                  key: 'orderNumber',
                  header: 'Order Number',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span style={{ fontWeight: '600', color: '#1f2937' }}>{value}</span>
                  )
                },
                {
                  key: 'category',
                  header: 'Category',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span style={{ 
                      backgroundColor: '#e0f2fe',
                      color: '#0369a1',
                      padding: '0.25rem 0.5rem',
                      borderRadius: '0.375rem',
                      fontSize: '0.75rem',
                      textTransform: 'capitalize'
                    }}>
                      {value.replace('_', ' ')}
                    </span>
                  )
                },
                {
                  key: 'description',
                  header: 'Description',
                  sortable: true,
                  filterable: true
                },
                {
                  key: 'vendor',
                  header: 'Service Provider',
                  sortable: true,
                  filterable: true
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  type: 'currency',
                  sortable: true,
                  render: (value) => (
                    <span style={{ fontWeight: '600', color: '#059669' }}>{formatCurrency(value)}</span>
                  )
                },
                {
                  key: 'expenseDate',
                  header: 'Date',
                  type: 'date',
                  sortable: true,
                  render: (value) => formatDate(value)
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className={`status-badge ${value}`}>
                      {value === 'approved' ? 'Approved' : value === 'pending' ? 'Pending' : 'Rejected'}
                    </span>
                  )
                }
              ]}
              title="Purchase Expenses"
              subtitle={`${purchaseExpenses.length} expenses • ${formatCurrency(summary.totalExpenses)} total`}
              loading={false}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              emptyMessage="No purchase expenses found"
              className="purchase-expenses-table"
            />
          </div>
        )}

        {activeTab === 'vendors' && (
          <div className="vendors-tab">
            <div className="tab-header">
              <h3>Vendor Management</h3>
              <p>Al Ramrami oil business uses the suppliers module for vendor management</p>
              <div className="redirect-info">
                <div className="redirect-message">
                  <Users size={24} />
                  <h4>Redirecting to Suppliers Module</h4>
                  <p>Vendor management for Al Ramrami is handled through the Suppliers module to eliminate duplication.</p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => window.location.href = '/suppliers'}
                  >
                    <Users size={16} />
                    Go to Suppliers Module
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'locations' && (
          <div className="locations-tab">
            <div className="tab-header">
              <h3>Storage Locations</h3>
              <p>Manage tank farms, warehouses, and storage facilities</p>
              <button 
                className="btn btn-primary"
                onClick={() => setShowLocationManager(true)}
              >
                <MapPin size={16} />
                Open Location Manager
              </button>
            </div>
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="analytics-tab">
            <div className="tab-header">
              <h3>Purchase Analytics</h3>
              <p>View purchase performance and cost analysis</p>
            </div>
            <div className="analytics-placeholder">
              <Calculator size={48} />
              <h4>Analytics Dashboard</h4>
              <p>Purchase analytics and cost breakdown will be displayed here.</p>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreateForm && (
        <PurchaseOrderForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleSaveOrder}
          suppliers={vendors}
          materials={materials}
          title="Create Purchase Order"
        />
      )}

      {showEditForm && selectedOrder && (
        <PurchaseOrderForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedOrder(null)
          }}
          onSave={handleSaveOrder}
          suppliers={vendors}
          materials={materials}
          initialData={selectedOrder}
          title="Edit Purchase Order"
          isEdit={true}
        />
      )}

      {showReceiptForm && selectedOrder && (
        <PurchaseOrderReceipt
          purchaseOrder={selectedOrder}
          isOpen={showReceiptForm}
          onClose={() => {
            setShowReceiptForm(false)
            setSelectedOrder(null)
          }}
          onReceive={handleReceiveSubmit}
          loading={receivingOrder}
        />
      )}

      {showExpenseForm && selectedOrder && (
        <PurchaseExpenseForm
          isOpen={showExpenseForm}
          onClose={() => {
            setShowExpenseForm(false)
            setSelectedOrder(null)
          }}
          onSave={handleSaveExpense}
          purchaseOrder={selectedOrder}
          title="Add Purchase Expenses"
        />
      )}

      {showVendorManager && (
        <VendorManager
          isOpen={showVendorManager}
          onClose={() => setShowVendorManager(false)}
        />
      )}

      {showLocationManager && (
        <StorageLocationManager
          isOpen={showLocationManager}
          onClose={() => setShowLocationManager(false)}
        />
      )}
    </div>
  )
}

export default Purchase