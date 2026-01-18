import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import supplierService from '../../../services/supplierService'
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
  const [suppliers, setSuppliers] = useState([])
  const [loadingSuppliers, setLoadingSuppliers] = useState(false)

  // Source types (also used as transaction types)
  const sourceTypes = [
    { value: 'walk_in', label: t('walkIn', 'Walk-in') },
    { value: 'customer', label: t('customer', 'Customer') },
    { value: 'supplier', label: t('supplier', 'Supplier') },
    { value: 'collected', label: t('collected', 'Collected') }
  ]

  // Condition options for tyres
  const conditionOptions = [
    { value: 'good', label: t('goodCondition', 'Good (Usable/Resellable)'), class: 'success' },
    { value: 'bad', label: t('badCondition', 'Bad (Scrap Only)'), class: 'danger' }
  ]

  // Load suppliers when modal opens or source type changes to 'supplier'
  const loadSuppliers = async () => {
    try {
      setLoadingSuppliers(true)
      const result = await supplierService.getAll()
      const companySuppliers = result.success ? (result.data || []) : []
      setSuppliers(companySuppliers)
    } catch (error) {
      console.error('Error loading suppliers:', error)
    } finally {
      setLoadingSuppliers(false)
    }
  }

  useEffect(() => {
    if (isOpen && formData.sourceDetails.type === 'supplier') {
      loadSuppliers()
    }
  }, [isOpen, formData.sourceDetails.type, selectedCompany?.id])

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          ...initialData,
          dateOfEntry: initialData.dateOfEntry?.split('T')[0] || new Date().toISOString().split('T')[0]
        })
        
        const material = availableMaterials.find(m => m.id === initialData.materialId)
        setSelectedMaterial(material)
      } else {
        // Reset form when opening for new entry
        setFormData({
          materialId: '',
          materialCode: '',
          materialCategory: '',
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
        setSelectedMaterial(null)
        setErrors({})
        setSerialNumberInput('')
      }
    }
  }, [initialData, availableMaterials, isOpen])

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
    
    // Load suppliers when type changes to 'supplier'
    if (field === 'type' && value === 'supplier') {
      loadSuppliers()
    }
  }

  const handleSupplierSelection = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    if (supplier) {
      setFormData(prev => ({
        ...prev,
        sourceDetails: {
          type: 'supplier',
          name: supplier.name,
          id: supplier.id,
          contact: supplier.contact?.phone || supplier.contact?.email || ''
        }
      }))
      // Clear any existing source name errors
      if (errors.sourceName) {
        setErrors(prev => ({ ...prev, sourceName: '' }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        sourceDetails: {
          ...prev.sourceDetails,
          name: '',
          id: '',
          contact: ''
        }
      }))
    }
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
    if (!formData.sourceDetails.type) newErrors.sourceType = t('sourceTypeRequired', 'Source type is required')
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
      transactionType: formData.sourceDetails.type, // Use source type as transaction type
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
      <form onSubmit={handleSubmit} className="max-h-[80vh] overflow-y-auto px-1 max-md:max-h-[70vh]">
        
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
                  className="bg-gray-100 text-gray-500 cursor-not-allowed"
                />
              </div>
            )}
          </div>

          {selectedMaterial && (
            <div className="bg-white p-4 rounded-lg border border-gray-200 mt-4">
              <div className="mb-2 text-sm text-gray-600">
                <strong className="text-gray-800">{t('category', 'Category')}:</strong> {selectedMaterial.category}
              </div>
              <div className="mb-2 text-sm text-gray-600">
                <strong className="text-gray-800">{t('standardPrice', 'Standard Price')}:</strong> OMR {selectedMaterial.standardPrice?.toFixed(3)}
              </div>
              <p className="mt-3 text-[13px] text-gray-500 italic">{selectedMaterial.description}</p>

              {isTyre && (
                <div className="flex items-center gap-2 mt-3 p-3 bg-blue-100 border border-blue-300 rounded-md text-blue-700 text-[13px]">
                  <Info size={16} />
                  <span>{t('tyreSpecialFields', 'Special fields required for tyres: photos and condition')}</span>
                </div>
              )}
            </div>
          )}
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
            
            {/* Show supplier dropdown if source type is 'supplier' */}
            {formData.sourceDetails.type === 'supplier' ? (
              <div className="form-group">
                <label>{t('selectSupplier', 'Select Supplier')} *</label>
                {loadingSuppliers ? (
                  <div className="p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-500 italic text-center">
                    <span>{t('loadingSuppliers', 'Loading suppliers...')}</span>
                  </div>
                ) : (
                  <select
                    value={formData.sourceDetails.id}
                    onChange={(e) => handleSupplierSelection(e.target.value)}
                    className={errors.sourceName ? 'error' : ''}
                  >
                    <option value="">{t('selectSupplier', 'Select Supplier')}</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                )}
                {errors.sourceName && <span className="error-text">{errors.sourceName}</span>}
              </div>
            ) : (
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
            )}
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
                className="bg-gray-100 text-gray-500 cursor-not-allowed"
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
                className="bg-emerald-50 text-emerald-600 font-semibold cursor-not-allowed"
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
            {requiresPhotos && <span className="text-red-500"> *</span>}
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
            <div className="form-section bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <h3 className="section-title">
                <CheckCircle size={20} />
                {t('tyreCondition', 'Tyre Condition')} *
              </h3>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-4 mb-2 max-md:grid-cols-1">
                {conditionOptions.map(option => (
                  <label
                    key={option.value}
                    className={`relative cursor-pointer border-2 rounded-xl p-4 transition-all bg-white ${
                      formData.condition === option.value
                        ? option.class === 'success'
                          ? 'border-emerald-500 bg-gradient-to-br from-emerald-50 to-emerald-100'
                          : 'border-red-500 bg-gradient-to-br from-red-50 to-red-100'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name="condition"
                      value={option.value}
                      checked={formData.condition === option.value}
                      onChange={(e) => handleInputChange('condition', e.target.value)}
                      className="absolute opacity-0 pointer-events-none"
                    />
                    <div className={`flex items-center gap-3 font-medium ${
                      formData.condition === option.value
                        ? option.class === 'success' ? 'text-emerald-600' : 'text-red-600'
                        : 'text-gray-700'
                    }`}>
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
            <div className="form-section bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <h3 className="section-title">
                <Hash size={20} />
                {t('serialNumbers', 'Serial Numbers')} ({t('optional', 'Optional')})
              </h3>

              <div className="flex gap-3 mb-4 max-md:flex-col">
                <input
                  type="text"
                  value={serialNumberInput}
                  onChange={(e) => setSerialNumberInput(e.target.value)}
                  placeholder={t('enterSerialNumber', 'Enter serial number')}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSerialNumber())}
                  className="flex-1 p-3 border border-gray-300 rounded-lg"
                />
                <button
                  type="button"
                  onClick={addSerialNumber}
                  disabled={!serialNumberInput.trim()}
                  className="px-5 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-all"
                >
                  {t('add', 'Add')}
                </button>
              </div>

              {formData.serialNumbers.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.serialNumbers.map((serial, index) => (
                    <div key={index} className="flex items-center gap-2 bg-indigo-100 text-indigo-800 py-1.5 px-3 rounded-full text-[13px] font-medium">
                      <span>{serial}</span>
                      <button
                        type="button"
                        onClick={() => removeSerialNumber(index)}
                        className="bg-transparent border-none text-violet-600 cursor-pointer text-base font-bold w-5 h-5 flex items-center justify-center rounded-full hover:bg-indigo-200 transition-all"
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
        <div className="flex justify-end gap-4 p-6 bg-white border-t border-gray-200 -mx-6 -mb-6 sticky bottom-0 rounded-b-xl max-md:flex-col-reverse max-md:gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg font-medium hover:bg-gray-200 transition-all max-md:w-full max-md:py-3.5"
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="px-6 py-3 bg-blue-500 text-white rounded-lg font-medium hover:bg-blue-600 hover:shadow-lg transition-all max-md:w-full max-md:py-3.5"
          >
            {t('save', 'Save')} {isTyre && t('tyreEntry', 'Tyre Entry')}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default MaterialEntryForm