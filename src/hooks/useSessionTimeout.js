/**
 * Session Timeout Hook - Server-Side Timeout Implementation
 *
 * ARCHITECTURE:
 * - Session timeout is managed SERVER-SIDE (no client-side activity tracking)
 * - Client periodically checks session status to show warning dialog
 * - User can manually extend session via "Stay logged in" button
 * - API calls through authService automatically extend session (server-side)
 *
 * FEATURES:
 * - Page Visibility API: Stops polling when tab is hidden (saves bandwidth)
 * - NO client-side activity tracking (no mousemove, click, keypress listeners)
 * - Periodic status check to display warning modal before timeout
 * - Manual session extension via button click
 * - Handles REFRESH_IN_PROGRESS: Retries when concurrent refresh detected
 *
 * Usage:
 * const { showWarning, remainingMinutes, extendSession } = useSessionTimeout(isAuthenticated, logout);
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { API_BASE_URL } from '../config/api.js';
import authService from '../services/authService.js';

// Configuration - matches backend sessionConfig.js
const WARNING_THRESHOLD_MINUTES = 5; // Show warning 5 minutes before timeout
const CHECK_INTERVAL_MS = 60 * 1000; // Check session status every 60 seconds
const REFRESH_BASE_DELAY_MS = 500; // Base delay for exponential backoff (500ms)
const MAX_REFRESH_DELAY_MS = 5000; // Maximum delay cap (5 seconds)
const MAX_REFRESH_RETRIES = 3; // Maximum retry attempts for token refresh

// NOTE: API activity callbacks have been removed
// Session extension is now purely server-side - the server extends
// session on non-passive API calls automatically

/**
 * Calculate delay with exponential backoff and jitter
 * Prevents thundering herd problem when multiple tabs retry simultaneously
 *
 * @param {number} attempt - Current retry attempt (0-indexed)
 * @param {number} retryAfter - Server-suggested retry time in seconds (optional)
 * @returns {number} Delay in milliseconds
 */
const calculateBackoffDelay = (attempt, retryAfter = null) => {
  // If server provided Retry-After, use it as base
  const baseDelay = retryAfter ? retryAfter * 1000 : REFRESH_BASE_DELAY_MS;

  // Exponential backoff: base * 2^attempt
  const exponentialDelay = baseDelay * Math.pow(2, attempt);

  // Cap at maximum delay
  const cappedDelay = Math.min(exponentialDelay, MAX_REFRESH_DELAY_MS);

  // Add jitter: ±25% random variance to prevent synchronized retries
  const jitter = cappedDelay * 0.25 * (Math.random() * 2 - 1);

  return Math.floor(cappedDelay + jitter);
};

// Check if we're in development mode
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

/**
 * Conditional logger - only logs in development mode
 * Prevents internal state from leaking to production users
 */
const devLog = isDevelopment
  ? (message, ...args) => console.log(`[Session] ${message}`, ...args)
  : () => {};

const devWarn = isDevelopment
  ? (message, ...args) => console.warn(`[Session] ${message}`, ...args)
  : () => {};

export const useSessionTimeout = (isAuthenticated, onSessionExpired = null) => {
  const [sessionStatus, setSessionStatus] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false);
  const [isExtending, setIsExtending] = useState(false);
  const [isPageVisible, setIsPageVisible] = useState(true);

  // Use refs for values accessed in callbacks to avoid recreation
  const checkIntervalRef = useRef(null);
  const warningDismissedRef = useRef(false);
  const onSessionExpiredRef = useRef(onSessionExpired);
  const isPageVisibleRef = useRef(true);

  // Ref for synchronous extendSession lock (prevents double-click race)
  const isExtendingRef = useRef(false);

  // Ref for visibility change timeout (allows cleanup on unmount)
  const visibilityTimeoutRef = useRef(null);

  // Keep refs in sync with state/props
  useEffect(() => {
    warningDismissedRef.current = warningDismissed;
  }, [warningDismissed]);

  useEffect(() => {
    onSessionExpiredRef.current = onSessionExpired;
  }, [onSessionExpired]);

  useEffect(() => {
    isPageVisibleRef.current = isPageVisible;
  }, [isPageVisible]);

  // Ref to hold the current fetchSessionStatus function
  // This prevents stale closure issues in the visibility change handler
  const fetchSessionStatusRef = useRef(null);

  /**
   * Handle page visibility changes
   * Stops polling when tab is hidden to save bandwidth
   * FIXES: Debounces rapid tab switches, cleans up timeout on unmount
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsPageVisible(visible);

      if (visible && isAuthenticated) {
        // Tab became visible - do an immediate status check
        devLog('Tab visible - checking session status');

        // Cancel any previous pending timeout (debounce rapid tab switches)
        if (visibilityTimeoutRef.current) {
          clearTimeout(visibilityTimeoutRef.current);
        }

        // Small delay to avoid race with other initialization
        visibilityTimeoutRef.current = setTimeout(() => {
          visibilityTimeoutRef.current = null;
          // Use ref to always get the latest function version
          if (isPageVisibleRef.current && fetchSessionStatusRef.current) {
            fetchSessionStatusRef.current();
          }
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      // Clean up any pending timeout on unmount
      if (visibilityTimeoutRef.current) {
        clearTimeout(visibilityTimeoutRef.current);
        visibilityTimeoutRef.current = null;
      }
    };
  }, [isAuthenticated]); // Dependencies are correct - ref handles fetchSessionStatus

  /**
   * Handle session expiration - logout and redirect
   * STABLE: Only depends on ref, not state
   */
  const handleSessionExpired = useCallback(async (reason = 'expired') => {
    devLog(`Session ${reason} - triggering logout`);
    setSessionStatus(null);
    setShowWarning(false);

    if (onSessionExpiredRef.current) {
      try {
        await onSessionExpiredRef.current();
      } catch (e) {
        devWarn('Logout callback error:', e);
      }
    }

    window.location.href = '/login';
  }, []); // No dependencies - uses ref

  /**
   * Process session status response and update state
   * STABLE: Uses refs for warningDismissed check
   */
  const processSessionResponse = useCallback((data) => {
    if (!data.success) return;

    setSessionStatus(data.data);
    const remainingMinutes = data.data.remainingMinutes || 0;

    // Session actually expired - force logout
    if (remainingMinutes <= 0 || !data.data.active) {
      handleSessionExpired('timeout');
      return;
    }

    // Check if we should show warning
    const shouldShowWarning = remainingMinutes <= WARNING_THRESHOLD_MINUTES && remainingMinutes > 0;

    // Use ref to avoid callback recreation when warningDismissed changes
    const dismissed = warningDismissedRef.current;

    // Show warning if threshold reached AND user hasn't dismissed it
    // OR if remaining time is critically low (<=2 minutes) - always show
    if (shouldShowWarning && (!dismissed || remainingMinutes <= 2)) {
      setShowWarning(true);
    } else if (!shouldShowWarning) {
      setWarningDismissed(false);
      setShowWarning(false);
    }
  }, [handleSessionExpired]); // Only depends on stable handleSessionExpired

  /**
   * Refresh token with retry logic for REFRESH_IN_PROGRESS
   * Uses exponential backoff with jitter to prevent thundering herd
   * @param {number} retryCount - Current retry attempt
   * @returns {Promise<boolean>} - Success status
   */
  const refreshTokenWithRetry = useCallback(async (retryCount = 0) => {
    try {
      await authService.refreshAccessToken();
      return true;
    } catch (error) {
      // Handle REFRESH_IN_PROGRESS (429) - another tab is refreshing
      if (error.code === 'REFRESH_IN_PROGRESS' && retryCount < MAX_REFRESH_RETRIES) {
        // Calculate delay with exponential backoff and jitter
        const delay = calculateBackoffDelay(retryCount, error.retryAfter);
        devLog(`Refresh in progress, retrying in ${delay}ms (attempt ${retryCount + 1}/${MAX_REFRESH_RETRIES})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return refreshTokenWithRetry(retryCount + 1);
      }
      throw error;
    }
  }, []);

  /**
   * Fetch current session status from server
   * STABLE: Doesn't depend on warningDismissed (uses ref instead)
   */
  const fetchSessionStatus = useCallback(async () => {
    // Skip if not authenticated or page is hidden
    if (!isAuthenticated || !isPageVisibleRef.current) {
      if (!isAuthenticated) {
        setSessionStatus(null);
        setShowWarning(false);
      }
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/auth/session/status`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        processSessionResponse(data);
      } else if (response.status === 401) {
        // Try token refresh first
        devLog('Got 401, attempting token refresh...');

        try {
          await refreshTokenWithRetry();
          devLog('Token refreshed, retrying status check');

          // Retry with new token
          const retryResponse = await fetch(`${API_BASE_URL}/auth/session/status`, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData.success && retryData.data.active) {
              processSessionResponse(retryData);
              return;
            }
          }
        } catch (refreshError) {
          devLog('Token refresh failed:', refreshError.message);
        }

        // Both original request and refresh failed - session is truly dead
        await handleSessionExpired('auth_failed');
      }
    } catch (error) {
      // Use console.debug for noise - it's filtered by default in browsers
      if (isDevelopment) {
        console.debug('[Session] Status check failed:', error.message);
      }
    }
  }, [isAuthenticated, processSessionResponse, handleSessionExpired, refreshTokenWithRetry]);

  // Keep fetchSessionStatusRef in sync with the latest fetchSessionStatus function
  // This allows the visibility change handler to always call the current version
  useEffect(() => {
    fetchSessionStatusRef.current = fetchSessionStatus;
  }, [fetchSessionStatus]);

  /**
   * Extend session explicitly (called when user clicks "Stay logged in")
   * FIXED: Uses ref for synchronous lock to prevent double-click race condition
   */
  const extendSession = useCallback(async () => {
    // Use ref for immediate synchronous check (state updates are batched/async)
    if (!isAuthenticated || isExtendingRef.current) return false;

    // Set both ref (immediate) and state (for UI)
    isExtendingRef.current = true;
    setIsExtending(true);

    try {
      let response = await fetch(`${API_BASE_URL}/auth/session/extend`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });

      // Handle 401 - try refresh first
      if (response.status === 401) {
        try {
          await refreshTokenWithRetry();
          response = await fetch(`${API_BASE_URL}/auth/session/extend`, {
            method: 'POST',
            credentials: 'include',
            headers: { 'Content-Type': 'application/json' },
          });
        } catch (refreshError) {
          devWarn('Token refresh failed during extend:', refreshError.message);
          return false;
        }
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowWarning(false);
          setWarningDismissed(false);
          await fetchSessionStatus();
          return true;
        }
      }
      return false;
    } catch (error) {
      devWarn('Failed to extend session:', error);
      return false;
    } finally {
      // Clear both ref and state
      isExtendingRef.current = false;
      setIsExtending(false);
    }
  }, [isAuthenticated, fetchSessionStatus, refreshTokenWithRetry]); // Removed isExtending - using ref now

  /**
   * Dismiss warning temporarily (will re-appear if time drops to <=2 minutes)
   */
  const dismissWarning = useCallback(() => {
    setWarningDismissed(true);
    setShowWarning(false);
  }, []);

  // NOTE: Silent session extension via API activity has been REMOVED
  // Session timeout is now purely server-side:
  // - Server extends session on non-passive API calls automatically
  // - Frontend only shows warning dialog and allows manual "Stay logged in"
  // - No frontend-initiated session extension on API activity

  // Set up periodic session status check - uses stable fetchSessionStatus
  // Only runs when page is visible
  useEffect(() => {
    if (!isAuthenticated) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch (only if page is visible)
    if (isPageVisible) {
      fetchSessionStatus();
    }

    // Set up interval (checks visibility internally)
    checkIntervalRef.current = setInterval(() => {
      // Only fetch if page is visible
      if (isPageVisibleRef.current) {
        fetchSessionStatus();
      }
    }, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, isPageVisible, fetchSessionStatus]);

  // Memoize return value to prevent unnecessary re-renders in consumers
  return useMemo(() => ({
    sessionStatus,
    showWarning,
    remainingMinutes: sessionStatus?.remainingMinutes || 0,
    timeoutMinutes: sessionStatus?.timeoutMinutes || 30,
    extendSession,
    isExtending,
    dismissWarning,
    warningDismissed,
    isDevelopmentMode: isDevelopment,
    isPageVisible,
  }), [sessionStatus, showWarning, extendSession, isExtending, dismissWarning, warningDismissed, isPageVisible]);
};

export default useSessionTimeout;
