/**
 * useSupplierLocations Hook
 *
 * Manages supplier location CRUD operations using the existing supplierLocationService.
 * Provides loading states, pagination, and reference data (suppliers, regions).
 */

import { useState, useEffect, useCallback } from 'react'
import supplierLocationService from '../../../services/supplierLocationService'
import supplierService from '../../../services/supplierService'
import authService from '../../../services/authService'
import { API_BASE_URL } from '../../../config/api'

/**
 * @typedef {Object} SupplierLocation
 * @property {number} id
 * @property {number} supplierId
 * @property {string} supplierName
 * @property {string} locationCode
 * @property {string} locationName
 * @property {string} [address]
 * @property {string} [contactPerson]
 * @property {string} [contactPhone]
 * @property {string} [coordinates]
 * @property {number} [region_id]
 * @property {string} [regionName]
 * @property {string} [regionGovernorate]
 * @property {boolean|number} isActive
 * @property {string} [notes]
 */

/**
 * @typedef {Object} Region
 * @property {number} id
 * @property {string} name
 * @property {string} governorate
 */

/**
 * Hook for managing supplier locations
 * @returns {Object} Location state and CRUD operations
 */
export const useSupplierLocations = () => {
  const [locations, setLocations] = useState([])
  const [suppliers, setSuppliers] = useState([])
  const [regions, setRegions] = useState([])
  const [loading, setLoading] = useState(false)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  /**
   * Load all supplier locations with pagination
   */
  const loadLocations = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true)

      const params = new URLSearchParams()
      params.append('page', page.toString())
      params.append('limit', pagination.limit.toString())

      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/supplier-locations?${params.toString()}`
      )

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch supplier locations')
      }

      setLocations(data.data || [])
      setPagination(prev => ({
        ...prev,
        page,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.pages || 0
      }))

      return { success: true, data: data.data }
    } catch (error) {
      setLocations([])
      return { success: false, error: error.message }
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.page])

  /**
   * Load suppliers for dropdown
   */
  const loadSuppliers = useCallback(async () => {
    try {
      const result = await supplierService.getAll()
      if (result.success) {
        setSuppliers(result.data || [])
      }
    } catch (error) {
      setSuppliers([])
    }
  }, [])

  /**
   * Load regions for dropdown
   */
  const loadRegions = useCallback(async () => {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/materials/regions`
      )
      if (data.success) {
        setRegions(data.data || [])
      }
    } catch (error) {
      setRegions([])
    }
  }, [])

  /**
   * Create a new supplier location
   * @param {Object} locationData - Location data to create
   */
  const createLocation = useCallback(async (locationData) => {
    setLoading(true)
    try {
      const result = await supplierLocationService.create(locationData)
      if (result.success) {
        await loadLocations()
      }
      return result
    } finally {
      setLoading(false)
    }
  }, [loadLocations])

  /**
   * Update an existing supplier location
   * @param {number} locationId - Location ID
   * @param {Object} locationData - Updated location data
   */
  const updateLocation = useCallback(async (locationId, locationData) => {
    setLoading(true)
    try {
      const result = await supplierLocationService.update(locationId, locationData)
      if (result.success) {
        await loadLocations()
      }
      return result
    } finally {
      setLoading(false)
    }
  }, [loadLocations])

  /**
   * Delete (soft) a supplier location
   * @param {number} locationId - Location ID
   */
  const deleteLocation = useCallback(async (locationId) => {
    setLoading(true)
    try {
      const result = await supplierLocationService.delete(locationId)
      if (result.success) {
        await loadLocations()
      }
      return result
    } finally {
      setLoading(false)
    }
  }, [loadLocations])

  /**
   * Reactivate a soft-deleted location
   * @param {number} locationId - Location ID
   * @param {Object} locationData - Location data for reactivation
   */
  const reactivateLocation = useCallback(async (locationId, locationData) => {
    setLoading(true)
    try {
      const result = await supplierLocationService.reactivate(locationId, locationData)
      if (result.success) {
        await loadLocations()
      }
      return result
    } finally {
      setLoading(false)
    }
  }, [loadLocations])

  /**
   * Generate location code based on supplier
   * @param {number} supplierId - Supplier ID
   * @returns {string} Generated location code
   */
  const generateLocationCode = useCallback((supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (!supplier) return ''

    const cleanName = (supplier.name || 'SUP')
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
    const prefix = cleanName.substring(0, 3).padEnd(3, 'X')
    const sequence = String(Date.now()).slice(-4)

    return `${prefix}-LOC-${sequence}`
  }, [suppliers])

  /**
   * Set page for pagination
   */
  const setPage = useCallback((newPage) => {
    loadLocations(newPage)
  }, [loadLocations])

  // Load initial data
  useEffect(() => {
    loadLocations()
    loadSuppliers()
    loadRegions()
  }, [])

  return {
    locations,
    suppliers,
    regions,
    loading,
    pagination,
    loadLocations,
    createLocation,
    updateLocation,
    deleteLocation,
    reactivateLocation,
    generateLocationCode,
    setPage
  }
}

export default useSupplierLocations
