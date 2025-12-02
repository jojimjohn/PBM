import authService from './authService'
import { API_BASE_URL } from '../config/api'

const branchService = {
  /**
   * Get all branches for the company
   * @param {Object} params - Query parameters (page, limit, is_active, region_id, search)
   * @returns {Promise<Object>} Response with branches array and pagination
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams()

      if (params.page) queryParams.append('page', params.page)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active)
      if (params.region_id) queryParams.append('region_id', params.region_id)
      if (params.search) queryParams.append('search', params.search)

      const url = `${API_BASE_URL}/branches?${queryParams.toString()}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error('Error fetching branches:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch branches'
      }
    }
  },

  /**
   * Get a specific branch by ID
   * @param {number} branchId - Branch ID
   * @returns {Promise<Object>} Response with branch data
   */
  async getById(branchId) {
    try {
      const url = `${API_BASE_URL}/branches/${branchId}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error(`Error fetching branch ${branchId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch branch'
      }
    }
  },

  /**
   * Get only active branches (for dropdowns)
   * @returns {Promise<Object>} Response with active branches array
   */
  async getActive() {
    try {
      const response = await this.getAll({ is_active: true, limit: 100 })
      return response
    } catch (error) {
      console.error('Error fetching active branches:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch active branches'
      }
    }
  },

  /**
   * Create a new branch
   * @param {Object} branchData - Branch data
   * @returns {Promise<Object>} Response with created branch
   */
  async create(branchData) {
    try {
      const url = `${API_BASE_URL}/branches`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(branchData)
      })
      return data
    } catch (error) {
      console.error('Error creating branch:', error)
      return {
        success: false,
        error: error.message || 'Failed to create branch'
      }
    }
  },

  /**
   * Update an existing branch
   * @param {number} branchId - Branch ID
   * @param {Object} branchData - Updated branch data
   * @returns {Promise<Object>} Response with updated branch
   */
  async update(branchId, branchData) {
    try {
      const url = `${API_BASE_URL}/branches/${branchId}`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(branchData)
      })
      return data
    } catch (error) {
      console.error(`Error updating branch ${branchId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to update branch'
      }
    }
  },

  /**
   * Delete a branch (soft delete if has orders, hard delete otherwise)
   * @param {number} branchId - Branch ID
   * @returns {Promise<Object>} Response
   */
  async delete(branchId) {
    try {
      const url = `${API_BASE_URL}/branches/${branchId}`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'DELETE'
      })
      return data
    } catch (error) {
      console.error(`Error deleting branch ${branchId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to delete branch'
      }
    }
  }
}

export default branchService
