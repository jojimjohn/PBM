import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Collection Callouts Service (now using collection-orders endpoints)
export const calloutService = {
  // Get all callouts with filtering
  getCallouts: async (params = {}) => {
    try {
      // Filter out undefined values before creating URLSearchParams
      const filteredParams = Object.entries(params).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          acc[key] = value;
        }
        return acc;
      }, {});

      const queryParams = new URLSearchParams(filteredParams);
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/callouts?${queryParams}`);

      return { success: true, data: data.data || [], pagination: data.pagination };
    } catch (error) {
      return { success: false, error: error.message || 'Network error', data: [] };
    }
  },

  // Get specific callout with items
  getCallout: async (id) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}`);
  },

  // Create new callout
  createCallout: async (calloutData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/callouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calloutData),
      });

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  // Add item to callout (now adds to collection_items)
  addCalloutItem: async (calloutId, itemData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${calloutId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
  },

  // Update callout
  updateCallout: async (id, calloutData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(calloutData),
      });

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  // Delete callout
  deleteCallout: async (id) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}`, {
        method: 'DELETE',
      });

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  // Update callout status
  updateCalloutStatus: async (id, statusData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}/status`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });
  },

  /**
   * Get materials available for a specific contract and location
   * Returns unselected materials (no pre-selection) for dynamic material selection
   * @param {number} contractId - Contract ID
   * @param {number} locationId - Supplier location ID
   * @returns {Promise} Materials array with constraints
   */
  getContractMaterials: async (contractId, locationId) => {
    return await authService.makeAuthenticatedRequest(
      `${BASE_URL}/contracts/${contractId}/locations/${locationId}/materials`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  },

  // Update driver details for collection order
  updateDriverDetails: async (id, driverData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}/driver`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(driverData),
      });

      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message || 'Network error' };
    }
  },

  // Get active callouts summary
  getActiveCalloutsSummary: async () => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/callouts/summary`);
  }
};

// Collection Orders Service
export const collectionOrderService = {
  // Get all collection orders with filtering
  getCollectionOrders: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders?${queryParams}`);
  },

  // Get specific collection order
  getCollectionOrder: async (id) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}`);
  },

  // Create new collection order from callout
  createCollectionOrder: async (orderData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
  },

  // Add collected item
  addCollectedItem: async (orderId, itemData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${orderId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
  },

  // Add collection expense
  addCollectionExpense: async (orderId, expenseData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${orderId}/expenses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(expenseData),
    });
  },

  // Complete collection order
  completeCollectionOrder: async (id, completionData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${id}/complete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completionData),
    });
  },

  // Get collection order expenses
  getCollectionOrderExpenses: async (orderId) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${orderId}/expenses`);
  },

  // Update collection order status
  updateCollectionOrderStatus: async (orderId, status) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${orderId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status }),
    });
  },

  // Delete collection order
  deleteCollectionOrder: async (orderId) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${orderId}`, {
      method: 'DELETE',
    });
  },

  // Update collection order
  updateCollectionOrder: async (orderId, orderData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/collection-orders/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orderData),
    });
  },

  // ===== WCN (Waste Consignment Note) Methods - Sprint 4.5 =====

  // Finalize WCN and auto-generate PO
  finalizeWCN: async (collectionOrderId, wcnData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/collection-orders/${collectionOrderId}/finalize-wcn`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(wcnData),
        }
      );

      return {
        success: true,
        data: data.data,
        message: data.message || 'WCN finalized successfully',
      };
    } catch (error) {
      console.error('Error finalizing WCN:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  },

  // Rectify WCN (post-finalization quantity adjustments)
  rectifyWCN: async (collectionOrderId, rectificationData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/collection-orders/${collectionOrderId}/rectify-wcn`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(rectificationData),
        }
      );

      return {
        success: true,
        data: data.data,
        message: data.message || 'WCN rectified successfully',
      };
    } catch (error) {
      console.error('Error rectifying WCN:', error);
      return {
        success: false,
        error: error.message || 'Network error',
      };
    }
  }
};

// Contract Locations Service
export const contractLocationService = {
  // Get contract locations
  getContractLocations: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations?${queryParams}`);
  },

  // Get specific contract location with rates
  getContractLocation: async (id) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations/${id}`);
  },

  // Create new contract location
  createContractLocation: async (locationData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });
  },

  // Update contract location
  updateContractLocation: async (id, locationData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(locationData),
    });
  },

  // Add rate to location
  addLocationRate: async (locationId, rateData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations/${locationId}/rates`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(rateData),
    });
  },

  // Get specific location rate for material
  getLocationRate: async (locationId, materialId) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations/${locationId}/rates/${materialId}`);
  },

  // Get locations by supplier (for contract form)
  getBySupplier: async (supplierId) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations?supplierId=${supplierId}`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching supplier locations:', error);
      return {
        success: false,
        error: error.message,
        data: []
      };
    }
  },

  // Create new location (alias for createContractLocation)
  createLocation: async (locationData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error creating location:', error);
      return {
        success: false,
        error: error.message
      };
    }
  },

  // Update location (alias for updateContractLocation)
  updateLocation: async (id, locationData) => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error updating location:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
};

// Supplier Contracts Service (enhanced)
export const supplierContractService = {
  // Get supplier contract rates
  getSupplierRates: async (supplierId) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/supplier-contracts/${supplierId}/rates`);
  },

  // Get specific material rate from supplier
  getMaterialRate: async (supplierId, materialId) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/supplier-contracts/${supplierId}/materials/${materialId}/rate`);
  }
};

// Utility functions for collections
export const collectionUtils = {
  // Format collection status for display
  formatStatus: (status) => {
    const statusMap = {
      'pending': { text: 'Pending', color: 'orange', icon: '⏳' },
      'scheduled': { text: 'Scheduled', color: 'blue', icon: '📅' },
      'in_progress': { text: 'In Progress', color: 'purple', icon: '🚛' },
      'collecting': { text: 'Collecting', color: 'yellow', icon: '📦' },
      'in_transit': { text: 'In Transit', color: 'indigo', icon: '🚚' },
      'completed': { text: 'Completed', color: 'green', icon: '✅' },
      'cancelled': { text: 'Cancelled', color: 'red', icon: '❌' },
      'failed': { text: 'Failed', color: 'red', icon: '⚠️' }
    };
    return statusMap[status] || { text: status, color: 'gray', icon: '❓' };
  },

  // Format priority for display
  formatPriority: (priority) => {
    const priorityMap = {
      'low': { text: 'Low', color: 'green', icon: '📗' },
      'normal': { text: 'Normal', color: 'blue', icon: '📘' },
      'high': { text: 'High', color: 'orange', icon: '📙' },
      'urgent': { text: 'Urgent', color: 'red', icon: '📕' }
    };
    return priorityMap[priority] || { text: priority, color: 'gray', icon: '📄' };
  },

  // Calculate collection value
  calculateCollectionValue: (items) => {
    return items.reduce((total, item) => total + (item.totalValue || 0), 0);
  },

  // Calculate collection expenses
  calculateCollectionExpenses: (expenses) => {
    return expenses.reduce((total, expense) => total + (expense.amount || 0), 0);
  },

  // Get expense category info
  getExpenseCategoryInfo: (category) => {
    const categories = {
      'fuel': { text: 'Fuel', icon: '⛽', color: 'blue' },
      'transportation': { text: 'Transportation', icon: '🚛', color: 'green' },
      'loading_unloading': { text: 'Loading/Unloading', icon: '📦', color: 'orange' },
      'permits_fees': { text: 'Permits & Fees', icon: '📄', color: 'purple' },
      'equipment_rental': { text: 'Equipment Rental', icon: '🔧', color: 'indigo' },
      'meals_accommodation': { text: 'Meals & Accommodation', icon: '🍽️', color: 'pink' },
      'maintenance': { text: 'Maintenance', icon: '🔨', color: 'yellow' },
      'other': { text: 'Other', icon: '💼', color: 'gray' }
    };
    return categories[category] || { text: category, icon: '💰', color: 'gray' };
  },

  // Format currency
  formatCurrency: (amount, currency = 'OMR') => {
    return new Intl.NumberFormat('en-OM', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 3
    }).format(amount);
  },

  // Format weight/quantity
  formatQuantity: (quantity, unit) => {
    const formattedQuantity = new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 3
    }).format(quantity);
    return `${formattedQuantity} ${unit}`;
  },

  // Get quality grade info
  getQualityGradeInfo: (grade) => {
    const grades = {
      'A': { text: 'Grade A', color: 'green', icon: '⭐⭐⭐' },
      'B': { text: 'Grade B', color: 'blue', icon: '⭐⭐' },
      'C': { text: 'Grade C', color: 'orange', icon: '⭐' },
      'Reject': { text: 'Reject', color: 'red', icon: '❌' }
    };
    return grades[grade] || { text: grade, color: 'gray', icon: '❓' };
  },

  // Get condition info
  getConditionInfo: (condition) => {
    const conditions = {
      'excellent': { text: 'Excellent', color: 'green', icon: '💎' },
      'good': { text: 'Good', color: 'blue', icon: '✅' },
      'fair': { text: 'Fair', color: 'orange', icon: '⚠️' },
      'poor': { text: 'Poor', color: 'red', icon: '❌' },
      'mixed': { text: 'Mixed', color: 'purple', icon: '🔀' }
    };
    return conditions[condition] || { text: condition, color: 'gray', icon: '❓' };
  }
};

export default {
  calloutService,
  collectionOrderService,
  contractLocationService,
  supplierContractService,
  collectionUtils
};