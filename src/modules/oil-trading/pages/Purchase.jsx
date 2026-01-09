import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
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
import purchaseOrderService from '../../../services/purchaseOrderService'
import purchaseOrderAmendmentService from '../../../services/purchaseOrderAmendmentService'
import purchaseInvoiceService from '../../../services/purchaseInvoiceService'
import expenseService from '../../../services/expenseService'
import purchaseOrderExpenseService from '../../../services/purchaseOrderExpenseService'
import dataCacheService from '../../../services/dataCacheService'
import {
  Plus, Search, Filter, Eye, Edit, Edit3, Truck, Package,
  CheckCircle, Clock, AlertTriangle, FileText, Download,
  Banknote, MapPin, Building, Calculator, Receipt,
  Users, Settings, Paperclip, Image, Trash2
} from 'lucide-react'
import '../styles/Purchase.css'

const Purchase = () => {
  const { selectedCompany } = useAuth()
  const { hasPermission } = usePermissions()
  const { formatDate, formatCurrency } = useSystemSettings()
  const [searchParams, setSearchParams] = useSearchParams()

  // Tab management - read from URL params or default to 'collections'
  const initialTab = searchParams.get('tab') || 'collections'
  const [activeTab, setActiveTab] = useState(initialTab)

  // Sync URL params when tab changes
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && urlTab !== activeTab) {
      setActiveTab(urlTab)
    }
  }, [searchParams])
  
  // Data states
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [purchaseExpenses, setPurchaseExpenses] = useState([])
  const [bills, setBills] = useState([])
  const [billTypeFilter, setBillTypeFilter] = useState('all') // 'all', 'company', 'vendor'
  const [billPaymentFilter, setBillPaymentFilter] = useState('all') // 'all', 'unpaid', 'partial', 'paid', 'overdue'
  const [amendmentCounts, setAmendmentCounts] = useState({}) // Map of orderId -> amendment count
  const [vendors, setVendors] = useState([])
  const [materials, setMaterials] = useState([])
  const [orderStatuses, setOrderStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [billsLoading, setBillsLoading] = useState(false)

  // Server-side pagination state for purchase orders
  const [ordersPagination, setOrdersPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    search: '',
    sortBy: 'created_at',
    sortOrder: 'desc',
    status: ''
  })
  
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

  useEffect(() => {
    loadPurchaseData()
  }, [selectedCompany])

  // Load purchase orders with server-side pagination
  const loadPurchaseOrders = useCallback(async (paginationParams = {}) => {
    try {
      setLoading(true)

      // Merge current pagination with new params
      const params = {
        page: paginationParams.page ?? ordersPagination.page,
        limit: paginationParams.limit ?? ordersPagination.limit,
        search: paginationParams.search ?? ordersPagination.search,
        status: paginationParams.status ?? ordersPagination.status,
        sortBy: paginationParams.sortBy ?? ordersPagination.sortBy,
        sortOrder: paginationParams.sortOrder ?? ordersPagination.sortOrder
      }

      const ordersResult = await purchaseOrderService.getAll(params)

      if (ordersResult.success) {
        setPurchaseOrders(ordersResult.data || [])
        // Update pagination state with server response
        if (ordersResult.pagination) {
          setOrdersPagination(prev => ({
            ...prev,
            ...params,
            total: ordersResult.pagination.total || 0,
            totalPages: ordersResult.pagination.totalPages || 0
          }))
        }
      } else {
        setPurchaseOrders([])
      }
    } catch (error) {
      console.error('Error loading purchase orders:', error)
      setPurchaseOrders([])
    } finally {
      setLoading(false)
    }
  }, [ordersPagination])

  const loadPurchaseData = async () => {
    try {
      setLoading(true)

      // Set default order statuses immediately (no API call needed)
      setOrderStatuses({
        draft: { name: 'Draft', color: '#6b7280' },
        pending: { name: 'Pending Approval', color: '#f59e0b' },
        approved: { name: 'Approved', color: '#10b981' },
        sent: { name: 'Sent to Vendor', color: '#3b82f6' },
        received: { name: 'Received', color: '#059669' },
        completed: { name: 'Completed', color: '#059669' },
        cancelled: { name: 'Cancelled', color: '#ef4444' }
      })

      // PERFORMANCE FIX: Use dataCacheService for instant loading of cached data
      // Suppliers and materials use 5-min cache, purchase orders use 2-min cache
      const [
        ordersResult,
        expensesResult,
        countsResult,
        suppliersData,
        materialsData
      ] = await Promise.all([
        // 1. Purchase orders with pagination (no cache for paginated data)
        purchaseOrderService.getAll({
          page: ordersPagination.page,
          limit: ordersPagination.limit,
          search: ordersPagination.search,
          status: ordersPagination.status,
          sortBy: ordersPagination.sortBy,
          sortOrder: ordersPagination.sortOrder
        }),
        // 2. Purchase expenses
        expenseService.getAll({ expenseType: 'purchase' }).catch(err => {
          console.error('Error loading purchase expenses:', err)
          return { success: false, data: [] }
        }),
        // 3. Amendment counts
        purchaseOrderAmendmentService.getAllCounts().catch(err => {
          console.error('Error loading amendment counts:', err)
          return { success: false, data: {} }
        }),
        // 4. Suppliers (vendors) - CACHED (5 min TTL)
        dataCacheService.getSuppliers().catch(err => {
          console.error('Error loading suppliers:', err)
          return []
        }),
        // 5. Materials - CACHED (5 min TTL)
        dataCacheService.getMaterials().catch(err => {
          console.error('Error loading materials:', err)
          return []
        })
      ])

      // Process purchase orders result
      const companyOrders = ordersResult.success ? ordersResult.data : []
      setPurchaseOrders(companyOrders)

      // Update pagination from server response
      if (ordersResult.success && ordersResult.pagination) {
        setOrdersPagination(prev => ({
          ...prev,
          total: ordersResult.pagination.total || 0,
          totalPages: ordersResult.pagination.totalPages || 0
        }))
      }

      // Process expenses result
      const expenses = expensesResult.success ? expensesResult.data : []
      const normalizedExpenses = expenses.map(expense => {
        const po = companyOrders.find(p => p.id === expense.referenceId)
        return {
          ...expense,
          orderNumber: po?.orderNumber || expense.orderNumber || `PO #${expense.referenceId}`,
          vendor: expense.vendor || expense.vendorName || expense.supplierName || '',
          status: expense.status || (expense.referenceType === 'purchase_order' ? 'recorded' : 'pending')
        }
      })
      setPurchaseExpenses(normalizedExpenses)

      // Process amendment counts result
      if (countsResult.success && countsResult.data) {
        setAmendmentCounts(countsResult.data)
      } else {
        setAmendmentCounts({})
      }

      // Process suppliers result (dataCacheService returns array directly)
      const supplierVendors = (suppliersData || []).map(supplier => ({
        id: supplier.id,
        name: supplier.name,
        vendorCode: supplier.supplierCode || `VEN-${supplier.id.toString().padStart(3, '0')}`,
        contactPerson: supplier.contactPerson,
        phone: supplier.phone,
        email: supplier.email
      }))
      setVendors(supplierVendors)

      // Process materials result (dataCacheService returns array directly)
      setMaterials(materialsData || [])
      
    } catch (error) {
      console.error('Error loading purchase data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Phase 1.5: Load bills when switching to bills tab
  const loadBills = async () => {
    try {
      setBillsLoading(true)

      // Build filters
      const filters = {}
      if (billTypeFilter !== 'all') {
        filters.billType = billTypeFilter
      }
      if (billPaymentFilter !== 'all') {
        filters.paymentStatus = billPaymentFilter
      }

      const result = await purchaseInvoiceService.getAll(filters)
      if (result.success) {
        setBills(result.data || [])
      } else {
        console.error('Error loading bills:', result.error)
        setBills([])
      }
    } catch (error) {
      console.error('Error loading bills:', error)
      setBills([])
    } finally {
      setBillsLoading(false)
    }
  }

  // Reload purchase orders when orders tab becomes active (for fresh data after WCN finalization)
  useEffect(() => {
    if (activeTab === 'orders') {
      loadPurchaseData()
    }
  }, [activeTab])

  // Load bills when bills tab is active or filters change
  useEffect(() => {
    if (activeTab === 'bills') {
      loadBills()
    }
  }, [activeTab, billTypeFilter, billPaymentFilter])

  // Calculate bill summary
  const calculateBillSummary = () => {
    const summary = {
      total: bills.length,
      companyBills: bills.filter(b => b.bill_type === 'company').length,
      vendorBills: bills.filter(b => b.bill_type === 'vendor').length,
      unpaid: bills.filter(b => b.payment_status === 'unpaid').length,
      overdue: bills.filter(b => b.payment_status === 'overdue').length,
      totalAmount: bills.reduce((sum, b) => sum + (parseFloat(b.invoice_amount) || 0), 0),
      paidAmount: bills.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0),
      balanceDue: bills.reduce((sum, b) => sum + (parseFloat(b.balance_due) || 0), 0)
    }
    return summary
  }

  /**
   * Group bills for hierarchical display
   * - Vendor bills become parent rows with nested company bills
   * - Orphan company bills (not linked to vendor bill) shown separately
   * - Calculates reconciliation metrics for each vendor bill
   *
   * New Workflow (covers_company_bills):
   * - Vendor bills link directly to company bills via covers_company_bills array
   *
   * Legacy Workflow (covers_purchase_orders):
   * - Vendor bills link to POs, we find company bills by PO ID
   * - Kept for backward compatibility during migration
   */
  const groupBillsForDisplay = () => {
    const vendorBills = bills.filter(b => b.bill_type === 'vendor')
    const companyBills = bills.filter(b => b.bill_type === 'company')

    // Map company bills by ID for direct lookup (new workflow)
    const companyBillsById = {}
    companyBills.forEach(cb => {
      companyBillsById[cb.id] = cb
    })

    // Map company bills by PO ID for legacy lookup
    const companyBillsByPO = {}
    companyBills.forEach(cb => {
      if (cb.purchase_order_id) {
        companyBillsByPO[cb.purchase_order_id] = cb
      }
    })

    // Track which company bills are linked to vendor bills
    const linkedCompanyBillIds = new Set()

    // Group vendor bills with their linked company bills
    const groupedBills = vendorBills.map(vb => {
      let linkedCompanyBills = []

      // New workflow: Use covers_company_bills (direct company bill IDs)
      if (vb.covers_company_bills && vb.covers_company_bills.length > 0) {
        linkedCompanyBills = vb.covers_company_bills
          .map(cbId => companyBillsById[cbId])
          .filter(Boolean)
      }
      // Legacy workflow: Use covers_purchase_orders (PO IDs → company bills)
      else if (vb.covers_purchase_orders && vb.covers_purchase_orders.length > 0) {
        linkedCompanyBills = vb.covers_purchase_orders
          .map(poId => companyBillsByPO[poId])
          .filter(Boolean)
      }

      // Mark these company bills as linked
      linkedCompanyBills.forEach(cb => linkedCompanyBillIds.add(cb.id))

      // Calculate reconciliation metrics
      const companyTotal = linkedCompanyBills.reduce(
        (sum, cb) => sum + parseFloat(cb.invoice_amount || 0), 0
      )
      const vendorAmount = parseFloat(vb.invoice_amount || 0)
      const difference = vendorAmount - companyTotal

      // Count covered items (use company bills count or PO count for legacy)
      const coveredCount = vb.covers_company_bills?.length ||
        vb.covers_purchase_orders?.length || 0

      return {
        ...vb,
        childBills: linkedCompanyBills,
        isExpanded: false, // Will be managed in component state
        reconciliation: {
          companyTotal,
          vendorAmount,
          difference,
          isMatched: Math.abs(difference) < 0.01,
          coveredPOs: coveredCount,
          linkedBills: linkedCompanyBills.length,
          missingBills: coveredCount - linkedCompanyBills.length
        }
      }
    })

    // Find orphan company bills (not linked to any vendor bill)
    const orphanBills = companyBills.filter(cb => !linkedCompanyBillIds.has(cb.id))

    return { groupedBills, orphanBills }
  }

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
      console.error('Error creating vendor bill:', error)
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
      console.error('Error updating vendor bill:', error)
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
      console.error('Error marking bill as sent:', error)
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
      console.error('Error loading order for edit:', error)
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
      console.error('Error loading purchase order:', error)
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
      console.error('Error saving expense:', error)
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
      console.error('Error deleting expense:', error)
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
      console.error('Error uploading receipt:', error)
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
      console.error('Error removing receipt:', error)
      throw error
    }
  }

  const handleViewOrder = async (order) => {
    try {
      console.log('Viewing purchase order:', order)
      // Fetch full order details including items
      const result = await purchaseOrderService.getById(order.id)
      if (result.success && result.data) {
        setViewingOrder(result.data)
      } else {
        alert(`❌ Failed to load order details: ${result.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Error loading order details:', error)
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

  // Tabs ordered by workflow: Collections → PO → Bills → Expenses → Vendors → Locations → Analytics
  const tabs = [
    { id: 'collections', name: 'Collections', icon: Package },
    { id: 'orders', name: 'Purchase Orders', icon: FileText },
    { id: 'bills', name: 'Bills', icon: Receipt },
    { id: 'expenses', name: 'Purchase Expenses', icon: Banknote },
    { id: 'vendors', name: 'Vendor Management', icon: Users },
    { id: 'locations', name: 'Storage Locations', icon: Building },
    { id: 'analytics', name: 'Analytics', icon: Calculator }
  ]

  const billSummary = calculateBillSummary()

  return (
    <div className="page-container">
      {/* Message Toast */}
      {message.text && (
        <div
          className={`message-toast ${message.type}`}
          onClick={() => setMessage({ type: '', text: '' })}
        >
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          <span>{message.text}</span>
          <button className="toast-close">×</button>
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

            <DataTable
              headerActions={
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
                    <div className="cell-actions">
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
                          title={row.status === 'draft' ? 'Edit' : 'Only draft orders can be edited directly'}
                          disabled={row.status !== 'draft'}
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
                            <Banknote size={14} />
                          </button>
                        )}
                      </PermissionGate>

                      {/* Sprint 4: Invoices button */}
                      <PermissionGate permission={PERMISSIONS.CREATE_PURCHASE}>
                        {(row.status === 'received' || row.status === 'completed') && (
                          <button
                            className="btn btn-success btn-sm"
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
                            className="btn btn-outline btn-sm"
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
            />
          </div>
        )}

        {/* Phase 1.5: Bills Tab */}
        {activeTab === 'bills' && (
          <div className="bills-tab">
            {/* Bills Summary Cards */}
            <div className="summary-cards auto-fit">
              <div className="summary-card">
                <div className="summary-icon info">
                  <FileText size={22} />
                </div>
                <div>
                  <div className="summary-value">{billSummary.companyBills}</div>
                  <div className="summary-label">Company Bills</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">
                  <Receipt size={22} />
                </div>
                <div>
                  <div className="summary-value">{billSummary.vendorBills}</div>
                  <div className="summary-label">Vendor Bills</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon warning">
                  <Clock size={22} />
                </div>
                <div>
                  <div className="summary-value">{billSummary.unpaid}</div>
                  <div className="summary-label">Unpaid</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon danger">
                  <AlertTriangle size={22} />
                </div>
                <div>
                  <div className="summary-value">{billSummary.overdue}</div>
                  <div className="summary-label">Overdue</div>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon success">
                  <Banknote size={22} />
                </div>
                <div>
                  <div className="summary-value">{formatCurrency(billSummary.balanceDue)}</div>
                  <div className="summary-label">Balance Due</div>
                </div>
              </div>
            </div>

            {/* Bills Filters */}
            <div className="filters-bar">
              <div className="filter-controls">
                <select
                  className="filter-select"
                  value={billTypeFilter}
                  onChange={(e) => setBillTypeFilter(e.target.value)}
                >
                  <option value="all">All Bills</option>
                  <option value="company">Company Bills</option>
                  <option value="vendor">Vendor Bills</option>
                </select>
                <select
                  className="filter-select"
                  value={billPaymentFilter}
                  onChange={(e) => setBillPaymentFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="paid">Paid</option>
                  <option value="overdue">Overdue</option>
                </select>
              </div>
              <button
                className="btn btn-primary"
                onClick={() => {
                  setEditingVendorBill(null)
                  setShowVendorBillModal(true)
                }}
              >
                <Plus size={16} />
                Create Vendor Bill
              </button>
            </div>

            {/* Grouped Bills Table */}
            {billsLoading ? (
              <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Loading bills...</p>
              </div>
            ) : (
              (() => {
                const { groupedBills, orphanBills } = groupBillsForDisplay()
                return (
                  <GroupedBillsTable
                    groupedBills={groupedBills}
                    orphanBills={orphanBills}
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
                )
              })()
            )}
          </div>
        )}

        {activeTab === 'expenses' && (
          <div className="expenses-tab">
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
                      return (
                        <button
                          onClick={() => window.open(value, '_blank')}
                          className="btn btn-outline btn-sm"
                          title="View Receipt"
                        >
                          <Image size={12} />
                          View
                        </button>
                      )
                    }
                    return <span className="text-muted">None</span>
                  }
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  sortable: false,
                  width: '140px',
                  render: (value, row) => (
                    <div className="cell-actions">
                      <button
                        onClick={() => {
                          setSelectedExpense(row)
                          setShowExpenseViewModal(true)
                        }}
                        className="btn btn-outline btn-sm"
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteExpense(row.id)}
                        className="btn btn-danger btn-sm"
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
            />
          </div>
        )}

        {activeTab === 'collections' && (
          <div className="collections-tab">
            <CalloutManager />
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
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-summary">
        <div className="summary-row">
          <span className="label">Invoice Amount:</span>
          <span className="value">{formatCurrency(bill.invoice_amount)}</span>
        </div>
        <div className="summary-row">
          <span className="label">Already Paid:</span>
          <span className="value paid">{formatCurrency(bill.paid_amount)}</span>
        </div>
        <div className="summary-row highlight">
          <span className="label">Balance Due:</span>
          <span className="value due">{formatCurrency(balanceDue)}</span>
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
          className="form-input"
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
          className="form-select"
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
          className="form-input"
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
          className="form-textarea"
        />
      </div>

      <div className="form-actions">
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

  return (
    <div className="bill-details-view">
      {/* Bill Header */}
      <div className="bill-header-section">
        <div className="bill-type-indicator">
          <span className={`bill-type-badge ${bill.bill_type}`}>
            {isVendorBill ? 'Vendor Bill' : 'Company Bill'}
          </span>
          <span className={`status-badge ${bill.payment_status}`}>
            {bill.payment_status === 'unpaid' ? 'Unpaid' :
             bill.payment_status === 'partial' ? 'Partially Paid' :
             bill.payment_status === 'paid' ? 'Paid' : 'Overdue'}
          </span>
        </div>
      </div>

      {/* Bill Information Grid */}
      <div className="bill-info-grid">
        <div className="info-section">
          <h4>Bill Information</h4>
          <div className="info-row">
            <span className="info-label">Bill Number</span>
            <span className="info-value">{bill.invoice_number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Supplier</span>
            <span className="info-value">{bill.supplierName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Invoice Date</span>
            <span className="info-value">{formatDate(bill.invoice_date)}</span>
          </div>
          {bill.due_date && (
            <div className="info-row">
              <span className="info-label">Due Date</span>
              <span className="info-value">{formatDate(bill.due_date)}</span>
            </div>
          )}
        </div>

        <div className="info-section">
          <h4>Payment Details</h4>
          <div className="info-row">
            <span className="info-label">Invoice Amount</span>
            <span className="info-value amount">{formatCurrency(bill.invoice_amount)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Paid Amount</span>
            <span className="info-value paid">{formatCurrency(bill.paid_amount)}</span>
          </div>
          <div className="info-row highlight">
            <span className="info-label">Balance Due</span>
            <span className={`info-value ${balanceDue > 0 ? 'due' : 'paid'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Order / Company Bills Information */}
      <div className="po-section">
        {isVendorBill ? (
          <>
            <h4>Linked Company Bills</h4>
            {linkedCompanyBills.length > 0 ? (
              <div className="po-list">
                <div className="po-count">
                  This vendor bill covers <strong>{linkedCompanyBills.length}</strong> company bill(s)
                </div>
                <div className="linked-bills-table">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>PO #</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedCompanyBills.map((companyBill) => (
                        <tr key={companyBill.id}>
                          <td>{companyBill.invoice_number}</td>
                          <td>{companyBill.orderNumber || `PO-${companyBill.purchase_order_id}`}</td>
                          <td>{formatCurrency(companyBill.invoice_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : bill.covers_company_bills?.length > 0 ? (
              <div className="po-list">
                <div className="po-count">
                  This vendor bill covers <strong>{bill.covers_company_bills.length}</strong> company bill(s)
                </div>
                <div className="po-ids">
                  {bill.covers_company_bills.map((billId) => (
                    <span key={billId} className="po-id-badge">
                      Bill #{billId}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="no-po">No company bills linked to this vendor bill</p>
            )}
          </>
        ) : (
          <>
            <h4>Related Purchase Order</h4>
            {bill.purchase_order_id ? (
              <div className="po-list">
                <span className="po-id-badge">
                  {bill.orderNumber || `PO-${bill.purchase_order_id}`}
                </span>
              </div>
            ) : (
              <p className="no-po">No purchase order linked to this bill</p>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="notes-section">
          <h4>Notes</h4>
          <p>{bill.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bill-actions">
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
          <div className="payment-info-message">
            <AlertTriangle size={16} />
            <span>Company bills are paid via their linked vendor bill</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default Purchase