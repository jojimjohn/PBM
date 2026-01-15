/**
 * Contract Details Modal
 *
 * Modal for viewing contract details including material rates.
 * Uses useContractRates hook for rate calculations.
 */

import React from 'react'
import Modal from '../../../../components/ui/Modal'
import { useContractRates } from '../../hooks/useContractRates'
import { ContractRatesTable, EmptyRatesState } from './ContractRatesTable'

/**
 * @typedef {import('../../types/customer.types').Customer} Customer
 */

/**
 * Loading spinner component
 */
const LoadingState = () => (
  <div className="loading-section">
    <div className="loading-spinner"></div>
    <p>Loading contract details...</p>
  </div>
)

/**
 * Error state component
 */
const ErrorState = ({ error, onClose, onRetry }) => (
  <div className="error-section">
    <div className="empty-rates">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <h3>Error Loading Contract Details</h3>
      <p>Failed to load materials data: {error}</p>
    </div>
    <div className="form-actions">
      <button className="btn btn-outline" onClick={onClose}>
        Close
      </button>
      <button className="btn btn-primary" onClick={onRetry}>
        Retry
      </button>
    </div>
  </div>
)

/**
 * No contract found state
 */
const NoContractState = ({ customerName, onClose }) => (
  <Modal
    isOpen={true}
    title="Contract Details - No Contract Found"
    onClose={onClose}
    className="modal-lg"
    closeOnOverlayClick={false}
  >
    <div className="view-modal-content">
      <div className="empty-rates">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
        <h3>No Contract Found</h3>
        <p>This customer doesn't have contract details available.</p>
      </div>
      <div className="form-actions">
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  </Modal>
)

/**
 * Contract information grid
 */
const ContractInfoGrid = ({ customer, contract }) => {
  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  )

  return (
    <div className="form-section">
      <div className="form-section-title">Contract Information</div>
      <div className="details-grid three-col">
        <div className="detail-item">
          <label>Customer</label>
          <span>{customer.name}</span>
        </div>
        <div className="detail-item">
          <label>Contract ID</label>
          <span>{contract.contractId}</span>
        </div>
        <div className="detail-item">
          <label>Status</label>
          <span className={`badge ${contract.status}`}>{contract.status.toUpperCase()}</span>
        </div>
        <div className="detail-item">
          <label>Start Date</label>
          <span>{new Date(contract.startDate).toLocaleDateString()}</span>
        </div>
        <div className="detail-item">
          <label>End Date</label>
          <span>{new Date(contract.endDate).toLocaleDateString()}</span>
        </div>
        <div className="detail-item">
          <label>Days Remaining</label>
          <span className="highlight">{daysRemaining} days</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Contract details view modal
 *
 * @param {Object} props
 * @param {Customer} props.customer - Customer with contract details
 * @param {Function} props.onClose - Called when modal is closed
 * @param {Function} props.onEdit - Called when edit is requested
 */
const ContractDetailsModal = ({ customer, onClose, onEdit }) => {
  // Early validation
  if (!customer) {
    console.error('ContractDetailsModal: customer prop is missing')
    return null
  }

  const contract = customer.contractDetails

  // Load materials and calculate rates
  const { materialsWithRates, ratedMaterialsCount, loading, error } = useContractRates(contract)

  // No contract found
  if (!contract) {
    return <NoContractState customerName={customer.name} onClose={onClose} />
  }

  return (
    <Modal
      isOpen={true}
      title={`Contract Details - ${contract.contractId}`}
      onClose={onClose}
      className="modal-xxl"
      closeOnOverlayClick={false}
    >
      <div className="view-modal-content">
        {loading && <LoadingState />}

        {error && (
          <ErrorState
            error={error}
            onClose={onClose}
            onRetry={() => window.location.reload()}
          />
        )}

        {!loading && !error && (
          <>
            <ContractInfoGrid customer={customer} contract={contract} />

            <div className="form-section">
              <div className="form-section-title">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z" />
                  <path d="M12 5L8 21l4-7 4 7-4-16" />
                </svg>
                Material Rates
              </div>

              <ContractRatesTable
                materialsWithRates={materialsWithRates}
                totalCount={ratedMaterialsCount}
              />
            </div>

            {contract.specialTerms && (
              <div className="form-section">
                <div className="form-section-title">Special Terms & Conditions</div>
                <p className="terms-text">{contract.specialTerms}</p>
              </div>
            )}

            <div className="form-actions">
              <button className="btn btn-outline" onClick={onClose}>
                Close
              </button>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  console.log('Edit contract clicked for customer:', customer.name)
                  onEdit()
                }}
              >
                Edit Contract
              </button>
              <button className="btn btn-warning">
                Renew Contract
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

export default ContractDetailsModal
