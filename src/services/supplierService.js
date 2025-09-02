/**
 * Supplier Service
 * Handles all supplier-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class SupplierService {
  /**
   * Get all suppliers for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch suppliers');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch suppliers',
        data: []
      };
    }
  }

  /**
   * Get a specific supplier by ID
   */
  async getById(supplierId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers/${supplierId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier',
        data: null
      };
    }
  }

  /**
   * Create a new supplier
   */
  async create(supplierData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supplier');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Supplier created successfully'
      };
    } catch (error) {
      console.error('Error creating supplier:', error);
      return {
        success: false,
        error: error.message || 'Failed to create supplier'
      };
    }
  }

  /**
   * Update an existing supplier
   */
  async update(supplierId, supplierData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(supplierData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update supplier');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Supplier updated successfully'
      };
    } catch (error) {
      console.error('Error updating supplier:', error);
      return {
        success: false,
        error: error.message || 'Failed to update supplier'
      };
    }
  }

  /**
   * Delete a supplier
   */
  async delete(supplierId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers/${supplierId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete supplier');
      }

      return {
        success: true,
        message: data.message || 'Supplier deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting supplier:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete supplier'
      };
    }
  }

  /**
   * Search suppliers by name, code, or contact
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search suppliers');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching suppliers:', error);
      return {
        success: false,
        error: error.message || 'Failed to search suppliers',
        data: []
      };
    }
  }

  /**
   * Get supplier purchase history
   */
  async getPurchaseHistory(supplierId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.limit) params.append('limit', options.limit);

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/suppliers/${supplierId}/purchase-history?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier purchase history');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier purchase history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier purchase history',
        data: []
      };
    }
  }

  /**
   * Update supplier status (activate/deactivate)
   */
  async updateStatus(supplierId, isActive) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers/${supplierId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update supplier status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Supplier status updated successfully'
      };
    } catch (error) {
      console.error('Error updating supplier status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update supplier status'
      };
    }
  }

  /**
   * Get supplier categories
   */
  async getCategories() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers/categories`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier categories');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier categories',
        data: []
      };
    }
  }

  /**
   * Get supplier performance metrics
   */
  async getPerformanceMetrics(supplierId, period = '30') {
    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/suppliers/${supplierId}/performance?period=${period}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier performance');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier performance:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier performance',
        data: null
      };
    }
  }
}

const supplierService = new SupplierService();
export default supplierService;