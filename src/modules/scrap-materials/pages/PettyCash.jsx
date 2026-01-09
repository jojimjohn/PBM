import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import LoadingSpinner from '../../../components/LoadingSpinner'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import DateInput from '../../../components/ui/DateInput'
import StockChart from '../../../components/StockChart'
import ImageUpload from '../../../components/ui/ImageUpload'
import FileUpload from '../../../components/ui/FileUpload'
import PaymentMethodSelect from '../../../components/ui/PaymentMethodSelect'
import pettyCashService from '../../../services/pettyCashService'
import uploadService from '../../../services/uploadService'
import userService from '../../../services/userService'
import dataCacheService from '../../../services/dataCacheService'
import {
  CreditCard,
  Plus,
  Banknote,
  TrendingUp,
  User,
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
  FileText
} from 'lucide-react'
import '../../../pages/PettyCash.css'

const PettyCash = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
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
  const [showReloadModal, setShowReloadModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedCard, setSelectedCard] = useState(null)
  const [editingCard, setEditingCard] = useState(null)
  
  // Form states
  const [cardForm, setCardForm] = useState({})
  const [expenseForm, setExpenseForm] = useState({})
  const [reloadForm, setReloadForm] = useState({})
  
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
        // Users (not cached for now)
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

  const formatCurrency = (amount) => `OMR ${parseFloat(amount).toFixed(3)}`
  const formatDate = (dateString) => new Date(dateString).toLocaleDateString('en-GB')

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
      assignedTo: '',
      staffName: '',
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
      assignedTo: card.assignedTo?.toString() || '',
      staffName: card.staffName || '',
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
      location: '',
      transactionDate: new Date().toISOString().split('T')[0],
      receiptPhotos: [],
      hasReceipt: false,
      tags: '',
      notes: ''
    })
    setShowExpenseModal(true)
  }

  const handleApproveExpense = async (expenseId, newStatus) => {
    try {
      setLoading(true)
      
      let result
      if (newStatus === 'approved') {
        result = await pettyCashService.approveExpense(expenseId, {
          approvedBy: 'current_user',
          approvalNotes: 'Approved via UI'
        })
      } else if (newStatus === 'rejected') {
        result = await pettyCashService.rejectExpense(expenseId, {
          rejectedBy: 'current_user',
          rejectionReason: 'Rejected via UI'
        })
      }
      
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

  const handleSaveCard = async (e) => {
    e.preventDefault()

    try {
      setLoading(true)

      // Map form data to backend schema
      const cardData = {
        cardType: cardForm.cardType || 'top_up',
        cardNumber: cardForm.cardNumber || null,  // Manual card number (null = auto-generate)
        assignedTo: cardForm.cardType === 'petrol' ? null : parseInt(cardForm.assignedTo) || null,
        staffName: cardForm.cardType === 'petrol' ? 'Shared' : cardForm.staffName,
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

  const handleSaveExpense = async (expenseData) => {
    try {
      setLoading(true)
      const result = await pettyCashService.createExpense(expenseData)
      
      if (result.success) {
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
        <div className="table-actions">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setSelectedCard(row)
              setShowViewModal(true)
            }}
            className="action-btn view"
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
                className="action-btn edit"
                title={t('edit', 'Edit')}
              >
                <Edit size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleReloadCard(row)
                }}
                className="action-btn reload"
                title={t('reloadCard', 'Reload Card')}
              >
                <RefreshCw size={14} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleAddExpense(row)
                }}
                className="action-btn expense"
                title={t('addExpense', 'Add Expense')}
              >
                <Receipt size={14} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  // Expense table columns
  const expenseColumns = [
    {
      key: 'transactionDate',
      header: t('date', 'Date'),
      sortable: true,
      render: (value) => (
        <div className="date-info">
          <Calendar size={14} />
          <span>{formatDate(value)}</span>
        </div>
      )
    },
    {
      key: 'staffMember.name',
      header: t('staff', 'Staff'),
      sortable: true,
      render: (value, row) => (
        <div className="staff-expense-info">
          <User size={14} />
          <div>
            <div>{row.staffMember.name}</div>
            <div className="card-ref">{cards.find(c => c.id === row.cardId)?.cardNumber}</div>
          </div>
        </div>
      )
    },
    {
      key: 'expenseType',
      header: t('expenseType', 'Expense Type'),
      sortable: true,
      render: (value) => {
        const expenseType = expenseTypes.find(type => type.id === value)
        return (
          <div className="expense-type">
            <span className={`expense-category ${expenseType?.category}`}>
              {expenseType?.name || value}
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
        <div className="table-actions">
          <button
            className="action-btn view"
            title={t('viewReceipt', 'View Receipt')}
          >
            <Receipt size={14} />
          </button>
          {row.status === 'pending' && hasPermission('APPROVE_EXPENSE') && (
            <>
              <button
                className="action-btn approve"
                title={t('approveExpense', 'Approve Expense')}
                onClick={() => handleApproveExpense(row.id, 'approved')}
              >
                <CheckCircle size={14} />
              </button>
              <button
                className="action-btn reject"
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
    <div className="petty-cash-page">
      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="error-close">×</button>
        </div>
      )}
      
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <h1>{t('pettyCashManagement', 'Petty Cash Management')}</h1>
          <p>{t('pettyCashSubtitle', 'Manage staff expense cards and track spending')}</p>
        </div>
        <div className="header-actions">
          {hasPermission('MANAGE_PETTY_CASH') && (
            <button className="btn btn-primary" onClick={handleAddCard}>
              <Plus size={20} />
              {t('addCard', 'Add Card')}
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card primary">
          <div className="stat-icon">
            <CreditCard />
          </div>
          <div className="stat-content">
            <div className="stat-value">{cardStats.activeCards}</div>
            <div className="stat-label">{t('activeCards', 'Active Cards')}</div>
          </div>
        </div>

        <div className="stat-card success">
          <div className="stat-icon">
            <Banknote />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(cardStats.totalBalance)}</div>
            <div className="stat-label">{t('totalBalance', 'Total Balance')}</div>
          </div>
        </div>

        <div className="stat-card info">
          <div className="stat-icon">
            <TrendingUp />
          </div>
          <div className="stat-content">
            <div className="stat-value">{formatCurrency(cardStats.totalSpent)}</div>
            <div className="stat-label">{t('totalSpent', 'Total Spent')}</div>
          </div>
        </div>

        <div className="stat-card warning">
          <div className="stat-icon">
            <Receipt />
          </div>
          <div className="stat-content">
            <div className="stat-value">{cardStats.utilizationRate}%</div>
            <div className="stat-label">{t('utilization', 'Utilization')}</div>
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

      {/* Cards Section */}
      <div className="section">
        <div className="section-header">
          <h2>{t('pettyCashCards', 'Petty Cash Cards')}</h2>
          <div className="section-filters">
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
          </div>
        </div>

        <DataTable
          data={cards.filter(card => cardFilter === 'all' || card.status === cardFilter)}
          columns={cardColumns}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          loading={loading}
          emptyMessage={t('noCardsFound', 'No cards found')}
          className="cards-table"
        />
      </div>

      {/* Recent Expenses Section */}
      <div className="section">
        <div className="section-header">
          <h2>{t('recentExpenses', 'Recent Expenses')}</h2>
          <div className="section-filters">
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
          </div>
        </div>

        <DataTable
          data={expenses.filter(expense => expenseFilter === 'all' || expense.status === expenseFilter)}
          columns={expenseColumns}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          loading={loading}
          emptyMessage={t('noExpensesFound', 'No expenses found')}
          className="expenses-table"
        />
      </div>

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
          }}
          card={selectedCard}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          t={t}
        />
      )}
    </div>
  )
}

// Card Form Modal Component
const CardFormModal = ({ isOpen, onClose, onSubmit, card, formData, setFormData, users, t }) => {
  const isPetrolCard = formData.cardType === 'petrol'

  // Handle user selection - auto-populate staffName
  const handleUserChange = (userId) => {
    const selectedUser = users.find(u => u.id === parseInt(userId))
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        assignedTo: userId,
        staffName: selectedUser.fullName
      }))
    }
  }

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
              <div className="info-banner info-warning" style={{ marginTop: '12px' }}>
                <span>⛽ {t('petrolCardNote', 'Petrol cards are shared across all users and can only be used for fuel expenses.')}</span>
              </div>
            )}
          </div>
        )}

        {/* Card Number Section */}
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
          </div>
        </div>

        {/* Staff Assignment - Only show for Top-up cards */}
        {!isPetrolCard && (
          <div className="form-section">
            <h3>{t('staffAssignment', 'Staff Assignment')}</h3>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('assignedUser', 'Assigned User')} *</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => handleUserChange(e.target.value)}
                  required={!isPetrolCard}
                >
                  <option value="">{t('selectUser', 'Select User...')}</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.fullName} - {user.role}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>{t('staffName', 'Staff Name')} *</label>
                <input
                  type="text"
                  value={formData.staffName}
                  onChange={(e) => setFormData(prev => ({ ...prev, staffName: e.target.value }))}
                  required={!isPetrolCard}
                  readOnly
                />
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
        )}

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
                value={formData.issueDate}
                onChange={(value) => setFormData(prev => ({ ...prev, issueDate: value }))}
                label={t('issueDate', 'Issue Date')}
                required
                isClearable
              />
            </div>
            <div className="form-group">
              <DateInput
                value={formData.expiryDate}
                onChange={(value) => setFormData(prev => ({ ...prev, expiryDate: value }))}
                label={t('expiryDate', 'Expiry Date')}
                minDate={formData.issueDate}
                isClearable
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

        <div className="form-grid">
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
              value={formData.transactionDate}
              onChange={(value) => setFormData(prev => ({ ...prev, transactionDate: value }))}
              label={t('transactionDate', 'Transaction Date')}
              required
              isClearable
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

        <div className="form-grid">
          <div className="form-group">
            <label>{t('merchant', 'Merchant')}</label>
            <input
              type="text"
              value={formData.merchant}
              onChange={(e) => setFormData(prev => ({ ...prev, merchant: e.target.value }))}
              placeholder={t('merchantName', 'Store/vendor name')}
            />
          </div>

          <div className="form-group">
            <label>{t('location', 'Location')}</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
              placeholder={t('expenseLocation', 'City, area')}
            />
          </div>
        </div>

        {/* Payment Method Selection */}
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
          required
        />

        <div className="form-group">
          <label>{t('receiptPhotos', 'Receipt Photos')}</label>
          {/*
            TODO Sprint 4+: Replace ImageUpload with backend FileUpload when adding expense edit functionality
            Current: ImageUpload (client-side only, not persisted to backend)
            Future: FileUpload component with uploadService.uploadSingleFile('receipts', expenseId, file)
            Backend route ready: POST /api/uploads/receipts/:id/attachment
          */}
          <ImageUpload
            images={formData.receiptPhotos}
            onImagesChange={(images) => setFormData(prev => ({ ...prev, receiptPhotos: images }))}
            maxImages={3}
            acceptedTypes={['image/jpeg', 'image/png', 'image/webp']}
          />
          <div className="form-help">
            {t('receiptHelp', 'Upload clear photos of receipts. Maximum 3 images.')}
          </div>
        </div>

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={formData.hasReceipt}
              onChange={(e) => setFormData(prev => ({ ...prev, hasReceipt: e.target.checked }))}
            />
            {t('hasReceiptConfirmation', 'I have a physical receipt for this expense')}
          </label>
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
          <div className="form-error" style={{ color: '#dc3545', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
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
            value={formData.reloadDate}
            onChange={(value) => setFormData(prev => ({ ...prev, reloadDate: value }))}
            label={t('reloadDate', 'Reload Date')}
            required
            isClearable
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
          <div className="form-error" style={{ color: '#dc3545', marginBottom: '1rem', padding: '0.5rem', backgroundColor: '#f8d7da', borderRadius: '4px' }}>
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

// Card View Modal Component
const CardViewModal = ({ isOpen, onClose, card, formatCurrency, formatDate, t }) => {
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
                        <span className="expense-date">{formatDate(expense.expenseDate)}</span>
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