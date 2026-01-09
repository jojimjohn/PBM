/**
 * Data Cache Service
 *
 * Caches frequently-accessed static data (materials, suppliers, branches, etc.)
 * to reduce redundant API calls across pages.
 *
 * PERFORMANCE OPTIMIZATION:
 * - Materials list doesn't change often - cache for 5 minutes
 * - Suppliers list rarely changes - cache for 5 minutes
 * - Branches are static - cache for 10 minutes
 * - Invalidate cache on logout or company switch
 *
 * EDGE CASES HANDLED:
 * - Multi-tenant: Cache keys include company ID to prevent data leaks
 * - CRUD operations: Call invalidate() after create/update/delete
 * - Company switch: Call setCompanyId() to clear and reset cache
 * - Stale data: Returns stale data on error (graceful degradation)
 */

import materialService from './materialService'
import supplierService from './supplierService'
import branchService from './branchService'
import customerService from './customerService'
import purchaseOrderService from './purchaseOrderService'
import pettyCashService from './pettyCashService'
import roleService from './roleService'
import inventoryService from './inventoryService'
import { calloutService } from './collectionService'

const CACHE_DURATION = {
  // Static reference data - longer TTL
  materials: 5 * 60 * 1000,      // 5 minutes
  suppliers: 5 * 60 * 1000,      // 5 minutes
  customers: 5 * 60 * 1000,      // 5 minutes
  branches: 10 * 60 * 1000,      // 10 minutes
  materialCategories: 10 * 60 * 1000, // 10 minutes

  // Transactional data - shorter TTL (changes more frequently)
  purchaseOrders: 2 * 60 * 1000,  // 2 minutes
  pettyCashCards: 2 * 60 * 1000,  // 2 minutes
  pettyCashExpenses: 2 * 60 * 1000, // 2 minutes
  pettyCashUsers: 3 * 60 * 1000,  // 3 minutes
  collectionOrders: 2 * 60 * 1000, // 2 minutes
  roles: 5 * 60 * 1000,           // 5 minutes (rarely changes)
  inventory: 2 * 60 * 1000,       // 2 minutes
  stockMovements: 2 * 60 * 1000   // 2 minutes
}

class DataCacheService {
  constructor() {
    this.cache = new Map()
    this.pendingRequests = new Map() // Prevent duplicate concurrent requests
    this.companyId = null // Track current company for multi-tenant isolation
  }

  /**
   * Set current company ID - clears cache if company changes
   * Call this when user switches companies
   */
  setCompanyId(companyId) {
    if (this.companyId !== companyId) {
      this.clearAll() // Clear cache when company changes
      this.companyId = companyId
    }
  }

  /**
   * Generate company-specific cache key
   */
  getCacheKey(baseKey) {
    return this.companyId ? `${this.companyId}:${baseKey}` : baseKey
  }

  /**
   * Get cached data or fetch from API
   * @param {string} baseKey - Base cache key (e.g., 'materials', 'suppliers')
   * @param {Function} fetchFn - Function to fetch data if not cached
   * @param {number} duration - Cache duration in ms
   * @returns {Promise<any>} - Cached or freshly fetched data
   */
  async getOrFetch(baseKey, fetchFn, duration) {
    const key = this.getCacheKey(baseKey) // Company-specific key
    const cached = this.cache.get(key)
    const now = Date.now()

    // Return cached data if still valid
    if (cached && (now - cached.timestamp) < duration) {
      return cached.data
    }

    // Check if there's already a pending request for this key
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key)
    }

    // Create new fetch promise
    const fetchPromise = fetchFn().then(result => {
      if (result.success) {
        this.cache.set(key, {
          data: result.data,
          timestamp: now
        })
        return result.data
      }
      return cached?.data || [] // Return stale data or empty array on error
    }).catch(error => {
      console.error(`Cache fetch error for ${key}:`, error)
      return cached?.data || []
    }).finally(() => {
      this.pendingRequests.delete(key)
    })

    this.pendingRequests.set(key, fetchPromise)
    return fetchPromise
  }

  /**
   * Get materials list (cached)
   */
  async getMaterials() {
    return this.getOrFetch(
      'materials',
      () => materialService.getAll(),
      CACHE_DURATION.materials
    )
  }

  /**
   * Get suppliers list (cached)
   */
  async getSuppliers() {
    return this.getOrFetch(
      'suppliers',
      () => supplierService.getAll(),
      CACHE_DURATION.suppliers
    )
  }

  /**
   * Get customers list (cached)
   */
  async getCustomers() {
    return this.getOrFetch(
      'customers',
      () => customerService.getAll(),
      CACHE_DURATION.customers
    )
  }

  /**
   * Get branches list (cached)
   */
  async getBranches() {
    return this.getOrFetch(
      'branches',
      () => branchService.getAll(),
      CACHE_DURATION.branches
    )
  }

  /**
   * Get material categories (cached)
   */
  async getMaterialCategories() {
    return this.getOrFetch(
      'materialCategories',
      () => materialService.getCategories(),
      CACHE_DURATION.materialCategories
    )
  }

  // =====================================================
  // TRANSACTIONAL DATA CACHING (shorter TTL)
  // =====================================================

  /**
   * Get purchase orders (cached)
   * @param {Object} options - Optional filters (status, search, etc.)
   */
  async getPurchaseOrders(options = {}) {
    // Create cache key based on options for filtered caching
    const optionsKey = Object.keys(options).length > 0
      ? `:${JSON.stringify(options)}`
      : ''
    return this.getOrFetch(
      `purchaseOrders${optionsKey}`,
      () => purchaseOrderService.getAll(options),
      CACHE_DURATION.purchaseOrders
    )
  }

  /**
   * Get petty cash cards (cached)
   */
  async getPettyCashCards() {
    return this.getOrFetch(
      'pettyCashCards',
      () => pettyCashService.getAllCards(),
      CACHE_DURATION.pettyCashCards
    )
  }

  /**
   * Get petty cash expenses (cached)
   */
  async getPettyCashExpenses() {
    return this.getOrFetch(
      'pettyCashExpenses',
      () => pettyCashService.getAllExpenses(),
      CACHE_DURATION.pettyCashExpenses
    )
  }

  /**
   * Get petty cash users (cached)
   */
  async getPettyCashUsers(options = {}) {
    const optionsKey = Object.keys(options).length > 0
      ? `:${JSON.stringify(options)}`
      : ''
    return this.getOrFetch(
      `pettyCashUsers${optionsKey}`,
      () => pettyCashService.getAllUsers(options),
      CACHE_DURATION.pettyCashUsers
    )
  }

  /**
   * Get collection orders/callouts (cached)
   * @param {Object} params - Optional filters (status, priority, etc.)
   */
  async getCollectionOrders(params = {}) {
    const paramsKey = Object.keys(params).length > 0
      ? `:${JSON.stringify(params)}`
      : ''
    return this.getOrFetch(
      `collectionOrders${paramsKey}`,
      async () => {
        const result = await calloutService.getCallouts(params)
        return result
      },
      CACHE_DURATION.collectionOrders
    )
  }

  /**
   * Get roles (cached)
   */
  async getRoles(filters = {}) {
    const filtersKey = Object.keys(filters).length > 0
      ? `:${JSON.stringify(filters)}`
      : ''
    return this.getOrFetch(
      `roles${filtersKey}`,
      () => roleService.getAll(filters),
      CACHE_DURATION.roles
    )
  }

  /**
   * Get inventory (cached)
   */
  async getInventory() {
    return this.getOrFetch(
      'inventory',
      () => inventoryService.getAll(),
      CACHE_DURATION.inventory
    )
  }

  /**
   * Get stock movements (cached)
   * @param {Object} filters - Optional filters (startDate, endDate, materialId, type)
   */
  async getStockMovements(filters = {}) {
    const filtersKey = Object.keys(filters).length > 0
      ? `:${JSON.stringify(filters)}`
      : ''
    return this.getOrFetch(
      `stockMovements${filtersKey}`,
      () => inventoryService.getStockMovements(filters),
      CACHE_DURATION.stockMovements
    )
  }

  /**
   * Invalidate specific cache entry (uses company-specific key)
   */
  invalidate(baseKey) {
    const key = this.getCacheKey(baseKey)
    this.cache.delete(key)
  }

  /**
   * Invalidate materials cache - call after create/update/delete material
   */
  invalidateMaterials() {
    this.invalidate('materials')
    this.invalidate('materialCategories')
  }

  /**
   * Invalidate suppliers cache - call after create/update/delete supplier
   */
  invalidateSuppliers() {
    this.invalidate('suppliers')
  }

  /**
   * Invalidate customers cache - call after create/update/delete customer
   */
  invalidateCustomers() {
    this.invalidate('customers')
  }

  /**
   * Invalidate branches cache - call after create/update/delete branch
   */
  invalidateBranches() {
    this.invalidate('branches')
  }

  // =====================================================
  // TRANSACTIONAL DATA INVALIDATION
  // =====================================================

  /**
   * Invalidate purchase orders cache - call after create/update/delete PO
   */
  invalidatePurchaseOrders() {
    // Invalidate all purchase order caches (with and without filters)
    this.invalidateByPrefix('purchaseOrders')
  }

  /**
   * Invalidate petty cash cards cache
   */
  invalidatePettyCashCards() {
    this.invalidate('pettyCashCards')
  }

  /**
   * Invalidate petty cash expenses cache
   */
  invalidatePettyCashExpenses() {
    this.invalidate('pettyCashExpenses')
  }

  /**
   * Invalidate petty cash users cache
   */
  invalidatePettyCashUsers() {
    this.invalidateByPrefix('pettyCashUsers')
  }

  /**
   * Invalidate all petty cash related caches
   */
  invalidatePettyCash() {
    this.invalidatePettyCashCards()
    this.invalidatePettyCashExpenses()
    this.invalidatePettyCashUsers()
  }

  /**
   * Invalidate collection orders cache
   */
  invalidateCollectionOrders() {
    this.invalidateByPrefix('collectionOrders')
  }

  /**
   * Invalidate roles cache
   */
  invalidateRoles() {
    this.invalidateByPrefix('roles')
  }

  /**
   * Invalidate inventory cache
   */
  invalidateInventory() {
    this.invalidate('inventory')
    this.invalidateByPrefix('stockMovements')
  }

  /**
   * Invalidate stock movements cache
   */
  invalidateStockMovements() {
    this.invalidateByPrefix('stockMovements')
  }

  /**
   * Invalidate all caches with a given prefix
   * Useful for invalidating filtered caches
   */
  invalidateByPrefix(prefix) {
    const companyPrefix = this.companyId ? `${this.companyId}:${prefix}` : prefix
    for (const key of this.cache.keys()) {
      if (key.startsWith(companyPrefix)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear all cached data
   * Call this on logout or company switch
   */
  clearAll() {
    this.cache.clear()
    this.pendingRequests.clear()
  }

  /**
   * Prefetch commonly used data
   * Call this after login to warm up the cache
   */
  async prefetch() {
    // Fire all requests in parallel
    await Promise.all([
      this.getMaterials().catch(() => []),
      this.getSuppliers().catch(() => []),
      this.getBranches().catch(() => [])
    ])
  }

  /**
   * Prefetch transactional data for faster page loads
   * Call this in the background after initial page load
   */
  async prefetchTransactional() {
    // Fire all requests in parallel - don't wait for completion
    Promise.all([
      this.getPurchaseOrders().catch(() => []),
      this.getPettyCashCards().catch(() => []),
      this.getCollectionOrders().catch(() => []),
      this.getRoles().catch(() => []),
      this.getInventory().catch(() => [])
    ])
  }

  /**
   * Check if data is cached and valid
   */
  isCached(key, duration) {
    const cached = this.cache.get(key)
    if (!cached) return false
    return (Date.now() - cached.timestamp) < duration
  }
}

// Singleton instance
const dataCacheService = new DataCacheService()

export default dataCacheService
