/**
 * useStockAlerts Hook
 * Manages stock alert calculations and display
 *
 * Updated to use shared stockStatusUtils for consistent stock calculations
 *
 * @module hooks/useStockAlerts
 */
import { useState, useCallback, useMemo } from 'react'
import {
  calculateStockStatus,
  getEffectiveStock as getEffectiveStockUtil
} from '../utils/stockStatusUtils'

/**
 * @typedef {import('../types/inventory.types').StockStatus} StockStatus
 * @typedef {import('../types/inventory.types').StockAlert} StockAlert
 * @typedef {import('../types/inventory.types').InventoryMap} InventoryMap
 * @typedef {import('../types/inventory.types').Material} Material
 */

/**
 * Hook for managing stock alerts
 * @param {Object} options
 * @param {InventoryMap} options.inventory - Inventory map keyed by material ID
 * @param {Material[]} options.materials - Materials array
 * @param {Object} options.materialCompositions - Composite material compositions
 * @returns {Object} Alert state and operations
 */
export const useStockAlerts = ({ inventory, materials, materialCompositions }) => {
  const [showAlertDropdown, setShowAlertDropdown] = useState(false)

  /**
   * Calculate effective stock for a material (handles composites)
   * Uses shared utility for consistent calculation across the app
   *
   * @param {number} materialId - Material ID
   * @returns {{ currentStock: number, reorderLevel: number }}
   */
  const getEffectiveStock = useCallback((materialId) => {
    return getEffectiveStockUtil(materialId, materials, inventory, materialCompositions)
  }, [inventory, materials, materialCompositions])

  /**
   * Get stock status for a material
   * Uses shared utility for consistent status calculation
   *
   * @param {number} materialId - Material ID
   * @returns {StockStatus} Stock status
   */
  const getStockStatus = useCallback((materialId) => {
    const stock = getEffectiveStock(materialId)
    return calculateStockStatus(stock.currentStock, stock.reorderLevel)
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
