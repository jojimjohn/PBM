import { API_BASE_URL } from '../config/api'
import authService from './authService'

/**
 * Material Composition Service
 * Handles composite material definitions (Oil+Drum, Kerosene+Can, etc.)
 */
const materialCompositionService = {
  /**
   * Get all material compositions
   * @param {Object} params - Query parameters
   * @param {number} params.composite_material_id - Filter by composite material
   * @param {number} params.component_material_id - Filter by component material
   * @param {boolean} params.is_active - Filter by active status
   * @returns {Promise<Object>} Response with compositions array
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.composite_material_id) queryParams.append('composite_material_id', params.composite_material_id)
      if (params.component_material_id) queryParams.append('component_material_id', params.component_material_id)
      if (params.is_active !== undefined) queryParams.append('is_active', params.is_active)

      const url = `${API_BASE_URL}/material-compositions?${queryParams.toString()}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error('Error fetching material compositions:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch material compositions'
      }
    }
  },

  /**
   * Get single composition by ID
   * @param {number} compositionId - Composition ID
   * @returns {Promise<Object>} Response with composition data
   */
  async getById(compositionId) {
    try {
      const url = `${API_BASE_URL}/material-compositions/${compositionId}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error(`Error fetching composition ${compositionId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch composition'
      }
    }
  },

  /**
   * Get all components for a composite material
   * @param {number} materialId - Composite material ID
   * @returns {Promise<Object>} Response with components array
   */
  async getByComposite(materialId) {
    try {
      const url = `${API_BASE_URL}/material-compositions/by-composite/${materialId}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error(`Error fetching components for material ${materialId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch composition components'
      }
    }
  },

  /**
   * Create a new composition
   * @param {Object} compositionData - Composition data
   * @param {number} compositionData.composite_material_id - The composite material ID
   * @param {number} compositionData.component_material_id - The component material ID
   * @param {string} compositionData.component_type - 'container' or 'content'
   * @param {number} compositionData.quantity_per_unit - Quantity per composite unit
   * @param {string} compositionData.unit - Unit of measurement
   * @param {boolean} compositionData.is_active - Active status
   * @returns {Promise<Object>} Response with created composition
   */
  async create(compositionData) {
    try {
      const url = `${API_BASE_URL}/material-compositions`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(compositionData)
      })
      return data
    } catch (error) {
      console.error('Error creating composition:', error)
      return {
        success: false,
        error: error.message || 'Failed to create composition'
      }
    }
  },

  /**
   * Update an existing composition
   * @param {number} compositionId - Composition ID
   * @param {Object} compositionData - Updated composition data
   * @returns {Promise<Object>} Response with updated composition
   */
  async update(compositionId, compositionData) {
    try {
      const url = `${API_BASE_URL}/material-compositions/${compositionId}`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify(compositionData)
      })
      return data
    } catch (error) {
      console.error(`Error updating composition ${compositionId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to update composition'
      }
    }
  },

  /**
   * Delete a composition
   * @param {number} compositionId - Composition ID
   * @returns {Promise<Object>} Response
   */
  async delete(compositionId) {
    try {
      const url = `${API_BASE_URL}/material-compositions/${compositionId}`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'DELETE'
      })
      return data
    } catch (error) {
      console.error(`Error deleting composition ${compositionId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to delete composition'
      }
    }
  },

  /**
   * Check if a material is composite (has components)
   * @param {number} materialId - Material ID
   * @returns {Promise<boolean>} True if material is composite
   */
  async isComposite(materialId) {
    try {
      const response = await this.getByComposite(materialId)
      return response.success && response.data && response.data.length > 0
    } catch (error) {
      console.error(`Error checking if material ${materialId} is composite:`, error)
      return false
    }
  },

  /**
   * Get all material IDs that are used as components in any composition
   * Used to filter component materials from main inventory list
   * @returns {Promise<Array<number>>} Array of material IDs
   */
  async getComponentMaterialIds() {
    try {
      const response = await this.getAll({ is_active: true })
      if (response.success && response.data) {
        // Extract unique component material IDs
        const uniqueIds = [...new Set(
          response.data.map(comp => comp.component_material_id)
        )]
        return uniqueIds
      }
      return []
    } catch (error) {
      console.error('Error fetching component material IDs:', error)
      return []
    }
  },

  /**
   * Get composition components for a composite material
   * Note: Actual quantities are determined at PO receipt, not by fixed ratios
   * @param {number} compositeMaterialId - Composite material ID
   * @returns {Promise<Object>} Component information
   */
  async getCompositionInfo(compositeMaterialId) {
    try {
      const response = await this.getByComposite(compositeMaterialId)
      if (!response.success || !response.data) {
        throw new Error('Failed to fetch composition')
      }

      const components = response.data.map(component => ({
        material_id: component.component_material_id,
        material_name: component.component_material_name,
        material_code: component.component_material_code,
        component_type: component.component_type,
        capacity: component.capacity,
        capacity_unit: component.capacity_unit
      }))

      return {
        success: true,
        data: {
          composite_material_id: compositeMaterialId,
          components: components
        }
      }
    } catch (error) {
      console.error('Error getting composition info:', error)
      return {
        success: false,
        error: error.message || 'Failed to get composition info'
      }
    }
  }
}

export default materialCompositionService
