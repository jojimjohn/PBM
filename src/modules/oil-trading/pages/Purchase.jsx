import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import DataTable from '../../../components/ui/DataTable'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import { 
  Plus, Search, Filter, Eye, Edit, Truck, Package, 
  CheckCircle, Clock, AlertTriangle, FileText, Download 
} from 'lucide-react'
import '../styles/Purchase.css'

const Purchase = () => {
  const { selectedCompany } = useAuth()
  const { hasPermission } = usePermissions()
  const { formatDate, formatCurrency } = useSystemSettings()
  
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [orderStatuses, setOrderStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)

  useEffect(() => {
    loadPurchaseData()
  }, [selectedCompany])

  const loadPurchaseData = async () => {
    try {
      setLoading(true)
      
      // Load purchase orders
      const ordersResponse = await fetch('/data/purchase-orders.json')
      const ordersData = await ordersResponse.json()
      const companyOrders = ordersData.purchaseOrders.filter(
        order => order.companyId === selectedCompany?.id
      )
      setPurchaseOrders(companyOrders)
      setOrderStatuses(ordersData.orderStatuses)

      // Load vendors
      const vendorsResponse = await fetch('/data/vendors.json')
      const vendorsData = await vendorsResponse.json()
      const companyVendors = vendorsData.vendors[selectedCompany?.id] || []
      setVendors(companyVendors)

      // Load materials
      const materialsResponse = await fetch('/data/materials.json')
      const materialsData = await materialsResponse.json()
      const companyMaterials = materialsData.materials[selectedCompany?.id] || []
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

  const handleSaveOrder = async (orderData) => {
    try {
      setLoading(true)
      
      // In a real application, this would make an API call
      console.log('Saving purchase order:', orderData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (selectedOrder) {
        // Update existing order
        setPurchaseOrders(prev => prev.map(order => 
          order.id === orderData.id ? { ...orderData, updatedAt: new Date().toISOString() } : order
        ))
      } else {
        // Create new order
        const newOrder = {
          ...orderData,
          id: `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
          companyId: selectedCompany?.id,
          createdAt: new Date().toISOString(),
          createdBy: 'current_user' // Replace with actual user
        }
        setPurchaseOrders(prev => [newOrder, ...prev])
      }

      setShowCreateForm(false)
      setShowEditForm(false)
      setSelectedOrder(null)
      
    } catch (error) {
      console.error('Error saving purchase order:', error)
      alert('Failed to save purchase order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleViewOrder = (order) => {
    console.log('Viewing purchase order:', order)
    setSelectedOrder(order)
    // This could open a detail modal or navigate to detail page
    alert(`✅ Viewing details for order ${order.orderNumber}`)
  }

  const handleApproveOrder = async (order) => {
    console.log('Approving purchase order:', order)
    try {
      // Update order status to approved
      const updatedOrders = purchaseOrders.map(po => 
        po.id === order.id ? { ...po, status: 'approved' } : po
      )
      setPurchaseOrders(updatedOrders)
      alert(`✅ Purchase order ${order.orderNumber} approved successfully!`)
    } catch (error) {
      console.error('Error approving order:', error)
      alert(`❌ Failed to approve order: ${error.message}`)
    }
  }

  const handleDownloadOrder = (order) => {
    console.log('Downloading purchase order:', order)
    // This would generate and download a PDF or export the order
    alert(`✅ Downloading purchase order ${order.orderNumber}`)
  }

  const calculateOrderSummary = () => {
    const summary = {
      total: purchaseOrders.length,
      pending: purchaseOrders.filter(o => o.status === 'pending').length,
      approved: purchaseOrders.filter(o => o.status === 'approved').length,
      delivered: purchaseOrders.filter(o => o.status === 'delivered').length,
      totalValue: purchaseOrders.reduce((sum, order) => sum + (order.totalAmount || 0), 0)
    }
    return summary
  }

  // DataTable handles filtering internally, no need for manual filtering

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

  if (loading && purchaseOrders.length === 0) {
    return (
      <div className="purchase-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading purchase orders...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="purchase-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>Purchase Orders</h1>
          <p>Manage vendor orders and procurement for {selectedCompany?.name}</p>
        </div>
        
        <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE_ORDER}>
          <div className="page-actions">
            <button 
              className="btn btn-primary"
              onClick={handleCreateOrder}
            >
              <Plus size={20} />
              New Purchase Order
            </button>
          </div>
        </PermissionGate>
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
            <h3>Approved Orders</h3>
            <p className="summary-number">{summary.approved}</p>
            <p className="summary-change">Ready for delivery</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon value">
            <Package size={24} />
          </div>
          <div className="summary-content">
            <h3>Total Value</h3>
            <p className="summary-number">{formatCurrency(summary.totalValue)}</p>
            <p className="summary-change">This period</p>
          </div>
        </div>
      </div>

      {/* Purchase Orders DataTable */}
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
            key: 'itemsCount',
            header: 'Items',
            type: 'number',
            sortable: true,
            render: (value, row) => (
              <div>
                <div style={{ fontWeight: '500' }}>{value} items</div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>{row.itemsSummary}</div>
              </div>
            )
          },
          {
            key: 'totalAmount',
            header: 'Total Amount',
            type: 'currency',
            sortable: true,
            align: 'right',
            render: (value) => (
              <span style={{ fontWeight: '600', color: '#1f2937' }}>{formatCurrency(value)}</span>
            )
          },
          {
            key: 'expectedDeliveryDate',
            header: 'Expected Delivery',
            type: 'date',
            sortable: true,
            render: (value) => (
              <span style={{ color: value ? '#1f2937' : '#6b7280' }}>
                {value ? formatDate(value) : 'TBD'}
              </span>
            )
          },
          {
            key: 'actions',
            header: 'Actions',
            sortable: false,
            render: (value, row) => (
              <div style={{ display: 'flex', gap: '0.25rem' }}>
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
                  >
                    <Edit size={14} />
                  </button>
                </PermissionGate>
                
                <PermissionGate permission={PERMISSIONS.APPROVE_PURCHASE_ORDER}>
                  {row.status === 'pending' && (
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleApproveOrder(row)}
                      title="Approve"
                    >
                      <CheckCircle size={14} />
                    </button>
                  )}
                </PermissionGate>

                <button 
                  className="btn btn-outline btn-sm"
                  onClick={() => handleDownloadOrder(row)}
                  title="Download"
                >
                  <Download size={14} />
                </button>
              </div>
            )
          }
        ]}
        title="Purchase Orders"
        subtitle={`${summary.total} orders • ${summary.pending} pending • ${summary.approved} approved`}
        loading={loading}
        searchable={true}
        filterable={true}
        sortable={true}
        paginated={true}
        exportable={true}
        selectable={false}
        emptyMessage="No purchase orders found"
        className="purchase-orders-table"
        initialPageSize={15}
        stickyHeader={true}
        enableColumnToggle={true}
      />

      {/* Create Purchase Order Modal */}
      {showCreateForm && (
        <PurchaseOrderForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleSaveOrder}
          vendors={vendors}
          materials={materials}
          title="Create Purchase Order"
        />
      )}

      {/* Edit Purchase Order Modal */}
      {showEditForm && selectedOrder && (
        <PurchaseOrderForm
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedOrder(null)
          }}
          onSave={handleSaveOrder}
          vendors={vendors}
          materials={materials}
          initialData={selectedOrder}
          title="Edit Purchase Order"
          isEdit={true}
        />
      )}
    </div>
  )
}

export default Purchase