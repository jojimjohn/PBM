/**
 * useMaterialComposition Hook
 * Handles composite material logic and stock adjustments
 *
 * @module hooks/useMaterialComposition
 */
import { useState, useCallback } from 'react'
import inventoryService from '../../../services/inventoryService'

/**
 * Hook for managing composite material operations
 * @param {Object} options
 * @param {Object} options.inventory - Inventory map keyed by material ID
 * @param {Object} options.materialCompositions - Compositions map
 * @param {Function} options.onSuccess - Success callback after save
 * @returns {Object} Composite operations and state
 */
export const useMaterialComposition = ({ inventory, materialCompositions, onSuccess }) => {
  const [showCompositeAdjustModal, setShowCompositeAdjustModal] = useState(false)
  const [compositeAdjustData, setCompositeAdjustData] = useState(null)
  const [saving, setSaving] = useState(false)

  /**
   * Open composite adjustment modal for a material
   * @param {Object} material - The composite material
   * @returns {boolean} Whether modal was opened (false if no components)
   */
  const openCompositeAdjustment = useCallback((material) => {
    const matId = Number(material.id)
    const components = materialCompositions[matId] || []

    if (components.length === 0) {
      return false
    }

    const componentData = components.map(comp => ({
      componentId: comp.component_material_id,
      componentName: comp.component_material_name || comp.componentName,
      componentCode: comp.component_material_code || comp.componentCode,
      componentType: comp.component_type,
      currentStock: inventory[comp.component_material_id]?.currentStock || 0,
      newStock: inventory[comp.component_material_id]?.currentStock || 0,
      unit: comp.capacity_unit || inventory[comp.component_material_id]?.unit || 'units',
      inventoryRecord: inventory[comp.component_material_id]
    }))

    setCompositeAdjustData({
      compositeMaterial: material,
      components: componentData
    })
    setShowCompositeAdjustModal(true)
    return true
  }, [inventory, materialCompositions])

  /**
   * Update component stock level in adjustment data
   * @param {number} index - Component index in array
   * @param {number|string} newStock - New stock value
   */
  const updateComponentStock = useCallback((index, newStock) => {
    if (!compositeAdjustData) return

    const newComponents = [...compositeAdjustData.components]
    newComponents[index] = {
      ...newComponents[index],
      newStock: Math.max(0, parseFloat(newStock) || 0)
    }
    setCompositeAdjustData({ ...compositeAdjustData, components: newComponents })
  }, [compositeAdjustData])

  /**
   * Save all component stock adjustments
   * @returns {Object} { success, successCount, errorCount, errors }
   */
  const saveCompositeAdjustment = useCallback(async () => {
    if (!compositeAdjustData) return { success: false, error: 'No adjustment data' }

    setSaving(true)
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (const comp of compositeAdjustData.components) {
      // Skip if no change
      if (comp.newStock === comp.currentStock) continue

      try {
        let result

        if (!comp.inventoryRecord?.batches?.length) {
          // Create new inventory record if none exists
          result = await inventoryService.setOpeningStock(comp.componentId, {
            quantity: comp.newStock,
            batchNumber: `MANUAL-${Date.now()}-${comp.componentId}`,
            averageCost: 0,
            location: 'Main Warehouse',
            notes: `Created via composite adjustment (${compositeAdjustData.compositeMaterial.name})`
          })
        } else {
          // Adjust existing batch
          const batchToUpdate = comp.inventoryRecord.batches[0]
          result = await inventoryService.adjustStock(batchToUpdate.id, {
            adjustmentType: 'set',
            quantity: comp.newStock,
            reason: `Composite adjustment (${compositeAdjustData.compositeMaterial.name})`,
            notes: `Set to ${comp.newStock} ${comp.unit} (was ${comp.currentStock})`
          })
        }

        if (result.success) {
          successCount++
        } else {
          errorCount++
          errors.push({ component: comp.componentName, error: result.error })
        }
      } catch (error) {
        errorCount++
        errors.push({ component: comp.componentName, error: error.message })
      }
    }

    setSaving(false)
    setShowCompositeAdjustModal(false)
    setCompositeAdjustData(null)

    if (onSuccess) {
      await onSuccess()
    }

    return {
      success: errorCount === 0,
      successCount,
      errorCount,
      errors
    }
  }, [compositeAdjustData, onSuccess])

  /**
   * Close modal and reset state
   */
  const closeModal = useCallback(() => {
    setShowCompositeAdjustModal(false)
    setCompositeAdjustData(null)
  }, [])

  /**
   * Check if a material is composite with components
   * @param {number} materialId - Material ID
   * @returns {boolean}
   */
  const hasComponents = useCallback((materialId) => {
    const matId = Number(materialId)
    return (materialCompositions[matId]?.length || 0) > 0
  }, [materialCompositions])

  /**
   * Get components for a composite material
   * @param {number} materialId - Material ID
   * @returns {Array} Component array
   */
  const getComponents = useCallback((materialId) => {
    const matId = Number(materialId)
    return materialCompositions[matId] || []
  }, [materialCompositions])

  return {
    // State
    showCompositeAdjustModal,
    compositeAdjustData,
    saving,

    // Operations
    openCompositeAdjustment,
    updateComponentStock,
    saveCompositeAdjustment,
    closeModal,
    hasComponents,
    getComponents
  }
}

export default useMaterialComposition
