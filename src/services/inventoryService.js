/**
 * Inventory Service
 * Handles all inventory-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class InventoryService {
  /**
   * Transform backend inventory data to frontend format
   */
  transformInventoryItem(backendItem) {
    return {
      id: backendItem.id,
      materialId: backendItem.material_id,
      materialName: backendItem.material_name || backendItem.name,
      currentStock: parseFloat(backendItem.current_stock || 0),
      unit: backendItem.unit || 'liters',
      lowStockThreshold: parseFloat(backendItem.low_stock_threshold || 0),
      reorderQuantity: parseFloat(backendItem.reorder_quantity || 0),
      averageCost: parseFloat(backendItem.average_cost || 0),
      totalValue: parseFloat(backendItem.total_value || 0),
      lastUpdated: backendItem.updated_at,
      createdAt: backendItem.created_at,
      isActive: backendItem.is_active === 1,
      // Add additional fields that frontend expects
      openingStock: parseFloat(backendItem.opening_stock || 0),
      location: backendItem.location || 'Main Warehouse',
      status: backendItem.current_stock <= backendItem.low_stock_threshold ? 'low-stock' : 'in-stock'
    };
  }

  /**
   * Get all inventory items for the current company
   */
  async getAll() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory');
      }

      // Transform backend data to frontend format
      const transformedInventory = (data.data || []).map(item => 
        this.transformInventoryItem(item)
      );

      return {
        success: true,
        data: transformedInventory,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching inventory:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory',
        data: []
      };
    }
  }

  /**
   * Get a specific inventory item by ID
   */
  async getById(inventoryId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory item');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching inventory item:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory item',
        data: null
      };
    }
  }

  /**
   * Get inventory item by material ID
   */
  async getByMaterial(materialId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/material/${materialId}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch material inventory');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching material inventory:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch material inventory',
        data: null
      };
    }
  }

  /**
   * Create a new inventory item
   */
  async create(inventoryData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create inventory item');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Inventory item created successfully'
      };
    } catch (error) {
      console.error('Error creating inventory item:', error);
      return {
        success: false,
        error: error.message || 'Failed to create inventory item'
      };
    }
  }

  /**
   * Update an existing inventory item
   */
  async update(inventoryId, inventoryData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update inventory item');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Inventory item updated successfully'
      };
    } catch (error) {
      console.error('Error updating inventory item:', error);
      return {
        success: false,
        error: error.message || 'Failed to update inventory item'
      };
    }
  }

  /**
   * Delete an inventory item
   */
  async delete(inventoryId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete inventory item');
      }

      return {
        success: true,
        message: data.message || 'Inventory item deleted successfully'
      };
    } catch (error) {
      console.error('Error deleting inventory item:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete inventory item'
      };
    }
  }

  /**
   * Update stock quantity
   */
  async updateStock(inventoryId, stockData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update stock');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Stock updated successfully'
      };
    } catch (error) {
      console.error('Error updating stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to update stock'
      };
    }
  }

  /**
   * Set opening stock for material
   */
  async setOpeningStock(materialId, openingStockData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/opening-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId,
          ...openingStockData
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to set opening stock');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Opening stock set successfully'
      };
    } catch (error) {
      console.error('Error setting opening stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to set opening stock'
      };
    }
  }

  /**
   * Get current stock for a specific material
   */
  async getCurrentStock(materialId) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/material/${materialId}/stock`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch current stock');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching current stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch current stock',
        data: null
      };
    }
  }

  /**
   * Validate stock availability for sales order
   */
  async validateStockAvailability(items) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/validate-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to validate stock availability');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error validating stock availability:', error);
      return {
        success: false,
        error: error.message || 'Failed to validate stock availability',
        data: { isValid: false, insufficientItems: [] }
      };
    }
  }

  /**
   * Reduce stock for sales order
   */
  async reduceStock(items, referenceId, referenceType = 'sales_order') {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/reduce-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          referenceId,
          referenceType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reduce stock');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Stock reduced successfully'
      };
    } catch (error) {
      console.error('Error reducing stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to reduce stock'
      };
    }
  }

  /**
   * Add stock for purchase order
   */
  async addStock(items, referenceId, referenceType = 'purchase_order') {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/add-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          items,
          referenceId,
          referenceType
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to add stock');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Stock added successfully'
      };
    } catch (error) {
      console.error('Error adding stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to add stock'
      };
    }
  }

  /**
   * Get low stock items
   */
  async getLowStockItems() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/low-stock`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch low stock items');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching low stock items:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch low stock items',
        data: []
      };
    }
  }

  /**
   * Get inventory value summary
   */
  async getInventoryValue() {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/value-summary`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory value');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching inventory value:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory value',
        data: { totalValue: 0, itemCount: 0, totalUnits: 0 }
      };
    }
  }

  /**
   * Get inventory movements/transactions
   */
  async getMovements(inventoryId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.type) params.append('type', options.type);
      if (options.limit) params.append('limit', options.limit);

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/inventory/${inventoryId}/movements?${params.toString()}`
      );
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory movements');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching inventory movements:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory movements',
        data: []
      };
    }
  }

  /**
   * Search inventory items
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.materialId) params.append('materialId', filters.materialId);
      if (filters.lowStock) params.append('lowStock', filters.lowStock);
      if (filters.status) params.append('status', filters.status);

      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/search?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to search inventory');
      }

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error searching inventory:', error);
      return {
        success: false,
        error: error.message || 'Failed to search inventory',
        data: []
      };
    }
  }

  /**
   * Get inventory analytics
   */
  async getAnalytics(period = '30') {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/analytics?period=${period}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch inventory analytics');
      }

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching inventory analytics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch inventory analytics',
        data: null
      };
    }
  }

  /**
   * Update reorder levels for material
   */
  async updateReorderLevels(inventoryId, reorderData) {
    try {
      const response = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}/reorder-levels`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update reorder levels');
      }

      return {
        success: true,
        data: data.data,
        message: data.message || 'Reorder levels updated successfully'
      };
    } catch (error) {
      console.error('Error updating reorder levels:', error);
      return {
        success: false,
        error: error.message || 'Failed to update reorder levels'
      };
    }
  }
}

const inventoryService = new InventoryService();
export default inventoryService;