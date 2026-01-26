import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { parseDate } from '../../../utils/dateParser'
import LoadingSpinner from '../../../components/LoadingSpinner'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import DateInput from '../../../components/ui/DateInput'
import StockChart from '../../../components/StockChart'
import ImageUpload from '../../../components/ui/ImageUpload'
import FileUpload from '../../../components/ui/FileUpload'
import PaymentMethodSelect from '../../../components/ui/PaymentMethodSelect'
import ReceiptUpload from '../../../components/ui/ReceiptUpload'
import pettyCashService from '../../../services/pettyCashService'
import uploadService from '../../../services/uploadService'
import userService from '../../../services/userService'
import pettyCashUsersService from '../../../services/pettyCashUsersService'
import dataCacheService from '../../../services/dataCacheService'
import PettyCashUsersSection from '../../../components/petty-cash/PettyCashUsersSection'
import useProjects from '../../../hooks/useProjects'
import {
  CreditCard,
  Plus,
  Banknote,
  TrendingUp,
  User,
  Users,
  Calendar,
  Receipt,
  Eye,
  Edit,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  Upload,
  Camera,
  Lock,
  FileText,
  Ban,
  PlayCircle,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Loader2,
  Fuel,
  FolderOpen
} from 'lucide-react'
// CSS moved to global index.css - using Tailwind classes

const PettyCash = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate: systemFormatDate, getInputDate } = useSystemSettings()
  const { hasPermission } = usePermissions()
  const { projects, selectedProjectId } = useProjects()
  const [searchParams] = useSearchParams()

  // Read search param from URL (used when clicking tasks from dashboard)
  const urlSearchTerm = searchParams.get('search') || ''

  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [expenses, setExpenses] = useState([])
  const [expenseTypes, setExpenseTypes] = useState([])
  const [users, setUsers] = useState([])
  const [pettyCashUsers, setPettyCashUsers] = useState([]) // PC users with their card assignments
  const [stats, setStats] = useState({})
  const [error, setError] = useState(null)
  
  // Modal states
  const [showCardModal, setShowCardModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showEditExpenseModal, setShowEditExpenseModal] = useState(false)
  const [showReloadModal, setShowReloadModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [showDeactivateCardModal, setShowDeactivateCardModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  const [editingExpense, setEditingExpense] = useState(null)
  const [cardDeactivationReason, setCardDeactivationReason] = useState('')
  const [cardTransactions, setCardTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(false)

  // Receipt preview modal state
  const [showReceiptModal, setShowReceiptModal] = useState(false)
  const [receiptPreview, setReceiptPreview] = useState(null)
  const [receiptLoading, setReceiptLoading] = useState(false)

  // Form states
  const [cardForm, setCardForm] = useState({})
  const [expenseForm, setExpenseForm] = useState({})
  const [editExpenseForm, setEditExpenseForm] = useState({})
  const [reloadForm, setReloadForm] = useState({})
  
  // Tab state
  const [activeTab, setActiveTab] = useState('cards')

  // Filter states
  const [cardFilter, setCardFilter] = useState('all')
  const [expenseFilter, setExpenseFilter] = useState('all')
  const [dateRange, setDateRange] = useState('30')

  useEffect(() => {
    if (selectedCompany) {
      loadPettyCashData()
    }
  }, [selectedCompany])

  const loadPettyCashData = async (forceRefresh = false) => {
    try {
      setLoading(true)
      setError(null)

      // Invalidate cache if force refresh requested (after mutations)
      if (forceRefresh) {
        dataCacheService.invalidatePettyCash()
      }

      // PERFORMANCE FIX: Load all data in parallel using dataCacheService for instant loading
      const [cardsData, expensesData, typesResult, statsResult, usersResult, pcUsersResult] = await Promise.all([
        // Petty cash cards - CACHED (2 min TTL)
        dataCacheService.getPettyCashCards().catch(err => {
          console.error('Error loading petty cash cards:', err)
          return []
        }),
        // Petty cash expenses - CACHED (2 min TTL)
        dataCacheService.getPettyCashExpenses().catch(err => {
          console.error('Error loading expenses:', err)
          return []
        }),
        // Expense types (not cached as rarely called)
        pettyCashService.getExpenseTypes().catch(err => {
          console.warn('Failed to load expense types:', err)
          return { success: false, data: [] }
        }),
        // Analytics (not cached - dynamic data)
        pettyCashService.getAnalytics().catch(err => {
          console.warn('Failed to load analytics:', err)
          return { success: false, data: {} }
        }),
        // Users (not cached for now - could be added)
        userService.getAll().catch(err => {
          console.error('Failed to load users:', err)
          return { success: false, data: [] }
        }),
        // Petty cash users (for mapping top-up cards to petrol cards)
        pettyCashUsersService.getAll().catch(err => {
          console.error('Failed to load petty cash users:', err)
          return { success: false, data: [] }
        })
      ])

      // Process cached data (arrays returned directly)
      setCards(cardsData || [])
      setExpenses(expensesData || [])

      // Process non-cached results
      if (typesResult.success) {
        setExpenseTypes(typesResult.data || [])
      } else {
        setExpenseTypes([])
      }

      if (statsResult.success) {
        setStats(statsResult.data || {})
      }

      if (usersResult.success) {
        setUsers(usersResult.data || [])
      } else {
        setUsers([])
      }

      // Process petty cash users (for card mapping)
      if (pcUsersResult.success) {
        setPettyCashUsers(pcUsersResult.data || [])
      } else {
        setPettyCashUsers([])
      }

    } catch (error) {
      console.error('Error loading petty cash data:', error)
      setError(error.message)
      setCards([])
      setExpenses([])
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => `OMR ${parseFloat(amount || 0).toFixed(3)}`
  // Use system settings for date formatting
  // IMPORTANT: Use parseDate() instead of new Date() to avoid UTC timezone issues
  // new Date("2026-01-10") parses as UTC midnight, causing display to shift -1 day
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    // parseDate handles YYYY-MM-DD strings correctly as local dates
    const date = parseDate(dateString)
    if (!date) return 'N/A'
    // Use the system formatDate function which respects user settings
    return systemFormatDate ? systemFormatDate(date) : date.toLocaleDateString('en-GB')
  }

  // Statistics calculation
  // Note: Using parseFloat and rounding to avoid JavaScript floating-point precision errors
  const calculateStats = () => {
    const totalBalance = cards.reduce((sum, card) => sum + (parseFloat(card.currentBalance) || 0), 0)
    const totalLoaded = cards.reduce((sum, card) => sum + (parseFloat(card.totalLoaded) || 0), 0)
    const totalSpent = cards.reduce((sum, card) => sum + (parseFloat(card.totalSpent) || 0), 0)
    const activeCards = cards.filter(card => card.status === 'active').length

    return {
      // Round to 3 decimal places for OMR currency to avoid floating-point display errors
      totalBalance: Math.round(totalBalance * 1000) / 1000,
      totalLoaded: Math.round(totalLoaded * 1000) / 1000,
      totalSpent: Math.round(totalSpent * 1000) / 1000,
      activeCards,
      utilizationRate: totalLoaded > 0 ? ((totalSpent / totalLoaded) * 100).toFixed(1) : 0
    }
  }

  const cardStats = calculateStats()

  // Handle card operations
  const handleAddCard = () => {
    const today = getInputDate() // Use local date, not UTC
    setCardForm({
      cardType: 'top_up',  // 'top_up' or 'petrol'
      cardNumber: '',      // Manual entry for physical card number
      cardName: '',
      department: '',
      initialBalance: '',
      monthlyLimit: '',
      issueDate: today,
      expiryDate: '',
      notes: ''
    })
    setEditingCard(null)
    setShowCardModal(true)
  }

  const handleEditCard = (card) => {
    // Format dates for HTML date inputs (YYYY-MM-DD)
    const formatDateForInput = (dateValue) => {
      if (!dateValue) return ''

      // If already in YYYY-MM-DD format, return as-is
      if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
        return dateValue
      }

      // Handle date objects or ISO timestamps - use local date to avoid timezone shifts
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return '' // Invalid date

      // Use local date components to avoid timezone issues
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      return `${year}-${month}-${day}`
    }

    setCardForm({
      cardType: card.card_type || 'top_up',
      cardNumber: card.cardNumber || '',
      cardName: card.cardName || '',
      department: card.department || '',
      initialBalance: card.initialBalance || '',
      monthlyLimit: card.monthlyLimit || '',
      issueDate: formatDateForInput(card.issueDate),
      expiryDate: formatDateForInput(card.expiryDate),
      notes: card.notes || ''
    })
    setEditingCard(card)
    setShowCardModal(true)
  }

  const handleReloadCard = (card) => {
    setSelectedCard(card)
    setReloadForm({
      amount: '',
      notes: '',
      reloadDate: getInputDate() // Use local date, not UTC
    })
    setShowReloadModal(true)
  }

  const handleAddExpense = (card = null) => {
    setSelectedCard(card)

    // If a card is provided, find which petty cash user owns it
    let pcUserId = ''
    if (card?.id) {
      const ownerUser = pettyCashUsers.find(u =>
        u.card_id === card.id || u.petrol_card_id === card.id
      )
      if (ownerUser) {
        pcUserId = ownerUser.id.toString()
      }
    }

    setExpenseForm({
      pcUserId: pcUserId, // User-first selection
      cardId: card?.id?.toString() || '',
      expenseType: '',
      amount: '',
      description: '',
      merchant: '',
      transactionDate: getInputDate(), // Use local date, not UTC
      notes: '',
      paymentMethod: card ? (card.card_type === 'petrol' ? 'petrol_card' : 'top_up_card') : 'iou', // Default based on card or IOU
      receiptFile: null, // S3-integrated receipt file
      projectId: selectedProjectId && selectedProjectId !== 'all' ? selectedProjectId.toString() : '' // Default to selected project filter
    })
    setShowExpenseModal(true)
  }

  const handleApproveExpense = async (expenseId, newStatus) => {
    try {
      setLoading(true)

      // Backend expects: { status: 'approved'|'rejected', approvalNotes?: string }
      const result = await pettyCashService.approveExpense(expenseId, {
        status: newStatus,
        approvalNotes: newStatus === 'approved' ? 'Approved via UI' : 'Rejected via UI'
      })

      if (result && result.success) {
        // Reload data to reflect changes (force refresh to bypass cache)
        await loadPettyCashData(true)
        alert(`Expense ${newStatus} successfully`)
      } else {
        throw new Error(result?.error || `Failed to ${newStatus} expense`)
      }

    } catch (error) {
      console.error('Error updating expense status:', error)
      setError(error.message)
      alert(`Failed to ${newStatus} expense: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle edit expense button click
  const handleEditExpense = (expense) => {
    setEditingExpense(expense)
    // Normalize category to lowercase to match dropdown values
    const categoryValue = (expense.category || expense.expenseType || '').toLowerCase()

    // Find the petty cash user who owns this card (reverse lookup)
    // Check both card_id and petrol_card_id to find the owner
    const cardId = expense.cardId ? parseInt(expense.cardId) : null
    let pcUserId = ''
    if (cardId) {
      const ownerUser = pettyCashUsers.find(u =>
        u.card_id === cardId || u.petrol_card_id === cardId
      )
      if (ownerUser) {
        pcUserId = ownerUser.id.toString()
      }
    }

    setEditExpenseForm({
      id: expense.id,
      pcUserId: pcUserId, // Add pcUserId for user-first approach
      cardId: expense.cardId?.toString() || '',
      expenseType: categoryValue,
      amount: expense.amount?.toString() || '',
      transactionDate: expense.expenseDate?.split('T')[0] || expense.transactionDate?.split('T')[0] || '',
      description: expense.description || '',
      merchant: expense.vendor || expense.merchant || '',  // Backend returns 'vendor'
      paymentMethod: expense.payment_method || expense.paymentMethod || 'top_up_card',
      notes: expense.notes || '',
      projectId: expense.projectId?.toString() || expense.project_id?.toString() || '',
      receiptFile: null,
      existingReceipt: expense.receiptPhoto || null,
      existingReceiptKey: expense.receipt_key || null
    })
    setShowEditExpenseModal(true)
  }

  // Handle view receipt button click - opens receipt preview modal
  const handleViewReceipt = async (expense) => {
    // Check if expense has any receipts
    if (!expense.hasReceipt && !expense.receiptPhoto && !expense.receipt_key) {
      alert(t('noReceipt', 'No Receipt Attached'))
      return
    }

    setReceiptLoading(true)
    setShowReceiptModal(true)

    try {
      // Fetch receipts for this expense
      const result = await pettyCashService.getExpenseReceipts(expense.id)

      if (result.success && result.data?.receipts?.length > 0) {
        // Set the first receipt for preview
        setReceiptPreview({
          expense: expense,
          receipts: result.data.receipts,
          currentIndex: 0
        })
      } else if (expense.receiptPhoto) {
        // Fallback to legacy receipt field
        setReceiptPreview({
          expense: expense,
          receipts: [{ downloadUrl: expense.receiptPhoto, originalFilename: 'Receipt', contentType: 'image/*' }],
          currentIndex: 0
        })
      } else {
        alert(t('noReceiptFound', 'No receipt found for this expense'))
        setShowReceiptModal(false)
      }
    } catch (error) {
      console.error('Error fetching receipts:', error)
      alert(t('errorLoadingReceipt', 'Error loading receipt'))
      setShowReceiptModal(false)
    } finally {
      setReceiptLoading(false)
    }
  }

  // Handle update expense submission
  const handleUpdateExpense = async (formData) => {
    try {
      // Update expense data - match backend schema (vendor instead of merchant, no location/hasReceipt)
      const expenseData = {
        cardId: formData.cardId ? parseInt(formData.cardId) : null,
        category: formData.expenseType,
        amount: parseFloat(formData.amount),
        expenseDate: formData.transactionDate,
        description: formData.description,
        vendor: formData.merchant || null,  // Backend expects 'vendor' not 'merchant'
        paymentMethod: formData.paymentMethod || 'top_up_card',
        notes: formData.notes || null,
        projectId: formData.projectId ? parseInt(formData.projectId) : null
      }

      const result = await pettyCashService.updateExpense(editingExpense.id, expenseData)

      if (!result.success) {
        throw new Error(result.error || 'Failed to update expense')
      }

      // Upload receipt if a new file was selected
      if (formData.receiptFile) {
        const uploadResult = await pettyCashService.uploadReceipt(editingExpense.id, formData.receiptFile)
        if (!uploadResult.success) {
          console.warn('Receipt upload failed:', uploadResult.error)
          // Don't fail the whole operation if receipt upload fails
        }
      }

      // Reload data and close modal (force refresh to bypass cache)
      await loadPettyCashData(true)
      setShowEditExpenseModal(false)
      setEditingExpense(null)
      alert(t('expenseUpdated', 'Expense updated successfully'))
    } catch (error) {
      console.error('Error updating expense:', error)
      throw error // Re-throw to let modal handle it
    }
  }

  const handleSaveCard = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Map form data to backend schema
      // Note: assignedTo/staffName are now optional - user assignment is handled via Petty Cash Users
      const cardData = {
        cardType: cardForm.cardType || 'top_up',
        cardNumber: cardForm.cardNumber || null,  // Manual card number (null = auto-generate)
        cardName: cardForm.cardName || (cardForm.cardType === 'petrol' ? 'Petrol Card' : null),
        department: cardForm.department || null,
        initialBalance: parseFloat(cardForm.initialBalance),
        monthlyLimit: parseFloat(cardForm.monthlyLimit) || null,
        issueDate: cardForm.issueDate,
        expiryDate: cardForm.expiryDate || null,
        notes: cardForm.notes || null
      }

      let result
      if (editingCard) {
        result = await pettyCashService.updateCard(editingCard.id, cardData)
      } else {
        result = await pettyCashService.createCard(cardData)
      }

      if (result.success) {
        await loadPettyCashData(true)
        setShowCardModal(false)
        setEditingCard(null)
        alert(`Card ${editingCard ? 'updated' : 'created'} successfully`)
      } else {
        throw new Error(result.error || 'Failed to save card')
      }
    } catch (error) {
      console.error('Error saving card:', error)
      setError(error.message)
      alert(`Failed to save card: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleReloadCardBalance = async (reloadData) => {
    try {
      setLoading(true)
      const result = await pettyCashService.reloadCard(selectedCard.id, reloadData)
      
      if (result.success) {
        await loadPettyCashData(true)
        setShowReloadModal(false)
        setSelectedCard(null)
        alert('Card balance reloaded successfully')
      } else {
        throw new Error(result.error || 'Failed to reload card')
      }
    } catch (error) {
      console.error('Error reloading card:', error)
      setError(error.message)
      alert(`Failed to reload card: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveExpense = async (formData) => {
    try {
      setLoading(true)

      // Map frontend field names to backend schema
      const expensePayload = {
        cardId: formData.cardId ? parseInt(formData.cardId) : null,
        category: formData.expenseType, // Frontend: expenseType → Backend: category
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenseDate: formData.transactionDate, // Frontend: transactionDate → Backend: expenseDate
        vendor: formData.merchant || null, // Frontend: merchant → Backend: vendor
        notes: formData.notes || null, // Convert empty string to null
        paymentMethod: formData.paymentMethod || 'top_up_card',
        projectId: formData.projectId ? parseInt(formData.projectId) : null // Link to project
      }

      const result = await pettyCashService.createExpense(expensePayload)

      if (result.success) {
        const expenseId = result.data?.id

        // Upload receipt if file was selected
        if (formData.receiptFile && expenseId) {
          try {
            const uploadResult = await pettyCashService.uploadExpenseReceipt(
              expenseId,
              formData.receiptFile,
              (progress) => console.log(`Receipt upload progress: ${progress}%`)
            )
            if (!uploadResult.success) {
              console.warn('Receipt upload failed:', uploadResult.error)
              // Don't fail the whole operation if receipt upload fails
            }
          } catch (uploadError) {
            console.warn('Receipt upload error:', uploadError)
          }
        }

        await loadPettyCashData(true)
        setShowExpenseModal(false)
        setSelectedCard(null)
        alert('Expense recorded successfully')
      } else {
        throw new Error(result.error || 'Failed to create expense')
      }
    } catch (error) {
      console.error('Error saving expense:', error)
      setError(error.message)
      alert(`Failed to save expense: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle deactivate card (suspend with reason)
  const openDeactivateCardModal = (card) => {
    setSelectedCard(card)
    setCardDeactivationReason('')
    setShowDeactivateCardModal(true)
  }

  const handleDeactivateCard = async (e) => {
    e.preventDefault()
    if (!selectedCard) return

    if (cardDeactivationReason.trim().length < 5) {
      setError('Please provide a reason (at least 5 characters)')
      return
    }

    try {
      setLoading(true)
      const result = await pettyCashService.deactivateCard(selectedCard.id, cardDeactivationReason.trim())

      if (result.success) {
        setShowDeactivateCardModal(false)
        setCardDeactivationReason('')
        await loadPettyCashData(true)
        alert('Card deactivated successfully')
      } else {
        throw new Error(result.error || 'Failed to deactivate card')
      }
    } catch (error) {
      console.error('Error deactivating card:', error)
      setError(error.message)
      alert(`Failed to deactivate card: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Handle reactivate card
  const handleReactivateCard = async (card) => {
    if (!window.confirm(`Are you sure you want to reactivate card ${card.cardNumber}?`)) {
      return
    }

    try {
      setLoading(true)
      const result = await pettyCashService.reactivateCard(card.id)

      if (result.success) {
        await loadPettyCashData(true)
        alert('Card reactivated successfully')
      } else {
        throw new Error(result.error || 'Failed to reactivate card')
      }
    } catch (error) {
      console.error('Error reactivating card:', error)
      setError(error.message)
      alert(`Failed to reactivate card: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  // Load transaction history for a card
  const loadCardTransactions = async (cardId) => {
    if (!cardId) return

    setTransactionsLoading(true)
    try {
      const result = await pettyCashService.getCardTransactions(cardId, { limit: 20 })
      if (result.success) {
        setCardTransactions(result.data || [])
      } else {
        console.error('Failed to load transactions:', result.error)
        setCardTransactions([])
      }
    } catch (err) {
      console.error('Error loading transactions:', err)
      setCardTransactions([])
    } finally {
      setTransactionsLoading(false)
    }
  }

  // Get transaction type info for display
  const getTransactionTypeInfo = (type) => {
    switch (type) {
      case 'initial_balance':
        return { icon: <ArrowUpCircle size={16} />, color: '#28a745', label: t('initialBalance', 'Initial Balance') }
      case 'reload':
        return { icon: <ArrowUpCircle size={16} />, color: '#17a2b8', label: t('reload', 'Reload') }
      case 'expense':
        return { icon: <ArrowDownCircle size={16} />, color: '#ffc107', label: t('expense', 'Expense') }
      case 'expense_approved':
        return { icon: <CheckCircle size={16} />, color: '#28a745', label: t('expenseApproved', 'Expense Approved') }
      case 'expense_rejected':
        return { icon: <AlertCircle size={16} />, color: '#dc3545', label: t('expenseRejected', 'Expense Rejected') }
      case 'adjustment':
        return { icon: <RefreshCw size={16} />, color: '#6c757d', label: t('adjustment', 'Adjustment') }
      case 'deduction':
        return { icon: <ArrowDownCircle size={16} />, color: '#dc3545', label: t('deduction', 'Deduction') }
      case 'reversal':
        return { icon: <RefreshCw size={16} />, color: '#fd7e14', label: t('reversal', 'Reversal') }
      default:
        return { icon: <History size={16} />, color: '#6c757d', label: type }
    }
  }

  // Handle view card modal with transaction loading
  const handleViewCard = async (card) => {
    setSelectedCard(card)
    setCardTransactions([])
    setShowViewModal(true)
    await loadCardTransactions(card.id)
  }

  // Card table columns
  const cardColumns = [
    {
      key: 'cardNumber',
      header: t('cardNumber', 'Card Number'),
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <CreditCard size={16} className="text-slate-400" />
          <span className="font-medium text-slate-800">{value}</span>
          <span className={`px-2 py-0.5 text-xs font-medium ${
            row.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
            row.status === 'suspended' ? 'bg-amber-100 text-amber-700' :
            'bg-slate-100 text-slate-600'
          }`}>{row.status}</span>
        </div>
      )
    },
    {
      key: 'cardName',
      header: t('cardName', 'Card Name'),
      sortable: true,
      render: (value) => (
        <span className="text-slate-800">{value}</span>
      )
    },
    {
      key: 'assignedStaff.name',
      header: t('assignedStaff', 'Assigned Staff'),
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2">
          <User size={16} className="text-slate-400" />
          <div>
            <div className="text-sm text-slate-800">{row.assignedStaff.name}</div>
            <div className="text-xs text-slate-500">{row.assignedStaff.role}</div>
          </div>
        </div>
      )
    },
    {
      key: 'currentBalance',
      header: t('currentBalance', 'Current Balance'),
      type: 'currency',
      sortable: true,
      align: 'right',
      render: (value) => (
        <span className={`font-medium ${
          value < 100 ? 'text-red-600' : value < 500 ? 'text-amber-600' : 'text-emerald-600'
        }`}>
          {formatCurrency(value)}
        </span>
      )
    },
    {
      key: 'monthlyLimit',
      header: t('monthlyLimit', 'Monthly Limit'),
      type: 'currency',
      sortable: true,
      align: 'right',
      render: (value) => <span className="text-slate-700">{formatCurrency(value)}</span>
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleViewCard(row)
            }}
            className="btn btn-outline btn-sm"
            title={t('viewDetails', 'View Details')}
          >
            <Eye size={14} />
          </button>
          {hasPermission('MANAGE_PETTY_CASH') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleEditCard(row)
              }}
              className="btn btn-outline btn-sm"
              title={t('edit', 'Edit')}
            >
              <Edit size={14} />
            </button>
          )}
          {row.status === 'active' && (
            <>
              {(hasPermission('RELOAD_CARD') || hasPermission('MANAGE_PETTY_CASH')) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleReloadCard(row)
                  }}
                  className="btn btn-success btn-sm"
                  title={t('reloadCard', 'Reload Card')}
                >
                  <RefreshCw size={14} />
                </button>
              )}
              {(hasPermission('CREATE_EXPENSE') || hasPermission('MANAGE_PETTY_CASH')) && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleAddExpense(row)
                  }}
                  className="btn btn-primary btn-sm"
                  title={t('addExpense', 'Add Expense')}
                >
                  <Receipt size={14} />
                </button>
              )}
              {hasPermission('MANAGE_PETTY_CASH') && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    openDeactivateCardModal(row)
                  }}
                  className="btn btn-warning btn-sm"
                  title={t('deactivateCard', 'Deactivate Card')}
                >
                  <Ban size={14} />
                </button>
              )}
            </>
          )}
          {row.status === 'suspended' && hasPermission('MANAGE_PETTY_CASH') && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleReactivateCard(row)
              }}
              className="btn btn-success btn-sm"
              title={t('reactivateCard', 'Reactivate Card')}
            >
              <PlayCircle size={14} />
            </button>
          )}
        </div>
      )
    }
  ]

  // Expense table columns
  const expenseColumns = [
    {
      key: 'expenseDate',
      header: t('date', 'Date'),
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2 text-slate-700">
          <Calendar size={14} className="text-slate-400" />
          <span>{value ? formatDate(value) : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'staffName',
      header: t('staff', 'Staff'),
      sortable: true,
      render: (value, row) => {
        const staffName = row.staffName ||
          `${row.submittedByName || ''} ${row.submittedByLastName || ''}`.trim() ||
          'Unknown';
        return (
          <div className="flex items-center gap-2">
            <User size={14} className="text-slate-400" />
            <div>
              <div className="text-sm text-slate-800">{staffName}</div>
              <div className="text-xs text-slate-500">{row.cardNumber || cards.find(c => c.id === row.cardId)?.cardNumber}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category',
      header: t('expenseType', 'Expense Type'),
      sortable: true,
      render: (value) => {
        const normalizedValue = value?.toLowerCase() || ''
        const expenseType = expenseTypes.find(type => type.id?.toLowerCase() === normalizedValue)
        return (
          <span className="px-2 py-1 text-xs font-medium bg-slate-100 text-slate-700">
            {expenseType?.name || value || 'Unknown'}
          </span>
        )
      }
    },
    {
      key: 'amount',
      header: t('amount', 'Amount'),
      type: 'currency',
      sortable: true,
      align: 'right',
      render: (value) => <span className="font-medium text-slate-800">{formatCurrency(value)}</span>
    },
    {
      key: 'vendor',
      header: t('merchant', 'Merchant'),
      sortable: true,
      render: (value) => <span className="text-slate-700">{value || '-'}</span>
    },
    {
      key: 'status',
      header: t('status', 'Status'),
      sortable: true,
      render: (value) => (
        <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${
          value === 'approved' ? 'bg-emerald-100 text-emerald-700' :
          value === 'pending' ? 'bg-amber-100 text-amber-700' :
          value === 'rejected' ? 'bg-red-100 text-red-700' :
          'bg-slate-100 text-slate-600'
        }`}>
          {value === 'approved' && <CheckCircle size={12} />}
          {value === 'pending' && <Clock size={12} />}
          {value === 'rejected' && <AlertCircle size={12} />}
          {t(value, value)}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center gap-1 flex-wrap">
          <button
            className={`btn btn-outline btn-sm ${
              !(row.hasReceipt || row.receiptPhoto) ? 'opacity-40 cursor-not-allowed' : ''
            }`}
            title={t('viewReceipt', 'View Receipt')}
            onClick={() => handleViewReceipt(row)}
            disabled={!(row.hasReceipt || row.receiptPhoto)}
          >
            <Receipt size={14} />
          </button>
          {hasPermission('MANAGE_PETTY_CASH') && (
            <button
              className="btn btn-outline btn-sm"
              title={row.status === 'rejected'
                ? t('viewRejectedExpense', 'View Rejected Expense')
                : row.status === 'approved'
                  ? t('editApprovedExpense', 'Edit Card/Amount (Approved Expense)')
                  : t('editExpense', 'Edit Expense')}
              onClick={() => handleEditExpense(row)}
            >
              {row.status === 'rejected' ? <Eye size={14} /> : <Edit size={14} />}
            </button>
          )}
          {row.status === 'pending' && hasPermission('APPROVE_EXPENSE') && (
            <>
              <button
                className="btn btn-success btn-sm"
                title={t('approveExpense', 'Approve Expense')}
                onClick={() => handleApproveExpense(row.id, 'approved')}
              >
                <CheckCircle size={14} />
              </button>
              <button
                className="btn btn-danger btn-sm"
                title={t('rejectExpense', 'Reject Expense')}
                onClick={() => handleApproveExpense(row.id, 'rejected')}
              >
                <AlertCircle size={14} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  // Remove early return - let DataTable handle loading state with skeleton

  return (
    <div className="p-6">
      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertCircle size={16} />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 text-red-400 hover:text-red-600 transition-colors"
          >
            ×
          </button>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200">
          <div className="p-3 bg-slate-100 text-slate-600">
            <CreditCard size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{cardStats.activeCards}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{t('activeCards', 'Active Cards')}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200">
          <div className="p-3 bg-emerald-100 text-emerald-600">
            <Banknote size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(cardStats.totalBalance)}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{t('totalBalance', 'Total Balance')}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200">
          <div className="p-3 bg-blue-100 text-blue-600">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{formatCurrency(cardStats.totalSpent)}</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{t('totalSpent', 'Total Spent')}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 p-4 bg-white border border-slate-200">
          <div className="p-3 bg-amber-100 text-amber-600">
            <Receipt size={22} />
          </div>
          <div>
            <div className="text-2xl font-bold text-slate-800">{cardStats.utilizationRate}%</div>
            <div className="text-xs text-slate-500 uppercase tracking-wider">{t('utilization', 'Utilization')}</div>
          </div>
        </div>
      </div>

      {/* Spending Chart */}
      {stats.monthlyTrend && (
        <div className="bg-white border border-slate-200 mb-6">
          <div className="px-5 py-4 border-b border-slate-200">
            <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider m-0">{t('spendingTrend', 'Spending Trend')}</h3>
          </div>
          <div className="p-5">
            <StockChart
              data={stats.monthlyTrend}
              xKey="month"
              yKey="total"
              type="line"
              height={300}
              title={t('monthlyExpenses', 'Monthly Expenses')}
            />
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-btn ${activeTab === 'cards' ? 'active' : ''}`}
          onClick={() => setActiveTab('cards')}
        >
          <CreditCard size={16} />
          {t('pettyCashCards', 'Cards')}
        </button>
        <button
          className={`tab-btn ${activeTab === 'expenses' ? 'active' : ''}`}
          onClick={() => setActiveTab('expenses')}
        >
          <Receipt size={16} />
          {t('expenses', 'Expenses')}
        </button>
        {hasPermission('MANAGE_PETTY_CASH') && (
          <button
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            <Users size={16} />
            {t('users', 'Users')}
          </button>
        )}
      </div>

      {/* Cards Tab */}
      {activeTab === 'cards' && (
        <DataTable
          data={cards.filter(card => cardFilter === 'all' || card.status === cardFilter)}
          columns={cardColumns}
          title={t('pettyCashCards', 'Petty Cash Cards')}
          subtitle={`${cards.length} ${t('cards', 'cards')}`}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                className="btn btn-outline"
                onClick={loadPettyCashData}
                disabled={loading}
                title={t('refresh', 'Refresh')}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              {hasPermission('MANAGE_PETTY_CASH') && (
                <button className="btn btn-primary" onClick={handleAddCard}>
                  <Plus size={16} />
                  {t('addCard', 'Add Card')}
                </button>
              )}
            </div>
          }
          customFilters={
            <select
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t('allCards', 'All Cards')}</option>
              <option value="active">{t('active', 'Active')}</option>
              <option value="inactive">{t('inactive', 'Inactive')}</option>
              <option value="blocked">{t('blocked', 'Blocked')}</option>
            </select>
          }
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          loading={loading}
          emptyMessage={t('noCardsFound', 'No cards found')}
                    initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* Expenses Tab */}
      {activeTab === 'expenses' && (
        <DataTable
          data={expenses.filter(expense => expenseFilter === 'all' || expense.status === expenseFilter)}
          columns={expenseColumns}
          title={t('recentExpenses', 'Recent Expenses')}
          subtitle={`${t('trackAllExpenses', 'Track all expense submissions')} - ${expenses.length} ${t('expenses', 'expenses')}`}
          headerActions={
            <div className="flex items-center gap-2">
              <button
                className="btn btn-outline"
                onClick={loadPettyCashData}
                disabled={loading}
                title={t('refresh', 'Refresh')}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              </button>
              {hasPermission('MANAGE_PETTY_CASH') && (
                <button className="btn btn-primary" onClick={() => handleAddExpense()}>
                  <Plus size={16} />
                  {t('addExpense', 'Add Expense')}
                </button>
              )}
            </div>
          }
          customFilters={
            <select
              value={expenseFilter}
              onChange={(e) => setExpenseFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">{t('allExpenses', 'All Expenses')}</option>
              <option value="approved">{t('approved', 'Approved')}</option>
              <option value="pending">{t('pending', 'Pending')}</option>
              <option value="rejected">{t('rejected', 'Rejected')}</option>
            </select>
          }
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          loading={loading}
          emptyMessage={t('noExpensesFound', 'No expenses found')}
          initialSearchTerm={urlSearchTerm}
        />
      )}

      {/* Petty Cash Users Tab */}
      {activeTab === 'users' && hasPermission('MANAGE_PETTY_CASH') && (
        <PettyCashUsersSection
          cards={cards}
          loading={loading}
          t={t}
          hasPermission={hasPermission}
          formatCurrency={formatCurrency}
          onRefresh={loadPettyCashData}
        />
      )}

      {/* Card Management Modal */}
      {showCardModal && (
        <CardFormModal
          isOpen={showCardModal}
          onClose={() => {
            setShowCardModal(false)
            setEditingCard(null)
          }}
          onSubmit={handleSaveCard}
          card={editingCard}
          formData={cardForm}
          setFormData={setCardForm}
          users={users}
          t={t}
        />
      )}

      {/* Expense Entry Modal */}
      {showExpenseModal && (
        <ExpenseFormModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
          onSave={handleSaveExpense}
          selectedCard={selectedCard}
          cards={cards}
          expenseTypes={expenseTypes}
          projects={projects}
          pettyCashUsers={pettyCashUsers}
          formData={expenseForm}
          setFormData={setExpenseForm}
          t={t}
        />
      )}

      {/* Card Reload Modal */}
      {showReloadModal && (
        <CardReloadModal
          isOpen={showReloadModal}
          onClose={() => setShowReloadModal(false)}
          onSubmit={handleReloadCardBalance}
          card={selectedCard}
          formData={reloadForm}
          setFormData={setReloadForm}
          t={t}
        />
      )}

      {/* Card View Modal */}
      {showViewModal && selectedCard && (
        <CardViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedCard(null)
            setCardTransactions([])
          }}
          card={selectedCard}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          t={t}
          transactions={cardTransactions}
          transactionsLoading={transactionsLoading}
          getTransactionTypeInfo={getTransactionTypeInfo}
        />
      )}

      {/* Card Deactivation Modal */}
      {showDeactivateCardModal && selectedCard && (
        <Modal
          isOpen={showDeactivateCardModal}
          onClose={() => {
            setShowDeactivateCardModal(false)
            setCardDeactivationReason('')
          }}
          title={t('deactivateCard', 'Deactivate Card')}
          className="modal-sm"
        >
          <form onSubmit={handleDeactivateCard} className="deactivation-form">
            <div className="alert-warning mb-4">
              <AlertCircle size={16} />
              <p>
                <strong>{t('warning', 'Warning')}:</strong>{' '}
                {t(
                  'deactivateCardWarning',
                  `Deactivating card ${selectedCard.cardNumber} will prevent any expenses from being recorded on this card. Associated petty cash users will also be affected.`
                )}
              </p>
            </div>

            <div className="form-group">
              <label>{t('deactivationReason', 'Reason for Deactivation')} *</label>
              <textarea
                value={cardDeactivationReason}
                onChange={(e) => setCardDeactivationReason(e.target.value)}
                placeholder={t('enterDeactivationReason', 'Enter the reason for deactivation...')}
                rows={3}
                required
              />
              <span className="text-xs text-muted">
                {t('minChars', 'Minimum 5 characters')}
              </span>
            </div>

            <div className="form-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setShowDeactivateCardModal(false)
                  setCardDeactivationReason('')
                }}
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-warning"
                disabled={loading || cardDeactivationReason.trim().length < 5}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {t('deactivating', 'Deactivating...')}
                  </>
                ) : (
                  <>
                    <Ban size={16} />
                    {t('deactivate', 'Deactivate')}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Edit Expense Modal */}
      {showEditExpenseModal && editingExpense && (
        <EditExpenseFormModal
          isOpen={showEditExpenseModal}
          onClose={() => {
            setShowEditExpenseModal(false)
            setEditingExpense(null)
          }}
          onSave={handleUpdateExpense}
          expense={editingExpense}
          cards={cards}
          expenseTypes={expenseTypes}
          pettyCashUsers={pettyCashUsers}
          projects={projects}
          formData={editExpenseForm}
          setFormData={setEditExpenseForm}
          t={t}
          formatCurrency={formatCurrency}
          onRefreshData={loadPettyCashData}
        />
      )}

      {/* Receipt Preview Modal */}
      {showReceiptModal && (
        <Modal
          isOpen={showReceiptModal}
          onClose={() => {
            setShowReceiptModal(false)
            setReceiptPreview(null)
          }}
          title={t('viewReceipt', 'View Receipt')}
          className="modal-lg"
        >
          <div className="space-y-4">
            {receiptLoading ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-500">
                <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
                <p className="text-sm">{t('loadingReceipt', 'Loading receipt...')}</p>
              </div>
            ) : receiptPreview ? (
              <>
                {/* Expense Info Header */}
                <div className="flex items-start justify-between p-4 bg-slate-50 border border-slate-200">
                  <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-2 py-0.5 bg-slate-200 text-slate-700 text-xs font-mono">
                      {receiptPreview.expense?.expenseNumber}
                    </div>
                    <div className="text-sm text-slate-600">
                      {receiptPreview.expense?.description}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-slate-800">
                      {formatCurrency(receiptPreview.expense?.amount)}
                    </div>
                    <div className="text-xs text-slate-500">
                      {formatDate(receiptPreview.expense?.expenseDate)}
                    </div>
                  </div>
                </div>

                {/* Receipt Navigation (if multiple) */}
                {receiptPreview.receipts.length > 1 && (
                  <div className="flex items-center justify-center gap-4 py-2">
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={receiptPreview.currentIndex === 0}
                      onClick={() => setReceiptPreview(prev => ({
                        ...prev,
                        currentIndex: prev.currentIndex - 1
                      }))}
                    >
                      ← {t('previous', 'Previous')}
                    </button>
                    <span className="text-sm text-slate-600 font-medium">
                      {receiptPreview.currentIndex + 1} / {receiptPreview.receipts.length}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      disabled={receiptPreview.currentIndex === receiptPreview.receipts.length - 1}
                      onClick={() => setReceiptPreview(prev => ({
                        ...prev,
                        currentIndex: prev.currentIndex + 1
                      }))}
                    >
                      {t('next', 'Next')} →
                    </button>
                  </div>
                )}

                {/* Receipt Display */}
                {(() => {
                  const currentReceipt = receiptPreview.receipts[receiptPreview.currentIndex]
                  const isPdf = currentReceipt?.contentType?.includes('pdf')

                  return (
                    <div className="space-y-3">
                      {isPdf ? (
                        <div className="border border-slate-200 bg-white">
                          <iframe
                            src={currentReceipt.downloadUrl}
                            title={currentReceipt.originalFilename || 'Receipt PDF'}
                            className="w-full h-[400px] border-0"
                          />
                        </div>
                      ) : (
                        <div className="flex items-center justify-center p-4 bg-slate-100 border border-slate-200 min-h-[300px]">
                          <img
                            src={currentReceipt.downloadUrl}
                            alt={currentReceipt.originalFilename || 'Receipt'}
                            className="max-w-full max-h-[400px] object-contain shadow-md"
                          />
                        </div>
                      )}

                      {/* Receipt filename and actions */}
                      <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200">
                        <span className="text-sm text-slate-600 truncate">
                          {currentReceipt.originalFilename || 'Receipt'}
                        </span>
                        <button
                          className="btn btn-primary btn-sm inline-flex items-center gap-1.5"
                          onClick={() => window.open(currentReceipt.downloadUrl, '_blank')}
                          title={t('openInNewTab', 'Open in New Tab')}
                        >
                          <Eye size={14} />
                          {t('openInNewTab', 'Open in New Tab')}
                        </button>
                      </div>
                    </div>
                  )
                })()}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Receipt size={48} className="mb-3 opacity-50" />
                <p className="text-sm">{t('noReceiptFound', 'No receipt found')}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  )
}

// Card Form Modal Component
const CardFormModal = ({ isOpen, onClose, onSubmit, card, formData, setFormData, users, t }) => {
  const isPetrolCard = formData.cardType === 'petrol'
  const isEditing = !!card

  return (
    <Modal
      isOpen={isOpen}
      title={card ? t('editCard', 'Edit Card') : t('addNewCard', 'Add New Card')}
      onClose={onClose}
      className="modal-lg"
      closeOnOverlayClick={false}
    >
      <form onSubmit={onSubmit} className="card-form">
        {/* Card Type Selection - Allow changes for both new and edit */}
        <div className="mb-6">
          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
            {t('cardType', 'Card Type')}
          </label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Top-up Card Option */}
            <label
              className={`
                relative flex items-start gap-3 p-4 cursor-pointer
                border transition-all duration-150
                ${formData.cardType === 'top_up'
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              <input
                type="radio"
                name="cardType"
                value="top_up"
                checked={formData.cardType === 'top_up'}
                onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
                className="mt-1 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <CreditCard size={18} className={formData.cardType === 'top_up' ? 'text-blue-600' : 'text-slate-400'} />
                  <span className={`text-sm font-semibold ${formData.cardType === 'top_up' ? 'text-blue-900' : 'text-slate-800'}`}>
                    {t('topUpCard', 'Top-up Card')}
                  </span>
                </div>
                <span className={`block text-xs mt-1 leading-relaxed ${formData.cardType === 'top_up' ? 'text-blue-700' : 'text-slate-500'}`}>
                  {t('topUpCardDesc', 'Assigned to individual user with balance')}
                </span>
              </div>
            </label>

            {/* Petrol Card Option */}
            <label
              className={`
                relative flex items-start gap-3 p-4 cursor-pointer
                border transition-all duration-150
                ${formData.cardType === 'petrol'
                  ? 'bg-amber-50 border-amber-500 ring-1 ring-amber-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
            >
              <input
                type="radio"
                name="cardType"
                value="petrol"
                checked={formData.cardType === 'petrol'}
                onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
                className="mt-1 w-4 h-4 text-amber-600 border-slate-300 focus:ring-amber-500"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Fuel size={18} className={formData.cardType === 'petrol' ? 'text-amber-600' : 'text-slate-400'} />
                  <span className={`text-sm font-semibold ${formData.cardType === 'petrol' ? 'text-amber-900' : 'text-slate-800'}`}>
                    {t('petrolCard', 'Petrol Card')}
                  </span>
                </div>
                <span className={`block text-xs mt-1 leading-relaxed ${formData.cardType === 'petrol' ? 'text-amber-700' : 'text-slate-500'}`}>
                  {t('petrolCardDesc', 'Shared fuel card for all users (one per company)')}
                </span>
              </div>
            </label>
          </div>

          {isPetrolCard && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <Fuel size={16} className="flex-shrink-0 mt-0.5" />
              <p>{t('petrolCardNote', 'Petrol cards are shared across all users and can only be used for fuel expenses.')}</p>
            </div>
          )}
          {isEditing && card?.card_type !== formData.cardType && (
            <div className="flex items-start gap-2 mt-3 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <p>{t('cardTypeChangeWarning', 'Changing card type may affect user assignments. Please verify petty cash user settings after this change.')}</p>
            </div>
          )}
        </div>

        <div className="form-section">
          <h3>{t('cardInformation', 'Card Information')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('cardNumber', 'Card Number')}</label>
              <input
                type="text"
                value={formData.cardNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cardNumber: e.target.value }))}
                placeholder={t('cardNumberPlaceholder', 'Enter physical card number or leave empty for auto-generate')}
              />
              <span className="form-help">{t('cardNumberHelp', 'Enter the physical card number or leave empty to auto-generate')}</span>
            </div>
            <div className="form-group">
              <label>{t('cardName', 'Card Name')}</label>
              <input
                type="text"
                value={formData.cardName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
                placeholder={isPetrolCard ? t('petrolCardName', 'Petrol Card') : t('cardNamePlaceholder', 'e.g., Main Office, Driver 1')}
              />
              <span className="form-help">{t('cardNameDescription', 'Optional descriptive name for this card')}</span>
            </div>
            <div className="form-group">
              <label>{t('department', 'Department')}</label>
              <input
                type="text"
                value={formData.department}
                onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                placeholder={t('departmentPlaceholder', 'e.g., Accounting, Sales')}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>{t('cardLimits', 'Card Limits')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('initialBalance', 'Initial Balance')} (OMR) *</label>
              <input
                type="number"
                step="0.001"
                value={formData.initialBalance}
                onChange={(e) => setFormData(prev => ({ ...prev, initialBalance: e.target.value }))}
                required
                min="0"
              />
            </div>
            <div className="form-group">
              <label>{t('monthlyLimit', 'Monthly Limit')} (OMR)</label>
              <input
                type="number"
                step="0.001"
                value={formData.monthlyLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                min="0"
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>{t('validityPeriod', 'Validity Period')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <DateInput
                label={`${t('issueDate', 'Issue Date')} *`}
                value={formData.issueDate || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, issueDate: value || '' }))}
                required
              />
            </div>
            <div className="form-group">
              <DateInput
                label={t('expiryDate', 'Expiry Date')}
                value={formData.expiryDate || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, expiryDate: value || '' }))}
                minDate={formData.issueDate || ''}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label>{t('notes', 'Notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="3"
            placeholder={t('notesPlaceholder', 'Any additional notes about this card...')}
          />
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {card ? t('updateCard', 'Update Card') : t('createCard', 'Create Card')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Expense Form Modal Component - USER-FIRST SELECTION APPROACH
// Flow: Select User → Select Category → Payment Method auto-determined by user's cards
const ExpenseFormModal = ({ isOpen, onClose, onSave, selectedCard, cards, expenseTypes, projects = [], pettyCashUsers = [], formData, setFormData, t }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  // Get selected petty cash user and their cards
  const selectedPcUser = React.useMemo(() => {
    if (!formData.pcUserId) return null
    return pettyCashUsers.find(u => u.id === parseInt(formData.pcUserId))
  }, [formData.pcUserId, pettyCashUsers])

  // Get the selected user's top-up card
  const userTopUpCard = React.useMemo(() => {
    if (!selectedPcUser?.card_id) return null
    return cards.find(c => c.id === selectedPcUser.card_id && c.status === 'active')
  }, [selectedPcUser, cards])

  // Get the selected user's petrol card
  const userPetrolCard = React.useMemo(() => {
    if (!selectedPcUser?.petrol_card_id) return null
    return cards.find(c => c.id === selectedPcUser.petrol_card_id && c.status === 'active')
  }, [selectedPcUser, cards])

  // Determine if current expense type is fuel
  const isFuelExpense = formData.expenseType?.toLowerCase() === 'fuel'

  // Handle user selection - auto-select appropriate card based on context
  const handleUserChange = (userId) => {
    const pcUser = pettyCashUsers.find(u => u.id === parseInt(userId))
    if (!pcUser) {
      setFormData(prev => ({ ...prev, pcUserId: '', cardId: '', paymentMethod: 'iou' }))
      return
    }

    // Get user's cards
    const topUpCard = pcUser.card_id ? cards.find(c => c.id === pcUser.card_id && c.status === 'active') : null
    const petrolCard = pcUser.petrol_card_id ? cards.find(c => c.id === pcUser.petrol_card_id && c.status === 'active') : null

    // Determine initial payment method and card based on expense type
    let paymentMethod = 'iou' // Default to IOU if no cards
    let cardId = ''

    if (isFuelExpense && petrolCard) {
      paymentMethod = 'petrol_card'
      cardId = petrolCard.id.toString()
    } else if (topUpCard) {
      paymentMethod = 'top_up_card'
      cardId = topUpCard.id.toString()
    } else if (petrolCard && !isFuelExpense) {
      // User only has petrol card but expense is not fuel - use IOU
      paymentMethod = 'iou'
      cardId = ''
    }

    setFormData(prev => ({
      ...prev,
      pcUserId: userId,
      cardId,
      paymentMethod
    }))
  }

  // Handle expense type change - auto-select appropriate payment method for selected user
  const handleExpenseTypeChange = (categoryId) => {
    const normalizedCategory = categoryId?.toLowerCase()

    if (!selectedPcUser) {
      // No user selected yet, just update expense type
      setFormData(prev => ({ ...prev, expenseType: categoryId }))
      return
    }

    if (normalizedCategory === 'fuel') {
      // Auto-select petrol card when fuel is selected (if user has one)
      if (userPetrolCard) {
        setFormData(prev => ({
          ...prev,
          expenseType: categoryId,
          paymentMethod: 'petrol_card',
          cardId: userPetrolCard.id.toString()
        }))
      } else {
        // User doesn't have petrol card - fallback to top-up or IOU
        setFormData(prev => ({
          ...prev,
          expenseType: categoryId,
          paymentMethod: userTopUpCard ? 'top_up_card' : 'iou',
          cardId: userTopUpCard ? userTopUpCard.id.toString() : ''
        }))
      }
    } else {
      // Non-fuel expense - use top-up card if available
      setFormData(prev => ({
        ...prev,
        expenseType: categoryId,
        paymentMethod: userTopUpCard ? 'top_up_card' : 'iou',
        cardId: userTopUpCard ? userTopUpCard.id.toString() : ''
      }))
    }
  }

  // Get available payment methods for selected user
  const getAvailablePaymentMethods = () => {
    const methods = []

    // Top-up card available if user has one
    if (userTopUpCard) {
      methods.push({
        id: 'top_up_card',
        label: t('topUpCard', 'Top-up Card'),
        cardNumber: userTopUpCard.cardNumber,
        balance: parseFloat(userTopUpCard.currentBalance || 0)
      })
    }

    // Petrol card available only for fuel expenses if user has one
    if (userPetrolCard && isFuelExpense) {
      methods.push({
        id: 'petrol_card',
        label: t('petrolCard', 'Petrol Card'),
        cardNumber: userPetrolCard.cardNumber,
        balance: parseFloat(userPetrolCard.currentBalance || 0)
      })
    }

    // IOU always available
    methods.push({
      id: 'iou',
      label: t('iouPayment', 'IOU (Personal)'),
      balance: null
    })

    return methods
  }

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    let cardId = ''
    if (method === 'top_up_card' && userTopUpCard) {
      cardId = userTopUpCard.id.toString()
    } else if (method === 'petrol_card' && userPetrolCard) {
      cardId = userPetrolCard.id.toString()
    }
    setFormData(prev => ({ ...prev, paymentMethod: method, cardId }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (typeof onSave !== 'function') {
        throw new Error('onSave handler not provided')
      }
      await onSave(formData)
      // onSave will handle closing the modal on success
    } catch (err) {
      setError(err.message || 'Failed to save expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={t('addExpense', 'Add Expense')}
      onClose={onClose}
      className="modal-lg"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* USER SELECTION - FIRST (determines available cards) */}
        <div className="form-group">
          <label className="flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            {t('selectUser', 'Select User')} *
          </label>
          <select
            value={formData.pcUserId || ''}
            onChange={(e) => handleUserChange(e.target.value)}
            required
            className="w-full"
          >
            <option value="">{t('selectPettyCashUser', 'Select Petty Cash User')}</option>
            {pettyCashUsers.filter(u => u.is_active !== false).map(user => (
              <option key={user.id} value={user.id}>
                {user.name} {user.department ? `(${user.department})` : ''}
                {user.card_id || user.petrol_card_id ? '' : ' - No cards'}
              </option>
            ))}
          </select>
          <p className="text-xs text-slate-500 mt-1">
            {t('selectUserForExpense', 'Select the user this expense belongs to')}
          </p>
        </div>

        {/* Selected User Info Panel - Show cards available */}
        {selectedPcUser && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="text-sm font-medium text-slate-700 mb-2">{selectedPcUser.name}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {userTopUpCard ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  💳 {t('topUpCard', 'Top-up Card')}: OMR {parseFloat(userTopUpCard.currentBalance || 0).toFixed(3)}
                </span>
              ) : (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded">
                  💳 {t('noTopUpCard', 'No top-up card')}
                </span>
              )}
              {userPetrolCard ? (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                  ⛽ {t('petrolCard', 'Petrol Card')}: OMR {parseFloat(userPetrolCard.currentBalance || 0).toFixed(3)}
                </span>
              ) : (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded">
                  ⛽ {t('noPetrolCard', 'No petrol card')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Project Selection - SECOND for context */}
        {projects.length > 0 && (
          <div className="form-group">
            <label className="flex items-center gap-2">
              <FolderOpen size={16} className="text-slate-400" />
              {t('project', 'Project')}
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
            >
              <option value="">{t('selectProject', 'Select a project (optional)')}</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-slate-500 mt-1">
              {t('projectExpenseNote', 'Link this expense to a specific project')}
            </p>
          </div>
        )}

        {/* Expense Type Selection - THIRD to trigger payment method auto-selection */}
        <div className="form-group">
          <label>{t('expenseType', 'Expense Type')} *</label>
          <select
            value={formData.expenseType}
            onChange={(e) => handleExpenseTypeChange(e.target.value)}
            required
          >
            <option value="">{t('selectExpenseType', 'Select Expense Type')}</option>
            {expenseTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}{type.maxAmount ? ` - ${t('maxAmount', 'Max')}: OMR ${type.maxAmount}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Payment Method Selection - FOURTH (auto-populated based on user's cards) */}
        {selectedPcUser && (
          <div className="form-group">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {t('paymentMethod', 'Payment Method')} *
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {getAvailablePaymentMethods().map(method => {
                const isSelected = formData.paymentMethod === method.id
                const isRecommended = method.id === 'petrol_card' && isFuelExpense

                // Color classes based on payment method type
                const getColorClasses = () => {
                  if (!isSelected) return 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  switch (method.id) {
                    case 'top_up_card': return 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    case 'petrol_card': return 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500'
                    case 'iou': return 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                    default: return 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                  }
                }

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => handlePaymentMethodChange(method.id)}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border transition-all duration-150 ${getColorClasses()}`}
                    title={method.balance !== null ? `${t('balance', 'Balance')}: OMR ${method.balance.toFixed(3)}` : ''}
                  >
                    {method.id === 'top_up_card' && <CreditCard size={14} />}
                    {method.id === 'petrol_card' && <Fuel size={14} />}
                    {method.id === 'iou' && <Banknote size={14} />}
                    <span>{method.label}</span>
                    {method.cardNumber && <span className="text-[10px] opacity-75">({method.cardNumber})</span>}
                    {isRecommended && (
                      <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">
                        {t('recommended', 'Recommended')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Balance info for selected method */}
            {formData.paymentMethod && formData.paymentMethod !== 'iou' && (
              <div className="mt-2 text-xs text-slate-500">
                {formData.paymentMethod === 'top_up_card' && userTopUpCard && (
                  <span>{t('balance', 'Balance')}: OMR {parseFloat(userTopUpCard.currentBalance || 0).toFixed(3)}</span>
                )}
                {formData.paymentMethod === 'petrol_card' && userPetrolCard && (
                  <span>{t('balance', 'Balance')}: OMR {parseFloat(userPetrolCard.currentBalance || 0).toFixed(3)}</span>
                )}
              </div>
            )}
            {/* Info messages */}
            {isFuelExpense && userPetrolCard && formData.paymentMethod === 'petrol_card' && (
              <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                <Fuel size={14} className="shrink-0" />
                <span>{t('petrolCardAutoSelected', 'Petrol card auto-selected for fuel expenses')}</span>
              </div>
            )}
            {isFuelExpense && !userPetrolCard && (
              <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{t('noPetrolCardWarning', 'This user has no petrol card assigned. Consider using IOU for fuel expenses.')}</span>
              </div>
            )}
          </div>
        )}

        {/* Prompt to select user first */}
        {!selectedPcUser && (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded text-center text-slate-600 text-sm">
            {t('selectUserFirst', 'Please select a user first to see available payment methods')}
          </div>
        )}

        <div className="form-grid">
          <div className="form-group">
            <label>{t('amount', 'Amount')} (OMR) *</label>
            <input
              type="number"
              step="0.001"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <DateInput
              label={`${t('transactionDate', 'Transaction Date')} *`}
              value={formData.transactionDate || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, transactionDate: value || '' }))}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('description', 'Description')} *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            placeholder={t('expenseDescription', 'Brief description of expense')}
          />
        </div>

        <div className="form-group">
          <label>{t('merchant', 'Merchant')}</label>
          <input
            type="text"
            value={formData.merchant}
            onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
            placeholder={t('merchantName', 'Store/vendor name')}
          />
        </div>

        {/* Receipt Upload (S3-integrated) */}
        <div className="form-group">
          <ReceiptUpload
            label={t('uploadReceipt', 'Upload Receipt')}
            value={formData.receiptFile}
            onChange={(file) => setFormData(prev => ({ ...prev, receiptFile: file }))}
          />
        </div>

        <div className="form-group">
          <label>{t('notes', 'Additional Notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="3"
            placeholder={t('additionalNotes', 'Any additional details...')}
          />
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? t('submitting', 'Submitting...') : t('submitExpense', 'Submit Expense')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Card Reload Modal Component
const CardReloadModal = ({ isOpen, onClose, onSubmit, card, formData, setFormData, t }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    try {
      if (typeof onSubmit !== 'function') {
        throw new Error('onSubmit handler not provided')
      }
      await onSubmit(formData)
      // onSubmit will handle closing the modal on success
    } catch (err) {
      setError(err.message || 'Failed to reload card')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!card) return null

  return (
    <Modal
      isOpen={isOpen}
      title={t('reloadCard', 'Reload Card')}
      onClose={onClose}
      className="modal-md"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-4 bg-slate-50 border border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 mb-2">{card.cardName}</h3>
          <p className="text-sm text-slate-600">{t('assignedTo', 'Assigned to')}: {card.assignedStaff?.name || 'N/A'}</p>
          <p className="text-sm text-slate-600">{t('currentBalance', 'Current Balance')}: <span className="font-semibold text-emerald-600">OMR {parseFloat(card.currentBalance || 0).toFixed(3)}</span></p>
        </div>

        <div className="form-group">
          <label>{t('reloadAmount', 'Reload Amount')} (OMR) *</label>
          <input
            type="number"
            step="0.001"
            value={formData.amount}
            onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
            required
            min="1"
            max="10000"
          />
        </div>

        <div className="form-group">
          <DateInput
            label={`${t('reloadDate', 'Reload Date')} *`}
            value={formData.reloadDate || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, reloadDate: value || '' }))}
            required
          />
        </div>

        <div className="form-group">
          <label>{t('reloadNotes', 'Notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="3"
            placeholder={t('reloadReason', 'Reason for reload, approval reference, etc.')}
          />
        </div>

        <div className="p-4 bg-emerald-50 border border-emerald-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t('currentBalance', 'Current Balance')}:</span>
            <span>OMR {parseFloat(card.currentBalance || 0).toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">{t('reloadAmount', 'Reload Amount')}:</span>
            <span className="text-emerald-600">+OMR {(parseFloat(formData.amount) || 0).toFixed(3)}</span>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t border-emerald-200">
            <span className="font-medium text-slate-700">{t('newBalance', 'New Balance')}:</span>
            <span className="font-bold text-emerald-700">OMR {(parseFloat(card.currentBalance || 0) + (parseFloat(formData.amount) || 0)).toFixed(3)}</span>
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn btn-success" disabled={isSubmitting}>
            <RefreshCw size={16} />
            {isSubmitting ? t('reloading', 'Reloading...') : t('reloadCard', 'Reload Card')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Edit Expense Form Modal Component - USER-FIRST SELECTION APPROACH
const EditExpenseFormModal = ({
  isOpen,
  onClose,
  onSave,
  expense,
  cards,
  expenseTypes,
  pettyCashUsers = [],
  projects = [],
  formData,
  setFormData,
  t,
  formatCurrency,
  onRefreshData
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [receipts, setReceipts] = React.useState([])
  const [loadingReceipts, setLoadingReceipts] = React.useState(false)
  const [maxReceipts, setMaxReceipts] = React.useState(2)
  const [deletingReceiptId, setDeletingReceiptId] = React.useState(null)

  // Card/Amount change confirmation state for approved expenses
  const [showCardChangeConfirm, setShowCardChangeConfirm] = React.useState(false)
  const [cardChangeNotes, setCardChangeNotes] = React.useState('')
  const [originalCardId, setOriginalCardId] = React.useState(null)
  const [originalAmount, setOriginalAmount] = React.useState(null)

  // Track original card and amount when modal opens
  React.useEffect(() => {
    if (isOpen && expense) {
      setOriginalCardId(expense.cardId)
      setOriginalAmount(parseFloat(expense.amount) || 0)
    }
  }, [isOpen, expense?.cardId, expense?.amount])

  // Get selected petty cash user and their cards (USER-FIRST APPROACH)
  const selectedPcUser = React.useMemo(() => {
    if (!formData.pcUserId) return null
    return pettyCashUsers.find(u => u.id === parseInt(formData.pcUserId))
  }, [formData.pcUserId, pettyCashUsers])

  // Get the selected user's top-up card
  const userTopUpCard = React.useMemo(() => {
    if (!selectedPcUser?.card_id) return null
    return cards.find(c => c.id === selectedPcUser.card_id && c.status === 'active')
  }, [selectedPcUser, cards])

  // Get the selected user's petrol card
  const userPetrolCard = React.useMemo(() => {
    if (!selectedPcUser?.petrol_card_id) return null
    return cards.find(c => c.id === selectedPcUser.petrol_card_id && c.status === 'active')
  }, [selectedPcUser, cards])

  // Determine if current expense type is fuel
  const isFuelExpense = formData.expenseType?.toLowerCase() === 'fuel'

  // Handle user selection - auto-select appropriate card based on context
  const handleUserChange = (userId) => {
    const pcUser = pettyCashUsers.find(u => u.id === parseInt(userId))
    if (!pcUser) {
      setFormData(prev => ({ ...prev, pcUserId: '', cardId: '', paymentMethod: 'iou' }))
      return
    }

    // Get user's cards
    const topUpCard = pcUser.card_id ? cards.find(c => c.id === pcUser.card_id && c.status === 'active') : null
    const petrolCard = pcUser.petrol_card_id ? cards.find(c => c.id === pcUser.petrol_card_id && c.status === 'active') : null

    // Determine payment method and card based on expense type
    let paymentMethod = 'iou'
    let cardId = ''

    if (isFuelExpense && petrolCard) {
      paymentMethod = 'petrol_card'
      cardId = petrolCard.id.toString()
    } else if (topUpCard) {
      paymentMethod = 'top_up_card'
      cardId = topUpCard.id.toString()
    }

    setFormData(prev => ({
      ...prev,
      pcUserId: userId,
      cardId,
      paymentMethod
    }))
  }

  // Handle expense type change - auto-select appropriate payment method
  const handleExpenseTypeChange = (categoryId) => {
    const normalizedCategory = categoryId?.toLowerCase()

    if (!selectedPcUser) {
      setFormData(prev => ({ ...prev, expenseType: categoryId }))
      return
    }

    if (normalizedCategory === 'fuel') {
      if (userPetrolCard) {
        setFormData(prev => ({
          ...prev,
          expenseType: categoryId,
          paymentMethod: 'petrol_card',
          cardId: userPetrolCard.id.toString()
        }))
      } else {
        setFormData(prev => ({
          ...prev,
          expenseType: categoryId,
          paymentMethod: userTopUpCard ? 'top_up_card' : 'iou',
          cardId: userTopUpCard ? userTopUpCard.id.toString() : ''
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        expenseType: categoryId,
        paymentMethod: userTopUpCard ? 'top_up_card' : 'iou',
        cardId: userTopUpCard ? userTopUpCard.id.toString() : ''
      }))
    }
  }

  // Get available payment methods for selected user
  const getAvailablePaymentMethods = () => {
    const methods = []

    if (userTopUpCard) {
      methods.push({
        id: 'top_up_card',
        label: t('topUpCard', 'Top-up Card'),
        cardNumber: userTopUpCard.cardNumber,
        balance: parseFloat(userTopUpCard.currentBalance || 0)
      })
    }

    if (userPetrolCard && isFuelExpense) {
      methods.push({
        id: 'petrol_card',
        label: t('petrolCard', 'Petrol Card'),
        cardNumber: userPetrolCard.cardNumber,
        balance: parseFloat(userPetrolCard.currentBalance || 0)
      })
    }

    methods.push({
      id: 'iou',
      label: t('iouPayment', 'IOU (Personal)'),
      balance: null
    })

    return methods
  }

  // Handle payment method change
  const handlePaymentMethodChange = (method) => {
    let cardId = ''
    if (method === 'top_up_card' && userTopUpCard) {
      cardId = userTopUpCard.id.toString()
    } else if (method === 'petrol_card' && userPetrolCard) {
      cardId = userPetrolCard.id.toString()
    }
    setFormData(prev => ({ ...prev, paymentMethod: method, cardId }))
  }

  // Load existing receipts when modal opens
  React.useEffect(() => {
    const loadReceipts = async () => {
      if (!isOpen || !expense?.id) return

      setLoadingReceipts(true)
      try {
        const result = await pettyCashService.getExpenseReceipts(expense.id)
        if (result.success) {
          setReceipts(result.data?.receipts || [])
          setMaxReceipts(result.data?.maxAllowed || 2)
        }
      } catch (err) {
        console.error('Error loading receipts:', err)
      } finally {
        setLoadingReceipts(false)
      }
    }

    loadReceipts()
  }, [isOpen, expense?.id])

  // Check expense status for field restrictions
  const isApprovedExpense = expense?.status === 'approved'
  const isRejectedExpense = expense?.status === 'rejected'
  const isReadOnly = isRejectedExpense // Rejected expenses are view-only
  const cardHasChanged = originalCardId && formData.cardId && originalCardId.toString() !== formData.cardId.toString()
  const currentAmount = parseFloat(formData.amount) || 0
  const amountHasChanged = originalAmount !== null && Math.abs(currentAmount - originalAmount) > 0.001

  // Get card details for confirmation dialog
  const getOldCard = () => cards.find(c => c.id === parseInt(originalCardId))
  const getNewCard = () => cards.find(c => c.id === parseInt(formData.cardId))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    // For both pending and approved expenses with card or amount change, show confirmation dialog
    // Payment methods that affect card balance
    const balanceAffectingMethods = ['top_up_card', 'petrol_card']
    const requiresBalanceAdjustment = balanceAffectingMethods.includes(expense.paymentMethod || expense.payment_method)

    if (requiresBalanceAdjustment && (cardHasChanged || amountHasChanged)) {
      const oldCard = getOldCard()
      const newCard = getNewCard()
      const oldCardBalance = parseFloat(oldCard?.currentBalance || 0)
      const newCardBalance = parseFloat(newCard?.currentBalance || 0)

      // Check if operation is valid
      if (cardHasChanged) {
        // Card change: need sufficient balance on new card for the new amount
        if (newCardBalance < currentAmount) {
          setError(t('cardChangeInsufficientBalance', 'Insufficient balance for this operation') +
            `. ${t('required', 'Required')}: ${currentAmount.toFixed(3)}, ${t('available', 'Available')}: ${newCardBalance.toFixed(3)}`)
          return
        }
      } else if (amountHasChanged) {
        // Amount-only change: if increasing, need sufficient balance on same card
        const amountDiff = currentAmount - originalAmount
        if (amountDiff > 0 && oldCardBalance < amountDiff) {
          setError(t('cardChangeInsufficientBalance', 'Insufficient balance for this operation') +
            `. ${t('additionalDeduction', 'Additional Deduction')}: ${amountDiff.toFixed(3)}, ${t('available', 'Available')}: ${oldCardBalance.toFixed(3)}`)
          return
        }
      }

      setShowCardChangeConfirm(true)
      return
    }

    setIsSubmitting(true)

    try {
      if (typeof onSave !== 'function') {
        throw new Error('onSave handler not provided')
      }
      await onSave(formData)
    } catch (err) {
      setError(err.message || 'Failed to update expense')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle card/amount change confirmation
  const handleConfirmCardChange = async () => {
    setIsSubmitting(true)
    setError(null)

    try {
      let result

      if (isApprovedExpense) {
        // For approved expenses, use the special changeExpenseCard endpoint
        result = await pettyCashService.changeExpenseCard(
          expense.id,
          parseInt(formData.cardId),
          amountHasChanged ? currentAmount : null,
          cardChangeNotes || null
        )
      } else {
        // For pending expenses, use the regular update endpoint
        // Backend will handle balance adjustments automatically
        if (typeof onSave !== 'function') {
          throw new Error('onSave handler not provided')
        }
        await onSave(formData)
        result = { success: true }
      }

      if (result.success) {
        setShowCardChangeConfirm(false)
        setCardChangeNotes('')
        // Refresh data to show updated balances (force refresh to bypass cache)
        if (typeof onRefreshData === 'function') {
          await onRefreshData(true)
        }
        onClose()
        // Show success message
        alert(t('cardChangeSuccess', 'Changes applied successfully. Card balances have been updated.'))
      } else {
        setError(result.error || 'Failed to apply changes')
      }
    } catch (err) {
      setError(err.message || 'Failed to apply changes')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancelCardChange = () => {
    setShowCardChangeConfirm(false)
    setCardChangeNotes('')
    // Reset card and amount to original
    setFormData(prev => ({
      ...prev,
      cardId: originalCardId?.toString() || '',
      amount: originalAmount?.toString() || ''
    }))
  }

  // Handle receipt file selection and upload
  const handleReceiptChange = async (file) => {
    if (!file) return

    // Check if we can upload more
    if (receipts.length >= maxReceipts) {
      setError(`Maximum ${maxReceipts} receipts allowed. Delete an existing receipt first.`)
      return
    }

    setFormData(prev => ({ ...prev, receiptFile: file }))

    // Upload immediately
    try {
      setIsSubmitting(true)
      const result = await pettyCashService.uploadReceipt(expense.id, file)
      if (result.success) {
        // Add to receipts list
        setReceipts(prev => [...prev, {
          id: result.data.id,
          storageKey: result.data.storageKey,
          originalFilename: result.data.originalFilename,
          downloadUrl: result.data.downloadUrl,
          uploadedAt: new Date().toISOString()
        }])
        setFormData(prev => ({ ...prev, receiptFile: null }))
      } else {
        setError(result.error || 'Failed to upload receipt')
      }
    } catch (err) {
      setError(err.message || 'Failed to upload receipt')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Handle deleting a receipt
  const handleDeleteReceipt = async (receiptId) => {
    if (!window.confirm(t('confirmDeleteReceipt', 'Are you sure you want to delete this receipt?'))) {
      return
    }

    setDeletingReceiptId(receiptId)
    try {
      const result = await pettyCashService.deleteReceipt(expense.id, receiptId)
      if (result.success) {
        setReceipts(prev => prev.filter(r => r.id !== receiptId))
      } else {
        setError(result.error || 'Failed to delete receipt')
      }
    } catch (err) {
      setError(err.message || 'Failed to delete receipt')
    } finally {
      setDeletingReceiptId(null)
    }
  }

  if (!expense) return null

  // Get card details for the confirmation dialog
  const oldCard = getOldCard()
  const newCard = getNewCard()
  const oldCardBalance = parseFloat(oldCard?.currentBalance || 0)
  const newCardBalance = parseFloat(newCard?.currentBalance || 0)
  const amountDiff = currentAmount - originalAmount

  return (
    <>
      {/* Card/Amount Change Confirmation Dialog */}
      <Modal
        isOpen={showCardChangeConfirm}
        title={t('cardChangeConfirmTitle', 'Confirm Expense Changes')}
        onClose={handleCancelCardChange}
        className="modal-md"
        closeOnOverlayClick={false}
      >
        <div className="space-y-4">
          {/* Warning Header */}
          <div className="flex items-start gap-3 p-3 bg-amber-50 border border-amber-200 text-amber-800">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{t('cardChangeWarning', 'This expense is already approved. This change will affect card balances:')}</p>
          </div>

          {/* Change Summary */}
          <div className="space-y-3">
            {/* Card Change Section */}
            {cardHasChanged && (
              <>
                {/* Old Card - Refund */}
                <div className="p-4 bg-emerald-50 border border-emerald-200">
                  <div className="flex items-center gap-2 mb-3">
                    <RefreshCw size={16} className="text-emerald-600" />
                    <span className="text-sm font-semibold text-emerald-800">{t('cardChangeRefundOldCard', 'Refund the previous card')}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-emerald-200">
                      <span className="text-emerald-600">{t('cardChangeOldCardInfo', 'Previous Card')}</span>
                      <span className="font-medium text-emerald-800">
                        {oldCard?.card_type === 'petrol' ? '⛽ ' : ''}{oldCard?.cardNumber} - {oldCard?.cardName || t('unassigned', 'Unassigned')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('cardChangeRefundAmount', 'Refund Amount')}:</span>
                      <span className="font-semibold text-emerald-600">+OMR {originalAmount?.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('cardChangeCurrentBalance', 'Current Balance')}:</span>
                      <span>OMR {oldCardBalance.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-emerald-200">
                      <span className="font-medium text-slate-700">{t('cardChangeNewBalance', 'New Balance')}:</span>
                      <span className="font-bold text-emerald-700">OMR {(oldCardBalance + originalAmount).toFixed(3)}</span>
                    </div>
                  </div>
                </div>

                {/* New Card - Deduction */}
                <div className="p-4 bg-red-50 border border-red-200">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard size={16} className="text-red-600" />
                    <span className="text-sm font-semibold text-red-800">{t('cardChangeDeductNewCard', 'Deduct from the new card')}</span>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-red-200">
                      <span className="text-red-600">{t('cardChangeNewCardInfo', 'New Card')}</span>
                      <span className="font-medium text-red-800">
                        {newCard?.card_type === 'petrol' ? '⛽ ' : ''}{newCard?.cardNumber} - {newCard?.cardName || t('unassigned', 'Unassigned')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('cardChangeDeductAmount', 'Deduct Amount')}:</span>
                      <span className="font-semibold text-red-600">-OMR {currentAmount.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">{t('cardChangeCurrentBalance', 'Current Balance')}:</span>
                      <span>OMR {newCardBalance.toFixed(3)}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-red-200">
                      <span className="font-medium text-slate-700">{t('cardChangeNewBalance', 'New Balance')}:</span>
                      <span className="font-bold text-red-700">OMR {(newCardBalance - currentAmount).toFixed(3)}</span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* Amount-Only Change Section */}
            {!cardHasChanged && amountHasChanged && (
              <div className={`p-4 border ${amountDiff > 0 ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
                <div className="flex items-center gap-2 mb-3">
                  {amountDiff > 0 ? (
                    <>
                      <CreditCard size={16} className="text-red-600" />
                      <span className="text-sm font-semibold text-red-800">{t('additionalDeduction', 'Additional Deduction')}</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw size={16} className="text-emerald-600" />
                      <span className="text-sm font-semibold text-emerald-800">{t('partialRefund', 'Partial Refund')}</span>
                    </>
                  )}
                </div>
                <div className="space-y-2 text-sm">
                  <div className={`flex justify-between items-center pb-2 border-b ${amountDiff > 0 ? 'border-red-200' : 'border-emerald-200'}`}>
                    <span className={amountDiff > 0 ? 'text-red-600' : 'text-emerald-600'}>{t('selectCard', 'Card')}</span>
                    <span className={`font-medium ${amountDiff > 0 ? 'text-red-800' : 'text-emerald-800'}`}>
                      {oldCard?.card_type === 'petrol' ? '⛽ ' : ''}{oldCard?.cardNumber} - {oldCard?.cardName || t('unassigned', 'Unassigned')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('originalAmount', 'Original Amount')}:</span>
                    <span>OMR {originalAmount?.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('newAmount', 'New Amount')}:</span>
                    <span>OMR {currentAmount.toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('amountDifference', 'Difference')}:</span>
                    <span className={`font-semibold ${amountDiff > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                      {amountDiff > 0 ? '-' : '+'}OMR {Math.abs(amountDiff).toFixed(3)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">{t('cardChangeCurrentBalance', 'Current Balance')}:</span>
                    <span>OMR {oldCardBalance.toFixed(3)}</span>
                  </div>
                  <div className={`flex justify-between pt-2 border-t ${amountDiff > 0 ? 'border-red-200' : 'border-emerald-200'}`}>
                    <span className="font-medium text-slate-700">{t('cardChangeNewBalance', 'New Balance')}:</span>
                    <span className={`font-bold ${amountDiff > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                      OMR {(oldCardBalance - amountDiff).toFixed(3)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notes Input */}
          <div className="form-group">
            <label>{t('cardChangeReason', 'Reason for change (optional)')}</label>
            <textarea
              value={cardChangeNotes}
              onChange={(e) => setCardChangeNotes(e.target.value)}
              rows="2"
              placeholder={t('changeReasonPlaceholder', 'Enter reason for this change...')}
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertCircle size={16} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancelCardChange}
              disabled={isSubmitting}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleConfirmCardChange}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('processing', 'Processing...')}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t('cardChangeConfirmProceed', 'Proceed with Changes')}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Main Edit/View Expense Modal */}
      <Modal
        isOpen={isOpen}
        title={isRejectedExpense ? t('viewRejectedExpense', 'View Rejected Expense') : t('editExpense', 'Edit Expense')}
      onClose={onClose}
      className="modal-lg"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Expense ID Badge */}
        <div className="flex items-center gap-3 px-3 py-2 bg-slate-50 border border-slate-200">
          <FileText size={16} className="text-slate-500" />
          <span className="text-sm text-slate-600">{t('expenseNumber', 'Expense #')}: <strong className="text-slate-800">{expense.expenseNumber || expense.id}</strong></span>
          {expense.status && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ml-auto ${
              expense.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
              expense.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
              'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {expense.status === 'approved' && <CheckCircle size={12} />}
              {expense.status === 'pending' && <Clock size={12} />}
              {expense.status === 'rejected' && <AlertCircle size={12} />}
              <span>{t(expense.status, expense.status)}</span>
            </span>
          )}
        </div>

        {/* Info box for rejected expenses - view only */}
        {isRejectedExpense && (
          <div className="ds-form-info-box error mb-3">
            <AlertCircle size={16} />
            <p>{t('rejectedExpenseViewOnly', 'This expense was rejected and cannot be edited.')}</p>
          </div>
        )}

        {/* Info box for approved expenses - only card/amount can be changed */}
        {isApprovedExpense && (
          <div className="ds-form-info-box warning mb-3">
            <AlertCircle size={16} />
            <p>{t('approvedExpenseEditRestriction', 'This expense is approved. Only card and amount can be changed.')}</p>
          </div>
        )}

        {/* USER SELECTION - FIRST (determines available cards) */}
        <div className="form-group">
          <label className="flex items-center gap-2">
            <User size={16} className="text-slate-400" />
            {t('selectUser', 'Select User')} *
          </label>
          <select
            value={formData.pcUserId || ''}
            onChange={(e) => handleUserChange(e.target.value)}
            required
            disabled={isApprovedExpense || isReadOnly}
            className="w-full"
          >
            <option value="">{t('selectPettyCashUser', 'Select Petty Cash User')}</option>
            {pettyCashUsers.filter(u => u.is_active !== false).map(user => (
              <option key={user.id} value={user.id}>
                {user.name} {user.department ? `(${user.department})` : ''}
                {user.card_id || user.petrol_card_id ? '' : ' - No cards'}
              </option>
            ))}
          </select>
        </div>

        {/* Selected User Info Panel */}
        {selectedPcUser && (
          <div className="p-3 bg-slate-50 border border-slate-200 rounded">
            <div className="text-sm font-medium text-slate-700 mb-2">{selectedPcUser.name}</div>
            <div className="flex flex-wrap gap-2 text-xs">
              {userTopUpCard ? (
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
                  💳 {t('topUpCard', 'Top-up Card')}: OMR {parseFloat(userTopUpCard.currentBalance || 0).toFixed(3)}
                </span>
              ) : (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded">
                  💳 {t('noTopUpCard', 'No top-up card')}
                </span>
              )}
              {userPetrolCard ? (
                <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded">
                  ⛽ {t('petrolCard', 'Petrol Card')}: OMR {parseFloat(userPetrolCard.currentBalance || 0).toFixed(3)}
                </span>
              ) : (
                <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded">
                  ⛽ {t('noPetrolCard', 'No petrol card')}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Expense Type Selection - SECOND */}
        <div className="form-group">
          <label>{t('expenseType', 'Expense Type')} *</label>
          <select
            value={formData.expenseType}
            onChange={(e) => handleExpenseTypeChange(e.target.value)}
            required
            disabled={isApprovedExpense || isReadOnly}
          >
            <option value="">{t('selectExpenseType', 'Select Expense Type')}</option>
            {expenseTypes.map(type => (
              <option key={type.id} value={type.id}>
                {type.name}{type.maxAmount ? ` - ${t('maxAmount', 'Max')}: OMR ${type.maxAmount}` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Project Selection */}
        {projects.length > 0 && (
          <div className="form-group">
            <label className="flex items-center gap-2">
              <FolderOpen size={16} className="text-slate-400" />
              {t('project', 'Project')}
            </label>
            <select
              value={formData.projectId || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value }))}
              disabled={isApprovedExpense || isReadOnly}
            >
              <option value="">{t('selectProject', 'Select a project (optional)')}</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.code} - {project.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Payment Method Selection - THIRD (auto-populated based on user's cards) */}
        {selectedPcUser && (
          <div className="form-group">
            <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-2">
              {t('paymentMethod', 'Payment Method')} *
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {getAvailablePaymentMethods().map(method => {
                const isSelected = formData.paymentMethod === method.id
                const isRecommended = method.id === 'petrol_card' && isFuelExpense
                const isMethodDisabled = (isApprovedExpense && method.id !== formData.paymentMethod) || isReadOnly

                // Color classes based on payment method type
                const getColorClasses = () => {
                  if (isMethodDisabled) return 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed'
                  if (!isSelected) return 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                  switch (method.id) {
                    case 'top_up_card': return 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                    case 'petrol_card': return 'border-amber-500 bg-amber-50 text-amber-700 ring-1 ring-amber-500'
                    case 'iou': return 'border-red-500 bg-red-50 text-red-700 ring-1 ring-red-500'
                    default: return 'border-blue-500 bg-blue-50 text-blue-700 ring-1 ring-blue-500'
                  }
                }

                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => !isMethodDisabled && handlePaymentMethodChange(method.id)}
                    disabled={isMethodDisabled}
                    className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium border transition-all duration-150 ${getColorClasses()}`}
                    title={method.balance !== null ? `${t('balance', 'Balance')}: OMR ${method.balance.toFixed(3)}` : ''}
                  >
                    {method.id === 'top_up_card' && <CreditCard size={14} />}
                    {method.id === 'petrol_card' && <Fuel size={14} />}
                    {method.id === 'iou' && <Banknote size={14} />}
                    <span>{method.label}</span>
                    {method.cardNumber && <span className="text-[10px] opacity-75">({method.cardNumber})</span>}
                    {isRecommended && (
                      <span className="ml-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-semibold rounded">
                        {t('recommended', 'Recommended')}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
            {/* Balance info for selected method */}
            {formData.paymentMethod && formData.paymentMethod !== 'iou' && (
              <div className="mt-2 text-xs text-slate-500">
                {formData.paymentMethod === 'top_up_card' && userTopUpCard && (
                  <span>{t('balance', 'Balance')}: OMR {parseFloat(userTopUpCard.currentBalance || 0).toFixed(3)}</span>
                )}
                {formData.paymentMethod === 'petrol_card' && userPetrolCard && (
                  <span>{t('balance', 'Balance')}: OMR {parseFloat(userPetrolCard.currentBalance || 0).toFixed(3)}</span>
                )}
              </div>
            )}
            {/* Info messages */}
            {isFuelExpense && userPetrolCard && formData.paymentMethod === 'petrol_card' && (
              <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs">
                <Fuel size={14} className="shrink-0" />
                <span>{t('petrolCardAutoSelected', 'Petrol card auto-selected for fuel expenses')}</span>
              </div>
            )}
            {isFuelExpense && !userPetrolCard && (
              <div className="flex items-center gap-2 px-3 py-2 mt-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs">
                <AlertCircle size={14} className="shrink-0" />
                <span>{t('noPetrolCardWarning', 'This user has no petrol card assigned.')}</span>
              </div>
            )}
          </div>
        )}

        {/* Prompt to select user first */}
        {!selectedPcUser && (
          <div className="p-4 bg-slate-100 border border-slate-200 rounded text-center text-slate-600 text-sm">
            {t('selectUserFirst', 'Please select a user first to see available payment methods')}
          </div>
        )}

        <div className="form-grid mt-4">
          <div className="form-group">
            <label>{t('amount', 'Amount')} (OMR) *</label>
            <input
              type="number"
              step="0.001"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              required
              disabled={isReadOnly}
            />
          </div>

          <div className="form-group">
            <DateInput
              label={`${t('transactionDate', 'Transaction Date')} *`}
              value={formData.transactionDate || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, transactionDate: value || '' }))}
              required
              disabled={isApprovedExpense || isReadOnly}
            />
          </div>
        </div>

        <div className="form-group">
          <label>{t('description', 'Description')} *</label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            required
            placeholder={t('expenseDescription', 'Brief description of expense')}
            disabled={isApprovedExpense || isReadOnly}
          />
        </div>

        <div className="form-group">
          <label>{t('merchant', 'Merchant')}</label>
          <input
            type="text"
            value={formData.merchant}
            onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
            placeholder={t('merchantName', 'Store/vendor name')}
            disabled={isApprovedExpense || isReadOnly}
          />
        </div>

        {/* Receipt Section */}
        <div className="space-y-3 p-4 bg-slate-50 border border-slate-200">
          <div className="flex items-center justify-between">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Receipt size={16} />
              {t('receiptAttachments', 'Receipt Attachments')}
            </h4>
            <span className="text-xs text-slate-500">
              {receipts.length}/{maxReceipts} {t('attached', 'attached')}
            </span>
          </div>

          {/* Loading state */}
          {loadingReceipts && (
            <div className="flex items-center justify-center gap-2 py-4 text-slate-500 text-sm">
              <Loader2 size={18} className="animate-spin" />
              {t('loadingReceipts', 'Loading receipts...')}
            </div>
          )}

          {/* Existing Receipts List */}
          {!loadingReceipts && receipts.length > 0 && (
            <div className="space-y-2">
              {receipts.map((receipt, index) => (
                <div
                  key={receipt.id || `legacy-${index}`}
                  className="flex items-center gap-3 p-3 bg-white border border-slate-200"
                >
                  <div className={`w-10 h-10 flex items-center justify-center shrink-0 ${
                    receipt.contentType?.includes('pdf') ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-blue-500'
                  }`}>
                    {receipt.contentType?.includes('pdf') ? (
                      <FileText size={20} />
                    ) : (
                      <Camera size={20} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">
                      {receipt.originalFilename || t('receipt', 'Receipt')}
                    </div>
                    <div className="text-xs text-slate-400">
                      {receipt.uploadedAt ? new Date(receipt.uploadedAt).toLocaleDateString() : ''}
                      {receipt.fileSize && ` • ${(receipt.fileSize / 1024).toFixed(1)} KB`}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => window.open(receipt.downloadUrl, '_blank')}
                      className="btn btn-primary btn-sm"
                      title={t('viewReceipt', 'View Receipt')}
                    >
                      <Eye size={14} />
                      {t('view', 'View')}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteReceipt(receipt.id)}
                      disabled={deletingReceiptId === receipt.id || isReadOnly}
                      className="btn btn-danger btn-sm"
                      title={t('deleteReceipt', 'Delete Receipt')}
                    >
                      {deletingReceiptId === receipt.id ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Ban size={14} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* No receipts message */}
          {!loadingReceipts && receipts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-slate-400">
              <Receipt size={28} className="mb-2 opacity-50" />
              <p className="text-sm">{t('noReceiptsAttached', 'No receipts attached')}</p>
            </div>
          )}

          {/* Upload Section - Only show if under max limit and not rejected */}
          {!loadingReceipts && receipts.length < maxReceipts && !isReadOnly && (
            <ReceiptUpload
              label={t('uploadReceipt', 'Upload Receipt')}
              value={formData.receiptFile}
              onChange={handleReceiptChange}
              disabled={isSubmitting}
            />
          )}

          {/* Max reached message */}
          {!loadingReceipts && receipts.length >= maxReceipts && (
            <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 border border-amber-200 text-amber-700 text-xs">
              <AlertCircle size={14} />
              {t('maxReceiptsReached', 'Maximum number of receipts reached. Delete an existing receipt to upload a new one.')}
            </div>
          )}
        </div>

        <div className="form-group mt-4">
          <label>{t('notes', 'Additional Notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="3"
            placeholder={t('additionalNotes', 'Any additional details...')}
            disabled={isReadOnly}
          />
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose} disabled={isSubmitting}>
            {isRejectedExpense ? t('close', 'Close') : t('cancel', 'Cancel')}
          </button>
          {!isRejectedExpense && (
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  {t('updating', 'Updating...')}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t('updateExpense', 'Update Expense')}
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </Modal>
    </>
  )
}

// Card View Modal Component
const CardViewModal = ({
  isOpen,
  onClose,
  card,
  formatCurrency,
  formatDate,
  t,
  transactions = [],
  transactionsLoading = false,
  getTransactionTypeInfo = () => ({ icon: null, color: '#666', label: '' })
}) => {
  if (!card) return null

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: {
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        label: t('active', 'Active'),
        icon: <CheckCircle size={14} />
      },
      suspended: {
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        label: t('suspended', 'Suspended'),
        icon: <AlertCircle size={14} />
      },
      expired: {
        className: 'bg-red-50 text-red-700 border-red-200',
        label: t('expired', 'Expired'),
        icon: <Clock size={14} />
      },
      closed: {
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        label: t('closed', 'Closed'),
        icon: <Lock size={14} />
      }
    }
    const config = statusConfig[status] || statusConfig.active
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium border ${config.className}`}>
        {config.icon}
        <span>{config.label}</span>
      </span>
    )
  }

  // Calculate utilization percentage
  const totalSpent = parseFloat(card.totalSpent) || 0
  const monthlyLimit = parseFloat(card.monthlyLimit) || 0
  const utilization = monthlyLimit > 0
    ? ((totalSpent / monthlyLimit) * 100).toFixed(1)
    : 0

  const modalFooter = (
    <button type="button" className="btn btn-outline" onClick={onClose}>
      {t('close', 'Close')}
    </button>
  )

  return (
    <Modal
      isOpen={isOpen}
      title={t('pettyCashCardDetails', 'Petty Cash Card Details')}
      onClose={onClose}
      size="xl"
      closeOnOverlayClick={false}
      footer={modalFooter}
    >
      <div className="space-y-6">
        {/* Card Header - Prominent Display */}
        <div className="flex items-start justify-between p-4 bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 flex items-center justify-center bg-blue-100 text-blue-600">
              <CreditCard size={28} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 font-mono">{card.cardNumber}</h2>
              <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                <User size={14} />
                <span>{card.staffName}</span>
                {card.department && (
                  <>
                    <span className="text-slate-300">•</span>
                    <span className="text-slate-500">{card.department}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div>
            {getStatusBadge(card.status)}
          </div>
        </div>

        {/* Balance Cards - Most Important Information */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-emerald-50 border border-emerald-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600">
                <Banknote size={20} />
              </div>
              <div>
                <label className="block text-xs text-emerald-600 uppercase tracking-wider font-medium">{t('currentBalance', 'Current Balance')}</label>
                <div className="text-lg font-bold text-emerald-700">{formatCurrency(card.currentBalance)}</div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200">
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-medium">{t('initialBalance', 'Initial Balance')}</label>
            <div className="text-lg font-semibold text-slate-700 mt-1">{formatCurrency(card.initialBalance)}</div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200">
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-medium">{t('totalSpent', 'Total Spent')}</label>
            <div className="text-lg font-semibold text-red-600 mt-1">{formatCurrency(totalSpent)}</div>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200">
            <label className="block text-xs text-slate-500 uppercase tracking-wider font-medium">{t('monthlyLimit', 'Monthly Limit')}</label>
            <div className="text-lg font-semibold text-slate-700 mt-1">
              {monthlyLimit > 0 ? formatCurrency(monthlyLimit) : t('noLimit', 'No Limit')}
            </div>
          </div>
        </div>

        {/* Utilization Bar - Only if monthly limit exists */}
        {monthlyLimit > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <TrendingUp size={16} />
                {t('monthlyUtilization', 'Monthly Utilization')}
              </span>
              <span className={`text-sm font-bold ${
                utilization > 90 ? 'text-red-600' :
                utilization > 70 ? 'text-amber-600' :
                'text-emerald-600'
              }`}>{utilization}%</span>
            </div>
            <div className="h-3 bg-slate-200 overflow-hidden">
              <div
                className={`h-full transition-all ${
                  utilization > 90 ? 'bg-red-500' :
                  utilization > 70 ? 'bg-amber-500' :
                  'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(utilization, 100)}%` }}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Validity Period */}
          <div className="p-4 bg-slate-50 border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <Calendar size={16} />
              {t('validityPeriod', 'Validity Period')}
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider">{t('issueDate', 'Issue Date')}</label>
                <div className="text-sm font-medium text-slate-700 mt-1">
                  {card.issueDate ? formatDate(card.issueDate) : '-'}
                </div>
              </div>
              <div>
                <label className="block text-xs text-slate-500 uppercase tracking-wider">{t('expiryDate', 'Expiry Date')}</label>
                <div className="text-sm font-medium text-slate-700 mt-1">
                  {card.expiryDate ? formatDate(card.expiryDate) : t('noExpiry', 'No Expiry')}
                </div>
              </div>
            </div>
          </div>

          {/* Notes */}
          {card.notes && (
            <div className="p-4 bg-slate-50 border border-slate-200">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <FileText size={16} />
                {t('notes', 'Notes')}
              </h3>
              <p className="text-sm text-slate-600">{card.notes}</p>
            </div>
          )}
        </div>

        {/* Recent Expenses */}
        {card.recentExpenses && card.recentExpenses.length > 0 && (
          <div className="p-4 bg-slate-50 border border-slate-200">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-4">
              <Receipt size={16} />
              {t('recentExpenses', 'Recent Expenses')} ({card.recentExpenses.length})
            </h3>
            <div className="space-y-2">
              {card.recentExpenses.map((expense, index) => (
                <div key={expense.id || index} className="flex items-center justify-between p-3 bg-white border border-slate-200 hover:bg-slate-50 transition-colors">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-slate-700 truncate">{expense.description}</div>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="font-mono">{expense.expenseNumber}</span>
                      <span>•</span>
                      <span>{formatDate(expense.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-sm font-semibold text-slate-700">
                      {formatCurrency(expense.amount)}
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${
                      expense.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      expense.status === 'pending' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {expense.status === 'approved' && <CheckCircle size={10} />}
                      {expense.status === 'pending' && <Clock size={10} />}
                      {expense.status === 'rejected' && <AlertCircle size={10} />}
                      {t(expense.status, expense.status)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deactivation Info (if suspended) */}
        {card.status === 'suspended' && card.deactivation_reason && (
          <div className="p-4 bg-amber-50 border border-amber-200">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
              <Ban size={16} />
              {t('deactivationInfo', 'Deactivation Information')}
            </h4>
            <p className="text-sm text-amber-700">
              <strong>{t('reason', 'Reason')}:</strong> {card.deactivation_reason}
            </p>
            {card.deactivated_at && (
              <p className="text-sm text-amber-700 mt-1">
                <strong>{t('deactivatedOn', 'Deactivated on')}:</strong>{' '}
                {new Date(card.deactivated_at).toLocaleString('en-GB')}
              </p>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default PettyCash