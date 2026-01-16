/**
 * useWastageApproval Hook
 *
 * Manages approval and rejection workflows for wastage records.
 * Includes optimistic UI updates and error handling.
 */

import { useState, useCallback } from 'react';
import wastageService from '../../../services/wastageService';
import type { UseWastageApprovalReturn } from '../types/wastage.types';

// Conditional logging
const isDev = import.meta.env.DEV;
const log = isDev ? console.log.bind(console, '[useWastageApproval]') : () => {};
const logError = isDev ? console.error.bind(console, '[useWastageApproval]') : () => {};

// Validation constants
const MIN_REJECTION_REASON_LENGTH = 10;

interface UseWastageApprovalOptions {
  onSuccess?: (action: 'approve' | 'reject', id: string) => void;
  onError?: (action: 'approve' | 'reject', error: Error) => void;
}

export function useWastageApproval(
  options: UseWastageApprovalOptions = {}
): UseWastageApprovalReturn {
  const { onSuccess, onError } = options;

  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Approve a wastage record
   */
  const approve = useCallback(async (
    id: string,
    notes?: string
  ): Promise<boolean> => {
    setIsApproving(true);
    setError(null);

    try {
      const result = await wastageService.approve(id, { notes });

      if (!result.success) {
        throw new Error(result.message || 'Approval failed');
      }

      log('Wastage approved:', id);
      onSuccess?.('approve', id);
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve wastage';
      setError(message);
      logError('Approval failed:', err);
      onError?.('approve', err instanceof Error ? err : new Error(message));
      return false;

    } finally {
      setIsApproving(false);
    }
  }, [onSuccess, onError]);

  /**
   * Reject a wastage record
   */
  const reject = useCallback(async (
    id: string,
    reason: string
  ): Promise<boolean> => {
    // Validate rejection reason
    if (!reason?.trim()) {
      setError('Rejection reason is required');
      return false;
    }

    if (reason.trim().length < MIN_REJECTION_REASON_LENGTH) {
      setError(`Rejection reason must be at least ${MIN_REJECTION_REASON_LENGTH} characters`);
      return false;
    }

    setIsRejecting(true);
    setError(null);

    try {
      const result = await wastageService.reject(id, { reason: reason.trim() });

      if (!result.success) {
        throw new Error(result.message || 'Rejection failed');
      }

      log('Wastage rejected:', id);
      onSuccess?.('reject', id);
      return true;

    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to reject wastage';
      setError(message);
      logError('Rejection failed:', err);
      onError?.('reject', err instanceof Error ? err : new Error(message));
      return false;

    } finally {
      setIsRejecting(false);
    }
  }, [onSuccess, onError]);

  /**
   * Clear any error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isApproving,
    isRejecting,
    approve,
    reject,
    error,
    clearError
  };
}

export default useWastageApproval;
