import React, { useState, useEffect } from 'react'
import { useLocalization } from '../../../context/LocalizationContext'
import Modal from '../../../components/ui/Modal'
import FileUpload from '../../../components/ui/FileUpload'
import FileViewer from '../../../components/ui/FileViewer'
import DateInput from '../../../components/ui/DateInput'
import Autocomplete from '../../../components/ui/Autocomplete'
import Input, { Textarea } from '../../../components/ui/Input'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { useTourBroadcast } from '../../../context/TourContext'
import systemSettingsService from '../../../services/systemSettingsService'
import branchService from '../../../services/branchService'
import uploadService from '../../../services/uploadService'
import purchaseOrderService from '../../../services/purchaseOrderService'
import { Plus, Trash2, Save, Truck, FileText, Calculator, Package, AlertTriangle, Building } from 'lucide-react'
// CSS moved to global index.css Tailwind

const PurchaseOrderForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  suppliers = [], 
  materials = [], 
  initialData = null, 
  title = "Create Purchase Order",
  isEdit = false 
}) => {
  const { t } = useLocalization()
  const { getInputDate, formatCurrency } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    supplierId: '',
    branch_id: '',
    orderDate: getInputDate(),
    expectedDeliveryDate: '',
    paymentTerms: 'net_30',
    items: [{ materialId: '', quantity: '', rate: '', amount: 0 }],
    notes: '',
    subtotal: 0,
    taxPercent: 5,
    taxAmount: 0,
    totalAmount: 0,
    status: 'draft'
  })

  const [loading, setLoading] = useState(false)
  const [loadingVat, setLoadingVat] = useState(false)
  const [branches, setBranches] = useState([])
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [errors, setErrors] = useState({})
  const [attachments, setAttachments] = useState([]) // S3 attachments
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  // Tour context broadcast
  const { broadcast, isTourActive } = useTourBroadcast()

  // Helper function to format date from ISO to yyyy-MM-dd
  const formatDateForInput = (dateValue) => {
    if (!dateValue) return ''
    // If it's already in yyyy-MM-dd format, return as is
    if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
      return dateValue
    }
    // Convert ISO format or Date object to yyyy-MM-dd
    try {
      const date = new Date(dateValue)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing existing order - map backend field names to frontend field names
        console.log('🔍 Loading PO for Edit:', initialData)
        console.log('📦 Initial Items:', initialData.items)

        const mappedItems = (initialData.items && initialData.items.length > 0)
          ? initialData.items.map(item => {
              console.log('🔄 Mapping item:', item)
              const mapped = {
                materialId: String(item.materialId || ''), // Ensure string type for select
                quantity: String(item.quantityOrdered || item.quantity || ''), // Backend uses quantityOrdered
                rate: String(item.unitPrice || item.rate || ''), // Backend uses unitPrice
                amount: parseFloat(item.totalPrice || item.amount || 0) // Backend uses totalPrice
              }
              console.log('✅ Mapped to:', mapped)
              return mapped
            })
          : [{ materialId: '', quantity: '', rate: '', amount: 0 }]

        console.log('📋 All mapped items:', mappedItems)

        setFormData({
          ...initialData,
          orderDate: formatDateForInput(initialData.orderDate),
          expectedDeliveryDate: formatDateForInput(initialData.expectedDeliveryDate),
          items: mappedItems
        })

        console.log('✨ FormData set with items:', mappedItems)
      } else {
        // Creating new order - generate order number
        const orderNum = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        setFormData(prev => ({
          ...prev,
          orderNumber: orderNum,
          orderDate: getInputDate()
        }))
      }

      // Load VAT rate from database
      loadVatRate()

      // Load active branches
      loadBranches()
    }
  }, [isOpen, initialData, getInputDate])

  // Load S3 attachments when editing an existing order
  useEffect(() => {
    const loadAttachments = async () => {
      if (isOpen && isEdit && initialData?.id) {
        setLoadingAttachments(true)
        try {
          const result = await uploadService.getS3Files('purchase-orders', initialData.id)
          if (result.success) {
            const mappedFiles = (result.data || []).map(file => ({
              id: file.id,
              originalFilename: file.original_filename || file.originalFilename,
              contentType: file.content_type || file.contentType,
              fileSize: file.file_size || file.fileSize,
              downloadUrl: file.download_url || file.downloadUrl
            }))
            setAttachments(mappedFiles)
          } else {
            setAttachments([])
          }
        } catch (error) {
          console.error('Error loading attachments:', error)
          setAttachments([])
        } finally {
          setLoadingAttachments(false)
        }
      } else {
        setAttachments([])
      }
    }
    loadAttachments()
  }, [isOpen, isEdit, initialData?.id])

  const loadVatRate = async () => {
    try {
      setLoadingVat(true)
      const vatRate = await systemSettingsService.getVatRate()
      setFormData(prev => ({ ...prev, taxPercent: vatRate }))
    } catch (error) {
      console.error('Error loading VAT rate:', error)
      // Keep default 5% if loading fails
    } finally {
      setLoadingVat(false)
    }
  }

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)
      const response = await branchService.getActive()
      if (response.success) {
        setBranches(response.data || [])
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.taxPercent])

  // Broadcast form state to tour context when tour is active
  useEffect(() => {
    if (isTourActive && isOpen) {
      // Count items that have at least a material selected
      const validItemCount = formData.items.filter(item => item.materialId).length
      // Count items that are complete (material, quantity, rate)
      const completeItemCount = formData.items.filter(
        item => item.materialId && item.quantity && item.rate
      ).length

      broadcast({
        formState: {
          hasSupplier: !!formData.supplierId,
          hasBranch: !!formData.branch_id,
          hasOrderDate: !!formData.orderDate,
          hasDeliveryDate: !!formData.expectedDeliveryDate,
          itemCount: validItemCount,
          completeItemCount: completeItemCount,
          hasNotes: !!formData.notes,
          isDraft: formData.status === 'draft',
          isEdit: isEdit
        }
      })
    }
  }, [formData, isTourActive, isOpen, isEdit, broadcast])

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const taxAmount = (subtotal * (formData.taxPercent || 0)) / 100
    const totalAmount = subtotal + taxAmount

    setFormData(prev => ({
      ...prev,
      subtotal,
      taxAmount,
      totalAmount
    }))
  }

  const handleSupplierChange = (supplierId) => {
    const supplier = suppliers.find(s => s.id === supplierId)
    setFormData(prev => ({
      ...prev,
      supplierId,
      paymentTerms: supplier?.paymentTermDays || 30
    }))
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // Auto-calculate amount when quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const quantity = parseFloat(newItems[index].quantity) || 0
      const rate = parseFloat(newItems[index].rate) || 0
      newItems[index].amount = quantity * rate
    }

    // Auto-populate rate from supplier contract if available
    if (field === 'materialId') {
      const supplier = suppliers.find(s => s.id === formData.supplierId)
      if (supplier?.contractDetails?.rates?.[value]) {
        const contractRate = supplier.contractDetails.rates[value]
        if (contractRate.type === 'fixed_rate') {
          newItems[index].rate = contractRate.contractRate
        } else {
          // For discount/guarantee types, use material standard price as base
          const material = materials.find(m => m.id === value)
          if (material?.standardPrice) {
            if (contractRate.type === 'discount_percentage') {
              const discountAmount = (material.standardPrice * contractRate.discountPercentage) / 100
              newItems[index].rate = Math.max(0, material.standardPrice - discountAmount)
            } else if (contractRate.type === 'minimum_price_guarantee') {
              newItems[index].rate = Math.min(material.standardPrice, contractRate.contractRate)
            }
          }
        }
        // Recalculate amount with new rate
        const quantity = parseFloat(newItems[index].quantity) || 0
        const rate = parseFloat(newItems[index].rate) || 0
        newItems[index].amount = quantity * rate
      }
    }

    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { materialId: '', quantity: '', rate: '', amount: 0 }]
    }))
  }

  const removeItem = (index) => {
    if (formData.items.length === 1) return // Keep at least one item
    const newItems = formData.items.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, items: newItems }))
  }

  const validateForm = () => {
    const newErrors = {}
    const isDraft = formData.status === 'draft'

    console.log('🔍 PO Validation Debug:')
    console.log('- Status:', formData.status)
    console.log('- isDraft:', isDraft)
    console.log('- Items:', formData.items)

    // Required for all statuses
    if (!formData.supplierId) {
      newErrors.supplierId = 'Please select a supplier'
    }

    // Branch is required for new orders (not draft edits)
    if (!formData.branch_id && !isDraft) {
      newErrors.branch_id = 'Please select a branch'
    }

    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required'
    }

    // Only required for non-draft statuses
    if (!isDraft) {
      if (!formData.expectedDeliveryDate) {
        newErrors.expectedDeliveryDate = 'Expected delivery date is required'
      }

      if (formData.expectedDeliveryDate && new Date(formData.expectedDeliveryDate) <= new Date(formData.orderDate)) {
        newErrors.expectedDeliveryDate = 'Delivery date must be after order date'
      }

      const hasValidItems = formData.items.some(item =>
        item.materialId && item.quantity && item.rate
      )

      console.log('- hasValidItems:', hasValidItems)

      if (!hasValidItems) {
        newErrors.items = 'Please add at least one valid item with complete details'
      }
    } else {
      console.log('✅ Draft mode - skipping items validation')
    }

    // Validate individual items (only if filled)
    formData.items.forEach((item, index) => {
      if (item.materialId && (!item.quantity || !item.rate)) {
        console.log(`❌ Item ${index} incomplete:`, item)
        newErrors[`item_${index}`] = 'Please fill in quantity and rate'
      }
    })

    console.log('- Validation errors:', newErrors)
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) {
      return
    }

    setLoading(true)
    
    try {
      // Add supplier name for display purposes
      const supplier = suppliers.find(s => s.id === formData.supplierId)

      // For drafts: allow items with at least materialId (partial items OK)
      // For confirmed: require all fields (materialId, quantity, rate)
      const isDraft = formData.status === 'draft'
      const filteredItems = isDraft
        ? formData.items.filter(item => item.materialId) // Only need material for drafts
        : formData.items.filter(item => item.materialId && item.quantity && item.rate) // All fields for confirmed

      console.log('📤 Submitting PO Data:')
      console.log('- Status:', formData.status)
      console.log('- isDraft:', isDraft)
      console.log('- Items before filter:', formData.items)
      console.log('- Items after filter:', filteredItems)

      const orderData = {
        ...formData,
        supplierName: supplier?.name || '',
        // Filter out empty items
        items: filteredItems
      }

      console.log('💰 Final orderData financial values:', {
        subtotal: orderData.subtotal,
        taxAmount: orderData.taxAmount,
        totalAmount: orderData.totalAmount,
        shippingCost: orderData.shippingCost
      })
      console.log('- Full orderData:', orderData)

      await onSave(orderData)
    } catch (error) {
      console.error('Error saving purchase order:', error)
      alert('Failed to save purchase order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedSupplier = suppliers.find(s => s.id === formData.supplierId)

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      className="modal-xxl"
      closeOnOverlayClick={false}
      tourId="PurchaseOrderForm"
    >
      <form className="purchase-order-form" onSubmit={handleSubmit}>
        {/* Draft Mode Info */}
        {formData.status === 'draft' && (
          <div className="flex items-center gap-2 p-3 mb-5 bg-blue-50 border border-blue-200 text-blue-700 text-sm">
            <AlertTriangle size={18} className="shrink-0" />
            <span>
              <strong>Draft Mode:</strong> You can save with minimal information (Supplier and Order Date only). Additional details can be added later.
            </span>
          </div>
        )}

        {/* Order Header */}
        <div className="form-section">
          <div className="form-section-title">
            <FileText size={20} />
            Order Information
          </div>
          
          <div className="form-grid">
            <Input
              label="Order Number"
              type="text"
              value={formData.orderNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
              required
              readOnly={isEdit}
            />

            <Autocomplete
              label="Supplier"
              options={suppliers}
              value={formData.supplierId}
              onChange={(supplierId) => handleSupplierChange(supplierId)}
              getOptionLabel={(supplier) => supplier ? `${supplier.name} (${supplier.specialization ? supplier.specialization.replace('_', ' ').toUpperCase() : 'General'})` : ''}
              getOptionValue={(supplier) => supplier?.id || ''}
              placeholder="Select Supplier..."
              searchable
              required
              error={errors.supplierId}
              data-tour="po-supplier-select"
            />

            <Autocomplete
              label={`Branch ${formData.status !== 'draft' ? '*' : ''}`}
              options={branches}
              value={formData.branch_id}
              onChange={(branchId) => setFormData(prev => ({ ...prev, branch_id: branchId }))}
              getOptionLabel={(branch) => branch ? `${branch.name} (${branch.code})` : ''}
              getOptionValue={(branch) => branch?.id || ''}
              placeholder="Select Branch..."
              searchable
              required={formData.status !== 'draft'}
              disabled={loadingBranches}
              loading={loadingBranches}
              error={errors.branch_id}
              helperText={loadingBranches ? 'Loading branches...' : null}
              data-tour="po-branch-select"
            />

            <DateInput
              label="Order Date"
              value={formData.orderDate || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, orderDate: value || '' }))}
              required
              error={errors.orderDate}
            />

            <DateInput
              label={`Expected Delivery Date ${formData.status !== 'draft' ? '*' : ''}`}
              value={formData.expectedDeliveryDate || ''}
              onChange={(value) => setFormData(prev => ({ ...prev, expectedDeliveryDate: value || '' }))}
              minDate={formData.orderDate || ''}
              required={formData.status !== 'draft'}
              error={errors.expectedDeliveryDate}
            />

            <Autocomplete
              label="Payment Terms"
              options={[
                { value: 'immediate', label: 'Immediate' },
                { value: 'net_30', label: 'Net 30 Days' },
                { value: 'net_60', label: 'Net 60 Days' },
                { value: 'net_90', label: 'Net 90 Days' },
                { value: 'advance', label: 'Advance Payment' },
                { value: 'cod', label: 'Cash on Delivery' }
              ]}
              value={formData.paymentTerms}
              onChange={(value) => setFormData(prev => ({ ...prev, paymentTerms: value }))}
              searchable={false}
            />

            <Autocomplete
              label="Order Status"
              options={[
                { value: 'draft', label: 'Draft' },
                { value: 'pending', label: 'Pending Approval' },
                { value: 'approved', label: 'Approved' },
                { value: 'delivered', label: 'Delivered' },
                { value: 'received', label: 'Received' },
                { value: 'cancelled', label: 'Cancelled' }
              ]}
              value={formData.status}
              onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
              searchable={false}
            />
          </div>
        </div>

        {/* Supplier Information */}
        {selectedSupplier && (
          <div className="form-section">
            <div className="form-section-title">
              <Truck size={20} />
              Supplier Information
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 bg-slate-50 border border-slate-200">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Supplier Name</span>
                <span className="text-sm font-medium text-slate-700">{selectedSupplier.name}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Contact Person</span>
                <span className="text-sm font-medium text-slate-700">{selectedSupplier.contactPerson || '-'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Phone</span>
                <span className="text-sm font-medium text-slate-700">{selectedSupplier.phone || '-'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Email</span>
                <span className="text-sm font-medium text-slate-700">{selectedSupplier.email || '-'}</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Payment Terms</span>
                <span className="text-sm font-medium text-slate-700">{selectedSupplier.paymentTermDays || 30} days</span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Status</span>
                <span className={`inline-flex w-fit px-2 py-0.5 text-xs font-medium ${selectedSupplier.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                  {selectedSupplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="form-section" data-tour="po-items-section">
          <div className="form-section-title">
            <div className="flex items-center justify-between w-full">
              <span className="flex items-center gap-2">
                <Package size={20} />
                Order Items
              </span>
              <button
                type="button"
                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-300 hover:border-blue-500 hover:text-blue-600 transition-colors"
                onClick={addItem}
              >
                <Plus size={14} />
                Add Item
              </button>
            </div>
          </div>

          {errors.items && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-700 text-sm">
              <AlertTriangle size={16} className="shrink-0" />
              {errors.items}
            </div>
          )}

          <div className="bg-slate-50 border border-slate-200 overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1fr_0.7fr_1.2fr_1.2fr_0.7fr] gap-3 p-3 bg-slate-800 text-white text-xs font-semibold uppercase tracking-wider max-md:hidden">
              <span>Material</span>
              <span className="text-center">Quantity</span>
              <span className="text-center">Unit</span>
              <span className="text-center">Rate (OMR)</span>
              <span className="text-center">Amount (OMR)</span>
              <span className="text-center">Actions</span>
            </div>

            {formData.items.map((item, index) => {
              const selectedMaterial = materials.find(m => m.id === item.materialId)
              const hasContractRate = selectedSupplier?.contractDetails?.rates?.[item.materialId]
              const isDraft = formData.status === 'draft'

              return (
                <div
                  key={index}
                  className={`grid grid-cols-[2fr_1fr_0.7fr_1.2fr_1.2fr_0.7fr] gap-3 p-3 bg-white border-b border-slate-200 items-center last:border-b-0 max-md:grid-cols-1 max-md:gap-2 ${errors[`item_${index}`] ? 'bg-red-50' : ''}`}
                >
                  <div>
                    <Autocomplete
                      options={materials}
                      value={item.materialId}
                      onChange={(materialId) => handleItemChange(index, 'materialId', materialId)}
                      getOptionLabel={(material) => material?.name || ''}
                      getOptionValue={(material) => material?.id || ''}
                      placeholder="Select material..."
                      searchable
                      required={!isDraft}
                      size="small"
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.001"
                      required={!isDraft}
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-300 text-slate-700 text-center focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="px-2 py-1.5 bg-slate-100 text-slate-600 text-sm text-center w-full">
                      {selectedMaterial ? selectedMaterial.unit : '-'}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      placeholder="0.000"
                      min="0"
                      step="0.001"
                      required={!isDraft}
                      className="w-full h-9 px-2.5 text-sm bg-white border border-slate-300 text-slate-700 text-center focus:outline-none focus:border-blue-500"
                    />
                    {hasContractRate && (
                      <span className="text-[10px] font-medium text-emerald-600 text-center">Contract Rate</span>
                    )}
                  </div>

                  <div className="flex items-center justify-center">
                    <span className="px-2 py-1.5 bg-slate-100 text-slate-800 text-sm font-medium text-center w-full">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>

                  <div className="flex items-center justify-center">
                    <button
                      type="button"
                      className="inline-flex items-center justify-center w-8 h-8 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Totals */}
        <div className="form-section">
          <div className="form-section-title">
            <Calculator size={20} />
            Order Totals
          </div>

          <div className="max-w-md ml-auto p-4 bg-slate-50 border border-slate-200">
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="font-medium text-slate-600">Subtotal:</span>
              <span className="font-semibold text-slate-800">{formatCurrency(formData.subtotal)}</span>
            </div>
            <div className="flex justify-between items-center py-2 text-sm">
              <span className="font-medium text-slate-600 flex items-center gap-2">
                Tax ({formData.taxPercent}%):
                <span className="px-2 py-0.5 bg-slate-200 text-slate-500 text-xs">From system settings</span>
              </span>
              <span className="font-semibold text-slate-800">{formatCurrency(formData.taxAmount)}</span>
            </div>
            <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-slate-300 text-base">
              <span className="font-bold text-slate-900">Total Amount:</span>
              <span className="font-bold text-lg text-blue-600">{formatCurrency(formData.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <div className="form-section-title">Notes & Instructions</div>
          <Textarea
            label="Order Notes"
            value={formData.notes || ''}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Any special notes or instructions for this order..."
            rows={3}
          />
        </div>

        {/* Attachments - Only in edit mode */}
        {isEdit && initialData?.id && (
          <div className="form-section">
            <div className="form-section-title">Attachments</div>

            {/* Upload new files */}
            <FileUpload
              mode="multiple"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5242880}
              maxFiles={10}
              onUpload={async (files) => {
                try {
                  const result = await uploadService.uploadMultipleToS3('purchase-orders', initialData.id, files)
                  if (result.success) {
                    // Reload attachments from S3
                    const attachmentsResult = await uploadService.getS3Files('purchase-orders', initialData.id)
                    if (attachmentsResult.success) {
                      const mappedFiles = (attachmentsResult.data || []).map(file => ({
                        id: file.id,
                        originalFilename: file.original_filename || file.originalFilename,
                        contentType: file.content_type || file.contentType,
                        fileSize: file.file_size || file.fileSize,
                        downloadUrl: file.download_url || file.downloadUrl
                      }))
                      setAttachments(mappedFiles)
                    }
                    alert('Files uploaded successfully')
                  } else {
                    alert('Failed to upload files: ' + result.error)
                  }
                } catch (error) {
                  console.error('Upload error:', error)
                  alert('Failed to upload files: ' + error.message)
                }
              }}
              existingFiles={[]}
            />

            {/* Display existing attachments */}
            {loadingAttachments ? (
              <div className="attachments-loading">Loading attachments...</div>
            ) : attachments.length > 0 ? (
              <FileViewer
                files={attachments}
                onDelete={async (fileId) => {
                  if (!window.confirm('Are you sure you want to delete this file?')) return
                  try {
                    const result = await uploadService.deleteS3File('purchase-orders', initialData.id, fileId)
                    if (result.success) {
                      setAttachments(prev => prev.filter(f => f.id !== fileId))
                      alert('File deleted successfully')
                    } else {
                      alert('Failed to delete file: ' + result.error)
                    }
                  } catch (error) {
                    console.error('Delete error:', error)
                    alert('Failed to delete file: ' + error.message)
                  }
                }}
                onRefreshUrl={async (fileId) => {
                  const result = await uploadService.getS3Files('purchase-orders', initialData.id)
                  if (result.success) {
                    const file = result.data.find(f => f.id === fileId)
                    if (file) {
                      return file.download_url || file.downloadUrl
                    }
                  }
                  return null
                }}
                canDelete={true}
              />
            ) : (
              <div className="empty-state text-sm">{t('noAttachments')}</div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            data-tour="po-submit-button"
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Update Order' : 'Create Order'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default PurchaseOrderForm