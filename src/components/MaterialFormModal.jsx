import React, { useState, useEffect } from 'react'
import { useLocalization } from '../context/LocalizationContext'
import { X, Plus, Trash2, Layers, Package, AlertCircle } from 'lucide-react'
import './MaterialFormModal.css'

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
    is_composite: false
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
          is_composite: editingMaterial.is_composite || editingMaterial.compositions?.length > 0 || false
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
      is_composite: false
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
        is_composite: Boolean(formData.is_composite)
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

  if (!isOpen) return null

  return (
    <div className="modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="modal-content material-form-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>
            <Package size={20} />
            {editingMaterial ? t('editMaterial', 'Edit Material') : t('addMaterial', 'Add Material')}
          </h3>
          <button
            className="modal-close"
            onClick={handleClose}
            disabled={saving}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {errors.submit && (
              <div className="error-message">
                <AlertCircle size={16} />
                {errors.submit}
              </div>
            )}

            {/* Basic Material Information */}
            <div className="form-section">
              <h4>{t('basicInformation', 'Basic Information')}</h4>
              <div className="form-grid">
                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group full-width">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
                  <label>
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
            <div className="form-section pricing">
              <h4>{t('pricingInformation', 'Pricing Information')}</h4>
              <div className="form-grid">
                <div className="form-group">
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

                <div className="form-group">
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
            <div className="form-section compact">
              <h4>{t('additionalProperties', 'Additional Properties')}</h4>
              <div className="form-grid">
                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group span-2">
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

                <div className="form-group checkbox-group">
                  <label>
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

            {/* Composite Material Section */}
            <div className="form-section composite-section">
              <div className="composite-header">
                <h4>
                  <Layers size={18} />
                  {t('compositeMaterial', 'Composite Material')}
                </h4>
                <label className="toggle-switch">
                  <input
                    type="checkbox"
                    checked={formData.is_composite}
                    onChange={(e) => handleCompositeToggle(e.target.checked)}
                    disabled={saving}
                  />
                  <span className="toggle-slider"></span>
                  <span className="toggle-label">
                    {formData.is_composite ? t('enabled', 'Enabled') : t('disabled', 'Disabled')}
                  </span>
                </label>
              </div>

              {formData.is_composite && (
                <>
                  <div className="composite-info">
                    <AlertCircle size={16} />
                    <p>
                      {t('compositeInfo', 'Composite materials automatically split into components when received in purchase orders. Example: "Oil with Drum" splits into "Oil" and "Drum" in inventory.')}
                    </p>
                  </div>

                  <div className="compositions-builder">
                    <div className="builder-header">
                      <h5>{t('components', 'Components')}</h5>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={addCompositionRow}
                        disabled={saving}
                      >
                        <Plus size={14} />
                        {t('addComponent', 'Add Component')}
                      </button>
                    </div>

                    {errors.compositions && (
                      <div className="error-message">
                        <AlertCircle size={16} />
                        {errors.compositions}
                      </div>
                    )}

                    <div className="compositions-table">
                      <table>
                        <thead>
                          <tr>
                            <th>{t('componentMaterial', 'Component Material')} *</th>
                            <th>{t('type', 'Type')} *</th>
                            <th>{t('capacity', 'Capacity')}</th>
                            <th>{t('unit', 'Unit')}</th>
                            <th>{t('actions', 'Actions')}</th>
                          </tr>
                        </thead>
                        <tbody>
                          {compositions.length === 0 ? (
                            <tr>
                              <td colSpan="5" className="empty-row">
                                {t('noComponentsAdded', 'No components added yet. Click "Add Component" to start.')}
                              </td>
                            </tr>
                          ) : (
                            compositions.map((comp, index) => (
                              <tr key={index}>
                                <td>
                                  <select
                                    value={comp.component_material_id}
                                    onChange={(e) => updateComposition(index, 'component_material_id', e.target.value)}
                                    disabled={saving}
                                    className="component-select"
                                  >
                                    <option value="">{t('selectMaterial', 'Select material...')}</option>
                                    {availableComponentMaterials.map(material => (
                                      <option key={material.id} value={material.id}>
                                        {material.name} ({material.code})
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <select
                                    value={comp.component_type}
                                    onChange={(e) => updateComposition(index, 'component_type', e.target.value)}
                                    disabled={saving}
                                  >
                                    {componentTypes.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <input
                                    type="number"
                                    value={comp.capacity}
                                    onChange={(e) => updateComposition(index, 'capacity', e.target.value)}
                                    disabled={saving}
                                    step="0.001"
                                    min="0"
                                    placeholder="200"
                                    className="capacity-input"
                                  />
                                </td>
                                <td>
                                  <select
                                    value={comp.capacity_unit}
                                    onChange={(e) => updateComposition(index, 'capacity_unit', e.target.value)}
                                    disabled={saving}
                                    className="unit-input"
                                  >
                                    <option value="">{t('selectUnit', 'Select...')}</option>
                                    {capacityUnits.map(unit => (
                                      <option key={unit.value} value={unit.value}>
                                        {unit.value}
                                      </option>
                                    ))}
                                  </select>
                                </td>
                                <td>
                                  <button
                                    type="button"
                                    className="btn-icon danger"
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

                    <small className="hint-text">
                      {t('capacityHint', 'Capacity is for reference only (e.g., 200L drum capacity). Actual quantities are determined at purchase order receipt.')}
                    </small>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="modal-footer">
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
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? t('saving', 'Saving...') : t('save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default MaterialFormModal
