/**
 * Profile Modal
 *
 * Self-service profile management for all authenticated users.
 * Allows editing personal information and changing password.
 * Uses Tailwind CSS for consistent styling.
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
      <div className="space-y-6">
        {/* Tab Navigation - Using global tab styles */}
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'info' ? 'active' : ''}`}
            onClick={() => setActiveTab('info')}
          >
            <User size={16} />
            {t('personalInfo', 'Personal Info')}
          </button>
          <button
            className={`tab-btn ${activeTab === 'security' ? 'active' : ''}`}
            onClick={() => setActiveTab('security')}
          >
            <Lock size={16} />
            {t('security', 'Security')}
          </button>
        </div>

        {/* Personal Info Tab */}
        {activeTab === 'info' && (
          <form onSubmit={handleInfoSubmit} className="space-y-5">
            {infoMessage && (
              <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                infoMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {infoMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {infoMessage.text}
              </div>
            )}

            {/* Username (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="username" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <AtSign size={14} className="text-slate-400" />
                {t('username', 'Username')}
              </label>
              <input
                type="text"
                id="username"
                value={user?.username ? `@${user.username}` : ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
            </div>

            {/* Email (Read-only) */}
            <div className="space-y-2">
              <label htmlFor="email" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <Mail size={14} className="text-slate-400" />
                {t('email', 'Email')}
              </label>
              <input
                type="email"
                id="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <p className="text-xs text-slate-400">{t('emailCannotBeChanged', 'Email cannot be changed')}</p>
            </div>

            {/* First Name */}
            <div className="space-y-2">
              <label htmlFor="firstName" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <User size={14} className="text-slate-400" />
                {t('firstName', 'First Name')}
              </label>
              <input
                type="text"
                id="firstName"
                value={infoData.firstName}
                onChange={(e) => setInfoData({ ...infoData, firstName: e.target.value })}
                disabled={infoLoading}
                className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  infoErrors.firstName
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {infoErrors.firstName && <p className="text-xs text-red-500">{infoErrors.firstName}</p>}
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <label htmlFor="lastName" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                <User size={14} className="text-slate-400" />
                {t('lastName', 'Last Name')}
              </label>
              <input
                type="text"
                id="lastName"
                value={infoData.lastName}
                onChange={(e) => setInfoData({ ...infoData, lastName: e.target.value })}
                disabled={infoLoading}
                className={`w-full px-4 py-2.5 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                  infoErrors.lastName
                    ? 'border-red-300 bg-red-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              />
              {infoErrors.lastName && <p className="text-xs text-red-500">{infoErrors.lastName}</p>}
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
                    <RefreshCw size={16} className="animate-spin" />
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
          <div className="space-y-6">
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
                <div className="space-y-3">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Shield size={16} className="text-slate-500" />
                    {t('twoFactorAuthentication', 'Two-Factor Authentication')}
                  </h4>
                  <button
                    type="button"
                    className={`w-full flex items-center gap-4 p-4 rounded-lg border-2 transition-all hover:shadow-md cursor-pointer ${
                      mfaStatus?.enabled
                        ? 'border-emerald-200 bg-emerald-50 hover:border-emerald-300'
                        : 'border-slate-200 bg-slate-50 hover:border-slate-300'
                    }`}
                    onClick={() => setShowMfaSetup(true)}
                  >
                    <div className={`flex items-center justify-center w-12 h-12 rounded-full ${
                      mfaStatus?.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'
                    }`}>
                      {mfaLoading ? (
                        <RefreshCw size={24} className="animate-spin" />
                      ) : mfaStatus?.enabled ? (
                        <ShieldCheck size={24} />
                      ) : (
                        <ShieldOff size={24} />
                      )}
                    </div>
                    <div className="flex-1 text-left">
                      <span className={`block font-semibold ${mfaStatus?.enabled ? 'text-emerald-700' : 'text-slate-700'}`}>
                        {mfaLoading
                          ? t('loading', 'Loading...')
                          : mfaStatus?.enabled
                            ? t('mfaEnabled', 'MFA Enabled')
                            : t('mfaDisabled', 'MFA Disabled')
                        }
                      </span>
                      <span className="block text-sm text-slate-500">
                        {mfaStatus?.enabled
                          ? t('mfaEnabledDescription', 'Your account is protected with two-factor authentication')
                          : t('mfaDisabledDescription', 'Add an extra layer of security to your account')
                        }
                      </span>
                    </div>
                    <ChevronRight size={20} className="text-slate-400" />
                  </button>
                </div>

                {/* Change Password Section */}
                <div className="space-y-4">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Key size={16} className="text-slate-500" />
                    {t('changePassword', 'Change Password')}
                  </h4>

                  <form onSubmit={handlePasswordSubmit} className="space-y-4">
                    {passwordMessage && (
                      <div className={`flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
                        passwordMessage.type === 'success'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {passwordMessage.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                        {passwordMessage.text}
                      </div>
                    )}

                    {/* Current Password */}
                    <div className="space-y-2">
                      <label htmlFor="currentPassword" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        <Lock size={14} className="text-slate-400" />
                        {t('currentPassword', 'Current Password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.current ? 'text' : 'password'}
                          id="currentPassword"
                          value={passwordData.currentPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                          disabled={passwordLoading}
                          className={`w-full px-4 py-2.5 pr-12 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                            passwordErrors.currentPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          autoComplete="current-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => togglePasswordVisibility('current')}
                          tabIndex={-1}
                        >
                          {showPasswords.current ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordErrors.currentPassword && <p className="text-xs text-red-500">{passwordErrors.currentPassword}</p>}
                    </div>

                    {/* New Password */}
                    <div className="space-y-2">
                      <label htmlFor="newPassword" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        <Key size={14} className="text-slate-400" />
                        {t('newPassword', 'New Password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.new ? 'text' : 'password'}
                          id="newPassword"
                          value={passwordData.newPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                          disabled={passwordLoading}
                          className={`w-full px-4 py-2.5 pr-12 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                            passwordErrors.newPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => togglePasswordVisibility('new')}
                          tabIndex={-1}
                        >
                          {showPasswords.new ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && <p className="text-xs text-red-500">{passwordErrors.newPassword}</p>}

                      {/* Password Strength Indicator */}
                      {passwordData.newPassword && (
                        <div className="space-y-2 pt-2">
                          <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                            <div
                              className="h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${passwordStrength}%`,
                                backgroundColor: passwordStrength < 40 ? '#ef4444' : passwordStrength < 80 ? '#f59e0b' : '#22c55e'
                              }}
                            />
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {[
                              { key: 'minLength', label: '8+ chars' },
                              { key: 'hasUppercase', label: 'A-Z' },
                              { key: 'hasLowercase', label: 'a-z' },
                              { key: 'hasNumber', label: '0-9' },
                              { key: 'hasSpecial', label: '@$!%*?&' }
                            ].map(({ key, label }) => (
                              <span
                                key={key}
                                className={`text-xs px-2 py-0.5 rounded ${
                                  checks[key]
                                    ? 'bg-emerald-100 text-emerald-700'
                                    : 'bg-slate-100 text-slate-400'
                                }`}
                              >
                                {checks[key] && <span className="mr-1">✓</span>}
                                {label}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Confirm Password */}
                    <div className="space-y-2">
                      <label htmlFor="confirmPassword" className="flex items-center gap-2 text-xs font-medium text-slate-500 uppercase tracking-wide">
                        <Key size={14} className="text-slate-400" />
                        {t('confirmPassword', 'Confirm Password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showPasswords.confirm ? 'text' : 'password'}
                          id="confirmPassword"
                          value={passwordData.confirmPassword}
                          onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                          disabled={passwordLoading}
                          className={`w-full px-4 py-2.5 pr-12 border rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
                            passwordErrors.confirmPassword
                              ? 'border-red-300 bg-red-50'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                          onClick={() => togglePasswordVisibility('confirm')}
                          tabIndex={-1}
                        >
                          {showPasswords.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && <p className="text-xs text-red-500">{passwordErrors.confirmPassword}</p>}
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
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
                            <RefreshCw size={16} className="animate-spin" />
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
