import authService from './authService'
import { API_BASE_URL } from '../config/api'

const userService = {
  /**
   * Get all active users for the company
   * @returns {Promise<Object>} Response with users array
   */
  async getAll() {
    try {
      const url = `${API_BASE_URL}/users`
      const data = await authService.makeAuthenticatedRequest(url)
      return response
    } catch (error) {
      console.error('Error fetching users:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch users'
      }
    }
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Response with user object
   */
  async getById(userId) {
    try {
      const url = `${API_BASE_URL}/users/${userId}`
      const data = await authService.makeAuthenticatedRequest(url)
      return response
    } catch (error) {
      console.error(`Error fetching user ${userId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch user'
      }
    }
  }
}

export default userService
