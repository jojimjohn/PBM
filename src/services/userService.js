/**
 * User Management Service (Task 47)
 *
 * Provides API abstraction for user management operations:
 * - User CRUD operations
 * - Password management
 * - Session management
 * - Permission overrides
 */

import authService from './authService'
import { API_BASE_URL } from '../config/api'

const userService = {
  /**
   * Get all users with optional filtering
   * @param {Object} filters - Optional filters (role, isActive, search)
   * @returns {Promise<Object>} { success, data, meta }
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (filters.role) params.append('role', filters.role)
      if (typeof filters.isActive !== 'undefined') params.append('isActive', filters.isActive)
      if (filters.search) params.append('search', filters.search)

      const queryString = params.toString()
      const url = `${API_BASE_URL}/users${queryString ? `?${queryString}` : ''}`

      const result = await authService.makeAuthenticatedRequest(url, {
        method: 'GET'
      })

      return result
    } catch (error) {
      console.error('Error fetching users:', error)
      throw error
    }
  },

  /**
   * Get user by ID
   * @param {number} userId - User ID
   * @returns {Promise<Object>} { success, data }
   */
  async getById(userId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}`,
        { method: 'GET' }
      )
      return result
    } catch (error) {
      console.error('Error fetching user:', error)
      throw error
    }
  },

  /**
   * Create a new user
   * @param {Object} userData - User data { email, firstName, lastName, role, sendWelcomeEmail }
   * @returns {Promise<Object>} { success, data, message }
   */
  async create(userData) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users`,
        {
          method: 'POST',
          body: JSON.stringify(userData)
        }
      )
      return result
    } catch (error) {
      console.error('Error creating user:', error)
      throw error
    }
  },

  /**
   * Update user details
   * @param {number} userId - User ID
   * @param {Object} userData - Update data { firstName, lastName, role, isActive }
   * @returns {Promise<Object>} { success, message }
   */
  async update(userId, userData) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify(userData)
        }
      )
      return result
    } catch (error) {
      console.error('Error updating user:', error)
      throw error
    }
  },

  /**
   * Deactivate user (soft delete)
   * @param {number} userId - User ID
   * @returns {Promise<Object>} { success, message }
   */
  async deactivate(userId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}`,
        { method: 'DELETE' }
      )
      return result
    } catch (error) {
      console.error('Error deactivating user:', error)
      throw error
    }
  },

  /**
   * Reset user password (admin-initiated)
   * @param {number} userId - User ID
   * @param {Object} options - { sendEmail: boolean }
   * @returns {Promise<Object>} { success, data: { emailSent, tempPassword? } }
   */
  async resetPassword(userId, options = { sendEmail: true }) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}/reset-password`,
        {
          method: 'POST',
          body: JSON.stringify(options)
        }
      )
      return result
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  },

  /**
   * Force logout user from all sessions
   * @param {number} userId - User ID
   * @returns {Promise<Object>} { success, data: { invalidatedSessions } }
   */
  async forceLogout(userId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}/force-logout`,
        { method: 'POST' }
      )
      return result
    } catch (error) {
      console.error('Error forcing logout:', error)
      throw error
    }
  },

  /**
   * Get user permissions with overrides
   * @param {number} userId - User ID
   * @returns {Promise<Object>} { success, data: { userId, role, permissions, overrideCount } }
   */
  async getPermissions(userId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}/permissions`,
        { method: 'GET' }
      )
      return result
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  },

  /**
   * Set permission override for user
   * @param {number} userId - User ID
   * @param {Object} override - { permission, granted, reason }
   * @returns {Promise<Object>} { success, message }
   */
  async setPermissionOverride(userId, override) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}/permissions`,
        {
          method: 'POST',
          body: JSON.stringify(override)
        }
      )
      return result
    } catch (error) {
      console.error('Error setting permission override:', error)
      throw error
    }
  },

  /**
   * Remove permission override (revert to role default)
   * @param {number} userId - User ID
   * @param {string} permission - Permission key
   * @returns {Promise<Object>} { success, message }
   */
  async removePermissionOverride(userId, permission) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}/permissions/${permission}`,
        { method: 'DELETE' }
      )
      return result
    } catch (error) {
      console.error('Error removing permission override:', error)
      throw error
    }
  },

  /**
   * Reactivate a deactivated user
   * @param {number} userId - User ID
   * @returns {Promise<Object>} { success, message }
   */
  async reactivate(userId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/users/${userId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ isActive: true })
        }
      )
      return result
    } catch (error) {
      console.error('Error reactivating user:', error)
      throw error
    }
  }
}

export default userService
