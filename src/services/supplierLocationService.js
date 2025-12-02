/**
 * Supplier Location Service
 * Handles all supplier location-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class SupplierLocationService {
  /**
   * Get all supplier locations
   */
  async getAll() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier locations:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier locations',
        data: []
      };
    }
  }

  /**
   * Get supplier locations by supplier ID
   */
  async getBySupplier(supplierId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations?supplierId=${supplierId}&isActive=true`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier locations:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier locations',
        data: []
      };
    }
  }

  /**
   * Get a specific supplier location by ID
   */
  async getById(locationId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}`);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier location:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier location',
        data: null
      };
    }
  }

  /**
   * Create a new supplier location
   */
  async create(locationData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Supplier location created successfully'
      };
    } catch (error) {
      console.error('Error creating supplier location:', error);
      return {
        success: false,
        error: error.message || 'Failed to create supplier location'
      };
    }
  }

  /**
   * Update an existing supplier location
   */
  async update(locationId, locationData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Supplier location updated successfully'
      };
    } catch (error) {
      console.error('Error updating supplier location:', error);
      return {
        success: false,
        error: error.message || 'Failed to update supplier location'
      };
    }
  }

  /**
   * Delete a supplier location
   */
  async delete(locationId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        message: data.message || 'Supplier location deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting supplier location:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete supplier location'
      };
    }
  }

  /**
   * Reactivate a supplier location
   */
  async reactivate(locationId, locationData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Supplier location reactivated successfully'
      };
    } catch (error) {
      console.error('Error reactivating supplier location:', error);
      return {
        success: false,
        error: error.message || 'Failed to reactivate supplier location'
      };
    }
  }
}

const supplierLocationService = new SupplierLocationService();
export default supplierLocationService;