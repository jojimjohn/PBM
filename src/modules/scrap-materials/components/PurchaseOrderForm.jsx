import React, { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import FileUpload from '../../../components/ui/FileUpload'
import DatePicker from '../../../components/ui/DatePicker'
import Autocomplete from '../../../components/ui/Autocomplete'
import Input, { Textarea } from '../../../components/ui/Input'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { useTourBroadcast } from '../../../context/TourContext'
import systemSettingsService from '../../../services/systemSettingsService'
import branchService from '../../../services/branchService'
import uploadService from '../../../services/uploadService'
import purchaseOrderService from '../../../services/purchaseOrderService'
import { Plus, Trash2, Save, Truck, FileText, Calculator, Package, AlertTriangle, Building } from 'lucide-react'
import './PurchaseOrderForm.css'

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
      const validItemCount = formData.items.filter(item => item.materialId).length
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

    console.log('💰 Calculating totals:', {
      itemsCount: formData.items.length,
      itemAmounts: formData.items.map(i => i.amount),
      subtotal,
      taxPercent: formData.taxPercent,
      taxAmount,
      totalAmount
    })

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
          <div className="info-banner" style={{ background: '#e3f2fd', padding: '12px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#1976d2' }} />
            <span style={{ color: '#1565c0' }}>
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
            />

            <DatePicker
              label="Order Date"
              value={formData.orderDate ? new Date(formData.orderDate) : null}
              onChange={(date) => setFormData(prev => ({ ...prev, orderDate: date ? date.toISOString().split('T')[0] : '' }))}
              required
              error={errors.orderDate}
            />

            <DatePicker
              label={`Expected Delivery Date ${formData.status !== 'draft' ? '*' : ''}`}
              value={formData.expectedDeliveryDate ? new Date(formData.expectedDeliveryDate) : null}
              onChange={(date) => setFormData(prev => ({ ...prev, expectedDeliveryDate: date ? date.toISOString().split('T')[0] : '' }))}
              minDate={formData.orderDate ? new Date(formData.orderDate) : null}
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
            
            <div className="vendor-info-grid">
              <div className="vendor-detail">
                <label>Supplier Name:</label>
                <span>{selectedSupplier.name}</span>
              </div>
              <div className="vendor-detail">
                <label>Contact Person:</label>
                <span>{selectedSupplier.contactPerson}</span>
              </div>
              <div className="vendor-detail">
                <label>Phone:</label>
                <span>{selectedSupplier.phone}</span>
              </div>
              <div className="vendor-detail">
                <label>Email:</label>
                <span>{selectedSupplier.email}</span>
              </div>
              <div className="vendor-detail">
                <label>Payment Terms:</label>
                <span>{selectedSupplier.paymentTermDays || 30} days</span>
              </div>
              <div className="vendor-detail">
                <label>Status:</label>
                <span>{selectedSupplier.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Order Items */}
        <div className="form-section">
          <div className="form-section-title">
            <div className="title-with-action">
              <span>
                <Package size={20} />
                Order Items
              </span>
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={addItem}
              >
                <Plus size={16} />
                Add Item
              </button>
            </div>
          </div>
          
          {errors.items && (
            <div className="error-banner">
              <AlertTriangle size={16} />
              {errors.items}
            </div>
          )}
          
          <div className="items-table">
            <div className="items-header">
              <span>Material</span>
              <span>Quantity</span>
              <span>Unit</span>
              <span>Rate (OMR)</span>
              <span>Amount (OMR)</span>
              <span>Actions</span>
            </div>
            
            {formData.items.map((item, index) => {
              const selectedMaterial = materials.find(m => m.id === item.materialId)
              const hasContractRate = selectedSupplier?.contractDetails?.rates?.[item.materialId]
              const isDraft = formData.status === 'draft'

              return (
                <div key={index} className={`item-row ${errors[`item_${index}`] ? 'error' : ''}`}>
                  <div className="item-field">
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

                  <div className="item-field">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.001"
                      required={!isDraft}
                    />
                  </div>

                  <div className="item-field">
                    <span className="unit-display">
                      {selectedMaterial ? selectedMaterial.unit : '-'}
                    </span>
                  </div>

                  <div className="item-field rate-field">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      placeholder="0.000"
                      min="0"
                      step="0.001"
                      required={!isDraft}
                    />
                    {hasContractRate && (
                      <div className="contract-rate-indicator">
                        <span className="contract-badge">Contract Rate</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="item-field">
                    <span className="amount-display">
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  
                  <div className="item-field">
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 size={14} />
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
          
          <div className="totals-section">
            <div className="totals-row">
              <label>Subtotal:</label>
              <span>{formatCurrency(formData.subtotal)}</span>
            </div>
            <div className="totals-row">
              <label>
                Tax ({formData.taxPercent}%):
                <span style={{
                  padding: '0.5rem 0.75rem',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '0.375rem',
                  fontSize: '0.875rem',
                  color: '#6b7280',
                  marginLeft: '0.5rem'
                }}>
                  From system settings
                </span>
              </label>
              <span>{formatCurrency(formData.taxAmount)}</span>
            </div>
            <div className="totals-row total-row">
              <label>Total Amount:</label>
              <span>{formatCurrency(formData.totalAmount)}</span>
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
            <FileUpload
              mode="multiple"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5242880}
              maxFiles={10}
              onUpload={async (files) => {
                const result = await uploadService.uploadFiles('purchase-orders', initialData.id, files);
                if (result.success) {
                  // Refresh the order data to get updated attachments
                  const updated = await purchaseOrderService.getById(initialData.id);
                  if (updated.success) {
                    setFormData(prev => ({
                      ...prev,
                      attachments: updated.data.attachments
                    }));
                  }
                  alert('Files uploaded successfully');
                } else {
                  alert('Failed to upload files: ' + result.error);
                }
              }}
              onDelete={async (filename) => {
                const result = await uploadService.deleteFile('purchase-orders', initialData.id, filename);
                if (result.success) {
                  // Refresh the order data to get updated attachments
                  const updated = await purchaseOrderService.getById(initialData.id);
                  if (updated.success) {
                    setFormData(prev => ({
                      ...prev,
                      attachments: updated.data.attachments
                    }));
                  }
                  alert('File deleted successfully');
                } else {
                  alert('Failed to delete file: ' + result.error);
                }
              }}
              existingFiles={formData.attachments || []}
            />
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