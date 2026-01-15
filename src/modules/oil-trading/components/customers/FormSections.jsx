/**
 * Customer Form Sections
 *
 * Reusable form section components for customer forms.
 * Each section handles a specific group of related fields.
 */

import React from 'react'
import { FileText } from 'lucide-react'

/**
 * Form section wrapper with icon and title
 */
export const FormSection = ({ icon, title, children, className = '' }) => (
  <div className={`form-section ${className}`}>
    <div className="form-section-title">
      {icon}
      {title}
    </div>
    {children}
  </div>
)

/**
 * Reusable input with icon
 */
export const IconInput = ({
  icon,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  className = ''
}) => (
  <div className={`input-with-icon ${className}`}>
    {icon && <span className="input-icon">{icon}</span>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      disabled={disabled}
    />
  </div>
)

/**
 * User/Person icon SVG
 */
const UserIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </svg>
)

/**
 * Phone icon SVG
 */
const PhoneIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
  </svg>
)

/**
 * Email icon SVG
 */
const EmailIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
    <polyline points="22,6 12,13 2,6" />
  </svg>
)

/**
 * Document icon SVG
 */
const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14,2 14,8 20,8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
)

/**
 * ID Card icon SVG
 */
const IdCardIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="16" rx="2" ry="2" />
    <line x1="7" y1="8" x2="17" y2="8" />
    <line x1="7" y1="12" x2="17" y2="12" />
    <line x1="7" y1="16" x2="13" y2="16" />
  </svg>
)

/**
 * Location icon SVG
 */
const LocationIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
)

/**
 * Money icon SVG
 */
const MoneyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="12" x="2" y="6" rx="2" />
    <circle cx="12" cy="12" r="2" />
    <path d="M6 12h.01M18 12h.01" />
  </svg>
)

/**
 * Clock icon SVG
 */
const ClockIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <polyline points="12,6 12,12 16,14" />
  </svg>
)

/**
 * Basic Information Section
 */
export const BasicInfoSection = ({ formData, updateField, customerTypes, customer, t }) => (
  <FormSection
    icon={<UserIcon />}
    title="Basic Information"
  >
    <div className="form-grid">
      {/* Customer ID - Auto-generated, read-only */}
      <div className="form-group">
        <label>Customer ID</label>
        <div className="input-with-icon">
          <span className="input-icon"><IdCardIcon /></span>
          <input
            type="text"
            value={customer ? customer.code : 'AR-CUST-XXX (Auto-generated)'}
            disabled
            className="readonly-input"
            style={{ backgroundColor: '#f5f5f5', color: '#666', cursor: 'not-allowed' }}
          />
        </div>
        <small style={{ color: '#888', fontSize: '12px', marginTop: '4px', display: 'block' }}>
          {customer ? 'Customer code assigned at creation' : 'Will be assigned automatically when customer is created'}
        </small>
      </div>

      <div className="form-group">
        <label>Customer Name *</label>
        <div className="input-with-icon">
          <span className="input-icon"><UserIcon /></span>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder="Enter customer name"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Customer Type *</label>
        <select
          value={formData.type}
          onChange={(e) => updateField('type', e.target.value)}
          required
        >
          <option value="">Select Type...</option>
          {customerTypes.map(type => (
            <option key={type.id} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label>Contact Person</label>
        <div className="input-with-icon">
          <span className="input-icon"><UserIcon /></span>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => updateField('contactPerson', e.target.value)}
            placeholder="Enter contact person name"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Phone Number *</label>
        <div className="input-with-icon">
          <span className="input-icon"><PhoneIcon /></span>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => updateField('phone', e.target.value)}
            placeholder="+968 XXXX XXXX"
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Email Address</label>
        <div className="input-with-icon">
          <span className="input-icon"><EmailIcon /></span>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField('email', e.target.value)}
            placeholder="customer@example.com"
          />
        </div>
      </div>

      <div className="form-group">
        <label>{t('vatRegistrationNumber')}</label>
        <div className="input-with-icon">
          <span className="input-icon"><DocumentIcon /></span>
          <input
            type="text"
            value={formData.vatRegistrationNumber}
            onChange={(e) => updateField('vatRegistrationNumber', e.target.value)}
            placeholder="OM12345678901"
          />
        </div>
      </div>
    </div>
  </FormSection>
)

/**
 * Address Information Section
 */
export const AddressSection = ({ formData, updateField }) => (
  <FormSection
    icon={<LocationIcon />}
    title="Address Information"
  >
    <div className="form-grid">
      <div className="form-group full-width">
        <label>Street Address</label>
        <input
          type="text"
          value={formData.street}
          onChange={(e) => updateField('street', e.target.value)}
          placeholder="Enter street address"
        />
      </div>

      <div className="form-group">
        <label>City</label>
        <input
          type="text"
          value={formData.city}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="Enter city"
        />
      </div>

      <div className="form-group">
        <label>Region</label>
        <input
          type="text"
          value={formData.region}
          onChange={(e) => updateField('region', e.target.value)}
          placeholder="Enter region/governorate"
        />
      </div>
    </div>
  </FormSection>
)

/**
 * Business Terms Section
 */
export const BusinessTermsSection = ({ formData, updateField }) => (
  <FormSection
    icon={<MoneyIcon />}
    title="Business Terms"
  >
    <div className="form-grid">
      <div className="form-group">
        <label>Credit Limit (OMR)</label>
        <div className="input-with-icon">
          <span className="input-icon"><MoneyIcon /></span>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.creditLimit}
            onChange={(e) => updateField('creditLimit', e.target.value)}
            placeholder="0.00"
          />
        </div>
      </div>

      <div className="form-group">
        <label>Payment Terms (days)</label>
        <div className="input-with-icon">
          <span className="input-icon"><ClockIcon /></span>
          <input
            type="number"
            min="0"
            value={formData.paymentTerms}
            onChange={(e) => updateField('paymentTerms', e.target.value)}
            placeholder="30"
          />
        </div>
      </div>
    </div>

    {/* Tax Status */}
    <div className="form-group full-width" style={{ marginTop: '10px', padding: '0 1.25rem 1.25rem' }}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={formData.isTaxable}
          onChange={(e) => updateField('isTaxable', e.target.checked)}
          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
        />
        <span>Customer is Taxable (Apply VAT on sales)</span>
      </label>
      <small style={{ color: '#666', marginLeft: '26px', display: 'block', marginTop: '4px' }}>
        If unchecked, no VAT will be applied to this customer's sales orders
      </small>
    </div>
  </FormSection>
)

/**
 * Contract Terms Section (only for contract-type customers)
 */
export const ContractTermsSection = ({ formData, updateField }) => {
  if (formData.type !== 'contract') return null

  return (
    <div className="contract-terms-section">
      <div className="form-section-title">
        <FileText size={16} />
        Contract Terms & Conditions
      </div>
      <div className="form-group full-width" style={{ padding: '1.25rem' }}>
        <label>Special Terms & Conditions</label>
        <textarea
          value={formData.specialTerms}
          onChange={(e) => updateField('specialTerms', e.target.value)}
          rows="4"
          placeholder="Enter special contract terms, pricing agreements, delivery conditions, payment terms, etc..."
        />
      </div>
    </div>
  )
}

export default {
  FormSection,
  IconInput,
  BasicInfoSection,
  AddressSection,
  BusinessTermsSection,
  ContractTermsSection
}
