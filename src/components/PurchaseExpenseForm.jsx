import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { 
  Plus, Trash2, Save, Calculator, Truck, FileText,
  Package, DollarSign, MapPin, Calendar 
} from 'lucide-react'
import './PurchaseExpenseForm.css'

const EXPENSE_CATEGORIES = [
  { id: 'transportation', name: 'Transportation', icon: Truck },
  { id: 'loading_unloading', name: 'Loading/Unloading', icon: Package },
  { id: 'customs_duty', name: 'Customs & Duty', icon: FileText },
  { id: 'inspection', name: 'Inspection Fees', icon: Calendar },
  { id: 'storage', name: 'Storage Costs', icon: MapPin },
  { id: 'insurance', name: 'Insurance', icon: FileText },
  { id: 'documentation', name: 'Documentation', icon: FileText },
  { id: 'other', name: 'Other Expenses', icon: DollarSign }
]

const PurchaseExpenseForm = ({ 
  isOpen, 
  onClose, 
  onSave, 
  purchaseOrder = null,
  initialData = null,
  title = "Add Purchase Expenses",
  isEdit = false 
}) => {
  const { getInputDate, formatCurrency } = useSystemSettings()
  
  const [formData, setFormData] = useState({
    purchaseOrderId: '',
    expenses: [{ 
      category: 'transportation',
      description: '',
      amount: 0,
      vendor: '',
      receiptNumber: '',
      expenseDate: getInputDate(),
      notes: ''
    }]
  })

  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      if (initialData) {
        setFormData({ ...initialData })
      } else {
        setFormData(prev => ({
          ...prev,
          purchaseOrderId: purchaseOrder.id,
          expenses: [{
            category: 'transportation',
            description: `Transportation for PO ${purchaseOrder.orderNumber}`,
            amount: 0,
            vendor: '',
            receiptNumber: '',
            expenseDate: getInputDate(),
            notes: ''
          }]
        }))
      }
    }
  }, [isOpen, purchaseOrder, initialData, getInputDate])

  const handleExpenseChange = (index, field, value) => {
    const newExpenses = [...formData.expenses]
    newExpenses[index][field] = value

    // Auto-generate description based on category
    if (field === 'category') {
      const categoryInfo = EXPENSE_CATEGORIES.find(cat => cat.id === value)
      if (categoryInfo && purchaseOrder) {
        newExpenses[index].description = `${categoryInfo.name} for PO ${purchaseOrder.orderNumber}`
      }
    }

    setFormData(prev => ({ ...prev, expenses: newExpenses }))
  }

  const addExpense = () => {
    setFormData(prev => ({
      ...prev,
      expenses: [...prev.expenses, {
        category: 'other',
        description: '',
        amount: 0,
        vendor: '',
        receiptNumber: '',
        expenseDate: getInputDate(),
        notes: ''
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
    const category = EXPENSE_CATEGORIES.find(cat => cat.id === categoryId)
    return category ? category.icon : DollarSign
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
                      className="btn btn-outline btn-sm btn-danger"
                      onClick={() => removeExpense(index)}
                    >
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>

                <div className="expense-fields">
                  <div className="field-group">
                    <label>Category</label>
                    <select
                      value={expense.category}
                      onChange={(e) => handleExpenseChange(index, 'category', e.target.value)}
                      className="form-select"
                    >
                      {EXPENSE_CATEGORIES.map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
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