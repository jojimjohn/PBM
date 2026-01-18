import React, { useState, useEffect } from 'react'
import { useLocalization } from '../context/LocalizationContext'
import { Plus, Trash2, Layers, Package, AlertCircle, Recycle } from 'lucide-react'
import Modal from './ui/Modal'
// CSS moved to global index.css Tailwind

// Valid waste types for disposable materials
const WASTE_TYPES = [
  { value: 'waste', label: 'Waste' },
  { value: 'spillage', label: 'Spillage' },
  { value: 'contamination', label: 'Contamination' },
  { value: 'expiry', label: 'Expiry' },
  { value: 'damage', label: 'Damage' },
  { value: 'theft', label: 'Theft' },
  { value: 'evaporation', label: 'Evaporation' },
  { value: 'sorting_loss', label: 'Sorting Loss' },
  { value: 'quality_rejection', label: 'Quality Rejection' },
  { value: 'transport_loss', label: 'Transport Loss' },
  { value: 'handling_damage', label: 'Handling Damage' },
  { value: 'other', label: 'Other' }
]

const MaterialFormModal = ({
  isOpen,
  onClose,
  onSave,
  editingMaterial = null,
  categories = [],
  allMaterials = []
}) => {
  const { t } = useLocalization()

  const [formData, setFormData] = useState({
    code: '',
    name: '',
    description: '',
    category_id: '',
    unit: 'liters',
    standardPrice: 0,
    minimumPrice: 0,
    density: '',
    shelfLifeDays: '',
    specifications: '',
    barcode: '',
    trackBatches: false,
    isActive: true,
    is_composite: false,
    // Disposable material fields
    is_disposable: false,
    default_waste_type: 'waste',
    auto_wastage_percentage: 100
  })

  const [compositions, setCompositions] = useState([])
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  // Available units
  const units = [
    { value: 'liters', label: 'Liters (L)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'units', label: 'Units (pcs)' },
    { value: 'tons', label: 'Tons (T)' },
    { value: 'gallons', label: 'Gallons (gal)' },
    { value: 'barrels', label: 'Barrels (bbl)' }
  ]

  // Capacity units for composite materials
  const capacityUnits = [
    { value: 'L', label: 'Liters (L)' },
    { value: 'kg', label: 'Kilograms (kg)' },
    { value: 'pcs', label: 'Pieces (pcs)' },
    { value: 'T', label: 'Tons (T)' },
    { value: 'gal', label: 'Gallons (gal)' },
    { value: 'bbl', label: 'Barrels (bbl)' },
    { value: 'm³', label: 'Cubic Meters (m³)' },
    { value: 'ft³', label: 'Cubic Feet (ft³)' }
  ]

  // Component types
  const componentTypes = [
    { value: 'content', label: t('content', 'Content'), description: t('contentDesc', 'Content (oil, kerosene, paint, etc.)') },
    { value: 'container', label: t('container', 'Container'), description: t('containerDesc', 'Container (drum, box, can, etc.)') }
  ]

  useEffect(() => {
    if (isOpen) {
      if (editingMaterial) {
        // Load existing material data
        setFormData({
          code: editingMaterial.code || '',
          name: editingMaterial.name || '',
          description: editingMaterial.description || '',
          category_id: editingMaterial.category_id || '',
          unit: editingMaterial.unit || 'liters',
          standardPrice: editingMaterial.standardPrice || 0,
          minimumPrice: editingMaterial.minimumPrice || 0,
          density: editingMaterial.density || '',
          shelfLifeDays: editingMaterial.shelfLifeDays || '',
          specifications: editingMaterial.specifications || '',
          barcode: editingMaterial.barcode || '',
          trackBatches: editingMaterial.trackBatches || false,
          isActive: editingMaterial.isActive !== undefined ? editingMaterial.isActive : true,
          is_composite: editingMaterial.is_composite || editingMaterial.compositions?.length > 0 || false,
          // Load disposable material fields
          is_disposable: editingMaterial.is_disposable || false,
          default_waste_type: editingMaterial.default_waste_type || 'waste',
          auto_wastage_percentage: editingMaterial.auto_wastage_percentage ?? 100
        })

        // Load existing compositions if any
        if (editingMaterial.compositions && editingMaterial.compositions.length > 0) {
          setCompositions(editingMaterial.compositions.map(comp => ({
            component_material_id: comp.component_material_id,
            component_type: comp.component_type,
            capacity: comp.capacity || '',
            capacity_unit: comp.capacity_unit || '',
            is_active: comp.is_active !== undefined ? comp.is_active : true
          })))
        } else {
          setCompositions([])
        }
      } else {
        // Reset form for new material
        resetForm()
      }
      setErrors({})
    }
  }, [isOpen, editingMaterial])

  const resetForm = () => {
    setFormData({
      code: '',
      name: '',
      description: '',
      category_id: '',
      unit: 'liters',
      standardPrice: 0,
      minimumPrice: 0,
      density: '',
      shelfLifeDays: '',
      specifications: '',
      barcode: '',
      trackBatches: false,
      isActive: true,
      is_composite: false,
      is_disposable: false,
      default_waste_type: 'waste',
      auto_wastage_percentage: 100
    })
    setCompositions([])
  }

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const handleCompositeToggle = (checked) => {
    setFormData(prev => ({
      ...prev,
      is_composite: checked
    }))

    if (checked && compositions.length === 0) {
      // Add default composition rows
      setCompositions([
        { component_material_id: '', component_type: 'content', capacity: '', capacity_unit: '', is_active: true },
        { component_material_id: '', component_type: 'container', capacity: '', capacity_unit: '', is_active: true }
      ])
    } else if (!checked) {
      setCompositions([])
    }
  }

  const addCompositionRow = () => {
    setCompositions(prev => [
      ...prev,
      { component_material_id: '', component_type: 'content', capacity: '', capacity_unit: '', is_active: true }
    ])
  }

  const removeCompositionRow = (index) => {
    setCompositions(prev => prev.filter((_, i) => i !== index))
  }

  const updateComposition = (index, field, value) => {
    setCompositions(prev => prev.map((comp, i) =>
      i === index ? { ...comp, [field]: value } : comp
    ))
  }

  const validateForm = () => {
    const newErrors = {}

    // Required fields
    if (!formData.code.trim()) newErrors.code = 'Material code is required'
    if (!formData.name.trim()) newErrors.name = 'Material name is required'
    if (!formData.category_id) newErrors.category_id = 'Category is required'
    if (!formData.unit) newErrors.unit = 'Unit is required'

    // Price validation
    const standardPrice = parseFloat(formData.standardPrice) || 0
    const minimumPrice = parseFloat(formData.minimumPrice) || 0

    if (standardPrice < 0) newErrors.standardPrice = 'Standard price cannot be negative'
    if (minimumPrice < 0) newErrors.minimumPrice = 'Minimum price cannot be negative'
    if (minimumPrice > standardPrice) {
      newErrors.minimumPrice = 'Minimum price cannot exceed standard price'
    }

    // Composite material validation
    if (formData.is_composite) {
      if (compositions.length < 2) {
        newErrors.compositions = 'Composite materials must have at least 2 components (1 container + 1 content)'
      } else {
        const hasContainer = compositions.some(c => c.component_type === 'container' && c.component_material_id)
        const hasContent = compositions.some(c => c.component_type === 'content' && c.component_material_id)

        if (!hasContainer || !hasContent) {
          newErrors.compositions = 'Composite materials must have at least 1 container and 1 content component'
        }

        // Check for empty component materials
        const hasEmptyComponent = compositions.some(c => !c.component_material_id)
        if (hasEmptyComponent) {
          newErrors.compositions = 'All composition rows must have a component material selected'
        }

        // Check for duplicate components
        const componentIds = compositions.map(c => c.component_material_id).filter(Boolean)
        const hasDuplicates = componentIds.length !== new Set(componentIds).size
        if (hasDuplicates) {
          newErrors.compositions = 'Cannot use the same component material multiple times'
        }

        // Check if composite material is being used as its own component (for edit mode)
        if (editingMaterial && componentIds.includes(editingMaterial.id)) {
          newErrors.compositions = 'A material cannot contain itself as a component'
        }
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setSaving(true)
    try {
      const materialData = {
        ...formData,
        code: formData.code.trim().toUpperCase(),
        name: formData.name.trim(),
        standardPrice: parseFloat(formData.standardPrice) || 0,
        minimumPrice: parseFloat(formData.minimumPrice) || 0,
        density: formData.density ? parseFloat(formData.density) : null,
        shelfLifeDays: formData.shelfLifeDays ? parseInt(formData.shelfLifeDays) : null,
        isActive: Boolean(formData.isActive),
        trackBatches: Boolean(formData.trackBatches),
        is_composite: Boolean(formData.is_composite),
        // Disposable material fields
        is_disposable: Boolean(formData.is_disposable),
        default_waste_type: formData.is_disposable ? (formData.default_waste_type || 'waste') : null,
        auto_wastage_percentage: formData.is_disposable ? (parseFloat(formData.auto_wastage_percentage) || 100) : 100
      }

      // Add compositions if composite material
      if (formData.is_composite && compositions.length > 0) {
        materialData.compositions = compositions.map(comp => ({
          component_material_id: parseInt(comp.component_material_id),
          component_type: comp.component_type,
          capacity: comp.capacity ? parseFloat(comp.capacity) : null,
          capacity_unit: comp.capacity_unit || null,
          is_active: comp.is_active !== undefined ? comp.is_active : true
        }))
      }

      await onSave(materialData, editingMaterial?.id)
      resetForm()
      onClose()
    } catch (error) {
      console.error('Error saving material:', error)
      setErrors({ submit: error.message || 'Failed to save material' })
    } finally {
      setSaving(false)
    }
  }

  const handleClose = () => {
    if (!saving) {
      resetForm()
      setErrors({})
      onClose()
    }
  }

  // Filter out composite materials from component selection (can't use composite as component)
  const availableComponentMaterials = allMaterials.filter(m =>
    !m.is_composite &&
    (!editingMaterial || m.id !== editingMaterial.id) // Don't allow self-reference
  )

  const modalTitle = (
    <span className="flex items-center gap-2">
      <Package size={20} />
      {editingMaterial ? t('editMaterial', 'Edit Material') : t('addMaterial', 'Add Material')}
    </span>
  )

  const modalFooter = (
    <>
      <button
        type="button"
        className="btn btn-outline"
        onClick={handleClose}
        disabled={saving}
      >
        {t('cancel', 'Cancel')}
      </button>
      <button
        type="submit"
        form="material-form"
        className="btn btn-primary"
        disabled={saving}
      >
        {saving ? t('saving', 'Saving...') : t('save', 'Save')}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={modalTitle}
      footer={modalFooter}
      size="lg"
      className="material-form-modal"
    >
      <form id="material-form" onSubmit={handleSubmit}>
        <div className="form-content">
            {errors.submit && (
              <div className="ds-form-error-box">
                <AlertCircle size={16} />
                {errors.submit}
              </div>
            )}

            {/* Basic Material Information */}
            <div className="ds-form-section">
              <h4>{t('basicInformation', 'Basic Information')}</h4>
              <div className="ds-form-grid">
                <div className="ds-form-group">
                  <label htmlFor="code">
                    {t('materialCode', 'Material Code')} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="code"
                    value={formData.code}
                    onChange={(e) => handleInputChange('code', e.target.value)}
                    disabled={saving || editingMaterial} // Code cannot be changed when editing
                    placeholder="ENG-001"
                    className={errors.code ? 'error' : ''}
                  />
                  {errors.code && <small className="error-text">{errors.code}</small>}
                </div>

                <div className="ds-form-group">
                  <label htmlFor="name">
                    {t('materialName', 'Material Name')} <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    disabled={saving}
                    placeholder="Engine Oil 20W-50"
                    className={errors.name ? 'error' : ''}
                  />
                  {errors.name && <small className="error-text">{errors.name}</small>}
                </div>

                <div className="ds-form-group full-width">
                  <label htmlFor="description">{t('description', 'Description')}</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    disabled={saving}
                    rows="2"
                    placeholder="Material description..."
                  />
                </div>

                <div className="ds-form-group">
                  <label htmlFor="category_id">
                    {t('category', 'Category')} <span className="required">*</span>
                  </label>
                  <select
                    id="category_id"
                    value={formData.category_id}
                    onChange={(e) => handleInputChange('category_id', e.target.value)}
                    disabled={saving}
                    className={errors.category_id ? 'error' : ''}
                  >
                    <option value="">{t('selectCategory', 'Select category...')}</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {errors.category_id && <small className="error-text">{errors.category_id}</small>}
                </div>

                <div className="ds-form-group">
                  <label htmlFor="unit">
                    {t('unit', 'Unit')} <span className="required">*</span>
                  </label>
                  <select
                    id="unit"
                    value={formData.unit}
                    onChange={(e) => handleInputChange('unit', e.target.value)}
                    disabled={saving}
                    className={errors.unit ? 'error' : ''}
                  >
                    {units.map(unit => (
                      <option key={unit.value} value={unit.value}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                  {errors.unit && <small className="error-text">{errors.unit}</small>}
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.isActive}
                      onChange={(e) => handleInputChange('isActive', e.target.checked)}
                      disabled={saving}
                    />
                    {t('active', 'Active')}
                  </label>
                  <small>{t('activeMaterialHint', 'Only active materials can be used in orders')}</small>
                </div>
              </div>
            </div>

            {/* Pricing Information */}
            <div className="ds-form-section">
              <h4>{t('pricingInformation', 'Pricing Information')}</h4>
              <div className="ds-form-grid">
                <div className="ds-form-group">
                  <label htmlFor="standardPrice">
                    {t('standardPrice', 'Standard Price')} <small>(OMR{formData.unit ? `/${formData.unit}` : ''})</small>
                  </label>
                  <input
                    type="number"
                    id="standardPrice"
                    value={formData.standardPrice}
                    onChange={(e) => handleInputChange('standardPrice', e.target.value)}
                    disabled={saving}
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    className={errors.standardPrice ? 'error' : ''}
                  />
                  {errors.standardPrice && <small className="error-text">{errors.standardPrice}</small>}
                </div>

                <div className="ds-form-group">
                  <label htmlFor="minimumPrice">
                    {t('minimumPrice', 'Minimum Price')} <small>(OMR{formData.unit ? `/${formData.unit}` : ''})</small>
                  </label>
                  <input
                    type="number"
                    id="minimumPrice"
                    value={formData.minimumPrice}
                    onChange={(e) => handleInputChange('minimumPrice', e.target.value)}
                    disabled={saving}
                    step="0.001"
                    min="0"
                    placeholder="0.000"
                    className={errors.minimumPrice ? 'error' : ''}
                  />
                  {errors.minimumPrice && <small className="error-text">{errors.minimumPrice}</small>}
                </div>
              </div>
            </div>

            {/* Additional Properties */}
            <div className="ds-form-section">
              <h4>{t('additionalProperties', 'Additional Properties')}</h4>
              <div className="ds-form-grid three-col">
                <div className="ds-form-group">
                  <label htmlFor="density">{t('density', 'Density')} <small>(kg/L)</small></label>
                  <input
                    type="number"
                    id="density"
                    value={formData.density}
                    onChange={(e) => handleInputChange('density', e.target.value)}
                    disabled={saving}
                    step="0.0001"
                    min="0"
                    placeholder="0.8500"
                  />
                </div>

                <div className="ds-form-group">
                  <label htmlFor="shelfLifeDays">{t('shelfLife', 'Shelf Life')} <small>(days)</small></label>
                  <input
                    type="number"
                    id="shelfLifeDays"
                    value={formData.shelfLifeDays}
                    onChange={(e) => handleInputChange('shelfLifeDays', e.target.value)}
                    disabled={saving}
                    min="0"
                    placeholder="365"
                  />
                </div>

                <div className="ds-form-group">
                  <label htmlFor="barcode">{t('barcode', 'Barcode')}</label>
                  <input
                    type="text"
                    id="barcode"
                    value={formData.barcode}
                    onChange={(e) => handleInputChange('barcode', e.target.value)}
                    disabled={saving}
                    placeholder="1234567890123"
                  />
                </div>

                <div className="ds-form-group span-2">
                  <label htmlFor="specifications">{t('specifications', 'Specifications')}</label>
                  <textarea
                    id="specifications"
                    value={formData.specifications}
                    onChange={(e) => handleInputChange('specifications', e.target.value)}
                    disabled={saving}
                    rows="2"
                    placeholder="Technical specifications..."
                  />
                </div>

                <div className="ds-form-group">
                  <label className="ds-form-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.trackBatches}
                      onChange={(e) => handleInputChange('trackBatches', e.target.checked)}
                      disabled={saving}
                    />
                    {t('trackBatches', 'Track Batches')}
                  </label>
                </div>
              </div>
            </div>

            {/* Disposable Material Section */}
            <div className="border border-slate-200 bg-slate-50/50 p-4 mt-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Recycle size={16} className="text-emerald-600" />
                  <span className="text-sm font-semibold text-slate-700">{t('disposableMaterial', 'Disposable Material')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_disposable}
                    onChange={(e) => handleInputChange('is_disposable', e.target.checked)}
                    disabled={saving || formData.is_composite}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-disabled:opacity-50"></div>
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    {formData.is_disposable ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                  </span>
                </label>
              </div>

              {formData.is_composite && (
                <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs">
                  <AlertCircle size={14} className="mt-0.5 shrink-0" />
                  <p className="m-0">
                    {t('disposableCompositeConflict', 'Composite materials cannot be marked as disposable. The composite components are tracked individually.')}
                  </p>
                </div>
              )}

              {formData.is_disposable && !formData.is_composite && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="m-0">
                      {t('disposableInfo', 'Disposable materials are automatically converted to 100% wastage during WCN finalization.')}
                    </p>
                  </div>

                  <div className="max-w-xs">
                    <label htmlFor="default_waste_type" className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      {t('defaultWasteType', 'Default Waste Type')} <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="default_waste_type"
                      value={formData.default_waste_type}
                      onChange={(e) => handleInputChange('default_waste_type', e.target.value)}
                      disabled={saving}
                      className="w-full h-8 px-2 text-sm bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-blue-500"
                    >
                      <option value="">{t('selectWasteType', 'Select waste type...')}</option>
                      {WASTE_TYPES.map(type => (
                        <option key={type.value} value={type.value}>
                          {t(`wasteType_${type.value}`, type.label)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>

            {/* Composite Material Section */}
            <div className="border border-slate-200 bg-slate-50/50 p-4 mt-4">
              <div className="flex items-center justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <Layers size={16} className="text-blue-600" />
                  <span className="text-sm font-semibold text-slate-700">{t('compositeMaterial', 'Composite Material')}</span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_composite}
                    onChange={(e) => handleCompositeToggle(e.target.checked)}
                    disabled={saving}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-500 peer-disabled:opacity-50"></div>
                  <span className="ml-2 text-xs font-medium text-slate-600">
                    {formData.is_composite ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                  </span>
                </label>
              </div>

              {formData.is_composite && (
                <div className="space-y-3">
                  <div className="flex items-start gap-2 p-2.5 bg-blue-50 border border-blue-200 text-blue-800 text-xs">
                    <AlertCircle size={14} className="mt-0.5 shrink-0" />
                    <p className="m-0">
                      {t('compositeInfo', 'Composite materials automatically split into components when received in purchase orders. Example: "Oil with Drum" splits into "Oil" and "Drum" in inventory.')}
                    </p>
                  </div>

                  {/* Components Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                      {t('components', 'Components')}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                      onClick={addCompositionRow}
                      disabled={saving}
                    >
                      <Plus size={12} />
                      {t('addComponent', 'Add Component')}
                    </button>
                  </div>

                  {errors.compositions && (
                    <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
                      <AlertCircle size={14} className="mt-0.5 shrink-0" />
                      {errors.compositions}
                    </div>
                  )}

                  {/* Components Table */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-slate-600">
                          <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider">{t('componentMaterial', 'Component Material')} *</th>
                          <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider w-24">{t('type', 'Type')} *</th>
                          <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider w-20">{t('capacity', 'Capacity')}</th>
                          <th className="px-2 py-1.5 text-left text-[10px] font-semibold uppercase tracking-wider w-20">{t('unit', 'Unit')}</th>
                          <th className="px-2 py-1.5 text-center text-[10px] font-semibold uppercase tracking-wider w-16">{t('actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {compositions.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="px-2 py-4 text-center text-slate-400 text-xs">
                              {t('noComponentsAdded', 'No components added yet. Click "Add Component" to start.')}
                            </td>
                          </tr>
                        ) : (
                          compositions.map((comp, index) => (
                            <tr key={index} className="border-b border-slate-100">
                              <td className="px-1 py-1.5">
                                <select
                                  value={comp.component_material_id}
                                  onChange={(e) => updateComposition(index, 'component_material_id', e.target.value)}
                                  disabled={saving}
                                  className="w-full h-7 px-1.5 text-xs bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">{t('selectMaterial', 'Select material...')}</option>
                                  {availableComponentMaterials.map(material => (
                                    <option key={material.id} value={material.id}>
                                      {material.name} ({material.code})
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-1 py-1.5">
                                <select
                                  value={comp.component_type}
                                  onChange={(e) => updateComposition(index, 'component_type', e.target.value)}
                                  disabled={saving}
                                  className="w-full h-7 px-1.5 text-xs bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-blue-500"
                                >
                                  {componentTypes.map(type => (
                                    <option key={type.value} value={type.value}>
                                      {type.label}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-1 py-1.5">
                                <input
                                  type="number"
                                  value={comp.capacity}
                                  onChange={(e) => updateComposition(index, 'capacity', e.target.value)}
                                  disabled={saving}
                                  step="0.001"
                                  min="0"
                                  placeholder="200"
                                  className="w-full h-7 px-1.5 text-xs bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-blue-500"
                                />
                              </td>
                              <td className="px-1 py-1.5">
                                <select
                                  value={comp.capacity_unit}
                                  onChange={(e) => updateComposition(index, 'capacity_unit', e.target.value)}
                                  disabled={saving}
                                  className="w-full h-7 px-1.5 text-xs bg-white border border-slate-300 text-slate-700 focus:outline-none focus:border-blue-500"
                                >
                                  <option value="">{t('selectUnit', 'Select...')}</option>
                                  {capacityUnits.map(unit => (
                                    <option key={unit.value} value={unit.value}>
                                      {unit.value}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              <td className="px-1 py-1.5 text-center">
                                <button
                                  type="button"
                                  className="inline-flex items-center justify-center w-7 h-7 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                                  onClick={() => removeCompositionRow(index)}
                                  disabled={saving || compositions.length <= 1}
                                  title={t('removeComponent', 'Remove component')}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-2">
                    {t('capacityHint', 'Capacity is for reference only (e.g., 200L drum capacity). Actual quantities are determined at purchase order receipt.')}
                  </p>
                </div>
              )}
            </div>
        </div>
      </form>
    </Modal>
  )
}

export default MaterialFormModal
