import React, { useState, useEffect } from 'react'
import Modal from '../../../components/ui/Modal'
import FileUpload from '../../../components/ui/FileUpload'
import DatePicker from '../../../components/ui/DatePicker'
import Autocomplete from '../../../components/ui/Autocomplete'
import Input, { Textarea } from '../../../components/ui/Input'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { useTourBroadcast } from '../../../context/TourContext'
import systemSettingsService from '../../../services/systemSettingsService'
import inventoryService from '../../../services/inventoryService'
import customerService from '../../../services/customerService'
import materialService from '../../../services/materialService'
import branchService from '../../../services/branchService'
import uploadService from '../../../services/uploadService'
import salesOrderService from '../../../services/salesOrderService'
import { Plus, Trash2, AlertTriangle, Check, User, FileText, Lock, Unlock, Shield, ChevronDown, ChevronUp, Package, Building } from 'lucide-react'
import './SalesOrderForm.css'

const SalesOrderForm = ({ isOpen, onClose, onSave, selectedCustomer = null, editingOrder = null }) => {
  const { getInputDate } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    orderNumber: '',
    customer: selectedCustomer || null,
    branch_id: '',
    orderDate: getInputDate(),
    deliveryDate: '',
    items: [{ materialId: '', quantity: '', rate: '', amount: 0 }],
    notes: '',
    specialInstructions: '',
    totalAmount: 0,
    discountPercent: 0,
    discountAmount: 0,
    netAmount: 0,
    status: 'draft' // Order status: draft, confirmed, delivered, cancelled
  })

  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  const [branches, setBranches] = useState([])
  const [contractRates, setContractRates] = useState({})
  const [warnings, setWarnings] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [overrideRequests, setOverrideRequests] = useState({})
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [currentOverride, setCurrentOverride] = useState(null)
  const [contractTermsExpanded, setContractTermsExpanded] = useState(false)
  const [stockInfo, setStockInfo] = useState({}) // Track current stock levels
  const [defaultVatRate, setDefaultVatRate] = useState(5) // VAT rate from database

  // Tour context broadcast
  const { broadcast, isTourActive } = useTourBroadcast()

  useEffect(() => {
    // Load customers and materials data first
    loadCustomersAndMaterials()

    // Load VAT rate from database
    loadVatRate()

    // Load active branches
    loadBranches()
  }, [isOpen])

  const loadVatRate = async () => {
    try {
      const vatRate = await systemSettingsService.getVatRate()
      setDefaultVatRate(vatRate)
    } catch (error) {
      console.error('Error loading VAT rate:', error)
      // Keep default 5% if loading fails
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

  // Separate useEffect for populating edit data after customers and materials are loaded
  useEffect(() => {
    if (isOpen && editingOrder && customers.length > 0 && materials.length > 0) {
      // Pre-fill form with existing order data
      // Handle customer - resolve to customer object from customers array
      let customerObj = editingOrder.customer
      if (typeof customerObj === 'string') {
        // Try to find by name (legacy support)
        customerObj = customers.find(c => c.name === editingOrder.customer) || null
      } else if (typeof customerObj === 'object' && customerObj !== null && customerObj.id) {
        // If it's an object, ensure it's the same reference from customers array for dropdown matching
        customerObj = customers.find(c => c.id === customerObj.id) || customerObj
      } else if (editingOrder.customerId) {
        // If only customerId is provided, find the customer
        customerObj = customers.find(c => c.id === editingOrder.customerId) || null
      }
        
        // Transform items data to match form structure
        // Backend returns 'items' array with unitPrice/totalPrice, form uses rate/amount
        const transformedItems = editingOrder.items ? editingOrder.items.map(item => {
          // Find material by name if materialId is not present
          let materialId = item.materialId || ''
          if (!materialId && item.name && materials.length > 0) {
            const material = materials.find(m => m.name === item.name)
            materialId = material ? material.id : ''
          }

          return {
            materialId: materialId,
            quantity: item.quantity || '',
            rate: item.unitPrice || item.rate || '',
            amount: item.totalPrice || item.amount || 0
          }
        }) : [{ materialId: '', quantity: '', rate: '', amount: 0 }]

        // Calculate delivery date if not provided (default to 7 days from order date)
        let deliveryDate = editingOrder.deliveryDate || editingOrder.expectedDeliveryDate || ''
        if (!deliveryDate && (editingOrder.date || editingOrder.orderDate)) {
          const orderDate = new Date(editingOrder.date || editingOrder.orderDate)
          orderDate.setDate(orderDate.getDate() + 7) // Add 7 days
          deliveryDate = orderDate.toISOString().split('T')[0]
        }

        setFormData({
          orderNumber: editingOrder.orderNumber || editingOrder.id || '',
          customer: customerObj,
          branch_id: editingOrder.branch_id || '',
          orderDate: (editingOrder.orderDate || editingOrder.date) ? new Date(editingOrder.orderDate || editingOrder.date).toISOString().split('T')[0] : getInputDate(),
          deliveryDate: deliveryDate,
          items: transformedItems,
          notes: editingOrder.notes || 'Order imported from existing data',
          specialInstructions: editingOrder.specialInstructions || '',
          totalAmount: editingOrder.subtotal || editingOrder.total || 0,
          discountPercent: editingOrder.discountPercent || 0,
          discountAmount: editingOrder.discountAmount || 0,
          vatRate: editingOrder.vatRate || defaultVatRate,
          vatAmount: editingOrder.vatAmount || editingOrder.taxAmount || 0,
          netAmount: editingOrder.totalAmount || editingOrder.total || 0,
          status: editingOrder.status || 'draft'
        })
    }
  }, [isOpen, editingOrder, customers, materials])

  // Generate order number for new orders
  useEffect(() => {
    if (isOpen && !editingOrder && !formData.orderNumber) {
      const orderNum = `SO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
      setFormData(prev => ({ ...prev, orderNumber: orderNum }))
    }
  }, [isOpen, editingOrder, formData.orderNumber])

  // Reset form when modal closes to ensure clean state
  useEffect(() => {
    if (!isOpen) {
      setFormData({
        orderNumber: '',
        customer: null,
        branch_id: '',
        orderDate: getInputDate(),
        deliveryDate: '',
        items: [{ materialId: '', quantity: '', rate: '', amount: 0 }],
        notes: '',
        specialInstructions: '',
        totalAmount: 0,
        discountPercent: 0,
        discountAmount: 0,
        netAmount: 0,
        status: 'draft'
      })
      setWarnings([])
      setOverrideRequests({})
    }
  }, [isOpen])

  useEffect(() => {
    // Load contract rates when customer changes
    if (formData.customer) {
      loadContractRates(formData.customer.id)
    }
  }, [formData.customer])

  useEffect(() => {
    // Recalculate totals when items change
    calculateTotals()
  }, [formData.items, formData.discountPercent])

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
          hasCustomer: !!formData.customer,
          hasBranch: !!formData.branch_id,
          hasOrderDate: !!formData.orderDate,
          hasDeliveryDate: !!formData.deliveryDate,
          itemCount: validItemCount,
          completeItemCount: completeItemCount,
          hasContractRates: Object.keys(contractRates).length > 0,
          hasNotes: !!formData.notes,
          isDraft: formData.status === 'draft',
          isEdit: !!editingOrder
        }
      })
    }
  }, [formData, contractRates, isTourActive, isOpen, editingOrder, broadcast])

  const loadCustomersAndMaterials = async () => {
    try {
      // Load customers using API service
      const customersResponse = await customerService.getAll()
      const companyCustomers = customersResponse.success ? customersResponse.data : []
      setCustomers(companyCustomers)

      // Load materials using API service
      const materialsResponse = await materialService.getAll()
      const companyMaterials = materialsResponse.success ? materialsResponse.data : []
      setMaterials(companyMaterials)

      // Load current stock information
      await loadStockInfo(companyMaterials)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const loadStockInfo = async (materials) => {
    try {
      const companyId = 'alramrami' // TODO: Get from auth context
      const stockData = {}
      
      for (const material of materials) {
        const stock = await inventoryService.getCurrentStock(material.id)
        stockData[material.id] = {
          currentStock: stock?.currentStock || 0,
          unit: stock?.unit || material.unit,
          isLowStock: stock ? stock.currentStock <= stock.reorderLevel : false,
          reorderLevel: stock?.reorderLevel || 0
        }
      }
      
      setStockInfo(stockData)
    } catch (error) {
      console.error('Error loading stock information:', error)
    }
  }

  const loadContractRates = (customerId) => {
    const customer = customers.find(c => c.id === customerId)
    if (customer && customer.contractDetails && customer.contractDetails.rates) {
      setContractRates(customer.contractDetails.rates)
      
      // Check contract validity
      const contract = customer.contractDetails
      const today = new Date()
      const endDate = new Date(contract.endDate)
      
      if (endDate < today) {
        setWarnings(prev => [...prev, {
          type: 'contract_expired',
          message: `Customer contract expired on ${contract.endDate}. Standard rates will apply.`
        }])
      }
    } else {
      setContractRates({})
    }
  }

  const isContractActive = (materialId) => {
    const contractInfo = contractRates[materialId]
    if (!contractInfo) return false
    
    // Check if contract has individual expiry dates
    if (typeof contractInfo === 'object' && contractInfo.endDate) {
      const today = new Date()
      const endDate = new Date(contractInfo.endDate)
      return endDate >= today && contractInfo.status === 'active'
    }
    
    return true // Legacy contracts without expiry are considered active
  }

  const getEffectiveRate = (materialId) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return 0

    // Check for contract rate first, but only if contract is active
    if (contractRates[materialId] && isContractActive(materialId)) {
      const contractInfo = contractRates[materialId]
      
      // Handle different contract types
      if (typeof contractInfo === 'object') {
        // Enhanced contract with metadata
        if (contractInfo.type === 'fixed_rate') {
          // Fixed negotiated rate - only use if contract is active
          return contractInfo.contractRate
        } else if (contractInfo.type === 'discount_percentage') {
          // Discount percentage off current market price
          const currentMarketPrice = material.standardPrice || 0
          const discountAmount = (currentMarketPrice * contractInfo.discountPercentage) / 100
          return Math.max(0, currentMarketPrice - discountAmount)
        } else if (contractInfo.type === 'minimum_price_guarantee') {
          // Customer gets lower of market price or contract price
          return Math.min(material.standardPrice || 0, contractInfo.contractRate)
        }
      } else {
        // Legacy: simple number (fixed rate)
        return contractInfo
      }
    }

    // Fall back to standard rate (no contract or expired contract)
    return material.standardPrice || 0
  }

  const handleCustomerChange = (customerId) => {
    // Use type-coercion comparison to handle both string and number IDs
    const customer = customers.find(c => c.id == customerId)
    setFormData(prev => ({ ...prev, customer }))
    setWarnings([]) // Clear previous warnings
  }

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items]
    newItems[index][field] = value

    // Auto-calculate rate and amount when material changes
    if (field === 'materialId') {
      const effectiveRate = getEffectiveRate(value)
      newItems[index].rate = effectiveRate
      newItems[index].amount = newItems[index].quantity * effectiveRate

      // Check if using contract rate vs standard rate and show appropriate message
      const material = materials.find(m => m.id === value)
      if (material && contractRates[value]) {
        const contractInfo = contractRates[value]
        const effectiveRate = getEffectiveRate(value)
        const marketRate = material.standardPrice || 0
        
        // Check if material contract is active or expired
        const isActive = isContractActive(value)
        let warningMessage = ''
        let warningType = 'contract_rate_applied'
        
        if (isActive) {
          // Active contract - rate applied
          const difference = marketRate - effectiveRate
          warningMessage = `Contract rate applied for ${material.name}`
          
          if (difference < 0) {
            warningType = 'contract_rate_above_market'
          }
        } else {
          // Expired contract - using standard rate
          warningMessage = `Contract EXPIRED for ${material.name} - using standard rate`
          warningType = 'contract_expired'
        }
        
        setWarnings(prev => [...prev.filter(w => w.materialId !== value), {
          type: warningType,
          materialId: value,
          message: warningMessage
        }])
      }
    }

    // Handle rate changes with contract enforcement
    if (field === 'rate') {
      const materialId = newItems[index].materialId
      const contractInfo = contractRates[materialId]
      const isActive = isContractActive(materialId)
      const newRate = parseFloat(value) || 0
      const contractRate = getEffectiveRate(materialId)
      
      // Check if trying to change active contracted rate
      if (contractInfo && isActive && Math.abs(newRate - contractRate) > 0.001) {
        // Don't allow direct rate change for active contracts - trigger override request
        setCurrentOverride({
          itemIndex: index,
          materialId,
          contractRate,
          requestedRate: newRate,
          material: materials.find(m => m.id === materialId)
        })
        setShowOverrideModal(true)
        return // Don't update the rate yet
      } else {
        // Allow rate change for expired contracts or non-contracted materials
        newItems[index].rate = newRate
        const quantity = parseFloat(newItems[index].quantity) || 0
        newItems[index].amount = quantity * newRate
      }
    }

    // Recalculate amount when quantity changes
    if (field === 'quantity') {
      const quantity = parseFloat(value) || 0
      const rate = parseFloat(newItems[index].rate) || 0
      newItems[index].amount = quantity * rate
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

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + (item.amount || 0), 0)
    const discountAmount = (subtotal * (formData.discountPercent || 0)) / 100
    const subtotalAfterDiscount = subtotal - discountAmount

    // Determine VAT rate based on customer taxable status
    const isTaxable = formData.customer?.is_taxable !== false // Default to taxable if not specified
    const vatRate = isTaxable ? defaultVatRate : 0
    const vatAmount = (subtotalAfterDiscount * vatRate) / 100

    const netAmount = subtotalAfterDiscount + vatAmount

    setFormData(prev => ({
      ...prev,
      totalAmount: subtotal,
      discountAmount,
      vatRate,
      vatAmount,
      netAmount
    }))
  }

  const handleOverrideRequest = (reason, approverPassword) => {
    if (!currentOverride) return

    // Simple password check for demo (in real app, this would be proper authentication)
    if (approverPassword !== 'manager123') {
      alert('Invalid approver credentials')
      return
    }

    // Apply the override
    const newItems = [...formData.items]
    newItems[currentOverride.itemIndex].rate = currentOverride.requestedRate
    newItems[currentOverride.itemIndex].amount = 
      (parseFloat(newItems[currentOverride.itemIndex].quantity) || 0) * currentOverride.requestedRate

    // Track the override
    setOverrideRequests(prev => ({
      ...prev,
      [currentOverride.materialId]: {
        originalRate: currentOverride.contractRate,
        overrideRate: currentOverride.requestedRate,
        reason: reason,
        approvedBy: 'Manager', // In real app, get from authenticated user
        approvedAt: new Date().toISOString()
      }
    }))

    // Add warning about override
    setWarnings(prev => [...prev.filter(w => w.materialId !== currentOverride.materialId), {
      type: 'rate_override_applied',
      materialId: currentOverride.materialId,
      message: `Rate overridden: OMR ${currentOverride.requestedRate.toFixed(3)} (was OMR ${currentOverride.contractRate.toFixed(3)}) - ${reason}`
    }])

    setFormData(prev => ({ ...prev, items: newItems }))
    setShowOverrideModal(false)
    setCurrentOverride(null)
  }

  const isRateLocked = (materialId) => {
    return contractRates[materialId] && isContractActive(materialId) && !overrideRequests[materialId]
  }

  const getDiscountInfo = (materialId) => {
    const contractInfo = contractRates[materialId]
    if (contractInfo && typeof contractInfo === 'object' && contractInfo.type === 'discount_percentage') {
      return {
        hasDiscount: true,
        percentage: contractInfo.discountPercentage,
        description: contractInfo.description
      }
    }
    return { hasDiscount: false }
  }

  const getDetailedRateInfo = (materialId, rateInfo) => {
    const material = materials.find(m => m.id === materialId)
    if (!material) return ''
    
    const effectiveRate = getEffectiveRate(materialId)
    const marketRate = material.standardPrice || 0
    const isActive = isContractActive(materialId)
    
    // If contract is expired, show different message
    if (!isActive) {
      if (typeof rateInfo === 'object' && rateInfo.endDate) {
        return `Contract EXPIRED on ${rateInfo.endDate}. Using standard market rate: OMR ${marketRate.toFixed(3)}. Renewal pending.`
      }
      return `Contract expired - using standard market rate: OMR ${marketRate.toFixed(3)}`
    }
    
    // Active contract - show savings information
    if (typeof rateInfo === 'object') {
      if (rateInfo.type === 'fixed_rate') {
        const difference = marketRate - effectiveRate
        if (difference > 0) {
          const savings = ((difference / marketRate) * 100).toFixed(1)
          return `Fixed contract rate: OMR ${effectiveRate.toFixed(3)} (${savings}% savings vs market rate OMR ${marketRate.toFixed(3)}) - Active until ${rateInfo.endDate}`
        } else if (difference < 0) {
          const premium = ((Math.abs(difference) / marketRate) * 100).toFixed(1)
          return `Fixed contract rate: OMR ${effectiveRate.toFixed(3)} (${premium}% above current market rate OMR ${marketRate.toFixed(3)}) - Active until ${rateInfo.endDate}`
        } else {
          return `Fixed contract rate: OMR ${effectiveRate.toFixed(3)} (matches current market rate) - Active until ${rateInfo.endDate}`
        }
      } else if (rateInfo.type === 'discount_percentage') {
        return `Contract discount: ${rateInfo.discountPercentage}% off market rate (OMR ${effectiveRate.toFixed(3)} vs OMR ${marketRate.toFixed(3)}) - Active until ${rateInfo.endDate}`
      } else if (rateInfo.type === 'minimum_price_guarantee') {
        if (effectiveRate === rateInfo.contractRate) {
          return `Price guarantee: Using contract rate OMR ${effectiveRate.toFixed(3)} (market: OMR ${marketRate.toFixed(3)}) - Active until ${rateInfo.endDate}`
        } else {
          return `Price guarantee: Using market rate OMR ${effectiveRate.toFixed(3)} (contract allows up to OMR ${rateInfo.contractRate.toFixed(3)}) - Active until ${rateInfo.endDate}`
        }
      }
    } else {
      // Legacy contract handling
      const difference = marketRate - effectiveRate
      if (difference > 0) {
        const savings = ((difference / marketRate) * 100).toFixed(1)
        return `Fixed contract rate: OMR ${effectiveRate.toFixed(3)} (${savings}% savings vs market rate OMR ${marketRate.toFixed(3)})`
      }
    }
    
    return `Contract rate: OMR ${effectiveRate.toFixed(3)}`
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const isDraft = formData.status === 'draft'

      // Validate required fields (relaxed for drafts)
      if (!formData.customer) {
        throw new Error('Please select a customer')
      }

      // Only require items for non-draft statuses
      if (!isDraft && formData.items.some(item => !item.materialId || !item.quantity)) {
        throw new Error('Please fill in all item details')
      }

      // For drafts: allow items with at least materialId (partial items OK)
      // For confirmed: require all fields (materialId, quantity, rate)
      const filteredItems = isDraft
        ? formData.items.filter(item => item.materialId) // Only need material for drafts
        : formData.items.filter(item => item.materialId && item.quantity && item.rate) // All fields for confirmed

      console.log('📤 Submitting SO Data:')
      console.log('- Status:', formData.status)
      console.log('- isDraft:', isDraft)
      console.log('- Items before filter:', formData.items)
      console.log('- Items after filter:', filteredItems)

      // Prepare order data
      const orderData = {
        ...formData,
        items: filteredItems,  // ✅ Use filtered items
        id: `order_${Date.now()}`,
        status: formData.status, // Use status from form instead of hardcoded 'pending'
        createdAt: new Date().toISOString(),
        createdBy: 'current_user', // Replace with actual user
        contractInfo: formData.customer.contractDetails ? {
          contractId: formData.customer.contractDetails.contractId,
          ratesApplied: filteredItems.map(item => ({  // ✅ Use filtered items
            materialId: item.materialId,
            contractRate: contractRates[item.materialId] || null,
            standardRate: materials.find(m => m.id === item.materialId)?.standardPrice || 0,
            appliedRate: item.rate
          }))
        } : null
      }

      console.log('- Final orderData:', orderData)

      await onSave(orderData)
      onClose()
    } catch (error) {
      console.error('Error creating sales order:', error)
      alert(error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <Modal
      isOpen={isOpen}
      title={editingOrder ? 'Edit Sales Order' : 'Create Sales Order'}
      onClose={onClose}
      className="modal-xxl"
      closeOnOverlayClick={false}
      tourId="SalesOrderForm"
    >
      <form className="sales-order-form" onSubmit={handleSubmit}>
        {/* Draft Mode Info */}
        {formData.status === 'draft' && (
          <div className="info-banner" style={{ background: '#e3f2fd', padding: '12px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#1976d2' }} />
            <span style={{ color: '#1565c0' }}>
              <strong>Draft Mode:</strong> You can save with minimal information (Customer only). Additional details can be added later.
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
            <div className="form-group">
              <Input
                label="Order Number"
                type="text"
                value={formData.orderNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, orderNumber: e.target.value }))}
                required
                readOnly
              />
            </div>
            <div className="form-group">
              <DatePicker
                label="Order Date"
                value={formData.orderDate ? new Date(formData.orderDate) : null}
                onChange={(date) => setFormData(prev => ({ ...prev, orderDate: date ? date.toISOString().split('T')[0] : '' }))}
                required
              />
            </div>
            <div className="form-group">
              <DatePicker
                label="Expected Delivery Date"
                value={formData.deliveryDate ? new Date(formData.deliveryDate) : null}
                onChange={(date) => setFormData(prev => ({ ...prev, deliveryDate: date ? date.toISOString().split('T')[0] : '' }))}
                minDate={formData.orderDate ? new Date(formData.orderDate) : null}
              />
            </div>
            <div className="form-group">
              <Autocomplete
                label="Order Status"
                options={[
                  { value: 'draft', label: 'Draft' },
                  { value: 'confirmed', label: 'Confirmed' },
                  { value: 'delivered', label: 'Delivered' },
                  { value: 'cancelled', label: 'Cancelled' }
                ]}
                value={formData.status}
                onChange={(value) => setFormData(prev => ({ ...prev, status: value }))}
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="form-section">
          <div className="form-section-title">
            <User size={20} />
            Customer Details
            {formData.customer && formData.customer.contractDetails && (
              <span className="contract-indicator">
                <Check size={16} />
                Contract Customer
              </span>
            )}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <Autocomplete
                label="Select Customer"
                options={customers}
                value={formData.customer?.id || null}
                onChange={(customerId) => handleCustomerChange(customerId)}
                getOptionLabel={(customer) => customer ? `${customer.name} (${customer.type.replace('_', ' ').toUpperCase()})` : ''}
                getOptionValue={(customer) => customer?.id || ''}
                placeholder="Choose a customer..."
                searchable
                required
                loading={loading && customers.length === 0}
                data-tour="so-customer-select"
              />
            </div>

            <div className="form-group">
              <Autocomplete
                label={`Branch ${formData.status !== 'draft' ? '*' : ''}`}
                options={branches}
                value={formData.branch_id || null}
                onChange={(branchId) => setFormData(prev => ({ ...prev, branch_id: branchId }))}
                getOptionLabel={(branch) => branch ? `${branch.name} (${branch.code})` : ''}
                getOptionValue={(branch) => branch?.id || ''}
                placeholder="Select Branch..."
                searchable
                required={formData.status !== 'draft'}
                disabled={loadingBranches}
                loading={loadingBranches}
                helperText={loadingBranches ? 'Loading branches...' : null}
              />
            </div>

            {formData.customer && (
              <>
                <div className="form-group">
                  <Input
                    label="Contact Person"
                    type="text"
                    value={formData.customer.contactPerson || 'N/A'}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <Input
                    label="Phone"
                    type="text"
                    value={formData.customer.contact?.phone || 'N/A'}
                    readOnly
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contract Terms Display - Collapsible */}
        {formData.customer && formData.customer.contractDetails && (
          <div className="form-section contract-terms-display">
            <div 
              className="form-section-title clickable" 
              onClick={() => setContractTermsExpanded(!contractTermsExpanded)}
            >
              <Check size={20} />
              Active Contract Terms
              <div className="contract-header-right">
                <span className="contract-status-badge active">
                  Valid until {formData.customer.contractDetails.endDate}
                </span>
                {contractTermsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>
            
            {contractTermsExpanded && (
              <div className="contract-summary">
                <div className="contract-info-grid">
                  <div className="contract-detail">
                    <label>Contract ID:</label>
                    <span>{formData.customer.contractDetails.contractId}</span>
                  </div>
                  <div className="contract-detail">
                    <label>Status:</label>
                    <span className={`status-badge ${formData.customer.contractDetails.status}`}>
                      {formData.customer.contractDetails.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {formData.customer.contractDetails.specialTerms && (
                  <div className="special-terms">
                    <label>Special Terms:</label>
                    <p>{formData.customer.contractDetails.specialTerms}</p>
                  </div>
                )}
                
                <div className="material-rates-summary">
                  <h4>Contract Rates:</h4>
                  <div className="rates-compact">
                    {Object.entries(formData.customer.contractDetails.rates || {}).map(([materialId, rateInfo]) => {
                      const material = materials.find(m => m.id === materialId)
                      if (!material) return null
                      
                      const detailedInfo = getDetailedRateInfo(materialId, rateInfo)
                      
                      const isActive = isContractActive(materialId)
                      const statusClass = isActive ? 'active' : 'expired'
                      
                      return (
                        <div 
                          key={materialId} 
                          className={`rate-compact-item ${statusClass}`}
                          title={detailedInfo}
                        >
                          <span className="material-name">{material.name}</span>
                          <div className="rate-info">
                            {typeof rateInfo === 'object' ? (
                              <span className={`rate-badge ${rateInfo.type}`}>
                                {rateInfo.type === 'fixed_rate' && `OMR ${rateInfo.contractRate.toFixed(3)}`}
                                {rateInfo.type === 'discount_percentage' && `${rateInfo.discountPercentage}% OFF`}
                                {rateInfo.type === 'minimum_price_guarantee' && `MAX OMR ${rateInfo.contractRate.toFixed(3)}`}
                              </span>
                            ) : (
                              <span className="rate-badge fixed_rate">OMR {rateInfo.toFixed(3)}</span>
                            )}
                            <span className={`status-indicator ${statusClass}`}>
                              {isActive ? 'ACTIVE' : 'EXPIRED'}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {warnings.length > 0 && (
          <div className="warnings-section">
            {warnings.map((warning, index) => (
              <div key={index} className={`warning-item ${warning.type}`}>
                <AlertTriangle size={16} />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Order Items */}
        <div className="form-section" data-tour="so-items-section">
          <div className="form-section-title">
            <div className="title-with-action">
              <span>Order Items</span>
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
              const hasContractRate = contractRates[item.materialId]
              const rateLocked = isRateLocked(item.materialId)
              const discountInfo = getDiscountInfo(item.materialId)
              const isOverridden = overrideRequests[item.materialId]
              const isDraft = formData.status === 'draft'

              return (
                <div key={index} className="item-row">
                  <div className="item-field material-autocomplete-field">
                    <Autocomplete
                      options={materials}
                      value={item.materialId}
                      onChange={(materialId) => handleItemChange(index, 'materialId', materialId)}
                      getOptionLabel={(material) => {
                        if (!material) return ''
                        const stock = stockInfo[material.id]
                        const stockDisplay = stock ? `(Stock: ${stock.currentStock} ${stock.unit})` : '(Stock: N/A)'
                        return `${material.name} ${stockDisplay}`
                      }}
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
                    {/* Stock validation display */}
                    {item.materialId && stockInfo[item.materialId] && (
                      <div className="stock-info">
                        {parseFloat(item.quantity) > stockInfo[item.materialId].currentStock ? (
                          <div className="stock-warning">
                            <AlertTriangle size={14} />
                            <span>Insufficient stock! Available: {stockInfo[item.materialId].currentStock} {stockInfo[item.materialId].unit}</span>
                          </div>
                        ) : stockInfo[item.materialId].isLowStock ? (
                          <div className="stock-low">
                            <Package size={14} />
                            <span>Low stock: {stockInfo[item.materialId].currentStock} {stockInfo[item.materialId].unit}</span>
                          </div>
                        ) : (
                          <div className="stock-ok">
                            <Check size={14} />
                            <span>Available: {stockInfo[item.materialId].currentStock} {stockInfo[item.materialId].unit}</span>
                          </div>
                        )}
                      </div>
                    )}
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
                      readOnly={rateLocked}
                      className={rateLocked ? 'locked-rate' : ''}
                      title={rateLocked ? 'Contract rate is locked. Attempt to change will require manager approval.' : ''}
                    />
                    {hasContractRate && (
                      <div className="contract-indicators">
                        <span className={`contract-rate-indicator ${isOverridden ? 'overridden' : ''}`}>
                          {isOverridden ? 'Rate Overridden' : 'Contract Rate'}
                          {rateLocked && <span className="lock-icon">🔒</span>}
                        </span>
                        {discountInfo.hasDiscount && (
                          <span className="discount-indicator">
                            {discountInfo.percentage}% Discount Applied
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="item-field">
                    <span className="amount-display">
                      {item.amount.toFixed(3)}
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
          <div className="totals-section">
            <div className="totals-row">
              <label>Subtotal:</label>
              <span>OMR {formData.totalAmount.toFixed(3)}</span>
            </div>
            <div className="totals-row">
              <label>
                Discount:
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercent: parseFloat(e.target.value) || 0 }))}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                  className="discount-input"
                />
                %
              </label>
              <span>OMR {formData.discountAmount.toFixed(3)}</span>
            </div>
            {formData.vatAmount > 0 && (
              <div className="totals-row">
                <label>VAT ({formData.vatRate}%):</label>
                <span>OMR {formData.vatAmount.toFixed(3)}</span>
              </div>
            )}
            <div className="totals-row total-row">
              <label>Total Amount:</label>
              <span>OMR {formData.netAmount.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <div className="form-section-title">Additional Information</div>
          <div className="form-grid">
            <div className="form-group full-width">
              <Textarea
                label="Order Notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Any notes or comments about this order..."
                rows={3}
              />
            </div>
            <div className="form-group full-width">
              <Textarea
                label="Special Instructions"
                value={formData.specialInstructions}
                onChange={(e) => setFormData(prev => ({ ...prev, specialInstructions: e.target.value }))}
                placeholder="Special delivery or handling instructions..."
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Attachments - Only in edit mode */}
        {editingOrder?.id && (
          <div className="form-section">
            <div className="form-section-title">Attachments</div>
            <FileUpload
              mode="multiple"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5242880}
              maxFiles={10}
              onUpload={async (files) => {
                const result = await uploadService.uploadFiles('sales-orders', editingOrder.id, files);
                if (result.success) {
                  // Refresh the order data to get updated attachments
                  const updated = await salesOrderService.getById(editingOrder.id);
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
                const result = await uploadService.deleteFile('sales-orders', editingOrder.id, filename);
                if (result.success) {
                  // Refresh the order data to get updated attachments
                  const updated = await salesOrderService.getById(editingOrder.id);
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
            data-tour="so-submit-button"
          >
            {loading ? (editingOrder ? 'Updating Order...' : 'Creating Order...') : (editingOrder ? 'Update Sales Order' : 'Create Sales Order')}
          </button>
        </div>
      </form>

      {/* Rate Override Modal */}
      {showOverrideModal && currentOverride && (
        <div className="override-modal-backdrop">
          <div className="override-modal">
            <div className="override-modal-header">
              <div className="override-icon">
                <Shield size={24} />
              </div>
              <h3>Rate Override Required</h3>
              <p>Manager approval needed to change contracted rate</p>
            </div>
            
            <div className="override-details">
              <div className="override-item">
                <label>Material:</label>
                <span>{currentOverride.material?.name}</span>
              </div>
              <div className="override-item">
                <label>Contract Rate:</label>
                <span className="contract-rate">OMR {currentOverride.contractRate.toFixed(3)}</span>
              </div>
              <div className="override-item">
                <label>Requested Rate:</label>
                <span className="requested-rate">OMR {currentOverride.requestedRate.toFixed(3)}</span>
              </div>
              <div className="override-item">
                <label>Difference:</label>
                <span className={currentOverride.requestedRate > currentOverride.contractRate ? 'increase' : 'decrease'}>
                  {currentOverride.requestedRate > currentOverride.contractRate ? '+' : ''}
                  OMR {(currentOverride.requestedRate - currentOverride.contractRate).toFixed(3)}
                </span>
              </div>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault()
              const formData = new FormData(e.target)
              handleOverrideRequest(formData.get('reason'), formData.get('password'))
            }}>
              <div className="override-form">
                <div className="form-group">
                  <Textarea
                    label="Reason for Override"
                    name="reason"
                    placeholder="Please provide justification for rate change..."
                    required
                    rows={3}
                  />
                </div>

                <div className="form-group">
                  <Input
                    label="Manager Password"
                    type="password"
                    name="password"
                    placeholder="Enter manager password"
                    required
                  />
                  <small>Demo password: manager123</small>
                </div>
              </div>

              <div className="override-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowOverrideModal(false)
                    setCurrentOverride(null)
                  }}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-warning">
                  <Shield size={16} />
                  Approve Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </Modal>
  )
}

export default SalesOrderForm