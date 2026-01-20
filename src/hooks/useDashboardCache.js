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
  const [refreshing, setRefreshing] = useState(false); // Separate state for manual refresh
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);

  // Use ref to track if we've done initial load and prevent duplicate fetches
  const initialLoadDone = useRef(false);
  const fetchFnRef = useRef(fetchFn);
  const isFetchingRef = useRef(false); // Use ref instead of state for fetch guard

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
   * @param {boolean} force - If true, skip cache check (manual refresh)
   * @param {boolean} isManualRefresh - If true, set refreshing state for UI feedback
   */
  const fetchData = useCallback(async (force = false, isManualRefresh = false) => {
    if (!enabled) return;

    // Use ref to prevent duplicate fetches (avoids closure issues with state)
    if (isFetchingRef.current) {
      console.log(`[DashboardCache] Skipping ${cacheKey} - already fetching`);
      return;
    }

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
    isFetchingRef.current = true;
    setLoading(true);
    if (isManualRefresh) setRefreshing(true);
    setError(null);

    try {
      const result = await fetchFnRef.current();

      if (result && result.success) {
        setData(result.data);
        setLastUpdated(Date.now());
        setCachedData(cacheKey, result.data, projectId, companyId);
      } else {
        setError(result?.error || 'Failed to fetch data');
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
      isFetchingRef.current = false;
      setLoading(false);
      if (isManualRefresh) setRefreshing(false);
    }
  }, [enabled, cacheKey, projectId, companyId, ttlMinutes]); // Removed 'loading' from dependencies

  /**
   * Manual refresh - always fetches fresh data with UI feedback
   * Clears cache first to ensure truly fresh data
   */
  const refresh = useCallback(() => {
    // Clear this key's cache before fetching to ensure fresh data
    try {
      const cacheKeyFull = `${CACHE_PREFIX}${cacheKey}_${companyId}_${projectId || 'all'}`;
      sessionStorage.removeItem(cacheKeyFull);
    } catch (err) {
      // Ignore cache clear errors
    }
    return fetchData(true, true); // force=true, isManualRefresh=true
  }, [fetchData, cacheKey, companyId, projectId]);

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
    refreshing, // Separate state for manual refresh (for UI feedback)
    error,
    lastUpdated,
    isStale: isStale(),
    refresh,
    // Utility: time since last update
    ageSeconds: lastUpdated ? Math.round((Date.now() - lastUpdated) / 1000) : null
  };
};

export default useDashboardCache;
