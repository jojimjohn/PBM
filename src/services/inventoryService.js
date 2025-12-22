/**
 * Inventory Service
 * Handles all inventory-related API operations
 */

import authService from './authService';

import { API_BASE_URL } from '../config/api.js';

class InventoryService {
  /**
   * Transform backend inventory data to frontend format
   * Backend returns: id, materialId, batchNumber, quantity, reservedQuantity,
   * averageCost, lastPurchasePrice, lastPurchaseDate, location, condition, notes,
   * minimumStockLevel, maximumStockLevel, isActive, created_at, updated_at,
   * materialName, materialCode, category, unit, standardPrice, availableQuantity
   */
  transformInventoryItem(backendItem) {
    const quantity = parseFloat(backendItem.quantity || 0);
    const minStockLevel = parseFloat(backendItem.minimumStockLevel || 0);

    return {
      id: backendItem.id,
      materialId: backendItem.materialId,
      materialName: backendItem.materialName || backendItem.name,
      materialCode: backendItem.materialCode || backendItem.code,
      category: backendItem.category,
      batchNumber: backendItem.batchNumber,
      currentStock: quantity,
      quantity: quantity,
      reservedQuantity: parseFloat(backendItem.reservedQuantity || 0),
      availableQuantity: parseFloat(backendItem.availableQuantity || quantity),
      unit: backendItem.unit || 'KG',
      lowStockThreshold: minStockLevel,
      minimumStockLevel: minStockLevel,
      maximumStockLevel: parseFloat(backendItem.maximumStockLevel || 0),
      reorderQuantity: parseFloat(backendItem.reorder_quantity || 0),
      averageCost: parseFloat(backendItem.averageCost || 0),
      standardPrice: parseFloat(backendItem.standardPrice || 0),
      lastPurchasePrice: parseFloat(backendItem.lastPurchasePrice || 0),
      lastPurchaseDate: backendItem.lastPurchaseDate,
      totalValue: quantity * parseFloat(backendItem.averageCost || 0),
      lastUpdated: backendItem.updated_at,
      createdAt: backendItem.created_at,
      isActive: backendItem.isActive === 1 || backendItem.isActive === true,
      location: backendItem.location || 'Main Warehouse',
      condition: backendItem.condition || 'new',
      notes: backendItem.notes,
      status: quantity <= minStockLevel && minStockLevel > 0 ? 'low-stock' : 'in-stock'
    };
  }

  /**
   * Get all inventory items for the current company
   */
  async getAll() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory`);

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}`);

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/material/${materialId}`);

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      });

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inventoryData),
      });

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}`, {
        method: 'DELETE',
      });

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}/stock`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(stockData),
      });

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/opening-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          materialId,
          ...openingStockData
        }),
      });

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/material/${materialId}/stock`);

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/validate-stock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ items }),
      });

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/reduce-stock`, {
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/add-stock`, {
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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/low-stock`);

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/value-summary`);

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

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/inventory/${inventoryId}/movements?${params.toString()}`
      );

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

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/search?${params.toString()}`);

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
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/analytics?period=${period}`);

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
   * Adjust inventory stock quantity using the backend adjust endpoint
   * This is the correct method to use for stock adjustments
   * @param {number} inventoryId - Inventory record ID
   * @param {Object} adjustmentData - { adjustmentType: 'increase'|'decrease'|'set', quantity, reason, notes }
   */
  async adjustStock(inventoryId, adjustmentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/inventory/${inventoryId}/adjust`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(adjustmentData),
        }
      );

      return {
        success: true,
        data: data.data,
        message: data.message || 'Stock adjusted successfully'
      };
    } catch (error) {
      console.error('Error adjusting stock:', error);
      return {
        success: false,
        error: error.message || 'Failed to adjust stock'
      };
    }
  }

  /**
   * Update reorder levels for material
   */
  async updateReorderLevels(inventoryId, reorderData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/inventory/${inventoryId}/reorder-levels`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reorderData),
      });

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

  /**
   * Get composite material receipts with component breakdown
   * Returns receipts showing how composite materials were split into components
   * @param {number} materialId - The composite material ID
   * @returns {Promise<{success: boolean, data: Object}>}
   */
  async getCompositeReceipts(materialId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/inventory/composite-receipts/${materialId}`
      );

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching composite receipts:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch composite receipts',
        data: null
      };
    }
  }

  /**
   * Get stock movements timeline with filtering and pagination
   * @param {Object} filters - Filter options
   * @param {string} filters.startDate - Start date (YYYY-MM-DD)
   * @param {string} filters.endDate - End date (YYYY-MM-DD)
   * @param {number} filters.materialId - Filter by material
   * @param {string} filters.type - Movement type: 'receipt', 'sale', 'adjustment', 'wastage', 'transfer'
   * @param {number} filters.page - Page number (default 1)
   * @param {number} filters.limit - Items per page (default 50)
   * @returns {Promise<{success: boolean, data: {movements: Array, pagination: Object}}>}
   */
  async getStockMovements(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.materialId) params.append('materialId', filters.materialId);
      if (filters.type) params.append('type', filters.type);
      if (filters.batchId) params.append('batchId', filters.batchId);
      if (filters.page) params.append('page', filters.page);
      if (filters.limit) params.append('limit', filters.limit);

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/inventory/movements?${params.toString()}`
      );

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching stock movements:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch stock movements',
        data: { movements: [], groupedByDate: {}, pagination: { page: 1, limit: 50, total: 0, hasMore: false } }
      };
    }
  }
}

/**
 * Calculate stock status based on quantity and reorder level
 * @param {number} quantity - Current stock quantity
 * @param {number} reorderLevel - Reorder level threshold
 * @returns {string} Status: 'good', 'low', 'critical', 'out-of-stock'
 */
export function calculateStockStatus(quantity, reorderLevel) {
  if (quantity === 0 || quantity <= 0) return 'out-of-stock';
  if (reorderLevel <= 0) return 'good'; // No reorder level set, assume good
  if (quantity <= reorderLevel * 0.5) return 'critical';
  if (quantity <= reorderLevel) return 'low';
  return 'good';
}

/**
 * Stock status configuration with labels and colors
 * Used for consistent status display across the application
 */
export const stockStatusConfig = {
  'good': {
    label: 'Good Stock',
    labelAr: 'مخزون جيد',
    color: '#059669',
    bgColor: '#d1fae5',
    icon: 'check-circle'
  },
  'low': {
    label: 'Low Stock',
    labelAr: 'مخزون منخفض',
    color: '#d97706',
    bgColor: '#fef3c7',
    icon: 'alert-triangle'
  },
  'critical': {
    label: 'Critical',
    labelAr: 'حرج',
    color: '#ea580c',
    bgColor: '#fed7aa',
    icon: 'alert-circle'
  },
  'out-of-stock': {
    label: 'Out of Stock',
    labelAr: 'نفذ من المخزون',
    color: '#dc2626',
    bgColor: '#fee2e2',
    icon: 'x-circle'
  }
};

const inventoryService = new InventoryService();
export default inventoryService;
