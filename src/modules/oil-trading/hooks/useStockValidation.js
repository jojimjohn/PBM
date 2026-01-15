/**
 * useStockValidation Hook
 *
 * Manages stock level checking, FIFO preview, and inventory validation
 * for sales orders. Provides real-time stock availability feedback.
 *
 * @module hooks/useStockValidation
 */

import { useState, useCallback, useMemo } from 'react'
import inventoryService from '../../../services/inventoryService'
import salesOrderService from '../../../services/salesOrderService'

/**
 * @typedef {import('../types/sales.types').StockInfo} StockInfo
 * @typedef {import('../types/sales.types').FIFOAllocationPreview} FIFOAllocationPreview
 * @typedef {import('../types/sales.types').StockValidationResult} StockValidationResult
 */

/**
 * Stock status levels
 */
export const STOCK_STATUS = {
  IN_STOCK: 'in-stock',
  LOW_STOCK: 'low-stock',
  OUT_OF_STOCK: 'out-of-stock'
}

/**
 * Hook for managing stock validation and FIFO previews
 *
 * @param {Object} options - Configuration options
 * @param {Array} options.materials - Available materials list
 * @returns {Object} Stock validation state and operations
 */
export const useStockValidation = ({ materials = [] }) => {
  const [stockInfo, setStockInfo] = useState({})
  const [fifoPreview, setFifoPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  /**
   * Load stock information for all materials
   */
  const loadAllStock = useCallback(async (materialsList = materials) => {
    if (!materialsList.length) return

    setLoading(true)
    setError(null)

    try {
      const stockData = {}

      // Fetch stock for each material using FIFO-based batch stock
      await Promise.all(
        materialsList.map(async (material) => {
          try {
            const result = await inventoryService.getBatchStock(material.id)
            if (result.success && result.data) {
              const stock = result.data
              stockData[material.id] = {
                currentStock: stock.availableQuantity || 0,
                totalRemaining: stock.totalRemaining || 0,
                reservedQuantity: stock.reservedQuantity || 0,
                unit: stock.unit || material.unit,
                isLowStock: stock.stockStatus === STOCK_STATUS.LOW_STOCK,
                isOutOfStock: stock.stockStatus === STOCK_STATUS.OUT_OF_STOCK,
                activeBatchCount: stock.activeBatchCount || 0,
                weightedAvgCost: stock.weightedAvgCost || 0,
                source: 'inventory_batches'
              }
            } else {
              stockData[material.id] = createFallbackStock(material)
            }
          } catch (err) {
            stockData[material.id] = createFallbackStock(material)
          }
        })
      )

      setStockInfo(stockData)
    } catch (err) {
      setError(err.message || 'Failed to load stock information')
    } finally {
      setLoading(false)
    }
  }, [materials])

  /**
   * Create fallback stock info when batch stock unavailable
   */
  const createFallbackStock = (material) => ({
    currentStock: 0,
    unit: material.unit,
    isLowStock: false,
    isOutOfStock: true,
    source: 'fallback'
  })

  /**
   * Fetch stock for a single material (real-time update)
   */
  const fetchMaterialStock = useCallback(async (materialId) => {
    if (!materialId) return null

    try {
      const result = await inventoryService.getBatchStock(materialId)
      if (result.success && result.data) {
        const stock = result.data
        const stockData = {
          currentStock: stock.availableQuantity || 0,
          totalRemaining: stock.totalRemaining || 0,
          reservedQuantity: stock.reservedQuantity || 0,
          unit: stock.unit,
          isLowStock: stock.stockStatus === STOCK_STATUS.LOW_STOCK,
          isOutOfStock: stock.stockStatus === STOCK_STATUS.OUT_OF_STOCK,
          activeBatchCount: stock.activeBatchCount || 0,
          weightedAvgCost: stock.weightedAvgCost || 0,
          source: 'inventory_batches'
        }

        setStockInfo(prev => ({
          ...prev,
          [materialId]: stockData
        }))

        return stockData
      }
    } catch (err) {
      // Silent fail for individual material fetch
    }

    return null
  }, [])

  /**
   * Get stock info for a specific material
   */
  const getStockForMaterial = useCallback((materialId) => {
    return stockInfo[materialId] || null
  }, [stockInfo])

  /**
   * Get available quantity for a material
   */
  const getAvailableQuantity = useCallback((materialId) => {
    return stockInfo[materialId]?.currentStock || 0
  }, [stockInfo])

  /**
   * Check if material has sufficient stock for given quantity
   */
  const hasSufficientStock = useCallback((materialId, requiredQuantity) => {
    const available = getAvailableQuantity(materialId)
    return available >= (parseFloat(requiredQuantity) || 0)
  }, [getAvailableQuantity])

  /**
   * Validate stock for order items
   * @param {Array} items - Order items to validate
   * @returns {StockValidationResult}
   */
  const validateStock = useCallback((items) => {
    const result = {
      isValid: true,
      items: [],
      errors: [],
      warnings: []
    }

    const validItems = items.filter(item =>
      item.materialId && parseFloat(item.quantity) > 0
    )

    for (const item of validItems) {
      const materialId = item.materialId
      const requestedQty = parseFloat(item.quantity)
      const stock = stockInfo[materialId]
      const material = materials.find(m => m.id === materialId)
      const materialName = material?.name || 'Unknown Material'

      const availableQty = stock?.currentStock || 0
      const hasStock = availableQty >= requestedQty
      const shortfall = hasStock ? 0 : requestedQty - availableQty

      result.items.push({
        materialId,
        materialName,
        requestedQuantity: requestedQty,
        availableQuantity: availableQty,
        unit: stock?.unit || material?.unit || '',
        hasStock,
        shortfall
      })

      if (!hasStock) {
        result.isValid = false
        result.errors.push(
          `${materialName}: Requested ${requestedQty}, Available ${availableQty} ${stock?.unit || ''}`
        )
      } else if (stock?.isLowStock) {
        result.warnings.push(
          `${materialName}: Low stock warning - only ${availableQty} ${stock?.unit || ''} remaining`
        )
      }
    }

    return result
  }, [stockInfo, materials])

  /**
   * Load FIFO allocation preview for order items
   */
  const loadFifoPreview = useCallback(async (items, orderId = null) => {
    const validItems = items.filter(item =>
      item.materialId && parseFloat(item.quantity) > 0
    )

    if (validItems.length === 0) {
      setFifoPreview(null)
      return null
    }

    setLoading(true)
    setError(null)

    try {
      const result = await salesOrderService.previewFIFO(
        validItems.map(item => ({
          materialId: item.materialId,
          quantity: parseFloat(item.quantity)
        })),
        orderId
      )

      if (result.success) {
        setFifoPreview(result.data)
        return result.data
      } else {
        setError(result.error || 'Failed to load FIFO preview')
        return null
      }
    } catch (err) {
      setError(err.message || 'Failed to load FIFO preview')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Clear FIFO preview
   */
  const clearFifoPreview = useCallback(() => {
    setFifoPreview(null)
  }, [])

  /**
   * Get stock status class for styling
   */
  const getStockStatusClass = useCallback((materialId) => {
    const stock = stockInfo[materialId]
    if (!stock) return ''
    if (stock.isOutOfStock) return 'out-of-stock'
    if (stock.isLowStock) return 'low-stock'
    return 'in-stock'
  }, [stockInfo])

  /**
   * Get stock warning message for a material
   */
  const getStockWarning = useCallback((materialId, requestedQuantity) => {
    const stock = stockInfo[materialId]
    const material = materials.find(m => m.id === materialId)

    if (!stock || !material) return null

    const qty = parseFloat(requestedQuantity) || 0
    const available = stock.currentStock

    if (qty > available) {
      return {
        type: 'error',
        message: `Insufficient stock: ${available} ${stock.unit} available, ${qty} requested`
      }
    }

    if (stock.isOutOfStock) {
      return {
        type: 'error',
        message: `${material.name} is out of stock`
      }
    }

    if (stock.isLowStock) {
      return {
        type: 'warning',
        message: `Low stock: ${available} ${stock.unit} remaining`
      }
    }

    return null
  }, [stockInfo, materials])

  /**
   * Summary of stock status across all materials
   */
  const stockSummary = useMemo(() => {
    const ids = Object.keys(stockInfo)
    if (ids.length === 0) return null

    return {
      totalMaterials: ids.length,
      inStock: ids.filter(id => !stockInfo[id].isLowStock && !stockInfo[id].isOutOfStock).length,
      lowStock: ids.filter(id => stockInfo[id].isLowStock).length,
      outOfStock: ids.filter(id => stockInfo[id].isOutOfStock).length
    }
  }, [stockInfo])

  return {
    // State
    stockInfo,
    fifoPreview,
    loading,
    error,
    stockSummary,

    // Stock operations
    loadAllStock,
    fetchMaterialStock,
    getStockForMaterial,
    getAvailableQuantity,
    hasSufficientStock,

    // Validation
    validateStock,

    // FIFO preview
    loadFifoPreview,
    clearFifoPreview,

    // UI helpers
    getStockStatusClass,
    getStockWarning
  }
}

export default useStockValidation
