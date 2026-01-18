/**
 * BranchSelector Component
 *
 * A reusable dropdown component for selecting a branch.
 * Used in forms where branch assignment is required.
 *
 * Features:
 * - Fetches branches from API using useBranches hook
 * - Shows loading state while fetching
 * - Displays "Unassigned" warning for null values on existing records
 * - Supports required validation
 * - Full localization support
 */

import React, { useEffect } from 'react';
import { useLocalization } from '../../context/LocalizationContext';
import useBranches from '../../hooks/useBranches';
import { Building2, AlertTriangle } from 'lucide-react';
// CSS moved to global index.css Tailwind

const BranchSelector = ({
  value,
  onChange,
  required = false,
  disabled = false,
  label,
  error,
  showUnassignedWarning = false,
  placeholder,
  className = '',
  size = 'medium',
  helperText,
  autoSelectSingle = true  // Auto-select when only one branch exists
}) => {
  const { t } = useLocalization();
  const { branches, loading, hasBranches } = useBranches({ activeOnly: true });

  // Auto-select when there's only one branch and no value is selected
  useEffect(() => {
    if (autoSelectSingle && !loading && branches.length === 1 && !value) {
      onChange(branches[0].id);
    }
  }, [autoSelectSingle, loading, branches, value, onChange]);

  const handleChange = (e) => {
    const selectedValue = e.target.value;
    onChange(selectedValue ? parseInt(selectedValue) : null);
  };

  // Get the currently selected branch
  const selectedBranch = value ? branches.find(b => b.id === parseInt(value)) : null;

  // Determine if we should show the unassigned warning
  const showWarning = showUnassignedWarning && !value && !loading;

  return (
    <div className={`branch-selector ${className} ${size}`}>
      {label && (
        <label className="branch-selector-label">
          <Building2 size={14} className="branch-selector-icon" />
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      <div className={`branch-selector-control ${error ? 'has-error' : ''} ${showWarning ? 'has-warning' : ''}`}>
        <select
          value={value || ''}
          onChange={handleChange}
          disabled={disabled || loading}
          required={required}
          className="branch-selector-select"
        >
          <option value="">
            {loading
              ? t('loading', 'Loading...')
              : placeholder || t('selectBranch', 'Select Branch')}
          </option>
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
              {branch.city ? ` - ${branch.city}` : ''}
            </option>
          ))}
        </select>

        {showWarning && (
          <div className="branch-selector-warning">
            <AlertTriangle size={14} />
            <span>{t('branchUnassigned', 'Branch not assigned')}</span>
          </div>
        )}
      </div>

      {error && (
        <span className="branch-selector-error">{error}</span>
      )}

      {helperText && !error && (
        <span className="branch-selector-helper">{helperText}</span>
      )}

      {!hasBranches && !loading && (
        <span className="branch-selector-empty">
          {t('noBranchesAvailable', 'No branches available')}
        </span>
      )}
    </div>
  );
};

export default BranchSelector;
