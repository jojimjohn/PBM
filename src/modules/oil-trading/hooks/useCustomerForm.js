/**
 * useCustomerForm Hook
 *
 * Manages customer form state and transformations between
 * frontend form data and backend API format.
 */

import { useState, useMemo, useCallback } from 'react'

/**
 * @typedef {import('../types/customer.types').Customer} Customer
 * @typedef {import('../types/customer.types').CustomerFormData} CustomerFormData
 */

/**
 * Default form values for new customer
 * @type {CustomerFormData}
 */
const getDefaultFormData = () => ({
  name: '',
  type: 'individual',
  contactPerson: '',
  phone: '',
  email: '',
  vatRegistrationNumber: '',
  street: '',
  city: '',
  region: '',
  country: 'Oman',
  creditLimit: 0,
  paymentTerms: 0,
  specialTerms: '',
  isTaxable: true
})

/**
 * Extract form data from existing customer object
 * @param {Customer|null} customer - Existing customer to edit
 * @returns {CustomerFormData}
 */
const customerToFormData = (customer) => {
  if (!customer) return getDefaultFormData()

  return {
    name: customer.name || '',
    type: customer.type || 'individual',
    contactPerson: customer.contactPerson || '',
    phone: customer.contact?.phone || customer.phone || '',
    email: customer.contact?.email || customer.email || '',
    vatRegistrationNumber: customer.contact?.vatRegistrationNumber || customer.vatRegistration || '',
    street: customer.contact?.address?.street || '',
    city: customer.contact?.address?.city || '',
    region: customer.contact?.address?.region || '',
    country: customer.contact?.address?.country || 'Oman',
    creditLimit: customer.creditLimit || 0,
    paymentTerms: customer.paymentTerms || customer.paymentTermDays || 0,
    specialTerms: customer.contractDetails?.specialTerms || '',
    isTaxable: customer.is_taxable !== false
  }
}

/**
 * Transform form data to backend API format
 * @param {CustomerFormData} formData - Form data to transform
 * @param {Customer|null} existingCustomer - Existing customer for contract preservation
 * @returns {Object} Backend API format
 */
const formDataToApiFormat = (formData, existingCustomer = null) => {
  const addressParts = [formData.street, formData.city, formData.region]
    .filter(Boolean)
    .join(', ')

  const customerData = {
    name: formData.name,
    customerType: formData.type || 'individual',
    contactPerson: formData.contactPerson,
    phone: formData.phone,
    email: formData.email,
    vatRegistration: formData.vatRegistrationNumber,
    address: addressParts,
    creditLimit: parseFloat(formData.creditLimit) || 0,
    paymentTermDays: parseInt(formData.paymentTerms) || 0,
    notes: formData.specialTerms || '',
    is_taxable: formData.isTaxable,
    isActive: true
  }

  // Preserve/create contract details for contract-type customers
  if (formData.type === 'contract' && formData.specialTerms) {
    customerData.contractDetails = {
      contractId: existingCustomer?.contractDetails?.contractId || `CNT-${Date.now()}`,
      startDate: existingCustomer?.contractDetails?.startDate || new Date().toISOString().split('T')[0],
      endDate: existingCustomer?.contractDetails?.endDate || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'active',
      specialTerms: formData.specialTerms,
      rates: existingCustomer?.contractDetails?.rates || {}
    }
  }

  return customerData
}

/**
 * Hook for managing customer form state
 * @param {Customer|null} customer - Existing customer for editing, null for new
 * @returns {Object} Form state and handlers
 */
export const useCustomerForm = (customer = null) => {
  const [formData, setFormData] = useState(() => customerToFormData(customer))
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
   * @param {Partial<CustomerFormData>} updates - Fields to update
   */
  const updateFields = useCallback((updates) => {
    setFormData(prev => ({ ...prev, ...updates }))
    setIsDirty(true)
  }, [])

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    setFormData(customerToFormData(customer))
    setIsDirty(false)
  }, [customer])

  /**
   * Get data ready for API submission
   */
  const getApiData = useCallback(() => {
    return formDataToApiFormat(formData, customer)
  }, [formData, customer])

  /**
   * Validation - returns array of error messages
   */
  const validationErrors = useMemo(() => {
    const errors = []
    if (!formData.name?.trim()) errors.push('Customer name is required')
    if (!formData.phone?.trim()) errors.push('Phone number is required')
    return errors
  }, [formData.name, formData.phone])

  const isValid = validationErrors.length === 0

  return {
    formData,
    setFormData,
    updateField,
    updateFields,
    resetForm,
    getApiData,
    isDirty,
    isValid,
    validationErrors,
    isEditing: !!customer
  }
}

export default useCustomerForm
