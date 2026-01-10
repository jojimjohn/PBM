/**
 * Purchase Order Service
 * Handles all purchase order-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class PurchaseOrderService {
  /**
   * Get purchase orders for the current company with optional pagination
   * @param {Object} options - Pagination and filter options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.limit - Items per page (default: 10, use 0 for all)
   * @param {string} options.search - Search term
   * @param {string} options.status - Filter by status
   * @param {string} options.sortBy - Sort field
   * @param {string} options.sortOrder - Sort direction (asc/desc)
   * @param {number|string} options.project_id - Filter by project ID (optional)
   * @returns {Promise<Object>} { success, data, pagination }
   */
  async getAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = '',
        status = '',
        sortBy = 'created_at',
        sortOrder = 'desc',
        project_id = null
      } = options;

      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', limit);
      if (search) params.append('search', search);
      if (status) params.append('status', status);
      if (sortBy) params.append('sortBy', sortBy);
      if (sortOrder) params.append('sortOrder', sortOrder);
      if (project_id && project_id !== 'all') params.append('project_id', project_id);

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching purchase orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase orders',
        data: [],
        pagination: { page: 1, limit: 10, total: 0, totalPages: 0 }
      };
    }
  }

  /**
   * Get a specific purchase order by ID
   */
  async getById(orderId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}`);
      return data;
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
   * Get unbilled purchase orders (for vendor bill creation)
   * @returns {Promise<Object>} List of POs suitable for vendor billing
   */
  async getUnbilledPOs() {
    try {
      const params = new URLSearchParams({
        status: 'received',
        unbilled: 'true'
      });

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-orders?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching unbilled purchase orders:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch unbilled purchase orders',
        data: []
      };
    }
  }

  /**
   * Create a new purchase order
   */
  async create(orderData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}`, {
        method: 'DELETE',
      });
      return data;
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

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/search?${params.toString()}`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/supplier/${supplierId}`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/pending`);
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}/status`, {
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
   * Approve purchase order
   */
  async approve(orderId, approvalData = {}) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${orderId}/receive`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(receiptData),
      });
      return data;
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/analytics?period=${period}`);
      return data;
    } catch (error) {
      console.error('Error fetching purchase analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase analytics',
        data: null
      };
    }
  }

  /**
   * Get all amendments for a purchase order
   */
  async getAmendments(orderId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-order-amendments?orderId=${orderId}`);
      return data;
    } catch (error) {
      console.error('Error fetching amendments:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch amendments',
        data: []
      };
    }
  }

  /**
   * Get a specific amendment by ID
   */
  async getAmendmentById(amendmentId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-order-amendments/${amendmentId}`);
      return data;
    } catch (error) {
      console.error('Error fetching amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch amendment',
        data: null
      };
    }
  }

  /**
   * Create a new amendment for a purchase order
   */
  async createAmendment(orderId, amendmentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-order-amendments`, {
        method: 'POST',
        body: JSON.stringify({
          originalOrderId: orderId,
          ...amendmentData
        }),
      });
      return data;
    } catch (error) {
      console.error('Error creating amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create amendment'
      };
    }
  }

  /**
   * Approve or reject an amendment
   */
  async approveAmendment(amendmentId, approvalData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-order-amendments/${amendmentId}/approve`, {
        method: 'PUT',
        body: JSON.stringify(approvalData),
      });
      return data;
    } catch (error) {
      console.error('Error approving/rejecting amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to process amendment approval'
      };
    }
  }

  /**
   * Manually link PO to WCN and update inventory
   * Sprint 4.5: Supports manual PO → WCN workflow
   */
  async linkToWCN(purchaseOrderId, wcnData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/purchase-orders/${purchaseOrderId}/link-wcn`, {
        method: 'POST',
        body: JSON.stringify(wcnData),
      });
      return data;
    } catch (error) {
      console.error('Error linking PO to WCN:', error);
      return {
        success: false,
        error: error.message || 'Failed to link PO to WCN'
      };
    }
  }
}

const purchaseOrderService = new PurchaseOrderService();
export default purchaseOrderService;
