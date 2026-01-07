/**
 * Expense Category Manager Component
 *
 * Manages expense categories with CRUD operations.
 * Categories are used across petty cash, purchase, sales, and operational expenses.
 */

import React, { useState, useEffect, useCallback } from 'react'
import { useLocalization } from '../context/LocalizationContext'
import { usePermissions } from '../hooks/usePermissions'
import expenseCategoryService from '../services/expenseCategoryService'
import {
  Plus,
  Edit,
  Trash2,
  Save,
  X,
  Tag,
  AlertTriangle,
  CheckCircle,
  RotateCcw,
  Search,
  Filter,
} from 'lucide-react'
import './ExpenseCategoryManager.css'

const CATEGORY_TYPES = [
  { value: 'purchase', label: 'Purchase Expenses', label_ar: 'مصاريف المشتريات' },
  { value: 'sales', label: 'Sales Expenses', label_ar: 'مصاريف المبيعات' },
  { value: 'operational', label: 'Operational Expenses', label_ar: 'المصاريف التشغيلية' },
  { value: 'petty_cash', label: 'Petty Cash Expenses', label_ar: 'مصاريف الصندوق' },
]

const ExpenseCategoryManager = () => {
  const { t, currentLanguage } = useLocalization()
  const { hasPermission } = usePermissions()

  // State
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [filterType, setFilterType] = useState('all')
  const [showInactive, setShowInactive] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')

  // Form state
  const [showForm, setShowForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    name_ar: '',
    type: 'petty_cash',
    description: '',
    max_amount: '',
    sort_order: 0,
    is_active: true,
  })
  const [formErrors, setFormErrors] = useState({})

  // Permissions
  const canManage = hasPermission('MANAGE_EXPENSE_CATEGORIES')

  // Load categories
  const loadCategories = useCallback(async () => {
    try {
      setLoading(true)
      const options = {
        is_active: showInactive ? undefined : true,
        type: filterType !== 'all' ? filterType : undefined,
      }
      const response = await expenseCategoryService.getAll(options)

      if (response.success) {
        setCategories(response.data || [])
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to load categories' })
      }
    } catch (error) {
      console.error('Error loading categories:', error)
      setMessage({ type: 'error', text: 'Failed to load categories' })
    } finally {
      setLoading(false)
    }
  }, [filterType, showInactive])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  // Clear message after timeout
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 4000)
      return () => clearTimeout(timer)
    }
  }, [message])

  // Form handlers
  const handleOpenForm = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({
        code: category.code || '',
        name: category.name || '',
        name_ar: category.name_ar || '',
        type: category.type || 'petty_cash',
        description: category.description || '',
        max_amount: category.max_amount || '',
        sort_order: category.sort_order || 0,
        is_active: category.is_active !== false,
      })
    } else {
      setEditingCategory(null)
      setFormData({
        code: '',
        name: '',
        name_ar: '',
        type: 'petty_cash',
        description: '',
        max_amount: '',
        sort_order: 0,
        is_active: true,
      })
    }
    setFormErrors({})
    setShowForm(true)
  }

  const handleCloseForm = () => {
    setShowForm(false)
    setEditingCategory(null)
    setFormErrors({})
  }

  const validateForm = () => {
    const errors = {}

    if (!formData.code.trim()) {
      errors.code = 'Category code is required'
    } else if (!/^[A-Z0-9_]+$/.test(formData.code.toUpperCase())) {
      errors.code = 'Code must contain only letters, numbers, and underscores'
    }

    if (!formData.name.trim()) {
      errors.name = 'Category name is required'
    }

    if (!formData.type) {
      errors.type = 'Category type is required'
    }

    if (formData.max_amount && isNaN(parseFloat(formData.max_amount))) {
      errors.max_amount = 'Max amount must be a valid number'
    }

    if (formData.max_amount && parseFloat(formData.max_amount) < 0) {
      errors.max_amount = 'Max amount cannot be negative'
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSave = async (e) => {
    e.preventDefault()

    if (!validateForm()) return

    try {
      setSaving(true)

      const submitData = {
        ...formData,
        code: formData.code.toUpperCase(),
        max_amount: formData.max_amount ? parseFloat(formData.max_amount) : null,
        sort_order: parseInt(formData.sort_order) || 0,
      }

      let response
      if (editingCategory) {
        response = await expenseCategoryService.update(editingCategory.id, submitData)
      } else {
        response = await expenseCategoryService.create(submitData)
      }

      if (response.success) {
        setMessage({
          type: 'success',
          text: `Category ${editingCategory ? 'updated' : 'created'} successfully`,
        })
        handleCloseForm()
        loadCategories()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save category' })
      }
    } catch (error) {
      console.error('Error saving category:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save category' })
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (category) => {
    try {
      const response = await expenseCategoryService.toggleActive(category.id, !category.is_active)

      if (response.success) {
        setMessage({
          type: 'success',
          text: category.is_active ? 'Category deactivated' : 'Category reactivated',
        })
        loadCategories()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to update category' })
      }
    } catch (error) {
      console.error('Error toggling category:', error)
      setMessage({ type: 'error', text: 'Failed to update category status' })
    }
  }

  const handleDelete = async (category) => {
    if (
      !confirm(
        `Are you sure you want to delete "${category.name}"?\n\nNote: This will only work if the category is not referenced by any expenses.`
      )
    ) {
      return
    }

    try {
      const response = await expenseCategoryService.delete(category.id)

      if (response.success) {
        setMessage({ type: 'success', text: 'Category deleted successfully' })
        loadCategories()
      } else {
        setMessage({
          type: 'error',
          text: response.error || 'Failed to delete category. It may be in use.',
        })
      }
    } catch (error) {
      console.error('Error deleting category:', error)
      setMessage({ type: 'error', text: 'Failed to delete category' })
    }
  }

  // Filter categories
  const filteredCategories = categories.filter((cat) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      return (
        cat.code.toLowerCase().includes(search) ||
        cat.name.toLowerCase().includes(search) ||
        (cat.name_ar && cat.name_ar.includes(searchTerm))
      )
    }
    return true
  })

  // Group categories by type for display
  const groupedCategories = filteredCategories.reduce((acc, cat) => {
    const type = cat.type || 'other'
    if (!acc[type]) acc[type] = []
    acc[type].push(cat)
    return acc
  }, {})

  const getTypeLabel = (type) => {
    const typeObj = CATEGORY_TYPES.find((t) => t.value === type)
    if (typeObj) {
      return currentLanguage === 'ar' ? typeObj.label_ar : typeObj.label
    }
    return type
  }

  return (
    <div className="expense-category-manager">
      {/* Header */}
      <div className="ecm-header">
        <div className="ecm-title">
          <Tag size={20} />
          <h3>{t('expenseCategories', 'Expense Categories')}</h3>
        </div>

        {canManage && (
          <button className="btn-add" onClick={() => handleOpenForm()}>
            <Plus size={18} />
            {t('addCategory', 'Add Category')}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`ecm-message ${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="ecm-filters">
        <div className="filter-group">
          <Filter size={16} />
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <option value="all">{t('allTypes', 'All Types')}</option>
            {CATEGORY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {currentLanguage === 'ar' ? type.label_ar : type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group search">
          <Search size={16} />
          <input
            type="text"
            placeholder={t('searchCategories', 'Search categories...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <label className="filter-checkbox">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
          />
          {t('showInactive', 'Show Inactive')}
        </label>
      </div>

      {/* Category List */}
      <div className="ecm-content">
        {loading ? (
          <div className="ecm-loading">
            <div className="spinner"></div>
            <span>{t('loading', 'Loading...')}</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="ecm-empty">
            <Tag size={48} />
            <p>{t('noCategories', 'No categories found')}</p>
            {canManage && (
              <button className="btn-add" onClick={() => handleOpenForm()}>
                <Plus size={18} />
                {t('addFirstCategory', 'Add your first category')}
              </button>
            )}
          </div>
        ) : (
          <div className="ecm-categories">
            {filterType === 'all' ? (
              // Grouped by type
              Object.entries(groupedCategories).map(([type, cats]) => (
                <div key={type} className="category-group">
                  <h4 className="group-title">{getTypeLabel(type)}</h4>
                  <div className="category-list">
                    {cats.map((category) => (
                      <CategoryRow
                        key={category.id}
                        category={category}
                        canManage={canManage}
                        currentLanguage={currentLanguage}
                        onEdit={() => handleOpenForm(category)}
                        onToggleActive={() => handleToggleActive(category)}
                        onDelete={() => handleDelete(category)}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              // Single list
              <div className="category-list">
                {filteredCategories.map((category) => (
                  <CategoryRow
                    key={category.id}
                    category={category}
                    canManage={canManage}
                    currentLanguage={currentLanguage}
                    onEdit={() => handleOpenForm(category)}
                    onToggleActive={() => handleToggleActive(category)}
                    onDelete={() => handleDelete(category)}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="ecm-modal-overlay">
          <div className="ecm-modal">
            <div className="modal-header">
              <h3>
                {editingCategory
                  ? t('editCategory', 'Edit Category')
                  : t('addCategory', 'Add Category')}
              </h3>
              <button className="btn-close" onClick={handleCloseForm}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="code">
                    {t('categoryCode', 'Category Code')} <span className="required">*</span>
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., FUEL, TRANSPORT"
                    className={formErrors.code ? 'error' : ''}
                    disabled={editingCategory !== null}
                  />
                  {formErrors.code && <span className="error-text">{formErrors.code}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="type">
                    {t('categoryType', 'Category Type')} <span className="required">*</span>
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={formErrors.type ? 'error' : ''}
                  >
                    {CATEGORY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {currentLanguage === 'ar' ? type.label_ar : type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && <span className="error-text">{formErrors.type}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="name">
                    {t('categoryName', 'Category Name (English)')} <span className="required">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Fuel & Transportation"
                    className={formErrors.name ? 'error' : ''}
                  />
                  {formErrors.name && <span className="error-text">{formErrors.name}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="name_ar">{t('categoryNameAr', 'Category Name (Arabic)')}</label>
                  <input
                    id="name_ar"
                    type="text"
                    value={formData.name_ar}
                    onChange={(e) => setFormData({ ...formData, name_ar: e.target.value })}
                    placeholder="e.g., الوقود والمواصلات"
                    dir="rtl"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="max_amount">{t('maxAmount', 'Max Amount per Transaction')}</label>
                  <input
                    id="max_amount"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.max_amount}
                    onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
                    placeholder="Leave empty for no limit"
                    className={formErrors.max_amount ? 'error' : ''}
                  />
                  {formErrors.max_amount && (
                    <span className="error-text">{formErrors.max_amount}</span>
                  )}
                </div>

                <div className="form-group">
                  <label htmlFor="sort_order">{t('sortOrder', 'Sort Order')}</label>
                  <input
                    id="sort_order"
                    type="number"
                    min="0"
                    value={formData.sort_order}
                    onChange={(e) => setFormData({ ...formData, sort_order: e.target.value })}
                    placeholder="0"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">{t('description', 'Description')}</label>
                  <textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Optional description for this category"
                    rows={2}
                  />
                </div>

                <div className="form-group checkbox">
                  <label>
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                    {t('active', 'Active')}
                  </label>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={handleCloseForm}>
                  <X size={18} />
                  {t('cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn-save" disabled={saving}>
                  <Save size={18} />
                  {saving ? t('saving', 'Saving...') : t('save', 'Save')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

// Category Row Component
const CategoryRow = ({ category, canManage, currentLanguage, onEdit, onToggleActive, onDelete, t }) => {
  const displayName = currentLanguage === 'ar' && category.name_ar ? category.name_ar : category.name

  return (
    <div className={`category-row ${!category.is_active ? 'inactive' : ''}`}>
      <div className="category-info">
        <div className="category-code">{category.code}</div>
        <div className="category-name">{displayName}</div>
        <div className="category-limit">
          {category.max_amount
            ? `${t('maxAmount', 'Max')}: ${parseFloat(category.max_amount).toFixed(2)}`
            : t('noLimit', 'No limit')}
        </div>
      </div>

      <div className="category-status">
        {category.is_active ? (
          <span className="status active">
            <CheckCircle size={14} />
            {t('active', 'Active')}
          </span>
        ) : (
          <span className="status inactive">
            <AlertTriangle size={14} />
            {t('inactive', 'Inactive')}
          </span>
        )}
      </div>

      {canManage && (
        <div className="category-actions">
          <button className="btn-icon edit" onClick={onEdit} title={t('edit', 'Edit')}>
            <Edit size={16} />
          </button>
          <button
            className="btn-icon toggle"
            onClick={onToggleActive}
            title={category.is_active ? t('deactivate', 'Deactivate') : t('reactivate', 'Reactivate')}
          >
            <RotateCcw size={16} />
          </button>
          <button className="btn-icon delete" onClick={onDelete} title={t('delete', 'Delete')}>
            <Trash2 size={16} />
          </button>
        </div>
      )}
    </div>
  )
}

export default ExpenseCategoryManager
