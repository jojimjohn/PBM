/**
 * useSalesOrders Hook
 *
 * Manages sales order CRUD operations and state.
 * Centralizes data fetching, caching, and business logic for the sales module.
 *
 * @module hooks/useSalesOrders
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import salesOrderService from '../../../services/salesOrderService'

/**
 * @typedef {import('../types/sales.types').SalesOrder} SalesOrder
 * @typedef {import('../types/sales.types').SalesInvoice} SalesInvoice
 * @typedef {import('../types/sales.types').SalesSummaryStats} SalesSummaryStats
 * @typedef {import('../types/sales.types').UseSalesOrdersReturn} UseSalesOrdersReturn
 */

/**
 * Hook for managing sales orders and invoices
 *
 * @param {Object} [options] - Hook options
 * @param {string} [options.projectId] - Optional project ID for filtering
 * @param {Function} [options.getProjectQueryParam] - Function to get project query params
 * @returns {UseSalesOrdersReturn} Sales orders state and operations
 */
export const useSalesOrders = (options = {}) => {
  const { projectId, getProjectQueryParam } = options

  const [orders, setOrders] = useState([])
  const [invoices, setInvoices] = useState([])
  const [todaysSummary, setTodaysSummary] = useState({
    totalSales: 0,
    totalOrders: 0,
    pendingOrders: 0
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    pages: 0
  })

  /**
   * Get project parameters for API calls
   */
  const getProjectParams = useCallback(() => {
    if (getProjectQueryParam) {
      return getProjectQueryParam()
    }
    if (projectId) {
      return { projectId }
    }
    return {}
  }, [projectId, getProjectQueryParam])

  /**
   * Load all sales orders with pagination
   */
  const loadOrders = useCallback(async (page = pagination.page) => {
    try {
      setLoading(true)
      setError(null)

      const projectParams = getProjectParams()
      const result = await salesOrderService.getAll({
        ...projectParams,
        page,
        limit: pagination.limit
      })

      if (result.success) {
        setOrders(result.data || [])
        setPagination(prev => ({
          ...prev,
          page,
          total: result.pagination?.total || 0,
          pages: result.pagination?.pages || 0
        }))
      } else {
        setError(result.error || 'Failed to load orders')
        setOrders([])
      }

      return result
    } catch (err) {
      const errorMessage = err.message || 'Failed to load orders'
      setError(errorMessage)
      setOrders([])
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [pagination.limit, pagination.page, getProjectParams])

  /**
   * Load invoices list
   */
  const loadInvoices = useCallback(async () => {
    try {
      const result = await salesOrderService.getInvoices()

      if (result.success) {
        setInvoices(result.data || [])
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [])

  /**
   * Load today's sales summary
   */
  const loadTodaysSummary = useCallback(async () => {
    try {
      const projectParams = getProjectParams()
      const result = await salesOrderService.getTodaysSummary(projectParams)

      if (result.success && result.data) {
        setTodaysSummary({
          totalSales: result.data.totalSales || 0,
          totalOrders: result.data.totalOrders || 0,
          pendingOrders: result.data.pendingOrders || 0
        })
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    }
  }, [getProjectParams])

  /**
   * Load a single order by ID
   */
  const loadOrder = useCallback(async (orderId) => {
    try {
      setLoading(true)
      const result = await salesOrderService.getById(orderId)
      return result
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Create a new sales order
   */
  const createOrder = useCallback(async (orderData) => {
    try {
      setLoading(true)
      setError(null)

      const result = await salesOrderService.create(orderData)

      if (result.success) {
        await loadOrders(1) // Reload from first page to see new order
      }

      return result
    } catch (err) {
      const errorMessage = err.message || 'Failed to create order'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadOrders])

  /**
   * Update an existing sales order
   */
  const updateOrder = useCallback(async (orderId, orderData) => {
    try {
      setLoading(true)
      setError(null)

      const result = await salesOrderService.update(orderId, orderData)

      if (result.success) {
        await loadOrders() // Reload current page
      }

      return result
    } catch (err) {
      const errorMessage = err.message || 'Failed to update order'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadOrders])

  /**
   * Delete a sales order
   */
  const deleteOrder = useCallback(async (orderId) => {
    try {
      setLoading(true)
      setError(null)

      const result = await salesOrderService.delete(orderId)

      if (result.success) {
        await loadOrders()
      }

      return result
    } catch (err) {
      const errorMessage = err.message || 'Failed to delete order'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadOrders])

  /**
   * Update order status
   */
  const updateStatus = useCallback(async (orderId, newStatus) => {
    try {
      setLoading(true)
      setError(null)

      const result = await salesOrderService.updateStatus(orderId, newStatus)

      if (result.success) {
        // Update local state immediately for responsive UI
        setOrders(prev => prev.map(order =>
          order.id === orderId
            ? { ...order, status: newStatus }
            : order
        ))
      }

      return result
    } catch (err) {
      const errorMessage = err.message || 'Failed to update status'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Generate invoice for a delivered order
   */
  const generateInvoice = useCallback(async (orderId) => {
    try {
      setLoading(true)
      setError(null)

      const result = await salesOrderService.generateInvoice(orderId)

      if (result.success) {
        // Reload both orders and invoices
        await Promise.all([loadOrders(), loadInvoices()])
      }

      return result
    } catch (err) {
      const errorMessage = err.message || 'Failed to generate invoice'
      setError(errorMessage)
      return { success: false, error: errorMessage }
    } finally {
      setLoading(false)
    }
  }, [loadOrders, loadInvoices])

  /**
   * Update invoice status
   */
  const updateInvoiceStatus = useCallback(async (invoiceId, newStatus) => {
    try {
      setLoading(true)

      const result = await salesOrderService.updateInvoiceStatus(invoiceId, newStatus)

      if (result.success) {
        setInvoices(prev => prev.map(inv =>
          inv.id === invoiceId
            ? { ...inv, status: newStatus }
            : inv
        ))
      }

      return result
    } catch (err) {
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [])

  /**
   * Set current page for pagination
   */
  const setPage = useCallback((newPage) => {
    loadOrders(newPage)
  }, [loadOrders])

  /**
   * Calculate summary statistics from current orders
   */
  const getSummaryStats = useCallback(() => {
    const stats = {
      totalOrders: orders.length,
      pendingOrders: 0,
      deliveredOrders: 0,
      totalRevenue: 0,
      pendingRevenue: 0,
      averageOrderValue: 0,
      totalInvoices: invoices.length,
      paidInvoices: 0,
      overdueInvoices: 0
    }

    orders.forEach(order => {
      const amount = parseFloat(order.totalAmount) || 0

      if (order.status === 'delivered') {
        stats.deliveredOrders++
        stats.totalRevenue += amount
      } else if (order.status !== 'cancelled') {
        stats.pendingOrders++
        stats.pendingRevenue += amount
      }
    })

    invoices.forEach(invoice => {
      if (invoice.status === 'paid') {
        stats.paidInvoices++
      } else if (invoice.status === 'overdue') {
        stats.overdueInvoices++
      }
    })

    if (orders.length > 0) {
      const totalValue = orders.reduce((sum, o) =>
        sum + (parseFloat(o.totalAmount) || 0), 0
      )
      stats.averageOrderValue = totalValue / orders.length
    }

    return stats
  }, [orders, invoices])

  /**
   * Get orders filtered by status
   */
  const getOrdersByStatus = useCallback((status) => {
    if (!status || status === 'all') return orders
    return orders.filter(o => o.status === status)
  }, [orders])

  /**
   * Get invoices filtered by status
   */
  const getInvoicesByStatus = useCallback((status) => {
    if (!status || status === 'all') return invoices
    return invoices.filter(i => i.status === status)
  }, [invoices])

  /**
   * Status options for filters
   */
  const statusOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'cancelled', label: 'Cancelled' }
  ], [])

  const invoiceStatusOptions = useMemo(() => [
    { value: 'all', label: 'All' },
    { value: 'draft', label: 'Draft' },
    { value: 'sent', label: 'Sent' },
    { value: 'paid', label: 'Paid' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'cancelled', label: 'Cancelled' }
  ], [])

  /**
   * Load all data (orders, invoices, summary)
   */
  const loadAllData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      await Promise.all([
        loadOrders(1),
        loadInvoices(),
        loadTodaysSummary()
      ])
    } catch (err) {
      setError(err.message || 'Failed to load sales data')
    } finally {
      setLoading(false)
    }
  }, [loadOrders, loadInvoices, loadTodaysSummary])

  /**
   * Refresh all data
   */
  const refresh = useCallback(async () => {
    await loadAllData()
  }, [loadAllData])

  // Load initial data - dependencies are external options only
  useEffect(() => {
    loadAllData()
  }, [projectId]) // eslint-disable-line react-hooks/exhaustive-deps

  return {
    // State
    orders,
    invoices,
    todaysSummary,
    loading,
    error,
    pagination,

    // Pagination
    setPage,

    // CRUD Operations
    loadOrders,
    loadOrder,
    createOrder,
    updateOrder,
    deleteOrder,
    updateStatus,

    // Invoice Operations
    loadInvoices,
    generateInvoice,
    updateInvoiceStatus,

    // Summary
    loadTodaysSummary,

    // Helpers
    refresh,
    getSummaryStats,
    getOrdersByStatus,
    getInvoicesByStatus,
    statusOptions,
    invoiceStatusOptions
  }
}

export default useSalesOrders
