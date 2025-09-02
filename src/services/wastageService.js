/**
 * Wastage Service
 * Handles all wastage-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class WastageService {
  /**
   * Get all wastages for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wastages');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wastage');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wastageData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create wastage record');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(wastageData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update wastage record');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete wastage record');
      }

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

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search wastage records');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/pending-approval`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch pending approval wastages');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(approvalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to approve wastage record');
      }

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
   * Reject a wastage record
   */
  async reject(wastageId, rejectionData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(rejectionData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reject wastage record');
      }

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
   */
  async getAnalytics(period = '30') {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wastage analytics');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/material/${materialId}?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch material wastages');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/types`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wastage types');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/${wastageId}/cost-impact`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch wastage cost impact');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/wastages/monthly-trends?months=${months}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch monthly wastage trends');
      }

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