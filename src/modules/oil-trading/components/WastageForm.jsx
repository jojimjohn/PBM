import React, { useState, useEffect, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Modal from '../../../components/ui/Modal'
import Input, { Textarea } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import DatePicker from '../../../components/ui/DatePicker'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import wastageService from '../../../services/wastageService'
import inventoryService from '../../../services/inventoryService'
import collectionService from '../../../services/collectionService'
import { WASTAGE_TYPE_COLORS } from '../pages/Wastage'
import {
  Package,
  AlertTriangle,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon
} from 'lucide-react'
import './WastageForm.css'

const WastageForm = ({
  isOpen,
  onClose,
  onSave,
  materials = [],
  wasteTypes = [],
  initialData = null,
  isEditing = false
}) => {
  const { t } = useLocalization()
  const { getInputDate, formatCurrency } = useSystemSettings()

  // Form state
  const [formData, setFormData] = useState({
    materialId: '',
    wasteType: '',
    quantity: '',
    unitCost: '',
    wastageDate: getInputDate(),
    location: '',
    reason: '',
    description: '',
    collectionOrderId: '',
    attachments: []
  })

  // UI state
  const [errors, setErrors] = useState({})
  const [currentStock, setCurrentStock] = useState(null)
  const [loadingStock, setLoadingStock] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [showStockWarning, setShowStockWarning] = useState(false)
  const [recentCollections, setRecentCollections] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [submitError, setSubmitError] = useState(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing existing wastage
        setFormData({
          materialId: String(initialData.materialId || ''),
          wasteType: initialData.wasteType || '',
          quantity: String(initialData.quantity || ''),
          unitCost: String(initialData.unitCost || ''),
          wastageDate: initialData.wastageDate ? initialData.wastageDate.split('T')[0] : getInputDate(),
          location: initialData.location || '',
          reason: initialData.reason || '',
          description: initialData.description || '',
          collectionOrderId: String(initialData.collectionOrderId || ''),
          attachments: initialData.attachments || []
        })

        // Set selected material
        const material = materials.find(m => m.id === initialData.materialId)
        setSelectedMaterial(material)

        // Fetch current stock for editing
        if (initialData.materialId) {
          fetchCurrentStock(initialData.materialId)
        }
      } else {
        // Creating new wastage
        setFormData({
          materialId: '',
          wasteType: '',
          quantity: '',
          unitCost: '',
          wastageDate: getInputDate(),
          location: '',
          reason: '',
          description: '',
          collectionOrderId: '',
          attachments: []
        })
        setSelectedMaterial(null)
        setCurrentStock(null)
      }

      setErrors({})
      setSubmitError(null)
      loadRecentCollections()
    }
  }, [isOpen, initialData, materials, getInputDate])

  // Load recent collections for linking
  const loadRecentCollections = async () => {
    setLoadingCollections(true)
    try {
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

      const result = await collectionService.getCallouts({
        dateFrom: thirtyDaysAgo.toISOString().split('T')[0],
        status: 'completed'
      })

      if (result.success && result.data) {
        setRecentCollections(result.data.data || result.data || [])
      }
    } catch (error) {
      console.error('Error loading collections:', error)
    } finally {
      setLoadingCollections(false)
    }
  }

  // Fetch current stock for selected material
  const fetchCurrentStock = async (materialId) => {
    if (!materialId) {
      setCurrentStock(null)
      return
    }

    setLoadingStock(true)
    try {
      const result = await inventoryService.getCurrentStock(materialId)
      if (result.success) {
        setCurrentStock(result.data?.quantity || 0)
      } else {
        setCurrentStock(0)
      }
    } catch (error) {
      console.error('Error fetching stock:', error)
      setCurrentStock(0)
    } finally {
      setLoadingStock(false)
    }
  }

  // Handle material selection
  const handleMaterialChange = (materialId) => {
    const material = materials.find(m => String(m.id) === String(materialId))
    setSelectedMaterial(material)
    setFormData(prev => ({ ...prev, materialId }))
    fetchCurrentStock(materialId)

    // Clear material error
    if (errors.materialId) {
      setErrors(prev => ({ ...prev, materialId: null }))
    }
  }

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  // Validation
  const validateForm = () => {
    const newErrors = {}

    if (!formData.materialId) {
      newErrors.materialId = t('materialRequired', 'Material is required')
    }

    if (!formData.wasteType) {
      newErrors.wasteType = t('wasteTypeRequired', 'Waste type is required')
    }

    const quantity = parseFloat(formData.quantity)
    if (!formData.quantity || isNaN(quantity) || quantity <= 0) {
      newErrors.quantity = t('quantityRequired', 'Valid quantity is required')
    }

    const unitCost = parseFloat(formData.unitCost)
    if (formData.unitCost === '' || isNaN(unitCost) || unitCost < 0) {
      newErrors.unitCost = t('costRequired', 'Valid cost is required')
    }

    if (!formData.wastageDate) {
      newErrors.wastageDate = t('dateRequired', 'Date is required')
    } else {
      const selectedDate = new Date(formData.wastageDate)
      const today = new Date()
      today.setHours(23, 59, 59, 999)
      if (selectedDate > today) {
        newErrors.wastageDate = t('futureDateNotAllowed', 'Future date is not allowed')
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  // Handle form submission
  const handleSubmit = async (forceSubmit = false) => {
    if (!validateForm()) {
      return
    }

    const quantity = parseFloat(formData.quantity)

    // Check if quantity exceeds stock (only for new entries, not editing)
    if (!forceSubmit && !isEditing && currentStock !== null && quantity > currentStock) {
      setShowStockWarning(true)
      return
    }

    setSubmitting(true)
    setSubmitError(null)

    try {
      // Prepare data for submission
      const submitData = {
        materialId: parseInt(formData.materialId),
        wasteType: formData.wasteType,
        quantity: quantity,
        unitCost: parseFloat(formData.unitCost),
        wastageDate: formData.wastageDate,
        location: formData.location || null,
        reason: formData.reason || null,
        description: formData.description || null,
        collectionOrderId: formData.collectionOrderId ? parseInt(formData.collectionOrderId) : null
      }

      // Handle attachments - convert to base64 if needed
      if (formData.attachments.length > 0) {
        const attachmentData = await Promise.all(
          formData.attachments.map(async (file) => {
            if (file instanceof File) {
              return await fileToBase64(file)
            }
            return file // Already processed
          })
        )
        submitData.attachments = attachmentData
      }

      let result
      if (isEditing && initialData?.id) {
        result = await wastageService.update(initialData.id, submitData)
      } else {
        result = await wastageService.create(submitData)
      }

      if (result.success) {
        onSave(result.data)
        onClose()
      } else {
        setSubmitError(result.error || t('networkErrorRetry', 'Network error. Please try again.'))
      }
    } catch (error) {
      console.error('Error submitting wastage:', error)
      if (error.response) {
        // Server validation error
        setSubmitError(error.response.data?.message || t('validationErrorFix', 'Please fix the errors below'))
      } else {
        // Network error
        setSubmitError(t('networkErrorRetry', 'Network error. Please try again.'))
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = () => resolve({
        name: file.name,
        type: file.type,
        size: file.size,
        data: reader.result
      })
      reader.onerror = (error) => reject(error)
    })
  }

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    // Filter valid files
    const validFiles = acceptedFiles.filter(file => {
      const isValidType = ['image/jpeg', 'image/png', 'application/pdf'].includes(file.type)
      const isValidSize = file.size <= 5 * 1024 * 1024 // 5MB
      return isValidType && isValidSize
    })

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...validFiles]
    }))

    // Show errors for rejected files
    if (rejectedFiles.length > 0) {
      setErrors(prev => ({
        ...prev,
        attachments: t('invalidFileTypeOrSize', 'Some files were rejected (invalid type or size > 5MB)')
      }))
    }
  }, [t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: 5 * 1024 * 1024 // 5MB
  })

  // Remove attachment
  const removeAttachment = (index) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }))
  }

  // Material options with current stock display
  const materialOptions = materials.map(m => ({
    value: String(m.id),
    label: `${m.code || m.materialCode || ''} - ${m.name || ''}`
  }))

  // Waste type options with color indicator
  const wasteTypeOptions = wasteTypes.map(type => ({
    value: type.value,
    label: type.label,
    color: WASTAGE_TYPE_COLORS[type.value] || WASTAGE_TYPE_COLORS.other
  }))

  // Collection options
  const collectionOptions = [
    { value: '', label: t('selectCollection', 'Select collection (optional)') },
    ...recentCollections.map(c => ({
      value: String(c.id),
      label: `${c.referenceNumber || c.id} - ${new Date(c.collectionDate || c.createdAt).toLocaleDateString()}`
    }))
  ]

  // Calculate total cost
  const totalCost = (parseFloat(formData.quantity) || 0) * (parseFloat(formData.unitCost) || 0)

  const isFormValid = formData.materialId && formData.wasteType &&
    formData.quantity && !isNaN(parseFloat(formData.quantity)) && parseFloat(formData.quantity) > 0 &&
    formData.unitCost !== '' && !isNaN(parseFloat(formData.unitCost)) && parseFloat(formData.unitCost) >= 0 &&
    formData.wastageDate

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? t('editWastage', 'Edit Wastage') : t('wastageForm', 'Wastage Form')}
        className="wastage-form-modal"
      >
        <div className="wastage-form">
          {submitError && (
            <div className="form-error-banner">
              <AlertTriangle size={16} />
              <span>{submitError}</span>
              <button onClick={() => setSubmitError(null)} className="dismiss-btn">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Material Selection Section */}
          <div className="form-section">
            <h4 className="section-title">
              <Package size={18} />
              {t('materialInfo', 'Material Information')}
            </h4>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>{t('material', 'Material')} *</label>
                <Select
                  value={formData.materialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                >
                  <option value="">{t('selectMaterialPlaceholder', 'Select a material...')}</option>
                  {materialOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                {errors.materialId && <span className="error-text">{errors.materialId}</span>}
              </div>

              {formData.materialId && (
                <div className="stock-info-badge">
                  {loadingStock ? (
                    <Loader2 className="spin" size={16} />
                  ) : (
                    <>
                      <span className="stock-label">{t('currentStockLabel', 'Current Stock')}:</span>
                      <span className="stock-value">
                        {currentStock !== null ? currentStock : '-'} {selectedMaterial?.unit || ''}
                      </span>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>{t('wasteType', 'Waste Type')} *</label>
                <div className="waste-type-row">
                  <Select
                    value={formData.wasteType}
                    onChange={(e) => handleChange('wasteType', e.target.value)}
                  >
                    <option value="">{t('wasteTypePlaceholder', 'Select wastage type...')}</option>
                    {wasteTypeOptions.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </Select>
                  {formData.wasteType && (
                    <span
                      className="type-color-indicator"
                      style={{ backgroundColor: WASTAGE_TYPE_COLORS[formData.wasteType] || WASTAGE_TYPE_COLORS.other }}
                    />
                  )}
                </div>
                {errors.wasteType && <span className="error-text">{errors.wasteType}</span>}
              </div>
            </div>
          </div>

          {/* Quantities Section */}
          <div className="form-section">
            <h4 className="section-title">{t('quantitiesAndCosts', 'Quantities & Costs')}</h4>

            <div className="form-row">
              <div className="form-group">
                <label>{t('quantity', 'Quantity')} *</label>
                <div className="input-with-unit">
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.001"
                    error={errors.quantity}
                  />
                  <span className="unit-suffix">{selectedMaterial?.unit || ''}</span>
                </div>
                {errors.quantity && <span className="error-text">{errors.quantity}</span>}
              </div>

              <div className="form-group">
                <label>{t('costPerUnit', 'Cost per Unit')} (OMR) *</label>
                <Input
                  type="number"
                  value={formData.unitCost}
                  onChange={(e) => handleChange('unitCost', e.target.value)}
                  placeholder="0.000"
                  min="0"
                  step="0.001"
                  error={errors.unitCost}
                />
                {errors.unitCost && <span className="error-text">{errors.unitCost}</span>}
              </div>

              <div className="form-group">
                <label>{t('totalCost', 'Total Cost')}</label>
                <div className="calculated-value">
                  OMR {totalCost.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Date and Location Section */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group">
                <label>{t('wastageDate', 'Wastage Date')} *</label>
                <DatePicker
                  value={formData.wastageDate}
                  onChange={(value) => handleChange('wastageDate', value)}
                  max={new Date().toISOString().split('T')[0]}
                  error={errors.wastageDate}
                />
                {errors.wastageDate && <span className="error-text">{errors.wastageDate}</span>}
              </div>

              <div className="form-group">
                <label>{t('wastageLocation', 'Location')}</label>
                <Input
                  type="text"
                  value={formData.location}
                  onChange={(e) => handleChange('location', e.target.value)}
                  placeholder={t('warehouseOrLocation', 'Warehouse or location')}
                />
              </div>
            </div>
          </div>

          {/* Collection Link Section */}
          <div className="form-section">
            <h4 className="section-title">
              <LinkIcon size={18} />
              {t('linkToCollection', 'Link to Collection')}
            </h4>

            <div className="form-row">
              <div className="form-group flex-1">
                <Select
                  value={formData.collectionOrderId}
                  onChange={(e) => handleChange('collectionOrderId', e.target.value)}
                  disabled={loadingCollections}
                >
                  {loadingCollections ? (
                    <option value="">{t('loading', 'Loading...')}</option>
                  ) : (
                    collectionOptions.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))
                  )}
                </Select>
                <span className="field-hint">{t('optionalCollectionLink', 'Optional: Link this wastage to a collection order')}</span>
              </div>
            </div>
          </div>

          {/* Reason and Description Section */}
          <div className="form-section">
            <div className="form-row">
              <div className="form-group flex-1">
                <label>{t('wastageReason', 'Reason')}</label>
                <Input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder={t('briefReason', 'Brief reason for wastage')}
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group flex-1">
                <label>{t('wastageDescription', 'Description')}</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('detailedDescription', 'Detailed description of the wastage incident')}
                  rows={3}
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="form-section">
            <h4 className="section-title">
              <Upload size={18} />
              {t('attachments', 'Attachments')}
            </h4>

            <div
              {...getRootProps()}
              className={`attachment-dropzone ${isDragActive ? 'drag-active' : ''}`}
            >
              <input {...getInputProps()} />
              <Upload size={24} />
              <p>{t('dragDropFiles', 'Drag and drop files here or click to browse')}</p>
              <span className="dropzone-hint">
                {t('supportedFormats', 'Supported formats: JPEG, PNG, PDF')} | {t('maxFileSize', 'Max 5MB per file')}
              </span>
            </div>

            {errors.attachments && (
              <span className="error-text">{errors.attachments}</span>
            )}

            {formData.attachments.length > 0 && (
              <div className="attachment-previews">
                {formData.attachments.map((file, index) => (
                  <div key={index} className="attachment-preview">
                    {file.type?.startsWith('image/') || (file instanceof File && file.type.startsWith('image/')) ? (
                      <ImageIcon size={24} />
                    ) : (
                      <FileText size={24} />
                    )}
                    <span className="file-name">
                      {file.name || (file instanceof File ? file.name : `File ${index + 1}`)}
                    </span>
                    <button
                      type="button"
                      className="remove-attachment"
                      onClick={() => removeAttachment(index)}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Form Actions */}
          <div className="modal-actions">
            <button
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              className="btn btn-primary"
              onClick={() => handleSubmit(false)}
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <>
                  <Loader2 className="spin" size={16} />
                  {t('saving', 'Saving...')}
                </>
              ) : (
                t(isEditing ? 'update' : 'save', isEditing ? 'Update' : 'Save')
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Stock Warning Modal */}
      <Modal
        isOpen={showStockWarning}
        onClose={() => setShowStockWarning(false)}
        title={t('stockWarningTitle', 'Stock Quantity Warning')}
        className="stock-warning-modal"
      >
        <div className="stock-warning-content">
          <div className="warning-icon">
            <AlertTriangle size={48} />
          </div>
          <p>
            {t('stockWarningMessage', 'Quantity exceeds current stock ({stock} {unit}). This may indicate data discrepancy.')
              .replace('{stock}', currentStock)
              .replace('{unit}', selectedMaterial?.unit || '')}
          </p>
          <div className="warning-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowStockWarning(false)}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              className="btn btn-warning"
              onClick={() => {
                setShowStockWarning(false)
                handleSubmit(true)
              }}
            >
              {t('proceedAnyway', 'Proceed Anyway')}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default WastageForm
