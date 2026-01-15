/**
 * Rate Override Modal Component
 *
 * Modal for requesting manager approval to override contracted rates.
 * Enforces rate change governance for contract customers.
 *
 * @module components/RateOverrideModal
 */

import React, { useState, useCallback } from 'react'
import { Shield, X } from 'lucide-react'
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

  if (!isOpen || !override) return null

  const { material, contractRate, requestedRate } = override
  const difference = requestedRate - contractRate
  const isIncrease = difference > 0

  return (
    <div className="override-modal-backdrop" onClick={handleCancel}>
      <div className="override-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="override-modal-header">
          <div className="override-icon">
            <Shield size={24} />
          </div>
          <h3>{t('rateOverrideRequired', 'Rate Override Required')}</h3>
          <p>{t('managerApprovalNeeded', 'Manager approval needed to change contracted rate')}</p>
          <button
            className="override-close-btn"
            onClick={handleCancel}
            type="button"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Rate Details */}
        <div className="override-details">
          <div className="override-item">
            <label>{t('material', 'Material')}:</label>
            <span>{material?.name || t('unknownMaterial', 'Unknown Material')}</span>
          </div>
          <div className="override-item">
            <label>{t('contractRate', 'Contract Rate')}:</label>
            <span className="contract-rate">OMR {contractRate.toFixed(3)}</span>
          </div>
          <div className="override-item">
            <label>{t('requestedRate', 'Requested Rate')}:</label>
            <span className="requested-rate">OMR {requestedRate.toFixed(3)}</span>
          </div>
          <div className="override-item">
            <label>{t('difference', 'Difference')}:</label>
            <span className={isIncrease ? 'increase' : 'decrease'}>
              {isIncrease ? '+' : ''}OMR {difference.toFixed(3)}
              <span className="percentage">
                ({isIncrease ? '+' : ''}{((difference / contractRate) * 100).toFixed(1)}%)
              </span>
            </span>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="override-error">
            {error}
          </div>
        )}

        {/* Override Form */}
        <form onSubmit={handleSubmit}>
          <div className="override-form">
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
              <small className="password-hint">
                {t('demoPassword', 'Demo password: manager123')}
              </small>
            </div>
          </div>

          {/* Actions */}
          <div className="override-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleCancel}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-warning">
              <Shield size={16} />
              {t('approveOverride', 'Approve Override')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

/**
 * CSS styles for override modal (to be added to SalesOrderForm.css)
 *
 * .override-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
 * .override-modal { background: white; border-radius: 12px; padding: 24px; max-width: 480px; width: 90%; }
 * .override-modal-header { text-align: center; margin-bottom: 20px; position: relative; }
 * .override-close-btn { position: absolute; top: 0; right: 0; background: none; border: none; cursor: pointer; }
 * .override-icon { width: 48px; height: 48px; border-radius: 50%; background: #fff3cd; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; color: #856404; }
 * .override-details { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 20px; }
 * .override-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e9ecef; }
 * .override-item:last-child { border-bottom: none; }
 * .override-error { background: #f8d7da; color: #721c24; padding: 12px; border-radius: 4px; margin-bottom: 16px; }
 * .override-form { margin-bottom: 20px; }
 * .override-actions { display: flex; gap: 12px; justify-content: flex-end; }
 * .contract-rate { color: #28a745; font-weight: 600; }
 * .requested-rate { color: #007bff; font-weight: 600; }
 * .increase { color: #dc3545; }
 * .decrease { color: #28a745; }
 * .percentage { font-size: 0.85em; opacity: 0.8; margin-left: 4px; }
 * .password-hint { color: #6c757d; font-size: 0.85em; margin-top: 4px; }
 */

export default RateOverrideModal
