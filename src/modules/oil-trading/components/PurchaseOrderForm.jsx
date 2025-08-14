import React, { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { Plus, Trash2, Save, Truck, FileText, Calculator, Package, AlertTriangle } from 'lucide-react'
import './PurchaseOrderForm.css'

const PurchaseOrderForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  vendors = [], 
  materials = [], 
  initialData = null, 
  title = "Create Purchase Order",
  isEdit = false 
}) => {
  const { getInputDate, formatCurrency } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    vendorId: '',
    orderDate: getInputDate(),
    expectedDeliveryDate: '',
    paymentTerms: 30,
    items: [{ materialId: '', quantity: '', rate: '', amount: 0 }],
    notes: '',
    subtotal: 0,
    taxPercent: 5,
    taxAmount: 0,
    totalAmount: 0,
    status: 'draft'
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Editing existing order
        setFormData({ ...initialData })
      } else {
        // Creating new order - generate order number
        const orderNum = `PO-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`
        setFormData(prev => ({ 
          ...prev, 
          orderNumber: orderNum,
          orderDate: getInputDate()
        }))
      }
    }
  }, [isOpen, initialData, getInputDate])

  useEffect(() => {
    calculateTotals()
  }, [formData.items, formData.taxPercent])

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

  const handleVendorChange = (vendorId) => {
    const vendor = vendors.find(v => v.id === vendorId)
    setFormData(prev => ({
      ...prev,
      vendorId,
      paymentTerms: vendor?.paymentTerms || 30
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

    // Auto-populate rate from vendor contract if available
    if (field === 'materialId') {
      const vendor = vendors.find(v => v.id === formData.vendorId)
      if (vendor?.contractDetails?.rates?.[value]) {
        const contractRate = vendor.contractDetails.rates[value]
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

    if (!formData.vendorId) {
      newErrors.vendorId = 'Please select a vendor'
    }

    if (!formData.orderDate) {
      newErrors.orderDate = 'Order date is required'
    }

    if (!formData.expectedDeliveryDate) {
      newErrors.expectedDeliveryDate = 'Expected delivery date is required'
    }

    if (new Date(formData.expectedDeliveryDate) <= new Date(formData.orderDate)) {
      newErrors.expectedDeliveryDate = 'Delivery date must be after order date'
    }

    const hasValidItems = formData.items.some(item => 
      item.materialId && item.quantity && item.rate
    )

    if (!hasValidItems) {
      newErrors.items = 'Please add at least one valid item'
    }

    // Validate individual items
    formData.items.forEach((item, index) => {
      if (item.materialId && (!item.quantity || !item.rate)) {
        newErrors[`item_${index}`] = 'Please fill in quantity and rate'
      }
    })

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
      // Add vendor name for display purposes
      const vendor = vendors.find(v => v.id === formData.vendorId)
      const orderData = {
        ...formData,
        vendorName: vendor?.name || '',
        // Filter out empty items
        items: formData.items.filter(item => item.materialId && item.quantity && item.rate)
      }

      await onSave(orderData)
    } catch (error) {
      console.error('Error saving purchase order:', error)
      alert('Failed to save purchase order. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const selectedVendor = vendors.find(v => v.id === formData.vendorId)

  return (
    <Modal 
      title={title} 
      onClose={onClose}
      className="modal-xxl"
    >
      <form className="purchase-order-form" onSubmit={handleSubmit}>
        {/* Order Header */}
        <div className="form-section">
          <div className="form-section-title">
            <FileText size={20} />
            Order Information
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Order Number *</label>
              <input
                type="text"
                value={formData.orderNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                required
                readOnly={isEdit}
                className={isEdit ? 'readonly' : ''}
              />
            </div>

            <div className="form-group">
              <label>Vendor *</label>
              <select
                value={formData.vendorId}
                onChange={(e) => handleVendorChange(e.target.value)}
                required
                className={errors.vendorId ? 'error' : ''}
              >
                <option value="">Select Vendor...</option>
                {vendors.map(vendor => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name} ({vendor.type.replace('_', ' ').toUpperCase()})
                  </option>
                ))}
              </select>
              {errors.vendorId && <span className="error-message">{errors.vendorId}</span>}
            </div>

            <div className="form-group">
              <label>Order Date *</label>
              <input
                type="date"
                value={formData.orderDate}
                onChange={(e) => setFormData(prev => ({ ...prev, orderDate: e.target.value }))}
                required
                className={errors.orderDate ? 'error' : ''}
              />
              {errors.orderDate && <span className="error-message">{errors.orderDate}</span>}
            </div>

            <div className="form-group">
              <label>Expected Delivery Date *</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expectedDeliveryDate: e.target.value }))}
                min={formData.orderDate}
                required
                className={errors.expectedDeliveryDate ? 'error' : ''}
              />
              {errors.expectedDeliveryDate && <span className="error-message">{errors.expectedDeliveryDate}</span>}
            </div>

            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                min="1"
                max="365"
              />
            </div>

            <div className="form-group">
              <label>Order Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="pending">Pending Approval</option>
                <option value="approved">Approved</option>
                <option value="delivered">Delivered</option>
                <option value="received">Received</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>

        {/* Vendor Information */}
        {selectedVendor && (
          <div className="form-section">
            <div className="form-section-title">
              <Truck size={20} />
              Vendor Information
            </div>
            
            <div className="vendor-info-grid">
              <div className="vendor-detail">
                <label>Vendor Name:</label>
                <span>{selectedVendor.name}</span>
              </div>
              <div className="vendor-detail">
                <label>Contact Person:</label>
                <span>{selectedVendor.contactPerson}</span>
              </div>
              <div className="vendor-detail">
                <label>Phone:</label>
                <span>{selectedVendor.contact?.phone}</span>
              </div>
              <div className="vendor-detail">
                <label>Email:</label>
                <span>{selectedVendor.contact?.email}</span>
              </div>
              <div className="vendor-detail">
                <label>Payment Terms:</label>
                <span>{selectedVendor.paymentTerms} days</span>
              </div>
              <div className="vendor-detail">
                <label>Credit Limit:</label>
                <span>{formatCurrency(selectedVendor.creditLimit)}</span>
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
              const hasContractRate = selectedVendor?.contractDetails?.rates?.[item.materialId]
              
              return (
                <div key={index} className={`item-row ${errors[`item_${index}`] ? 'error' : ''}`}>
                  <div className="item-field">
                    <select
                      value={item.materialId}
                      onChange={(e) => handleItemChange(index, 'materialId', e.target.value)}
                      required
                    >
                      <option value="">Select material...</option>
                      {materials.map(material => (
                        <option key={material.id} value={material.id}>
                          {material.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="item-field">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.001"
                      required
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
                      required
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
                Tax:
                <input
                  type="number"
                  value={formData.taxPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxPercent: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                  className="tax-input"
                />
                %
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
          <div className="form-group full-width">
            <label>Order Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any special notes or instructions for this order..."
              rows="3"
            />
          </div>
        </div>

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