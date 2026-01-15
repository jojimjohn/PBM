/**
 * useInventoryData Hook
 * Manages inventory data loading, caching, and state management
 *
 * @module hooks/useInventoryData
 */
import { useState, useEffect, useCallback, useRef } from 'react'
import inventoryService from '../../../services/inventoryService'
import dataCacheService from '../../../services/dataCacheService'
import materialCompositionService from '../../../services/materialCompositionService'

/**
 * Hook for managing inventory data
 * @param {Object} options
 * @param {string} [options.projectId] - Filter by project
 * @param {string} [options.companyId] - Company ID for vendor loading
 * @returns {Object} Inventory data and operations
 */
export const useInventoryData = ({ projectId, companyId } = {}) => {
  const [loading, setLoading] = useState(true)
  const [inventory, setInventory] = useState({})
  const [materials, setMaterials] = useState([])
  const [branches, setBranches] = useState([])
  const [vendors, setVendors] = useState([])
  const [componentMaterialIds, setComponentMaterialIds] = useState([])
  const [materialCompositions, setMaterialCompositions] = useState({})
  const [error, setError] = useState(null)

  // AbortController for cleanup
  const abortControllerRef = useRef(null)

  /**
   * Process raw inventory data into keyed map
   * @param {Array} inventoryArray - Raw inventory array from API
   * @returns {Object} Inventory keyed by material ID
   */
  const processInventoryData = useCallback((inventoryArray) => {
    const inventoryByMaterial = {}

    for (const item of inventoryArray) {
      const matId = Number(item.materialId)
      if (!inventoryByMaterial[matId]) {
        inventoryByMaterial[matId] = {
          materialId: matId,
          materialName: item.materialName,
          materialCode: item.materialCode,
          category: item.category,
          unit: item.unit,
          currentStock: 0,
          reservedQuantity: 0,
          availableQuantity: 0,
          totalValue: 0,
          averageCost: item.averageCost || 0,
          standardPrice: item.standardPrice || 0,
          minimumStockLevel: item.minimumStockLevel || 0,
          maximumStockLevel: item.maximumStockLevel || 0,
          reorderLevel: item.minimumStockLevel || 0,
          batches: []
        }
      }

      inventoryByMaterial[matId].currentStock += parseFloat(item.currentStock || item.quantity || 0)
      inventoryByMaterial[matId].reservedQuantity += parseFloat(item.reservedQuantity || 0)
      inventoryByMaterial[matId].availableQuantity += parseFloat(item.availableQuantity || item.currentStock || 0)
      inventoryByMaterial[matId].totalValue += parseFloat(item.totalValue || 0)
      inventoryByMaterial[matId].batches.push(item)
    }

    return inventoryByMaterial
  }, [])

  /**
   * Load all inventory data in parallel
   */
  const loadInventoryData = useCallback(async () => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    try {
      setLoading(true)
      setError(null)

      // Parallel API calls for performance
      const [
        inventoryResult,
        companyMaterials,
        componentIds,
        companyBranches,
        companyVendors
      ] = await Promise.all([
        inventoryService.getAll(),
        dataCacheService.getMaterials(),
        materialCompositionService.getComponentMaterialIds().catch(() => []),
        dataCacheService.getBranches(),
        companyId !== 'al_ramrami'
          ? dataCacheService.getSuppliers()
          : Promise.resolve([])
      ])

      // Process inventory data
      const inventoryArray = inventoryResult.success ? inventoryResult.data : []
      const inventoryByMaterial = processInventoryData(inventoryArray)

      setInventory(inventoryByMaterial)
      setMaterials(companyMaterials || [])
      setComponentMaterialIds(componentIds)
      setBranches(companyBranches || [])
      setVendors(companyVendors || [])

      // Load composite material compositions in parallel
      const compositeMaterials = (companyMaterials || []).filter(m => m.is_composite)
      if (compositeMaterials.length > 0) {
        const compositionPromises = compositeMaterials.map(material =>
          materialCompositionService.getByComposite(material.id)
            .then(result => ({ materialId: material.id, result }))
            .catch(() => ({ materialId: material.id, result: { success: false, data: [] } }))
        )

        const compositionResults = await Promise.all(compositionPromises)
        const compositions = {}

        for (const { materialId, result } of compositionResults) {
          if (result.success && result.data) {
            compositions[materialId] = result.data.map(comp => {
              const compStock = inventoryByMaterial[comp.component_material_id]
              return {
                ...comp,
                currentStock: compStock?.currentStock || 0,
                unit: compStock?.unit || comp.capacity_unit || 'units'
              }
            })
          }
        }

        setMaterialCompositions(compositions)
      } else {
        setMaterialCompositions({})
      }

      return { success: true }
    } catch (err) {
      if (err.name !== 'AbortError') {
        setError(err.message || 'Failed to load inventory data')
        return { success: false, error: err.message }
      }
    } finally {
      setLoading(false)
    }
  }, [companyId, processInventoryData])

  /**
   * Refresh inventory data
   */
  const refresh = useCallback(() => {
    return loadInventoryData()
  }, [loadInventoryData])

  /**
   * Get filtered materials (excluding components)
   */
  const getFilteredMaterials = useCallback(() => {
    return materials.filter(m => !componentMaterialIds.includes(Number(m.id)))
  }, [materials, componentMaterialIds])

  /**
   * Invalidate cache and reload
   */
  const invalidateCache = useCallback(async () => {
    dataCacheService.invalidateMaterials()
    await loadInventoryData()
  }, [loadInventoryData])

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadInventoryData()

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [projectId, loadInventoryData])

  return {
    // State
    loading,
    error,
    inventory,
    materials,
    branches,
    vendors,
    componentMaterialIds,
    materialCompositions,

    // Computed
    filteredMaterials: getFilteredMaterials(),

    // Operations
    refresh,
    invalidateCache,
    setInventory,
    setMaterials
  }
}

export default useInventoryData
