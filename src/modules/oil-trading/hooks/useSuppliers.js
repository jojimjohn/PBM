/**
 * useSuppliers Hook
 *
 * Centralizes supplier CRUD operations with automatic cache invalidation
 * and list refresh. Also manages reference data (types, regions, specializations).
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import supplierService from '../../../services/supplierService'
import materialService from '../../../services/materialService'
import typesService from '../../../services/typesService'
import dataCacheService from '../../../services/dataCacheService'

/**
 * @typedef {import('../types/supplier.types').Supplier} Supplier
 * @typedef {import('../types/supplier.types').SupplierType} SupplierType
 * @typedef {import('../types/supplier.types').Region} Region
 * @typedef {import('../types/supplier.types').Specialization} Specialization
 */

/**
 * Hook for managing supplier data with CRUD operations
 * @returns {Object} Supplier state and operations
 */
export const useSuppliers = () => {
  const { selectedCompany } = useAuth()

  /** @type {[Supplier[], Function]} */
  const [suppliers, setSuppliers] = useState([])
  /** @type {[SupplierType[], Function]} */
  const [supplierTypes, setSupplierTypes] = useState([])
  /** @type {[Region[], Function]} */
  const [regions, setRegions] = useState([])
  /** @type {[Specialization[], Function]} */
  const [specializations, setSpecializations] = useState([])

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Refresh supplier list from API
   */
  const refreshSuppliers = useCallback(async () => {
    try {
      const result = await supplierService.getAll()
      if (result.success) {
        setSuppliers(result.data || [])
        return true
      }
      throw new Error(result.error || 'Failed to load suppliers')
    } catch (err) {
      console.error('Error refreshing suppliers:', err)
      setError(err.message)
      return false
    }
  }, [])

  /**
   * Load reference data (types, regions, specializations)
   */
  const loadReferenceData = useCallback(async () => {
    const results = await Promise.allSettled([
      typesService.getSupplierTypes(),
      materialService.getRegions(),
      materialService.getCategories({ business_type: 'oil' })
    ])

    // Supplier types
    if (results[0].status === 'fulfilled' && results[0].value.success) {
      setSupplierTypes(results[0].value.data || [])
    }

    // Regions
    if (results[1].status === 'fulfilled' && results[1].value.success) {
      setRegions(results[1].value.data || [])
    }

    // Specializations (material categories for oil business)
    if (results[2].status === 'fulfilled' && results[2].value.success) {
      setSpecializations(results[2].value.data || [])
    }
  }, [])

  /**
   * Initial load when company changes
   */
  useEffect(() => {
    const loadData = async () => {
      if (!selectedCompany?.id) return

      setLoading(true)
      setError(null)

      try {
        // Load suppliers and reference data in parallel
        const [suppliersResult] = await Promise.all([
          supplierService.getAll(),
          loadReferenceData()
        ])

        if (suppliersResult.success) {
          setSuppliers(suppliersResult.data || [])
        } else {
          throw new Error(suppliersResult.error || 'Failed to load suppliers')
        }
      } catch (err) {
        console.error('Error loading suppliers:', err)
        setError(err.message)
        setSuppliers([])
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [selectedCompany?.id, loadReferenceData])

  /**
   * Generate next supplier code based on highest existing code
   * @returns {string} Next available supplier code
   */
  const generateNextCode = useCallback(() => {
    if (suppliers.length === 0) {
      return 'AR-SUP-001'
    }

    let maxNumber = 0
    suppliers.forEach(supplier => {
      if (supplier.code) {
        const match = supplier.code.match(/AR-SUP-(\d+)/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNumber) {
            maxNumber = num
          }
        }
      }
    })

    return `AR-SUP-${String(maxNumber + 1).padStart(3, '0')}`
  }, [suppliers])

  /**
   * Create a new supplier
   * @param {Object} supplierData - Supplier data to create
   * @returns {Promise<{success: boolean, data?: Supplier, error?: string}>}
   */
  const createSupplier = useCallback(async (supplierData) => {
    setLoading(true)
    try {
      const result = await supplierService.create(supplierData)
      if (result.success) {
        dataCacheService.invalidateSuppliers()
        await refreshSuppliers()
        return { success: true, data: result.data }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Error creating supplier:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refreshSuppliers])

  /**
   * Update an existing supplier
   * @param {number} supplierId - Supplier ID to update
   * @param {Object} supplierData - Updated supplier data
   * @returns {Promise<{success: boolean, data?: Supplier, error?: string}>}
   */
  const updateSupplier = useCallback(async (supplierId, supplierData) => {
    setLoading(true)
    try {
      const result = await supplierService.update(supplierId, supplierData)
      if (result.success) {
        dataCacheService.invalidateSuppliers()
        await refreshSuppliers()
        return { success: true, data: result.data }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Error updating supplier:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refreshSuppliers])

  /**
   * Delete a supplier
   * @param {number} supplierId - Supplier ID to delete
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteSupplier = useCallback(async (supplierId) => {
    setLoading(true)
    try {
      const result = await supplierService.delete(supplierId)
      if (result.success) {
        dataCacheService.invalidateSuppliers()
        await refreshSuppliers()
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Error deleting supplier:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refreshSuppliers])

  /**
   * Calculate summary statistics for dashboard cards
   * @returns {Object} Summary statistics
   */
  const getSummaryStats = useCallback(() => {
    return {
      totalSuppliers: suppliers.length,
      businessSuppliers: suppliers.filter(s => s.type === 'business').length,
      monthlyVolume: suppliers.reduce((sum, s) => sum + (s.performance?.monthlyVolume || 0), 0),
      totalValue: suppliers.reduce((sum, s) => sum + (s.purchaseHistory?.totalValue || 0), 0)
    }
  }, [suppliers])

  return {
    // State
    suppliers,
    supplierTypes,
    regions,
    specializations,
    loading,
    error,

    // CRUD operations
    createSupplier,
    updateSupplier,
    deleteSupplier,
    refreshSuppliers,

    // Utilities
    generateNextCode,
    getSummaryStats
  }
}

export default useSuppliers
