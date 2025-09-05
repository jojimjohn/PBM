/**
 * Petty Cash Service
 * Handles all petty cash related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class PettyCashService {
  // === PETTY CASH CARDS ===

  /**
   * Get all petty cash cards
   */
  async getAllCards() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch petty cash cards');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch petty cash card');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create petty cash card');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Petty cash card created successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cardData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update petty cash card');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Petty cash card updated successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete petty cash card');
      }

      return {
        success: true,
        message: data.message || 'Petty cash card deleted successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-cards/${cardId}/reload`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reloadData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reload petty cash card');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Petty cash card reloaded successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch petty cash expenses');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/card/${cardId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch card expenses');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create expense');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Expense created successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update expense');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Expense updated successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete expense');
      }

      return {
        success: true,
        message: data.message || 'Expense deleted successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve expense');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Expense approved successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject expense');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Expense rejected successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/pending-approval`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending expenses');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search expenses');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch expense analytics');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/categories`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch expense categories');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
   * Upload expense receipt
   */
  async uploadReceipt(expenseId, receiptFile) {
    try {
      const formData = new FormData();
      formData.append('receipt', receiptFile);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/petty-cash-expenses/${expenseId}/receipt`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload receipt');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Receipt uploaded successfully'
      };
    } catch (error) {
      console.error('Error uploading receipt:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload receipt'
      };
    }
  }
}

const pettyCashService = new PettyCashService();
export default pettyCashService;