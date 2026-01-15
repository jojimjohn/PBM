/**
 * useSupplierForm Hook
 *
 * Manages supplier form state and transformations between
 * frontend form data and backend API format.
 *
 * Handles bidirectional transformation for schema mismatches:
 * - vatRegistration (DB) ↔ vatRegistrationNumber (form)
 * - paymentTermDays (DB) ↔ paymentTerms (form)
 * - specialization comma-string (DB) ↔ array (form)
 */

import { useState, useMemo, useCallback } from 'react'

/**
 * @typedef {import('../types/supplier.types').Supplier} Supplier
 * @typedef {import('../types/supplier.types').SupplierFormData} SupplierFormData
 */

/**
 * Default form values for new supplier
 * @param {string} [nextCode] - Pre-generated supplier code
 * @returns {SupplierFormData}
 */
const getDefaultFormData = (nextCode = 'AR-SUP-001') => ({
  code: nextCode,
  name: '',
  type: 'business',
  businessRegistration: '',
  contactPerson: '',
  nationalId: '',
  phone: '',
  email: '',
  vatRegistrationNumber: '',
  address: '',
  city: 'Muscat',
  region_id: null,
  paymentTerms: 30,
  specialization: [],
  taxNumber: '',
  bankName: '',
  accountNumber: '',
  iban: '',
  notes: '',
  isActive: true
})

/**
 * Parse specialization from DB format to array
 * Handles: "1,2,3", "1, 2, 3", or already-array formats
 * @param {string|Array|null} spec - Specialization from database
 * @returns {Array<number|string>}
 */
const parseSpecialization = (spec) => {
  if (!spec) return []
  if (Array.isArray(spec)) return spec
  if (typeof spec === 'string') {
    return spec.split(',').map(s => {
      const trimmed = s.trim()
      const num = parseInt(trimmed, 10)
      return isNaN(num) ? trimmed : num
    })
  }
  return []
}

/**
 * Extract form data from existing supplier object
 * @param {Supplier|null} supplier - Existing supplier to edit
 * @param {string} [nextCode] - Code for new suppliers
 * @returns {SupplierFormData}
 */
const supplierToFormData = (supplier, nextCode) => {
  if (!supplier) return getDefaultFormData(nextCode)

  return {
    id: supplier.id,
    code: supplier.code || '',
    name: supplier.name || '',
    type: supplier.type || 'business',
    businessRegistration: supplier.businessRegistration || '',
    contactPerson: supplier.contactPerson || '',
    nationalId: supplier.nationalId || '',
    // Direct database fields
    phone: supplier.phone || '',
    email: supplier.email || '',
    vatRegistrationNumber: supplier.vatRegistration || '',
    address: supplier.address || '',
    city: supplier.city || '',
    region_id: supplier.region_id || null,
    paymentTerms: supplier.paymentTermDays || 0,
    specialization: parseSpecialization(supplier.specialization),
    taxNumber: supplier.taxNumber || '',
    // Bank fields
    bankName: supplier.bankName || '',
    accountNumber: supplier.accountNumber || '',
    iban: supplier.iban || '',
    notes: supplier.notes || '',
    isActive: supplier.isActive === true || supplier.isActive === 1 || supplier.isActive === '1'
  }
}

/**
 * Transform form data to backend API format
 * @param {SupplierFormData} formData - Form data to transform
 * @param {Supplier|null} existingSupplier - Existing supplier for preservation
 * @returns {Object} Backend API format
 */
const formDataToApiFormat = (formData, existingSupplier = null) => {
  return {
    id: formData.id || existingSupplier?.id,
    code: formData.code,
    name: formData.name,
    email: formData.email,
    phone: formData.phone,
    address: formData.address,
    city: formData.city,
    region_id: formData.region_id,
    vatRegistration: formData.vatRegistrationNumber, // Form → DB field mapping
    contactPerson: formData.contactPerson,
    businessRegistration: formData.businessRegistration,
    nationalId: formData.nationalId,
    taxNumber: formData.taxNumber,
    specialization: formData.specialization, // Let backend handle array→string
    creditBalance: existingSupplier?.creditBalance || 0,
    paymentTermDays: parseInt(formData.paymentTerms) || 0, // Form → DB field mapping
    bankName: formData.bankName,
    accountNumber: formData.accountNumber,
    iban: formData.iban,
    notes: formData.notes,
    isActive: formData.isActive !== false,
    createdAt: existingSupplier?.createdAt || new Date().toISOString(),
    lastTransaction: existingSupplier?.lastTransaction || null,
    performance: existingSupplier?.performance || {
      monthlyVolume: 0,
      averageRate: 0,
      reliability: 0,
      qualityScore: 0
    },
    purchaseHistory: existingSupplier?.purchaseHistory || {
      totalTransactions: 0,
      totalValue: 0,
      totalWeight: 0
    }
  }
}

/**
 * Hook for managing supplier form state
 * @param {Supplier|null} supplier - Existing supplier for editing, null for new
 * @param {string} [nextCode] - Pre-generated code for new suppliers
 * @returns {Object} Form state and handlers
 */
export const useSupplierForm = (supplier = null, nextCode = 'AR-SUP-001') => {
  const [formData, setFormData] = useState(() => supplierToFormData(supplier, nextCode))
  const [isDirty, setIsDirty] = useState(false)

  /**
   * Update a single form field
   * @param {string} field - Field name to update
   * @param {any} value - New value
   */
  const updateField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }, [])

  /**
   * Update multiple fields at once
   * @param {Partial<SupplierFormData>} updates - Fields to update
   */
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  /**
   * Toggle a specialization ID in the array
   * @param {number|string} specId - Specialization ID to toggle
   */
  const toggleSpecialization = useCallback((specId) => {
    setFormData(prev => {
      const currentSpecs = prev.specialization || []
      const hasSpec = currentSpecs.includes(specId)
      return {
        ...prev,
        specialization: hasSpec
          ? currentSpecs.filter(s => s !== specId)
          : [...currentSpecs, specId]
      }
    })
    setIsDirty(true)
  }, [])

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(supplierToFormData(supplier, nextCode))
    setIsDirty(false)
  }, [supplier, nextCode])

  /**
   * Initialize form with a new supplier for editing
   * @param {Supplier} newSupplier - Supplier to load into form
   */
  const loadSupplier = useCallback((newSupplier) => {
    setFormData(supplierToFormData(newSupplier))
    setIsDirty(false)
  }, [])

  /**
   * Get data ready for API submission
   * @returns {Object} API-formatted supplier data
   */
  const getApiData = useCallback(() => {
    return formDataToApiFormat(formData, supplier)
  }, [formData, supplier])

  /**
   * Validation - returns array of error messages
   */
  const validationErrors = useMemo(() => {
    const errors = []
    if (!formData.name?.trim()) errors.push('Supplier name is required')
    if (!formData.phone?.trim()) errors.push('Phone number is required')
    return errors
  }, [formData.name, formData.phone])

  const isValid = validationErrors.length === 0

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    toggleSpecialization,
    resetForm,
    loadSupplier,
    getApiData,
    isDirty,
    isValid,
    validationErrors,
    isEditing: !!supplier
  }
}

export default useSupplierForm
