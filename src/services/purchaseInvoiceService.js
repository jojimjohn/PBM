/**
 * Purchase Invoice Service
 * Handles all purchase invoice-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class PurchaseInvoiceService {
  /**
   * Get all purchase invoices
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams();

      if (filters.search) params.append('search', filters.search);
      if (filters.supplierId) params.append('supplierId', filters.supplierId);
      if (filters.purchaseOrderId) params.append('purchaseOrderId', filters.purchaseOrderId);
      if (filters.paymentStatus) params.append('paymentStatus', filters.paymentStatus);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const url = `${API_BASE_URL}/purchase-invoices${params.toString() ? '?' + params.toString() : ''}`;
      const data = await authService.makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      console.error('Error fetching purchase invoices:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase invoices',
        data: []
      };
    }
  }

  /**
   * Get a specific purchase invoice by ID
   */
  async getById(invoiceId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/${invoiceId}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching purchase invoice:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase invoice',
        data: null
      };
    }
  }

  /**
   * Get invoices for a specific purchase order
   */
  async getByPurchaseOrder(purchaseOrderId) {
    return this.getAll({ purchaseOrderId });
  }

  /**
   * Get invoices by payment status
   */
  async getByPaymentStatus(paymentStatus) {
    return this.getAll({ paymentStatus });
  }

  /**
   * Get unpaid invoices
   */
  async getUnpaid() {
    return this.getByPaymentStatus('unpaid');
  }

  /**
   * Get overdue invoices
   */
  async getOverdue() {
    return this.getByPaymentStatus('overdue');
  }

  /**
   * Create a new purchase invoice from PO
   */
  async create(invoiceData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        }
      );
      return data;
    } catch (error) {
      console.error('Error creating purchase invoice:', error);
      return {
        success: false,
        error: error.message || 'Failed to create purchase invoice'
      };
    }
  }

  /**
   * Create a vendor bill covering multiple purchase orders
   * @param {Object} vendorBillData - Vendor bill data with coversPurchaseOrders array
   * @returns {Promise<Object>} API response
   */
  async createVendorBill(vendorBillData) {
    try {
      // Ensure billType is set to 'vendor'
      const billData = {
        ...vendorBillData,
        billType: 'vendor'
      };

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(billData),
        }
      );
      return data;
    } catch (error) {
      console.error('Error creating vendor bill:', error);
      return {
        success: false,
        error: error.message || 'Failed to create vendor bill'
      };
    }
  }

  /**
   * Update an existing purchase invoice
   */
  async update(invoiceId, invoiceData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/${invoiceId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(invoiceData),
        }
      );
      return data;
    } catch (error) {
      console.error('Error updating purchase invoice:', error);
      return {
        success: false,
        error: error.message || 'Failed to update purchase invoice'
      };
    }
  }

  /**
   * Delete a purchase invoice
   */
  async delete(invoiceId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/${invoiceId}`,
        {
          method: 'DELETE',
        }
      );
      return data;
    } catch (error) {
      console.error('Error deleting purchase invoice:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete purchase invoice'
      };
    }
  }

  /**
   * Record a payment for an invoice
   */
  async recordPayment(invoiceId, paymentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/${invoiceId}/payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        }
      );
      return data;
    } catch (error) {
      console.error('Error recording invoice payment:', error);
      return {
        success: false,
        error: error.message || 'Failed to record invoice payment'
      };
    }
  }

  /**
   * Upload invoice attachment (scanned invoice document)
   */
  async uploadAttachment(invoiceId, file) {
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/${invoiceId}/attachment`,
        {
          method: 'POST',
          body: formData,
        }
      );
      return data;
    } catch (error) {
      console.error('Error uploading invoice attachment:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload invoice attachment'
      };
    }
  }

  /**
   * Calculate days overdue for an invoice
   */
  calculateDaysOverdue(dueDate) {
    if (!dueDate) return 0;
    const today = new Date();
    const due = new Date(dueDate);
    const diffTime = today - due;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }

  /**
   * Get payment status color for UI
   */
  getPaymentStatusColor(status) {
    const statusColors = {
      unpaid: '#f59e0b',      // amber
      partial: '#3b82f6',     // blue
      paid: '#10b981',        // green
      overdue: '#ef4444'      // red
    };
    return statusColors[status] || '#6b7280'; // gray default
  }

  /**
   * Get payment status display name
   */
  getPaymentStatusName(status) {
    const statusNames = {
      unpaid: 'Unpaid',
      partial: 'Partially Paid',
      paid: 'Paid',
      overdue: 'Overdue'
    };
    return statusNames[status] || status;
  }
}

export default new PurchaseInvoiceService();
