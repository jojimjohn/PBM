import { API_BASE_URL } from '../config/api'
import authService from './authService'

/**
 * Transaction Service
 * Handles inventory transaction operations (purchases, sales, adjustments, wastages, transfers)
 */
const transactionService = {
  /**
   * Get all transactions with filtering
   * @param {Object} params - Query parameters
   * @param {string} params.transactionType - Filter by type (purchase, sale, adjustment, wastage, transfer)
   * @param {number} params.materialId - Filter by material ID
   * @param {string} params.referenceType - Filter by reference type (po, so, wcn, adjustment, wastage)
   * @param {string} params.dateFrom - Filter from date (YYYY-MM-DD)
   * @param {string} params.dateTo - Filter to date (YYYY-MM-DD)
   * @param {string} params.search - Search in transaction number and description
   * @param {number} params.limit - Number of records (default 50)
   * @param {number} params.offset - Pagination offset (default 0)
   * @returns {Promise<Object>} Response with transactions array
   */
  async getAll(params = {}) {
    try {
      const queryParams = new URLSearchParams()

      if (params.transactionType) queryParams.append('transactionType', params.transactionType)
      if (params.materialId) queryParams.append('materialId', params.materialId)
      if (params.referenceType) queryParams.append('referenceType', params.referenceType)
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params.dateTo) queryParams.append('dateTo', params.dateTo)
      if (params.search) queryParams.append('search', params.search)
      if (params.limit) queryParams.append('limit', params.limit)
      if (params.offset) queryParams.append('offset', params.offset)
      if (params.createdBy) queryParams.append('createdBy', params.createdBy)

      const url = `${API_BASE_URL}/transactions?${queryParams.toString()}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error('Error fetching transactions:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch transactions'
      }
    }
  },

  /**
   * Get single transaction by ID
   * @param {number} transactionId - Transaction ID
   * @returns {Promise<Object>} Response with transaction data
   */
  async getById(transactionId) {
    try {
      const url = `${API_BASE_URL}/transactions/${transactionId}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error(`Error fetching transaction ${transactionId}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch transaction'
      }
    }
  },

  /**
   * Create a new transaction
   * @param {Object} transactionData - Transaction data
   * @returns {Promise<Object>} Response with created transaction
   */
  async create(transactionData) {
    try {
      const url = `${API_BASE_URL}/transactions`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify(transactionData)
      })
      return data
    } catch (error) {
      console.error('Error creating transaction:', error)
      return {
        success: false,
        error: error.message || 'Failed to create transaction'
      }
    }
  },

  /**
   * Create multiple transactions in bulk
   * @param {Array} transactions - Array of transaction data objects
   * @returns {Promise<Object>} Response with created transactions
   */
  async createBulk(transactions) {
    try {
      const url = `${API_BASE_URL}/transactions/bulk`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'POST',
        body: JSON.stringify({ transactions })
      })
      return data
    } catch (error) {
      console.error('Error creating bulk transactions:', error)
      return {
        success: false,
        error: error.message || 'Failed to create bulk transactions'
      }
    }
  },

  /**
   * Get transaction analytics summary
   * @param {Object} params - Query parameters
   * @param {string} params.dateFrom - From date
   * @param {string} params.dateTo - To date
   * @returns {Promise<Object>} Response with analytics data
   */
  async getAnalytics(params = {}) {
    try {
      const queryParams = new URLSearchParams()
      if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom)
      if (params.dateTo) queryParams.append('dateTo', params.dateTo)

      const url = `${API_BASE_URL}/transactions/analytics/summary?${queryParams.toString()}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error('Error fetching transaction analytics:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch analytics'
      }
    }
  },

  /**
   * Check if a material has any transaction history
   * @param {number} materialId - Material ID to check
   * @returns {Promise<Object>} { hasTransactions: boolean, count: number }
   */
  async checkMaterialTransactions(materialId) {
    try {
      const response = await this.getAll({
        materialId: materialId,
        limit: 1
      })

      if (!response.success) {
        return { hasTransactions: false, count: 0 }
      }

      const count = response.total || response.data?.length || 0
      return {
        hasTransactions: count > 0,
        count: count
      }
    } catch (error) {
      console.error('Error checking material transactions:', error)
      return { hasTransactions: false, count: 0 }
    }
  },

  /**
   * Get stock movements for inventory page (all transaction types)
   * Maps transaction types to inventory movement display format
   * @param {Object} params - Query parameters
   * @param {number} params.materialId - Filter by material
   * @param {number} params.limit - Number of records
   * @returns {Promise<Array>} Array of stock movements
   */
  async getStockMovements(params = {}) {
    try {
      const response = await this.getAll({
        limit: params.limit || 100,
        materialId: params.materialId,
        ...params
      })

      if (!response.success || !response.data || !Array.isArray(response.data)) {
        console.warn('No stock movements data returned:', response)
        return []
      }

      // Transform transactions to stock movements format
      // Filter out transactions without valid materialId (e.g., payment transactions)
      return response.data
        .filter(tx => tx.materialId != null)
        .map(tx => ({
          id: tx.id,
          materialId: tx.materialId,
          materialName: tx.materialName || '',
          materialCode: tx.materialCode || '',
          // Determine type based on transactionType, not quantity sign
          // Wastage, sale, transfer_out are always 'out' regardless of quantity sign
          type: ['sale', 'wastage', 'transfer', 'transfer_out'].includes(tx.transactionType) ? 'out' : 'in',
          quantity: Math.abs(parseFloat(tx.quantity || 0)),
          date: tx.transactionDate || tx.created_at,
          reason: tx.description || tx.transactionType,
          reference: tx.transactionNumber || tx.referenceId || '-',
          referenceType: tx.referenceType || tx.transactionType,
          transactionType: tx.transactionType,
          unitPrice: tx.unitPrice,
          amount: tx.amount,
          branchId: tx.branchId,
          createdBy: tx.userName || tx.createdBy
        }))
    } catch (error) {
      console.error('Error fetching stock movements:', error)
      return []
    }
  }
}

export default transactionService
