import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS } from '../config/roles'
import bankingService from '../services/bankingService'
import {
  Building2,
  CreditCard,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Edit,
  Trash2,
  X,
  Search,
  Filter,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  DollarSign,
  FileText,
  Calendar,
  ChevronDown,
  Check,
  Eye
} from 'lucide-react'
import Modal from '../components/ui/Modal'
import DataTable from '../components/ui/DataTable'
import LoadingSpinner from '../components/LoadingSpinner'
import './Banking.css'

const Banking = () => {
  const { user } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()

  // Tab state
  const [activeTab, setActiveTab] = useState('accounts')

  // Loading states
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Message state
  const [message, setMessage] = useState(null)

  // Accounts state
  const [accounts, setAccounts] = useState([])
  const [accountsSummary, setAccountsSummary] = useState({})
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [showAccountModal, setShowAccountModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [accountForm, setAccountForm] = useState({
    account_number: '',
    account_name: '',
    bank_name: '',
    branch_name: '',
    branch_code: '',
    iban: '',
    swift_code: '',
    currency: 'OMR',
    account_type: 'checking',
    opening_balance: 0,
    notes: ''
  })

  // Transactions state
  const [transactions, setTransactions] = useState([])
  const [transactionsSummary, setTransactionsSummary] = useState({})
  const [transactionsPagination, setTransactionsPagination] = useState({})
  const [showTransactionModal, setShowTransactionModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [transactionForm, setTransactionForm] = useState({
    account_id: '',
    transaction_date: new Date().toISOString().split('T')[0],
    transaction_type: 'deposit',
    category: '',
    amount: '',
    reference_number: '',
    payee_payer: '',
    description: '',
    notes: ''
  })
  const [categories, setCategories] = useState([])
  const [selectedTransactions, setSelectedTransactions] = useState([])

  // Filters state
  const [filters, setFilters] = useState({
    account_id: '',
    transaction_type: '',
    category: '',
    reconciled: '',
    start_date: '',
    end_date: '',
    search: ''
  })
  const [showFilters, setShowFilters] = useState(false)

  // View transaction detail
  const [viewingTransaction, setViewingTransaction] = useState(null)

  // Permission check
  const canManage = hasPermission(PERMISSIONS.MANAGE_SETTINGS) || user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    loadAccounts()
    loadCategories()
  }, [])

  useEffect(() => {
    if (activeTab === 'transactions') {
      loadTransactions()
    }
  }, [activeTab, filters])

  const loadAccounts = async () => {
    try {
      setLoading(true)
      const response = await bankingService.getAccounts({ is_active: true })
      if (response.success) {
        setAccounts(response.data || [])
        setAccountsSummary(response.summary || {})
      }
    } catch (error) {
      console.error('Error loading accounts:', error)
      showMessage('error', 'Failed to load bank accounts')
    } finally {
      setLoading(false)
    }
  }

  const loadTransactions = async (page = 1) => {
    try {
      setLoading(true)
      const response = await bankingService.getTransactions({
        ...filters,
        page,
        limit: 20
      })
      if (response.success) {
        setTransactions(response.data || [])
        setTransactionsSummary(response.summary || {})
        setTransactionsPagination(response.pagination || {})
      }
    } catch (error) {
      console.error('Error loading transactions:', error)
      showMessage('error', 'Failed to load transactions')
    } finally {
      setLoading(false)
    }
  }

  const loadCategories = async () => {
    try {
      const response = await bankingService.getTransactionCategories()
      if (response.success) {
        setCategories(response.data || [])
      }
    } catch (error) {
      console.error('Error loading categories:', error)
    }
  }

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 4000)
  }

  // Account handlers
  const handleAddAccount = () => {
    setEditingAccount(null)
    setAccountForm({
      account_number: '',
      account_name: '',
      bank_name: '',
      branch_name: '',
      branch_code: '',
      iban: '',
      swift_code: '',
      currency: 'OMR',
      account_type: 'checking',
      opening_balance: 0,
      notes: ''
    })
    setShowAccountModal(true)
  }

  const handleEditAccount = (account) => {
    setEditingAccount(account)
    setAccountForm({
      account_number: account.account_number || '',
      account_name: account.account_name || '',
      bank_name: account.bank_name || '',
      branch_name: account.branch_name || '',
      branch_code: account.branch_code || '',
      iban: account.iban || '',
      swift_code: account.swift_code || '',
      currency: account.currency || 'OMR',
      account_type: account.account_type || 'checking',
      opening_balance: account.opening_balance || 0,
      notes: account.notes || ''
    })
    setShowAccountModal(true)
  }

  const handleSaveAccount = async () => {
    if (!accountForm.account_number || !accountForm.account_name || !accountForm.bank_name) {
      showMessage('error', 'Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      let response
      if (editingAccount) {
        response = await bankingService.updateAccount(editingAccount.id, accountForm)
      } else {
        response = await bankingService.createAccount(accountForm)
      }

      if (response.success) {
        showMessage('success', editingAccount ? 'Account updated successfully' : 'Account created successfully')
        setShowAccountModal(false)
        loadAccounts()
      } else {
        showMessage('error', response.error || 'Failed to save account')
      }
    } catch (error) {
      console.error('Error saving account:', error)
      showMessage('error', 'Failed to save account')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async (accountId) => {
    if (!confirm('Are you sure you want to delete this account?')) return

    try {
      const response = await bankingService.deleteAccount(accountId)
      if (response.success) {
        showMessage('success', response.message || 'Account deleted')
        loadAccounts()
      } else {
        showMessage('error', response.error || 'Failed to delete account')
      }
    } catch (error) {
      console.error('Error deleting account:', error)
      showMessage('error', 'Failed to delete account')
    }
  }

  // Transaction handlers
  const handleAddTransaction = () => {
    setEditingTransaction(null)
    setTransactionForm({
      account_id: selectedAccount?.id || accounts[0]?.id || '',
      transaction_date: new Date().toISOString().split('T')[0],
      transaction_type: 'deposit',
      category: '',
      amount: '',
      reference_number: '',
      payee_payer: '',
      description: '',
      notes: ''
    })
    setShowTransactionModal(true)
  }

  const handleEditTransaction = (transaction) => {
    if (transaction.reconciled) {
      showMessage('error', 'Cannot edit a reconciled transaction')
      return
    }
    setEditingTransaction(transaction)
    setTransactionForm({
      account_id: transaction.account_id,
      transaction_date: transaction.transaction_date?.split('T')[0] || '',
      transaction_type: transaction.transaction_type,
      category: transaction.category || '',
      amount: transaction.amount,
      reference_number: transaction.reference_number || '',
      payee_payer: transaction.payee_payer || '',
      description: transaction.description || '',
      notes: transaction.notes || ''
    })
    setShowTransactionModal(true)
  }

  const handleSaveTransaction = async () => {
    if (!transactionForm.account_id || !transactionForm.amount || !transactionForm.transaction_date) {
      showMessage('error', 'Please fill in all required fields')
      return
    }

    try {
      setSaving(true)
      let response
      if (editingTransaction) {
        response = await bankingService.updateTransaction(editingTransaction.id, transactionForm)
      } else {
        response = await bankingService.createTransaction(transactionForm)
      }

      if (response.success) {
        showMessage('success', editingTransaction ? 'Transaction updated' : 'Transaction recorded')
        setShowTransactionModal(false)
        loadTransactions()
        loadAccounts() // Refresh account balances
      } else {
        showMessage('error', response.error || 'Failed to save transaction')
      }
    } catch (error) {
      console.error('Error saving transaction:', error)
      showMessage('error', 'Failed to save transaction')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteTransaction = async (transactionId) => {
    if (!confirm('Are you sure you want to delete this transaction?')) return

    try {
      const response = await bankingService.deleteTransaction(transactionId)
      if (response.success) {
        showMessage('success', 'Transaction deleted')
        loadTransactions()
        loadAccounts()
      } else {
        showMessage('error', response.error || 'Failed to delete transaction')
      }
    } catch (error) {
      console.error('Error deleting transaction:', error)
      showMessage('error', 'Failed to delete transaction')
    }
  }

  const handleReconcileSelected = async () => {
    if (selectedTransactions.length === 0) {
      showMessage('error', 'Please select transactions to reconcile')
      return
    }

    try {
      setSaving(true)
      const response = await bankingService.reconcileTransactions(selectedTransactions)
      if (response.success) {
        showMessage('success', `${selectedTransactions.length} transaction(s) reconciled`)
        setSelectedTransactions([])
        loadTransactions()
      } else {
        showMessage('error', response.error || 'Failed to reconcile transactions')
      }
    } catch (error) {
      console.error('Error reconciling transactions:', error)
      showMessage('error', 'Failed to reconcile transactions')
    } finally {
      setSaving(false)
    }
  }

  const handleTransactionSelect = (transactionId, checked) => {
    if (checked) {
      setSelectedTransactions(prev => [...prev, transactionId])
    } else {
      setSelectedTransactions(prev => prev.filter(id => id !== transactionId))
    }
  }

  const handleSelectAll = (checked) => {
    if (checked) {
      const unreconciled = transactions.filter(t => !t.reconciled).map(t => t.id)
      setSelectedTransactions(unreconciled)
    } else {
      setSelectedTransactions([])
    }
  }

  const formatCurrency = (amount) => {
    return `OMR ${parseFloat(amount || 0).toFixed(3)}`
  }

  const getTransactionIcon = (type) => {
    const isCredit = bankingService.isCreditTransaction(type)
    return isCredit
      ? <ArrowDownRight className="text-green-500" size={16} />
      : <ArrowUpRight className="text-red-500" size={16} />
  }

  // Account card component
  const AccountCard = ({ account }) => (
    <div
      className={`account-card ${selectedAccount?.id === account.id ? 'selected' : ''}`}
      onClick={() => setSelectedAccount(account)}
    >
      <div className="account-card-header">
        <div className="account-icon">
          <Building2 size={24} />
        </div>
        <div className="account-info">
          <h4>{account.account_name}</h4>
          <p className="bank-name">{account.bank_name}</p>
        </div>
        {canManage && (
          <div className="account-actions">
            <button onClick={(e) => { e.stopPropagation(); handleEditAccount(account) }} className="btn-icon">
              <Edit size={14} />
            </button>
            <button onClick={(e) => { e.stopPropagation(); handleDeleteAccount(account.id) }} className="btn-icon btn-danger">
              <Trash2 size={14} />
            </button>
          </div>
        )}
      </div>
      <div className="account-card-body">
        <div className="account-number">
          <span className="label">Account</span>
          <span className="value">{account.account_number}</span>
        </div>
        <div className="account-balance">
          <span className="label">Balance</span>
          <span className={`value ${parseFloat(account.current_balance) >= 0 ? 'positive' : 'negative'}`}>
            {formatCurrency(account.current_balance)}
          </span>
        </div>
      </div>
      <div className="account-card-footer">
        <span className={`account-type-badge ${account.account_type}`}>
          {account.account_type}
        </span>
        <span className={`status-badge ${account.is_active ? 'active' : 'inactive'}`}>
          {account.is_active ? 'Active' : 'Inactive'}
        </span>
      </div>
    </div>
  )

  // Transaction columns for DataTable
  const transactionColumns = [
    {
      key: 'select',
      label: (
        <input
          type="checkbox"
          onChange={(e) => handleSelectAll(e.target.checked)}
          checked={selectedTransactions.length > 0 && selectedTransactions.length === transactions.filter(t => !t.reconciled).length}
        />
      ),
      render: (row) => (
        <input
          type="checkbox"
          checked={selectedTransactions.includes(row.id)}
          onChange={(e) => handleTransactionSelect(row.id, e.target.checked)}
          disabled={row.reconciled}
        />
      )
    },
    {
      key: 'transaction_date',
      label: 'Date',
      render: (row) => new Date(row.transaction_date).toLocaleDateString()
    },
    {
      key: 'transaction_number',
      label: 'Reference',
      render: (row) => (
        <div className="transaction-ref">
          <span className="txn-number">{row.transaction_number}</span>
          {row.reference_number && <span className="ref-number">{row.reference_number}</span>}
        </div>
      )
    },
    {
      key: 'account_name',
      label: 'Account',
      render: (row) => (
        <div className="account-cell">
          <span>{row.account_name}</span>
          <small>{row.bank_name}</small>
        </div>
      )
    },
    {
      key: 'transaction_type',
      label: 'Type',
      render: (row) => (
        <div className="transaction-type-cell">
          {getTransactionIcon(row.transaction_type)}
          <span>{row.transaction_type.replace('_', ' ')}</span>
        </div>
      )
    },
    {
      key: 'payee_payer',
      label: 'Payee/Payer',
      render: (row) => row.payee_payer || '-'
    },
    {
      key: 'amount',
      label: 'Amount',
      render: (row) => (
        <span className={bankingService.isCreditTransaction(row.transaction_type) ? 'amount-credit' : 'amount-debit'}>
          {bankingService.isCreditTransaction(row.transaction_type) ? '+' : '-'}
          {formatCurrency(row.amount)}
        </span>
      )
    },
    {
      key: 'balance_after',
      label: 'Balance',
      render: (row) => formatCurrency(row.balance_after)
    },
    {
      key: 'reconciled',
      label: 'Status',
      render: (row) => (
        <span className={`reconcile-badge ${row.reconciled ? 'reconciled' : 'pending'}`}>
          {row.reconciled ? <CheckCircle size={14} /> : <Clock size={14} />}
          {row.reconciled ? 'Reconciled' : 'Pending'}
        </span>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (row) => (
        <div className="table-actions">
          <button onClick={() => setViewingTransaction(row)} className="btn-icon" title="View">
            <Eye size={14} />
          </button>
          {canManage && !row.reconciled && (
            <>
              <button onClick={() => handleEditTransaction(row)} className="btn-icon" title="Edit">
                <Edit size={14} />
              </button>
              <button onClick={() => handleDeleteTransaction(row.id)} className="btn-icon btn-danger" title="Delete">
                <Trash2 size={14} />
              </button>
            </>
          )}
        </div>
      )
    }
  ]

  return (
    <div className="banking-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-content">
          <h1>
            <Building2 size={28} />
            Banking
          </h1>
          <p className="subtitle">Manage bank accounts and transactions</p>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`message-toast ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="tab-buttons">
        <button
          className={`tab-button ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          <CreditCard size={18} />
          Accounts
        </button>
        <button
          className={`tab-button ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <FileText size={18} />
          Transactions
        </button>
      </div>

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="accounts-tab">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card">
              <div className="card-icon accounts">
                <CreditCard size={24} />
              </div>
              <div className="card-content">
                <span className="label">Total Accounts</span>
                <span className="value">{accountsSummary.totalAccounts || 0}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon balance">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <span className="label">Total Balance</span>
                <span className="value">{formatCurrency(accountsSummary.totalBalance)}</span>
              </div>
            </div>
            <div className="summary-card positive">
              <div className="card-icon positive">
                <TrendingUp size={24} />
              </div>
              <div className="card-content">
                <span className="label">Positive Balance</span>
                <span className="value">{formatCurrency(accountsSummary.positiveBalance)}</span>
              </div>
            </div>
            <div className="summary-card negative">
              <div className="card-icon negative">
                <TrendingDown size={24} />
              </div>
              <div className="card-content">
                <span className="label">Overdraft/Credit</span>
                <span className="value">{formatCurrency(accountsSummary.negativeBalance)}</span>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="actions-bar">
            <button className="btn btn-primary" onClick={handleAddAccount} disabled={!canManage}>
              <Plus size={18} />
              Add Account
            </button>
            <button className="btn btn-outline" onClick={loadAccounts}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Accounts Grid */}
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="accounts-grid">
              {accounts.length === 0 ? (
                <div className="empty-state">
                  <Building2 size={48} />
                  <p>No bank accounts found</p>
                  {canManage && (
                    <button className="btn btn-primary" onClick={handleAddAccount}>
                      Add Your First Account
                    </button>
                  )}
                </div>
              ) : (
                accounts.map(account => (
                  <AccountCard key={account.id} account={account} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* Transactions Tab */}
      {activeTab === 'transactions' && (
        <div className="transactions-tab">
          {/* Summary Cards */}
          <div className="summary-cards">
            <div className="summary-card positive">
              <div className="card-icon positive">
                <ArrowDownRight size={24} />
              </div>
              <div className="card-content">
                <span className="label">Total Credits</span>
                <span className="value">{formatCurrency(transactionsSummary.totalCredits)}</span>
              </div>
            </div>
            <div className="summary-card negative">
              <div className="card-icon negative">
                <ArrowUpRight size={24} />
              </div>
              <div className="card-content">
                <span className="label">Total Debits</span>
                <span className="value">{formatCurrency(transactionsSummary.totalDebits)}</span>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon balance">
                <DollarSign size={24} />
              </div>
              <div className="card-content">
                <span className="label">Net Flow</span>
                <span className={`value ${(transactionsSummary.netFlow || 0) >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(transactionsSummary.netFlow)}
                </span>
              </div>
            </div>
            <div className="summary-card">
              <div className="card-icon pending">
                <Clock size={24} />
              </div>
              <div className="card-content">
                <span className="label">Unreconciled</span>
                <span className="value">{transactionsSummary.unreconciledCount || 0}</span>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="actions-bar">
            <button className="btn btn-primary" onClick={handleAddTransaction} disabled={!canManage || accounts.length === 0}>
              <Plus size={18} />
              Record Transaction
            </button>
            {selectedTransactions.length > 0 && (
              <button className="btn btn-success" onClick={handleReconcileSelected} disabled={saving}>
                <Check size={18} />
                Reconcile Selected ({selectedTransactions.length})
              </button>
            )}
            <button className="btn btn-outline" onClick={() => setShowFilters(!showFilters)}>
              <Filter size={18} />
              Filters
            </button>
            <button className="btn btn-outline" onClick={() => loadTransactions()}>
              <RefreshCw size={18} />
              Refresh
            </button>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="filters-panel">
              <div className="filter-row">
                <div className="filter-group">
                  <label>Account</label>
                  <select
                    value={filters.account_id}
                    onChange={(e) => setFilters(prev => ({ ...prev, account_id: e.target.value }))}
                  >
                    <option value="">All Accounts</option>
                    {accounts.map(acc => (
                      <option key={acc.id} value={acc.id}>{acc.account_name}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Type</label>
                  <select
                    value={filters.transaction_type}
                    onChange={(e) => setFilters(prev => ({ ...prev, transaction_type: e.target.value }))}
                  >
                    <option value="">All Types</option>
                    {bankingService.getTransactionTypes().map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Category</label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div className="filter-group">
                  <label>Status</label>
                  <select
                    value={filters.reconciled}
                    onChange={(e) => setFilters(prev => ({ ...prev, reconciled: e.target.value }))}
                  >
                    <option value="">All</option>
                    <option value="true">Reconciled</option>
                    <option value="false">Pending</option>
                  </select>
                </div>
              </div>
              <div className="filter-row">
                <div className="filter-group">
                  <label>From Date</label>
                  <input
                    type="date"
                    value={filters.start_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="filter-group">
                  <label>To Date</label>
                  <input
                    type="date"
                    value={filters.end_date}
                    onChange={(e) => setFilters(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
                <div className="filter-group search">
                  <label>Search</label>
                  <input
                    type="text"
                    placeholder="Search transactions..."
                    value={filters.search}
                    onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  />
                </div>
                <button
                  className="btn btn-outline"
                  onClick={() => setFilters({
                    account_id: '',
                    transaction_type: '',
                    category: '',
                    reconciled: '',
                    start_date: '',
                    end_date: '',
                    search: ''
                  })}
                >
                  Clear
                </button>
              </div>
            </div>
          )}

          {/* Transactions Table */}
          {loading ? (
            <div className="loading-container">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="transactions-table-container">
              <DataTable
                columns={transactionColumns}
                data={transactions}
                emptyMessage="No transactions found"
                pagination={transactionsPagination}
                onPageChange={(page) => loadTransactions(page)}
              />
            </div>
          )}
        </div>
      )}

      {/* Account Modal */}
      <Modal
        isOpen={showAccountModal}
        onClose={() => setShowAccountModal(false)}
        title={editingAccount ? 'Edit Bank Account' : 'Add Bank Account'}
      >
        <div className="account-form">
          <div className="form-row">
            <div className="form-group">
              <label>Account Number *</label>
              <input
                type="text"
                value={accountForm.account_number}
                onChange={(e) => setAccountForm(prev => ({ ...prev, account_number: e.target.value }))}
                placeholder="e.g., 1234567890"
              />
            </div>
            <div className="form-group">
              <label>Account Name *</label>
              <input
                type="text"
                value={accountForm.account_name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, account_name: e.target.value }))}
                placeholder="e.g., Main Operating Account"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Bank Name *</label>
              <input
                type="text"
                value={accountForm.bank_name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, bank_name: e.target.value }))}
                placeholder="e.g., Bank Muscat"
              />
            </div>
            <div className="form-group">
              <label>Branch Name</label>
              <input
                type="text"
                value={accountForm.branch_name}
                onChange={(e) => setAccountForm(prev => ({ ...prev, branch_name: e.target.value }))}
                placeholder="e.g., Ruwi Branch"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>IBAN</label>
              <input
                type="text"
                value={accountForm.iban}
                onChange={(e) => setAccountForm(prev => ({ ...prev, iban: e.target.value }))}
                placeholder="e.g., OM12BMSC..."
              />
            </div>
            <div className="form-group">
              <label>SWIFT Code</label>
              <input
                type="text"
                value={accountForm.swift_code}
                onChange={(e) => setAccountForm(prev => ({ ...prev, swift_code: e.target.value }))}
                placeholder="e.g., BMSCOMAN"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Account Type</label>
              <select
                value={accountForm.account_type}
                onChange={(e) => setAccountForm(prev => ({ ...prev, account_type: e.target.value }))}
              >
                {bankingService.getAccountTypes().map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                value={accountForm.currency}
                onChange={(e) => setAccountForm(prev => ({ ...prev, currency: e.target.value }))}
              >
                <option value="OMR">OMR - Omani Rial</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
              </select>
            </div>
          </div>
          {!editingAccount && (
            <div className="form-row">
              <div className="form-group">
                <label>Opening Balance</label>
                <input
                  type="number"
                  step="0.001"
                  value={accountForm.opening_balance}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, opening_balance: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.000"
                />
              </div>
            </div>
          )}
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={accountForm.notes}
              onChange={(e) => setAccountForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={3}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowAccountModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveAccount} disabled={saving}>
              {saving ? 'Saving...' : (editingAccount ? 'Update Account' : 'Create Account')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Transaction Modal */}
      <Modal
        isOpen={showTransactionModal}
        onClose={() => setShowTransactionModal(false)}
        title={editingTransaction ? 'Edit Transaction' : 'Record Transaction'}
      >
        <div className="transaction-form">
          <div className="form-row">
            <div className="form-group">
              <label>Bank Account *</label>
              <select
                value={transactionForm.account_id}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, account_id: e.target.value }))}
              >
                <option value="">Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>{acc.account_name} - {acc.bank_name}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Transaction Date *</label>
              <input
                type="date"
                value={transactionForm.transaction_date}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_date: e.target.value }))}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Transaction Type *</label>
              <select
                value={transactionForm.transaction_type}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, transaction_type: e.target.value }))}
              >
                {bankingService.getTransactionTypes().map(type => (
                  <option key={type.value} value={type.value}>{type.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                step="0.001"
                min="0.001"
                value={transactionForm.amount}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="0.000"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Category</label>
              <select
                value={transactionForm.category}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.value} value={cat.value}>{cat.label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reference Number</label>
              <input
                type="text"
                value={transactionForm.reference_number}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, reference_number: e.target.value }))}
                placeholder="Check/Transfer number"
              />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Payee/Payer</label>
              <input
                type="text"
                value={transactionForm.payee_payer}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, payee_payer: e.target.value }))}
                placeholder="Who paid/received"
              />
            </div>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={transactionForm.description}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Transaction description..."
              rows={2}
            />
          </div>
          <div className="form-group">
            <label>Notes</label>
            <textarea
              value={transactionForm.notes}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes..."
              rows={2}
            />
          </div>
          <div className="modal-actions">
            <button className="btn btn-secondary" onClick={() => setShowTransactionModal(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveTransaction} disabled={saving}>
              {saving ? 'Saving...' : (editingTransaction ? 'Update Transaction' : 'Record Transaction')}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Transaction Modal */}
      <Modal
        isOpen={!!viewingTransaction}
        onClose={() => setViewingTransaction(null)}
        title="Transaction Details"
      >
        {viewingTransaction && (
          <div className="transaction-details">
            <div className="detail-row">
              <span className="label">Transaction #</span>
              <span className="value">{viewingTransaction.transaction_number}</span>
            </div>
            <div className="detail-row">
              <span className="label">Date</span>
              <span className="value">{new Date(viewingTransaction.transaction_date).toLocaleDateString()}</span>
            </div>
            <div className="detail-row">
              <span className="label">Account</span>
              <span className="value">{viewingTransaction.account_name} - {viewingTransaction.bank_name}</span>
            </div>
            <div className="detail-row">
              <span className="label">Type</span>
              <span className="value transaction-type">
                {getTransactionIcon(viewingTransaction.transaction_type)}
                {viewingTransaction.transaction_type.replace('_', ' ')}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Amount</span>
              <span className={`value ${bankingService.isCreditTransaction(viewingTransaction.transaction_type) ? 'amount-credit' : 'amount-debit'}`}>
                {bankingService.isCreditTransaction(viewingTransaction.transaction_type) ? '+' : '-'}
                {formatCurrency(viewingTransaction.amount)}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Balance After</span>
              <span className="value">{formatCurrency(viewingTransaction.balance_after)}</span>
            </div>
            {viewingTransaction.category && (
              <div className="detail-row">
                <span className="label">Category</span>
                <span className="value">{viewingTransaction.category}</span>
              </div>
            )}
            {viewingTransaction.payee_payer && (
              <div className="detail-row">
                <span className="label">Payee/Payer</span>
                <span className="value">{viewingTransaction.payee_payer}</span>
              </div>
            )}
            {viewingTransaction.reference_number && (
              <div className="detail-row">
                <span className="label">Reference #</span>
                <span className="value">{viewingTransaction.reference_number}</span>
              </div>
            )}
            {viewingTransaction.description && (
              <div className="detail-row full">
                <span className="label">Description</span>
                <span className="value">{viewingTransaction.description}</span>
              </div>
            )}
            <div className="detail-row">
              <span className="label">Status</span>
              <span className={`reconcile-badge ${viewingTransaction.reconciled ? 'reconciled' : 'pending'}`}>
                {viewingTransaction.reconciled ? <CheckCircle size={14} /> : <Clock size={14} />}
                {viewingTransaction.reconciled ? 'Reconciled' : 'Pending'}
              </span>
            </div>
            <div className="detail-row">
              <span className="label">Created</span>
              <span className="value">
                {new Date(viewingTransaction.created_at).toLocaleString()}
                {viewingTransaction.created_by_name && ` by ${viewingTransaction.created_by_name}`}
              </span>
            </div>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setViewingTransaction(null)}>
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Banking
