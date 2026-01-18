/**
 * Change Password Modal
 *
 * Self-service password change for all authenticated users.
 * Requires current password verification for security.
 */

import React, { useState, useEffect } from 'react'
import { useLocalization } from '../context/LocalizationContext'
import authService from '../services/authService'
import Modal from './ui/Modal'
import {
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Lock
} from 'lucide-react'
// CSS moved to global index.css Tailwind

const ChangePasswordModal = ({ isOpen, onClose }) => {
  const { t } = useLocalization()

  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setErrors({})
      setMessage(null)
    }
  }, [isOpen])

  // Password strength validation
  const validatePassword = (password) => {
    const checks = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[@$!%*?&]/.test(password)
    }
    return checks
  }

  const getPasswordStrength = (password) => {
    if (!password) return 0
    const checks = validatePassword(password)
    const passed = Object.values(checks).filter(Boolean).length
    return (passed / 5) * 100
  }

  const validate = () => {
    const newErrors = {}

    if (!formData.currentPassword) {
      newErrors.currentPassword = t('currentPasswordRequired', 'Current password is required')
    }

    if (!formData.newPassword) {
      newErrors.newPassword = t('newPasswordRequired', 'New password is required')
    } else {
      const checks = validatePassword(formData.newPassword)
      if (!Object.values(checks).every(Boolean)) {
        newErrors.newPassword = t('passwordRequirements', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      }
    }

    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = t('passwordMismatch', 'Passwords do not match')
    }

    if (formData.currentPassword === formData.newPassword && formData.newPassword) {
      newErrors.newPassword = t('passwordSameAsCurrent', 'New password must be different from current password')
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!validate()) return

    try {
      setLoading(true)
      setMessage(null)

      const result = await authService.changePassword(
        formData.currentPassword,
        formData.newPassword
      )

      if (result.success) {
        setMessage({ type: 'success', text: t('passwordChanged', 'Password changed successfully') })
        // Auto close after success
        setTimeout(() => {
          onClose()
        }, 2000)
      } else {
        setMessage({ type: 'error', text: result.error || t('passwordChangeFailed', 'Failed to change password') })
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || t('passwordChangeFailed', 'Failed to change password') })
    } finally {
      setLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const passwordStrength = getPasswordStrength(formData.newPassword)
  const checks = validatePassword(formData.newPassword)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('changePassword', 'Change Password')}
      size="sm"
    >
      <form onSubmit={handleSubmit} className="change-password-form">
        {message && (
          <div className={`message-banner ${message.type}`}>
            {message.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
            {message.text}
          </div>
        )}

        {/* Current Password */}
        <div className="form-group">
          <label htmlFor="currentPassword">
            <Lock size={16} />
            {t('currentPassword', 'Current Password')}
          </label>
          <div className="password-input">
            <input
              type={showPasswords.current ? 'text' : 'password'}
              id="currentPassword"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              disabled={loading}
              className={errors.currentPassword ? 'error' : ''}
              autoComplete="current-password"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => togglePasswordVisibility('current')}
              tabIndex={-1}
            >
              {showPasswords.current ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.currentPassword && <span className="error-text">{errors.currentPassword}</span>}
        </div>

        {/* New Password */}
        <div className="form-group">
          <label htmlFor="newPassword">
            <Key size={16} />
            {t('newPassword', 'New Password')}
          </label>
          <div className="password-input">
            <input
              type={showPasswords.new ? 'text' : 'password'}
              id="newPassword"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              disabled={loading}
              className={errors.newPassword ? 'error' : ''}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => togglePasswordVisibility('new')}
              tabIndex={-1}
            >
              {showPasswords.new ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.newPassword && <span className="error-text">{errors.newPassword}</span>}

          {/* Password Strength Indicator */}
          {formData.newPassword && (
            <div className="password-strength">
              <div className="strength-bar">
                <div
                  className="strength-fill"
                  style={{
                    width: `${passwordStrength}%`,
                    backgroundColor: passwordStrength < 40 ? '#ef4444' : passwordStrength < 80 ? '#f59e0b' : '#22c55e'
                  }}
                />
              </div>
              <div className="strength-checks">
                <span className={checks.minLength ? 'valid' : 'invalid'}>8+ chars</span>
                <span className={checks.hasUppercase ? 'valid' : 'invalid'}>A-Z</span>
                <span className={checks.hasLowercase ? 'valid' : 'invalid'}>a-z</span>
                <span className={checks.hasNumber ? 'valid' : 'invalid'}>0-9</span>
                <span className={checks.hasSpecial ? 'valid' : 'invalid'}>@$!%*?&</span>
              </div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div className="form-group">
          <label htmlFor="confirmPassword">
            <Key size={16} />
            {t('confirmPassword', 'Confirm Password')}
          </label>
          <div className="password-input">
            <input
              type={showPasswords.confirm ? 'text' : 'password'}
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              disabled={loading}
              className={errors.confirmPassword ? 'error' : ''}
              autoComplete="new-password"
            />
            <button
              type="button"
              className="toggle-visibility"
              onClick={() => togglePasswordVisibility('confirm')}
              tabIndex={-1}
            >
              {showPasswords.confirm ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          {errors.confirmPassword && <span className="error-text">{errors.confirmPassword}</span>}
        </div>

        <div className="modal-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={onClose}
            disabled={loading}
          >
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="spinning" />
                {t('changing', 'Changing...')}
              </>
            ) : (
              <>
                <Key size={16} />
                {t('changePassword', 'Change Password')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default ChangePasswordModal
