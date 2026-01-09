import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { usePermissions } from '../../../hooks/usePermissions'
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
  Loader2
} from 'lucide-react'
import '../../../pages/PettyCash.css'

const PettyCash = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate: systemFormatDate } = useSystemSettings()
  const { hasPermission } = usePermissions()
  
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [expenses, setExpenses] = useState([])
  const [expenseTypes, setExpenseTypes] = useState([])
  const [users, setUsers] = useState([])
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

  const loadPettyCashData = async () => {
    try {
      setLoading(true)
      setError(null)

      // PERFORMANCE FIX: Load all data in parallel using dataCacheService for instant loading
      const [cardsData, expensesData, typesResult, statsResult, usersResult] = await Promise.all([
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
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return 'N/A'
    // Use the system formatDate function which respects user settings
    return systemFormatDate ? systemFormatDate(date) : date.toLocaleDateString('en-GB')
  }

  // Statistics calculation
  const calculateStats = () => {
    const totalBalance = cards.reduce((sum, card) => sum + card.currentBalance, 0)
    const totalLoaded = cards.reduce((sum, card) => sum + card.totalLoaded, 0)
    const totalSpent = cards.reduce((sum, card) => sum + card.totalSpent, 0)
    const activeCards = cards.filter(card => card.status === 'active').length
    
    return {
      totalBalance,
      totalLoaded,
      totalSpent,
      activeCards,
      utilizationRate: totalLoaded > 0 ? ((totalSpent / totalLoaded) * 100).toFixed(1) : 0
    }
  }

  const cardStats = calculateStats()

  // Handle card operations
  const handleAddCard = () => {
    const today = new Date().toISOString().split('T')[0]
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
      reloadDate: new Date().toISOString().split('T')[0]
    })
    setShowReloadModal(true)
  }

  const handleAddExpense = (card = null) => {
    setSelectedCard(card)
    setExpenseForm({
      cardId: card?.id || '',
      expenseType: '',
      amount: '',
      description: '',
      merchant: '',
      transactionDate: new Date().toISOString().split('T')[0],
      notes: '',
      paymentMethod: 'top_up_card', // Default payment method
      receiptFile: null // S3-integrated receipt file
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
        // Reload data to reflect changes
        await loadPettyCashData()
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
    setEditExpenseForm({
      id: expense.id,
      cardId: expense.cardId?.toString() || '',
      expenseType: expense.category || expense.expenseType || '',
      amount: expense.amount?.toString() || '',
      transactionDate: expense.expenseDate?.split('T')[0] || expense.transactionDate?.split('T')[0] || '',
      description: expense.description || '',
      merchant: expense.vendor || expense.merchant || '',  // Backend returns 'vendor'
      paymentMethod: expense.paymentMethod || 'top_up_card',
      notes: expense.notes || '',
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
        notes: formData.notes || null
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

      // Reload data and close modal
      await loadPettyCashData()
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
        await loadPettyCashData()
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
        await loadPettyCashData()
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
        paymentMethod: formData.paymentMethod || 'top_up_card'
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

        await loadPettyCashData()
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
        await loadPettyCashData()
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
        await loadPettyCashData()
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
        <div className="card-number-info">
          <CreditCard size={16} />
          <span className="card-number">{value}</span>
          <span className={`card-status ${row.status}`}>{row.status}</span>
        </div>
      )
    },
    {
      key: 'cardName',
      header: t('cardName', 'Card Name'),
      sortable: true,
      render: (value, row) => (
        <div className="card-info">
          <div className="card-name">{value}</div>
          <div className="card-type">{t(row.cardType, row.cardType)}</div>
        </div>
      )
    },
    {
      key: 'assignedStaff.name',
      header: t('assignedStaff', 'Assigned Staff'),
      sortable: true,
      render: (value, row) => (
        <div className="staff-info">
          <User size={16} />
          <div>
            <div className="staff-name">{row.assignedStaff.name}</div>
            <div className="staff-role">{row.assignedStaff.role}</div>
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
        <div className={`balance ${value < 100 ? 'low' : value < 500 ? 'medium' : 'high'}`}>
          {formatCurrency(value)}
        </div>
      )
    },
    {
      key: 'monthlyLimit',
      header: t('monthlyLimit', 'Monthly Limit'),
      type: 'currency',
      sortable: true,
      align: 'right',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      sortable: false,
      render: (value, row) => (
        <div className="flex-row-wrap">
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
            <>
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
              {row.status === 'active' && (
                <>
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
                </>
              )}
              {row.status === 'suspended' && (
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
            </>
          )}
        </div>
      )
    }
  ]

  // Expense table columns
  const expenseColumns = [
    {
      key: 'expenseDate', // Backend returns 'expenseDate', not 'transactionDate'
      header: t('date', 'Date'),
      sortable: true,
      render: (value) => (
        <div className="date-info">
          <Calendar size={14} />
          <span>{value ? formatDate(value) : 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'staffName',
      header: t('staff', 'Staff'),
      sortable: true,
      render: (value, row) => {
        // Backend returns staffName from card, or submittedByName/submittedByLastName from user
        const staffName = row.staffName ||
          `${row.submittedByName || ''} ${row.submittedByLastName || ''}`.trim() ||
          'Unknown';
        return (
          <div className="staff-expense-info">
            <User size={14} />
            <div>
              <div>{staffName}</div>
              <div className="card-ref">{row.cardNumber || cards.find(c => c.id === row.cardId)?.cardNumber}</div>
            </div>
          </div>
        );
      }
    },
    {
      key: 'category', // Backend returns 'category', not 'expenseType'
      header: t('expenseType', 'Expense Type'),
      sortable: true,
      render: (value) => {
        const expenseType = expenseTypes.find(type => type.id === value)
        return (
          <div className="expense-type">
            <span className={`expense-category ${expenseType?.category || ''}`}>
              {expenseType?.name || value || 'Unknown'}
            </span>
          </div>
        )
      }
    },
    {
      key: 'amount',
      header: t('amount', 'Amount'),
      type: 'currency',
      sortable: true,
      align: 'right',
      render: (value) => formatCurrency(value)
    },
    {
      key: 'merchant',
      header: t('merchant', 'Merchant'),
      sortable: true
    },
    {
      key: 'status',
      header: t('status', 'Status'),
      sortable: true,
      render: (value) => (
        <div className={`expense-status ${value}`}>
          {value === 'approved' && <CheckCircle size={14} />}
          {value === 'pending' && <Clock size={14} />}
          {value === 'rejected' && <AlertCircle size={14} />}
          <span>{t(value, value)}</span>
        </div>
      )
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      sortable: false,
      render: (value, row) => (
        <div className="flex-row-wrap">
          <button
            className={`btn btn-outline btn-sm ${row.hasReceipt || row.receiptPhoto ? '' : 'opacity-50'}`}
            title={t('viewReceipt', 'View Receipt')}
            onClick={() => handleViewReceipt(row)}
          >
            <Receipt size={14} />
          </button>
          {/* Edit button - available for admins/managers */}
          {hasPermission('MANAGE_PETTY_CASH') && (
            <button
              className="btn btn-outline btn-sm"
              title={t('editExpense', 'Edit Expense')}
              onClick={() => handleEditExpense(row)}
            >
              <Edit size={14} />
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
    <div className="page-container">
      {/* Error Display */}
      {error && (
        <div className="alert-error mb-4">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="btn-icon-close">×</button>
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

      {/* Statistics Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="summary-icon">
            <CreditCard size={22} />
          </div>
          <div>
            <div className="summary-value">{cardStats.activeCards}</div>
            <div className="summary-label">{t('activeCards', 'Active Cards')}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon success">
            <Banknote size={22} />
          </div>
          <div>
            <div className="summary-value">{formatCurrency(cardStats.totalBalance)}</div>
            <div className="summary-label">{t('totalBalance', 'Total Balance')}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon info">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="summary-value">{formatCurrency(cardStats.totalSpent)}</div>
            <div className="summary-label">{t('totalSpent', 'Total Spent')}</div>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon warning">
            <Receipt size={22} />
          </div>
          <div>
            <div className="summary-value">{cardStats.utilizationRate}%</div>
            <div className="summary-label">{t('utilization', 'Utilization')}</div>
          </div>
        </div>
      </div>

      {/* Spending Chart */}
      {stats.monthlyTrend && (
        <div className="chart-section">
          <div className="chart-header">
            <h3>{t('spendingTrend', 'Spending Trend')}</h3>
          </div>
          <StockChart
            data={stats.monthlyTrend}
            xKey="month"
            yKey="total"
            type="line"
            height={300}
            title={t('monthlyExpenses', 'Monthly Expenses')}
          />
        </div>
      )}

      {/* Cards Tab */}
      {activeTab === 'cards' && (
        <DataTable
          data={cards.filter(card => cardFilter === 'all' || card.status === cardFilter)}
          columns={cardColumns}
          title={t('pettyCashCards', 'Petty Cash Cards')}
          subtitle={`${cards.length} ${t('cards', 'cards')}`}
          headerActions={
            <>
              <button
                className="btn btn-outline"
                onClick={loadPettyCashData}
                disabled={loading}
                title={t('refresh', 'Refresh')}
                style={{ marginRight: '8px' }}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
              {hasPermission('MANAGE_PETTY_CASH') && (
                <button className="btn btn-primary" onClick={handleAddCard}>
                  <Plus size={16} />
                  {t('addCard', 'Add Card')}
                </button>
              )}
            </>
          }
          customFilters={
            <select
              value={cardFilter}
              onChange={(e) => setCardFilter(e.target.value)}
              className="filter-select"
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
          className="cards-table"
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
            <>
              <button
                className="btn btn-outline"
                onClick={loadPettyCashData}
                disabled={loading}
                title={t('refresh', 'Refresh')}
                style={{ marginRight: '8px' }}
              >
                <RefreshCw size={16} className={loading ? 'spinning' : ''} />
              </button>
              {hasPermission('MANAGE_PETTY_CASH') && (
                <button className="btn btn-primary" onClick={() => handleAddExpense()}>
                  <Plus size={16} />
                  {t('addExpense', 'Add Expense')}
                </button>
              )}
            </>
          }
          customFilters={
            <select
              value={expenseFilter}
              onChange={(e) => setExpenseFilter(e.target.value)}
              className="filter-select"
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
          className="expenses-table"
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
                    <Loader2 size={16} className="spinning" />
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
          formData={editExpenseForm}
          setFormData={setEditExpenseForm}
          t={t}
          formatCurrency={formatCurrency}
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
          className="receipt-preview-modal"
        >
          <div className="receipt-preview-content">
            {receiptLoading ? (
              <div className="receipt-loading">
                <Loader2 size={32} className="spinning" />
                <p>{t('loadingReceipt', 'Loading receipt...')}</p>
              </div>
            ) : receiptPreview ? (
              <>
                {/* Expense Info Header */}
                <div className="receipt-expense-info">
                  <div>
                    <strong>{receiptPreview.expense?.expenseNumber}</strong>
                    <div className="receipt-expense-details">
                      {receiptPreview.expense?.description}
                    </div>
                  </div>
                  <div className="receipt-expense-amount">
                    <div className="amount">
                      {formatCurrency(receiptPreview.expense?.amount)}
                    </div>
                    <div className="date">
                      {formatDate(receiptPreview.expense?.expenseDate)}
                    </div>
                  </div>
                </div>

                {/* Receipt Navigation (if multiple) */}
                {receiptPreview.receipts.length > 1 && (
                  <div className="flex-center mb-4">
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
                    <span>
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
                    <div className="receipt-gallery-item">
                      {isPdf ? (
                        <div className="pdf-preview-container">
                          <iframe
                            src={currentReceipt.downloadUrl}
                            title={currentReceipt.originalFilename || 'Receipt PDF'}
                            className="pdf-iframe"
                          />
                        </div>
                      ) : (
                        <div className="receipt-image-container">
                          <img
                            src={currentReceipt.downloadUrl}
                            alt={currentReceipt.originalFilename || 'Receipt'}
                          />
                        </div>
                      )}

                      {/* Receipt filename and actions */}
                      <div className="receipt-caption">
                        <span className="receipt-filename">
                          {currentReceipt.originalFilename || 'Receipt'}
                        </span>
                        <button
                          className="btn btn-outline btn-sm"
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
              <div className="no-receipts">
                <Receipt size={48} className="opacity-30" />
                <p>{t('noReceiptFound', 'No receipt found')}</p>
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

  return (
    <Modal
      isOpen={isOpen}
      title={card ? t('editCard', 'Edit Card') : t('addNewCard', 'Add New Card')}
      onClose={onClose}
      className="modal-lg"
      closeOnOverlayClick={false}
    >
      <form onSubmit={onSubmit} className="card-form">
        {/* Card Type Selection - Only show for new cards */}
        {!card && (
          <div className="form-section">
            <h3>{t('cardType', 'Card Type')}</h3>
            <div className="card-type-selector">
              <label className={`card-type-option ${formData.cardType === 'top_up' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="cardType"
                  value="top_up"
                  checked={formData.cardType === 'top_up'}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
                />
                <div className="card-type-content">
                  <span className="card-type-title">{t('topUpCard', 'Top-up Card')}</span>
                  <span className="card-type-desc">{t('topUpCardDesc', 'Regular petty cash card assigned to specific users')}</span>
                </div>
              </label>
              <label className={`card-type-option ${formData.cardType === 'petrol' ? 'selected' : ''}`}>
                <input
                  type="radio"
                  name="cardType"
                  value="petrol"
                  checked={formData.cardType === 'petrol'}
                  onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
                />
                <div className="card-type-content">
                  <span className="card-type-title">{t('petrolCard', 'Petrol Card')}</span>
                  <span className="card-type-desc">{t('petrolCardDesc', 'Shared fuel card for all users (one per company)')}</span>
                </div>
              </label>
            </div>
            {isPetrolCard && (
              <div className="info-banner info-warning mt-3">
                <span>⛽ {t('petrolCardNote', 'Petrol cards are shared across all users and can only be used for fuel expenses.')}</span>
              </div>
            )}
          </div>
        )}

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

// Expense Form Modal Component
const ExpenseFormModal = ({ isOpen, onClose, onSave, selectedCard, cards, expenseTypes, formData, setFormData, t }) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)

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
      <form onSubmit={handleSubmit} className="expense-form">
        {/* Card Selection - Only for top_up_card payment method */}
        {(!formData.paymentMethod || formData.paymentMethod === 'top_up_card') && (
          <div className="form-group">
            <label>{t('selectCard', 'Select Card')} *</label>
            <select
              value={formData.cardId}
              onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
              required={formData.paymentMethod === 'top_up_card' || !formData.paymentMethod}
            >
              <option value="">{t('selectCard', 'Select Card')}</option>
              {cards.filter(card => card.status === 'active' && card.cardType !== 'petrol').map(card => (
                <option key={card.id} value={card.id}>
                  {card.cardNumber} - {card.assignedStaff?.name || t('unassigned', 'Unassigned')} ({t('balance', 'Balance')}: OMR {parseFloat(card.currentBalance || 0).toFixed(3)})
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Card Info Panel - Only for top_up_card */}
        {formData.cardId && (!formData.paymentMethod || formData.paymentMethod === 'top_up_card') && (() => {
          const selectedCard = cards.find(c => c.id === parseInt(formData.cardId));
          if (!selectedCard) return null;
          return (
            <div className="selected-info-panel">
              <div className="flex-between">
                <div>
                  <div className="info-label font-semibold">{selectedCard.cardNumber}</div>
                  <div className="info-value mt-1">
                    {selectedCard.assignedStaff?.name || t('unassigned', 'Unassigned')}
                  </div>
                  {selectedCard.pettyCashUser && (
                    <div className="info-label mt-1">
                      {selectedCard.pettyCashUser.department || selectedCard.department || 'N/A'}
                      {selectedCard.pettyCashUser.phone && ` • ${selectedCard.pettyCashUser.phone}`}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <div className="info-label">{t('availableBalance', 'Available Balance')}</div>
                  <div className="info-value large">
                    OMR {parseFloat(selectedCard.currentBalance || 0).toFixed(3)}
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        <div className="form-grid">
          <div className="form-group">
            <label>{t('expenseType', 'Expense Type')} *</label>
            <select
              value={formData.expenseType}
              onChange={(e) => {
                const categoryId = e.target.value;
                // Auto-select petrol card when fuel category is selected
                if (categoryId === 'fuel') {
                  setFormData(prev => ({ ...prev, expenseType: categoryId, paymentMethod: 'petrol_card', cardId: '' }));
                } else {
                  // Reset to default payment method when switching away from fuel
                  setFormData(prev => ({
                    ...prev,
                    expenseType: categoryId,
                    paymentMethod: prev.paymentMethod === 'petrol_card' ? 'top_up_card' : prev.paymentMethod
                  }));
                }
              }}
              required
            >
              <option value="">{t('selectExpenseType', 'Select Expense Type')}</option>
              {expenseTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - {t('maxAmount', 'Max')}: OMR {type.maxAmount}
                </option>
              ))}
            </select>
          </div>

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

        {/* Payment Method Selection - Compact Mode */}
        <PaymentMethodSelect
          label={t('paymentMethod', 'Payment Method')}
          value={formData.paymentMethod || 'top_up_card'}
          onChange={(method) => {
            // Clear card selection when switching to non-card payment methods
            if (method === 'company_card' || method === 'iou') {
              setFormData(prev => ({ ...prev, paymentMethod: method, cardId: '' }))
            } else {
              setFormData(prev => ({ ...prev, paymentMethod: method }))
            }
          }}
          category={formData.expenseType}
          compact={true}
          required
        />

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
          <div className="alert-error">
            <AlertCircle size={16} />
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
      <form onSubmit={handleSubmit} className="reload-form">
        <div className="card-info-display">
          <h3>{card.cardName}</h3>
          <p>{t('assignedTo', 'Assigned to')}: {card.assignedStaff?.name || 'N/A'}</p>
          <p>{t('currentBalance', 'Current Balance')}: OMR {parseFloat(card.currentBalance || 0).toFixed(3)}</p>
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

        <div className="balance-preview">
          <div className="preview-item">
            <span>{t('currentBalance', 'Current Balance')}:</span>
            <span>OMR {parseFloat(card.currentBalance || 0).toFixed(3)}</span>
          </div>
          <div className="preview-item">
            <span>{t('reloadAmount', 'Reload Amount')}:</span>
            <span>OMR {(parseFloat(formData.amount) || 0).toFixed(3)}</span>
          </div>
          <div className="preview-item total">
            <span>{t('newBalance', 'New Balance')}:</span>
            <span>OMR {(parseFloat(card.currentBalance || 0) + (parseFloat(formData.amount) || 0)).toFixed(3)}</span>
          </div>
        </div>

        {error && (
          <div className="alert-error">
            <AlertCircle size={16} />
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

// Edit Expense Form Modal Component
const EditExpenseFormModal = ({
  isOpen,
  onClose,
  onSave,
  expense,
  cards,
  expenseTypes,
  formData,
  setFormData,
  t,
  formatCurrency
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [error, setError] = React.useState(null)
  const [receipts, setReceipts] = React.useState([])
  const [loadingReceipts, setLoadingReceipts] = React.useState(false)
  const [maxReceipts, setMaxReceipts] = React.useState(2)
  const [deletingReceiptId, setDeletingReceiptId] = React.useState(null)

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

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
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

  return (
    <Modal
      isOpen={isOpen}
      title={t('editExpense', 'Edit Expense')}
      onClose={onClose}
      className="modal-lg"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="expense-form">
        {/* Expense ID Badge */}
        <div className="expense-id-badge">
          <FileText size={16} />
          <span>{t('expenseNumber', 'Expense #')}: <strong>{expense.expenseNumber || expense.id}</strong></span>
          {expense.status && (
            <span className={`expense-status ${expense.status}`}>
              {expense.status === 'approved' && <CheckCircle size={14} />}
              {expense.status === 'pending' && <Clock size={14} />}
              {expense.status === 'rejected' && <AlertCircle size={14} />}
              <span>{t(expense.status, expense.status)}</span>
            </span>
          )}
        </div>

        {/* Payment Method Selection - Compact Mode */}
        <PaymentMethodSelect
          label={t('paymentMethod', 'Payment Method')}
          value={formData.paymentMethod || 'top_up_card'}
          onChange={(method) => {
            if (method === 'company_card' || method === 'iou') {
              setFormData(prev => ({ ...prev, paymentMethod: method, cardId: '' }))
            } else {
              setFormData(prev => ({ ...prev, paymentMethod: method }))
            }
          }}
          category={formData.expenseType}
          compact={true}
          required
        />

        {/* Card Selection - Only for top_up_card payment method */}
        {(!formData.paymentMethod || formData.paymentMethod === 'top_up_card') && (
          <div className="form-group mt-4">
            <label>{t('selectCard', 'Select Card')} *</label>
            <select
              value={formData.cardId}
              onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
              required={formData.paymentMethod === 'top_up_card' || !formData.paymentMethod}
            >
              <option value="">{t('selectCard', 'Select Card')}</option>
              {cards.filter(card => card.status === 'active' && card.cardType !== 'petrol').map(card => (
                <option key={card.id} value={card.id}>
                  {card.cardNumber} - {card.assignedStaff?.name || t('unassigned', 'Unassigned')} ({t('balance', 'Balance')}: OMR {parseFloat(card.currentBalance || 0).toFixed(3)})
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="form-grid mt-4">
          <div className="form-group">
            <label>{t('expenseType', 'Expense Type')} *</label>
            <select
              value={formData.expenseType}
              onChange={(e) => setFormData(prev => ({ ...prev, expenseType: e.target.value }))}
              required
            >
              <option value="">{t('selectExpenseType', 'Select Expense Type')}</option>
              {expenseTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.name} - {t('maxAmount', 'Max')}: OMR {type.maxAmount}
                </option>
              ))}
            </select>
          </div>

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

        {/* Receipt Section */}
        <div className="receipt-management">
          <div className="receipt-management-header">
            <h4>
              <Receipt size={18} />
              {t('receiptAttachments', 'Receipt Attachments')}
            </h4>
            <span className="receipt-count">
              {receipts.length}/{maxReceipts} {t('attached', 'attached')}
            </span>
          </div>

          {/* Loading state */}
          {loadingReceipts && (
            <div className="receipt-loading-state">
              <Loader2 size={20} className="spinning" />
              {t('loadingReceipts', 'Loading receipts...')}
            </div>
          )}

          {/* Existing Receipts List */}
          {!loadingReceipts && receipts.length > 0 && (
            <div className="file-list mb-3">
              {receipts.map((receipt, index) => (
                <div
                  key={receipt.id || `legacy-${index}`}
                  className="receipt-item"
                >
                  <div className={`receipt-item-icon ${receipt.contentType?.includes('pdf') ? 'pdf' : 'image'}`}>
                    {receipt.contentType?.includes('pdf') ? (
                      <FileText size={20} />
                    ) : (
                      <Camera size={20} />
                    )}
                  </div>
                  <div className="receipt-item-details">
                    <div className="receipt-item-name">
                      {receipt.originalFilename || t('receipt', 'Receipt')}
                    </div>
                    <div className="receipt-item-meta">
                      {receipt.uploadedAt ? new Date(receipt.uploadedAt).toLocaleDateString() : ''}
                      {receipt.fileSize && ` • ${(receipt.fileSize / 1024).toFixed(1)} KB`}
                    </div>
                  </div>
                  <div className="receipt-item-actions">
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
                      disabled={deletingReceiptId === receipt.id}
                      className="btn btn-danger btn-sm"
                      title={t('deleteReceipt', 'Delete Receipt')}
                    >
                      {deletingReceiptId === receipt.id ? (
                        <Loader2 size={14} className="spinning" />
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
            <div className="upload-placeholder mb-3">
              <Receipt size={24} className="opacity-50" />
              <p>{t('noReceiptsAttached', 'No receipts attached')}</p>
            </div>
          )}

          {/* Upload Section - Only show if under max limit */}
          {!loadingReceipts && receipts.length < maxReceipts && (
            <ReceiptUpload
              label={t('uploadReceipt', 'Upload Receipt')}
              value={formData.receiptFile}
              onChange={handleReceiptChange}
              disabled={isSubmitting}
            />
          )}

          {/* Max reached message */}
          {!loadingReceipts && receipts.length >= maxReceipts && (
            <div className="alert-warning">
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
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="spinning" />
                {t('updating', 'Updating...')}
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {t('updateExpense', 'Update Expense')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
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
        className: 'badge-success',
        label: t('active', 'Active'),
        icon: <CheckCircle size={14} />
      },
      suspended: {
        className: 'badge-warning',
        label: t('suspended', 'Suspended'),
        icon: <AlertCircle size={14} />
      },
      expired: {
        className: 'badge-danger',
        label: t('expired', 'Expired'),
        icon: <Clock size={14} />
      },
      closed: {
        className: 'badge-secondary',
        label: t('closed', 'Closed'),
        icon: <Lock size={14} />
      }
    }
    const config = statusConfig[status] || statusConfig.active
    return (
      <span className={`status-badge ${config.className}`}>
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

  return (
    <Modal
      isOpen={isOpen}
      title={t('pettyCashCardDetails', 'Petty Cash Card Details')}
      onClose={onClose}
      className="modal-xl petty-cash-view-modal"
      closeOnOverlayClick={false}
    >
      <div className="card-view-content">
        {/* Card Header - Prominent Display */}
        <div className="card-view-header">
          <div className="card-header-left">
            <div className="card-icon">
              <CreditCard size={32} />
            </div>
            <div className="card-header-info">
              <h2 className="card-number">{card.cardNumber}</h2>
              <div className="card-staff">
                <User size={16} />
                <span>{card.staffName}</span>
                {card.department && (
                  <>
                    <span className="separator">•</span>
                    <span className="department">{card.department}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="card-header-right">
            {getStatusBadge(card.status)}
          </div>
        </div>

        {/* Balance Cards - Most Important Information */}
        <div className="balance-cards-grid">
          <div className="balance-card primary">
            <div className="balance-card-icon">
              <Banknote size={24} />
            </div>
            <div className="balance-card-content">
              <label>{t('currentBalance', 'Current Balance')}</label>
              <div className="balance-value">{formatCurrency(card.currentBalance)}</div>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-card-content">
              <label>{t('initialBalance', 'Initial Balance')}</label>
              <div className="balance-value">{formatCurrency(card.initialBalance)}</div>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-card-content">
              <label>{t('totalSpent', 'Total Spent')}</label>
              <div className="balance-value spent">{formatCurrency(totalSpent)}</div>
            </div>
          </div>

          <div className="balance-card">
            <div className="balance-card-content">
              <label>{t('monthlyLimit', 'Monthly Limit')}</label>
              <div className="balance-value">
                {monthlyLimit > 0 ? formatCurrency(monthlyLimit) : t('noLimit', 'No Limit')}
              </div>
            </div>
          </div>
        </div>

        {/* Utilization Bar - Only if monthly limit exists */}
        {monthlyLimit > 0 && (
          <div className="utilization-section">
            <div className="utilization-header">
              <span className="utilization-label">
                <TrendingUp size={16} />
                {t('monthlyUtilization', 'Monthly Utilization')}
              </span>
              <span className="utilization-percent">{utilization}%</span>
            </div>
            <div className="utilization-bar-wrapper">
              <div className="utilization-bar">
                <div
                  className={`utilization-fill ${
                    utilization > 90 ? 'danger' :
                    utilization > 70 ? 'warning' :
                    'success'
                  }`}
                  style={{ width: `${Math.min(utilization, 100)}%` }}
                >
                  <span className="utilization-label-inside">
                    {utilization > 10 && `${utilization}%`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="card-details-sections">
          {/* Validity Period */}
          <div className="detail-section">
            <h3 className="section-title">
              <Calendar size={18} />
              {t('validityPeriod', 'Validity Period')}
            </h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>{t('issueDate', 'Issue Date')}</label>
                <div className="detail-value">
                  {card.issueDate ? formatDate(card.issueDate) : '-'}
                </div>
              </div>
              <div className="detail-item">
                <label>{t('expiryDate', 'Expiry Date')}</label>
                <div className="detail-value">
                  {card.expiryDate ? formatDate(card.expiryDate) : t('noExpiry', 'No Expiry')}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Expenses */}
          {card.recentExpenses && card.recentExpenses.length > 0 && (
            <div className="detail-section">
              <h3 className="section-title">
                <Receipt size={18} />
                {t('recentExpenses', 'Recent Expenses')} ({card.recentExpenses.length})
              </h3>
              <div className="expenses-list-view">
                {card.recentExpenses.map((expense, index) => (
                  <div key={expense.id || index} className="expense-row">
                    <div className="expense-left">
                      <div className="expense-description">{expense.description}</div>
                      <div className="expense-meta">
                        <span className="expense-number">{expense.expenseNumber}</span>
                        <span className="separator">•</span>
                        <span className="expense-date">{formatDate(expense.created_at)}</span>
                      </div>
                    </div>
                    <div className="expense-right">
                      <div className="expense-amount-value">
                        {formatCurrency(expense.amount)}
                      </div>
                      <span className={`expense-status-badge ${expense.status}`}>
                        {expense.status === 'approved' && <CheckCircle size={12} />}
                        {expense.status === 'pending' && <Clock size={12} />}
                        {expense.status === 'rejected' && <AlertCircle size={12} />}
                        {t(expense.status, expense.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {card.notes && (
            <div className="detail-section">
              <h3 className="section-title">
                <FileText size={18} />
                {t('notes', 'Notes')}
              </h3>
              <div className="notes-display">{card.notes}</div>
            </div>
          )}

          {/* Deactivation Info (if suspended) */}
          {card.status === 'suspended' && card.deactivation_reason && (
            <div className="alert-block warning mt-4">
              <h4>
                <Ban size={16} />
                {t('deactivationInfo', 'Deactivation Information')}
              </h4>
              <p>
                <strong>{t('reason', 'Reason')}:</strong> {card.deactivation_reason}
              </p>
              {card.deactivated_at && (
                <p>
                  <strong>{t('deactivatedOn', 'Deactivated on')}:</strong>{' '}
                  {new Date(card.deactivated_at).toLocaleString('en-GB')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-footer">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('close', 'Close')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

export default PettyCash