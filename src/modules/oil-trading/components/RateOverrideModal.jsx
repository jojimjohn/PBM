/**
 * Rate Override Modal Component
 *
 * Modal for requesting manager approval to override contracted rates.
 * Enforces rate change governance for contract customers.
 *
 * @module components/RateOverrideModal
 */

import React, { useState, useCallback } from 'react'
import { Shield } from 'lucide-react'
import Modal from '../../../components/ui/Modal'
import Input, { Textarea } from '../../../components/ui/Input'

/**
 * @typedef {Object} OverrideRequest
 * @property {number} itemIndex - Index of item being overridden
 * @property {number|string} materialId - Material reference
 * @property {string} [materialName] - Material display name
 * @property {number} contractRate - Current contract rate
 * @property {number} requestedRate - Requested new rate
 * @property {Object} [material] - Full material object
 */

/**
 * @typedef {Object} OverrideResult
 * @property {number} itemIndex - Item that was approved
 * @property {number} approvedRate - Rate that was approved
 * @property {string} reason - Justification for override
 * @property {number} originalRate - Original contract rate
 * @property {string} approvedBy - Approver name
 * @property {string} approvedAt - Approval timestamp
 */

/**
 * Rate Override Modal Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {OverrideRequest} props.override - Override request details
 * @param {Function} props.onApprove - Approval handler (reason, password) => void
 * @param {Function} props.onCancel - Cancel handler
 * @param {string} [props.approverPassword='manager123'] - Required password for demo
 * @param {Function} [props.t] - Translation function
 */
const RateOverrideModal = ({
  isOpen,
  override,
  onApprove,
  onCancel,
  approverPassword = 'manager123',
  t = (key, fallback) => fallback || key
}) => {
  const [reason, setReason] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  /**
   * Handle form submission
   */
  const handleSubmit = useCallback((e) => {
    e.preventDefault()
    setError('')

    // Validate reason
    if (!reason.trim()) {
      setError(t('reasonRequired', 'Please provide a reason for the override'))
      return
    }

    // Validate password
    if (password !== approverPassword) {
      setError(t('invalidCredentials', 'Invalid approver credentials'))
      return
    }

    // Call approval handler
    onApprove(reason.trim(), password)

    // Reset form
    setReason('')
    setPassword('')
  }, [reason, password, approverPassword, onApprove, t])

  /**
   * Handle cancel
   */
  const handleCancel = useCallback(() => {
    setReason('')
    setPassword('')
    setError('')
    onCancel()
  }, [onCancel])

  if (!override) return null

  const { material, contractRate, requestedRate } = override
  const difference = requestedRate - contractRate
  const isIncrease = difference > 0

  const modalTitle = (
    <span className="flex items-center gap-2">
      <Shield size={20} className="text-amber-500" />
      {t('rateOverrideRequired', 'Rate Override Required')}
    </span>
  )

  const modalFooter = (
    <>
      <button
        type="button"
        className="btn btn-outline"
        onClick={handleCancel}
      >
        {t('cancel', 'Cancel')}
      </button>
      <button
        type="submit"
        form="rate-override-form"
        className="btn btn-warning"
      >
        <Shield size={16} />
        {t('approveOverride', 'Approve Override')}
      </button>
    </>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      title={modalTitle}
      description={t('managerApprovalNeeded', 'Manager approval needed to change contracted rate')}
      footer={modalFooter}
      size="md"
    >
      {/* Rate Details */}
      <div className="bg-slate-50 border border-slate-200 p-4 mb-6" style={{ borderRadius: 0 }}>
        <div className="flex justify-between py-2 border-b border-slate-200">
          <span className="text-slate-600">{t('material', 'Material')}:</span>
          <span className="font-semibold">{material?.name || t('unknownMaterial', 'Unknown Material')}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-200">
          <span className="text-slate-600">{t('contractRate', 'Contract Rate')}:</span>
          <span className="font-semibold text-emerald-600">OMR {contractRate.toFixed(3)}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-slate-200">
          <span className="text-slate-600">{t('requestedRate', 'Requested Rate')}:</span>
          <span className="font-semibold text-blue-600">OMR {requestedRate.toFixed(3)}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-slate-600">{t('difference', 'Difference')}:</span>
          <span className={`font-semibold ${isIncrease ? 'text-red-600' : 'text-emerald-600'}`}>
            {isIncrease ? '+' : ''}OMR {difference.toFixed(3)}
            <span className="text-sm opacity-80 ml-1">
              ({isIncrease ? '+' : ''}{((difference / contractRate) * 100).toFixed(1)}%)
            </span>
          </span>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 text-red-700 border border-red-200 p-3 mb-4" style={{ borderRadius: 0 }}>
          {error}
        </div>
      )}

      {/* Override Form */}
      <form id="rate-override-form" onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div className="form-group">
            <Textarea
              label={t('reasonForOverride', 'Reason for Override')}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t('overrideReasonPlaceholder', 'Please provide justification for rate change...')}
              required
              rows={3}
            />
          </div>

          <div className="form-group">
            <Input
              label={t('managerPassword', 'Manager Password')}
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t('enterManagerPassword', 'Enter manager password')}
              required
            />
            <small className="text-slate-500 text-sm mt-1 block">
              {t('demoPassword', 'Demo password: manager123')}
            </small>
          </div>
        </div>
      </form>
    </Modal>
  )
}

export default RateOverrideModal
