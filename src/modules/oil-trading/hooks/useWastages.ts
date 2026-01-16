/**
 * useWastages Hook
 *
 * Manages wastage data loading, caching, and state.
 * Provides a clean interface for fetching and refreshing wastage records.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import wastageService from '../../../services/wastageService';
import materialService from '../../../services/materialService';
import type {
  WastageRecord,
  Material,
  WastageType,
  PaginationInfo,
  WastageQueryParams,
  UseWastagesReturn
} from '../types/wastage.types';

// Conditional logging - only in development
const isDev = import.meta.env.DEV;
const log = isDev ? console.log.bind(console, '[useWastages]') : () => {};
const logError = isDev ? console.error.bind(console, '[useWastages]') : () => {};

interface UseWastagesOptions {
  autoLoad?: boolean;
  initialParams?: WastageQueryParams;
  projectId?: string;
}

export function useWastages(options: UseWastagesOptions = {}): UseWastagesReturn {
  const { autoLoad = true, initialParams = {}, projectId } = options;

  // State
  const [wastages, setWastages] = useState<WastageRecord[]>([]);
  const [materials, setMaterials] = useState<Material[]>([]);
  const [wastageTypes, setWastageTypes] = useState<WastageType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);

  // Track current params for refresh
  const currentParamsRef = useRef<WastageQueryParams>(initialParams);
  const isMountedRef = useRef(true);

  /**
   * Load all required data in parallel
   */
  const loadData = useCallback(async (params: WastageQueryParams = {}) => {
    setIsLoading(true);
    setError(null);
    currentParamsRef.current = params;

    try {
      // Build query params with project support
      const queryParams: WastageQueryParams = {
        ...params,
        ...(projectId && { projectId })
      };

      // Parallel data fetching for performance
      const [wastageResult, typesResult, materialsResult] = await Promise.all([
        wastageService.getAll(queryParams),
        wastageService.getTypes().catch(() => ({ success: false, data: [] })),
        materialService.getAll().catch(() => ({ success: false, data: [] }))
      ]);

      // Only update state if component is still mounted
      if (!isMountedRef.current) return;

      // Process wastage data
      if (wastageResult.success) {
        setWastages(wastageResult.data || []);
        if (wastageResult.pagination) {
          setPagination(wastageResult.pagination);
        }
      } else {
        throw new Error(wastageResult.message || 'Failed to load wastages');
      }

      // Process types
      if (typesResult.success) {
        setWastageTypes(typesResult.data || []);
      }

      // Process materials
      if (materialsResult.success) {
        setMaterials(materialsResult.data || []);
      }

      log('Data loaded successfully', {
        wastages: wastageResult.data?.length,
        types: typesResult.data?.length,
        materials: materialsResult.data?.length
      });

    } catch (err) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : 'Failed to load wastage data';
      setError(message);
      logError('Load failed:', err);
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [projectId]);

  /**
   * Refresh data with current params
   */
  const refresh = useCallback(async () => {
    await loadData(currentParamsRef.current);
  }, [loadData]);

  /**
   * Load specific page
   */
  const loadPage = useCallback(async (page: number) => {
    await loadData({ ...currentParamsRef.current, page });
  }, [loadData]);

  /**
   * Load with new params (for filter changes)
   */
  const loadWithParams = useCallback(async (params: WastageQueryParams) => {
    await loadData(params);
  }, [loadData]);

  // Auto-load on mount if enabled
  useEffect(() => {
    isMountedRef.current = true;

    if (autoLoad) {
      loadData(initialParams);
    }

    return () => {
      isMountedRef.current = false;
    };
  }, [autoLoad]); // Only run on mount

  return {
    wastages,
    isLoading,
    error,
    pagination,
    materials,
    wastageTypes,
    refresh,
    loadPage,
    loadWithParams
  };
}

export default useWastages;
