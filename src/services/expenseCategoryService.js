/**
 * Expense Category Service
 * Handles all expense category-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class ExpenseCategoryService {
  /**
   * Get all expense categories with optional filtering
   * @param {Object} options - Filter options
   * @param {string} options.type - Filter by type (purchase, sales, operational, petty_cash)
   * @param {boolean} options.is_active - Filter by active status
   * @param {number} options.page - Page number
   * @param {number} options.limit - Items per page
   */
  async getAll(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.type) params.append('type', options.type);
      if (options.is_active !== undefined) params.append('is_active', options.is_active);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/expense-categories${queryString ? `?${queryString}` : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);

      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching expense categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expense categories',
        data: [],
      };
    }
  }

  /**
   * Get all category types
   */
  async getTypes() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expense-categories/types`);

      return {
        success: true,
        data: data.data || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching category types:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch category types',
        data: [],
      };
    }
  }

  /**
   * Get categories for dropdown selection
   * @param {string} type - Category type (purchase, sales, operational, petty_cash)
   * @param {string} locale - Locale for name field ('en' or 'ar')
   */
  async getForDropdown(type, locale = 'en') {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expense-categories/dropdown/${type}?locale=${locale}`
      );

      return {
        success: true,
        data: data.data || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching dropdown categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch dropdown categories',
        data: [],
      };
    }
  }

  /**
   * Get categories by type
   * @param {string} type - Category type
   * @param {boolean} includeInactive - Include inactive categories
   */
  async getByType(type, includeInactive = false) {
    try {
      const url = `${API_BASE_URL}/expense-categories/by-type/${type}?includeInactive=${includeInactive}`;
      const data = await authService.makeAuthenticatedRequest(url);

      return {
        success: true,
        data: data.data || [],
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching categories by type:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch categories by type',
        data: [],
      };
    }
  }

  /**
   * Get category statistics
   */
  async getStatistics() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expense-categories/statistics`);

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching category statistics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        data: null,
      };
    }
  }

  /**
   * Get a specific category by ID
   * @param {number} categoryId - Category ID
   */
  async getById(categoryId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expense-categories/${categoryId}`
      );

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error fetching category:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch category',
        data: null,
      };
    }
  }

  /**
   * Create a new expense category
   * @param {Object} categoryData - Category data
   */
  async create(categoryData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/expense-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(categoryData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Category created successfully',
      };
    } catch (error) {
      console.error('Error creating category:', error);
      return {
        success: false,
        error: error.message || 'Failed to create category',
      };
    }
  }

  /**
   * Update an existing category
   * @param {number} categoryId - Category ID
   * @param {Object} categoryData - Updated category data
   */
  async update(categoryId, categoryData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expense-categories/${categoryId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(categoryData),
        }
      );

      return {
        success: true,
        data: data.data,
        message: data.message || 'Category updated successfully',
      };
    } catch (error) {
      console.error('Error updating category:', error);
      return {
        success: false,
        error: error.message || 'Failed to update category',
      };
    }
  }

  /**
   * Toggle category active status (soft delete/reactivate)
   * @param {number} categoryId - Category ID
   * @param {boolean} isActive - New active status
   */
  async toggleActive(categoryId, isActive) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expense-categories/${categoryId}/toggle-active`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ is_active: isActive }),
        }
      );

      return {
        success: true,
        message: data.message || (isActive ? 'Category reactivated' : 'Category deactivated'),
      };
    } catch (error) {
      console.error('Error toggling category status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update category status',
      };
    }
  }

  /**
   * Delete a category (hard delete - only if not referenced)
   * @param {number} categoryId - Category ID
   */
  async delete(categoryId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expense-categories/${categoryId}`,
        {
          method: 'DELETE',
        }
      );

      return {
        success: true,
        message: data.message || 'Category deleted successfully',
      };
    } catch (error) {
      console.error('Error deleting category:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete category',
      };
    }
  }

  /**
   * Validate if an amount exceeds category's max_amount
   * @param {number} categoryId - Category ID
   * @param {number} amount - Amount to validate
   */
  async validateAmount(categoryId, amount) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/expense-categories/${categoryId}/validate-amount`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ amount }),
        }
      );

      return {
        success: true,
        data: data.data,
        message: data.message,
      };
    } catch (error) {
      console.error('Error validating amount:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate amount',
        data: { valid: false },
      };
    }
  }
}

const expenseCategoryService = new ExpenseCategoryService();
export default expenseCategoryService;
