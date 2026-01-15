/**
 * Customer Details Tab Components
 *
 * Individual tab panels for the customer details modal.
 * Each tab focuses on a specific aspect of customer data.
 */

import React from 'react'
import {
  User, Phone, Mail, Calendar, Banknote, ShoppingCart, FileText
} from 'lucide-react'

/**
 * Overview Tab - Quick summary using form grid pattern
 */
export const OverviewTab = ({ customer, t }) => (
  <div className="ds-form-section">
    <div className="ds-form-grid three-col">
      <div className="ds-form-group">
        <label className="ds-form-label">
          <User size={14} /> Contact Person
        </label>
        <div className="cell-text">{customer.contactPerson || 'Not specified'}</div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <Phone size={14} /> Phone
        </label>
        <div className="cell-text">{customer.contact?.phone || 'Not specified'}</div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <Mail size={14} /> Email
        </label>
        <div className="cell-text">{customer.contact?.email || 'Not specified'}</div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <Banknote size={14} /> Credit Limit
        </label>
        <div className="cell-text text-success font-semibold">
          {`OMR ${parseFloat(customer.creditLimit || 0).toFixed(2)}`}
        </div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <Calendar size={14} /> Payment Terms
        </label>
        <div className="cell-text">{`${customer.paymentTerms || 0} days`}</div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          {customer.is_taxable !== false ? <CheckIcon /> : <CrossIcon />} Tax Status
        </label>
        <div className={`cell-text ${customer.is_taxable !== false ? 'text-success' : 'text-muted'}`}>
          {customer.is_taxable !== false ? 'VAT Applied' : 'Non-Taxable'}
        </div>
      </div>
    </div>
  </div>
)

/**
 * Check icon SVG
 */
const CheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
    <polyline points="22 4 12 14.01 9 11.01" />
  </svg>
)

/**
 * Cross icon SVG
 */
const CrossIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <circle cx="12" cy="12" r="10" />
    <line x1="15" y1="9" x2="9" y2="15" />
    <line x1="9" y1="9" x2="15" y2="15" />
  </svg>
)

/**
 * Location icon SVG
 */
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="18" height="18">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

/**
 * Contact Tab - Detailed contact information
 */
export const ContactTab = ({ customer, t }) => {
  const formatAddress = () => {
    const addr = customer.contact?.address
    if (!addr) return 'Not specified'
    const parts = [addr.street, addr.city, addr.region].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : 'Not specified'
  }

  return (
    <div className="ds-form-section">
      <div className="ds-form-grid">
        <div className="ds-form-group">
          <label className="ds-form-label">
            <User size={14} /> Contact Person
          </label>
          <div className="cell-text">{customer.contactPerson || 'Not specified'}</div>
        </div>

        <div className="ds-form-group">
          <label className="ds-form-label">
            <Phone size={14} /> Phone Number
          </label>
          <div className="cell-text">{customer.contact?.phone || 'Not specified'}</div>
        </div>

        <div className="ds-form-group">
          <label className="ds-form-label">
            <Mail size={14} /> Email Address
          </label>
          <div className="cell-text">{customer.contact?.email || 'Not specified'}</div>
        </div>

        <div className="ds-form-group">
          <label className="ds-form-label">
            <FileText size={14} /> {t('vatRegistrationNumber')}
          </label>
          <div className="cell-text">{customer.contact?.vatRegistrationNumber || 'Not registered'}</div>
        </div>

        <div className="ds-form-group full-width">
          <label className="ds-form-label">
            <LocationIcon /> Address
          </label>
          <div className="cell-text">{formatAddress()}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Business Tab - Business terms and settings
 */
export const BusinessTab = ({ customer }) => (
  <div className="ds-form-section">
    <div className="ds-form-grid two-col">
      <div className="ds-form-group">
        <label className="ds-form-label">
          <Banknote size={14} /> Credit Limit
        </label>
        <div className="cell-text text-success font-semibold">
          {`OMR ${parseFloat(customer.creditLimit || 0).toFixed(2)}`}
        </div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <Calendar size={14} /> Payment Terms
        </label>
        <div className="cell-text">{`${customer.paymentTerms || 0} days`}</div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <FileText size={14} /> VAT Status
        </label>
        <div className={`cell-text ${customer.is_taxable !== false ? 'text-success' : 'text-muted'}`}>
          {customer.is_taxable !== false ? '✓ Taxable' : '✗ Non-Taxable'}
        </div>
      </div>
      <div className="ds-form-group">
        <label className="ds-form-label">
          <User size={14} /> Customer Type
        </label>
        <div className="cell-text">{customer.type?.replace(/[-_]/g, ' ').toUpperCase() || 'N/A'}</div>
      </div>
    </div>
  </div>
)

/**
 * Sales Tab - Sales history and statistics
 */
export const SalesTab = ({ customer, onCreateOrder }) => {
  const hasOrders = customer.salesHistory?.totalOrders > 0

  return (
    <>
      <div className="ds-form-section">
        <div className="ds-form-grid three-col">
          <div className="ds-form-group">
            <label className="ds-form-label">
              <ShoppingCart size={14} /> Total Orders
            </label>
            <div className="cell-text font-semibold">{customer.salesHistory?.totalOrders || 0}</div>
          </div>
          <div className="ds-form-group">
            <label className="ds-form-label">
              <Banknote size={14} /> Total Revenue
            </label>
            <div className="cell-text text-success font-semibold">
              {`OMR ${customer.salesHistory?.totalValue?.toFixed(2) || '0.00'}`}
            </div>
          </div>
          <div className="ds-form-group">
            <label className="ds-form-label">
              <Calendar size={14} /> Last Order Date
            </label>
            <div className="cell-text">
              {customer.salesHistory?.lastOrderDate
                ? new Date(customer.salesHistory.lastOrderDate).toLocaleDateString()
                : 'No orders yet'}
            </div>
          </div>
        </div>
      </div>

      {!hasOrders && (
        <div className="empty-state">
          <ShoppingCart size={48} />
          <h3>No Orders Yet</h3>
          <p>This customer hasn't placed any orders yet.</p>
          <button className="btn btn-primary" onClick={onCreateOrder}>
            Create First Order
          </button>
        </div>
      )}
    </>
  )
}

/**
 * Contract Tab - Contract summary (only for contract customers)
 */
export const ContractTab = ({ customer }) => {
  const contract = customer.contractDetails
  if (!contract) return null

  const daysRemaining = Math.max(
    0,
    Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24))
  )

  return (
    <>
      <div className="ds-form-section">
        <div className="ds-form-section-title">
          <FileText size={16} /> Contract Details
        </div>
        <div className="ds-form-grid three-col">
          <div className="ds-form-group">
            <label className="ds-form-label">Contract ID</label>
            <code className="cell-code accent">{contract.contractId}</code>
          </div>

          <div className="ds-form-group">
            <label className="ds-form-label">Status</label>
            <span className={`status-badge ${contract.status}`}>
              {contract.status.toUpperCase()}
            </span>
          </div>

          <div className="ds-form-group">
            <label className="ds-form-label">Days Remaining</label>
            <span className="cell-text text-warning font-semibold">{daysRemaining} days</span>
          </div>

          <div className="ds-form-group">
            <label className="ds-form-label">Start Date</label>
            <span className="cell-text">{new Date(contract.startDate).toLocaleDateString()}</span>
          </div>

          <div className="ds-form-group">
            <label className="ds-form-label">End Date</label>
            <span className="cell-text">{new Date(contract.endDate).toLocaleDateString()}</span>
          </div>
        </div>
      </div>

      {contract.specialTerms && (
        <div className="ds-form-section">
          <div className="ds-form-section-title">Special Terms & Conditions</div>
          <p className="cell-text-secondary">{contract.specialTerms}</p>
        </div>
      )}
    </>
  )
}

export default {
  OverviewTab,
  ContactTab,
  BusinessTab,
  SalesTab,
  ContractTab
}
