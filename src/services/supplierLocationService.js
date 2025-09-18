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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier locations');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations?supplierId=${supplierId}&isActive=true`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier locations');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch supplier location');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create supplier location');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update supplier location');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete supplier location');
      }

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
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations/${locationId}/reactivate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate supplier location');
      }

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