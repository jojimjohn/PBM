/**
 * Material Service
 * Handles all material-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class MaterialService {
  /**
   * Get all materials for the current company
   */
  async getAll() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials`);
      return data;
    } catch (error) {
      console.error('Error fetching materials:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch materials',
        data: []
      };
    }
  }

  /**
   * Get a specific material by ID
   */
  async getById(materialId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}`);
      return data;
    } catch (error) {
      console.error('Error fetching material:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material',
        data: null
      };
    }
  }

  /**
   * Create a new material
   */
  async create(materialData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });
      return data;
    } catch (error) {
      console.error('Error creating material:', error);
      return {
        success: false,
        error: error.message || 'Failed to create material'
      };
    }
  }

  /**
   * Update an existing material
   */
  async update(materialId, materialData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });
      return data;
    } catch (error) {
      console.error('Error updating material:', error);
      return {
        success: false,
        error: error.message || 'Failed to update material'
      };
    }
  }

  /**
   * Delete a material
   */
  async delete(materialId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Error deleting material:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete material'
      };
    }
  }

  /**
   * Search materials by name, code, or type
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.type) params.append('type', filters.type);
      if (filters.category) params.append('category', filters.category);
      if (filters.status) params.append('status', filters.status);

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/search?${params.toString()}`);
      return data;
    } catch (error) {
      console.error('Error searching materials:', error);
      return {
        success: false,
        error: error.message || 'Failed to search materials',
        data: []
      };
    }
  }

  /**
   * Get materials by category
   */
  async getByCategory(category) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/category/${category}`);
      return data;
    } catch (error) {
      console.error('Error fetching materials by category:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch materials by category',
        data: []
      };
    }
  }

  /**
   * Get materials by type
   */
  async getByType(type) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/type/${type}`);
      return data;
    } catch (error) {
      console.error('Error fetching materials by type:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch materials by type',
        data: []
      };
    }
  }

  /**
   * Get material categories
   */
  async getCategories() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/categories`);
      return data;
    } catch (error) {
      console.error('Error fetching material categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material categories',
        data: []
      };
    }
  }

  /**
   * Get material types
   */
  async getTypes() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/types`);
      return data;
    } catch (error) {
      console.error('Error fetching material types:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material types',
        data: []
      };
    }
  }

  /**
   * Update material pricing
   */
  async updatePricing(materialId, pricingData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingData),
      });
      return data;
    } catch (error) {
      console.error('Error updating material pricing:', error);
      return {
        success: false,
        error: error.message || 'Failed to update material pricing'
      };
    }
  }

  /**
   * Get material price history
   */
  async getPriceHistory(materialId, period = '30') {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/materials/${materialId}/price-history?period=${period}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching material price history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material price history',
        data: []
      };
    }
  }

  /**
   * Update material status (active/inactive)
   */
  async updateStatus(materialId, isActive) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      return data;
    } catch (error) {
      console.error('Error updating material status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update material status'
      };
    }
  }

  /**
   * Get material categories for specializations
   */
  async getCategories(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/material-categories?${queryParams}`);
      return data;
    } catch (error) {
      console.error('Error fetching material categories:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material categories',
        data: []
      };
    }
  }

  /**
   * Get regions for collection areas
   */
  async getRegions(params = {}) {
    try {
      const queryParams = new URLSearchParams(params);
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/regions?${queryParams}`);
      return data;
    } catch (error) {
      console.error('Error fetching regions:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch regions',
        data: []
      };
    }
  }
}

const materialService = new MaterialService();
export default materialService;
