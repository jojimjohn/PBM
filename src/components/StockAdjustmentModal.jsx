import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import { useLocalization } from '../context/LocalizationContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import transactionService from '../services/transactionService'
import {
  Package,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  Check,
  FileText,
  X
} from 'lucide-react'
/**
 * Stock Adjustment Modal
 * Allows users to adjust inventory quantities with reason tracking
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close handler
 * @param {array} materials - Array of materials to choose from
 * @param {object} inventory - Inventory object keyed by materialId
 * @param {string} preselectedMaterialId - Optional material ID to preselect
 * @param {function} onSuccess - Callback after successful adjustment
 */
const StockAdjustmentModal = ({
  isOpen,
  onClose,
  materials = [],
  inventory = {},
  preselectedMaterialId = '',
  onSuccess
}) => {
  const { t } = useLocalization()
  const { formatDate: systemFormatDate } = useSystemSettings()

  const formatDate = systemFormatDate || ((date) => date ? new Date(date).toLocaleDateString() : '-')
  const today = new Date().toISOString().split('T')[0]

  // Form state
  const [selectedMaterialId, setSelectedMaterialId] = useState(preselectedMaterialId)
  const [adjustmentType, setAdjustmentType] = useState('increase')
  const [quantity, setQuantity] = useState('')
  const [reason, setReason] = useState('')
  const [customReason, setCustomReason] = useState('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState(null)

  // Reset form when modal opens/closes or preselected material changes
  useEffect(() => {
    if (isOpen) {
      setSelectedMaterialId(preselectedMaterialId || '')
      setAdjustmentType('increase')
      setQuantity('')
      setReason('')
      setCustomReason('')
      setNotes('')
      setMessage(null)
    }
  }, [isOpen, preselectedMaterialId])

  // Predefined adjustment reasons with localization
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

  // Get selected material info
  const selectedMaterial = materials.find(m => String(m.id) === String(selectedMaterialId))
  const currentStock = inventory[Number(selectedMaterialId)]?.currentStock || 0
  const unit = selectedMaterial?.unit || inventory[Number(selectedMaterialId)]?.unit || t('units', 'units')

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
      const actualReason = reason === 'other'
        ? customReason
        : adjustmentReasons.find(r => r.value === reason)?.label || reason

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
        description: `${t('stockAdjustment', 'Stock Adjustment')} (${t(adjustmentType, adjustmentType)}): ${actualReason}${notes ? ` - ${notes}` : ''}`,
        referenceType: 'adjustment',
        referenceId: null
      }

      const result = await transactionService.create(transactionData)

      if (result.success) {
        setMessage({ type: 'success', text: t('adjustmentSuccess', 'Stock adjustment recorded successfully') })
        // Call success callback after delay
        setTimeout(() => {
          if (onSuccess) onSuccess()
          onClose()
        }, 1500)
      } else {
        throw new Error(result.error || t('adjustmentFailed', 'Failed to create adjustment'))
      }

    } catch (error) {
      console.error('Error creating adjustment:', error)
      setMessage({ type: 'error', text: error.message || t('adjustmentFailed', 'Failed to create stock adjustment') })
    } finally {
      setSubmitting(false)
    }
  }

  if (!isOpen) return null

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2 text-gray-900">
          <Package size={24} />
          <span>{t('stockAdjustment', 'Stock Adjustment')}</span>
        </div>
      }
      className="max-w-[600px] w-[95vw]"
    >
      <div className="flex flex-col gap-4">
        {/* Message Display */}
        {message && (
          <div className={`flex items-center gap-2 px-4 py-3 rounded-md text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {message.type === 'success' && <Check size={16} />}
            {message.type === 'error' && <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {/* Material Selection */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="material">{t('material', 'Material')} *</label>
              <select
                id="material"
                value={selectedMaterialId}
                onChange={(e) => setSelectedMaterialId(e.target.value)}
                required
                disabled={submitting}
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
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border border-gray-200 rounded-md">
                <span className="text-[0.8125rem] text-gray-600">{t('currentStock', 'Current Stock')}:</span>
                <span className="text-base font-semibold text-gray-900">{currentStock.toFixed(2)} {unit}</span>
              </div>
            )}
          </div>

          {/* Adjustment Type */}
          <div className="form-section">
            <label className="text-sm font-semibold text-gray-700">{t('adjustmentType', 'Adjustment Type')}</label>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <button
                type="button"
                className={`flex flex-col items-center gap-1 py-3 px-4 border-2 rounded-md text-sm font-medium cursor-pointer transition-all disabled:opacity-60 ${adjustmentType === 'increase' ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                onClick={() => setAdjustmentType('increase')}
                disabled={submitting}
              >
                <Plus size={18} />
                <span>{t('increase', 'Increase')}</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center gap-1 py-3 px-4 border-2 rounded-md text-sm font-medium cursor-pointer transition-all disabled:opacity-60 ${adjustmentType === 'decrease' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                onClick={() => setAdjustmentType('decrease')}
                disabled={submitting}
              >
                <Minus size={18} />
                <span>{t('decrease', 'Decrease')}</span>
              </button>
              <button
                type="button"
                className={`flex flex-col items-center gap-1 py-3 px-4 border-2 rounded-md text-sm font-medium cursor-pointer transition-all disabled:opacity-60 ${adjustmentType === 'set' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'}`}
                onClick={() => setAdjustmentType('set')}
                disabled={submitting}
              >
                <RefreshCw size={18} />
                <span>{t('setTo', 'Set To')}</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="quantity">
                {adjustmentType === 'set'
                  ? t('newQuantity', 'New Quantity')
                  : adjustmentType === 'increase'
                    ? t('quantityToAdd', 'Quantity to Add')
                    : t('quantityToRemove', 'Quantity to Remove')
                } *
              </label>
              <div className="flex items-stretch">
                <input
                  type="number"
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  required
                  disabled={submitting}
                  className="flex-1 rounded-r-none"
                />
                <span className="flex items-center px-3 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md text-[0.8125rem] text-gray-600">{unit}</span>
              </div>
              {adjustmentType === 'decrease' && parseFloat(quantity) > currentStock && (
                <span className="flex items-center gap-1.5 text-xs text-red-600 mt-1">
                  <AlertTriangle size={14} />
                  {t('cannotRemoveMoreThanStock', 'Cannot remove more than current stock')}
                </span>
              )}
            </div>

            {/* New Stock Preview */}
            {selectedMaterialId && quantity && (
              <div className="flex items-center justify-between px-3 py-2 bg-blue-50 border border-blue-200 rounded-md">
                <span className="text-[0.8125rem] text-blue-700">{t('newStock', 'New Stock Level')}:</span>
                <span className={`font-semibold ${getNewStock() === 0 ? 'text-amber-600' : 'text-blue-700'}`}>
                  {getNewStock().toFixed(2)} {unit}
                </span>
              </div>
            )}
          </div>

          {/* Reason Selection */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="reason">{t('adjustmentReason', 'Adjustment Reason')} *</label>
              <select
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                required
                disabled={submitting}
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
                  disabled={submitting}
                />
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="notes">{t('notes', 'Notes')} ({t('optional', 'optional')})</label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t('notesPlaceholder', 'Add any additional details about this adjustment...')}
                rows={2}
                disabled={submitting}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2">
            <button
              type="button"
              className="btn btn-outline flex items-center gap-1.5"
              onClick={onClose}
              disabled={submitting}
            >
              <X size={16} />
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary flex items-center gap-1.5"
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
    </Modal>
  )
}

export default StockAdjustmentModal
