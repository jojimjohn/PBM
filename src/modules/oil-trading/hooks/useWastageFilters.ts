/**
 * useWastageFilters Hook
 *
 * Manages filter state for wastage list views.
 * Provides query parameter generation for API calls.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  WastageFilters,
  WastageQueryParams,
  UseWastageFiltersReturn
} from '../types/wastage.types';

const DEFAULT_FILTERS: WastageFilters = {
  status: 'all',
  materialId: 'all',
  wastageTypeId: 'all',
  dateFrom: '',
  dateTo: '',
  searchTerm: ''
};

interface UseWastageFiltersOptions {
  initialFilters?: Partial<WastageFilters>;
  onFilterChange?: (filters: WastageFilters) => void;
}

export function useWastageFilters(
  options: UseWastageFiltersOptions = {}
): UseWastageFiltersReturn {
  const { initialFilters, onFilterChange } = options;

  const [filters, setFilters] = useState<WastageFilters>({
    ...DEFAULT_FILTERS,
    ...initialFilters
  });

  /**
   * Update a single filter value
   */
  const setFilter = useCallback(<K extends keyof WastageFilters>(
    key: K,
    value: WastageFilters[K]
  ) => {
    setFilters(prev => {
      const updated = { ...prev, [key]: value };
      onFilterChange?.(updated);
      return updated;
    });
  }, [onFilterChange]);

  /**
   * Reset all filters to defaults
   */
  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    onFilterChange?.(DEFAULT_FILTERS);
  }, [onFilterChange]);

  /**
   * Convert filters to API query params
   * Excludes 'all' values and empty strings
   */
  const getQueryParams = useCallback((): WastageQueryParams => {
    const params: WastageQueryParams = {};

    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }

    if (filters.materialId && filters.materialId !== 'all') {
      params.materialId = filters.materialId;
    }

    if (filters.wastageTypeId && filters.wastageTypeId !== 'all') {
      params.wastageTypeId = filters.wastageTypeId;
    }

    if (filters.dateFrom) {
      params.startDate = filters.dateFrom;
    }

    if (filters.dateTo) {
      params.endDate = filters.dateTo;
    }

    if (filters.searchTerm?.trim()) {
      params.search = filters.searchTerm.trim();
    }

    return params;
  }, [filters]);

  /**
   * Check if any non-default filters are active
   */
  const hasActiveFilters = useMemo(() => {
    return (
      filters.status !== 'all' ||
      filters.materialId !== 'all' ||
      filters.wastageTypeId !== 'all' ||
      !!filters.dateFrom ||
      !!filters.dateTo ||
      !!filters.searchTerm?.trim()
    );
  }, [filters]);

  return {
    filters,
    setFilter,
    resetFilters,
    getQueryParams,
    hasActiveFilters
  };
}

export default useWastageFilters;
