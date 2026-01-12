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
      if (filters.billStatus) params.append('billStatus', filters.billStatus);  // For company bills: draft/sent
      if (filters.billType) params.append('billType', filters.billType);
      if (filters.fromDate) params.append('fromDate', filters.fromDate);
      if (filters.toDate) params.append('toDate', filters.toDate);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);
      if (filters.project_id && filters.project_id !== 'all') params.append('project_id', filters.project_id);

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
   * Get company bills only
   */
  async getCompanyBills(filters = {}) {
    return this.getAll({ ...filters, billType: 'company' });
  }

  /**
   * Get vendor bills only
   */
  async getVendorBills(filters = {}) {
    return this.getAll({ ...filters, billType: 'vendor' });
  }

  /**
   * Get bill type display name
   */
  getBillTypeName(billType) {
    const typeNames = {
      company: 'Company Bill',
      vendor: 'Vendor Bill'
    };
    return typeNames[billType] || billType;
  }

  /**
   * Get bill type color for UI
   */
  getBillTypeColor(billType) {
    const typeColors = {
      company: '#3b82f6',  // blue
      vendor: '#8b5cf6'    // purple
    };
    return typeColors[billType] || '#6b7280';
  }

  /**
   * Get bill status display name (for company bills: draft/sent workflow)
   */
  getBillStatusName(status) {
    const statusNames = {
      draft: 'Draft',
      sent: 'Sent'
    };
    return statusNames[status] || status;
  }

  /**
   * Get bill status color for UI (for company bills)
   */
  getBillStatusColor(status) {
    const statusColors = {
      draft: '#f59e0b',   // amber - needs action
      sent: '#10b981'     // green - finalized
    };
    return statusColors[status] || '#6b7280';
  }

  /**
   * Get company bills that are not linked to any vendor bill
   * @param {number} supplierId - Filter by supplier
   * @param {string} status - Filter by bill_status (draft/sent)
   * @returns {Promise<Object>} Available company bills for linking
   */
  async getUnlinkedCompanyBills(supplierId = null, status = null) {
    try {
      const params = new URLSearchParams();
      if (supplierId) params.append('supplierId', supplierId);
      if (status) params.append('status', status);

      const url = `${API_BASE_URL}/purchase-invoices/unlinked-company-bills${params.toString() ? '?' + params.toString() : ''}`;
      const data = await authService.makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      console.error('Error fetching unlinked company bills:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch unlinked company bills',
        data: []
      };
    }
  }

  /**
   * Update company bill status (draft → sent)
   * @param {number} billId - Company bill ID
   * @param {string} status - New status ('draft' or 'sent')
   * @returns {Promise<Object>} API response
   */
  async updateCompanyBillStatus(billId, status) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/${billId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );
      return data;
    } catch (error) {
      console.error('Error updating company bill status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update company bill status'
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
   * Create a vendor bill covering multiple company bills
   * @param {Object} vendorBillData - Vendor bill data with coversCompanyBills array
   *   - coversCompanyBills: Array of company bill IDs (new workflow)
   *   - coversPurchaseOrders: Array of PO IDs (legacy, deprecated)
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
   * Get draft company bills (convenience method)
   * Used to show company bills that need to be marked as sent
   */
  async getDraftCompanyBills(filters = {}) {
    return this.getCompanyBills({ ...filters, billStatus: 'draft' });
  }

  /**
   * Get sent company bills (convenience method)
   * Used for vendor bill linking - only sent bills can be linked
   */
  async getSentCompanyBills(filters = {}) {
    return this.getCompanyBills({ ...filters, billStatus: 'sent' });
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

  /**
   * Sync payment status for all invoices
   * Fixes data inconsistencies where balance=0 but status!='paid'
   * @returns {Promise<Object>} Sync result with count of fixed invoices
   */
  async syncPaymentStatus() {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/sync-status`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return data;
    } catch (error) {
      console.error('Error syncing payment status:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync payment status'
      };
    }
  }

  /**
   * Sync invoice number prefixes
   * Adds CB-/VB- prefix to invoices that don't have them
   * @returns {Promise<Object>} Sync result with count of updated invoices
   */
  async syncInvoicePrefixes() {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/sync-prefixes`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return data;
    } catch (error) {
      console.error('Error syncing invoice prefixes:', error);
      return {
        success: false,
        error: error.message || 'Failed to sync invoice prefixes'
      };
    }
  }

  /**
   * Reset payments on orphan company bills
   * Company bills without vendor bills should not have been paid directly
   * @returns {Promise<Object>} Reset result with count of affected bills
   */
  async resetOrphanPayments() {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-invoices/reset-orphan-payments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      return data;
    } catch (error) {
      console.error('Error resetting orphan payments:', error);
      return {
        success: false,
        error: error.message || 'Failed to reset orphan payments'
      };
    }
  }

  /**
   * Run all data sync operations
   * @returns {Promise<Object>} Combined sync results
   */
  async runAllSync() {
    const results = {
      statusSync: null,
      prefixSync: null,
      orphanReset: null
    };

    results.statusSync = await this.syncPaymentStatus();
    results.prefixSync = await this.syncInvoicePrefixes();
    results.orphanReset = await this.resetOrphanPayments();

    return results;
  }
}

export default new PurchaseInvoiceService();
