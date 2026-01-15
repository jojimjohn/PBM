import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { useLocalization } from '../context/LocalizationContext'
import CategorySelect from './expenses/CategorySelect'
import useExpenseCategories from '../hooks/useExpenseCategories'
import purchaseOrderExpenseService from '../services/purchaseOrderExpenseService'
import {
  Plus, Trash2, Save, Calculator, Truck, FileText,
  Package, Banknote, MapPin, Calendar, Upload, X, Image,
  ChevronDown, ChevronUp, AlertCircle
} from 'lucide-react'
import './PurchaseExpenseForm.css'

// Icon mapping for displaying selected category icons
const CATEGORY_ICONS = {
  transportation: Truck,
  loading_unloading: Package,
  customs_duty: FileText,
  inspection: Calendar,
  storage: MapPin,
  insurance: FileText,
  documentation: FileText,
  other: Banknote
}

const PurchaseExpenseForm = ({
  isOpen,
  onClose,
  onSave,
  purchaseOrder = null,
  initialData = null,
  title = "Add Purchase Expenses",
  isEdit = false
}) => {
  const { getInputDate, formatCurrency, formatDate } = useSystemSettings()
  const { t } = useLocalization()
  // Load categories from database for display labels
  const { getCategoryLabel } = useExpenseCategories('operational')

  // State for existing expenses
  const [existingExpenses, setExistingExpenses] = useState([])
  const [loadingExisting, setLoadingExisting] = useState(false)
  const [showExisting, setShowExisting] = useState(true)

  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    expenses: [{
      category: '',  // Will be populated by CategorySelect dropdown
      description: '',
      amount: 0,
      vendor: '',
      receiptNumber: '',
      expenseDate: getInputDate(),
      notes: '',
      receiptPhoto: null
    }]
  })

  // Handle receipt photo upload - converts to base64
  const handleReceiptUpload = async (index, file) => {
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      alert('Please upload an image (JPEG, PNG, GIF) or PDF file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = (e) => {
      handleExpenseChange(index, 'receiptPhoto', e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const removeReceiptPhoto = (index) => {
    handleExpenseChange(index, 'receiptPhoto', null)
  }

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  // Fetch existing expenses for this PO when modal opens
  useEffect(() => {
    const fetchExistingExpenses = async () => {
      if (!isOpen || !purchaseOrder?.id) {
        setExistingExpenses([])
        return
      }

      setLoadingExisting(true)
      try {
        const result = await purchaseOrderExpenseService.getExpenses(purchaseOrder.id)
        if (result.success && result.data?.expenses) {
          setExistingExpenses(result.data.expenses)
        } else {
          setExistingExpenses([])
        }
      } catch (error) {
        console.error('Error fetching existing expenses:', error)
        setExistingExpenses([])
      } finally {
        setLoadingExisting(false)
      }
    }

    fetchExistingExpenses()
  }, [isOpen, purchaseOrder?.id])

  // Initialize form when modal opens
  // Note: getInputDate intentionally excluded from deps to prevent form reset on context changes
  useEffect(() => {
    if (isOpen && purchaseOrder) {
      if (initialData) {
        setFormData({ ...initialData })
      } else {
        setFormData(prev => ({
          ...prev,
          purchaseOrderId: purchaseOrder.id,
          expenses: [{
            category: '',  // User selects from CategorySelect dropdown
            description: `Expense for PO ${purchaseOrder.orderNumber}`,
            amount: 0,
            vendor: '',
            receiptNumber: '',
            expenseDate: getInputDate(),
            notes: '',
            receiptPhoto: null
          }]
        }))
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, purchaseOrder, initialData])

  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...formData.expenses]
    newExpenses[index][field] = value

    // Auto-generate description based on category (when category object is passed)
    if (field === 'category' && purchaseOrder) {
      // If value is a category object (from CategorySelect with returnObject=true)
      if (typeof value === 'object' && value?.name) {
        newExpenses[index].description = `${value.name} for PO ${purchaseOrder.orderNumber}`
        newExpenses[index].category = value.code // Store the code
      } else if (typeof value === 'string') {
        // If value is a string code, just update the description placeholder
        newExpenses[index].description = `${value} expense for PO ${purchaseOrder.orderNumber}`
      }
    }

    setFormData(prev => ({ ...prev, expenses: newExpenses }))
  }

  // Handle category change from CategorySelect
  const handleCategoryChange = (index, categoryCode) => {
    handleExpenseChange(index, 'category', categoryCode)
  }

  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, {
        category: '',  // User selects from CategorySelect dropdown
        description: '',
        amount: 0,
        vendor: '',
        receiptNumber: '',
        expenseDate: getInputDate(),
        notes: '',
        receiptPhoto: null
      }]
    }))
  }

  const removeExpense = (index) => {
    if (formData.expenses.length === 1) return
    const newExpenses = formData.expenses.filter((_, i) => i !== index)
    setFormData(prev => ({ ...prev, expenses: newExpenses }))
  }

  const calculateTotal = () => {
    return formData.expenses.reduce((sum, expense) => sum + (parseFloat(expense.amount) || 0), 0)
  }

  const validateForm = () => {
    const newErrors = {}

    formData.expenses.forEach((expense, index) => {
      if (!expense.category) {
        newErrors[`category_${index}`] = 'Category is required'
      }

      if (!expense.description.trim()) {
        newErrors[`description_${index}`] = 'Description is required'
      }

      if (!expense.amount || expense.amount <= 0) {
        newErrors[`amount_${index}`] = 'Amount must be greater than 0'
      }

      if (!expense.expenseDate) {
        newErrors[`date_${index}`] = 'Expense date is required'
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setLoading(true)
    
    try {
      const expenseData = {
        ...formData,
        totalAmount: calculateTotal(),
        expenseDate: new Date().toISOString()
      }

      await onSave(expenseData)
    } catch (error) {
      console.error('Error saving purchase expenses:', error)
      alert('Failed to save purchase expenses. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const getCategoryIcon = (categoryId) => {
    return CATEGORY_ICONS[categoryId] || Banknote
  }

  if (!purchaseOrder && !isEdit) return null

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={title}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="purchase-expense-form">
        {/* Purchase Order Info */}
        {purchaseOrder && (
          <div className="expense-header">
            <div className="order-info">
              <h4>Purchase Order: {purchaseOrder.orderNumber}</h4>
              <p>Vendor: {purchaseOrder.vendorName}</p>
              <p>Order Value: {formatCurrency(purchaseOrder.totalAmount)}</p>
            </div>
          </div>
        )}

        {/* Existing Expenses Section */}
        {!isEdit && (
          <div className="existing-expenses-section">
            <button
              type="button"
              className="existing-expenses-toggle"
              onClick={() => setShowExisting(!showExisting)}
            >
              <span className="toggle-label">
                <AlertCircle size={16} />
                Existing Expenses ({loadingExisting ? '...' : existingExpenses.length})
              </span>
              {showExisting ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>

            {showExisting && (
              <div className="existing-expenses-list">
                {loadingExisting ? (
                  <div className="loading-expenses">Loading existing expenses...</div>
                ) : existingExpenses.length === 0 ? (
                  <div className="no-existing-expenses">
                    No expenses recorded for this purchase order yet.
                  </div>
                ) : (
                  <>
                    <div className="existing-expenses-table">
                      <div className="existing-expense-header-row">
                        <span>Category</span>
                        <span>Description</span>
                        <span>Amount</span>
                        <span>Date</span>
                      </div>
                      {existingExpenses.map((exp, idx) => (
                        <div key={exp.id || idx} className="existing-expense-row">
                          <span className="existing-category">
                            {getCategoryLabel(exp.category)}
                          </span>
                          <span className="existing-description" title={exp.description}>
                            {exp.description?.length > 30
                              ? exp.description.substring(0, 30) + '...'
                              : exp.description}
                          </span>
                          <span className="existing-amount">
                            {formatCurrency(exp.amount)}
                          </span>
                          <span className="existing-date">
                            {formatDate(exp.expenseDate)}
                          </span>
                        </div>
                      ))}
                    </div>
                    <div className="existing-expenses-total">
                      <span>Total Existing Expenses:</span>
                      <span className="total-amount">
                        {formatCurrency(existingExpenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0))}
                      </span>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}

        {/* Expense Items */}
        <div className="expense-items">
          <div className="items-header">
            <h4>Purchase Expenses</h4>
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              onClick={addExpense}
            >
              <Plus size={16} />
              Add Expense
            </button>
          </div>

          {formData.expenses.map((expense, index) => {
            const CategoryIcon = getCategoryIcon(expense.category)
            
            return (
              <div key={index} className="expense-item">
                <div className="expense-item-header">
                  <CategoryIcon size={20} className="category-icon" />
                  <span className="expense-number">Expense {index + 1}</span>
                  {formData.expenses.length > 1 && (
                    <button
                      type="button"
                      className="btn btn-danger btn-sm"
                      onClick={() => removeExpense(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="expense-fields">
                  <div className="field-group">
                    <label>{t('category', 'Category')}</label>
                    <CategorySelect
                      value={expense.category}
                      onChange={(code) => handleCategoryChange(index, code)}
                      type="operational"
                      placeholder={t('selectCategory', 'Select category')}
                      error={errors[`category_${index}`]}
                    />
                    {errors[`category_${index}`] && (
                      <span className="error-text">{errors[`category_${index}`]}</span>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={expense.description}
                      onChange={(e) => handleExpenseChange(index, 'description', e.target.value)}
                      className={`form-input ${errors[`description_${index}`] ? 'error' : ''}`}
                      placeholder="Enter expense description"
                    />
                    {errors[`description_${index}`] && (
                      <span className="error-text">{errors[`description_${index}`]}</span>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      value={expense.amount}
                      onChange={(e) => handleExpenseChange(index, 'amount', e.target.value)}
                      className={`form-input ${errors[`amount_${index}`] ? 'error' : ''}`}
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                    />
                    {errors[`amount_${index}`] && (
                      <span className="error-text">{errors[`amount_${index}`]}</span>
                    )}
                  </div>

                  <div className="field-group">
                    <label>Vendor/Service Provider</label>
                    <input
                      type="text"
                      value={expense.vendor}
                      onChange={(e) => handleExpenseChange(index, 'vendor', e.target.value)}
                      className="form-input"
                      placeholder="Enter vendor name"
                    />
                  </div>

                  <div className="field-group">
                    <label>Receipt Number</label>
                    <input
                      type="text"
                      value={expense.receiptNumber}
                      onChange={(e) => handleExpenseChange(index, 'receiptNumber', e.target.value)}
                      className="form-input"
                      placeholder="Enter receipt/invoice number"
                    />
                  </div>

                  <div className="field-group">
                    <label>Expense Date</label>
                    <input
                      type="date"
                      value={expense.expenseDate}
                      onChange={(e) => handleExpenseChange(index, 'expenseDate', e.target.value)}
                      className={`form-input ${errors[`date_${index}`] ? 'error' : ''}`}
                    />
                    {errors[`date_${index}`] && (
                      <span className="error-text">{errors[`date_${index}`]}</span>
                    )}
                  </div>

                  <div className="field-group full-width">
                    <label>Notes</label>
                    <textarea
                      value={expense.notes}
                      onChange={(e) => handleExpenseChange(index, 'notes', e.target.value)}
                      className="form-textarea"
                      rows="2"
                      placeholder="Additional notes about this expense"
                    />
                  </div>

                  {/* Receipt Photo Upload */}
                  <div className="field-group full-width">
                    <label>Receipt/Document</label>
                    {expense.receiptPhoto ? (
                      <div className="receipt-preview-container">
                        <div className="receipt-preview">
                          {expense.receiptPhoto.startsWith('data:image') ? (
                            <img
                              src={expense.receiptPhoto}
                              alt="Receipt"
                              className="receipt-thumbnail"
                              onClick={() => window.open(expense.receiptPhoto, '_blank')}
                            />
                          ) : (
                            <div className="receipt-file-indicator">
                              <FileText size={24} />
                              <span>PDF Document</span>
                            </div>
                          )}
                        </div>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm remove-receipt-btn"
                          onClick={() => removeReceiptPhoto(index)}
                        >
                          <X size={14} />
                          Remove
                        </button>
                      </div>
                    ) : (
                      <div className="receipt-upload-zone">
                        <input
                          type="file"
                          id={`receipt-${index}`}
                          accept="image/jpeg,image/png,image/gif,application/pdf"
                          onChange={(e) => handleReceiptUpload(index, e.target.files[0])}
                          className="receipt-input"
                        />
                        <label htmlFor={`receipt-${index}`} className="receipt-upload-label">
                          <Upload size={20} />
                          <span>Upload Receipt</span>
                          <span className="upload-hint">JPEG, PNG, GIF or PDF (max 5MB)</span>
                        </label>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Expense Summary */}
        <div className="expense-summary">
          <div className="summary-row">
            <span>Total Expenses:</span>
            <span className="total-amount">{formatCurrency(calculateTotal())}</span>
          </div>
          {purchaseOrder && (
            <>
              <div className="summary-row">
                <span>Purchase Order Value:</span>
                <span>{formatCurrency(purchaseOrder.totalAmount)}</span>
              </div>
              <div className="summary-row total">
                <span>True Landed Cost:</span>
                <span className="total-amount">
                  {formatCurrency(purchaseOrder.totalAmount + calculateTotal())}
                </span>
              </div>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={onClose}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            <Save size={16} />
            {loading ? 'Saving...' : 'Save Expenses'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default PurchaseExpenseForm