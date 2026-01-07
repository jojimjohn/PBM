/**
 * CategorySelect Component
 *
 * Reusable dropdown for expense categories that fetches from the API.
 * Supports filtering by type and locale-aware names.
 *
 * Props:
 * - value: Current selected category code
 * - onChange: Callback when selection changes (receives category object or code)
 * - type: Category type filter ('purchase', 'sales', 'operational', 'petty_cash')
 * - placeholder: Placeholder text
 * - disabled: Whether the select is disabled
 * - required: Whether the field is required
 * - className: Additional CSS classes
 * - includeInactive: Whether to include inactive categories (default: false)
 * - returnObject: Whether to return full category object or just code (default: false)
 * - showIcon: Whether to show category icon (default: true)
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import expenseCategoryService from '../../services/expenseCategoryService';
import { Loader2, AlertCircle, Tag } from 'lucide-react';
import './CategorySelect.css';

// Category type icons
const TYPE_ICONS = {
  purchase: '🛒',
  sales: '💰',
  operational: '⚙️',
  petty_cash: '💵',
};

// Fallback category icons for common codes
const CATEGORY_ICONS = {
  // Purchase categories
  transportation: '🚚',
  loading_unloading: '📦',
  customs_duty: '📋',
  inspection: '🔍',
  storage: '🏭',
  insurance: '🛡️',
  documentation: '📄',
  // Petty cash categories
  fuel: '⛽',
  transport: '🚕',
  meals: '🍽️',
  office_supplies: '📦',
  maintenance: '🔧',
  communication: '📱',
  travel: '✈️',
  miscellaneous: '📋',
  emergency: '🚨',
  // Operational categories
  utilities: '💡',
  rent: '🏢',
  salaries: '👥',
  // Generic fallback
  other: '📋',
};

const CategorySelect = ({
  value,
  onChange,
  type = 'petty_cash',
  placeholder,
  disabled = false,
  required = false,
  className = '',
  includeInactive = false,
  returnObject = false,
  showIcon = true,
  error,
}) => {
  const { t, currentLocale } = useLocalization();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  // Fetch categories from API
  const fetchCategories = useCallback(async () => {
    setLoading(true);
    setFetchError(null);

    try {
      const locale = currentLocale === 'ar' ? 'ar' : 'en';
      const result = await expenseCategoryService.getForDropdown(type, locale);

      if (result.success) {
        setCategories(result.data || []);
      } else {
        setFetchError(result.error || 'Failed to load categories');
        setCategories([]);
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setFetchError('Failed to load categories');
      setCategories([]);
    } finally {
      setLoading(false);
    }
  }, [type, currentLocale]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Handle selection change
  const handleChange = (e) => {
    const selectedCode = e.target.value;

    if (!selectedCode) {
      onChange(returnObject ? null : '');
      return;
    }

    if (returnObject) {
      const selectedCategory = categories.find((cat) => cat.code === selectedCode);
      onChange(selectedCategory || null);
    } else {
      onChange(selectedCode);
    }
  };

  // Get icon for a category
  const getCategoryIcon = (code) => {
    return CATEGORY_ICONS[code?.toLowerCase()] || CATEGORY_ICONS.other;
  };

  // Get the display name for the selected category
  const getSelectedDisplayName = () => {
    if (!value) return '';
    const selected = categories.find((cat) => cat.code === value || cat.id === value);
    return selected?.name || value;
  };

  // Default placeholder based on type
  const defaultPlaceholder = {
    purchase: t('selectPurchaseCategory', 'Select purchase category'),
    sales: t('selectSalesCategory', 'Select sales category'),
    operational: t('selectOperationalCategory', 'Select operational category'),
    petty_cash: t('selectPettyCashCategory', 'Select expense category'),
  };

  const displayPlaceholder = placeholder || defaultPlaceholder[type] || t('selectCategory', 'Select category');

  // Loading state
  if (loading) {
    return (
      <div className={`category-select category-select-loading ${className}`}>
        <Loader2 size={16} className="spinning" />
        <span>{t('loadingCategories', 'Loading categories...')}</span>
      </div>
    );
  }

  // Error state with retry
  if (fetchError) {
    return (
      <div className={`category-select category-select-error ${className}`}>
        <AlertCircle size={16} />
        <span>{fetchError}</span>
        <button
          type="button"
          className="retry-btn"
          onClick={fetchCategories}
        >
          {t('retry', 'Retry')}
        </button>
      </div>
    );
  }

  // No categories available
  if (categories.length === 0) {
    return (
      <div className={`category-select category-select-empty ${className}`}>
        <Tag size={16} />
        <span>{t('noCategoriesAvailable', 'No categories available')}</span>
      </div>
    );
  }

  return (
    <div className={`category-select-wrapper ${className} ${error ? 'has-error' : ''}`}>
      <select
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        className="category-select form-select"
      >
        <option value="">{displayPlaceholder}</option>
        {categories.map((category) => (
          <option key={category.id || category.code} value={category.code}>
            {showIcon && getCategoryIcon(category.code)} {category.name}
            {category.max_amount && ` (${t('maxLabel', 'Max')}: ${category.max_amount})`}
          </option>
        ))}
      </select>
      {error && <span className="category-select-error-text">{error}</span>}
    </div>
  );
};

export default CategorySelect;
