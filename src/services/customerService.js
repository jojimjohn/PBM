/**
 * Customer Service
 * Handles all customer-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class CustomerService {
  /**
   * Transform backend customer data to frontend format
   */
  transformCustomer(backendCustomer) {
    // Parse address components from the combined string
    const addressParts = this.parseAddress(backendCustomer.address || '');

    return {
      id: backendCustomer.id,
      code: `AR-CUST-${String(backendCustomer.id).padStart(3, '0')}`, // Generate code from ID
      name: backendCustomer.name,
      type: this.mapCustomerType(backendCustomer.customerType),
      contactPerson: backendCustomer.contactPerson,
      contact: {
        phone: backendCustomer.phone,
        email: backendCustomer.email,
        vatRegistrationNumber: backendCustomer.vatRegistration,
        address: {
          street: addressParts.street,
          city: addressParts.city,
          region: addressParts.region,
          country: 'Oman'
        }
      },
      creditLimit: parseFloat(backendCustomer.creditLimit || 0),
      paymentTerms: backendCustomer.paymentTermDays || 0,
      is_taxable: backendCustomer.is_taxable !== 0, // Convert MySQL TINYINT to boolean
      isActive: backendCustomer.isActive === 1,
      createdAt: backendCustomer.created_at,
      lastUpdated: backendCustomer.updated_at,
      salesHistory: {
        totalOrders: 0, // Will be populated from sales data later
        totalValue: 0,
        lastOrderDate: null
      },
      contractDetails: null // Will be populated if customer has contracts
    };
  }

  /**
   * Map backend customer types to frontend types
   * Standard types: individual, business, project, contract
   * Handles legacy values for backwards compatibility
   */
  mapCustomerType(backendType) {
    // Map legacy values to new standardized values
    const legacyMapping = {
      'walk-in': 'individual',
      'walk_in': 'individual',
      'project-based': 'project'
    };

    // Return mapped value if legacy, otherwise return as-is
    // Valid values: 'individual', 'business', 'project', 'contract'
    return legacyMapping[backendType] || backendType || 'individual';
  }

  /**
   * Parse address string into components (street, city, region)
   *
   * Backend stores address as a combined comma-separated string:
   * - Format: "Street, City, Region" or "Street, City" or just "Street"
   *
   * Examples:
   * - "123 Main St, Muscat, North" → { street: "123 Main St", city: "Muscat", region: "North" }
   * - "456 Side Rd, Sohar" → { street: "456 Side Rd", city: "Sohar", region: "" }
   * - "789 Only Street" → { street: "789 Only Street", city: "", region: "" }
   */
  parseAddress(address) {
    if (!address || typeof address !== 'string') {
      return { street: '', city: '', region: '' };
    }

    const parts = address.split(',').map(part => part.trim()).filter(part => part);

    if (parts.length === 0) {
      return { street: '', city: '', region: '' };
    }

    if (parts.length === 1) {
      // Only street
      return { street: parts[0], city: '', region: '' };
    }

    if (parts.length === 2) {
      // Street and city
      return { street: parts[0], city: parts[1], region: '' };
    }

    // 3 or more parts: first part is street, second-to-last is city, last is region
    // If more than 3 parts, combine everything except last 2 into street
    if (parts.length === 3) {
      return { street: parts[0], city: parts[1], region: parts[2] };
    }

    // More than 3 parts: combine all but last 2 into street
    const street = parts.slice(0, -2).join(', ');
    const city = parts[parts.length - 2];
    const region = parts[parts.length - 1];

    return { street, city, region };
  }

  /**
   * Extract city from address string (kept for backward compatibility)
   */
  extractCity(address) {
    return this.parseAddress(address).city;
  }

  /**
   * Extract region from address string (kept for backward compatibility)
   */
  extractRegion(address) {
    return this.parseAddress(address).region;
  }

  /**
   * Get all customers for the current company
   */
  async getAll() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers`);

      // Transform backend data to frontend format
      const transformedCustomers = (data.data || []).map(customer =>
        this.transformCustomer(customer)
      );

      return {
        success: true,
        data: transformedCustomers,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching customers:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customers',
        data: []
      };
    }
  }

  /**
   * Get a specific customer by ID
   */
  async getById(customerId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}`);
      return data;
    } catch (error) {
      console.error('Error fetching customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer',
        data: null
      };
    }
  }

  /**
   * Create a new customer
   */
  async create(customerData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      return data;
    } catch (error) {
      console.error('Error creating customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to create customer'
      };
    }
  }

  /**
   * Update an existing customer
   */
  async update(customerId, customerData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(customerData),
      });
      return data;
    } catch (error) {
      console.error('Error updating customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to update customer'
      };
    }
  }

  /**
   * Delete a customer
   */
  async delete(customerId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}`, {
        method: 'DELETE',
      });
      return data;
    } catch (error) {
      console.error('Error deleting customer:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete customer'
      };
    }
  }

  /**
   * Search customers by name, code, or contact
   */
  async search(query, filters = {}) {
    try {
      const params = new URLSearchParams();
      if (query) params.append('q', query);
      if (filters.type) params.append('type', filters.type);
      if (filters.status) params.append('status', filters.status);

      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/search?${params.toString()}`);
      return data;
    } catch (error) {
      console.error('Error searching customers:', error);
      return {
        success: false,
        error: error.message || 'Failed to search customers',
        data: []
      };
    }
  }

  /**
   * Get customer contracts
   */
  async getContracts(customerId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}/contracts`);
      return data;
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
   * Get customer sales history
   */
  async getSalesHistory(customerId, options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.startDate) params.append('startDate', options.startDate);
      if (options.endDate) params.append('endDate', options.endDate);
      if (options.limit) params.append('limit', options.limit);

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/customers/${customerId}/sales-history?${params.toString()}`
      );
      return data;
    } catch (error) {
      console.error('Error fetching customer sales history:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch customer sales history',
        data: []
      };
    }
  }

  /**
   * Update customer status (activate/deactivate)
   */
  async updateStatus(customerId, isActive) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customers/${customerId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      return data;
    } catch (error) {
      console.error('Error updating customer status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update customer status'
      };
    }
  }
}

const customerService = new CustomerService();
export default customerService;