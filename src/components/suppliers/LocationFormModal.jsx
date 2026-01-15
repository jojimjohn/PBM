/**
 * Location Form Modal Component
 *
 * Modal for creating and editing supplier locations.
 * Extracted from SupplierLocationManager for reusability.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { MapPin, Phone, Building } from 'lucide-react'
import Modal from '../ui/Modal'

/**
 * @typedef {Object} LocationFormData
 * @property {number|string} supplierId
 * @property {string} locationName
 * @property {string} locationCode
 * @property {string} [address]
 * @property {string} [contactPerson]
 * @property {string} [contactPhone]
 * @property {string} [coordinates]
 * @property {number|string} [region_id]
 * @property {boolean} isActive
 * @property {string} [notes]
 */

const INITIAL_FORM_DATA = {
  supplierId: '',
  locationName: '',
  locationCode: '',
  address: '',
  contactPerson: '',
  contactPhone: '',
  coordinates: '',
  region_id: '',
  isActive: true,
  notes: ''
}

/**
 * LocationFormModal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler
 * @param {Object} [props.location] - Location to edit (null for create)
 * @param {Array} props.suppliers - Available suppliers
 * @param {Array} props.regions - Available regions
 * @param {Function} props.generateLocationCode - Code generator function
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.t - Translation function
 */
const LocationFormModal = ({
  isOpen,
  onClose,
  onSave,
  location,
  suppliers,
  regions,
  generateLocationCode,
  loading,
  t
}) => {
  const [formData, setFormData] = useState(INITIAL_FORM_DATA)
  const [errors, setErrors] = useState({})

  const isEdit = !!location

  // Reset form when modal opens/closes or location changes
  useEffect(() => {
    if (isOpen) {
      if (location) {
        setFormData({
          supplierId: location.supplierId || '',
          locationName: location.locationName || '',
          locationCode: location.locationCode || '',
          address: location.address || '',
          contactPerson: location.contactPerson || '',
          contactPhone: location.contactPhone || '',
          coordinates: location.coordinates || '',
          region_id: location.region_id || '',
          isActive: location.isActive ?? true,
          notes: location.notes || ''
        })
      } else {
        setFormData(INITIAL_FORM_DATA)
      }
      setErrors({})
    }
  }, [isOpen, location])

  /**
   * Handle supplier change - auto-generate code for new locations
   */
  const handleSupplierChange = useCallback((e) => {
    const supplierId = parseInt(e.target.value, 10)

    if (!isEdit && supplierId && generateLocationCode) {
      const code = generateLocationCode(supplierId)
      setFormData(prev => ({
        ...prev,
        supplierId,
        locationCode: code
      }))
    } else {
      setFormData(prev => ({ ...prev, supplierId }))
    }

    if (errors.supplierId) {
      setErrors(prev => ({ ...prev, supplierId: null }))
    }
  }, [isEdit, generateLocationCode, errors.supplierId])

  /**
   * Handle form field change
   */
  const handleChange = useCallback((field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value
    setFormData(prev => ({ ...prev, [field]: value }))

    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  /**
   * Validate form data
   */
  const validate = useCallback(() => {
    const newErrors = {}

    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier'
    }

    if (!formData.locationName || formData.locationName.trim().length < 2) {
      newErrors.locationName = 'Location name must be at least 2 characters'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()

    if (!validate()) return

    const cleanData = {
      supplierId: parseInt(formData.supplierId, 10),
      locationName: formData.locationName.trim(),
      locationCode: formData.locationCode.trim(),
      address: formData.address?.trim() || '',
      contactPerson: formData.contactPerson?.trim() || '',
      contactPhone: formData.contactPhone?.trim() || '',
      coordinates: formData.coordinates?.trim() || '',
      region_id: formData.region_id ? parseInt(formData.region_id, 10) : undefined,
      isActive: formData.isActive === true || formData.isActive === 1,
      notes: formData.notes?.trim() || ''
    }

    await onSave(cleanData, isEdit, location?.id)
  }, [formData, validate, onSave, isEdit, location])

  const title = isEdit
    ? t('editLocation', 'Edit Location')
    : t('addNewLocation', 'Add New Location')

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      className="modal-xl"
    >
      <form className="location-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <div className="form-section-title">
            <MapPin size={20} />
            {t('basicInformation', 'Basic Information')}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{t('supplier', 'Supplier')} *</label>
              <select
                value={formData.supplierId}
                onChange={handleSupplierChange}
                className={`form-control ${errors.supplierId ? 'is-invalid' : ''}`}
              >
                <option value="">{t('selectSupplier', 'Select Supplier')}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
              {errors.supplierId && (
                <div className="invalid-feedback">{errors.supplierId}</div>
              )}
            </div>

            <div className="form-group">
              <label>{t('locationCode', 'Location Code')}</label>
              <input
                type="text"
                value={formData.locationCode}
                onChange={handleChange('locationCode')}
                placeholder={t('autoGenerated', 'Auto-generated if left empty')}
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{t('locationName', 'Location Name')} *</label>
              <input
                type="text"
                value={formData.locationName}
                onChange={handleChange('locationName')}
                placeholder="Main Collection Point"
                className={`form-control ${errors.locationName ? 'is-invalid' : ''}`}
              />
              {errors.locationName && (
                <div className="invalid-feedback">{errors.locationName}</div>
              )}
            </div>

            <div className="form-group">
              <label>{t('region', 'Region')}</label>
              <select
                value={formData.region_id}
                onChange={handleChange('region_id')}
                className="form-control"
              >
                <option value="">{t('selectRegion', 'Select Region')}</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name} - {region.governorate}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Phone size={20} />
            {t('contactInformation', 'Contact Information')}
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label>{t('contactPerson', 'Contact Person')}</label>
              <input
                type="text"
                value={formData.contactPerson}
                onChange={handleChange('contactPerson')}
                placeholder="Contact name"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{t('contactPhone', 'Contact Phone')}</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={handleChange('contactPhone')}
                placeholder="+968 1234 5678"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Address & Additional Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Building size={20} />
            {t('addressInformation', 'Address & Additional Information')}
          </div>

          <div className="form-grid">
            <div className="form-group full-width">
              <label>{t('address', 'Address')}</label>
              <textarea
                value={formData.address}
                onChange={handleChange('address')}
                placeholder="Full address of the location"
                rows="3"
                className="form-control"
              />
            </div>

            <div className="form-group full-width">
              <label>{t('notes', 'Notes')}</label>
              <textarea
                value={formData.notes}
                onChange={handleChange('notes')}
                placeholder="Additional notes about this location"
                rows="2"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                {isEdit ? t('updating', 'Updating...') : t('creating', 'Creating...')}
              </>
            ) : (
              <>
                <MapPin size={16} />
                {isEdit ? t('updateLocation', 'Update Location') : t('createLocation', 'Create Location')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default LocationFormModal
