/**
 * Wastage Service
 * Handles all wastage-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class WastageService {
  /**
   * Get all wastages for the current company
   * @param {Object} params - Optional query parameters
   * @param {string} params.project_id - Filter by project ID
   */
  async getAll(params = {}) {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params.project_id) queryParams.append('project_id', params.project_id);

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/wastages${queryString ? `?${queryString}` : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching wastages:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wastages',
        data: []
      };
    }
  }

  /**
   * Get a specific wastage by ID
   */
  async getById(wastageId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}`);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching wastage:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wastage',
        data: null
      };
    }
  }

  /**
   * Create a new wastage record
   */
  async create(wastageData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wastageData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Wastage record created successfully'
      };
    } catch (error) {
      console.error('Error creating wastage record:', error);
      return {
        success: false,
        error: error.message || 'Failed to create wastage record'
      };
    }
  }

  /**
   * Update an existing wastage record
   */
  async update(wastageId, wastageData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wastageData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Wastage record updated successfully'
      };
    } catch (error) {
      console.error('Error updating wastage record:', error);
      return {
        success: false,
        error: error.message || 'Failed to update wastage record'
      };
    }
  }

  /**
   * Delete a wastage record
   */
  async delete(wastageId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        message: data.message || 'Wastage record deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting wastage record:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete wastage record'
      };
    }
  }

  /**
   * Search wastage records
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.materialId) params.append('materialId', filters.materialId);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/search?${params.toString()}`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching wastage records:', error);
      return {
        success: false,
        error: error.message || 'Failed to search wastage records',
        data: []
      };
    }
  }

  /**
   * Get pending approval wastages
   */
  async getPendingApproval() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/pending-approval`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching pending approval wastages:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch pending approval wastages',
        data: []
      };
    }
  }

  /**
   * Approve a wastage record
   */
  async approve(wastageId, approvalData = {}) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Wastage record approved successfully'
      };
    } catch (error) {
      console.error('Error approving wastage record:', error);
      return {
        success: false,
        error: error.message || 'Failed to approve wastage record'
      };
    }
  }

  /**
   * Amend an approved wastage record
   * This endpoint handles inventory adjustment when quantity changes:
   * - If new quantity > old: reduces inventory by the difference
   * - If new quantity < old: restores inventory by the difference
   *
   * @param {number} wastageId - The wastage ID to amend
   * @param {Object} amendmentData - Amendment details
   * @param {number} amendmentData.quantity - New quantity (required)
   * @param {number} amendmentData.unitCost - New unit cost (optional)
   * @param {string} amendmentData.reason - Updated reason (optional)
   * @param {string} amendmentData.description - Updated description (optional)
   * @param {string} amendmentData.location - Updated location (optional)
   * @param {string} amendmentData.amendmentNotes - Explanation for amendment (required)
   */
  async amend(wastageId, amendmentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/amend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(amendmentData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Wastage record amended successfully'
      };
    } catch (error) {
      console.error('Error amending wastage record:', error);
      return {
        success: false,
        error: error.message || 'Failed to amend wastage record'
      };
    }
  }

  /**
   * Reject a wastage record
   */
  async reject(wastageId, rejectionData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Wastage record rejected successfully'
      };
    } catch (error) {
      console.error('Error rejecting wastage record:', error);
      return {
        success: false,
        error: error.message || 'Failed to reject wastage record'
      };
    }
  }

  /**
   * Get wastage analytics
   * @param {Object} params - Query parameters
   * @param {string} params.dateFrom - Start date (YYYY-MM-DD)
   * @param {string} params.dateTo - End date (YYYY-MM-DD)
   * @param {number} params.materialId - Optional material ID filter
   */
  async getAnalytics(params = {}) {
    try {
      // Build query string from params
      const queryParams = new URLSearchParams();
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
      if (params.dateTo) queryParams.append('dateTo', params.dateTo);
      if (params.materialId) queryParams.append('materialId', params.materialId);

      const queryString = queryParams.toString();
      const url = `${API_BASE_URL}/wastages/analytics/summary${queryString ? `?${queryString}` : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching wastage analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wastage analytics',
        data: null
      };
    }
  }

  /**
   * Get wastage by material
   */
  async getByMaterial(materialId, period = '30') {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/material/${materialId}?period=${period}`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching material wastages:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material wastages',
        data: []
      };
    }
  }

  /**
   * Get wastage types
   */
  async getTypes() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/types`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching wastage types:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wastage types',
        data: []
      };
    }
  }

  /**
   * Get wastage cost impact
   */
  async getCostImpact(wastageId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/cost-impact`);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching wastage cost impact:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch wastage cost impact',
        data: null
      };
    }
  }

  /**
   * Get monthly wastage trends
   */
  async getMonthlyTrends(months = 12) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/monthly-trends?months=${months}`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching monthly wastage trends:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch monthly wastage trends',
        data: []
      };
    }
  }
}

const wastageService = new WastageService();
export default wastageService;