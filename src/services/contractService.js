/**
 * Contract Service
 * Handles all contract-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class ContractService {
  /**
   * Get all contracts for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contracts');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching contracts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch contracts',
        data: []
      };
    }
  }

  /**
   * Get a specific contract by ID
   */
  async getById(contractId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contract');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching contract:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch contract',
        data: null
      };
    }
  }

  /**
   * Create a new contract
   */
  async create(contractData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create contract');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Contract created successfully'
      };
    } catch (error) {
      console.error('Error creating contract:', error);
      return {
        success: false,
        error: error.message || 'Failed to create contract'
      };
    }
  }

  /**
   * Update an existing contract
   */
  async update(contractId, contractData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(contractData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contract');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Contract updated successfully'
      };
    } catch (error) {
      console.error('Error updating contract:', error);
      return {
        success: false,
        error: error.message || 'Failed to update contract'
      };
    }
  }

  /**
   * Delete a contract
   */
  async delete(contractId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete contract');
      }

      return {
        success: true,
        message: data.message || 'Contract deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting contract:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete contract'
      };
    }
  }

  /**
   * Search contracts
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.customerId) params.append('customerId', filters.customerId);
      if (filters.status) params.append('status', filters.status);
      if (filters.type) params.append('type', filters.type);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search contracts');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching contracts:', error);
      return {
        success: false,
        error: error.message || 'Failed to search contracts',
        data: []
      };
    }
  }

  /**
   * Get contracts by customer
   */
  async getByCustomer(customerId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/customer/${customerId}`);
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
   * Get active contracts
   */
  async getActive() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/active`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch active contracts');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching active contracts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch active contracts',
        data: []
      };
    }
  }

  /**
   * Get expiring contracts
   */
  async getExpiring(days = 30) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/expiring?days=${days}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch expiring contracts');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching expiring contracts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch expiring contracts',
        data: []
      };
    }
  }

  /**
   * Update contract status
   */
  async updateStatus(contractId, status) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contract status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Contract status updated successfully'
      };
    } catch (error) {
      console.error('Error updating contract status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update contract status'
      };
    }
  }

  /**
   * Renew a contract
   */
  async renew(contractId, renewalData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}/renew`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(renewalData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to renew contract');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Contract renewed successfully'
      };
    } catch (error) {
      console.error('Error renewing contract:', error);
      return {
        success: false,
        error: error.message || 'Failed to renew contract'
      };
    }
  }

  /**
   * Get contract pricing for material
   */
  async getPricing(contractId, materialId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}/pricing/${materialId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contract pricing');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching contract pricing:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch contract pricing',
        data: null
      };
    }
  }

  /**
   * Update contract pricing for material
   */
  async updatePricing(contractId, materialId, pricingData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}/pricing/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update contract pricing');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Contract pricing updated successfully'
      };
    } catch (error) {
      console.error('Error updating contract pricing:', error);
      return {
        success: false,
        error: error.message || 'Failed to update contract pricing'
      };
    }
  }

  /**
   * Get contract terms
   */
  async getTerms(contractId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}/terms`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contract terms');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching contract terms:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch contract terms',
        data: null
      };
    }
  }

  /**
   * Get contract performance metrics
   */
  async getPerformanceMetrics(contractId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/contracts/${contractId}/performance`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch contract performance');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching contract performance:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch contract performance',
        data: null
      };
    }
  }
}

const contractService = new ContractService();
export default contractService;