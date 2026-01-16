/**
 * Dashboard Cache Hook - Session-Level Caching (Jan 2026)
 *
 * PURPOSE:
 * Tasks and notifications are NOT real-time data - they're "session-level alerts"
 * that don't need to refresh every time the user navigates to the dashboard.
 *
 * CACHING STRATEGY:
 * - Cache in sessionStorage (persists for browser session, cleared on tab close)
 * - TTL: 5 minutes (configurable) - after which cache is considered stale
 * - Refresh triggers:
 *   1. First load (no cache)
 *   2. Manual refresh button click
 *   3. Cache expired (TTL exceeded)
 *   4. Project selection changed
 *   5. Company changed
 *
 * USAGE:
 * const { data, loading, refresh, lastUpdated, isStale } = useDashboardCache(
 *   'pending-actions',
 *   () => workflowService.getPendingActions(params),
 *   { ttlMinutes: 5, enabled: isAuthenticated }
 * );
 */

import { useState, useEffect, useCallback, useRef } from 'react';

// Default cache configuration
const DEFAULT_TTL_MINUTES = 5;
const CACHE_PREFIX = 'dashboard_cache_';

/**
 * Get cached data from sessionStorage
 */
const getCachedData = (key, projectId, companyId) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}_${companyId}_${projectId || 'all'}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (!cached) return null;

    const { data, timestamp, projectId: cachedProjectId, companyId: cachedCompanyId } = JSON.parse(cached);

    // Validate cache is for the same context
    if (cachedProjectId !== projectId || cachedCompanyId !== companyId) {
      return null;
    }

    return { data, timestamp };
  } catch (error) {
    console.warn('[DashboardCache] Error reading cache:', error);
    return null;
  }
};

/**
 * Set cached data in sessionStorage
 */
const setCachedData = (key, data, projectId, companyId) => {
  try {
    const cacheKey = `${CACHE_PREFIX}${key}_${companyId}_${projectId || 'all'}`;
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      projectId,
      companyId
    };
    sessionStorage.setItem(cacheKey, JSON.stringify(cacheEntry));
  } catch (error) {
    console.warn('[DashboardCache] Error writing cache:', error);
  }
};

/**
 * Clear all dashboard caches (useful on logout)
 */
export const clearDashboardCache = () => {
  try {
    const keysToRemove = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(CACHE_PREFIX)) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    console.log('[DashboardCache] Cleared all dashboard caches');
  } catch (error) {
    console.warn('[DashboardCache] Error clearing cache:', error);
  }
};

/**
 * Custom hook for session-level dashboard data caching
 *
 * @param {string} cacheKey - Unique key for this data type (e.g., 'pending-actions')
 * @param {Function} fetchFn - Async function to fetch data from API
 * @param {Object} options - Configuration options
 * @param {number} options.ttlMinutes - Cache TTL in minutes (default: 5)
 * @param {boolean} options.enabled - Whether to enable fetching (default: true)
 * @param {string} options.projectId - Current project ID for cache invalidation
 * @param {string} options.companyId - Current company ID for cache invalidation
 * @param {*} options.defaultValue - Default value when no data (default: null)
 */
const useDashboardCache = (cacheKey, fetchFn, options = {}) => {
  const {
    ttlMinutes = DEFAULT_TTL_MINUTES,
    enabled = true,
    projectId = null,
    companyId = null,
    defaultValue = null
  } = options;

  const [data, setData] = useState(defaultValue);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Use ref to track if we've done initial load
  const initialLoadDone = useRef(false);
  const fetchFnRef = useRef(fetchFn);

  // Keep fetchFn ref updated
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  /**
   * Check if cache is stale (exceeded TTL)
   */
  const isStale = useCallback(() => {
    if (!lastUpdated) return true;
    const ageMs = Date.now() - lastUpdated;
    const ttlMs = ttlMinutes * 60 * 1000;
    return ageMs > ttlMs;
  }, [lastUpdated, ttlMinutes]);

  /**
   * Fetch fresh data from API and update cache
   */
  const fetchData = useCallback(async (force = false) => {
    if (!enabled) return;
    if (loading) return; // Prevent duplicate fetches

    // Check cache first (unless forced refresh)
    if (!force) {
      const cached = getCachedData(cacheKey, projectId, companyId);
      if (cached) {
        const ageMs = Date.now() - cached.timestamp;
        const ttlMs = ttlMinutes * 60 * 1000;

        if (ageMs < ttlMs) {
          // Cache is fresh - use it
          console.log(`[DashboardCache] Using cached ${cacheKey} (age: ${Math.round(ageMs / 1000)}s)`);
          setData(cached.data);
          setLastUpdated(cached.timestamp);
          return;
        }
      }
    }

    // Fetch from API
    setLoading(true);
    setError(null);

    try {
      console.log(`[DashboardCache] Fetching fresh ${cacheKey} from API`);
      const result = await fetchFnRef.current();

      if (result.success) {
        setData(result.data);
        setLastUpdated(Date.now());
        setCachedData(cacheKey, result.data, projectId, companyId);
      } else {
        setError(result.error || 'Failed to fetch data');
        // On error, still use cached data if available
        const cached = getCachedData(cacheKey, projectId, companyId);
        if (cached) {
          setData(cached.data);
          setLastUpdated(cached.timestamp);
        }
      }
    } catch (err) {
      console.error(`[DashboardCache] Error fetching ${cacheKey}:`, err);
      setError(err.message);
      // On error, still use cached data if available
      const cached = getCachedData(cacheKey, projectId, companyId);
      if (cached) {
        setData(cached.data);
        setLastUpdated(cached.timestamp);
      }
    } finally {
      setLoading(false);
    }
  }, [enabled, loading, cacheKey, projectId, companyId, ttlMinutes]);

  /**
   * Manual refresh - always fetches fresh data
   */
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Initial load or context change
  useEffect(() => {
    if (!enabled) return;

    // On context change (project/company), invalidate and refetch
    const cached = getCachedData(cacheKey, projectId, companyId);
    if (cached) {
      // Use cached data immediately
      setData(cached.data);
      setLastUpdated(cached.timestamp);

      // Check if stale and needs refresh
      const ageMs = Date.now() - cached.timestamp;
      const ttlMs = ttlMinutes * 60 * 1000;
      if (ageMs >= ttlMs) {
        // Stale - refresh in background
        fetchData(false);
      }
    } else {
      // No cache - fetch fresh
      fetchData(false);
    }

    initialLoadDone.current = true;
  }, [enabled, cacheKey, projectId, companyId]); // Intentionally exclude fetchData to prevent loops

  return {
    data,
    loading,
    error,
    lastUpdated,
    isStale: isStale(),
    refresh,
    // Utility: time since last update
    ageSeconds: lastUpdated ? Math.round((Date.now() - lastUpdated) / 1000) : null
  };
};

export default useDashboardCache;
