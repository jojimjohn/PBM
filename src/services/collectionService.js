import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Collection Callouts Service
export const calloutService = {
  // Get all callouts with filtering
  getCallouts: async (params = {}) => {
    const queryParams = new URLSearchParams(params);
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/callouts?${queryParams}`);
  },

  // Get specific callout with items
  getCallout: async (id) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/callouts/${id}`);
  },

  // Create new callout
  createCallout: async (calloutData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/callouts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(calloutData),
    });
  },

  // Add item to callout
  addCalloutItem: async (calloutId, itemData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/callouts/${calloutId}/items`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
  },

  // Update callout status
  updateCalloutStatus: async (id, statusData) => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/callouts/${id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(statusData),
    });
  },

  // Get active callouts summary
  getActiveCalloutsSummary: async () => {
    return await authService.makeAuthenticatedRequest(`${BASE_URL}/callouts/active/summary`);
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
      const response = await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations?supplierId=${supplierId}`);
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
        error: error.message,
        data: []
      };
    }
  },

  // Create new location (alias for createContractLocation)
  createLocation: async (locationData) => {
    try {
      const response = await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        let errorMessage = data.error || 'Failed to create location';
        if (data.details && Array.isArray(data.details)) {
          errorMessage += '\n' + data.details.map(d => `${d.field}: ${d.message}`).join('\n');
        }
        throw new Error(errorMessage);
      }

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
      const response = await authService.makeAuthenticatedRequest(`${BASE_URL}/contract-locations/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(locationData),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update location');
      }

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