/**
 * Purchase Order Service
 * Handles all purchase order-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class PurchaseOrderService {
  /**
   * Get all purchase orders for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch purchase orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase orders',
        data: []
      };
    }
  }

  /**
   * Get a specific purchase order by ID
   */
  async getById(orderId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch purchase order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching purchase order:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase order',
        data: null
      };
    }
  }

  /**
   * Create a new purchase order
   */
  async create(orderData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create purchase order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Purchase order created successfully'
      };
    } catch (error) {
      console.error('Error creating purchase order:', error);
      return {
        success: false,
        error: error.message || 'Failed to create purchase order'
      };
    }
  }

  /**
   * Update an existing purchase order
   */
  async update(orderId, orderData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update purchase order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Purchase order updated successfully'
      };
    } catch (error) {
      console.error('Error updating purchase order:', error);
      return {
        success: false,
        error: error.message || 'Failed to update purchase order'
      };
    }
  }

  /**
   * Delete a purchase order
   */
  async delete(orderId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete purchase order');
      }

      return {
        success: true,
        message: data.message || 'Purchase order deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting purchase order:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete purchase order'
      };
    }
  }

  /**
   * Search purchase orders
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.supplierId) params.append('supplierId', filters.supplierId);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.materialId) params.append('materialId', filters.materialId);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search purchase orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching purchase orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to search purchase orders',
        data: []
      };
    }
  }

  /**
   * Get purchase orders by supplier
   */
  async getBySupplier(supplierId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/supplier/${supplierId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier purchase orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier purchase orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier purchase orders',
        data: []
      };
    }
  }

  /**
   * Get pending purchase orders
   */
  async getPending() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/pending`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending purchase orders');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching pending purchase orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending purchase orders',
        data: []
      };
    }
  }

  /**
   * Update order status
   */
  async updateStatus(orderId, status) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}/status`, {
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
   * Approve purchase order
   */
  async approve(orderId, approvalData = {}) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve purchase order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Purchase order approved successfully'
      };
    } catch (error) {
      console.error('Error approving purchase order:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve purchase order'
      };
    }
  }

  /**
   * Receive purchase order (mark as received)
   */
  async receive(orderId, receiptData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to receive purchase order');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Purchase order received successfully'
      };
    } catch (error) {
      console.error('Error receiving purchase order:', error);
      return {
        success: false,
        error: error.message || 'Failed to receive purchase order'
      };
    }
  }

  /**
   * Get purchase analytics
   */
  async getAnalytics(period = '30') {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch purchase analytics');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching purchase analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase analytics',
        data: null
      };
    }
  }
}

const purchaseOrderService = new PurchaseOrderService();
export default purchaseOrderService;