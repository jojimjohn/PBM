/**
 * useStockAlerts Hook
 * Manages stock alert calculations and display
 *
 * @module hooks/useStockAlerts
 */
import { useState, useCallback, useMemo } from 'react'

/**
 * Hook for managing stock alerts
 * @param {Object} options
 * @param {Object} options.inventory - Inventory map keyed by material ID
 * @param {Array} options.materials - Materials array
 * @param {Object} options.materialCompositions - Composite material compositions
 * @returns {Object} Alert state and operations
 */
export const useStockAlerts = ({ inventory, materials, materialCompositions }) => {
  const [showAlertDropdown, setShowAlertDropdown] = useState(false)

  /**
   * Calculate effective stock for a material (handles composites)
   * For composite materials, calculates how many complete units can be made
   * based on the limiting component
   *
   * @param {number} materialId - Material ID
   * @returns {Object} { currentStock, reorderLevel }
   */
  const getEffectiveStock = useCallback((materialId) => {
    const matId = Number(materialId)
    const material = materials.find(m => Number(m.id) === matId)

    // For composite materials, calculate based on components
    if (material?.is_composite) {
      const components = materialCompositions[matId] || []
      if (components.length === 0) return { currentStock: 0, reorderLevel: 0 }

      let minUnits = Infinity
      for (const comp of components) {
        const compStock = inventory[comp.component_material_id]?.currentStock || 0
        // Use Math.max to prevent division by zero or negative values
        const qtyPerComposite = Math.max(parseFloat(comp.quantity_per_composite) || 1, 0.001)
        const availableUnits = Math.floor(compStock / qtyPerComposite)
        minUnits = Math.min(minUnits, availableUnits)
      }

      return {
        currentStock: minUnits === Infinity ? 0 : Math.max(0, minUnits),
        reorderLevel: material.minimumStockLevel || 0
      }
    }

    // For regular materials, return inventory directly
    const stock = inventory[matId]
    return stock || { currentStock: 0, reorderLevel: 0 }
  }, [inventory, materials, materialCompositions])

  /**
   * Get stock status for a material
   * @param {number} materialId - Material ID
   * @returns {'good'|'low'|'critical'|'out-of-stock'} Stock status
   */
  const getStockStatus = useCallback((materialId) => {
    const stock = getEffectiveStock(materialId)

    if (stock.currentStock === 0) return 'out-of-stock'
    if (stock.reorderLevel > 0) {
      if (stock.currentStock <= stock.reorderLevel * 0.5) return 'critical'
      if (stock.currentStock <= stock.reorderLevel) return 'low'
    }
    return 'good'
  }, [getEffectiveStock])

  /**
   * Generate alerts from inventory data
   * Memoized to prevent recalculation on every render
   */
  const alerts = useMemo(() => {
    const lowStockItems = Object.values(inventory).filter(item =>
      item.currentStock <= item.reorderLevel && item.reorderLevel > 0
    )

    return lowStockItems.map((item, index) => ({
      id: `alert-${item.materialId || index}`,
      type: 'warning',
      severity: item.currentStock <= item.reorderLevel * 0.5 ? 'critical' : 'warning',
      material: item.materialName || item.materialCode,
      materialId: item.materialId,
      currentStock: item.currentStock,
      reorderLevel: item.reorderLevel,
      unit: item.unit,
      message: `Low stock alert: ${item.materialCode} (${item.currentStock} ${item.unit})`
    }))
  }, [inventory])

  /**
   * Count of critical alerts
   */
  const criticalAlerts = useMemo(() => {
    return alerts.filter(a => a.severity === 'critical').length
  }, [alerts])

  /**
   * Toggle alert dropdown visibility
   */
  const toggleAlertDropdown = useCallback(() => {
    setShowAlertDropdown(prev => !prev)
  }, [])

  /**
   * Close alert dropdown
   */
  const closeAlertDropdown = useCallback(() => {
    setShowAlertDropdown(false)
  }, [])

  return {
    // State
    alerts,
    criticalAlerts,
    showAlertDropdown,

    // Operations
    getEffectiveStock,
    getStockStatus,
    toggleAlertDropdown,
    closeAlertDropdown,
    setShowAlertDropdown
  }
}

export default useStockAlerts
