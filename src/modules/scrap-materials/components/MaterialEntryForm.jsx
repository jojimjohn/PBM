import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import Modal from '../../../components/ui/Modal'
import ImageUpload from '../../../components/ui/ImageUpload'
import { 
  Package, 
  Truck, 
  Users, 
  MapPin, 
  Calendar, 
  Hash,
  Info,
  Camera,
  CheckCircle,
  AlertTriangle
} from 'lucide-react'
import './MaterialEntryForm.css'

const MaterialEntryForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  initialData = null, 
  availableMaterials = [] 
}) => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  
  const [formData, setFormData] = useState({
    materialId: '',
    materialCode: '',
    materialCategory: '',
    transactionType: 'collected',
    sourceDetails: {
      type: 'walk_in',
      name: '',
      id: '',
      contact: ''
    },
    quantity: '',
    unit: '',
    costPerUnit: '',
    dateOfEntry: new Date().toISOString().split('T')[0],
    photos: [],
    condition: '',
    serialNumbers: [],
    notes: ''
  })

  const [errors, setErrors] = useState({})
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [serialNumberInput, setSerialNumberInput] = useState('')

  // Transaction types
  const transactionTypes = [
    { value: 'collected', label: t('collected', 'Collected'), icon: Package },
    { value: 'purchased', label: t('purchased', 'Purchased'), icon: Truck },
    { value: 'supplied', label: t('supplied', 'Supplied'), icon: Users },
    { value: 'walk_in', label: t('walkIn', 'Walk-in'), icon: MapPin }
  ]

  // Source types
  const sourceTypes = [
    { value: 'walk_in', label: t('walkInCustomer', 'Walk-in Customer') },
    { value: 'customer', label: t('registeredCustomer', 'Registered Customer') },
    { value: 'supplier', label: t('supplier', 'Supplier') },
    { value: 'collection_point', label: t('collectionPoint', 'Collection Point') }
  ]

  // Condition options for tyres
  const conditionOptions = [
    { value: 'good', label: t('goodCondition', 'Good (Usable/Resellable)'), class: 'success' },
    { value: 'bad', label: t('badCondition', 'Bad (Scrap Only)'), class: 'danger' }
  ]

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        dateOfEntry: initialData.dateOfEntry?.split('T')[0] || new Date().toISOString().split('T')[0]
      })
      
      const material = availableMaterials.find(m => m.id === initialData.materialId)
      setSelectedMaterial(material)
    }
  }, [initialData, availableMaterials])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Clear error when field is modified
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handleSourceDetailsChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      sourceDetails: {
        ...prev.sourceDetails,
        [field]: value
      }
    }))
  }

  const handleMaterialChange = (materialId) => {
    const material = availableMaterials.find(m => m.id === materialId)
    if (material) {
      setSelectedMaterial(material)
      setFormData(prev => ({
        ...prev,
        materialId,
        materialCode: material.code,
        materialCategory: material.category,
        unit: material.unit,
        costPerUnit: material.standardPrice || '',
        // Reset tyre-specific fields when material changes
        condition: material.category === 'tyres' ? '' : null,
        photos: material.requiresPhotos ? prev.photos : [],
        serialNumbers: material.category === 'tyres' ? prev.serialNumbers : []
      }))
    }
  }

  const addSerialNumber = () => {
    if (serialNumberInput.trim()) {
      setFormData(prev => ({
        ...prev,
        serialNumbers: [...prev.serialNumbers, serialNumberInput.trim()]
      }))
      setSerialNumberInput('')
    }
  }

  const removeSerialNumber = (index) => {
    setFormData(prev => ({
      ...prev,
      serialNumbers: prev.serialNumbers.filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.materialId) newErrors.materialId = t('materialRequired', 'Material selection is required')
    if (!formData.transactionType) newErrors.transactionType = t('transactionTypeRequired', 'Transaction type is required')
    if (!formData.sourceDetails.name.trim()) newErrors.sourceName = t('sourceNameRequired', 'Source name is required')
    if (!formData.quantity || formData.quantity <= 0) newErrors.quantity = t('quantityRequired', 'Valid quantity is required')
    if (!formData.costPerUnit || formData.costPerUnit < 0) newErrors.costPerUnit = t('costRequired', 'Valid cost is required')
    
    // Tyre-specific validations
    if (selectedMaterial?.category === 'tyres') {
      if (!formData.condition) newErrors.condition = t('conditionRequired', 'Condition is required for tyres')
      if (selectedMaterial?.requiresPhotos && formData.photos.length === 0) {
        newErrors.photos = t('photosRequired', 'Photos are required for tyres')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const materialData = {
      id: initialData?.id || `mat_entry_${Date.now()}`,
      ...formData,
      quantity: parseFloat(formData.quantity),
      costPerUnit: parseFloat(formData.costPerUnit),
      totalValue: parseFloat(formData.quantity) * parseFloat(formData.costPerUnit),
      dateOfEntry: new Date(formData.dateOfEntry).toISOString(),
      createdAt: initialData?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    onSave(materialData)
  }

  const isTyre = selectedMaterial?.category === 'tyres'
  const requiresPhotos = selectedMaterial?.requiresPhotos
  const requiresCondition = selectedMaterial?.requiresCondition

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? t('editMaterialEntry', 'Edit Material Entry') : t('addMaterialEntry', 'Add Material Entry')}
      className="modal-xl"
    >
      <form onSubmit={handleSubmit} className="material-entry-form">
        
        {/* Material Selection */}
        <div className="form-section">
          <h3 className="section-title">
            <Package size={20} />
            {t('materialInformation', 'Material Information')}
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t('material', 'Material')} *</label>
              <select
                value={formData.materialId}
                onChange={(e) => handleMaterialChange(e.target.value)}
                className={errors.materialId ? 'error' : ''}
              >
                <option value="">{t('selectMaterial', 'Select Material')}</option>
                {availableMaterials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name} ({material.unit})
                  </option>
                ))}
              </select>
              {errors.materialId && <span className="error-text">{errors.materialId}</span>}
            </div>
            
            {selectedMaterial && (
              <div className="form-group">
                <label>{t('materialCode', 'Material Code')}</label>
                <input 
                  type="text" 
                  value={formData.materialCode} 
                  readOnly 
                  className="readonly"
                />
              </div>
            )}
          </div>

          {selectedMaterial && (
            <div className="material-info-card">
              <div className="material-detail">
                <strong>{t('category', 'Category')}:</strong> {selectedMaterial.category}
              </div>
              <div className="material-detail">
                <strong>{t('standardPrice', 'Standard Price')}:</strong> OMR {selectedMaterial.standardPrice?.toFixed(3)}
              </div>
              <p className="material-description">{selectedMaterial.description}</p>
              
              {isTyre && (
                <div className="tyre-notice">
                  <Info size={16} />
                  <span>{t('tyreSpecialFields', 'Special fields required for tyres: photos and condition')}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Transaction Details */}
        <div className="form-section">
          <h3 className="section-title">
            <Truck size={20} />
            {t('transactionDetails', 'Transaction Details')}
          </h3>
          
          <div className="transaction-type-grid">
            {transactionTypes.map(type => {
              const Icon = type.icon
              return (
                <label key={type.value} className={`transaction-type-option ${formData.transactionType === type.value ? 'selected' : ''}`}>
                  <input
                    type="radio"
                    name="transactionType"
                    value={type.value}
                    checked={formData.transactionType === type.value}
                    onChange={(e) => handleInputChange('transactionType', e.target.value)}
                  />
                  <div className="transaction-content">
                    <Icon size={20} />
                    <span>{type.label}</span>
                  </div>
                </label>
              )
            })}
          </div>
          {errors.transactionType && <span className="error-text">{errors.transactionType}</span>}
        </div>

        {/* Source Details */}
        <div className="form-section">
          <h3 className="section-title">
            <Users size={20} />
            {t('sourceInformation', 'Source Information')}
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t('sourceType', 'Source Type')}</label>
              <select
                value={formData.sourceDetails.type}
                onChange={(e) => handleSourceDetailsChange('type', e.target.value)}
              >
                {sourceTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>{t('sourceName', 'Source Name')} *</label>
              <input
                type="text"
                value={formData.sourceDetails.name}
                onChange={(e) => handleSourceDetailsChange('name', e.target.value)}
                placeholder={t('enterSourceName', 'Enter source name')}
                className={errors.sourceName ? 'error' : ''}
              />
              {errors.sourceName && <span className="error-text">{errors.sourceName}</span>}
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t('sourceId', 'Source ID/Reference')}</label>
              <input
                type="text"
                value={formData.sourceDetails.id}
                onChange={(e) => handleSourceDetailsChange('id', e.target.value)}
                placeholder={t('optionalReference', 'Optional reference')}
              />
            </div>
            
            <div className="form-group">
              <label>{t('contactInfo', 'Contact Information')}</label>
              <input
                type="text"
                value={formData.sourceDetails.contact}
                onChange={(e) => handleSourceDetailsChange('contact', e.target.value)}
                placeholder={t('phoneOrEmail', 'Phone or email')}
              />
            </div>
          </div>
        </div>

        {/* Quantity and Pricing */}
        <div className="form-section">
          <h3 className="section-title">
            <Hash size={20} />
            {t('quantityAndPricing', 'Quantity & Pricing')}
          </h3>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t('quantity', 'Quantity')} *</label>
              <input
                type="number"
                step="0.01"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                placeholder="0.00"
                className={errors.quantity ? 'error' : ''}
              />
              {errors.quantity && <span className="error-text">{errors.quantity}</span>}
            </div>
            
            <div className="form-group">
              <label>{t('unit', 'Unit')}</label>
              <input
                type="text"
                value={formData.unit}
                readOnly
                className="readonly"
              />
            </div>
            
            <div className="form-group">
              <label>{t('costPerUnit', 'Cost per Unit')} (OMR) *</label>
              <input
                type="number"
                step="0.001"
                value={formData.costPerUnit}
                onChange={(e) => handleInputChange('costPerUnit', e.target.value)}
                placeholder="0.000"
                className={errors.costPerUnit ? 'error' : ''}
              />
              {errors.costPerUnit && <span className="error-text">{errors.costPerUnit}</span>}
            </div>
            
            <div className="form-group">
              <label>{t('totalValue', 'Total Value')} (OMR)</label>
              <input
                type="text"
                value={formData.quantity && formData.costPerUnit ? 
                  (parseFloat(formData.quantity) * parseFloat(formData.costPerUnit)).toFixed(3) : '0.000'}
                readOnly
                className="readonly total-value"
              />
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label>{t('dateOfEntry', 'Date of Entry')} *</label>
              <input
                type="date"
                value={formData.dateOfEntry}
                onChange={(e) => handleInputChange('dateOfEntry', e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="form-section">
          <h3 className="section-title">
            <Camera size={20} />
            {t('photos', 'Photos')}
            {requiresPhotos && <span className="required-indicator"> *</span>}
          </h3>
          
          <ImageUpload
            images={formData.photos}
            onChange={(photos) => handleInputChange('photos', photos)}
            maxFiles={5}
            required={requiresPhotos}
            label={isTyre ? 
              t('tyrePhotosLabel', 'Upload photos showing tyre condition') : 
              t('materialPhotosLabel', 'Upload material photos (optional)')
            }
          />
          {errors.photos && <span className="error-text">{errors.photos}</span>}
        </div>

        {/* Tyre-Specific Fields */}
        {isTyre && (
          <>
            {/* Condition Classification */}
            <div className="form-section tyre-section">
              <h3 className="section-title">
                <CheckCircle size={20} />
                {t('tyreCondition', 'Tyre Condition')} *
              </h3>
              
              <div className="condition-options">
                {conditionOptions.map(option => (
                  <label key={option.value} className={`condition-option ${formData.condition === option.value ? 'selected' : ''} ${option.class}`}>
                    <input
                      type="radio"
                      name="condition"
                      value={option.value}
                      checked={formData.condition === option.value}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                    />
                    <div className="condition-content">
                      {option.value === 'good' ? 
                        <CheckCircle size={16} /> : 
                        <AlertTriangle size={16} />
                      }
                      <span>{option.label}</span>
                    </div>
                  </label>
                ))}
              </div>
              {errors.condition && <span className="error-text">{errors.condition}</span>}
            </div>

            {/* Serial Numbers */}
            <div className="form-section tyre-section">
              <h3 className="section-title">
                <Hash size={20} />
                {t('serialNumbers', 'Serial Numbers')} ({t('optional', 'Optional')})
              </h3>
              
              <div className="serial-number-input">
                <input
                  type="text"
                  value={serialNumberInput}
                  onChange={(e) => setSerialNumberInput(e.target.value)}
                  placeholder={t('enterSerialNumber', 'Enter serial number')}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
                />
                <button
                  type="button"
                  onClick={addSerialNumber}
                  disabled={!serialNumberInput.trim()}
                  className="add-serial-btn"
                >
                  {t('add', 'Add')}
                </button>
              </div>
              
              {formData.serialNumbers.length > 0 && (
                <div className="serial-numbers-list">
                  {formData.serialNumbers.map((serial, index) => (
                    <div key={index} className="serial-number-tag">
                      <span>{serial}</span>
                      <button
                        type="button"
                        onClick={() => removeSerialNumber(index)}
                        className="remove-serial-btn"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Notes */}
        <div className="form-section">
          <h3 className="section-title">
            <Info size={20} />
            {t('notes', 'Notes')} ({t('optional', 'Optional')})
          </h3>
          
          <textarea
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
            placeholder={t('additionalNotes', 'Additional notes or observations')}
            rows={3}
          />
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" onClick={onClose} className="btn-cancel">
            {t('cancel', 'Cancel')}
          </button>
          <button type="submit" className="btn-save">
            {t('save', 'Save')} {isTyre && t('tyreEntry', 'Tyre Entry')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default MaterialEntryForm