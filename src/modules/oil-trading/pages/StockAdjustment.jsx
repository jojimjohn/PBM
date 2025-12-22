import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import LoadingSpinner from '../../../components/LoadingSpinner'
import materialService from '../../../services/materialService'
import inventoryService from '../../../services/inventoryService'
import transactionService from '../../../services/transactionService'
import {
  Package,
  ArrowLeft,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  Check,
  FileText
} from 'lucide-react'
import '../../../styles/theme.css'
import './StockAdjustment.css'

/**
 * Stock Adjustment Page
 * Allows users to adjust inventory quantities with reason tracking
 */
const StockAdjustment = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { formatDate: systemFormatDate } = useSystemSettings()

  const formatDate = systemFormatDate || ((date) => date ? new Date(date).toLocaleDateString() : '-')
  const today = new Date().toISOString().split('T')[0]

  // State
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [materials, setMaterials] = useState([])
  const [inventory, setInventory] = useState({})
  const [message, setMessage] = useState(null)

  // Form state
  const [selectedMaterialId, setSelectedMaterialId] = useState(searchParams.get('materialId') || '')
  const [adjustmentType, setAdjustmentType] = useState('increase')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')

  // Predefined adjustment reasons
  const adjustmentReasons = [
    { value: 'count_correction', label: t('countCorrection', 'Physical Count Correction') },
    { value: 'damage', label: t('damage', 'Damaged Goods') },
    { value: 'theft', label: t('theft', 'Theft/Loss') },
    { value: 'expired', label: t('expired', 'Expired/Spoiled') },
    { value: 'transfer_in', label: t('transferIn', 'Transfer In') },
    { value: 'transfer_out', label: t('transferOut', 'Transfer Out') },
    { value: 'found', label: t('found', 'Found Inventory') },
    { value: 'return_to_vendor', label: t('returnToVendor', 'Return to Vendor') },
    { value: 'sample', label: t('sample', 'Sample/Promotional') },
    { value: 'other', label: t('other', 'Other (specify)') }
  ]

  // Load data
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)

      // Load materials
      const materialsResult = await materialService.getAll()
      const companyMaterials = materialsResult.success ? materialsResult.data : []
      setMaterials(companyMaterials)

      // Load inventory
      const inventoryResult = await inventoryService.getAll()
      const inventoryArray = inventoryResult.success ? inventoryResult.data : []

      // Transform to object keyed by materialId
      const inventoryByMaterial = {}
      for (const item of inventoryArray) {
        const matId = Number(item.materialId)
        if (!inventoryByMaterial[matId]) {
          inventoryByMaterial[matId] = {
            materialId: matId,
            currentStock: 0,
            unit: item.unit
          }
        }
        inventoryByMaterial[matId].currentStock += parseFloat(item.currentStock || item.quantity || 0)
      }
      setInventory(inventoryByMaterial)

    } catch (error) {
      console.error('Error loading data:', error)
      setMessage({ type: 'error', text: 'Failed to load data' })
    } finally {
      setLoading(false)
    }
  }

  // Get selected material info
  const selectedMaterial = materials.find(m => String(m.id) === String(selectedMaterialId))
  const currentStock = inventory[Number(selectedMaterialId)]?.currentStock || 0
  const unit = selectedMaterial?.unit || inventory[Number(selectedMaterialId)]?.unit || 'units'

  // Calculate new stock
  const getNewStock = () => {
    const qty = parseFloat(quantity) || 0
    switch (adjustmentType) {
      case 'increase':
        return currentStock + qty
      case 'decrease':
        return Math.max(0, currentStock - qty)
      case 'set':
        return qty
      default:
        return currentStock
    }
  }

  // Validate form
  const isValid = () => {
    if (!selectedMaterialId) return false
    if (!quantity || parseFloat(quantity) <= 0) return false
    if (!reason) return false
    if (reason === 'other' && !customReason.trim()) return false
    if (adjustmentType === 'decrease' && parseFloat(quantity) > currentStock) return false
    return true
  }

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!isValid()) return

    try {
      setSubmitting(true)

      const qty = parseFloat(quantity)
      const actualReason = reason === 'other' ? customReason : adjustmentReasons.find(r => r.value === reason)?.label || reason

      // Calculate the adjustment quantity (negative for decrease)
      let adjustmentQty = qty
      if (adjustmentType === 'decrease') {
        adjustmentQty = -qty
      } else if (adjustmentType === 'set') {
        adjustmentQty = qty - currentStock
      }

      // Create transaction record
      const transactionData = {
        transactionType: 'adjustment',
        materialId: Number(selectedMaterialId),
        quantity: adjustmentQty,
        unitPrice: selectedMaterial?.standardPrice || 0,
        amount: Math.abs(adjustmentQty) * (selectedMaterial?.standardPrice || 0),
        transactionDate: today,
        description: `Stock ${adjustmentType}: ${actualReason}${notes ? ` - ${notes}` : ''}`,
        referenceType: 'adjustment',
        referenceId: null
      }

      const result = await transactionService.create(transactionData)

      if (result.success) {
        setMessage({ type: 'success', text: t('adjustmentSuccess', 'Stock adjustment recorded successfully') })
        // Reset form
        setQuantity('')
        setReason('')
        setCustomReason('')
        setNotes('')
        // Reload inventory to reflect changes
        await loadData()
        // Show success for 2 seconds then navigate back
        setTimeout(() => navigate('/inventory'), 2000)
      } else {
        throw new Error(result.error || 'Failed to create adjustment')
      }

    } catch (error) {
      console.error('Error creating adjustment:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to create stock adjustment' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="stock-adjustment-page">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="stock-adjustment-page">
      {/* Header */}
      <div className="page-header">
        <div className="header-left">
          <button className="btn btn-ghost" onClick={() => navigate('/inventory')}>
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1>
              <Package size={24} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              {t('stockAdjustment', 'Stock Adjustment')}
            </h1>
            <p>{t('stockAdjustmentDesc', 'Adjust inventory quantities and track reasons')}</p>
          </div>
        </div>
      </div>

      {/* Message Display */}
      {message && (
        <div className={`message ${message.type}`}>
          {message.type === 'success' && <Check size={16} />}
          {message.type === 'error' && <AlertTriangle size={16} />}
          {message.text}
        </div>
      )}

      {/* Main Form */}
      <div className="adjustment-form-container">
        <form onSubmit={handleSubmit} className="adjustment-form">
          {/* Material Selection */}
          <div className="form-section">
            <h3 className="section-title">{t('selectMaterial', 'Select Material')}</h3>
            <div className="form-group">
              <label htmlFor="material">{t('material', 'Material')} *</label>
              <select
                id="material"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                required
              >
                <option value="">{t('selectMaterial', 'Select a material...')}</option>
                {materials.map(material => (
                  <option key={material.id} value={material.id}>
                    {material.code} - {material.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Stock Display */}
            {selectedMaterialId && (
              <div className="current-stock-card">
                <div className="stock-info">
                  <span className="stock-label">{t('currentStock', 'Current Stock')}</span>
                  <span className="stock-value">{currentStock.toFixed(2)} {unit}</span>
                </div>
              </div>
            )}
          </div>

          {/* Adjustment Type */}
          <div className="form-section">
            <h3 className="section-title">{t('adjustmentType', 'Adjustment Type')}</h3>
            <div className="adjustment-type-grid">
              <button
                type="button"
                className={`type-card ${adjustmentType === 'increase' ? 'active increase' : ''}`}
                onClick={() => setAdjustmentType('increase')}
              >
                <Plus size={24} />
                <span>{t('increase', 'Increase')}</span>
                <small>{t('addStock', 'Add to stock')}</small>
              </button>
              <button
                type="button"
                className={`type-card ${adjustmentType === 'decrease' ? 'active decrease' : ''}`}
                onClick={() => setAdjustmentType('decrease')}
              >
                <Minus size={24} />
                <span>{t('decrease', 'Decrease')}</span>
                <small>{t('removeStock', 'Remove from stock')}</small>
              </button>
              <button
                type="button"
                className={`type-card ${adjustmentType === 'set' ? 'active set' : ''}`}
                onClick={() => setAdjustmentType('set')}
              >
                <RefreshCw size={24} />
                <span>{t('setTo', 'Set To')}</span>
                <small>{t('setAbsolute', 'Set absolute value')}</small>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-section">
            <h3 className="section-title">{t('quantity', 'Quantity')}</h3>
            <div className="form-group">
              <label htmlFor="quantity">
                {adjustmentType === 'set'
                  ? t('newQuantity', 'New Quantity')
                  : adjustmentType === 'increase'
                    ? t('quantityToAdd', 'Quantity to Add')
                    : t('quantityToRemove', 'Quantity to Remove')
                } *
              </label>
              <div className="input-with-unit">
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                />
                <span className="unit-suffix">{unit}</span>
              </div>
              {adjustmentType === 'decrease' && parseFloat(quantity) > currentStock && (
                <span className="error-hint">
                  <AlertTriangle size={14} />
                  Cannot remove more than current stock
                </span>
              )}
            </div>

            {/* New Stock Preview */}
            {selectedMaterialId && quantity && (
              <div className="stock-preview">
                <span className="preview-label">{t('newStock', 'New Stock Level')}:</span>
                <span className={`preview-value ${getNewStock() === 0 ? 'warning' : ''}`}>
                  {getNewStock().toFixed(2)} {unit}
                </span>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div className="form-section">
            <h3 className="section-title">{t('reason', 'Reason')}</h3>
            <div className="form-group">
              <label htmlFor="reason">{t('adjustmentReason', 'Adjustment Reason')} *</label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
              >
                <option value="">{t('selectReason', 'Select a reason...')}</option>
                {adjustmentReasons.map(r => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>

            {reason === 'other' && (
              <div className="form-group">
                <label htmlFor="customReason">{t('specifyReason', 'Specify Reason')} *</label>
                <input
                  type="text"
                  id="customReason"
                  value={customReason}
                  onChange={(e) => setCustomReason(e.target.value)}
                  placeholder={t('enterReason', 'Enter adjustment reason...')}
                  required
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-section">
            <h3 className="section-title">{t('additionalNotes', 'Additional Notes')}</h3>
            <div className="form-group">
              <label htmlFor="notes">{t('notes', 'Notes')} ({t('optional', 'optional')})</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder', 'Add any additional details about this adjustment...')}
                rows={3}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="form-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={() => navigate('/inventory')}
              disabled={submitting}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={!isValid() || submitting}
            >
              {submitting ? (
                <>{t('saving', 'Saving...')}</>
              ) : (
                <>
                  <FileText size={16} />
                  {t('recordAdjustment', 'Record Adjustment')}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StockAdjustment
