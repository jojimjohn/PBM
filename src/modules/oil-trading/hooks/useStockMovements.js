/**
 * useStockMovements Hook
 * Manages stock movements loading and state
 *
 * Extracted from Inventory.jsx to improve composition
 * Now uses inventoryService instead of transactionService
 *
 * @module hooks/useStockMovements
 */
import { useState, useCallback, useRef } from 'react';
import inventoryService from '../../../services/inventoryService';

/**
 * @typedef {import('../types/inventory.types').StockMovement} StockMovement
 * @typedef {import('../types/inventory.types').StockMovementsFilter} StockMovementsFilter
 */

/**
 * @typedef {Object} UseStockMovementsOptions
 * @property {number} [initialLimit=100] - Initial limit for movements
 */

/**
 * @typedef {Object} PaginationState
 * @property {number} page - Current page
 * @property {number} limit - Items per page
 * @property {number} total - Total items
 * @property {boolean} hasMore - Whether more items exist
 */

/**
 * @typedef {Object} UseStockMovementsReturn
 * @property {StockMovement[]} movements - Array of stock movements
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message if any
 * @property {PaginationState} pagination - Pagination state
 * @property {Function} loadMovements - Load movements with filters
 * @property {Function} loadMaterialHistory - Load history for specific material
 * @property {Function} refresh - Refresh with last filters
 */

/**
 * Hook for managing stock movements data
 *
 * @param {UseStockMovementsOptions} [options={}] - Hook options
 * @returns {UseStockMovementsReturn} Stock movements state and actions
 */
export function useStockMovements(options = {}) {
  const { initialLimit = 100 } = options;

  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    hasMore: false
  });

  // Track last filters for refresh functionality
  const lastFiltersRef = useRef({});

  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0);

  /**
   * Load stock movements with optional filters
   * @param {StockMovementsFilter} [filters={}] - Filter options
   */
  const loadMovements = useCallback(async (filters = {}) => {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);
      lastFiltersRef.current = filters;

      const result = await inventoryService.getStockMovements({
        limit: initialLimit,
        ...filters
      });

      // Ignore if a newer request has been made (race condition prevention)
      if (thisRequestId !== requestIdRef.current) return;

      if (result.success && result.data) {
        setMovements(result.data.movements || result.data || []);
        if (result.data.pagination) {
          setPagination(result.data.pagination);
        }
      } else {
        setMovements([]);
        setError(result.error || 'Failed to load movements');
      }
    } catch (err) {
      // Ignore if a newer request has been made
      if (thisRequestId !== requestIdRef.current) return;

      setMovements([]);
      setError(err instanceof Error ? err.message : 'Failed to load movements');
    } finally {
      // Only update loading if this is still the active request
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [initialLimit]);

  /**
   * Load movement history for a specific material
   * Used by StockHistoryModal
   *
   * @param {number} materialId - Material ID
   * @param {number} [limit=50] - Number of records to fetch
   * @returns {Promise<StockMovement[]>} Movement history
   */
  const loadMaterialHistory = useCallback(async (materialId, limit = 50) => {
    try {
      const result = await inventoryService.getBatchMovements({
        materialId,
        limit
      });

      if (result.success && result.data?.movements) {
        return result.data.movements;
      }
      return [];
    } catch {
      return [];
    }
  }, []);

  /**
   * Refresh with last used filters
   */
  const refresh = useCallback(async () => {
    await loadMovements(lastFiltersRef.current);
  }, [loadMovements]);

  return {
    movements,
    loading,
    error,
    pagination,
    loadMovements,
    loadMaterialHistory,
    refresh
  };
}

export default useStockMovements;
