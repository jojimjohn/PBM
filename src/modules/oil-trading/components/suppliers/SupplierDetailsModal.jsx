/**
 * Supplier Details Modal
 *
 * Read-only modal for viewing supplier details.
 * Uses consistent design system patterns with customer details modal.
 */

import React from 'react'
import { Edit, Plus, Phone, Building } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'

/**
 * @typedef {import('../../types/supplier.types').Supplier} Supplier
 * @typedef {import('../../types/supplier.types').SupplierType} SupplierType
 */

/**
 * Format date for display
 * @param {string} dateString - ISO date string
 * @returns {string} Formatted date
 */
const formatDate = (dateString) => {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-GB')
}

/**
 * Supplier header with avatar and key info
 * @param {Object} props
 * @param {Supplier} props.supplier
 * @param {SupplierType[]} props.supplierTypes
 * @param {Function} props.onEdit
 */
const SupplierHeader = ({ supplier, supplierTypes, onEdit }) => {
  const initials = supplier.name
    .substring(0, 2)
    .toUpperCase()

  const typeName = supplierTypes.find(t => t.code === supplier.type)?.name || supplier.type

  return (
    <div className="flex items-start justify-between pb-4 mb-4 border-b border-slate-200">
      <div className="flex items-center gap-4">
        <div className="avatar avatar-xl primary">
          {initials}
        </div>
        <div>
          <h3 className="text-xl font-semibold text-slate-800">{supplier.name}</h3>
          <div className="flex items-center gap-2 mt-1">
            <code className="cell-code accent">{supplier.code}</code>
            <span className="type-badge">{typeName}</span>
            <span className={`status-badge ${supplier.isActive ? 'active' : 'inactive'}`}>
              {supplier.isActive ? '● Active' : '○ Inactive'}
            </span>
          </div>
        </div>
      </div>
      <button
        className="btn-icon-action secondary"
        onClick={onEdit}
        title="Edit Supplier"
      >
        <Edit size={18} />
      </button>
    </div>
  )
}

/**
 * Contact information section
 * @param {Object} props
 * @param {Supplier} props.supplier
 * @param {Function} props.t
 */
const ContactSection = ({ supplier, t }) => {
  // Handle multiple possible data formats for backwards compatibility
  const phone = supplier.phone || supplier.contactPhone || supplier.contact?.phone || 'Not provided'
  const email = supplier.email || supplier.contactEmail || supplier.contact?.email || 'Not provided'
  const vatReg = supplier.vatRegistration || supplier.vatRegistrationNumber ||
                 supplier.contact?.vatRegistrationNumber || 'Not provided'

  // Build address string
  let address = supplier.address
  if (!address && supplier.contact?.address) {
    const addr = supplier.contact.address
    address = [addr.street, addr.city, addr.region].filter(Boolean).join(', ')
  }

  return (
    <div className="ds-form-section">
      <div className="ds-form-section-title">
        <Phone size={16} /> Contact Information
      </div>
      <div className="ds-form-grid two-col">
        <div className="ds-form-group">
          <label className="ds-form-label">Contact Person</label>
          <div className="cell-text">{supplier.contactPerson || 'Not specified'}</div>
        </div>
        <div className="ds-form-group">
          <label className="ds-form-label">Phone Number</label>
          <div className="cell-text">{phone}</div>
        </div>
        <div className="ds-form-group">
          <label className="ds-form-label">Email Address</label>
          <div className="cell-text">{email}</div>
        </div>
        <div className="ds-form-group">
          <label className="ds-form-label">{t('vatRegistrationNumber')}</label>
          <div className="cell-text">{vatReg}</div>
        </div>
        <div className="ds-form-group full-width">
          <label className="ds-form-label">Physical Address</label>
          <div className="cell-text">{address || 'Not provided'}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Business information section
 * @param {Object} props
 * @param {Supplier} props.supplier
 * @param {SupplierType[]} props.supplierTypes
 */
const BusinessSection = ({ supplier, supplierTypes }) => {
  const typeName = supplierTypes.find(t => t.code === supplier.type)?.name || supplier.type
  const paymentTerms = supplier.paymentTerms || supplier.paymentTermDays || 0

  return (
    <div className="ds-form-section">
      <div className="ds-form-section-title">
        <Building size={16} /> Business Information
      </div>
      <div className="ds-form-grid two-col">
        <div className="ds-form-group">
          <label className="ds-form-label">Supplier Type</label>
          <div className="cell-text">{typeName}</div>
        </div>
        {supplier.businessRegistration && (
          <div className="ds-form-group">
            <label className="ds-form-label">Business Registration</label>
            <div className="cell-text">{supplier.businessRegistration}</div>
          </div>
        )}
        <div className="ds-form-group">
          <label className="ds-form-label">Payment Terms</label>
          <div className="cell-text">{paymentTerms} days</div>
        </div>
        <div className="ds-form-group">
          <label className="ds-form-label">Tax Number</label>
          <div className="cell-text">{supplier.taxNumber || 'Not provided'}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Supplier details view modal
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onEdit - Edit handler
 * @param {Function} props.onCreatePurchaseOrder - Create PO handler
 * @param {Supplier} props.supplier - Supplier to display
 * @param {SupplierType[]} props.supplierTypes - Available supplier types
 * @param {Function} props.t - Translation function
 */
const SupplierDetailsModal = ({
  isOpen,
  onClose,
  onEdit,
  onCreatePurchaseOrder,
  supplier,
  supplierTypes,
  t
}) => {
  if (!supplier) return null

  const modalFooter = (
    <>
      <span className="text-sm text-slate-500">
        Last updated: {formatDate(supplier.updated_at || supplier.created_at || supplier.createdAt)}
      </span>
      <div className="flex items-center gap-2">
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
        <button className="btn btn-primary" onClick={onEdit}>
          <Edit size={16} />
          Edit Supplier
        </button>
        <button className="btn btn-success" onClick={onCreatePurchaseOrder}>
          <Plus size={16} />
          New Purchase Order
        </button>
      </div>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t?.('supplierDetails', 'Supplier Details') || 'Supplier Details'}
      footer={modalFooter}
      size="lg"
      showCloseButton
    >
      {/* Custom Header with Avatar */}
      <SupplierHeader
        supplier={supplier}
        supplierTypes={supplierTypes}
        onEdit={onEdit}
      />

      {/* Content Sections */}
      <ContactSection supplier={supplier} t={t} />
      <BusinessSection supplier={supplier} supplierTypes={supplierTypes} />
    </Modal>
  )
}

export default SupplierDetailsModal
