/**
 * Profile Modal
 *
 * Self-service profile management for all authenticated users.
 * Allows editing personal information and changing password.
 */

import React, { useState, useEffect } from 'react'
import { useLocalization } from '../context/LocalizationContext'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'
import Modal from './ui/Modal'
import MFASetup from './MFASetup'
import {
  User,
  Key,
  Eye,
  EyeOff,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Lock,
  Mail,
  Save,
  Shield,
  ShieldCheck,
  ShieldOff,
  ChevronRight,
  AtSign
} from 'lucide-react'
// CSS moved to global index.css Tailwind

const ProfileModal = ({ isOpen, onClose }) => {
  const { t } = useLocalization()
  const { user, refreshUser } = useAuth()

  // Active tab state
  const [activeTab, setActiveTab] = useState('info')

  // Personal info form state
  const [infoData, setInfoData] = useState({
    firstName: '',
    lastName: ''
  })
  const [infoErrors, setInfoErrors] = useState({})
  const [infoLoading, setInfoLoading] = useState(false)
  const [infoMessage, setInfoMessage] = useState(null)

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordErrors, setPasswordErrors] = useState({})
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [passwordMessage, setPasswordMessage] = useState(null)
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  })

  // MFA state
  const [showMfaSetup, setShowMfaSetup] = useState(false)
  const [mfaStatus, setMfaStatus] = useState(null)
  const [mfaLoading, setMfaLoading] = useState(false)

  // Load MFA status
  const loadMfaStatus = async () => {
    setMfaLoading(true)
    try {
      const status = await authService.getMfaStatus()
      setMfaStatus(status)
    } catch (err) {
      console.error('Failed to load MFA status:', err)
    } finally {
      setMfaLoading(false)
    }
  }

  // Reset form when modal opens/closes
  useEffect(() => {
    if (isOpen && user) {
      // Parse name into first and last (handle full name format)
      const nameParts = (user.name || '').split(' ')
      setInfoData({
        firstName: user.firstName || nameParts[0] || '',
        lastName: user.lastName || nameParts.slice(1).join(' ') || ''
      })
      setInfoErrors({})
      setInfoMessage(null)

      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
      setPasswordErrors({})
      setPasswordMessage(null)
      setActiveTab('info')
      setShowMfaSetup(false)

      // Load MFA status
      loadMfaStatus()
    }
  }, [isOpen, user])

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

  // Validate personal info
  const validateInfo = () => {
    const errors = {}
    if (!infoData.firstName.trim()) {
      errors.firstName = t('firstNameRequired', 'First name is required')
    }
    if (!infoData.lastName.trim()) {
      errors.lastName = t('lastNameRequired', 'Last name is required')
    }
    setInfoErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Validate password change
  const validatePasswordChange = () => {
    const errors = {}

    if (!passwordData.currentPassword) {
      errors.currentPassword = t('currentPasswordRequired', 'Current password is required')
    }

    if (!passwordData.newPassword) {
      errors.newPassword = t('newPasswordRequired', 'New password is required')
    } else {
      const checks = validatePassword(passwordData.newPassword)
      if (!Object.values(checks).every(Boolean)) {
        errors.newPassword = t('passwordRequirements', 'Password must be at least 8 characters with uppercase, lowercase, number, and special character')
      }
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      errors.confirmPassword = t('passwordMismatch', 'Passwords do not match')
    }

    if (passwordData.currentPassword === passwordData.newPassword && passwordData.newPassword) {
      errors.newPassword = t('passwordSameAsCurrent', 'New password must be different from current password')
    }

    setPasswordErrors(errors)
    return Object.keys(errors).length === 0
  }

  // Handle profile info update
  const handleInfoSubmit = async (e) => {
    e.preventDefault()

    if (!validateInfo()) return

    try {
      setInfoLoading(true)
      setInfoMessage(null)

      const result = await authService.updateProfile({
        firstName: infoData.firstName.trim(),
        lastName: infoData.lastName.trim()
      })

      if (result.success) {
        setInfoMessage({ type: 'success', text: t('profileUpdated', 'Profile updated successfully') })
        // Refresh user data in context
        if (refreshUser) {
          await refreshUser()
        }
      } else {
        setInfoMessage({ type: 'error', text: result.error || t('profileUpdateFailed', 'Failed to update profile') })
      }
    } catch (error) {
      setInfoMessage({ type: 'error', text: error.message || t('profileUpdateFailed', 'Failed to update profile') })
    } finally {
      setInfoLoading(false)
    }
  }

  // Handle password change
  const handlePasswordSubmit = async (e) => {
    e.preventDefault()

    if (!validatePasswordChange()) return

    try {
      setPasswordLoading(true)
      setPasswordMessage(null)

      const result = await authService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      )

      if (result.success) {
        setPasswordMessage({ type: 'success', text: t('passwordChanged', 'Password changed successfully') })
        // Clear password fields
        setPasswordData({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        })
      } else {
        setPasswordMessage({ type: 'error', text: result.error || t('passwordChangeFailed', 'Failed to change password') })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: error.message || t('passwordChangeFailed', 'Failed to change password') })
    } finally {
      setPasswordLoading(false)
    }
  }

  const togglePasswordVisibility = (field) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }))
  }

  const passwordStrength = getPasswordStrength(passwordData.newPassword)
  const checks = validatePassword(passwordData.newPassword)

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('profile', 'Profile')}
      size="md"
    >
      <div className="profile-modal">
        {/* Tab Navigation */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={16} />
            {t('personalInfo', 'Personal Info')}
          </button>
          <button
            className={`profile-tab ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={16} />
            {t('security', 'Security')}
          </button>
        </div>

        {/* Personal Info Tab */}
        {activeTab === 'info' && (
          <form onSubmit={handleInfoSubmit} className="profile-form">
            {infoMessage && (
              <div className={`message-banner ${infoMessage.type}`}>
                {infoMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {infoMessage.text}
              </div>
            )}

            {/* Username (Read-only) */}
            <div className="form-group">
              <label htmlFor="username">
                <AtSign size={16} />
                {t('username', 'Username')}
              </label>
              <input
                type="text"
                id="username"
                value={user?.username ? `@${user.username}` : ''}
                disabled
                className="readonly-input"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} />
                {t('email', 'Email')}
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="readonly-input"
              />
              <span className="help-text">{t('emailCannotBeChanged', 'Email cannot be changed')}</span>
            </div>

            {/* First Name */}
            <div className="form-group">
              <label htmlFor="firstName">
                <User size={16} />
                {t('firstName', 'First Name')}
              </label>
              <input
                type="text"
                id="firstName"
                value={infoData.firstName}
                onChange={(e) => setInfoData({ ...infoData, firstName: e.target.value })}
                disabled={infoLoading}
                className={infoErrors.firstName ? 'error' : ''}
              />
              {infoErrors.firstName && <span className="error-text">{infoErrors.firstName}</span>}
            </div>

            {/* Last Name */}
            <div className="form-group">
              <label htmlFor="lastName">
                <User size={16} />
                {t('lastName', 'Last Name')}
              </label>
              <input
                type="text"
                id="lastName"
                value={infoData.lastName}
                onChange={(e) => setInfoData({ ...infoData, lastName: e.target.value })}
                disabled={infoLoading}
                className={infoErrors.lastName ? 'error' : ''}
              />
              {infoErrors.lastName && <span className="error-text">{infoErrors.lastName}</span>}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-outline"
                onClick={onClose}
                disabled={infoLoading}
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={infoLoading}
              >
                {infoLoading ? (
                  <>
                    <RefreshCw size={16} className="spinning" />
                    {t('saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {t('saveChanges', 'Save Changes')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="security-tab-content">
            {showMfaSetup ? (
              /* MFA Setup Modal View */
              <div className="mfa-setup-container">
                <MFASetup
                  onClose={() => {
                    setShowMfaSetup(false)
                    loadMfaStatus()
                  }}
                  onStatusChange={(enabled) => {
                    setMfaStatus(prev => ({ ...prev, enabled }))
                  }}
                />
              </div>
            ) : (
              /* Security Settings Overview */
              <>
                {/* Two-Factor Authentication Section */}
                <div className="security-section">
                  <h4 className="security-section-title">
                    <Shield size={18} />
                    {t('twoFactorAuthentication', 'Two-Factor Authentication')}
                  </h4>
                  <div
                    className={`mfa-status-card ${mfaStatus?.enabled ? 'enabled' : 'disabled'}`}
                    onClick={() => setShowMfaSetup(true)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && setShowMfaSetup(true)}
                  >
                    <div className="mfa-status-icon">
                      {mfaLoading ? (
                        <RefreshCw size={24} className="spinning" />
                      ) : mfaStatus?.enabled ? (
                        <ShieldCheck size={24} />
                      ) : (
                        <ShieldOff size={24} />
                      )}
                    </div>
                    <div className="mfa-status-info">
                      <span className="mfa-status-label">
                        {mfaLoading
                          ? t('loading', 'Loading...')
                          : mfaStatus?.enabled
                            ? t('mfaEnabled', 'MFA Enabled')
                            : t('mfaDisabled', 'MFA Disabled')
                        }
                      </span>
                      <span className="mfa-status-description">
                        {mfaStatus?.enabled
                          ? t('mfaEnabledDescription', 'Your account is protected with two-factor authentication')
                          : t('mfaDisabledDescription', 'Add an extra layer of security to your account')
                        }
                      </span>
                    </div>
                    <ChevronRight size={20} className="mfa-chevron" />
                  </div>
                </div>

                {/* Change Password Section */}
                <div className="security-section">
                  <h4 className="security-section-title">
                    <Key size={18} />
                    {t('changePassword', 'Change Password')}
                  </h4>
                  <form onSubmit={handlePasswordSubmit} className="profile-form">
                    {passwordMessage && (
                      <div className={`message-banner ${passwordMessage.type}`}>
                        {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {passwordMessage.text}
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
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          disabled={passwordLoading}
                          className={passwordErrors.currentPassword ? 'error' : ''}
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
                      {passwordErrors.currentPassword && <span className="error-text">{passwordErrors.currentPassword}</span>}
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
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          disabled={passwordLoading}
                          className={passwordErrors.newPassword ? 'error' : ''}
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
                      {passwordErrors.newPassword && <span className="error-text">{passwordErrors.newPassword}</span>}

                      {/* Password Strength Indicator */}
                      {passwordData.newPassword && (
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
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          disabled={passwordLoading}
                          className={passwordErrors.confirmPassword ? 'error' : ''}
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
                      {passwordErrors.confirmPassword && <span className="error-text">{passwordErrors.confirmPassword}</span>}
                    </div>

                    <div className="modal-actions">
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={onClose}
                        disabled={passwordLoading}
                      >
                        {t('cancel', 'Cancel')}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={passwordLoading}
                      >
                        {passwordLoading ? (
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
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </Modal>
  )
}

export default ProfileModal
