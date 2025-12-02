/**
 * Purchase Order Amendment Service
 * Handles all purchase order amendment-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class PurchaseOrderAmendmentService {
  /**
   * Get all amendments (optionally filtered by original order)
   */
  async getAll(originalOrderId = null) {
    try {
      const url = originalOrderId
        ? `${API_BASE_URL}/purchase-order-amendments?originalOrderId=${originalOrderId}`
        : `${API_BASE_URL}/purchase-order-amendments`;

      const data = await authService.makeAuthenticatedRequest(url);
      return data;
    } catch (error) {
      console.error('Error fetching purchase order amendments:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase order amendments',
        data: []
      };
    }
  }

  /**
   * Get a specific amendment by ID
   */
  async getById(amendmentId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-order-amendments/${amendmentId}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching purchase order amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase order amendment',
        data: null
      };
    }
  }

  /**
   * Create a new amendment from existing purchase order
   */
  async create(amendmentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-order-amendments`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(amendmentData),
        }
      );
      return data;
    } catch (error) {
      console.error('Error creating purchase order amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to create purchase order amendment'
      };
    }
  }

  /**
   * Approve an amendment
   */
  async approve(amendmentId, notes = '') {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-order-amendments/${amendmentId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'approved',
            notes
          }),
        }
      );
      return data;
    } catch (error) {
      console.error('Error approving purchase order amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve purchase order amendment'
      };
    }
  }

  /**
   * Reject an amendment
   */
  async reject(amendmentId, notes = '') {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-order-amendments/${amendmentId}/approve`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'rejected',
            notes
          }),
        }
      );
      return data;
    } catch (error) {
      console.error('Error rejecting purchase order amendment:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject purchase order amendment'
      };
    }
  }

  /**
   * Get amendments by status
   */
  async getByStatus(status) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/purchase-order-amendments?status=${status}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching purchase order amendments by status:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch purchase order amendments',
        data: []
      };
    }
  }

  /**
   * Get pending amendments
   */
  async getPendingAmendments() {
    return this.getByStatus('pending');
  }
}

export default new PurchaseOrderAmendmentService();
