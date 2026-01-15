/**
 * useSalesOrderForm Hook
 *
 * Manages sales order form state, validation, and item calculations.
 * Handles form initialization, field updates, and data transformation.
 *
 * @module hooks/useSalesOrderForm
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSystemSettings } from '../../../context/SystemSettingsContext'

/**
 * @typedef {import('../types/sales.types').SalesOrderFormData} SalesOrderFormData
 * @typedef {import('../types/sales.types').SalesOrderFormItem} SalesOrderFormItem
 * @typedef {import('../types/sales.types').SalesOrder} SalesOrder
 * @typedef {import('../types/sales.types').UseSalesOrderFormReturn} UseSalesOrderFormReturn
 */

/**
 * Initial empty form item
 */
const EMPTY_ITEM = {
  tempId: '',
  materialId: '',
  quantity: '',
  rate: '',
  amount: 0
}

/**
 * Generate unique temp ID for new items
 */
const generateTempId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

/**
 * Hook for managing sales order form state
 *
 * @param {Object} options - Configuration options
 * @param {SalesOrder} [options.editingOrder] - Order being edited (null for new)
 * @param {Object} [options.selectedCustomer] - Pre-selected customer
 * @param {Array} options.customers - Available customers list
 * @param {Array} options.materials - Available materials list
 * @param {number} [options.defaultVatRate=5] - Default VAT rate percentage
 * @returns {UseSalesOrderFormReturn} Form state and operations
 */
export const useSalesOrderForm = ({
  editingOrder = null,
  selectedCustomer = null,
  customers = [],
  materials = [],
  defaultVatRate = 5
}) => {
  const { getInputDate } = useSystemSettings()

  // Core form state
  const [formData, setFormData] = useState(() => createInitialFormData(getInputDate, selectedCustomer))
  const [errors, setErrors] = useState({})
  const [isDirty, setIsDirty] = useState(false)

  /**
   * Create initial form data structure
   */
  function createInitialFormData(getInputDate, customer = null) {
    return {
      orderNumber: '',
      customer: customer,
      branch_id: '',
      orderDate: getInputDate(),
      deliveryDate: '',
      items: [{ ...EMPTY_ITEM, tempId: generateTempId() }],
      notes: '',
      specialInstructions: '',
      totalAmount: 0,
      discountPercent: 0,
      discountAmount: 0,
      vatRate: defaultVatRate,
      vatAmount: 0,
      netAmount: 0,
      status: 'draft'
    }
  }

  /**
   * Generate order number for new orders
   */
  const generateOrderNumber = useCallback(() => {
    return `SO-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`
  }, [])

  /**
   * Reset form to initial state
   */
  const reset = useCallback(() => {
    setFormData(createInitialFormData(getInputDate, selectedCustomer))
    setErrors({})
    setIsDirty(false)
  }, [getInputDate, selectedCustomer])

  /**
   * Populate form from existing order (edit mode)
   */
  const populateFromOrder = useCallback((order) => {
    if (!order || customers.length === 0 || materials.length === 0) return

    // Resolve customer reference
    let customerObj = order.customer
    if (typeof customerObj === 'string') {
      customerObj = customers.find(c => c.name === order.customer) || null
    } else if (typeof customerObj === 'object' && customerObj?.id) {
      customerObj = customers.find(c => c.id === customerObj.id) || customerObj
    } else if (order.customerId) {
      customerObj = customers.find(c => c.id === order.customerId) || null
    }

    // Transform items to form structure
    const transformedItems = order.items?.length > 0
      ? order.items.map(item => {
          let materialId = item.materialId || ''
          if (!materialId && item.name) {
            const material = materials.find(m => m.name === item.name)
            materialId = material?.id || ''
          }

          return {
            tempId: generateTempId(),
            materialId,
            quantity: item.quantity || '',
            rate: item.unitPrice || item.rate || '',
            amount: item.totalPrice || item.amount || 0
          }
        })
      : [{ ...EMPTY_ITEM, tempId: generateTempId() }]

    // Calculate delivery date if not provided
    let deliveryDate = order.deliveryDate || order.expectedDeliveryDate || ''
    if (!deliveryDate && (order.date || order.orderDate)) {
      const orderDate = new Date(order.date || order.orderDate)
      orderDate.setDate(orderDate.getDate() + 7)
      deliveryDate = orderDate.toISOString().split('T')[0]
    }

    setFormData({
      orderNumber: order.orderNumber || order.id || '',
      customer: customerObj,
      branch_id: order.branch_id || '',
      orderDate: (order.orderDate || order.date)
        ? new Date(order.orderDate || order.date).toISOString().split('T')[0]
        : getInputDate(),
      deliveryDate,
      items: transformedItems,
      notes: order.notes || '',
      specialInstructions: order.specialInstructions || '',
      totalAmount: order.subtotal || order.total || 0,
      discountPercent: order.discountPercent || 0,
      discountAmount: order.discountAmount || 0,
      vatRate: order.vatRate || defaultVatRate,
      vatAmount: order.vatAmount || order.taxAmount || 0,
      netAmount: order.totalAmount || order.total || 0,
      status: order.status || 'draft'
    })

    setIsDirty(false)
  }, [customers, materials, getInputDate, defaultVatRate])

  /**
   * Set a single form field
   */
  const setField = useCallback((field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)

    // Clear field error when value changes
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }, [errors])

  /**
   * Set customer and trigger related updates
   */
  const setCustomer = useCallback((customerId) => {
    const customer = customers.find(c => c.id == customerId) // eslint-disable-line eqeqeq
    setFormData(prev => ({ ...prev, customer }))
    setIsDirty(true)

    if (errors.customer) {
      setErrors(prev => ({ ...prev, customer: null }))
    }

    return customer
  }, [customers, errors])

  /**
   * Add a new empty line item
   */
  const addItem = useCallback(() => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { ...EMPTY_ITEM, tempId: generateTempId() }]
    }))
    setIsDirty(true)
  }, [])

  /**
   * Remove line item by index
   */
  const removeItem = useCallback((index) => {
    setFormData(prev => {
      if (prev.items.length <= 1) return prev // Keep at least one item
      return {
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }
    })
    setIsDirty(true)
  }, [])

  /**
   * Update a line item field
   */
  const updateItem = useCallback((index, field, value) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }

      // Auto-calculate amount when quantity or rate changes
      if (field === 'quantity' || field === 'rate') {
        const quantity = parseFloat(field === 'quantity' ? value : newItems[index].quantity) || 0
        const rate = parseFloat(field === 'rate' ? value : newItems[index].rate) || 0
        newItems[index].amount = quantity * rate
      }

      return { ...prev, items: newItems }
    })
    setIsDirty(true)
  }, [])

  /**
   * Update item with rate info (used when selecting material)
   */
  const updateItemWithRate = useCallback((index, materialId, rate, rateInfo = {}) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      const item = newItems[index]
      const quantity = parseFloat(item.quantity) || 0

      newItems[index] = {
        ...item,
        materialId,
        rate,
        amount: quantity * rate,
        ...rateInfo
      }

      return { ...prev, items: newItems }
    })
    setIsDirty(true)
  }, [])

  /**
   * Apply rate override to an item
   */
  const applyRateOverride = useCallback((index, newRate, overrideInfo) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      const quantity = parseFloat(newItems[index].quantity) || 0

      newItems[index] = {
        ...newItems[index],
        rate: newRate,
        amount: quantity * newRate,
        isOverridden: true,
        overrideReason: overrideInfo.reason,
        originalRate: overrideInfo.originalRate
      }

      return { ...prev, items: newItems }
    })
    setIsDirty(true)
  }, [])

  /**
   * Calculate totals based on current items and discount
   */
  const calculateTotals = useCallback((isTaxable = true, vatRate = defaultVatRate) => {
    setFormData(prev => {
      const subtotal = prev.items.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0)
      const discountAmount = (subtotal * (parseFloat(prev.discountPercent) || 0)) / 100
      const subtotalAfterDiscount = subtotal - discountAmount

      const effectiveVatRate = isTaxable ? vatRate : 0
      const vatAmount = (subtotalAfterDiscount * effectiveVatRate) / 100
      const netAmount = subtotalAfterDiscount + vatAmount

      return {
        ...prev,
        totalAmount: subtotal,
        discountAmount,
        vatRate: effectiveVatRate,
        vatAmount,
        netAmount
      }
    })
  }, [defaultVatRate])

  /**
   * Validate form data
   */
  const validate = useCallback((isDraft = false) => {
    const newErrors = {}

    // Customer is always required
    if (!formData.customer) {
      newErrors.customer = 'Please select a customer'
    }

    // For non-drafts, validate items
    if (!isDraft) {
      const hasInvalidItems = formData.items.some(item =>
        !item.materialId || !item.quantity
      )

      if (hasInvalidItems) {
        newErrors.items = 'Please fill in all item details'
      }

      // Check for zero quantities
      const hasZeroQuantity = formData.items.some(item =>
        item.materialId && (parseFloat(item.quantity) || 0) <= 0
      )

      if (hasZeroQuantity) {
        newErrors.items = 'Quantity must be greater than zero'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [formData])

  /**
   * Get sanitized data for submission
   */
  const getCleanData = useCallback(() => {
    const isDraft = formData.status === 'draft'

    // Filter items based on status
    const filteredItems = isDraft
      ? formData.items.filter(item => item.materialId)
      : formData.items.filter(item => item.materialId && item.quantity && item.rate)

    // Transform items for API
    const transformedItems = filteredItems.map(item => ({
      materialId: item.materialId,
      quantity: parseFloat(item.quantity) || 0,
      unitPrice: parseFloat(item.rate) || 0,
      totalPrice: parseFloat(item.amount) || 0,
      ...(item.isOverridden && {
        isOverridden: true,
        overrideReason: item.overrideReason,
        originalRate: item.originalRate
      })
    }))

    return {
      orderNumber: formData.orderNumber,
      customerId: formData.customer?.id,
      customer: formData.customer,
      branch_id: formData.branch_id || undefined,
      orderDate: formData.orderDate,
      deliveryDate: formData.deliveryDate || undefined,
      items: transformedItems,
      notes: formData.notes || '',
      specialInstructions: formData.specialInstructions || '',
      subtotal: formData.totalAmount,
      discountPercent: formData.discountPercent,
      discountAmount: formData.discountAmount,
      vatRate: formData.vatRate,
      vatAmount: formData.vatAmount,
      totalAmount: formData.netAmount,
      status: formData.status
    }
  }, [formData])

  /**
   * Check if form has valid items for FIFO preview
   */
  const hasValidItems = useMemo(() => {
    return formData.items.some(item =>
      item.materialId && parseFloat(item.quantity) > 0
    )
  }, [formData.items])

  /**
   * Get items for stock/FIFO validation
   */
  const getItemsForValidation = useCallback(() => {
    return formData.items
      .filter(item => item.materialId && parseFloat(item.quantity) > 0)
      .map(item => ({
        materialId: item.materialId,
        quantity: parseFloat(item.quantity)
      }))
  }, [formData.items])

  // Initialize order number for new orders
  useEffect(() => {
    if (!editingOrder && !formData.orderNumber) {
      setFormData(prev => ({ ...prev, orderNumber: generateOrderNumber() }))
    }
  }, [editingOrder, formData.orderNumber, generateOrderNumber])

  // Populate form when editing existing order
  useEffect(() => {
    if (editingOrder && customers.length > 0 && materials.length > 0) {
      populateFromOrder(editingOrder)
    }
  }, [editingOrder, customers.length, materials.length, populateFromOrder])

  // Recalculate totals when items or discount change
  useEffect(() => {
    const isTaxable = formData.customer?.is_taxable !== false
    calculateTotals(isTaxable, defaultVatRate)
  }, [formData.items, formData.discountPercent, formData.customer?.is_taxable, defaultVatRate, calculateTotals])

  return {
    // State
    formData,
    errors,
    isDirty,
    hasValidItems,

    // Field operations
    setField,
    setCustomer,

    // Item operations
    addItem,
    removeItem,
    updateItem,
    updateItemWithRate,
    applyRateOverride,

    // Form operations
    validate,
    getCleanData,
    getItemsForValidation,
    reset,
    populateFromOrder,
    calculateTotals
  }
}

export default useSalesOrderForm
