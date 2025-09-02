/**
 * Customer Service
 * Handles all customer-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class CustomerService {
  /**
   * Get all customers for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customers');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customers',
        data: []
      };
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getById(customerId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer',
        data: null
      };
    }
  }

  /**
   * Create a new customer
   */
  async create(customerData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create customer');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Customer created successfully'
      };
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to create customer'
      };
    }
  }

  /**
   * Update an existing customer
   */
  async update(customerId, customerData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Customer updated successfully'
      };
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to update customer'
      };
    }
  }

  /**
   * Delete a customer
   */
  async delete(customerId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete customer');
      }

      return {
        success: true,
        message: data.message || 'Customer deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete customer'
      };
    }
  }

  /**
   * Search customers by name, code, or contact
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search customers');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        success: false,
        error: error.message || 'Failed to search customers',
        data: []
      };
    }
  }

  /**
   * Get customer contracts
   */
  async getContracts(customerId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}/contracts`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer contracts');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching customer contracts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer contracts',
        data: []
      };
    }
  }

  /**
   * Get customer sales history
   */
  async getSalesHistory(customerId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.limit) params.append('limit', options.limit);

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/customers/${customerId}/sales-history?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer sales history');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching customer sales history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer sales history',
        data: []
      };
    }
  }

  /**
   * Update customer status (activate/deactivate)
   */
  async updateStatus(customerId, isActive) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update customer status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Customer status updated successfully'
      };
    } catch (error) {
      console.error('Error updating customer status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update customer status'
      };
    }
  }
}

const customerService = new CustomerService();
export default customerService;