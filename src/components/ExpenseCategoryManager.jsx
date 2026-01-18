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
// CSS moved to global index.css Tailwind

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
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Tag size={20} className="text-slate-600" />
          <h3 className="text-lg font-semibold text-slate-800">{t('expenseCategories', 'Expense Categories')}</h3>
        </div>

        {canManage && (
          <button className="btn btn-primary" onClick={() => handleOpenForm()}>
            <Plus size={16} />
            {t('addCategory', 'Add Category')}
          </button>
        )}
      </div>

      {/* Message */}
      {message && (
        <div className={`flex items-center gap-2 p-3 mb-4 text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
            : 'bg-red-50 border border-red-200 text-red-800'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4 p-3 bg-slate-50 border border-slate-200">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-slate-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
          >
            <option value="all">{t('allTypes', 'All Types')}</option>
            {CATEGORY_TYPES.map((type) => (
              <option key={type.value} value={type.value}>
                {currentLanguage === 'ar' ? type.label_ar : type.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Search size={16} className="text-slate-400" />
          <input
            type="text"
            placeholder={t('searchCategories', 'Search categories...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-3 py-2 text-sm border border-slate-300 bg-white focus:outline-none focus:border-blue-500"
          />
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
          <input
            type="checkbox"
            checked={showInactive}
            onChange={(e) => setShowInactive(e.target.checked)}
            className="w-4 h-4"
          />
          {t('showInactive', 'Show Inactive')}
        </label>
      </div>

      {/* Category List */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <div className="w-8 h-8 border-2 border-slate-300 border-t-blue-600 rounded-full animate-spin mb-3"></div>
            <span>{t('loading', 'Loading...')}</span>
          </div>
        ) : filteredCategories.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-500">
            <Tag size={48} className="mb-3 opacity-30" />
            <p className="mb-4">{t('noCategories', 'No categories found')}</p>
            {canManage && (
              <button className="btn btn-primary" onClick={() => handleOpenForm()}>
                <Plus size={16} />
                {t('addFirstCategory', 'Add your first category')}
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {filterType === 'all' ? (
              // Grouped by type
              Object.entries(groupedCategories).map(([type, cats]) => (
                <div key={type}>
                  <h4 className="text-sm font-bold text-slate-600 uppercase tracking-wider mb-3 pb-2 border-b border-slate-200">
                    {getTypeLabel(type)}
                  </h4>
                  <div className="bg-white border border-slate-200">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200">
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('code', 'Code')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('name', 'Name')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('maxAmount', 'Max Amount')}</th>
                          <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('status', 'Status')}</th>
                          {canManage && <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('actions', 'Actions')}</th>}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
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
                      </tbody>
                    </table>
                  </div>
                </div>
              ))
            ) : (
              // Single list
              <div className="bg-white border border-slate-200">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('code', 'Code')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('name', 'Name')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('maxAmount', 'Max Amount')}</th>
                      <th className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">{t('status', 'Status')}</th>
                      {canManage && <th className="px-4 py-3 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">{t('actions', 'Actions')}</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
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
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white w-full max-w-xl mx-4 shadow-xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">
                {editingCategory
                  ? t('editCategory', 'Edit Category')
                  : t('addCategory', 'Add Category')}
              </h3>
              <button
                className="p-1 text-slate-400 hover:text-slate-600 transition-colors"
                onClick={handleCloseForm}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5">
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="code">
                    {t('categoryCode', 'Category Code')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    placeholder="e.g., FUEL, TRANSPORT"
                    className={formErrors.code ? 'border-red-500' : ''}
                    disabled={editingCategory !== null}
                  />
                  {formErrors.code && <span className="text-xs text-red-500 mt-1">{formErrors.code}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="type">
                    {t('categoryType', 'Category Type')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="type"
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className={formErrors.type ? 'border-red-500' : ''}
                  >
                    {CATEGORY_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {currentLanguage === 'ar' ? type.label_ar : type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.type && <span className="text-xs text-red-500 mt-1">{formErrors.type}</span>}
                </div>

                <div className="form-group">
                  <label htmlFor="name">
                    {t('categoryName', 'Category Name (English)')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Fuel & Transportation"
                    className={formErrors.name ? 'border-red-500' : ''}
                  />
                  {formErrors.name && <span className="text-xs text-red-500 mt-1">{formErrors.name}</span>}
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
                    className={formErrors.max_amount ? 'border-red-500' : ''}
                  />
                  {formErrors.max_amount && (
                    <span className="text-xs text-red-500 mt-1">{formErrors.max_amount}</span>
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

                <div className="form-group">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    {t('active', 'Active')}
                  </label>
                </div>
              </div>

              <div className="form-actions mt-6">
                <button type="button" className="btn btn-outline" onClick={handleCloseForm}>
                  <X size={16} />
                  {t('cancel', 'Cancel')}
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  <Save size={16} />
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

// Category Row Component - renders as table row
const CategoryRow = ({ category, canManage, currentLanguage, onEdit, onToggleActive, onDelete, t }) => {
  const displayName = currentLanguage === 'ar' && category.name_ar ? category.name_ar : category.name

  return (
    <tr className={`hover:bg-slate-50 transition-colors ${!category.is_active ? 'opacity-60' : ''}`}>
      <td className="px-4 py-3">
        <span className="font-mono text-sm font-medium text-slate-700">{category.code}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-800">{displayName}</span>
      </td>
      <td className="px-4 py-3">
        <span className="text-sm text-slate-600">
          {category.max_amount
            ? `OMR ${parseFloat(category.max_amount).toFixed(2)}`
            : t('noLimit', 'No limit')}
        </span>
      </td>
      <td className="px-4 py-3">
        {category.is_active ? (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle size={12} />
            {t('active', 'Active')}
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-slate-100 text-slate-500 border border-slate-200">
            <AlertTriangle size={12} />
            {t('inactive', 'Inactive')}
          </span>
        )}
      </td>
      {canManage && (
        <td className="px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <button
              className="btn btn-outline btn-sm"
              onClick={onEdit}
              title={t('edit', 'Edit')}
            >
              <Edit size={14} />
            </button>
            <button
              className={`btn btn-sm ${category.is_active ? 'btn-warning' : 'btn-success'}`}
              onClick={onToggleActive}
              title={category.is_active ? t('deactivate', 'Deactivate') : t('reactivate', 'Reactivate')}
            >
              <RotateCcw size={14} />
            </button>
            <button
              className="btn btn-danger btn-sm"
              onClick={onDelete}
              title={t('delete', 'Delete')}
            >
              <Trash2 size={14} />
            </button>
          </div>
        </td>
      )}
    </tr>
  )
}

export default ExpenseCategoryManager
