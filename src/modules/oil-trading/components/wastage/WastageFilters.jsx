/**
 * WastageFilters Component
 *
 * Filter controls for the wastage list.
 * Integrates with useWastageFilters hook.
 */

import React from 'react';
import { Search, Filter, X } from 'lucide-react';
import Input from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import DateInput from '../../../../components/ui/DateInput';
import Button from '../../../../components/ui/Button';
import { useLocalization } from '../../../../context/LocalizationContext';

/**
 * @param {Object} props
 * @param {Object} props.filters - Current filter values from useWastageFilters
 * @param {Function} props.onFilterChange - setFilter function from hook
 * @param {Function} props.onReset - resetFilters function from hook
 * @param {boolean} props.hasActiveFilters - Whether any filters are active
 * @param {Array} props.materials - Material options for dropdown
 * @param {Array} props.wastageTypes - Wastage type options for dropdown
 */
export function WastageFilters({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
  materials = [],
  wastageTypes = []
}) {
  const { t } = useLocalization();

  const statusOptions = [
    { value: 'all', label: t('allStatuses') || 'All Statuses' },
    { value: 'pending', label: t('pending') || 'Pending' },
    { value: 'approved', label: t('approved') || 'Approved' },
    { value: 'rejected', label: t('rejected') || 'Rejected' }
  ];

  const materialOptions = [
    { value: 'all', label: t('allMaterials') || 'All Materials' },
    ...materials.map(m => ({ value: m.id, label: m.name }))
  ];

  const typeOptions = [
    { value: 'all', label: t('allTypes') || 'All Types' },
    ...wastageTypes.map(wt => ({ value: wt.id, label: wt.name }))
  ];

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="w-5 h-5 text-gray-500" />
        <span className="font-medium text-gray-700">{t('filters') || 'Filters'}</span>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="ml-auto text-gray-500 hover:text-gray-700"
          >
            <X className="w-4 h-4 mr-1" />
            {t('clearAll') || 'Clear All'}
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        {/* Search */}
        <div className="lg:col-span-2">
          <Input
            placeholder={t('searchWastages') || 'Search wastages...'}
            value={filters.searchTerm || ''}
            onChange={(e) => onFilterChange('searchTerm', e.target.value)}
            icon={<Search className="w-4 h-4" />}
          />
        </div>

        {/* Status Filter */}
        <Select
          value={filters.status || 'all'}
          onChange={(e) => onFilterChange('status', e.target.value)}
          options={statusOptions}
        />

        {/* Material Filter */}
        <Select
          value={filters.materialId || 'all'}
          onChange={(e) => onFilterChange('materialId', e.target.value)}
          options={materialOptions}
        />

        {/* Date From */}
        <DateInput
          value={filters.dateFrom || ''}
          onChange={(date) => onFilterChange('dateFrom', date)}
          placeholder={t('from') || 'From'}
          maxDate={filters.dateTo || undefined}
        />

        {/* Date To */}
        <DateInput
          value={filters.dateTo || ''}
          onChange={(date) => onFilterChange('dateTo', date)}
          placeholder={t('to') || 'To'}
          minDate={filters.dateFrom || undefined}
        />
      </div>
    </div>
  );
}

export default WastageFilters;
