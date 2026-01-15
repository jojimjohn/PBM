/**
 * Customer Form Modal
 *
 * Modal dialog for creating and editing customers.
 * Uses composition of form section components.
 */

import React, { useEffect, useState } from 'react'
import Modal from '../../../../components/ui/Modal'
import { useCustomerForm } from '../../hooks/useCustomerForm'
import {
  BasicInfoSection,
  AddressSection,
  BusinessTermsSection,
  ContractTermsSection
} from './FormSections'
import AttachmentsSection from './AttachmentsSection'
import typesService from '../../../../services/typesService'

/**
 * @typedef {import('../../types/customer.types').Customer} Customer
 * @typedef {import('../../types/customer.types').CustomerType_Option} CustomerType_Option
 */

/**
 * Customer create/edit form modal
 *
 * @param {Object} props
 * @param {Customer|null} props.customer - Customer to edit (null for new)
 * @param {Function} props.onSave - Called with customer data on save
 * @param {Function} props.onCancel - Called when modal is closed
 * @param {Function} props.t - Translation function
 */
const CustomerFormModal = ({ customer, onSave, onCancel, t }) => {
  const {
    formData,
    updateField,
    getApiData,
    isValid
  } = useCustomerForm(customer)

  /** @type {[CustomerType_Option[], Function]} */
  const [customerTypes, setCustomerTypes] = useState([])

  // Load customer types from database
  useEffect(() => {
    const loadCustomerTypes = async () => {
      try {
        const result = await typesService.getCustomerTypes()
        if (result.success) {
          setCustomerTypes(result.data || [])
        }
      } catch (error) {
        console.error('Error loading customer types:', error)
      }
    }
    loadCustomerTypes()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!isValid) return
    onSave(getApiData())
  }

  return (
    <Modal
      isOpen={true}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      onClose={onCancel}
      closeOnOverlayClick={false}
      className="modal-xl"
    >
      <form onSubmit={handleSubmit} className="customer-form wide-form">
        <BasicInfoSection
          formData={formData}
          updateField={updateField}
          customerTypes={customerTypes}
          customer={customer}
          t={t}
        />

        <AddressSection
          formData={formData}
          updateField={updateField}
        />

        <BusinessTermsSection
          formData={formData}
          updateField={updateField}
        />

        <ContractTermsSection
          formData={formData}
          updateField={updateField}
        />

        <AttachmentsSection
          customerId={customer?.id}
          t={t}
        />

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {customer ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default CustomerFormModal
