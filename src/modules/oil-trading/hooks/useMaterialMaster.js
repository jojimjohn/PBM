/**
 * useMaterialMaster Hook
 * Handles material CRUD operations
 *
 * @module hooks/useMaterialMaster
 */
import { useState, useCallback, useEffect } from 'react'
import materialService from '../../../services/materialService'
import dataCacheService from '../../../services/dataCacheService'

/**
 * Hook for material master data operations
 * @param {Object} options
 * @param {Function} options.onRefresh - Callback to refresh parent data
 * @returns {Object} Material operations and state
 */
export const useMaterialMaster = ({ onRefresh }) => {
  const [showMaterialForm, setShowMaterialForm] = useState(false)
  const [editingMaterial, setEditingMaterial] = useState(null)
  const [materialCategories, setMaterialCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load material categories on mount
   */
  useEffect(() => {
    loadCategories()
  }, [])

  /**
   * Load material categories
   */
  const loadCategories = useCallback(async () => {
    try {
      const result = await materialService.getCategories()
      if (result.success) {
        setMaterialCategories(result.data || [])
      }
    } catch (err) {
      // Silently fail - categories are optional enhancement
    }
  }, [])

  /**
   * Open form to add new material
   */
  const handleAddMaterial = useCallback(() => {
    setEditingMaterial(null)
    setError(null)
    setShowMaterialForm(true)
  }, [])

  /**
   * Open form to edit existing material
   * @param {Object} material - Material to edit
   * @returns {Object} { success, error }
   */
  const handleEditMaterial = useCallback(async (material) => {
    setLoading(true)
    setError(null)
    try {
      const result = await materialService.getById(material.id)
      if (result.success) {
        setEditingMaterial(result.data)
        setShowMaterialForm(true)
        return { success: true }
      } else {
        const errorMsg = 'Failed to load material details'
        setError(errorMsg)
        return { success: false, error: errorMsg }
      }
    } catch (err) {
      const errorMsg = err.message || 'Failed to load material details'
      setError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Save material (create or update)
   * @param {Object} materialData - Material data
   * @param {number|null} materialId - Material ID for updates
   * @returns {Object} { success, message }
   */
  const handleSaveMaterial = useCallback(async (materialData, materialId) => {
    setLoading(true)
    setError(null)

    try {
      let response
      if (materialId) {
        response = await materialService.update(materialId, materialData)
      } else {
        response = await materialService.create(materialData)
      }

      if (response.success) {
        // Invalidate cache so other pages see changes
        dataCacheService.invalidateMaterials()

        if (onRefresh) {
          await onRefresh()
        }

        setShowMaterialForm(false)
        setEditingMaterial(null)

        return {
          success: true,
          message: materialId ? 'Material updated successfully' : 'Material created successfully'
        }
      } else {
        throw new Error(response.error || 'Failed to save material')
      }
    } catch (err) {
      setError(err.message)
      throw err
    } finally {
      setLoading(false)
    }
  }, [onRefresh])

  /**
   * Delete a material
   * @param {number} materialId - Material ID
   * @returns {Object} { success, error }
   */
  const handleDeleteMaterial = useCallback(async (materialId) => {
    setLoading(true)
    setError(null)

    try {
      const response = await materialService.delete(materialId)
      if (response.success) {
        dataCacheService.invalidateMaterials()
        if (onRefresh) {
          await onRefresh()
        }
        return { success: true }
      } else {
        throw new Error(response.error || 'Failed to delete material')
      }
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [onRefresh])

  /**
   * Close form and reset state
   */
  const closeForm = useCallback(() => {
    setShowMaterialForm(false)
    setEditingMaterial(null)
    setError(null)
  }, [])

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    // State
    showMaterialForm,
    editingMaterial,
    materialCategories,
    loading,
    error,

    // Operations
    loadCategories,
    handleAddMaterial,
    handleEditMaterial,
    handleSaveMaterial,
    handleDeleteMaterial,
    closeForm,
    clearError,
    setMaterialCategories
  }
}

export default useMaterialMaster
