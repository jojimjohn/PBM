/**
 * Session Timeout Hook
 *
 * Monitors session activity and provides warning before timeout.
 * Shows a modal 5 minutes before session expires with option to extend.
 *
 * Usage:
 * const { showWarning, remainingMinutes, extendSession } = useSessionTimeout();
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { API_BASE_URL } from '../config/api.js';

// Configuration
const WARNING_THRESHOLD_MINUTES = 5; // Show warning 5 minutes before timeout
const CHECK_INTERVAL_MS = 60 * 1000; // Check session status every minute
const ACTIVITY_DEBOUNCE_MS = 30 * 1000; // Debounce activity detection (30 seconds)

export const useSessionTimeout = (isAuthenticated) => {
  const [sessionStatus, setSessionStatus] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
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
          setShowWarning(remainingMinutes <= WARNING_THRESHOLD_MINUTES && remainingMinutes > 0);
        }
      } else if (response.status === 401) {
        // Session expired or invalid
        setSessionStatus(null);
        setShowWarning(false);
        // Redirect to login will be handled by auth service
      }
    } catch (error) {
      console.warn('Failed to fetch session status:', error);
    }
  }, [isAuthenticated]);

  /**
   * Extend session (called when user clicks "Stay logged in")
   */
  const extendSession = useCallback(async () => {
    if (!isAuthenticated || isExtending) return false;

    setIsExtending(true);
    try {
      const response = await fetch(`${API_BASE_URL}/auth/session/extend`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setShowWarning(false);
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
   * Track user activity (debounced)
   */
  const trackActivity = useCallback(() => {
    const now = Date.now();
    // Only update if enough time has passed (debounce)
    if (now - lastActivityRef.current > ACTIVITY_DEBOUNCE_MS) {
      lastActivityRef.current = now;
      // Activity is tracked by making API calls, which update session on server
      // No need to make separate activity call here
    }
  }, []);

  // Set up activity listeners
  useEffect(() => {
    if (!isAuthenticated) return;

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

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
    dismissWarning: () => setShowWarning(false),
  };
};

export default useSessionTimeout;
