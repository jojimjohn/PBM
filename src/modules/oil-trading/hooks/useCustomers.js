/**
 * useCustomers Hook
 *
 * Centralizes customer CRUD operations with automatic cache invalidation
 * and list refresh. Extracts repeated loading/error handling patterns.
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../../context/AuthContext'
import customerService from '../../../services/customerService'
import dataCacheService from '../../../services/dataCacheService'

/**
 * @typedef {import('../types/customer.types').Customer} Customer
 * @typedef {import('../types/customer.types').CustomerFormData} CustomerFormData
 */

/**
 * Hook for managing customer data with CRUD operations
 * @returns {Object} Customer state and operations
 */
export const useCustomers = () => {
  const { selectedCompany } = useAuth()
  /** @type {[Customer[], Function]} */
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  /**
   * Refresh customer list from API
   * Separated to allow reuse after any mutation
   */
  const refreshCustomers = useCallback(async () => {
    try {
      const result = await customerService.getAll()
      if (result.success) {
        setCustomers(result.data || [])
        return true
      }
      throw new Error(result.error || 'Failed to load customers')
    } catch (err) {
      console.error('Error refreshing customers:', err)
      setError(err.message)
      return false
    }
  }, [])

  /**
   * Initial load when company changes
   */
  useEffect(() => {
    const loadCustomers = async () => {
      if (!selectedCompany?.id) return

      setLoading(true)
      setError(null)

      try {
        const result = await customerService.getAll()
        if (result.success) {
          setCustomers(result.data || [])
        } else {
          throw new Error(result.error || 'Failed to load customers')
        }
      } catch (err) {
        console.error('Error loading customers:', err)
        setError(err.message)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    loadCustomers()
  }, [selectedCompany?.id])

  /**
   * Create a new customer
   * @param {Object} customerData - Customer data to create
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const createCustomer = useCallback(async (customerData) => {
    setLoading(true)
    try {
      const result = await customerService.create(customerData)
      if (result.success) {
        dataCacheService.invalidateCustomers()
        await refreshCustomers()
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Error creating customer:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refreshCustomers])

  /**
   * Update an existing customer
   * @param {number} customerId - Customer ID to update
   * @param {Object} customerData - Updated customer data
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const updateCustomer = useCallback(async (customerId, customerData) => {
    setLoading(true)
    try {
      const result = await customerService.update(customerId, customerData)
      if (result.success) {
        dataCacheService.invalidateCustomers()
        await refreshCustomers()
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Error updating customer:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refreshCustomers])

  /**
   * Delete a customer (with deactivation fallback for customers with orders)
   * @param {number} customerId - Customer ID to delete
   * @returns {Promise<{success: boolean, shouldDeactivate?: boolean, error?: string}>}
   */
  const deleteCustomer = useCallback(async (customerId) => {
    setLoading(true)
    try {
      const result = await customerService.delete(customerId)
      if (result.success) {
        dataCacheService.invalidateCustomers()
        await refreshCustomers()
        return { success: true }
      }

      // Check if error suggests deactivation instead of deletion
      const errorMessage = result.error?.toLowerCase() || ''
      const hasExistingOrders = errorMessage.includes('existing orders') ||
                                errorMessage.includes('deactivate instead')

      return {
        success: false,
        shouldDeactivate: hasExistingOrders,
        error: result.error
      }
    } catch (err) {
      console.error('Error deleting customer:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [refreshCustomers])

  /**
   * Toggle customer active status
   * @param {number} customerId - Customer ID to toggle
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const toggleCustomerStatus = useCallback(async (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return { success: false, error: 'Customer not found' }

    setLoading(true)
    try {
      const result = await customerService.updateStatus(customerId, !customer.isActive)
      if (result.success) {
        dataCacheService.invalidateCustomers()
        await refreshCustomers()
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Error updating customer status:', err)
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [customers, refreshCustomers])

  /**
   * Update local customer data (for optimistic updates or contract edits)
   * @param {number} customerId - Customer ID to update
   * @param {Partial<Customer>} updates - Partial customer data
   */
  const updateLocalCustomer = useCallback((customerId, updates) => {
    setCustomers(prev => prev.map(customer =>
      customer.id === customerId
        ? { ...customer, ...updates }
        : customer
    ))
  }, [])

  return {
    customers,
    loading,
    error,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerStatus,
    updateLocalCustomer,
    refreshCustomers
  }
}

export default useCustomers
