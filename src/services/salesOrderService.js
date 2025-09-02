/**
 * Sales Order Service
 * Handles all sales order-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class SalesOrderService {
  /**
   * Get all sales orders for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sales orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching sales orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch sales orders',
        data: []
      };
    }
  }

  /**
   * Get a specific sales order by ID
   */
  async getById(orderId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sales order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching sales order:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch sales order',
        data: null
      };
    }
  }

  /**
   * Create a new sales order
   */
  async create(orderData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create sales order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Sales order created successfully'
      };
    } catch (error) {
      console.error('Error creating sales order:', error);
      return {
        success: false,
        error: error.message || 'Failed to create sales order'
      };
    }
  }

  /**
   * Update an existing sales order
   */
  async update(orderId, orderData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update sales order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Sales order updated successfully'
      };
    } catch (error) {
      console.error('Error updating sales order:', error);
      return {
        success: false,
        error: error.message || 'Failed to update sales order'
      };
    }
  }

  /**
   * Delete a sales order
   */
  async delete(orderId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete sales order');
      }

      return {
        success: true,
        message: data.message || 'Sales order deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting sales order:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete sales order'
      };
    }
  }

  /**
   * Search sales orders
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.materialId) params.append('materialId', filters.materialId);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search sales orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching sales orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to search sales orders',
        data: []
      };
    }
  }

  /**
   * Get sales orders by customer
   */
  async getByCustomer(customerId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/customer/${customerId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch customer sales orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching customer sales orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer sales orders',
        data: []
      };
    }
  }

  /**
   * Get pending sales orders
   */
  async getPending() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/pending`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending sales orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching pending sales orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending sales orders',
        data: []
      };
    }
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update order status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Order status updated successfully'
      };
    } catch (error) {
      console.error('Error updating order status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update order status'
      };
    }
  }

  /**
   * Process order (mark as completed)
   */
  async process(orderId, processingData = {}) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process sales order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Sales order processed successfully'
      };
    } catch (error) {
      console.error('Error processing sales order:', error);
      return {
        success: false,
        error: error.message || 'Failed to process sales order'
      };
    }
  }

  /**
   * Get order items
   */
  async getItems(orderId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/items`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order items');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching order items:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch order items',
        data: []
      };
    }
  }

  /**
   * Calculate order pricing with contract rates
   */
  async calculatePricing(orderData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/calculate-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to calculate order pricing');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error calculating order pricing:', error);
      return {
        success: false,
        error: error.message || 'Failed to calculate order pricing',
        data: null
      };
    }
  }

  /**
   * Generate invoice from sales order
   */
  async generateInvoice(orderId, invoiceData = {}) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invoice');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Invoice generated successfully'
      };
    } catch (error) {
      console.error('Error generating invoice:', error);
      return {
        success: false,
        error: error.message || 'Failed to generate invoice'
      };
    }
  }

  /**
   * Get sales analytics
   */
  async getAnalytics(period = '30') {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch sales analytics');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching sales analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch sales analytics',
        data: null
      };
    }
  }

  /**
   * Get today's sales summary
   */
  async getTodaysSummary() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/today-summary`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch today\'s sales summary');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching today\'s sales summary:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch today\'s sales summary',
        data: null
      };
    }
  }
}

const salesOrderService = new SalesOrderService();
export default salesOrderService;