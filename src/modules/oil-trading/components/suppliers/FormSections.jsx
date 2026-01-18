/**
 * Supplier Form Sections
 *
 * Reusable form section components for supplier create/edit forms.
 * Each section handles a specific aspect of supplier data.
 */

import React from 'react'
import { User, Phone, Package, Banknote, FileText } from 'lucide-react'

/**
 * @typedef {import('../../types/supplier.types').SupplierFormData} SupplierFormData
 * @typedef {import('../../types/supplier.types').SupplierType} SupplierType
 * @typedef {import('../../types/supplier.types').Region} Region
 * @typedef {import('../../types/supplier.types').Specialization} Specialization
 */

/**
 * Basic Information Section
 * @param {Object} props
 * @param {SupplierFormData} props.formData
 * @param {Function} props.updateField
 * @param {SupplierType[]} props.supplierTypes
 */
export const BasicInfoSection = ({ formData, updateField, supplierTypes }) => (
  <div className="form-section">
    <div className="form-section-title">
      <User size={20} />
      Basic Information
    </div>

    <div className="form-grid">
      <div className="form-group">
        <label>Supplier Code *</label>
        <input
          type="text"
          value={formData.code || ''}
          onChange={(e) => updateField('code', e.target.value)}
          required
          placeholder="Enter supplier code"
        />
      </div>

      <div className="form-group">
        <label>Supplier Name *</label>
        <input
          type="text"
          value={formData.name || ''}
          onChange={(e) => updateField('name', e.target.value)}
          required
          placeholder="Enter supplier name"
        />
      </div>

      <div className="form-group">
        <label>Supplier Type</label>
        <select
          value={formData.type || ''}
          onChange={(e) => updateField('type', e.target.value)}
        >
          <option value="">Select Type...</option>
          {supplierTypes.map(type => (
            <option key={type.id} value={type.code}>
              {type.name}
            </option>
          ))}
        </select>
      </div>

      {formData.type !== 'individual' && (
        <div className="form-group">
          <label>Business Registration</label>
          <input
            type="text"
            value={formData.businessRegistration || ''}
            onChange={(e) => updateField('businessRegistration', e.target.value)}
            placeholder="CR-12345678"
          />
        </div>
      )}

      <div className="form-group">
        <label>Contact Person</label>
        <input
          type="text"
          value={formData.contactPerson || ''}
          onChange={(e) => updateField('contactPerson', e.target.value)}
          placeholder="Enter contact person name"
        />
      </div>

      <div className="form-group">
        <label>National ID</label>
        <input
          type="text"
          value={formData.nationalId || ''}
          onChange={(e) => updateField('nationalId', e.target.value)}
          placeholder="12345678"
        />
      </div>
    </div>
  </div>
)

/**
 * Contact Information Section
 * @param {Object} props
 * @param {SupplierFormData} props.formData
 * @param {Function} props.updateField
 * @param {Region[]} props.regions
 * @param {Function} props.t - Translation function
 */
export const ContactSection = ({ formData, updateField, regions, t }) => (
  <div className="form-section">
    <div className="form-section-title">
      <Phone size={20} />
      Contact Information
    </div>

    <div className="form-grid">
      <div className="form-group">
        <label>Phone Number *</label>
        <input
          type="tel"
          value={formData.phone || ''}
          onChange={(e) => updateField('phone', e.target.value)}
          required
          placeholder="+968 1234 5678"
        />
      </div>

      <div className="form-group">
        <label>Email</label>
        <input
          type="email"
          value={formData.email || ''}
          onChange={(e) => updateField('email', e.target.value)}
          placeholder="supplier@example.com"
        />
      </div>

      <div className="form-group">
        <label>{t('vatRegistrationNumber')}</label>
        <input
          type="text"
          value={formData.vatRegistrationNumber || ''}
          onChange={(e) => updateField('vatRegistrationNumber', e.target.value)}
          placeholder="OM12345678901"
        />
      </div>

      <div className="form-group">
        <label>Street Address</label>
        <textarea
          value={formData.address || ''}
          onChange={(e) => updateField('address', e.target.value)}
          placeholder="Building, street, area (excluding city and region)"
          rows="2"
        />
      </div>

      <div className="form-group">
        <label>City</label>
        <input
          type="text"
          value={formData.city || ''}
          onChange={(e) => updateField('city', e.target.value)}
          placeholder="Muscat"
        />
      </div>

      <div className="form-group">
        <label>Region</label>
        <select
          value={formData.region_id || ''}
          onChange={(e) => updateField('region_id', parseInt(e.target.value) || null)}
        >
          <option value="">Select Region</option>
          {regions.map(region => (
            <option key={region.id} value={region.id}>
              {region.name} - {region.governorate}
            </option>
          ))}
        </select>
      </div>
    </div>
  </div>
)

/**
 * Business Details Section
 * @param {Object} props
 * @param {SupplierFormData} props.formData
 * @param {Function} props.updateField
 * @param {Function} props.toggleSpecialization
 * @param {Specialization[]} props.specializations
 * @param {Function} props.t - Translation function
 */
export const BusinessSection = ({ formData, updateField, toggleSpecialization, specializations, t }) => (
  <div className="form-section">
    <div className="form-section-title">
      <Package size={20} />
      Business Details
    </div>

    {/* Specialization Grid - Clean Tailwind Layout */}
    <div className="mb-6">
      <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-3">
        {t('specialization', 'Specialization')}
      </label>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        {specializations.map(spec => {
          const isChecked = (formData.specialization || []).includes(spec.id)
          return (
            <label
              key={spec.id}
              className={`
                relative flex items-start gap-3 p-4 cursor-pointer
                border transition-all duration-150
                ${isChecked
                  ? 'bg-blue-50 border-blue-500 ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }
              `}
              style={{ borderRadius: 0 }}
            >
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => toggleSpecialization(spec.id)}
                className="mt-0.5 w-4 h-4 text-blue-600 border-slate-300 focus:ring-blue-500"
                style={{ borderRadius: 0 }}
              />
              <div className="flex-1 min-w-0">
                <span className={`block text-sm font-medium ${isChecked ? 'text-blue-900' : 'text-slate-800'}`}>
                  {spec.name}
                </span>
                <span className={`block text-xs mt-0.5 leading-relaxed ${isChecked ? 'text-blue-700' : 'text-slate-500'}`}>
                  {spec.description}
                </span>
              </div>
            </label>
          )
        })}
      </div>
    </div>

    {/* Other Fields */}
    <div className="form-grid">
      <div className="form-group">
        <label>Payment Terms (Days)</label>
        <input
          type="number"
          value={formData.paymentTerms || 30}
          onChange={(e) => updateField('paymentTerms', parseInt(e.target.value) || 30)}
          min="0"
          max="365"
        />
      </div>

      <div className="form-group">
        <label>Status</label>
        <select
          value={formData.isActive ? 'active' : 'inactive'}
          onChange={(e) => updateField('isActive', e.target.value === 'active')}
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {formData.type !== 'individual' && (
        <div className="form-group">
          <label>Tax Number</label>
          <input
            type="text"
            value={formData.taxNumber || ''}
            onChange={(e) => updateField('taxNumber', e.target.value)}
            placeholder="TAX-12345678"
          />
        </div>
      )}
    </div>
  </div>
)

/**
 * Banking Information Section
 * @param {Object} props
 * @param {SupplierFormData} props.formData
 * @param {Function} props.updateField
 */
export const BankingSection = ({ formData, updateField }) => (
  <div className="form-section">
    <div className="form-section-title">
      <Banknote size={20} />
      Banking Information
    </div>

    <div className="form-grid">
      <div className="form-group">
        <label>Bank Name</label>
        <input
          type="text"
          value={formData.bankName || ''}
          onChange={(e) => updateField('bankName', e.target.value)}
          placeholder="Bank Muscat"
        />
      </div>

      <div className="form-group">
        <label>Account Number</label>
        <input
          type="text"
          value={formData.accountNumber || ''}
          onChange={(e) => updateField('accountNumber', e.target.value)}
          placeholder="1234567890"
        />
      </div>

      <div className="form-group">
        <label>IBAN</label>
        <input
          type="text"
          value={formData.iban || ''}
          onChange={(e) => updateField('iban', e.target.value)}
          placeholder="OM81BMAG0001234567890"
        />
      </div>
    </div>
  </div>
)

/**
 * Notes Section
 * @param {Object} props
 * @param {SupplierFormData} props.formData
 * @param {Function} props.updateField
 */
export const NotesSection = ({ formData, updateField }) => (
  <div className="form-section">
    <h4>Additional Information</h4>
    <div className="form-group full-width">
      <label>Notes</label>
      <textarea
        value={formData.notes || ''}
        onChange={(e) => updateField('notes', e.target.value)}
        placeholder="Enter any additional information about this supplier..."
        rows="4"
        className="form-control"
      />
    </div>
  </div>
)

/**
 * Attachments Section (for edit mode only)
 * @param {Object} props
 * @param {Array} props.attachments
 * @param {boolean} props.loading
 * @param {Function} props.onUpload
 * @param {Function} props.onDelete
 * @param {Function} props.onRefreshUrl
 * @param {Function} props.t
 */
export const AttachmentsSection = ({
  attachments,
  loading,
  onUpload,
  onDelete,
  onRefreshUrl,
  t,
  FileUpload,
  FileViewer
}) => (
  <div className="form-section">
    <div className="form-section-title">
      <FileText size={16} />
      Attachments
    </div>

    <FileUpload
      mode="multiple"
      accept=".pdf,.jpg,.jpeg,.png"
      maxSize={5242880}
      maxFiles={10}
      onUpload={onUpload}
      existingFiles={[]}
    />

    {loading ? (
      <div className="attachments-loading">Loading attachments...</div>
    ) : attachments.length > 0 ? (
      <FileViewer
        files={attachments}
        onDelete={onDelete}
        onRefreshUrl={onRefreshUrl}
        canDelete={true}
      />
    ) : (
      <div className="empty-state text-sm">{t('noAttachments')}</div>
    )}
  </div>
)

export default {
  BasicInfoSection,
  ContactSection,
  BusinessSection,
  BankingSection,
  NotesSection,
  AttachmentsSection
}
