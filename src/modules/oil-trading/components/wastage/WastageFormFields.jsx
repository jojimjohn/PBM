/**
 * WastageFormFields Component
 *
 * Core form fields for creating/editing wastage records.
 * Extracted from WastageForm for reusability.
 */

import React from 'react';
import Input, { Textarea } from '../../../../components/ui/Input';
import { Select } from '../../../../components/ui/Select';
import DateInput from '../../../../components/ui/DateInput';
import { useLocalization } from '../../../../context/LocalizationContext';
import { formatCurrency } from '../../../../lib/utils';

/**
 * @param {Object} props
 * @param {Object} props.formData - Form data from useWastageForm
 * @param {Object} props.errors - Validation errors
 * @param {Function} props.setField - Field setter function
 * @param {Array} props.materials - Available materials
 * @param {Array} props.wastageTypes - Available wastage types
 * @param {boolean} props.disabled - Disable all inputs
 */
export function WastageFormFields({
  formData,
  errors,
  setField,
  materials = [],
  wastageTypes = [],
  disabled = false
}) {
  const { t } = useLocalization();

  // Get selected material for stock display
  const selectedMaterial = materials.find(m => m.id === formData.materialId);

  // Calculate total cost
  const quantity = parseFloat(formData.quantity) || 0;
  const unitCost = parseFloat(formData.unitCost) || 0;
  const totalCost = quantity * unitCost;

  // Build material options with stock info
  const materialOptions = [
    { value: '', label: t('selectMaterial') || 'Select Material' },
    ...materials.map(m => ({
      value: m.id,
      label: `${m.name} (${m.currentStock || 0} ${m.unit} available)`
    }))
  ];

  // Build wastage type options
  const typeOptions = [
    { value: '', label: t('selectType') || 'Select Type' },
    ...wastageTypes.map(wt => ({
      value: wt.id,
      label: wt.name
    }))
  ];

  return (
    <div className="space-y-4">
      {/* Date */}
      <DateInput
        label={t('wastageDate') || 'Wastage Date'}
        value={formData.wastageDate || ''}
        onChange={(date) => setField('wastageDate', date)}
        error={errors.wastageDate}
        required
        disabled={disabled}
        maxDate={new Date().toISOString().split('T')[0]}
      />

      {/* Material Selection */}
      <div>
        <Select
          label={t('material') || 'Material'}
          value={formData.materialId || ''}
          onChange={(e) => setField('materialId', e.target.value)}
          error={errors.materialId}
          required
          disabled={disabled}
          options={materialOptions}
        />
        {selectedMaterial && (
          <p className="mt-1 text-sm text-gray-500">
            {t('currentStock') || 'Current Stock'}: {selectedMaterial.currentStock || 0} {selectedMaterial.unit}
          </p>
        )}
      </div>

      {/* Wastage Type */}
      <Select
        label={t('wastageType') || 'Wastage Type'}
        value={formData.wastageTypeId || ''}
        onChange={(e) => setField('wastageTypeId', e.target.value)}
        error={errors.wastageTypeId}
        required
        disabled={disabled}
        options={typeOptions}
      />

      {/* Quantity & Unit Cost - Side by Side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label={t('quantity') || 'Quantity'}
          type="number"
          step="0.001"
          min="0.001"
          value={formData.quantity || ''}
          onChange={(e) => setField('quantity', e.target.value)}
          error={errors.quantity}
          required
          disabled={disabled}
          suffix={selectedMaterial?.unit}
        />

        <Input
          label={t('unitCost') || 'Unit Cost'}
          type="number"
          step="0.001"
          min="0"
          value={formData.unitCost || ''}
          onChange={(e) => setField('unitCost', e.target.value)}
          error={errors.unitCost}
          required
          disabled={disabled}
          prefix="OMR"
        />
      </div>

      {/* Total Cost Display */}
      {totalCost > 0 && (
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-gray-600">{t('totalCost') || 'Total Cost'}:</span>
            <span className="text-lg font-semibold text-gray-900">
              {formatCurrency(totalCost)}
            </span>
          </div>
        </div>
      )}

      {/* Reason */}
      <Textarea
        label={t('reason') || 'Reason for Wastage'}
        value={formData.reason || ''}
        onChange={(e) => setField('reason', e.target.value)}
        error={errors.reason}
        required
        disabled={disabled}
        placeholder={t('wastageReasonPlaceholder') || 'Describe why this wastage occurred...'}
        rows={3}
      />

      {/* Notes (Optional) */}
      <Textarea
        label={t('additionalNotes') || 'Additional Notes (Optional)'}
        value={formData.notes || ''}
        onChange={(e) => setField('notes', e.target.value)}
        disabled={disabled}
        placeholder={t('notesPlaceholder') || 'Any additional information...'}
        rows={2}
      />
    </div>
  );
}

export default WastageFormFields;
