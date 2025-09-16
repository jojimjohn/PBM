/**
 * Unified Expense Service
 * Handles both purchase and collection expenses through unified API
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class ExpenseService {
  /**
   * Get all expenses with filtering
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();
      
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.search) params.append('search', filters.search);
      if (filters.expenseType) params.append('expenseType', filters.expenseType);
      if (filters.referenceId) params.append('referenceId', filters.referenceId);
      if (filters.category) params.append('category', filters.category);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/expenses${queryString ? `?${queryString}` : ''}`;
      
      const response = await authService.makeAuthenticatedRequest(url);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch expenses');
      }

      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination,
        summary: data.summary,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expenses',
        data: [],
        pagination: null,
        summary: null
      };
    }
  }

  /**
   * Get expenses by type (purchase or collection)
   */
  async getByType(expenseType, filters = {}) {
    return this.getAll({
      ...filters,
      expenseType
    });
  }

  /**
   * Get purchase expenses only
   */
  async getPurchaseExpenses(filters = {}) {
    return this.getByType('purchase', filters);
  }

  /**
   * Get collection expenses only
   */
  async getCollectionExpenses(filters = {}) {
    return this.getByType('collection', filters);
  }

  /**
   * Get expenses for specific reference (purchase order or collection order)
   */
  async getByReference(referenceId, referenceType, filters = {}) {
    return this.getAll({
      ...filters,
      referenceId,
      referenceType
    });
  }

  /**
   * Get specific expense by ID
   */
  async getById(expenseId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses/${expenseId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch expense');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching expense:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expense',
        data: null
      };
    }
  }

  /**
   * Create expenses (bulk creation)
   */
  async create(expenseData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(expenseData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create expenses');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Expenses created successfully'
      };
    } catch (error) {
      console.error('Error creating expenses:', error);
      return {
        success: false,
        error: error.message || 'Failed to create expenses'
      };
    }
  }

  /**
   * Create purchase expenses
   */
  async createPurchaseExpenses(purchaseOrderId, expenses, totalAmount) {
    return this.create({
      referenceId: purchaseOrderId,
      referenceType: 'purchase_order',
      expenseType: 'purchase',
      expenses,
      totalAmount
    });
  }

  /**
   * Create collection expenses
   */
  async createCollectionExpenses(collectionOrderId, expenses, totalAmount) {
    return this.create({
      referenceId: collectionOrderId,
      referenceType: 'collection_order',
      expenseType: 'collection',
      expenses,
      totalAmount
    });
  }

  /**
   * Update an expense
   */
  async update(expenseId, expenseData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses/${expenseId}`, {
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
  async delete(expenseId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses/${expenseId}`, {
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
   * Get expense categories
   */
  async getCategories() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expenses/meta/categories`);
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
   * Get categories applicable to specific expense type
   */
  async getCategoriesByType(expenseType) {
    try {
      const result = await this.getCategories();
      if (!result.success) {
        return result;
      }

      const filteredCategories = result.data.filter(category => 
        category.applicableTo.includes(expenseType)
      );

      return {
        success: true,
        data: filteredCategories,
        message: result.message
      };
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch categories',
        data: []
      };
    }
  }

  /**
   * Get expense analytics
   */
  async getAnalytics(period = '30', expenseType = '') {
    try {
      const params = new URLSearchParams();
      if (period) params.append('period', period);
      if (expenseType) params.append('expenseType', expenseType);

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expenses/analytics/summary?${params.toString()}`
      );
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
   * Search expenses
   */
  async search(query, filters = {}) {
    return this.getAll({
      ...filters,
      search: query
    });
  }

  /**
   * Get expense summary for dashboard
   */
  async getSummary(filters = {}) {
    try {
      const result = await this.getAll(filters);
      
      if (!result.success) {
        return result;
      }

      return {
        success: true,
        data: result.summary,
        message: 'Expense summary retrieved successfully'
      };
    } catch (error) {
      console.error('Error fetching expense summary:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expense summary',
        data: null
      };
    }
  }

  /**
   * Bulk operations helper
   */
  async bulkDelete(expenseIds) {
    try {
      const results = [];
      for (const id of expenseIds) {
        const result = await this.delete(id);
        results.push({ id, ...result });
      }

      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;

      return {
        success: failCount === 0,
        message: `${successCount} expenses deleted successfully${failCount > 0 ? `, ${failCount} failed` : ''}`,
        results
      };
    } catch (error) {
      console.error('Error in bulk delete:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete expenses',
        results: []
      };
    }
  }

  /**
   * Export expenses data
   */
  async exportData(filters = {}, format = 'json') {
    try {
      const result = await this.getAll({
        ...filters,
        limit: 10000 // Get all for export
      });

      if (!result.success) {
        return result;
      }

      if (format === 'csv') {
        return this._convertToCSV(result.data);
      }

      return {
        success: true,
        data: result.data,
        message: 'Expense data exported successfully'
      };
    } catch (error) {
      console.error('Error exporting expense data:', error);
      return {
        success: false,
        error: error.message || 'Failed to export expense data',
        data: null
      };
    }
  }

  /**
   * Convert expense data to CSV format
   */
  _convertToCSV(expenses) {
    if (!expenses || expenses.length === 0) {
      return {
        success: false,
        error: 'No data to export',
        data: null
      };
    }

    const headers = [
      'ID', 'Expense Type', 'Reference Type', 'Reference ID', 'Category',
      'Description', 'Amount', 'Currency', 'Vendor', 'Receipt Number',
      'Paid By', 'Payment Method', 'Expense Date', 'Notes', 'Created Date'
    ];

    const csvRows = [
      headers.join(','),
      ...expenses.map(expense => [
        expense.id,
        expense.expenseType,
        expense.referenceType,
        expense.referenceId,
        expense.category,
        `"${expense.description || ''}"`,
        expense.amount,
        expense.currency,
        `"${expense.vendor || ''}"`,
        `"${expense.receiptNumber || ''}"`,
        `"${expense.paidBy || ''}"`,
        expense.paymentMethod,
        expense.expenseDate,
        `"${expense.notes || ''}"`,
        expense.createdAt
      ].join(','))
    ];

    return {
      success: true,
      data: csvRows.join('\n'),
      message: 'Data converted to CSV successfully'
    };
  }
}

const expenseService = new ExpenseService();
export default expenseService;