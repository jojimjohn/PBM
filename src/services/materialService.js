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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch materials');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch material');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create material');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Material created successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(materialData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update material');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Material updated successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete material');
      }

      return {
        success: true,
        message: data.message || 'Material deleted successfully'
      };
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

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search materials');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/category/${category}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch materials by category');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/type/${type}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch materials by type');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/categories`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch material categories');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/types`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch material types');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}/pricing`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(pricingData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update material pricing');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Material pricing updated successfully'
      };
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
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/materials/${materialId}/price-history?period=${period}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch material price history');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/${materialId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update material status');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Material status updated successfully'
      };
    } catch (error) {
      console.error('Error updating material status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update material status'
      };
    }
  }
}

const materialService = new MaterialService();
export default materialService;