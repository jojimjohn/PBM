/**
 * Sales Order Service
 * Handles all sales order-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class SalesOrderService {
  /**
   * Transform decimal fields from strings to numbers
   * Defensive programming in case backend doesn't convert them
   * @param {Object|Array} data - Single order or array of orders
   * @returns {Object|Array} Data with decimal fields converted to numbers
   */
  transformDecimalFields(data) {
    const decimalFields = [
      'subtotal', 'taxAmount', 'discountAmount', 'shippingCost', 'totalAmount',
      'quantity', 'unitPrice', 'totalPrice', 'discountPercentage'
    ];

    const transformObject = (obj) => {
      if (!obj) return obj;
      const transformed = { ...obj };

      // Convert decimal fields
      decimalFields.forEach(field => {
        if (transformed[field] !== undefined && transformed[field] !== null) {
          transformed[field] = parseFloat(transformed[field]) || 0;
        }
      });

      // Transform items array if present
      if (transformed.items && Array.isArray(transformed.items)) {
        transformed.items = transformed.items.map(item => transformObject(item));
      }

      return transformed;
    };

    return Array.isArray(data) ? data.map(transformObject) : transformObject(data);
  }

  /**
   * Get all sales orders for the current company
   */
  async getAll() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders`);

      // Transform decimal fields if data exists
      if (response.success && response.data) {
        response.data = this.transformDecimalFields(response.data);
      }

      return response;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}`);

      // Transform decimal fields if data exists
      if (response.success && response.data) {
        response.data = this.transformDecimalFields(response.data);
      }

      return response;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      // Transform decimal fields if data exists
      if (response.success && response.data) {
        response.data = this.transformDecimalFields(response.data);
      }

      return response;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}`, {
        method: 'DELETE',
      });
      return data;
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

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/search?${params.toString()}`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/customer/${customerId}`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/pending`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(processingData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/items`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/calculate-pricing`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/${orderId}/invoice`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoiceData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/analytics?period=${period}`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/sales-orders/today-summary`);

      // Transform decimal fields if data exists
      if (response.success && response.data) {
        response.data = this.transformDecimalFields(response.data);
      }

      return response;
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
