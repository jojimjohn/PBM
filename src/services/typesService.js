import authService from './authService'
import { API_BASE_URL } from '../config/api.js'

const typesService = {
  /**
   * Get all customer types
   * @returns {Promise<Object>} Response with customer types array
   */
  async getCustomerTypes() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/customer-types`)
      return data
    } catch (error) {
      console.error('Error fetching customer types:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch customer types'
      }
    }
  },

  /**
   * Get all supplier types
   * @returns {Promise<Object>} Response with supplier types array
   */
  async getSupplierTypes() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-types`)
      return data
    } catch (error) {
      console.error('Error fetching supplier types:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch supplier types'
      }
    }
  }
}

export default typesService
