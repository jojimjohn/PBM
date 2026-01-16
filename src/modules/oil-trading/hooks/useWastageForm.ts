/**
 * useWastageForm Hook
 *
 * Manages form state, validation, and submission for wastage records.
 * Handles both create and edit modes with stock validation.
 */

import { useState, useCallback, useMemo } from 'react';
import type {
  WastageFormData,
  WastageFormErrors,
  WastageRecord,
  Material,
  UseWastageFormReturn
} from '../types/wastage.types';

// Conditional logging
const isDev = import.meta.env.DEV;
const logError = isDev ? console.error.bind(console, '[useWastageForm]') : () => {};

const DEFAULT_FORM_DATA: WastageFormData = {
  wastageDate: new Date().toISOString().split('T')[0],
  materialId: '',
  quantity: '',
  unitCost: '',
  wastageTypeId: '',
  reason: '',
  collectionOrderId: '',
  notes: '',
  attachments: [],
  existingAttachments: []
};

// Validation constants
const MIN_REASON_LENGTH = 10;

interface UseWastageFormOptions {
  initialData?: Partial<WastageFormData>;
  editingWastage?: WastageRecord | null;
  materials?: Material[];
  onSubmit: (data: WastageFormData) => Promise<void>;
}

export function useWastageForm(options: UseWastageFormOptions): UseWastageFormReturn {
  const { initialData, editingWastage, materials = [], onSubmit } = options;

  // Determine initial form state
  const getInitialData = useCallback((): WastageFormData => {
    if (editingWastage) {
      return {
        wastageDate: editingWastage.wastageDate?.split('T')[0] || '',
        materialId: editingWastage.materialId || '',
        quantity: editingWastage.quantity?.toString() || '',
        unitCost: editingWastage.unitCost?.toString() || '',
        wastageTypeId: editingWastage.wastageTypeId || '',
        reason: editingWastage.reason || '',
        collectionOrderId: editingWastage.collectionOrderId || '',
        notes: editingWastage.notes || '',
        attachments: [],
        existingAttachments: editingWastage.attachments?.map(a => a.url) || []
      };
    }
    return { ...DEFAULT_FORM_DATA, ...initialData };
  }, [editingWastage, initialData]);

  // State
  const [formData, setFormData] = useState<WastageFormData>(getInitialData);
  const [errors, setErrors] = useState<WastageFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [initialSnapshot] = useState<WastageFormData>(getInitialData);

  /**
   * Check if form has unsaved changes
   */
  const isDirty = useMemo(() => {
    // Compare without attachments (files can't be easily compared)
    const { attachments: _, ...currentData } = formData;
    const { attachments: __, ...snapshotData } = initialSnapshot;
    return JSON.stringify(currentData) !== JSON.stringify(snapshotData);
  }, [formData, initialSnapshot]);

  /**
   * Update a single field
   */
  const setField = useCallback(<K extends keyof WastageFormData>(
    field: K,
    value: WastageFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear field error when user starts typing
    setErrors(prev => {
      if (prev[field as keyof WastageFormErrors]) {
        return { ...prev, [field]: undefined };
      }
      return prev;
    });
  }, []);

  /**
   * Validate form data
   * Returns true if valid, false otherwise
   */
  const validate = useCallback((): boolean => {
    const newErrors: WastageFormErrors = {};

    // Required field validation
    if (!formData.wastageDate) {
      newErrors.wastageDate = 'Wastage date is required';
    }

    if (!formData.materialId) {
      newErrors.materialId = 'Material is required';
    }

    const quantity = parseFloat(formData.quantity as string);
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }

    const unitCost = parseFloat(formData.unitCost as string);
    if (!formData.unitCost || isNaN(unitCost) || unitCost < 0) {
      newErrors.unitCost = 'Valid unit cost is required';
    }

    if (!formData.wastageTypeId) {
      newErrors.wastageTypeId = 'Wastage type is required';
    }

    if (!formData.reason || formData.reason.trim().length < MIN_REASON_LENGTH) {
      newErrors.reason = `Reason must be at least ${MIN_REASON_LENGTH} characters`;
    }

    // Stock validation (if materials provided)
    if (formData.materialId && quantity > 0 && materials.length > 0) {
      const material = materials.find(m => m.id === formData.materialId);
      if (material && material.currentStock !== undefined) {
        // For new records, check against available stock
        // For edits, add back the original quantity
        const originalQty = editingWastage?.materialId === formData.materialId
          ? editingWastage.quantity
          : 0;
        const availableStock = (material.currentStock || 0) + originalQty;

        if (quantity > availableStock) {
          newErrors.quantity = `Exceeds available stock (${availableStock} ${material.unit})`;
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData, materials, editingWastage]);

  /**
   * Reset form to initial state
   */
  const reset = useCallback((newInitialData?: Partial<WastageFormData>) => {
    setFormData(newInitialData
      ? { ...DEFAULT_FORM_DATA, ...newInitialData }
      : getInitialData()
    );
    setErrors({});
  }, [getInitialData]);

  /**
   * Submit form
   * Returns true on success, false on validation/submission error
   */
  const submit = useCallback(async (): Promise<boolean> => {
    if (!validate()) {
      return false;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(formData);
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save wastage';
      setErrors(prev => ({ ...prev, general: message }));
      logError('Submit failed:', err);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validate, onSubmit]);

  return {
    formData,
    errors,
    isSubmitting,
    isDirty,
    setField,
    setErrors,
    validate,
    reset,
    submit
  };
}

export default useWastageForm;
