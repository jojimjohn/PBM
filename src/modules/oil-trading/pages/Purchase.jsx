import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import useProjects from '../../../hooks/useProjects'
import useExpenseCategories from '../../../hooks/useExpenseCategories'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import DataTable from '../../../components/ui/DataTable'
import Modal from '../../../components/ui/Modal'
import DateInput from '../../../components/ui/DateInput'
import PurchaseOrderForm from '../components/PurchaseOrderForm'
import PurchaseOrderReceipt from '../../../components/PurchaseOrderReceipt'
import PurchaseExpenseForm from '../../../components/PurchaseExpenseForm'
import VendorManager from '../../../components/VendorManager'
import StorageLocationManager from '../../../components/StorageLocationManager'
import PurchaseInvoiceModal from '../../../components/PurchaseInvoiceModal'
import PurchaseOrderAmendmentModal from '../../../components/PurchaseOrderAmendmentModal'
import PurchaseOrderViewModal from '../../../components/PurchaseOrderViewModal'
import CalloutManager from '../../../components/collections/CalloutManager'
import DocumentUpload from '../../../components/DocumentUpload'
import WorkflowStepper from '../../../components/purchase/WorkflowStepper'
import GroupedBillsTable from '../../../components/bills/GroupedBillsTable'
import VendorBillModal from '../../../components/bills/VendorBillModal'
import ExpenseViewModal from '../../../components/expenses/ExpenseViewModal'
import EmptyState from '../../../components/ui/EmptyState'
import purchaseOrderService from '../../../services/purchaseOrderService'
import purchaseOrderAmendmentService from '../../../services/purchaseOrderAmendmentService'
import purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import expenseService from '../../../services/expenseService'
import purchaseOrderExpenseService from '../../../services/purchaseOrderExpenseService'
import dataCacheService from '../../../services/dataCacheService'
// Custom hooks for purchase data management
import { usePurchaseOrders, usePurchaseBills, usePurchaseExpenses } from '../hooks'
import {
  Plus, Search, Filter, Eye, Edit, Edit3, Truck, Package,
  CheckCircle, Clock, AlertTriangle, FileText, Download,
  Banknote, MapPin, Building, Calculator, Receipt,
  Users, Settings, Paperclip, Image, Trash2, RefreshCw
} from 'lucide-react'
// CSS migrated to inline Tailwind - Purchase.css deleted

const Purchase = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()
  const { formatDate, formatCurrency } = useSystemSettings()
  const { selectedProjectId, getProjectQueryParam } = useProjects()
  // Load expense categories from database for display labels
  // Purchase expenses use 'operational' type categories from the database
  const { getCategoryLabel: getPurchaseCategoryLabel } = useExpenseCategories('operational')
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab management - read from URL params or default to 'collections'
  const initialTab = searchParams.get('tab') || 'collections'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Read search param from URL (used when clicking tasks from dashboard)
  const urlSearchTerm = searchParams.get('search') || ''

  // Sync URL params when tab or search changes
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams])


  // =====================================================
  // CUSTOM HOOKS - Data management extracted for reuse
  // =====================================================

  // Purchase Orders Hook - handles orders, pagination, vendors, materials
  const {
    orders: purchaseOrders,
    loading: ordersLoading,
    pagination: ordersPagination,
    amendmentCounts,
    vendors,
    materials,
    orderStatuses,
    loadOrders: loadPurchaseOrders,
    loadFullData: loadPurchaseData,
    updateOrder: hookUpdateOrder,
    receiveOrder: hookReceiveOrder,
    setOrders: setPurchaseOrders,
    updatePagination: setOrdersPagination
  } = usePurchaseOrders({
    initialLimit: 10,
    initialSearch: urlSearchTerm,
    getProjectQueryParam
  })

  // Purchase Bills Hook - handles bills, filters, grouping
  const {
    bills,
    loading: billsLoading,
    summary: billSummary,
    groupedBills: groupedBillsData,
    filters: billFilters,
    loadBills,
    setFilters: setBillFilters,
    recordPayment: hookRecordPayment,
    createVendorBill: hookCreateVendorBill,
    updateBill: hookUpdateBill,
    updateCompanyBillStatus: hookUpdateCompanyBillStatus
  } = usePurchaseBills({ getProjectQueryParam })

  // Purchase Expenses Hook - handles expenses CRUD
  const {
    expenses: purchaseExpenses,
    loading: expensesLoading,
    loadExpenses,
    createExpense: hookCreateExpense,
    deleteExpense: hookDeleteExpense,
    uploadReceipt: hookUploadReceipt,
    removeReceipt: hookRemoveReceipt,
    setExpenses: setPurchaseExpenses
  } = usePurchaseExpenses({ getProjectQueryParam })

  // Combined loading state for UI
  const loading = ordersLoading

  // Helper accessors for bill filters (maintaining backward compatibility)
  const billTypeFilter = billFilters.billType
  const billPaymentFilter = billFilters.paymentStatus
  const setBillTypeFilter = (value) => setBillFilters({ billType: value })
  const setBillPaymentFilter = (value) => setBillFilters({ paymentStatus: value })
  
  // Modal states
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [viewingOrder, setViewingOrder] = useState(null)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showReceiptForm, setShowReceiptForm] = useState(false)
  const [showExpenseForm, setShowExpenseForm] = useState(false)
  const [showVendorManager, setShowVendorManager] = useState(false)
  const [showLocationManager, setShowLocationManager] = useState(false)
  const [receivingOrder, setReceivingOrder] = useState(false)

  // Sprint 4: New modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false)
  const [showAmendmentModal, setShowAmendmentModal] = useState(false)
  const [selectedOrderForModal, setSelectedOrderForModal] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  // Phase 1.5: Bills modal states
  const [showVendorBillModal, setShowVendorBillModal] = useState(false)
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [showBillDetailsModal, setShowBillDetailsModal] = useState(false)
  const [selectedBill, setSelectedBill] = useState(null)
  const [editingVendorBill, setEditingVendorBill] = useState(null)

  // Expense view modal states
  const [showExpenseViewModal, setShowExpenseViewModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState(null)

  // Track previous state to detect actual changes (prevents duplicate loads)
  const prevStateRef = React.useRef({ activeTab: null, projectId: null, companyId: null })

  /**
   * CONSOLIDATED DATA LOADING (Performance Fix - Jan 2026)
   *
   * PROBLEM: Multiple useEffects were firing simultaneously on mount, causing:
   * - 2-3x API calls on page load
   * - Project filter middleware running multiple times per navigation
   *
   * SOLUTION: Single effect that:
   * 1. Tracks what actually changed (tab vs project vs company)
   * 2. Loads only the data needed for the current tab
   * 3. Prevents duplicate loads on mount
   */
  useEffect(() => {
    const prev = prevStateRef.current
    const companyChanged = prev.companyId !== selectedCompany?.id
    const projectChanged = prev.projectId !== selectedProjectId
    const tabChanged = prev.activeTab !== activeTab

    // Update ref for next comparison
    prevStateRef.current = {
      activeTab,
      projectId: selectedProjectId,
      companyId: selectedCompany?.id
    }

    // Skip if nothing actually changed (prevents duplicate on mount)
    if (!companyChanged && !projectChanged && !tabChanged && prev.activeTab !== null) {
      return
    }

    // Load data based on active tab
    switch (activeTab) {
      case 'orders':
      case 'collections':
        // Orders and collections share the same data
        loadPurchaseData()
        break
      case 'bills':
        // Load bills when tab is active or project/company changed
        loadBills()
        // Also load orders for reference data (vendor names, etc.)
        if (companyChanged || projectChanged || prev.activeTab === null) {
          loadPurchaseData()
        }
        break
      case 'expenses':
        loadExpenses()
        // Also load orders for reference data
        if (companyChanged || projectChanged || prev.activeTab === null) {
          loadPurchaseData()
        }
        break
      default:
        loadPurchaseData()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCompany?.id, selectedProjectId, activeTab])

  // Handle bill filter changes separately (only when on bills tab)
  useEffect(() => {
    if (activeTab === 'bills' && prevStateRef.current.activeTab === 'bills') {
      loadBills()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [billTypeFilter, billPaymentFilter])

  // Handle URL search param changes (from dashboard task navigation)
  useEffect(() => {
    // If URL has a search param and it differs from current state, trigger reload
    if (urlSearchTerm) {
      // Update pagination search and reload data
      setOrdersPagination(prev => {
        if (prev.search !== urlSearchTerm) {
          // Trigger reload with new search term
          loadPurchaseOrders({ search: urlSearchTerm, page: 1 })
          return { ...prev, search: urlSearchTerm, page: 1 }
        }
        return prev
      })
    }
  }, [urlSearchTerm])

  // Bill summary and grouping are now provided by usePurchaseBills hook
  // - billSummary: calculated summary statistics
  // - groupedBillsData: { groupedBills, orphanBills } for hierarchical display

  // Helper to get PO order number from ID
  const getPOOrderNumber = (poId) => {
    const po = purchaseOrders.find(p => p.id === poId);
    return po?.orderNumber || `PO #${poId}`;
  };

  // Handle bill payment modal
  const handleRecordPayment = (bill) => {
    setSelectedBill(bill)
    setShowPaymentModal(true)
  }

  // Handle payment submission
  const handlePaymentSubmit = async (paymentData) => {
    if (!selectedBill) return

    try {
      const result = await purchaseInvoiceService.recordPayment(selectedBill.id, paymentData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Payment recorded successfully' })
        setShowPaymentModal(false)
        setSelectedBill(null)
        loadBills() // Reload bills
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to record payment' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to record payment' })
    }
  }

  // Handle vendor bill creation
  const handleCreateVendorBill = async (vendorBillData) => {
    try {
      const result = await purchaseInvoiceService.createVendorBill(vendorBillData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Vendor bill created successfully' })
        setShowVendorBillModal(false)
        setEditingVendorBill(null)
        loadBills() // Reload bills to show new vendor bill
      } else {
        throw new Error(result.error || 'Failed to create vendor bill')
      }
    } catch (error) {
      throw error // Re-throw to let modal handle the error
    }
  }

  // Handle vendor bill editing
  const handleEditVendorBill = (bill) => {
    setEditingVendorBill(bill)
    setShowVendorBillModal(true)
  }

  // Handle vendor bill update
  const handleUpdateVendorBill = async (billId, updateData) => {
    try {
      const result = await purchaseInvoiceService.update(billId, updateData)
      if (result.success) {
        setMessage({ type: 'success', text: 'Vendor bill updated successfully' })
        setShowVendorBillModal(false)
        setEditingVendorBill(null)
        loadBills() // Reload bills to show updated data
      } else {
        throw new Error(result.error || 'Failed to update vendor bill')
      }
    } catch (error) {
      throw error // Re-throw to let modal handle the error
    }
  }

  // Handle marking a company bill as "sent" (new workflow)
  const handleMarkAsSent = async (bill) => {
    try {
      const result = await purchaseInvoiceService.updateCompanyBillStatus(bill.id, 'sent')
      if (result.success) {
        setMessage({ type: 'success', text: `Company bill ${bill.invoice_number} marked as sent` })
        loadBills() // Reload bills to show updated status
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update bill status' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update bill status' })
    }
  }

  const handleCreateOrder = () => {
    setShowCreateForm(true)
  }

  const handleEditOrder = async (order) => {
    try {
      // Fetch full order details with items from backend
      const result = await purchaseOrderService.getById(order.id)

      if (result.success) {
        setSelectedOrder(result.data)
        setShowEditForm(true)
      } else {
        throw new Error(result.error || 'Failed to load order details')
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: `Failed to load order: ${error.message}`
      })
    }
  }

  const handleReceiveOrder = (order) => {
    setSelectedOrder(order)
    setShowReceiptForm(true)
  }

  const handleAddExpense = (order) => {
    setSelectedOrder(order)
    setShowExpenseForm(true)
  }

  // Sprint 4: Invoice and Amendment handlers
  const handleShowInvoices = (order) => {
    setSelectedOrderForModal(order)
    setShowInvoiceModal(true)
  }

  const handleShowAmendments = async (order) => {
    try {
      // Fetch full order details with items
      const result = await purchaseOrderService.getById(order.id)

      if (result.success) {
        setSelectedOrderForModal(result.data)
        setShowAmendmentModal(true)
      } else {
        alert('Failed to load purchase order details: ' + (result.error || 'Unknown error'))
      }
    } catch (error) {
      alert('Failed to load purchase order details')
    }
  }

  const handleInvoiceSuccess = () => {
    // Refresh data after invoice operations
    loadPurchaseData()
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
      alert('Failed to receive purchase order. Please try again.')
    } finally {
      setReceivingOrder(false)
    }
  }

  const handleSaveOrder = async (orderData) => {
    try {
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
      alert('Failed to save purchase order. Please try again.')
    }
  }

  const handleSaveExpense = async (expenseData) => {
    try {
      // Handle multiple expenses if provided
      const expenses = expenseData.expenses || [expenseData]
      const savedExpenses = []

      for (const expense of expenses) {
        const result = await purchaseOrderExpenseService.createExpense(selectedOrder.id, {
          category: expense.category,
          description: expense.description,
          amount: parseFloat(expense.amount),
          expenseDate: expense.expenseDate || new Date().toISOString().split('T')[0],
          vendor: expense.vendor || '',
          referenceNumber: expense.receiptNumber || expense.referenceNumber || '',
          notes: expense.notes || '',
          receiptPhoto: expense.receiptPhoto || null
        })

        if (!result.success) {
          throw new Error(result.error || 'Failed to create expense')
        }
        savedExpenses.push({
          ...result.data,
          orderNumber: selectedOrder.orderNumber
        })
      }

      // Add to local state for immediate display
      setPurchaseExpenses(prev => [...prev, ...savedExpenses])

      setShowExpenseForm(false)
      setSelectedOrder(null)
      alert('Purchase expenses added successfully!')
    } catch (error) {
      alert(`Failed to save expense: ${error.message}`)
    }
  }

  // Delete expense handler
  const handleDeleteExpense = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return

    try {
      const result = await purchaseOrderExpenseService.deleteExpense(expenseId)
      if (result.success) {
        setPurchaseExpenses(prev => prev.filter(e => e.id !== expenseId))
        alert('Expense deleted successfully!')
      } else {
        throw new Error(result.error || 'Failed to delete expense')
      }
    } catch (error) {
      alert(`Failed to delete expense: ${error.message}`)
    }
  }

  // Upload receipt handler for expense
  const handleUploadExpenseReceipt = async (expenseId, receiptData) => {
    try {
      const expense = purchaseExpenses.find(e => e.id === expenseId)
      if (!expense) throw new Error('Expense not found')

      const result = await purchaseOrderExpenseService.updateExpense(expenseId, {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        vendor: expense.vendor || '',
        referenceNumber: expense.receiptNumber || '',
        notes: expense.notes || '',
        receiptPhoto: receiptData
      })

      if (result.success) {
        // Update local state
        setPurchaseExpenses(prev => prev.map(e =>
          e.id === expenseId ? { ...e, receiptPhoto: receiptData } : e
        ))
        // Update selected expense if viewing
        if (selectedExpense?.id === expenseId) {
          setSelectedExpense(prev => ({ ...prev, receiptPhoto: receiptData }))
        }
        alert('Receipt uploaded successfully!')
      } else {
        throw new Error(result.error || 'Failed to upload receipt')
      }
    } catch (error) {
      throw error
    }
  }

  // Remove receipt handler for expense
  const handleRemoveExpenseReceipt = async (expenseId) => {
    try {
      const expense = purchaseExpenses.find(e => e.id === expenseId)
      if (!expense) throw new Error('Expense not found')

      const result = await purchaseOrderExpenseService.updateExpense(expenseId, {
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        expenseDate: expense.expenseDate,
        vendor: expense.vendor || '',
        referenceNumber: expense.receiptNumber || '',
        notes: expense.notes || '',
        receiptPhoto: null
      })

      if (result.success) {
        // Update local state
        setPurchaseExpenses(prev => prev.map(e =>
          e.id === expenseId ? { ...e, receiptPhoto: null } : e
        ))
        // Update selected expense if viewing
        if (selectedExpense?.id === expenseId) {
          setSelectedExpense(prev => ({ ...prev, receiptPhoto: null }))
        }
        alert('Receipt removed successfully!')
      } else {
        throw new Error(result.error || 'Failed to remove receipt')
      }
    } catch (error) {
      throw error
    }
  }

  const handleViewOrder = async (order) => {
    try {
      // Fetch full order details including items
      const result = await purchaseOrderService.getById(order.id)
      if (result.success && result.data) {
        setViewingOrder(result.data)
      } else {
        alert(`❌ Failed to load order details: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      alert(`❌ Failed to load order details: ${error.message}`)
    }
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
      alert(`❌ Failed to update status: ${error.message}`)
    }
  }

  const handleDownloadOrder = (order) => {
    alert(`✅ Downloading purchase order ${order.orderNumber}`)
  }

  // Server-side pagination handlers for DataTable
  const handleOrdersPageChange = useCallback((newPage) => {
    loadPurchaseOrders({ page: newPage })
  }, [loadPurchaseOrders])

  const handleOrdersSort = useCallback((sortBy, sortOrder) => {
    loadPurchaseOrders({ sortBy, sortOrder, page: 1 })
  }, [loadPurchaseOrders])

  const handleOrdersSearch = useCallback((search) => {
    loadPurchaseOrders({ search, page: 1 })
  }, [loadPurchaseOrders])

  const handleOrdersPageSizeChange = useCallback((limit) => {
    loadPurchaseOrders({ limit, page: 1 })
  }, [loadPurchaseOrders])

  const calculateOrderSummary = () => {
    const summary = {
      // Use server-provided total for accurate count (not just current page)
      total: ordersPagination.total || purchaseOrders.length,
      // Note: These counts are from the current page only when using server-side pagination
      // For accurate totals, these would need to come from the server
      pending: purchaseOrders.filter(o => o.status === 'draft' || o.status === 'pending').length,
      approved: purchaseOrders.filter(o => o.status === 'approved' || o.status === 'sent').length,
      delivered: purchaseOrders.filter(o => o.status === 'received' || o.status === 'completed').length,
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

  // Tabs ordered by workflow: Collections → PO → Bills → Expenses
  const tabs = [
    { id: 'collections', name: t('collections'), icon: Package },
    { id: 'orders', name: t('purchaseOrders'), icon: FileText },
    { id: 'bills', name: t('bills'), icon: Receipt },
    { id: 'expenses', name: t('purchaseExpenses'), icon: Banknote }
  ]

  // billSummary is now provided by usePurchaseBills hook

  return (
    <div className="page-container">
      {/* Message Toast */}
      {message.text && (
        <div
          className={`flex items-center gap-3 px-5 py-3.5 rounded-lg mb-6 cursor-pointer transition-all ${
            message.type === 'success'
              ? 'bg-gradient-to-br from-emerald-50 to-emerald-100 border border-emerald-300 text-emerald-800'
              : 'bg-gradient-to-br from-red-50 to-red-100 border border-red-300 text-red-800'
          }`}
          onClick={() => setMessage({ type: '', text: '' })}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span className="flex-1 text-sm font-medium">{message.text}</span>
          <button className="bg-transparent border-none text-xl leading-none opacity-60 cursor-pointer px-1 hover:opacity-100">×</button>
        </div>
      )}

      {/* Workflow Guidance - Shows purchase workflow progression */}
      <WorkflowStepper
        activeTab={activeTab}
        onStepClick={(tab) => setActiveTab(tab)}
      />

      {/* Tab Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => {
          const IconComponent = tab.icon
          // Map tab IDs to data-tour attributes for workflow guides
          const tourIdMap = {
            collections: 'collections-tab',
            orders: 'purchase-orders-tab',
            bills: 'bills-tab',
            expenses: 'expenses-tab'
          }
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              data-tour={tourIdMap[tab.id] || undefined}
            >
              <IconComponent size={16} />
              {tab.name}
            </button>
          )
        })}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'orders' && (
          <div className="orders-tab">
            {/* Summary Cards */}
            <div className="summary-cards">
              <div className="summary-card">
                <div className="summary-icon info">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="summary-value">{summary.total}</div>
                  <div className="summary-label">Total Orders</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon warning">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="summary-value">{summary.pending}</div>
                  <div className="summary-label">Pending Orders</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon success">
                  <CheckCircle size={22} />
                </div>
                <div>
                  <div className="summary-value">{formatCurrency(summary.totalValue)}</div>
                  <div className="summary-label">Order Value</div>
                </div>
              </div>

              <div className="summary-card">
                <div className="summary-icon">
                  <Banknote size={22} />
                </div>
                <div>
                  <div className="summary-value">{formatCurrency(summary.totalExpenses)}</div>
                  <div className="summary-label">Total Expenses</div>
                </div>
              </div>
            </div>

            {!loading && purchaseOrders.length === 0 ? (
              <EmptyState
                iconName="package"
                title={t('noPurchaseOrdersFound')}
                description={t('purchaseOrdersEmptyDescription')}
                action={
                  <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE_ORDER}>
                    <button className="empty-action-btn" onClick={handleCreateOrder}>
                      <Plus size={16} />
                      {t('newPurchaseOrder')}
                    </button>
                  </PermissionGate>
                }
              />
            ) : (
            <DataTable
              headerActions={
                <div className="flex items-center gap-2">
                  <button
                    className="btn btn-outline"
                    onClick={() => loadPurchaseData()}
                    disabled={loading}
                    title="Refresh"
                  >
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                  </button>
                  <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE_ORDER}>
                    <button
                      className="btn btn-primary"
                      onClick={handleCreateOrder}
                      data-tour="new-po-button"
                    >
                      <Plus size={20} />
                      New Purchase Order
                    </button>
                  </PermissionGate>
                </div>
              }
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
                      <strong>{value}</strong>
                      {amendmentCounts[row.id] > 0 && (
                        <span
                          className="tab-count"
                          title={`${amendmentCounts[row.id]} amendment${amendmentCounts[row.id] > 1 ? 's' : ''}`}
                        >
                          {amendmentCounts[row.id]}
                        </span>
                      )}
                      <div className="text-muted">{formatDate(row.orderDate)}</div>
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
                        <span className="status-badge info" title={`Auto-generated from WCN ${row.wcn_number || ''}`}>
                          <Truck size={12} />
                          AUTO
                        </span>
                      );
                    } else {
                      return (
                        <span className="status-badge neutral" title={row.collection_order_id ? `Linked to WCN ${row.wcn_number || ''}` : 'Manually created'}>
                          <Edit3 size={12} />
                          MANUAL
                        </span>
                      );
                    }
                  }
                },
                {
                  key: 'vendorName',
                  header: 'Vendor',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <span>{row.vendorInfo?.name || row.vendorName || row.supplierName || '-'}</span>
                  )
                },
                {
                  key: 'status',
                  header: 'Status',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className={`status-badge ${value}`}>
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
                    <strong>{formatCurrency(value)}</strong>
                  )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  sortable: false,
                  render: (value, row) => (
                    <div className="table-actions">
                      <PermissionGate permission={PERMISSIONS.VIEW_PURCHASE_ORDER}>
                        <button
                          className="table-action-btn view"
                          onClick={() => handleViewOrder(row)}
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </PermissionGate>

                      <PermissionGate permission={PERMISSIONS.EDIT_PURCHASE_ORDER}>
                        <button
                          className="table-action-btn edit"
                          onClick={() => handleEditOrder(row)}
                          title={row.status === 'draft' ? 'Edit' : 'Only draft orders can be edited directly'}
                          disabled={row.status !== 'draft'}
                        >
                          <Edit size={14} />
                        </button>
                      </PermissionGate>

                      <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE}>
                        {row.status === 'approved' && (
                          <button
                            className="table-action-btn activate"
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
                            className="table-action-btn payment"
                            onClick={() => handleAddExpense(row)}
                            title="Add Purchase Expenses"
                          >
                            <Banknote size={14} />
                          </button>
                        )}
                      </PermissionGate>

                      {/* Sprint 4: Invoices button */}
                      <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE}>
                        {(row.status === 'received' || row.status === 'completed') && (
                          <button
                            className="table-action-btn view"
                            onClick={() => handleShowInvoices(row)}
                            title="Manage Invoices"
                          >
                            <Receipt size={14} />
                          </button>
                        )}
                      </PermissionGate>

                      {/* Sprint 4: Amendments button - hidden for WCN auto-generated POs */}
                      {row.source_type !== 'wcn_auto' && (
                        <PermissionGate permission={PERMISSIONS.VIEW_PURCHASE}>
                          <button
                            className="table-action-btn view"
                            onClick={() => handleShowAmendments(row)}
                            title="View Amendment History"
                          >
                            <FileText size={14} />
                          </button>
                        </PermissionGate>
                      )}
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
              // Server-side pagination props - data comes pre-paginated from API
              serverSide={true}
              totalRows={ordersPagination.total}
              currentServerPage={ordersPagination.page}
              onPageChange={handleOrdersPageChange}
              onSort={handleOrdersSort}
              onSearch={handleOrdersSearch}
              onPageSizeChange={handleOrdersPageSizeChange}
              initialSearchTerm={urlSearchTerm}
            />
            )}
          </div>
        )}

        {/* Phase 1.5: Bills Tab */}
        {activeTab === 'bills' && (
          <div className="bills-tab">
            {/* Bills Header - Using global data-table-header style */}
            <div className="data-table-header">
              <div className="header-content">
                <h2 className="data-table-title">{t('bills')}</h2>
                <p className="data-table-subtitle">
                  {billSummary.companyBills} {t('companyBills')} • {billSummary.vendorBills} {t('vendorBills')} • {billSummary.unpaid} {t('unpaid')} • {billSummary.overdue} {t('overdue')} • {formatCurrency(billSummary.balanceDue)} {t('balanceDue')}
                </p>
              </div>
              <div className="header-actions">
                <button
                  className="btn btn-icon"
                  onClick={() => loadBills()}
                  title={t('refresh')}
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingVendorBill(null)
                    setShowVendorBillModal(true)
                  }}
                >
                  <Plus size={16} />
                  {t('createVendorBill')}
                </button>
              </div>
            </div>

            {/* Bills Filters - Using global data-table-toolbar style */}
            <div className="data-table-toolbar">
              <div className="toolbar-left">
                <div className="filter-group">
                  <select
                    className="filter-select"
                    value={billTypeFilter}
                    onChange={(e) => setBillTypeFilter(e.target.value)}
                  >
                    <option value="all">{t('allBills')}</option>
                    <option value="company">{t('companyBills')}</option>
                    <option value="vendor">{t('vendorBills')}</option>
                  </select>
                </div>
                <div className="filter-group">
                  <select
                    className="filter-select"
                    value={billPaymentFilter}
                    onChange={(e) => setBillPaymentFilter(e.target.value)}
                  >
                    <option value="all">{t('allStatuses')}</option>
                    <option value="unpaid">{t('unpaid')}</option>
                    <option value="partial">{t('partiallyPaid')}</option>
                    <option value="paid">{t('paid')}</option>
                    <option value="overdue">{t('overdue')}</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Grouped Bills Table */}
            {billsLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>{t('loadingBills')}</p>
              </div>
            ) : !billsLoading && bills.length === 0 ? (
              <EmptyState
                iconName="document"
                title={t('noBillsFound')}
                description={t('billsEmptyDescription')}
              />
            ) : (
              <GroupedBillsTable
                groupedBills={groupedBillsData.groupedBills}
                orphanBills={groupedBillsData.orphanBills}
                onViewDetails={(bill) => {
                  setSelectedBill(bill)
                  setShowBillDetailsModal(true)
                }}
                onRecordPayment={handleRecordPayment}
                onEditVendorBill={handleEditVendorBill}
                onMarkAsSent={handleMarkAsSent}
                formatCurrency={formatCurrency}
                formatDate={formatDate}
              />
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-tab">
            {!loading && purchaseExpenses.length === 0 ? (
              <EmptyState
                iconName="document"
                title={t('noPurchaseExpensesFound')}
                description={t('purchaseExpensesEmptyDescription')}
              />
            ) : (
            <DataTable
              data={purchaseExpenses}
              columns={[
                {
                  key: 'orderNumber',
                  header: 'PO Number',
                  sortable: true,
                  filterable: true,
                  render: (value) => <strong>{value || '-'}</strong>
                },
                {
                  key: 'category',
                  header: 'Category',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className="status-badge confirmed">
                      {getPurchaseCategoryLabel(value)}
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
                  filterable: true,
                  render: (value, row) => (
                    <span>{value || row.vendorName || row.supplierName || '-'}</span>
                  )
                },
                {
                  key: 'amount',
                  header: 'Amount',
                  type: 'currency',
                  sortable: true,
                  render: (value) => (
                    <span className="text-success font-semibold">{formatCurrency(value)}</span>
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
                  filterOptions: [
                    { value: 'recorded', label: 'Recorded' },
                    { value: 'approved', label: 'Approved' },
                    { value: 'pending', label: 'Pending' },
                    { value: 'rejected', label: 'Rejected' }
                  ],
                  render: (value, row) => {
                    const displayStatus = value || (row.referenceType === 'purchase_order' ? 'recorded' : 'pending')
                    const statusClass = {
                      approved: 'delivered',
                      recorded: 'confirmed',
                      pending: 'pending',
                      rejected: 'cancelled'
                    }[displayStatus] || 'pending'
                    return (
                      <span className={`status-badge ${statusClass}`}>
                        {displayStatus === 'recorded' ? 'Recorded' :
                         displayStatus === 'approved' ? 'Approved' :
                         displayStatus === 'pending' ? 'Pending' : 'Rejected'}
                      </span>
                    )
                  }
                },
                {
                  key: 'receiptPhoto',
                  header: 'Receipt',
                  sortable: false,
                  render: (value) => {
                    if (value) {
                      const isPDF = value.startsWith('data:application/pdf')
                      return (
                        <button
                          onClick={() => {
                            // For base64 data, create a blob and open it
                            if (value.startsWith('data:')) {
                              const newWindow = window.open()
                              if (newWindow) {
                                if (isPDF) {
                                  newWindow.document.write(`<embed src="${value}" width="100%" height="100%" type="application/pdf" />`)
                                } else {
                                  newWindow.document.write(`<html><head><title>Receipt</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;"><img src="${value}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></body></html>`)
                                }
                                newWindow.document.close()
                              }
                            } else {
                              window.open(value, '_blank')
                            }
                          }}
                          className="table-action-btn view"
                          title={isPDF ? 'View PDF Document' : 'View Receipt Image'}
                        >
                          {isPDF ? <FileText size={14} /> : <Receipt size={14} />}
                        </button>
                      )
                    }
                    return <span className="text-muted">-</span>
                  }
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  sortable: false,
                  width: '140px',
                  render: (value, row) => (
                    <div className="table-actions">
                      <button
                        onClick={() => {
                          setSelectedExpense(row)
                          setShowExpenseViewModal(true)
                        }}
                        className="table-action-btn view"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(row.id)}
                        className="table-action-btn delete"
                        title="Delete Expense"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                }
              ]}
              title="Purchase Expenses"
              subtitle={`${purchaseExpenses.length} expenses • ${formatCurrency(summary.totalExpenses)} total`}
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              emptyMessage="No purchase expenses found"
              className="purchase-expenses-table"
              initialSearchTerm={urlSearchTerm}
            />
            )}
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="collections-tab">
            <CalloutManager />
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

      {/* Sprint 4.5: Enhanced Purchase Order View Modal */}
      <PurchaseOrderViewModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        orderData={viewingOrder}
        onEdit={(order) => {
          setSelectedOrder(order)
          setShowEditForm(true)
          setViewingOrder(null)
        }}
        onRefresh={loadPurchaseData}
        t={(key) => key}
      />

      {/* Sprint 4: Invoice Modal */}
      {showInvoiceModal && (
        <PurchaseInvoiceModal
          isOpen={showInvoiceModal}
          onClose={() => {
            setShowInvoiceModal(false)
            setSelectedOrderForModal(null)
          }}
          purchaseOrder={selectedOrderForModal}
          onSuccess={handleInvoiceSuccess}
        />
      )}

      {/* Sprint 4: Amendment Modal */}
      {showAmendmentModal && (
        <PurchaseOrderAmendmentModal
          isOpen={showAmendmentModal}
          onClose={() => {
            setShowAmendmentModal(false)
            setSelectedOrderForModal(null)
          }}
          purchaseOrder={selectedOrderForModal}
          vendors={vendors}
          materials={materials}
          onSuccess={loadPurchaseData}
        />
      )}

      {/* Phase 1.5: Payment Recording Modal */}
      {showPaymentModal && selectedBill && (
        <Modal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false)
            setSelectedBill(null)
          }}
          title={`Record Payment - ${selectedBill.invoice_number}`}
          size="md"
        >
          <PaymentForm
            bill={selectedBill}
            onSubmit={handlePaymentSubmit}
            onCancel={() => {
              setShowPaymentModal(false)
              setSelectedBill(null)
            }}
            formatCurrency={formatCurrency}
          />
        </Modal>
      )}

      {/* Phase 1.5: Bill Details Modal */}
      {showBillDetailsModal && selectedBill && (
        <Modal
          isOpen={showBillDetailsModal}
          onClose={() => {
            setShowBillDetailsModal(false)
            setSelectedBill(null)
          }}
          title={`Bill Details - ${selectedBill.invoice_number}`}
          size="lg"
        >
          <BillDetailsView
            bill={selectedBill}
            bills={bills}
            onRecordPayment={() => {
              setShowBillDetailsModal(false)
              setShowPaymentModal(true)
            }}
            onClose={() => {
              setShowBillDetailsModal(false)
              setSelectedBill(null)
            }}
            formatCurrency={formatCurrency}
            formatDate={formatDate}
          />
        </Modal>
      )}

      {/* Create/Edit Vendor Bill Modal - Only render when bills tab is active and modal is requested */}
      {activeTab === 'bills' && showVendorBillModal && (
        <VendorBillModal
          isOpen={showVendorBillModal}
          onClose={() => {
            setShowVendorBillModal(false)
            setEditingVendorBill(null)
          }}
          onSave={handleCreateVendorBill}
          onUpdate={handleUpdateVendorBill}
          companyBills={bills.filter(b => b.bill_type === 'company')}
          purchaseOrders={purchaseOrders}
          suppliers={vendors}
          existingBills={bills}
          editingBill={editingVendorBill}
          formatCurrency={formatCurrency}
        />
      )}

      {/* Expense View Modal */}
      {showExpenseViewModal && selectedExpense && (
        <ExpenseViewModal
          isOpen={showExpenseViewModal}
          onClose={() => {
            setShowExpenseViewModal(false)
            setSelectedExpense(null)
          }}
          expense={selectedExpense}
          purchaseOrder={purchaseOrders.find(po => po.id === selectedExpense.referenceId)}
          onUploadReceipt={handleUploadExpenseReceipt}
          onRemoveReceipt={handleRemoveExpenseReceipt}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
        />
      )}
    </div>
  )
}

// Payment Form Component (inline)
const PaymentForm = ({ bill, onSubmit, onCancel, formatCurrency }) => {
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer')
  const [paymentReference, setPaymentReference] = useState('')
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0])
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const balanceDue = parseFloat(bill.balance_due) || 0

  const handleSubmit = async (e) => {
    e.preventDefault()
    const amount = parseFloat(paymentAmount)

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount')
      return
    }

    if (amount > balanceDue) {
      alert(`Payment amount cannot exceed balance due (${formatCurrency(balanceDue)})`)
      return
    }

    setSubmitting(true)
    try {
      await onSubmit({
        amount,
        paymentMethod,
        reference: paymentReference,  // API expects 'reference'
        paymentDate,
        notes
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-2">
      {/* Payment Summary */}
      <div className="bg-slate-50 rounded-lg p-4 mb-6 border border-slate-200">
        <div className="flex justify-between py-2 border-b border-slate-200">
          <span className="text-sm text-slate-600">Invoice Amount:</span>
          <span className="text-sm font-semibold text-slate-900">{formatCurrency(bill.invoice_amount)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-200">
          <span className="text-sm text-slate-600">Already Paid:</span>
          <span className="text-sm font-semibold text-emerald-600">{formatCurrency(bill.paid_amount)}</span>
        </div>
        <div className="flex justify-between bg-white mx-[-1rem] mb-[-1rem] mt-2 p-4 rounded-b-lg border-t-2 border-slate-300">
          <span className="text-sm text-slate-600">Balance Due:</span>
          <span className="text-base font-semibold text-red-600">{formatCurrency(balanceDue)}</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="paymentAmount">Payment Amount *</label>
        <input
          type="number"
          id="paymentAmount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder={`Max: ${formatCurrency(balanceDue)}`}
          step="0.001"
          min="0"
          max={balanceDue}
          required
        />
      </div>

      <div className="form-group">
        <DateInput
          id="paymentDate"
          value={paymentDate}
          onChange={setPaymentDate}
          label="Payment Date"
          required
          isClearable
        />
      </div>

      <div className="form-group">
        <label htmlFor="paymentMethod">Payment Method *</label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="card">Card Payment</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="paymentReference">Reference / Transaction ID</label>
        <input
          type="text"
          id="paymentReference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          placeholder="e.g., Bank transaction reference"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional payment notes..."
          rows={2}
          className="resize-y min-h-[60px]"
        />
      </div>

      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !paymentAmount}
        >
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  )
}

// Bill Details View Component (inline)
const BillDetailsView = ({ bill, bills, onRecordPayment, onClose, formatCurrency, formatDate }) => {
  const isPaid = bill.payment_status === 'paid'
  const isVendorBill = bill.bill_type === 'vendor'
  const balanceDue = parseFloat(bill.balance_due) || 0

  // Helper to get company bill details by ID
  const getCompanyBillDetails = (billId) => {
    const companyBill = bills?.find(b => b.id === billId && b.bill_type === 'company')
    return companyBill || null
  }

  // Get linked company bills for vendor bills
  const linkedCompanyBills = isVendorBill && bill.covers_company_bills?.length > 0
    ? bill.covers_company_bills.map(billId => getCompanyBillDetails(billId)).filter(Boolean)
    : []

  // Status badge styles
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'unpaid': return 'bg-amber-100/50 text-amber-600'
      case 'partial': return 'bg-blue-100/50 text-blue-600'
      case 'paid': return 'bg-emerald-100/50 text-emerald-600'
      case 'overdue': return 'bg-red-100/50 text-red-600'
      default: return 'bg-slate-100 text-slate-600'
    }
  }

  return (
    <div className="p-2">
      {/* Bill Header */}
      <div className="mb-6 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium text-white capitalize ${
            isVendorBill ? 'bg-violet-500' : 'bg-blue-500'
          }`}>
            {isVendorBill ? 'Vendor Bill' : 'Company Bill'}
          </span>
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClass(bill.payment_status)}`}>
            {bill.payment_status === 'unpaid' ? 'Unpaid' :
             bill.payment_status === 'partial' ? 'Partially Paid' :
             bill.payment_status === 'paid' ? 'Paid' : 'Overdue'}
          </span>
        </div>
      </div>

      {/* Bill Information Grid */}
      <div className="grid grid-cols-2 gap-6 mb-6 max-sm:grid-cols-1">
        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 m-0 mb-3 uppercase tracking-wide">Bill Information</h4>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Bill Number</span>
            <span className="text-sm font-semibold text-slate-900">{bill.invoice_number}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Supplier</span>
            <span className="text-sm font-semibold text-slate-900">{bill.supplierName || 'N/A'}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Invoice Date</span>
            <span className="text-sm font-semibold text-slate-900">{formatDate(bill.invoice_date)}</span>
          </div>
          {bill.due_date && (
            <div className="flex justify-between py-2">
              <span className="text-sm text-slate-600">Due Date</span>
              <span className="text-sm font-semibold text-slate-900">{formatDate(bill.due_date)}</span>
            </div>
          )}
        </div>

        <div className="bg-slate-50 rounded-lg p-4 border border-slate-200">
          <h4 className="text-sm font-semibold text-slate-700 m-0 mb-3 uppercase tracking-wide">Payment Details</h4>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Invoice Amount</span>
            <span className="text-sm font-semibold text-slate-900">{formatCurrency(bill.invoice_amount)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-slate-200">
            <span className="text-sm text-slate-600">Paid Amount</span>
            <span className="text-sm font-semibold text-emerald-600">{formatCurrency(bill.paid_amount)}</span>
          </div>
          <div className="flex justify-between bg-white mx-[-1rem] mb-[-1rem] mt-2 px-4 py-3 rounded-b-lg border-t-2 border-slate-300">
            <span className="text-sm text-slate-600">Balance Due</span>
            <span className={`text-sm font-semibold ${balanceDue > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Order / Company Bills Information */}
      <div className="mb-6 p-4 bg-slate-50 rounded-lg border border-slate-200">
        {isVendorBill ? (
          <>
            <h4 className="text-sm font-semibold text-slate-700 m-0 mb-3 uppercase tracking-wide">Linked Company Bills</h4>
            {linkedCompanyBills.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-slate-600">
                  This vendor bill covers <strong>{linkedCompanyBills.length}</strong> company bill(s)
                </div>
                <div className="mt-3 overflow-x-auto">
                  <table className="w-full border-collapse text-sm bg-white rounded-md overflow-hidden border border-slate-200">
                    <thead>
                      <tr>
                        <th className="bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">Bill #</th>
                        <th className="bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">PO #</th>
                        <th className="bg-slate-100 px-3 py-2 text-left font-semibold text-slate-700 text-xs uppercase tracking-wider border-b border-slate-200">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedCompanyBills.map((companyBill) => (
                        <tr key={companyBill.id} className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50">
                          <td className="px-3 py-2 text-slate-700">{companyBill.invoice_number}</td>
                          <td className="px-3 py-2 text-slate-700">{companyBill.orderNumber || `PO-${companyBill.purchase_order_id}`}</td>
                          <td className="px-3 py-2 text-slate-700">{formatCurrency(companyBill.invoice_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : bill.covers_company_bills?.length > 0 ? (
              <div className="flex flex-col gap-2">
                <div className="text-sm text-slate-600">
                  This vendor bill covers <strong>{bill.covers_company_bills.length}</strong> company bill(s)
                </div>
                <div className="flex flex-wrap gap-2">
                  {bill.covers_company_bills.map((billId) => (
                    <span key={billId} className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium">
                      Bill #{billId}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic m-0">No company bills linked to this vendor bill</p>
            )}
          </>
        ) : (
          <>
            <h4 className="text-sm font-semibold text-slate-700 m-0 mb-3 uppercase tracking-wide">Related Purchase Order</h4>
            {bill.purchase_order_id ? (
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs font-medium w-fit">
                  {bill.orderNumber || `PO-${bill.purchase_order_id}`}
                </span>
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic m-0">No purchase order linked to this bill</p>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
          <h4 className="text-sm font-semibold text-slate-700 m-0 mb-2">Notes</h4>
          <p className="text-sm text-slate-700 m-0 leading-relaxed">{bill.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
        {!isPaid && isVendorBill && (
          <button className="btn btn-primary" onClick={onRecordPayment}>
            <Banknote size={16} />
            Record Payment
          </button>
        )}
        {!isPaid && !isVendorBill && (
          <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-100 border border-amber-300 rounded-md text-amber-800 text-sm font-medium">
            <AlertTriangle size={16} className="shrink-0 text-amber-600" />
            <span>Company bills are paid via their linked vendor bill</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Purchase