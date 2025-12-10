/**
 * Role Management Service
 *
 * Provides API abstraction for role management operations:
 * - Role CRUD operations
 * - Permission management
 * - Role cloning
 * - Role hierarchy enforcement
 */

import authService from './authService'
import { API_BASE_URL } from '../config/api'

const roleService = {
  /**
   * Get all roles for the current company
   * @param {Object} filters - Optional filters (isActive, isSystem, search)
   * @returns {Promise<Object>} { success, data: { roles: Role[], meta } }
   */
  async getAll(filters = {}) {
    try {
      const params = new URLSearchParams()
      if (typeof filters.isActive !== 'undefined') params.append('isActive', filters.isActive)
      if (typeof filters.isSystem !== 'undefined') params.append('isSystem', filters.isSystem)
      if (filters.search) params.append('search', filters.search)

      const queryString = params.toString()
      const url = `${API_BASE_URL}/roles${queryString ? `?${queryString}` : ''}`

      const result = await authService.makeAuthenticatedRequest(url, {
        method: 'GET'
      })

      return result
    } catch (error) {
      console.error('Error fetching roles:', error)
      throw error
    }
  },

  /**
   * Get all available permissions grouped by module
   * @returns {Promise<Object>} { success, data: { permissions: PermissionGroup[] } }
   */
  async getPermissions() {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/permissions`,
        { method: 'GET' }
      )
      return result
    } catch (error) {
      console.error('Error fetching permissions:', error)
      throw error
    }
  },

  /**
   * Get role by ID
   * @param {number} roleId - Role ID
   * @returns {Promise<Object>} { success, data: Role }
   */
  async getById(roleId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/${roleId}`,
        { method: 'GET' }
      )
      return result
    } catch (error) {
      console.error('Error fetching role:', error)
      throw error
    }
  },

  /**
   * Create a new role
   * @param {Object} roleData - Role data { name, description, permissions, hierarchyLevel }
   * @returns {Promise<Object>} { success, data: Role, message }
   */
  async create(roleData) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles`,
        {
          method: 'POST',
          body: JSON.stringify(roleData)
        }
      )
      return result
    } catch (error) {
      console.error('Error creating role:', error)
      throw error
    }
  },

  /**
   * Update role details
   * @param {number} roleId - Role ID
   * @param {Object} roleData - Update data { name, description, permissions, hierarchyLevel, isActive }
   * @returns {Promise<Object>} { success, data: Role, message }
   */
  async update(roleId, roleData) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/${roleId}`,
        {
          method: 'PUT',
          body: JSON.stringify(roleData)
        }
      )
      return result
    } catch (error) {
      console.error('Error updating role:', error)
      throw error
    }
  },

  /**
   * Delete a role (soft delete by deactivating)
   * @param {number} roleId - Role ID
   * @returns {Promise<Object>} { success, message }
   */
  async delete(roleId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/${roleId}`,
        { method: 'DELETE' }
      )
      return result
    } catch (error) {
      console.error('Error deleting role:', error)
      throw error
    }
  },

  /**
   * Clone an existing role
   * @param {number} roleId - Source role ID
   * @param {string} newName - Name for the cloned role
   * @returns {Promise<Object>} { success, data: Role, message }
   */
  async clone(roleId, newName) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/${roleId}/clone`,
        {
          method: 'POST',
          body: JSON.stringify({ newName })
        }
      )
      return result
    } catch (error) {
      console.error('Error cloning role:', error)
      throw error
    }
  },

  /**
   * Get users assigned to a role
   * @param {number} roleId - Role ID
   * @returns {Promise<Object>} { success, data: { users: User[], count } }
   */
  async getUsers(roleId) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/${roleId}/users`,
        { method: 'GET' }
      )
      return result
    } catch (error) {
      console.error('Error fetching role users:', error)
      throw error
    }
  },

  /**
   * Get roles that the current user can assign (based on hierarchy)
   * Filters roles where hierarchyLevel < currentUser.roleHierarchyLevel
   * @returns {Promise<Object>} { success, data: { roles: Role[] } }
   */
  async getAssignableRoles() {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles?assignable=true`,
        { method: 'GET' }
      )
      return result
    } catch (error) {
      console.error('Error fetching assignable roles:', error)
      throw error
    }
  },

  /**
   * Toggle role active status
   * @param {number} roleId - Role ID
   * @param {boolean} isActive - New active status
   * @returns {Promise<Object>} { success, message }
   */
  async toggleActive(roleId, isActive) {
    try {
      const result = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/roles/${roleId}`,
        {
          method: 'PUT',
          body: JSON.stringify({ isActive })
        }
      )
      return result
    } catch (error) {
      console.error('Error toggling role status:', error)
      throw error
    }
  },

  /**
   * Check if a role name is available
   * @param {string} name - Role name to check
   * @param {number} excludeId - Optional role ID to exclude (for updates)
   * @returns {Promise<boolean>} true if name is available
   */
  async isNameAvailable(name, excludeId = null) {
    try {
      const roles = await this.getAll()
      if (!roles.success) return false

      const existingRole = roles.data.roles.find(
        r => r.name.toLowerCase() === name.toLowerCase() && r.id !== excludeId
      )
      return !existingRole
    } catch (error) {
      console.error('Error checking role name:', error)
      return false
    }
  },

  /**
   * Validate permissions array against available permissions
   * @param {string[]} permissions - Array of permission keys
   * @returns {Promise<Object>} { valid, invalidKeys }
   */
  async validatePermissions(permissions) {
    try {
      const permissionsResult = await this.getPermissions()
      if (!permissionsResult.success) {
        return { valid: false, invalidKeys: permissions }
      }

      const validKeys = new Set()
      permissionsResult.data.permissions.forEach(module => {
        module.permissions.forEach(p => validKeys.add(p.key))
      })

      const invalidKeys = permissions.filter(p => !validKeys.has(p))
      return {
        valid: invalidKeys.length === 0,
        invalidKeys
      }
    } catch (error) {
      console.error('Error validating permissions:', error)
      return { valid: false, invalidKeys: permissions }
    }
  }
}

export default roleService
