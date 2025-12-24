/**
 * Session Timeout Hook
 *
 * Monitors session activity and provides warning before timeout.
 * Shows a modal before session expires with option to extend.
 *
 * SECURITY: Properly handles 401 responses by:
 * 1. Calling the provided logout callback
 * 2. Redirecting to login page
 *
 * Usage:
 * const { showWarning, remainingMinutes, extendSession } = useSessionTimeout(isAuthenticated, logout);
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/api.js';
import authService from '../services/authService.js';

// Configuration - Warning shows when remaining time is at or below this threshold
const WARNING_THRESHOLD_MINUTES = 5; // Show warning 5 minutes before timeout
const CHECK_INTERVAL_MS = 30 * 1000; // Check session status every 30 seconds (more frequent for better UX)
const ACTIVITY_DEBOUNCE_MS = 30 * 1000; // Debounce activity heartbeat (30 seconds - balances UX and server load)

export const useSessionTimeout = (isAuthenticated, onSessionExpired = null) => {
  const [sessionStatus, setSessionStatus] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningDismissed, setWarningDismissed] = useState(false); // Track if user dismissed warning
  const [isExtending, setIsExtending] = useState(false);
  const lastActivityRef = useRef(Date.now());
  const checkIntervalRef = useRef(null);

  /**
   * Fetch current session status from server
   */
  const fetchSessionStatus = useCallback(async () => {
    if (!isAuthenticated) {
      setSessionStatus(null);
      setShowWarning(false);
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
        if (data.success) {
          setSessionStatus(data.data);

          // Check if we should show warning
          const remainingMinutes = data.data.remainingMinutes || 0;
          const shouldShowWarning = remainingMinutes <= WARNING_THRESHOLD_MINUTES && remainingMinutes > 0;

          // Show warning if threshold reached AND user hasn't dismissed it
          // OR if remaining time is critically low (≤2 minutes) - always show even if dismissed
          if (shouldShowWarning && (!warningDismissed || remainingMinutes <= 2)) {
            setShowWarning(true);
          } else if (!shouldShowWarning) {
            // Reset dismissed state when session is extended and time goes back above threshold
            setWarningDismissed(false);
            setShowWarning(false);
          }
        }
      } else if (response.status === 401) {
        // JWT token may have expired - try to refresh it first
        console.log('[Session] Got 401, attempting token refresh...');

        try {
          // Attempt to refresh the access token using the refresh token
          await authService.refreshAccessToken();
          console.log('[Session] Token refreshed successfully, retrying status check');

          // Retry the session status check with the new token
          const retryResponse = await fetch(`${API_BASE_URL}/auth/session/status`, {
            method: 'GET',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (retryResponse.ok) {
            const retryData = await retryResponse.json();
            if (retryData.success) {
              setSessionStatus(retryData.data);
              const remainingMinutes = retryData.data.remainingMinutes || 0;
              const shouldShowWarning = remainingMinutes <= WARNING_THRESHOLD_MINUTES && remainingMinutes > 0;
              if (shouldShowWarning && (!warningDismissed || remainingMinutes <= 2)) {
                setShowWarning(true);
              } else if (!shouldShowWarning) {
                setWarningDismissed(false);
                setShowWarning(false);
              }
            }
            return; // Successfully recovered
          }
          // Retry also failed, fall through to logout
          console.log('[Session] Retry after refresh still failed');
        } catch (refreshError) {
          // Token refresh failed - session is truly expired
          console.log('[Session] Token refresh failed:', refreshError.message);
        }

        // Session expired or invalid - MUST trigger logout and redirect
        console.log('[Session] Session expired (401) - triggering logout');
        setSessionStatus(null);
        setShowWarning(false);

        // Call the logout callback if provided
        if (onSessionExpired) {
          try {
            await onSessionExpired();
          } catch (e) {
            console.warn('[Session] Logout callback error:', e);
          }
        }

        // Redirect to login page
        window.location.href = '/login';
      }
    } catch (error) {
      // Silent fail - session status check is non-critical
    }
  }, [isAuthenticated, onSessionExpired, warningDismissed]);

  /**
   * Extend session (called when user clicks "Stay logged in")
   * Handles 401 by attempting token refresh before giving up
   */
  const extendSession = useCallback(async () => {
    if (!isAuthenticated || isExtending) return false;

    setIsExtending(true);
    try {
      let response = await fetch(`${API_BASE_URL}/auth/session/extend`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 - try to refresh token first
      if (response.status === 401) {
        console.log('[Session] Extend got 401, attempting token refresh...');
        try {
          await authService.refreshAccessToken();
          // Retry extend with new token
          response = await fetch(`${API_BASE_URL}/auth/session/extend`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (refreshError) {
          console.error('[Session] Token refresh failed during extend:', refreshError.message);
          return false;
        }
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowWarning(false);
          setWarningDismissed(false); // Reset dismissed state on successful extension
          // Refresh session status
          await fetchSessionStatus();
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    } finally {
      setIsExtending(false);
    }
  }, [isAuthenticated, isExtending, fetchSessionStatus]);

  /**
   * Dismiss warning temporarily (will re-appear if time drops to ≤2 minutes)
   */
  const dismissWarning = useCallback(() => {
    setWarningDismissed(true);
    setShowWarning(false);
  }, []);

  /**
   * Send heartbeat to server to update session activity
   * Handles 401 by attempting token refresh before giving up
   */
  const sendHeartbeat = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      let response = await fetch(`${API_BASE_URL}/auth/session/heartbeat`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      // Handle 401 - try to refresh token first
      if (response.status === 401) {
        console.debug('[Session] Heartbeat got 401, attempting token refresh...');
        try {
          await authService.refreshAccessToken();
          // Retry heartbeat with new token
          response = await fetch(`${API_BASE_URL}/auth/session/heartbeat`, {
            method: 'POST',
            credentials: 'include',
            headers: {
              'Content-Type': 'application/json',
            },
          });
        } catch (refreshError) {
          console.debug('[Session] Token refresh failed during heartbeat:', refreshError.message);
          return; // Can't send heartbeat without valid token
        }
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Update session status with the new remaining time
          setSessionStatus(prev => ({
            ...prev,
            remainingMinutes: data.data.remainingMinutes,
            timeoutMinutes: data.data.timeoutMinutes
          }));

          // Hide warning if session was extended and time is above threshold
          if (data.data.remainingMinutes > WARNING_THRESHOLD_MINUTES) {
            setShowWarning(false);
            setWarningDismissed(false);
          }
        }
      }
    } catch (error) {
      // Silent fail - heartbeat is non-critical
      console.debug('[Session] Heartbeat failed:', error.message);
    }
  }, [isAuthenticated]);

  /**
   * Track user activity (debounced)
   * Sends heartbeat to server to reset inactivity timer
   */
  const trackActivity = useCallback(() => {
    const now = Date.now();
    // Only send heartbeat if enough time has passed (debounce to avoid spamming server)
    if (now - lastActivityRef.current > ACTIVITY_DEBOUNCE_MS) {
      lastActivityRef.current = now;
      // Send heartbeat to server to extend session
      sendHeartbeat();
    }
  }, [sendHeartbeat]);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    // Track various user activities
    // - mousedown: clicking
    // - mousemove: moving mouse (reading, hovering) - important for keeping session alive while reading
    // - keydown: typing
    // - scroll: scrolling through content
    // - touchstart: mobile touch interactions
    const events = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      window.addEventListener(event, trackActivity, { passive: true });
    });

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, trackActivity);
      });
    };
  }, [isAuthenticated, trackActivity]);

  // Set up periodic session status check
  useEffect(() => {
    if (!isAuthenticated) {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchSessionStatus();

    // Set up interval
    checkIntervalRef.current = setInterval(fetchSessionStatus, CHECK_INTERVAL_MS);

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
        checkIntervalRef.current = null;
      }
    };
  }, [isAuthenticated, fetchSessionStatus]);

  return {
    sessionStatus,
    showWarning,
    remainingMinutes: sessionStatus?.remainingMinutes || 0,
    timeoutMinutes: sessionStatus?.timeoutMinutes || 30,
    extendSession,
    isExtending,
    dismissWarning,
    warningDismissed, // Expose for UI to show "dismissed" state if needed
  };
};

export default useSessionTimeout;
