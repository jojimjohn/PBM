/**
 * useCollections Hook
 * Manages collection orders dashboard data and loading
 *
 * Extracted from Collections.jsx to improve composition
 *
 * @module hooks/useCollections
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import { collectionOrderService } from '../../../services/collectionService';

/**
 * @typedef {import('../types/purchase.types').CollectionOrder} CollectionOrder
 * @typedef {import('../types/purchase.types').CollectionDashboardData} CollectionDashboardData
 * @typedef {import('../types/purchase.types').CollectionStatistics} CollectionStatistics
 */

/**
 * @typedef {Object} UseCollectionsOptions
 * @property {number} [statsLimit=50] - Limit for statistics query
 * @property {number} [recentLimit=10] - Limit for recent orders
 */

/**
 * @typedef {Object} UseCollectionsReturn
 * @property {CollectionDashboardData} dashboardData - Dashboard data
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message if any
 * @property {CollectionStatistics} statistics - Calculated statistics
 * @property {Function} loadDashboardData - Load all dashboard data
 * @property {Function} refresh - Refresh dashboard data
 */

const EMPTY_STATISTICS = {
  pending: 0,
  scheduled: 0,
  inTransit: 0,
  collecting: 0,
  completed: 0
};

const EMPTY_DASHBOARD = {
  activeCallouts: [],
  recentOrders: [],
  statistics: EMPTY_STATISTICS
};

/**
 * Calculate statistics from collection orders
 *
 * @param {CollectionOrder[]} orders - Collection orders
 * @returns {CollectionStatistics} Statistics object
 */
function calculateStatistics(orders) {
  return {
    pending: 0, // No more pending callouts in new workflow
    scheduled: orders.filter(o => o.status === 'scheduled').length,
    inTransit: orders.filter(o => o.status === 'in_transit').length,
    collecting: orders.filter(o => o.status === 'collecting').length,
    completed: orders.filter(o => o.status === 'completed').length
  };
}

/**
 * Hook for managing collections dashboard
 *
 * @param {UseCollectionsOptions} [options={}] - Hook options
 * @returns {UseCollectionsReturn} Collections state and actions
 */
export function useCollections(options = {}) {
  const { statsLimit = 50, recentLimit = 10 } = options;

  const [dashboardData, setDashboardData] = useState(EMPTY_DASHBOARD);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0);

  /**
   * Load dashboard data (all orders for stats, recent orders for display)
   */
  const loadDashboardData = useCallback(async () => {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const [allOrdersResponse, recentOrdersResponse] = await Promise.all([
        collectionOrderService.getCollectionOrders({
          page: 1,
          limit: statsLimit
        }).catch(err => ({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to load orders'
        })),
        collectionOrderService.getCollectionOrders({
          page: 1,
          limit: recentLimit
        }).catch(err => ({
          success: false,
          error: err instanceof Error ? err.message : 'Failed to load orders'
        }))
      ]);

      // Ignore if a newer request has been made
      if (thisRequestId !== requestIdRef.current) return;

      // Handle both successful and failed API responses gracefully
      const allOrders = (allOrdersResponse?.success ? allOrdersResponse.data : []) || [];
      const recentOrders = (recentOrdersResponse?.success ? recentOrdersResponse.data : []) || [];

      setDashboardData({
        activeCallouts: [], // Removed functionality
        recentOrders,
        statistics: calculateStatistics(allOrders)
      });

      // Set non-critical errors as warnings (don't fail the whole load)
      if (!allOrdersResponse?.success && !recentOrdersResponse?.success) {
        setError('Failed to load collection data');
      }

    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      setDashboardData(EMPTY_DASHBOARD);
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [statsLimit, recentLimit]);

  /**
   * Refresh dashboard data (alias for loadDashboardData)
   */
  const refresh = useCallback(() => {
    return loadDashboardData();
  }, [loadDashboardData]);

  // Memoized statistics
  const statistics = useMemo(() => dashboardData.statistics, [dashboardData]);

  return {
    dashboardData,
    loading,
    error,
    statistics,
    loadDashboardData,
    refresh
  };
}

export default useCollections;
