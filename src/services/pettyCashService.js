/**
 * Petty Cash Service
 * Handles all petty cash related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class PettyCashService {
  // === PETTY CASH CARDS ===

  /**
   * Transform backend card data to frontend format
   * Prioritizes petty cash user info over legacy system user assignments
   */
  transformCard(backendCard) {
    // Determine the assigned staff name - prioritize petty cash user
    const systemUserName = `${backendCard.assignedUserFirstName || ''} ${backendCard.assignedUserLastName || ''}`.trim();
    const staffName = backendCard.pettyCashUserName || systemUserName || backendCard.staffName || 'Unassigned';

    // Determine role/department - prioritize petty cash user department
    const role = backendCard.pettyCashUserDepartment || backendCard.assignedUserRole || backendCard.department || 'N/A';

    return {
      ...backendCard,
      assignedStaff: {
        name: staffName,
        role: role,
        email: backendCard.assignedUserEmail || ''
      },
      // Include petty cash user details for direct access
      pettyCashUser: backendCard.pettyCashUserId ? {
        id: backendCard.pettyCashUserId,
        name: backendCard.pettyCashUserName,
        phone: backendCard.pettyCashUserPhone,
        department: backendCard.pettyCashUserDepartment,
        employeeId: backendCard.pettyCashUserEmployeeId,
        isActive: backendCard.pettyCashUserIsActive
      } : null,
      createdBy: {
        name: `${backendCard.createdByFirstName || ''} ${backendCard.createdByLastName || ''}`.trim() || 'System'
      }
    };
  }

  /**
   * Get all petty cash cards
   */
  async getAllCards() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards`);

      // Transform the data to match frontend expectations
      if (data.success && data.data) {
        data.data = data.data.map(card => this.transformCard(card));
      }

      return data;
    } catch (error) {
      console.error('Error fetching petty cash cards:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch petty cash cards',
        data: []
      };
    }
  }

  /**
   * Get a specific card by ID
   */
  async getCardById(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}`);

      // Transform the data to match frontend expectations
      if (data.success && data.data) {
        data.data = this.transformCard(data.data);
      }

      return data;
    } catch (error) {
      console.error('Error fetching petty cash card:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch petty cash card',
        data: null
      };
    }
  }

  /**
   * Create a new petty cash card
   */
  async createCard(cardData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });
      return data;
    } catch (error) {
      console.error('Error creating petty cash card:', error);
      return {
        success: false,
        error: error.message || 'Failed to create petty cash card'
      };
    }
  }

  /**
   * Update a petty cash card
   */
  async updateCard(cardId, cardData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });
      return data;
    } catch (error) {
      console.error('Error updating petty cash card:', error);
      return {
        success: false,
        error: error.message || 'Failed to update petty cash card'
      };
    }
  }

  /**
   * Delete a petty cash card
   */
  async deleteCard(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Error deleting petty cash card:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete petty cash card'
      };
    }
  }

  /**
   * Reload a petty cash card
   */
  async reloadCard(cardId, reloadData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/reload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reloadData),
      });
      return data;
    } catch (error) {
      console.error('Error reloading petty cash card:', error);
      return {
        success: false,
        error: error.message || 'Failed to reload petty cash card'
      };
    }
  }

  // === PETTY CASH EXPENSES ===

  /**
   * Get all petty cash expenses
   */
  async getAllExpenses() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses`);
      return data;
    } catch (error) {
      console.error('Error fetching petty cash expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch petty cash expenses',
        data: []
      };
    }
  }

  /**
   * Get expenses by card
   */
  async getExpensesByCard(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/card/${cardId}`);
      return data;
    } catch (error) {
      console.error('Error fetching card expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch card expenses',
        data: []
      };
    }
  }

  /**
   * Create a new expense
   */
  async createExpense(expenseData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      return data;
    } catch (error) {
      console.error('Error creating expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to create expense'
      };
    }
  }

  /**
   * Update an expense
   */
  async updateExpense(expenseId, expenseData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });
      return data;
    } catch (error) {
      console.error('Error updating expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to update expense'
      };
    }
  }

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Error deleting expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete expense'
      };
    }
  }

  /**
   * Approve an expense
   */
  async approveExpense(expenseId, approvalData = {}) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });
      return data;
    } catch (error) {
      console.error('Error approving expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve expense'
      };
    }
  }

  /**
   * Reject an expense
   */
  async rejectExpense(expenseId, rejectionData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      });
      return data;
    } catch (error) {
      console.error('Error rejecting expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject expense'
      };
    }
  }

  /**
   * Get pending approval expenses
   */
  async getPendingApprovalExpenses() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/pending-approval`);
      return data;
    } catch (error) {
      console.error('Error fetching pending expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending expenses',
        data: []
      };
    }
  }

  /**
   * Search expenses
   */
  async searchExpenses(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.cardId) params.append('cardId', filters.cardId);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/search?${params.toString()}`);
      return data;
    } catch (error) {
      console.error('Error searching expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to search expenses',
        data: []
      };
    }
  }

  /**
   * Get expense analytics
   */
  async getExpenseAnalytics(period = '30') {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/analytics?period=${period}`);
      return data;
    } catch (error) {
      console.error('Error fetching expense analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expense analytics',
        data: null
      };
    }
  }

  /**
   * Get expense categories
   */
  async getExpenseCategories() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/categories`);
      return data;
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expense categories',
        data: []
      };
    }
  }

  /**
   * Get expense types (alias for getExpenseCategories)
   */
  async getExpenseTypes() {
    return await this.getExpenseCategories();
  }

  /**
   * Get analytics (alias for getExpenseAnalytics)
   */
  async getAnalytics(period = '30') {
    return await this.getExpenseAnalytics(period);
  }

  /**
   * Upload expense receipt
   */
  async uploadReceipt(expenseId, receiptFile) {
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}/receipt`, {
        method: 'POST',
        body: formData,
      });
      return data;
    } catch (error) {
      console.error('Error uploading receipt:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload receipt'
      };
    }
  }

  // === CARD TRANSACTIONS ===

  /**
   * Get transaction history for a card
   */
  async getCardTransactions(cardId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.type) params.append('type', options.type);
      if (options.dateFrom) params.append('dateFrom', options.dateFrom);
      if (options.dateTo) params.append('dateTo', options.dateTo);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/petty-cash-cards/${cardId}/transactions${queryString ? `?${queryString}` : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      console.error('Error fetching card transactions:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch card transactions',
        data: []
      };
    }
  }

  // === CARD DEACTIVATION ===

  /**
   * Deactivate a petty cash card with reason
   */
  async deactivateCard(cardId, reason) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      return data;
    } catch (error) {
      console.error('Error deactivating card:', error);
      return {
        success: false,
        error: error.message || 'Failed to deactivate card'
      };
    }
  }

  /**
   * Reactivate a suspended petty cash card
   */
  async reactivateCard(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/reactivate`, {
        method: 'POST',
      });
      return data;
    } catch (error) {
      console.error('Error reactivating card:', error);
      return {
        success: false,
        error: error.message || 'Failed to reactivate card'
      };
    }
  }

  // === PETTY CASH USERS ===

  /**
   * Get all petty cash users
   */
  async getAllUsers(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);
      if (options.cardId) params.append('cardId', options.cardId);
      if (options.department) params.append('department', options.department);
      if (options.isActive !== undefined) params.append('isActive', options.isActive);
      if (options.search) params.append('search', options.search);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/petty-cash-users${queryString ? `?${queryString}` : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      console.error('Error fetching petty cash users:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch petty cash users',
        data: []
      };
    }
  }

  /**
   * Get a specific petty cash user by ID
   */
  async getUserById(userId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-users/${userId}`);
      return data;
    } catch (error) {
      console.error('Error fetching petty cash user:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch petty cash user',
        data: null
      };
    }
  }

  /**
   * Deactivate a petty cash user with reason
   */
  async deactivateUser(userId, reason) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-users/${userId}/deactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });
      return data;
    } catch (error) {
      console.error('Error deactivating user:', error);
      return {
        success: false,
        error: error.message || 'Failed to deactivate user'
      };
    }
  }

  /**
   * Reactivate a deactivated petty cash user
   */
  async reactivateUser(userId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-users/${userId}/reactivate`, {
        method: 'POST',
      });
      return data;
    } catch (error) {
      console.error('Error reactivating user:', error);
      return {
        success: false,
        error: error.message || 'Failed to reactivate user'
      };
    }
  }

  // === BALANCE VERIFICATION ===

  /**
   * Verify balance for a single card
   */
  async verifyCardBalance(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/verify-balance`);
      return data;
    } catch (error) {
      console.error('Error verifying card balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify card balance'
      };
    }
  }

  /**
   * Verify all card balances
   */
  async verifyAllCardBalances() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/verify-all-balances`);
      return data;
    } catch (error) {
      console.error('Error verifying all card balances:', error);
      return {
        success: false,
        error: error.message || 'Failed to verify card balances'
      };
    }
  }

  /**
   * Fix card balance (recalculate and correct)
   */
  async fixCardBalance(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/fix-balance`, {
        method: 'POST',
      });
      return data;
    } catch (error) {
      console.error('Error fixing card balance:', error);
      return {
        success: false,
        error: error.message || 'Failed to fix card balance'
      };
    }
  }

  /**
   * Get detailed audit trail for a card
   */
  async getCardAuditTrail(cardId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/audit-trail`);
      return data;
    } catch (error) {
      console.error('Error getting card audit trail:', error);
      return {
        success: false,
        error: error.message || 'Failed to get card audit trail'
      };
    }
  }
}

const pettyCashService = new PettyCashService();
export default pettyCashService;
