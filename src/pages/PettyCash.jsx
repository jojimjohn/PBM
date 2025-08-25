import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/ui/Modal'
import DataTable from '../components/ui/DataTable'
import StockChart from '../components/StockChart'
import ImageUpload from '../components/ui/ImageUpload'
import { 
  CreditCard, 
  Plus, 
  DollarSign, 
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
  Camera
} from 'lucide-react'
import './PettyCash.css'

const PettyCash = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()
  
  const [loading, setLoading] = useState(true)
  const [cards, setCards] = useState([])
  const [expenses, setExpenses] = useState([])
  const [expenseTypes, setExpenseTypes] = useState([])
  const [stats, setStats] = useState({})
  
  // Modal states
  const [showCardModal, setShowCardModal] = useState(false)
  const [showExpenseModal, setShowExpenseModal] = useState(false)
  const [showReloadModal, setShowReloadModal] = useState(false)
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
      
      // Load petty cash cards
      const cardsResponse = await fetch('/data/petty-cash-cards.json')
      const cardsData = await cardsResponse.json()
      const companyCards = cardsData.pettyCashCards[selectedCompany?.id] || []
      setCards(companyCards)
      setExpenseTypes(cardsData.expenseTypes)
      
      // Load expenses
      const expensesResponse = await fetch('/data/petty-cash-expenses.json')
      const expensesData = await expensesResponse.json()
      const companyExpenses = expensesData.expenses[selectedCompany?.id] || []
      setExpenses(companyExpenses)
      setStats(expensesData.expenseStats[selectedCompany?.id] || {})
      
    } catch (error) {
      console.error('Error loading petty cash data:', error)
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
    setCardForm({
      cardName: '',
      assignedStaffName: '',
      assignedStaffRole: '',
      assignedStaffPhone: '',
      assignedStaffEmail: '',
      initialBalance: '',
      monthlyLimit: '',
      dailyLimit: '',
      cardType: 'monthly',
      allowedExpenseTypes: [],
      notes: ''
    })
    setEditingCard(null)
    setShowCardModal(true)
  }

  const handleEditCard = (card) => {
    setCardForm({
      cardName: card.cardName,
      assignedStaffName: card.assignedStaff.name,
      assignedStaffRole: card.assignedStaff.role,
      assignedStaffPhone: card.assignedStaff.phone,
      assignedStaffEmail: card.assignedStaff.email,
      initialBalance: card.currentBalance,
      monthlyLimit: card.monthlyLimit,
      dailyLimit: card.dailyLimit,
      cardType: card.cardType,
      allowedExpenseTypes: card.allowedExpenseTypes,
      notes: card.notes
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
        </div>
      )
    }
  ]

  if (loading) {
    return <LoadingSpinner />
  }

  return (
    <div className="petty-cash-page">
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
            <DollarSign />
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
          card={editingCard}
          formData={cardForm}
          setFormData={setCardForm}
          expenseTypes={expenseTypes}
          t={t}
        />
      )}

      {/* Expense Entry Modal */}
      {showExpenseModal && (
        <ExpenseFormModal
          isOpen={showExpenseModal}
          onClose={() => setShowExpenseModal(false)}
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
          card={selectedCard}
          formData={reloadForm}
          setFormData={setReloadForm}
          t={t}
        />
      )}
    </div>
  )
}

// Card Form Modal Component
const CardFormModal = ({ isOpen, onClose, card, formData, setFormData, expenseTypes, t }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle card creation/update
    console.log('Card form submitted:', formData)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      title={card ? t('editCard', 'Edit Card') : t('addNewCard', 'Add New Card')}
      onClose={onClose}
      className="modal-lg"
    >
      <form onSubmit={handleSubmit} className="card-form">
        <div className="form-grid">
          <div className="form-group">
            <label>{t('cardName', 'Card Name')} *</label>
            <input
              type="text"
              value={formData.cardName}
              onChange={(e) => setFormData(prev => ({ ...prev, cardName: e.target.value }))}
              required
            />
          </div>

          <div className="form-group">
            <label>{t('cardType', 'Card Type')} *</label>
            <select
              value={formData.cardType}
              onChange={(e) => setFormData(prev => ({ ...prev, cardType: e.target.value }))}
              required
            >
              <option value="monthly">{t('monthly', 'Monthly')}</option>
              <option value="weekly">{t('weekly', 'Weekly')}</option>
              <option value="bi_weekly">{t('biWeekly', 'Bi-weekly')}</option>
            </select>
          </div>
        </div>

        <div className="form-section">
          <h3>{t('staffAssignment', 'Staff Assignment')}</h3>
          <div className="form-grid">
            <div className="form-group">
              <label>{t('staffName', 'Staff Name')} *</label>
              <input
                type="text"
                value={formData.assignedStaffName}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedStaffName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('staffRole', 'Staff Role')} *</label>
              <input
                type="text"
                value={formData.assignedStaffRole}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedStaffRole: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('phoneNumber', 'Phone Number')}</label>
              <input
                type="tel"
                value={formData.assignedStaffPhone}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedStaffPhone: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>{t('emailAddress', 'Email Address')}</label>
              <input
                type="email"
                value={formData.assignedStaffEmail}
                onChange={(e) => setFormData(prev => ({ ...prev, assignedStaffEmail: e.target.value }))}
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
              />
            </div>
            <div className="form-group">
              <label>{t('monthlyLimit', 'Monthly Limit')} (OMR) *</label>
              <input
                type="number"
                step="0.001"
                value={formData.monthlyLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>{t('dailyLimit', 'Daily Limit')} (OMR)</label>
              <input
                type="number"
                step="0.001"
                value={formData.dailyLimit}
                onChange={(e) => setFormData(prev => ({ ...prev, dailyLimit: e.target.value }))}
              />
            </div>
          </div>
        </div>

        <div className="form-section">
          <h3>{t('allowedExpenseTypes', 'Allowed Expense Types')}</h3>
          <div className="checkbox-grid">
            {expenseTypes.map(type => (
              <label key={type.id} className="checkbox-card">
                <input
                  type="checkbox"
                  checked={formData.allowedExpenseTypes?.includes(type.id)}
                  onChange={(e) => {
                    const current = formData.allowedExpenseTypes || []
                    if (e.target.checked) {
                      setFormData(prev => ({ 
                        ...prev, 
                        allowedExpenseTypes: [...current, type.id] 
                      }))
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        allowedExpenseTypes: current.filter(t => t !== type.id) 
                      }))
                    }
                  }}
                />
                <div className="checkbox-content">
                  <span className="checkbox-title">{type.name}</span>
                  <span className="checkbox-description">{type.description}</span>
                </div>
              </label>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>{t('notes', 'Notes')}</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            rows="3"
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
const ExpenseFormModal = ({ isOpen, onClose, selectedCard, cards, expenseTypes, formData, setFormData, t }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle expense creation
    console.log('Expense form submitted:', formData)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      title={t('addExpense', 'Add Expense')}
      onClose={onClose}
      className="modal-lg"
    >
      <form onSubmit={handleSubmit} className="expense-form">
        <div className="form-grid">
          <div className="form-group">
            <label>{t('selectCard', 'Select Card')} *</label>
            <select
              value={formData.cardId}
              onChange={(e) => setFormData(prev => ({ ...prev, cardId: e.target.value }))}
              required
            >
              <option value="">{t('selectCard', 'Select Card')}</option>
              {cards.map(card => (
                <option key={card.id} value={card.id}>
                  {card.cardNumber} - {card.assignedStaff.name}
                </option>
              ))}
            </select>
          </div>

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
            <label>{t('transactionDate', 'Transaction Date')} *</label>
            <input
              type="date"
              value={formData.transactionDate}
              onChange={(e) => setFormData(prev => ({ ...prev, transactionDate: e.target.value }))}
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

        <div className="form-group">
          <label>{t('receiptPhotos', 'Receipt Photos')}</label>
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

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn btn-primary">
            {t('submitExpense', 'Submit Expense')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Card Reload Modal Component  
const CardReloadModal = ({ isOpen, onClose, card, formData, setFormData, t }) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    // Handle card reload
    console.log('Card reload submitted:', formData)
    onClose()
  }

  if (!card) return null

  return (
    <Modal
      isOpen={isOpen}
      title={t('reloadCard', 'Reload Card')}
      onClose={onClose}
      className="modal-md"
    >
      <form onSubmit={handleSubmit} className="reload-form">
        <div className="card-info-display">
          <h3>{card.cardName}</h3>
          <p>{t('assignedTo', 'Assigned to')}: {card.assignedStaff.name}</p>
          <p>{t('currentBalance', 'Current Balance')}: OMR {card.currentBalance.toFixed(3)}</p>
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
          <label>{t('reloadDate', 'Reload Date')} *</label>
          <input
            type="date"
            value={formData.reloadDate}
            onChange={(e) => setFormData(prev => ({ ...prev, reloadDate: e.target.value }))}
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
            <span>OMR {card.currentBalance.toFixed(3)}</span>
          </div>
          <div className="preview-item">
            <span>{t('reloadAmount', 'Reload Amount')}:</span>
            <span>OMR {(parseFloat(formData.amount) || 0).toFixed(3)}</span>
          </div>
          <div className="preview-item total">
            <span>{t('newBalance', 'New Balance')}:</span>
            <span>OMR {(card.currentBalance + (parseFloat(formData.amount) || 0)).toFixed(3)}</span>
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn btn-success">
            <RefreshCw size={16} />
            {t('reloadCard', 'Reload Card')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default PettyCash