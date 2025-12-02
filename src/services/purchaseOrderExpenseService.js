import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

/**
 * Purchase Order Expense Service
 *
 * Manages expenses linked to purchase orders (freight, customs, handling, etc.)
 */
class PurchaseOrderExpenseService {
  /**
   * Get all expenses for a purchase order
   */
  async getExpenses(purchaseOrderId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders/${purchaseOrderId}/expenses`
      );
      return data;
    } catch (error) {
      console.error('Error fetching PO expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expenses',
        data: { expenses: [], summary: { total: 0, byCategory: {}, count: 0 } }
      };
    }
  }

  /**
   * Create a new expense for a purchase order
   */
  async createExpense(purchaseOrderId, expenseData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders/${purchaseOrderId}/expenses`,
        {
          method: 'POST',
          body: JSON.stringify(expenseData)
        }
      );
      return data;
    } catch (error) {
      console.error('Error creating PO expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to create expense'
      };
    }
  }

  /**
   * Update a purchase order expense
   */
  async updateExpense(expenseId, expenseData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders/expenses/${expenseId}`,
        {
          method: 'PUT',
          body: JSON.stringify(expenseData)
        }
      );
      return data;
    } catch (error) {
      console.error('Error updating PO expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to update expense'
      };
    }
  }

  /**
   * Delete a purchase order expense
   */
  async deleteExpense(expenseId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders/expenses/${expenseId}`,
        {
          method: 'DELETE'
        }
      );
      return data;
    } catch (error) {
      console.error('Error deleting PO expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete expense'
      };
    }
  }

  /**
   * Get expense summary for a purchase order
   */
  async getExpenseSummary(purchaseOrderId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders/${purchaseOrderId}/expense-summary`
      );
      return data;
    } catch (error) {
      console.error('Error fetching PO expense summary:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expense summary',
        data: {
          purchaseOrderTotal: 0,
          totalExpenses: 0,
          expenseCount: 0,
          actualCost: 0,
          expensePercentage: 0
        }
      };
    }
  }

  /**
   * Get expense category options
   */
  getExpenseCategories() {
    return [
      { value: 'freight', label: 'Freight Charges' },
      { value: 'loading', label: 'Loading Fees' },
      { value: 'unloading', label: 'Unloading Fees' },
      { value: 'transport', label: 'Transportation' },
      { value: 'customs', label: 'Customs Duties' },
      { value: 'import_tax', label: 'Import Tax' },
      { value: 'handling', label: 'Handling Charges' },
      { value: 'insurance', label: 'Insurance' },
      { value: 'other', label: 'Other' }
    ];
  }

  /**
   * Format category for display
   */
  formatCategory(category) {
    const categories = this.getExpenseCategories();
    const found = categories.find(c => c.value === category);
    return found ? found.label : category;
  }
}

const purchaseOrderExpenseService = new PurchaseOrderExpenseService();
export default purchaseOrderExpenseService;
