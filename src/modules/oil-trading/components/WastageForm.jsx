import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { useDropzone } from 'react-dropzone'
import Modal from '../../../components/ui/Modal'
import Input, { Textarea } from '../../../components/ui/Input'
import { Select } from '../../../components/ui/Select'
import DateInput from '../../../components/ui/DateInput'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import wastageService from '../../../services/wastageService'
import inventoryService from '../../../services/inventoryService'
import { collectionOrderService } from '../../../services/collectionService'
import uploadService from '../../../services/uploadService'
import FileViewer from '../../../components/ui/FileViewer'
import { WASTAGE_TYPE_COLORS } from '../pages/Wastage'
import {
  Package,
  AlertTriangle,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  Link as LinkIcon,
  Info
} from 'lucide-react'

const WastageForm = ({
  isOpen,
  onClose,
  onSave,
  onSuccess, // Alternative callback for when used from collection context
  materials = [],
  wasteTypes = [],
  initialData = null,
  isEditing = false,
  // Collection context props - when recording wastage from a collection
  preSelectedCollectionId = null,
  collectionMaterials = null, // Array of { materialId, materialName, unit, quantity }
  collectionOrderNumber = null // For display purposes
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
  // Stock warning is now handled via validation errors, no modal needed
  const [recentCollections, setRecentCollections] = useState([])
  const [loadingCollections, setLoadingCollections] = useState(false)
  const [selectedMaterial, setSelectedMaterial] = useState(null)
  const [submitError, setSubmitError] = useState(null)
  const [s3Attachments, setS3Attachments] = useState([]) // S3 attachments for existing wastage
  const [loadingS3Attachments, setLoadingS3Attachments] = useState(false)

  // Load S3 attachments when editing existing wastage
  useEffect(() => {
    const loadS3Attachments = async () => {
      if (isOpen && isEditing && initialData?.id) {
        setLoadingS3Attachments(true)
        try {
          const result = await uploadService.getS3Files('wastages', initialData.id)
          if (result.success) {
            const mappedFiles = (result.data || []).map(file => ({
              id: file.id,
              originalFilename: file.original_filename || file.originalFilename,
              contentType: file.content_type || file.contentType,
              fileSize: file.file_size || file.fileSize,
              downloadUrl: file.download_url || file.downloadUrl
            }))
            setS3Attachments(mappedFiles)
          }
        } catch (error) {
          console.error('Error loading S3 attachments:', error)
        } finally {
          setLoadingS3Attachments(false)
        }
      } else {
        setS3Attachments([])
      }
    }
    loadS3Attachments()
  }, [isOpen, isEditing, initialData?.id])

  // Determine which materials to use - collection context materials take priority
  // Use useMemo to prevent recreation on every render (which causes useEffect to re-fire)
  const effectiveMaterials = useMemo(() => {
    if (collectionMaterials && collectionMaterials.length > 0) {
      return collectionMaterials.map(cm => ({
        id: cm.materialId,
        name: cm.materialName,
        unit: cm.unit,
        collectedQuantity: cm.quantity // Store for reference
      }))
    }
    return materials
  }, [collectionMaterials, materials])

  // Check if we're in collection context mode
  const isCollectionContext = !!preSelectedCollectionId

  // Track if the modal was previously open to detect open/close transitions
  const wasOpenRef = useRef(false)
  // Track the initialData ID to detect when editing a different record
  const lastInitialDataIdRef = useRef(null)

  // Reset form only when modal opens (not on every render)
  useEffect(() => {
    // Only run initialization when modal transitions from closed to open
    // OR when editing a different wastage record
    const isOpening = isOpen && !wasOpenRef.current
    // Use null coalescing to handle both null and undefined consistently
    const currentDataId = initialData?.id ?? null
    const lastDataId = lastInitialDataIdRef.current ?? null
    const isEditingDifferent = isOpen && currentDataId !== lastDataId

    if (isOpening || isEditingDifferent) {
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
        const material = effectiveMaterials.find(m => m.id === initialData.materialId)
        setSelectedMaterial(material)

        // Fetch current stock for editing
        if (initialData.materialId) {
          fetchCurrentStock(initialData.materialId)
        }

        lastInitialDataIdRef.current = initialData.id
      } else {
        // Creating new wastage - pre-select collection if in collection context
        setFormData({
          materialId: '',
          wasteType: '',
          quantity: '',
          unitCost: '',
          wastageDate: getInputDate(),
          location: '',
          reason: '',
          description: '',
          collectionOrderId: preSelectedCollectionId ? String(preSelectedCollectionId) : '',
          attachments: []
        })
        setSelectedMaterial(null)
        setCurrentStock(null)
        lastInitialDataIdRef.current = null
      }

      setErrors({})
      setSubmitError(null)

      // Only load recent collections if not in collection context mode
      if (!isCollectionContext) {
        loadRecentCollections()
      }
    }

    // Update the ref to track current open state
    wasOpenRef.current = isOpen
  }, [isOpen, initialData, effectiveMaterials, getInputDate, preSelectedCollectionId, isCollectionContext])

  // Load recent finalized collections for linking
  // Only show finalized collections (is_finalized=1) which have completed WCN process
  const loadRecentCollections = async () => {
    setLoadingCollections(true)
    try {
      const sixtyDaysAgo = new Date()
      sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60)

      // Get finalized collection orders - these are the ones wastage can be linked to
      const result = await collectionOrderService.getCollectionOrders({
        fromDate: sixtyDaysAgo.toISOString().split('T')[0],
        isFinalized: 'true',
        limit: 100
      })

      if (result.success !== false) {
        // Handle various response formats
        const collections = result.data?.data || result.data || []
        // Backend now includes items and materialIds directly for each order
        const normalizedCollections = (Array.isArray(collections) ? collections : []).map(c => ({
          ...c,
          // Use items directly from backend (already includes materialId, materialName)
          items: c.items || [],
          // materialIds is now provided by backend, fallback to extracting from items
          materialIds: c.materialIds || (c.items || []).map(item => item.materialId).filter(Boolean)
        }))
        setRecentCollections(normalizedCollections)

        // Debug log if no collections found
        if (normalizedCollections.length === 0) {
          console.log('No finalized collections found in the last 60 days')
        }
      }
    } catch (error) {
      console.error('Error loading collections:', error)
      setRecentCollections([])
    } finally {
      setLoadingCollections(false)
    }
  }

  // Filter collections by selected material
  const filteredCollections = formData.materialId
    ? recentCollections.filter(c =>
        c.materialIds?.includes(parseInt(formData.materialId)) ||
        c.materialIds?.includes(String(formData.materialId))
      )
    : recentCollections

  // Get selected collection info for display
  const selectedCollection = formData.collectionOrderId
    ? recentCollections.find(c => String(c.id) === String(formData.collectionOrderId))
    : null

  // Fetch current stock for selected material
  const fetchCurrentStock = async (materialId) => {
    if (!materialId) {
      setCurrentStock(null)
      return
    }

    setLoadingStock(true)
    try {
      const result = await inventoryService.getCurrentStock(materialId)
      if (result.success && result.data) {
        // API returns totalQuantity and availableQuantity - use availableQuantity for wastage
        setCurrentStock(result.data.availableQuantity ?? result.data.totalQuantity ?? 0)
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
    const material = effectiveMaterials.find(m => String(m.id) === String(materialId))
    setSelectedMaterial(material)

    // Reset collection selection when material changes (unless in collection context)
    setFormData(prev => {
      const newData = {
        ...prev,
        materialId,
        collectionOrderId: isCollectionContext ? prev.collectionOrderId : ''
      }

      // In collection context mode, auto-fill cost from the pre-selected collection
      if (isCollectionContext && prev.collectionOrderId && materialId) {
        const collection = recentCollections.find(c => String(c.id) === String(prev.collectionOrderId))
        if (collection && collection.items) {
          const materialItem = collection.items.find(
            item => String(item.materialId) === String(materialId)
          )
          if (materialItem && materialItem.contractRate) {
            newData.unitCost = String(materialItem.contractRate)
          }
        }
      }

      return newData
    })
    fetchCurrentStock(materialId)

    // Clear material error
    if (errors.materialId) {
      setErrors(prev => ({ ...prev, materialId: null }))
    }
  }

  // Handle form field changes
  const handleChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value }

      // Auto-fill unit cost when collection is selected (if material is already selected)
      if (field === 'collectionOrderId' && value && prev.materialId) {
        const collection = recentCollections.find(c => String(c.id) === String(value))
        if (collection && collection.items) {
          const materialItem = collection.items.find(
            item => String(item.materialId) === String(prev.materialId)
          )
          // Use contract rate from the collection item if available
          if (materialItem && materialItem.contractRate) {
            newData.unitCost = String(materialItem.contractRate)
          }
        }
      }

      return newData
    })

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
    } else if (currentStock !== null && quantity > currentStock) {
      // Hard block: wastage quantity cannot exceed available stock
      newErrors.quantity = t('quantityExceedsStock', 'Quantity ({qty}) exceeds available stock ({stock})')
        .replace('{qty}', quantity)
        .replace('{stock}', currentStock)
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
  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    const quantity = parseFloat(formData.quantity)

    // Double-check stock validation (already done in validateForm, but safety check)
    if (currentStock !== null && quantity > currentStock) {
      setErrors(prev => ({
        ...prev,
        quantity: t('quantityExceedsStock', 'Quantity ({qty}) exceeds available stock ({stock})')
          .replace('{qty}', quantity)
          .replace('{stock}', currentStock)
      }))
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
        // Call appropriate callback - onSuccess takes priority (for collection context)
        if (onSuccess) {
          onSuccess(result.data)
        } else if (onSave) {
          onSave(result.data)
        }
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

  // Material options with current stock display - use effective materials (collection or general)
  const materialOptions = effectiveMaterials.map(m => ({
    value: String(m.id),
    label: isCollectionContext
      ? `${m.name || ''} (${m.collectedQuantity || 0} ${m.unit || ''})`
      : `${m.code || m.materialCode || ''} - ${m.name || ''}`
  }))

  // Waste type options with color indicator
  const wasteTypeOptions = wasteTypes.map(type => ({
    value: type.value,
    label: type.label,
    color: WASTAGE_TYPE_COLORS[type.value] || WASTAGE_TYPE_COLORS.other
  }))

  // Collection options - use filtered collections based on selected material
  const collectionOptions = [
    { value: '', label: formData.materialId
      ? t('selectCollectionForMaterial', 'Select collection containing this material')
      : t('selectMaterialFirst', 'Select a material first')
    },
    ...filteredCollections.map(c => {
      const wcnRef = c.wcn_number || c.wcnNumber || c.order_number || c.orderNumber || `#${c.id}`
      const supplier = c.supplier_name || c.supplierName || ''
      const date = new Date(c.finalized_at || c.finalizedAt || c.scheduled_date || c.scheduledDate || c.created_at || c.createdAt).toLocaleDateString()
      const itemCount = c.items?.length || 0
      return {
        value: String(c.id),
        label: `${wcnRef}${supplier ? ` - ${supplier}` : ''} (${date}, ${itemCount} ${t('items', 'items')})`
      }
    })
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
        title={isEditing ? t('editWastage', 'Edit Wastage') : t('reportWastage', 'Report Wastage')}
        size="lg"
      >
        <div className="flex flex-col gap-0">
          {submitError && (
            <div className="flex items-center gap-2 px-4 py-3 mb-4 bg-red-50 border border-red-200 text-red-600 text-sm">
              <AlertTriangle size={16} />
              <span>{submitError}</span>
              <button onClick={() => setSubmitError(null)} className="ml-auto bg-transparent border-none cursor-pointer p-1 text-red-600 hover:text-red-800">
                <X size={14} />
              </button>
            </div>
          )}

          {/* Collection Context Banner */}
          {isCollectionContext && (
            <div className="flex flex-col gap-2 p-4 mb-4 bg-amber-50 border border-amber-200">
              <div className="flex items-center gap-2 text-sm text-amber-800">
                <Info size={16} className="text-amber-600 shrink-0" />
                <strong>{t('recordingWastageFor', 'Recording wastage for collection')}:</strong>
                <span className="font-semibold text-amber-900 bg-white/50 px-2 py-0.5">{collectionOrderNumber || `#${preSelectedCollectionId}`}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-amber-700 bg-white/40 px-3 py-2 ml-6">
                <AlertTriangle size={14} className="shrink-0 text-amber-600" />
                <span>{t('wastageInventoryNote', 'Note: Inventory will only be reduced when this wastage is approved.')}</span>
              </div>
            </div>
          )}

          {/* Material Selection Section */}
          <div className="form-section">
            <div className="form-section-title">
              <Package size={18} />
              {t('materialInfo', 'Material Information')}
            </div>

            <div className="form-grid">
              <div className="form-group">
                <label>{t('material', 'Material')} *</label>
                <Select
                  value={formData.materialId}
                  onChange={(e) => handleMaterialChange(e.target.value)}
                >
                  <option value="">{t('selectMaterialPlaceholder', 'Select a material...')}</option>
                  {materialOptions.map((opt, index) => (
                    <option key={`mat-${opt.value}-${index}`} value={opt.value}>{opt.label}</option>
                  ))}
                </Select>
                {errors.materialId && <span className="text-xs text-red-600 mt-1">{errors.materialId}</span>}
              </div>

              <div className="form-group">
                <label>{t('wasteType', 'Waste Type')} *</label>
                <div className="flex items-center gap-2">
                  <Select
                    value={formData.wasteType}
                    onChange={(e) => handleChange('wasteType', e.target.value)}
                    className="flex-1"
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
                      className="inline-block w-4 h-4 shrink-0"
                      style={{ backgroundColor: WASTAGE_TYPE_COLORS[formData.wasteType] || WASTAGE_TYPE_COLORS.other }}
                    />
                  )}
                </div>
                {errors.wasteType && <span className="text-xs text-red-600 mt-1">{errors.wasteType}</span>}
              </div>

              {formData.materialId && (
                <div className="form-group">
                  <label>{t('currentStockLabel', 'Current Stock')}</label>
                  <div className="flex items-center gap-2 px-3 py-2.5 bg-blue-50 border border-blue-200 text-sm">
                    {loadingStock ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      <span className="font-semibold text-blue-800">
                        {currentStock !== null ? currentStock : '-'} {selectedMaterial?.unit || ''}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Collection Link Section - Hidden when in collection context mode */}
          {!isCollectionContext && (
            <div className="form-section">
              <div className="form-section-title">
                <LinkIcon size={18} />
                {t('linkToCollection', 'Link to Collection')}
              </div>

              <div className="p-5 space-y-4">
                <div className="form-group">
                  <label>{t('selectCollection', 'Select Collection')}</label>
                  <Select
                    value={formData.collectionOrderId}
                    onChange={(e) => handleChange('collectionOrderId', e.target.value)}
                    disabled={loadingCollections || !formData.materialId}
                  >
                    {loadingCollections ? (
                      <option value="">{t('loading', 'Loading...')}</option>
                    ) : filteredCollections.length === 0 && formData.materialId ? (
                      <option value="">{t('noCollectionsForMaterial', 'No collections found with this material')}</option>
                    ) : (
                      collectionOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))
                    )}
                  </Select>
                  <span className="text-xs text-slate-500">
                    {!formData.materialId
                      ? t('selectMaterialToFilterCollections', 'Select a material to see relevant collections')
                      : t('optionalCollectionLink', 'Optional: Link this wastage to a collection order')
                    }
                  </span>
                </div>

                {/* Selected Collection Info */}
                {selectedCollection && (
                  <div className="p-4 bg-blue-50 border border-blue-200">
                    <div className="flex items-center gap-2 mb-3 text-blue-800 text-sm font-semibold">
                      <Info size={16} />
                      {t('selectedCollectionInfo', 'Selected Collection')}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="text-slate-500">{t('wcnNumber', 'WCN')}:</div>
                      <div className="text-slate-900 font-medium">{selectedCollection.wcn_number || selectedCollection.wcnNumber || selectedCollection.order_number || selectedCollection.orderNumber || `#${selectedCollection.id}`}</div>

                      {(selectedCollection.supplier_name || selectedCollection.supplierName) && (
                        <>
                          <div className="text-slate-500">{t('supplier', 'Supplier')}:</div>
                          <div className="text-slate-900 font-medium">{selectedCollection.supplier_name || selectedCollection.supplierName}</div>
                        </>
                      )}

                      <div className="text-slate-500">{t('date', 'Date')}:</div>
                      <div className="text-slate-900 font-medium">{new Date(selectedCollection.finalized_at || selectedCollection.finalizedAt || selectedCollection.scheduled_date || selectedCollection.scheduledDate || selectedCollection.created_at).toLocaleDateString()}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Quantities Section */}
          <div className="form-section">
            <div className="form-section-title">{t('quantitiesAndCosts', 'Quantities & Costs')}</div>

            <div className="form-grid-3">
              <div className="form-group">
                <label>{t('quantity', 'Quantity')} *</label>
                <div className="flex items-stretch">
                  <Input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    placeholder="0"
                    min="0"
                    step="0.001"
                    error={errors.quantity}
                    className="flex-1 !rounded-r-none !border-r-0"
                  />
                  <span className="flex items-center px-3 bg-slate-100 border border-slate-300 text-sm text-slate-600">{selectedMaterial?.unit || 'unit'}</span>
                </div>
                {errors.quantity && <span className="text-xs text-red-600 mt-1">{errors.quantity}</span>}
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
                {errors.unitCost && <span className="text-xs text-red-600 mt-1">{errors.unitCost}</span>}
              </div>

              <div className="form-group">
                <label>{t('totalCost', 'Total Cost')}</label>
                <div className="flex items-center justify-center px-3 py-2.5 bg-emerald-50 border border-emerald-200 text-base font-semibold text-emerald-700">
                  OMR {totalCost.toFixed(3)}
                </div>
              </div>
            </div>
          </div>

          {/* Date, Location, and Details Section */}
          <div className="form-section">
            <div className="form-section-title">{t('additionalDetails', 'Additional Details')}</div>
            <div className="form-grid">
              <div className="form-group">
                <label>{t('wastageDate', 'Wastage Date')} *</label>
                <DateInput
                  value={formData.wastageDate}
                  onChange={(value) => handleChange('wastageDate', value)}
                  maxDate={new Date().toISOString().split('T')[0]}
                  error={errors.wastageDate}
                />
                {errors.wastageDate && <span className="text-xs text-red-600 mt-1">{errors.wastageDate}</span>}
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

              <div className="form-group">
                <label>{t('wastageReason', 'Reason')}</label>
                <Input
                  type="text"
                  value={formData.reason}
                  onChange={(e) => handleChange('reason', e.target.value)}
                  placeholder={t('briefReason', 'Brief reason for wastage')}
                />
              </div>

              <div className="form-group full-width">
                <label>{t('wastageDescription', 'Description')}</label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => handleChange('description', e.target.value)}
                  placeholder={t('detailedDescription', 'Detailed description of the wastage incident')}
                  rows={2}
                />
              </div>
            </div>
          </div>

          {/* Attachments Section */}
          <div className="form-section">
            <div className="form-section-title">
              <Upload size={18} />
              {t('attachments', 'Attachments')}
            </div>
            <div className="p-5 space-y-4">
              <div
                {...getRootProps()}
                className={`flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed bg-white cursor-pointer transition-all ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'
                }`}
              >
                <input {...getInputProps()} />
                <Upload size={28} className="text-slate-400" />
                <p className="m-0 text-sm text-slate-700">{t('dragDropFiles', 'Drag and drop files here or click to browse')}</p>
                <span className="text-xs text-slate-500">
                  {t('supportedFormats', 'Supported formats: JPEG, PNG, PDF')} | {t('maxFileSize', 'Max 5MB per file')}
                </span>
              </div>

              {errors.attachments && (
                <span className="text-xs text-red-600">{errors.attachments}</span>
              )}

              {formData.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="flex items-center gap-2 px-3 py-2 bg-white border border-slate-200 text-xs">
                      {file.type?.startsWith('image/') || (file instanceof File && file.type.startsWith('image/')) ? (
                        <ImageIcon size={18} className="text-slate-400" />
                      ) : (
                        <FileText size={18} className="text-slate-400" />
                      )}
                      <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-slate-700">
                        {file.name || (file instanceof File ? file.name : `File ${index + 1}`)}
                      </span>
                      <button
                        type="button"
                        className="flex items-center justify-center bg-transparent border-none cursor-pointer p-1 text-slate-400 transition-colors hover:text-red-600"
                        onClick={() => removeAttachment(index)}
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* S3 Attachments - Show existing files when editing */}
              {isEditing && initialData?.id && (
                <div className="pt-4 border-t border-slate-200">
                  <h5 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    {t('existingAttachments', 'Existing Attachments')}
                  </h5>
                  {loadingS3Attachments ? (
                    <div className="text-sm text-slate-400 italic">{t('loadingAttachments', 'Loading attachments...')}</div>
                  ) : s3Attachments.length > 0 ? (
                    <FileViewer
                      files={s3Attachments}
                      onDelete={async (fileId) => {
                        if (!window.confirm(t('confirmDeleteFile', 'Are you sure you want to delete this file?'))) return
                        try {
                          const result = await uploadService.deleteS3File('wastages', initialData.id, fileId)
                          if (result.success) {
                            setS3Attachments(prev => prev.filter(f => f.id !== fileId))
                            alert(t('fileDeleted', 'File deleted successfully'))
                          } else {
                            alert(t('fileDeleteFailed', 'Failed to delete file') + ': ' + result.error)
                          }
                        } catch (error) {
                          console.error('Delete error:', error)
                          alert(t('fileDeleteFailed', 'Failed to delete file') + ': ' + error.message)
                        }
                      }}
                      onRefreshUrl={async (fileId) => {
                        const result = await uploadService.getS3Files('wastages', initialData.id)
                        if (result.success) {
                          const file = result.data.find(f => f.id === fileId)
                          if (file) return file.download_url || file.downloadUrl
                        }
                        return null
                      }}
                      canDelete={true}
                    />
                  ) : (
                    <div className="text-sm text-slate-400 italic">
                      {t('noExistingAttachments', 'No existing attachments')}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              disabled={submitting}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => handleSubmit(false)}
              disabled={submitting || !isFormValid}
            >
              {submitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  {t('saving', 'Saving...')}
                </>
              ) : (
                t(isEditing ? 'update' : 'save', isEditing ? 'Update' : 'Save')
              )}
            </button>
          </div>
        </div>
      </Modal>

    </>
  )
}

export default WastageForm
