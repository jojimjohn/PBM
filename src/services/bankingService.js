/**
 * Banking Service
 * Handles all bank account and transaction API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class BankingService {
  // =====================
  // BANK ACCOUNTS
  // =====================

  /**
   * Get all bank accounts
   */
  async getAccounts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      if (filters.account_type) params.append('account_type', filters.account_type);
      if (filters.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/bank-accounts${queryString ? '?' + queryString : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);
      return {
        success: true,
        data: data.data || [],
        summary: data.summary || {},
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch bank accounts',
        data: []
      };
    }
  }

  /**
   * Get a specific bank account by ID
   */
  async getAccountById(accountId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-accounts/${accountId}`);
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching bank account:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch bank account',
        data: null
      };
    }
  }

  /**
   * Create a new bank account
   */
  async createAccount(accountData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-accounts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating bank account:', error);
      return {
        success: false,
        error: error.message || 'Failed to create bank account'
      };
    }
  }

  /**
   * Update a bank account
   */
  async updateAccount(accountId, accountData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-accounts/${accountId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(accountData),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating bank account:', error);
      return {
        success: false,
        error: error.message || 'Failed to update bank account'
      };
    }
  }

  /**
   * Toggle bank account active status
   */
  async updateAccountStatus(accountId, isActive) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-accounts/${accountId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_active: isActive }),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating bank account status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update bank account status'
      };
    }
  }

  /**
   * Delete a bank account
   */
  async deleteAccount(accountId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-accounts/${accountId}`, {
        method: 'DELETE',
      });
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Error deleting bank account:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete bank account'
      };
    }
  }

  /**
   * Get balance history for charts
   */
  async getBalanceHistory(accountId, days = 30) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/bank-accounts/${accountId}/balance-history?days=${days}`
      );
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching balance history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch balance history',
        data: null
      };
    }
  }

  // =====================
  // BANK TRANSACTIONS
  // =====================

  /**
   * Get all bank transactions
   */
  async getTransactions(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.account_id) params.append('account_id', filters.account_id);
      if (filters.transaction_type) params.append('transaction_type', filters.transaction_type);
      if (filters.category) params.append('category', filters.category);
      if (filters.reconciled !== undefined) params.append('reconciled', filters.reconciled);
      if (filters.start_date) params.append('start_date', filters.start_date);
      if (filters.end_date) params.append('end_date', filters.end_date);
      if (filters.reference_type) params.append('reference_type', filters.reference_type);
      if (filters.search) params.append('search', filters.search);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/bank-transactions${queryString ? '?' + queryString : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);
      return {
        success: true,
        data: data.data || [],
        summary: data.summary || {},
        pagination: data.pagination || {}
      };
    } catch (error) {
      console.error('Error fetching bank transactions:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch transactions',
        data: []
      };
    }
  }

  /**
   * Get transaction categories
   */
  async getTransactionCategories() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions/categories`);
      return {
        success: true,
        data: data.data || []
      };
    } catch (error) {
      console.error('Error fetching transaction categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch categories',
        data: []
      };
    }
  }

  /**
   * Get a specific transaction by ID
   */
  async getTransactionById(transactionId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions/${transactionId}`);
      return {
        success: true,
        data: data.data
      };
    } catch (error) {
      console.error('Error fetching transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch transaction',
        data: null
      };
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to record transaction'
      };
    }
  }

  /**
   * Create a linked payment (for PO/SO/PettyCash)
   */
  async createLinkedPayment(paymentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions/link-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating linked payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to record payment'
      };
    }
  }

  /**
   * Update a transaction
   */
  async updateTransaction(transactionId, transactionData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions/${transactionId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(transactionData),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to update transaction'
      };
    }
  }

  /**
   * Reconcile transactions
   */
  async reconcileTransactions(transactionIds) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions/reconcile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ transaction_ids: transactionIds }),
      });
      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error reconciling transactions:', error);
      return {
        success: false,
        error: error.message || 'Failed to reconcile transactions'
      };
    }
  }

  /**
   * Delete a transaction
   */
  async deleteTransaction(transactionId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/bank-transactions/${transactionId}`, {
        method: 'DELETE',
      });
      return {
        success: true,
        message: data.message
      };
    } catch (error) {
      console.error('Error deleting transaction:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete transaction'
      };
    }
  }

  // =====================
  // HELPER METHODS
  // =====================

  /**
   * Get transaction types for dropdowns
   */
  getTransactionTypes() {
    return [
      { value: 'deposit', label: 'Deposit', isCredit: true },
      { value: 'withdrawal', label: 'Withdrawal', isCredit: false },
      { value: 'transfer_in', label: 'Transfer In', isCredit: true },
      { value: 'transfer_out', label: 'Transfer Out', isCredit: false },
      { value: 'fee', label: 'Bank Fee', isCredit: false },
      { value: 'interest', label: 'Interest', isCredit: true },
      { value: 'charge', label: 'Charge', isCredit: false }
    ];
  }

  /**
   * Get account types for dropdowns
   */
  getAccountTypes() {
    return [
      { value: 'checking', label: 'Checking Account' },
      { value: 'savings', label: 'Savings Account' },
      { value: 'credit', label: 'Credit Account' },
      { value: 'loan', label: 'Loan Account' }
    ];
  }

  /**
   * Format currency for display
   */
  formatCurrency(amount, currency = 'OMR') {
    return `${currency} ${parseFloat(amount || 0).toFixed(3)}`;
  }

  /**
   * Check if transaction type is a credit (increases balance)
   */
  isCreditTransaction(type) {
    return ['deposit', 'transfer_in', 'interest'].includes(type);
  }
}

const bankingService = new BankingService();
export default bankingService;
