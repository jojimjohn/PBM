/**
 * useExpenseCategories Hook
 *
 * Reusable hook for loading and managing expense categories from the database.
 * Provides category lookup, display names, and caching.
 *
 * Usage:
 * const { categories, getCategoryLabel, loading, error, refreshCategories } = useExpenseCategories('purchase');
 *
 * The hook returns:
 * - categories: Array of category objects from the database
 * - categoryMap: Map of category code -> category object for quick lookups
 * - getCategoryLabel: Function to get display name for a category code
 * - loading: Boolean indicating if categories are being fetched
 * - error: Error message if fetch failed
 * - refreshCategories: Function to force refresh categories
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useLocalization } from '../context/LocalizationContext';
import expenseCategoryService from '../services/expenseCategoryService';

// Cache for categories by type to avoid repeated API calls
const categoryCache = new Map();
const cacheExpiry = 5 * 60 * 1000; // 5 minutes cache expiry

const useExpenseCategories = (type = 'purchase', options = {}) => {
  const { currentLocale } = useLocalization();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const { includeInactive = false, autoRefresh = true } = options;

  // Generate cache key
  const cacheKey = `${type}-${currentLocale}-${includeInactive}`;

  // Fetch categories from API or cache
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    // Check cache first (unless force refresh)
    if (!forceRefresh && categoryCache.has(cacheKey)) {
      const cached = categoryCache.get(cacheKey);
      if (Date.now() - cached.timestamp < cacheExpiry) {
        setCategories(cached.data);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const locale = currentLocale === 'ar' ? 'ar' : 'en';
      const result = await expenseCategoryService.getForDropdown(type, locale);

      if (result.success) {
        const data = result.data || [];
        setCategories(data);
        // Update cache
        categoryCache.set(cacheKey, {
          data,
          timestamp: Date.now()
        });
      } else {
        setError(result.error || 'Failed to load categories');
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [type, currentLocale, includeInactive, cacheKey]);

  // Initial fetch
  useEffect(() => {
    if (autoRefresh) {
      fetchCategories();
    }
  }, [fetchCategories, autoRefresh]);

  // Create a map for quick lookups
  const categoryMap = useMemo(() => {
    const map = new Map();
    categories.forEach(cat => {
      // Map by code (both uppercase and lowercase for flexibility)
      map.set(cat.code, cat);
      map.set(cat.code?.toUpperCase(), cat);
      map.set(cat.code?.toLowerCase(), cat);
    });
    return map;
  }, [categories]);

  /**
   * Get display label for a category code
   * @param {string} code - Category code (e.g., 'PURCHASE_TRANSPORT' or 'transportation')
   * @returns {string} Display name or formatted code
   */
  const getCategoryLabel = useCallback((code) => {
    if (!code) return 'Other';

    // Try exact match first
    const category = categoryMap.get(code);
    if (category) return category.name;

    // Try uppercase match
    const upperCategory = categoryMap.get(code.toUpperCase());
    if (upperCategory) return upperCategory.name;

    // Fallback: format the code nicely
    return code
      .replace(/_/g, ' ')
      .replace(/\bPURCHASE\b/gi, '')
      .replace(/\bOP\b/gi, '')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'Other';
  }, [categoryMap]);

  /**
   * Get full category object by code
   * @param {string} code - Category code
   * @returns {Object|null} Category object or null
   */
  const getCategoryByCode = useCallback((code) => {
    if (!code) return null;
    return categoryMap.get(code) || categoryMap.get(code.toUpperCase()) || null;
  }, [categoryMap]);

  /**
   * Check if a category code is valid
   * @param {string} code - Category code
   * @returns {boolean}
   */
  const isValidCategory = useCallback((code) => {
    if (!code) return false;
    return categoryMap.has(code) || categoryMap.has(code.toUpperCase());
  }, [categoryMap]);

  return {
    categories,
    categoryMap,
    getCategoryLabel,
    getCategoryByCode,
    isValidCategory,
    loading,
    error,
    refreshCategories: () => fetchCategories(true)
  };
};

/**
 * Hook to get all category types (purchase, operational, etc.)
 */
export const useAllExpenseCategories = () => {
  const [allCategories, setAllCategories] = useState({
    purchase: [],
    operational: [],
    collection: [],
    petty_cash: [],
    sales: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { currentLocale } = useLocalization();

  const fetchAllCategories = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const locale = currentLocale === 'ar' ? 'ar' : 'en';
      const types = ['purchase', 'operational', 'collection', 'petty_cash', 'sales'];

      const results = await Promise.all(
        types.map(type => expenseCategoryService.getForDropdown(type, locale))
      );

      const categoriesByType = {};
      types.forEach((type, index) => {
        categoriesByType[type] = results[index].success ? results[index].data || [] : [];
      });

      setAllCategories(categoriesByType);
    } catch (err) {
      console.error('Error fetching all categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, [currentLocale]);

  useEffect(() => {
    fetchAllCategories();
  }, [fetchAllCategories]);

  // Unified lookup function across all types
  const getCategoryLabel = useCallback((code, preferredType = null) => {
    if (!code) return 'Other';

    // If preferred type specified, check that first
    if (preferredType && allCategories[preferredType]) {
      const cat = allCategories[preferredType].find(
        c => c.code === code || c.code?.toUpperCase() === code.toUpperCase()
      );
      if (cat) return cat.name;
    }

    // Search all types
    for (const type of Object.keys(allCategories)) {
      const cat = allCategories[type].find(
        c => c.code === code || c.code?.toUpperCase() === code.toUpperCase()
      );
      if (cat) return cat.name;
    }

    // Fallback: format the code nicely
    return code
      .replace(/_/g, ' ')
      .replace(/\bPURCHASE\b/gi, '')
      .replace(/\bOP\b/gi, '')
      .trim()
      .toLowerCase()
      .replace(/\b\w/g, c => c.toUpperCase())
      .trim() || 'Other';
  }, [allCategories]);

  return {
    allCategories,
    getCategoryLabel,
    loading,
    error,
    refreshCategories: fetchAllCategories
  };
};

export default useExpenseCategories;
