/**
 * Contract Edit Modal
 *
 * Modal for editing contract details and material rates.
 * Uses useContractEditor hook for form state management.
 */

import React from 'react'
import Modal from '../../../../components/ui/Modal'
import { useContractEditor } from '../../hooks/useContractRates'
import { EditableRatesTable } from './ContractRatesTable'
import { CONTRACT_STATUS } from '../../types/customer.types'

/**
 * @typedef {import('../../types/customer.types').Customer} Customer
 */

/**
 * Contract edit form modal
 *
 * @param {Object} props
 * @param {Customer} props.customer - Customer with contract to edit
 * @param {Function} props.onClose - Called when modal is closed
 * @param {Function} props.onSave - Called with updated contract data
 */
const ContractEditModal = ({ customer, onClose, onSave }) => {
  const {
    formData,
    updateField,
    updateRate,
    addMaterialRate,
    removeMaterialRate,
    availableMaterials,
    contractMaterials,
    loading
  } = useContractEditor(customer?.contractDetails)

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (loading) {
    return (
      <Modal
        isOpen={true}
        title="Edit Contract"
        onClose={onClose}
        className="modal-xxl"
        closeOnOverlayClick={false}
      >
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Loading contract editor...</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={true}
      title={`Edit Contract - ${customer.name}`}
      onClose={onClose}
      className="modal-xxl"
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="view-modal-content">
        {/* Contract Basic Information */}
        <div className="form-section">
          <div className="form-section-title">Contract Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Contract ID</label>
              <input
                type="text"
                value={formData.contractId}
                onChange={(e) => updateField('contractId', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => updateField('status', e.target.value)}
              >
                <option value={CONTRACT_STATUS.ACTIVE}>Active</option>
                <option value={CONTRACT_STATUS.EXPIRED}>Expired</option>
                <option value={CONTRACT_STATUS.SUSPENDED}>Suspended</option>
                <option value={CONTRACT_STATUS.CANCELLED}>Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => updateField('startDate', e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => updateField('endDate', e.target.value)}
                required
              />
            </div>
          </div>
        </div>

        {/* Special Terms */}
        <div className="form-section">
          <div className="form-section-title">Special Terms & Conditions</div>
          <div className="form-group full-width" style={{ padding: '1.25rem' }}>
            <label>Contract Terms</label>
            <textarea
              value={formData.specialTerms}
              onChange={(e) => updateField('specialTerms', e.target.value)}
              rows="3"
              placeholder="Enter special contract terms, conditions, and notes..."
            />
          </div>
        </div>

        {/* Material Rates */}
        <div className="form-section">
          <div className="form-section-title">
            Material Rates
            <AddMaterialDropdown
              materials={availableMaterials}
              onAdd={addMaterialRate}
            />
          </div>

          <div style={{ padding: '1.25rem' }}>
            <EditableRatesTable
              contractMaterials={contractMaterials}
              updateRate={updateRate}
              removeMaterialRate={removeMaterialRate}
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Update Contract
          </button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Dropdown for adding new material rates
 */
const AddMaterialDropdown = ({ materials, onAdd }) => (
  <select
    onChange={(e) => {
      if (e.target.value) {
        onAdd(e.target.value)
        e.target.value = ''
      }
    }}
    className="btn btn-outline btn-sm"
    style={{ marginLeft: 'auto' }}
  >
    <option value="">Add Material Rate...</option>
    {materials.map(material => (
      <option key={material.id} value={material.id}>
        {material.name}
      </option>
    ))}
  </select>
)

export default ContractEditModal
