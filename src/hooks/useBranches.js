/**
 * useBranches Hook
 *
 * Provides branch data fetching, caching, and helper methods
 * for use across forms that need branch selection.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import authService from '../services/authService';
import { API_BASE_URL } from '../config/api';

const useBranches = (options = {}) => {
  const { activeOnly = true, autoFetch = true } = options;
  const { selectedCompany } = useAuth();

  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch branches from API
  const fetchBranches = useCallback(async () => {
    if (!selectedCompany) return;

    setLoading(true);
    setError(null);

    try {
      const queryParams = new URLSearchParams();
      if (activeOnly) {
        queryParams.append('is_active', 'true');
      }
      queryParams.append('limit', '100');

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/branches?${queryParams.toString()}`
      );

      if (response.success) {
        setBranches(response.data || []);
      } else {
        setError(response.error || 'Failed to fetch branches');
        setBranches([]);
      }
    } catch (err) {
      console.error('Error fetching branches:', err);
      setError(err.message || 'Failed to fetch branches');
      setBranches([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCompany, activeOnly]);

  // Auto-fetch on mount and when company changes
  useEffect(() => {
    if (autoFetch) {
      fetchBranches();
    }
  }, [fetchBranches, autoFetch]);

  // Get branch by ID
  const getBranchById = useCallback((branchId) => {
    if (!branchId) return null;
    return branches.find(b => b.id === parseInt(branchId)) || null;
  }, [branches]);

  // Get branch name by ID (for display)
  const getBranchName = useCallback((branchId) => {
    const branch = getBranchById(branchId);
    return branch ? branch.name : null;
  }, [getBranchById]);

  // Format branches for dropdown options
  const branchOptions = useMemo(() => {
    return branches.map(branch => ({
      value: branch.id,
      label: branch.name,
      code: branch.code,
      city: branch.city,
      isActive: branch.is_active
    }));
  }, [branches]);

  return {
    branches,
    branchOptions,
    loading,
    error,
    fetchBranches,
    getBranchById,
    getBranchName,
    hasBranches: branches.length > 0
  };
};

export default useBranches;
