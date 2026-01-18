import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { AlertCircle, Loader2, Shield, Lock, ChevronDown, Sun, Moon } from 'lucide-react'
// CSS in global index.css Tailwind

const LoginForm = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [selectedCompanyId, setSelectedCompanyId] = useState('al-ramrami')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const { t } = useLocalization()
  const { theme, toggleTheme } = useSystemSettings()

  // MFA state
  const [mfaCode, setMfaCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const mfaInputRef = useRef(null)

  const { login, verifyMfa, pendingMfa, clearPendingMfa } = useAuth()

  const showMfaStep = !!pendingMfa

  // Available companies
  const companies = [
    { id: 'al-ramrami', name: 'Al Ramrami Enterprises', type: 'Oil Business' },
    { id: 'pride-muscat', name: 'Pride Muscat International LLC', type: 'Scrap Business' }
  ]

  useEffect(() => {
    if (showMfaStep && mfaInputRef.current) {
      mfaInputRef.current.focus()
    }
  }, [showMfaStep])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!email || !password || !selectedCompanyId) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      const result = await login(email, password, selectedCompanyId)

      if (result.success) {
        if (result.requiresMfa) {
          setMfaCode('')
          setIsLoading(false)
          return
        }
      } else {
        setError(result.error || 'Invalid credentials. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
      setError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleMfaSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!mfaCode) {
      setError('Please enter your authentication code')
      return
    }

    if (!useBackupCode && !/^\d{6}$/.test(mfaCode)) {
      setError('Please enter a valid 6-digit code')
      return
    }

    setIsLoading(true)

    try {
      const result = await verifyMfa(
        pendingMfa.userId,
        pendingMfa.companyId,
        mfaCode,
        useBackupCode
      )

      if (!result.success) {
        setError(result.error || 'Invalid code. Please try again.')
      }
    } catch (error) {
      setError(error.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    clearPendingMfa()
    setMfaCode('')
    setUseBackupCode(false)
    setError('')
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  // MFA Verification Step
  if (showMfaStep) {
    return (
      <div className="login-page">
        <div className="login-card">
          {/* Header */}
          <div className="login-header">
            <div className="login-logo">
              <div className="login-logo-icon">
                <Shield size={24} className="text-white" />
              </div>
              <div className="login-logo-text">
                <span className="login-title">SECURE ACCESS</span>
                <span className="login-subtitle">TWO-FACTOR AUTHENTICATION</span>
              </div>
            </div>
            <div className="login-divider" />
          </div>

          {/* MFA Form */}
          <form onSubmit={handleMfaSubmit} className="login-form">
            <div className="login-field">
              <label className="login-label">
                {useBackupCode ? t('backupCode', 'BACKUP CODE') : t('authenticationCode', 'AUTHENTICATION CODE')}
              </label>
              <input
                ref={mfaInputRef}
                type="text"
                value={mfaCode}
                onChange={(e) => {
                  const value = useBackupCode
                    ? e.target.value.toUpperCase()
                    : e.target.value.replace(/\D/g, '').slice(0, 6)
                  setMfaCode(value)
                }}
                placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                className="login-input text-center text-2xl tracking-widest font-mono"
                maxLength={useBackupCode ? 9 : 6}
                autoComplete="one-time-code"
                required
              />
            </div>

            {error && (
              <div className="login-error">
                <AlertCircle size={18} />
                <span>{error.toUpperCase()}</span>
              </div>
            )}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>{t('verifying', 'VERIFYING...')}</span>
                </>
              ) : (
                <span>{t('verifyAndSignIn', 'VERIFY & SIGN IN')}</span>
              )}
            </button>

            <div className="login-mfa-options">
              <button
                type="button"
                onClick={() => {
                  setUseBackupCode(!useBackupCode)
                  setMfaCode('')
                  setError('')
                }}
                className="login-link"
              >
                {useBackupCode ? t('useAuthenticator', 'Use authenticator app') : t('useBackupCode', 'Use backup code')}
              </button>
              <button type="button" onClick={handleBackToLogin} className="login-link-secondary">
                ← {t('backToLogin', 'Back to login')}
              </button>
            </div>
          </form>

          {/* Footer */}
          <div className="login-footer">
            <span className="login-version">V1.2</span>
            <div className="login-footer-icons">
              <Shield size={16} className="text-accent" />
              <Lock size={16} className="text-slate-400" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Regular Login Form
  return (
    <div className="login-page">
      <div className="login-card">
        {/* Dark Mode Toggle */}
        <button
          type="button"
          onClick={toggleTheme}
          className="login-theme-toggle"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
        </button>

        {/* Header */}
        <div className="login-header">
          <div className="login-logo">
            <div className="login-logo-icon">
              <span className="material-symbols-outlined text-white">
                {selectedCompanyId === 'al-ramrami' ? 'oil_barrel' : 'recycling'}
              </span>
            </div>
            <div className="login-logo-text">
              <span className="login-title">
                {selectedCompanyId === 'al-ramrami' ? 'AL RAMRAMI ERP' : 'PRIDE MUSCAT ERP'}
              </span>
              <span className="login-subtitle">BUSINESS MANAGEMENT SYSTEM</span>
            </div>
          </div>
          <div className="login-divider" />

          {/* Sign In Header */}
          <div className="login-welcome">
            <h2 className="login-welcome-title">{t('signInToAccount', 'Sign in to your account')}</h2>
            <p className="login-welcome-subtitle">{t('chooseCompanyCredentials', 'Choose your company and enter your credentials below')}</p>
          </div>
        </div>

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="login-form">
          {/* Company Select */}
          <div className="login-field">
            <label className="login-label">{t('company', 'Company')}</label>
            <div className="login-select-wrapper">
              <select
                value={selectedCompanyId}
                onChange={(e) => setSelectedCompanyId(e.target.value)}
                className="login-select"
                required
              >
                {companies.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={18} className="login-select-icon" />
            </div>
          </div>

          {/* Email Field */}
          <div className="login-field">
            <label className="login-label">{t('emailOrUsername', 'Email or Username')}</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value.toLowerCase())}
              placeholder="you@company.com"
              className="login-input"
              required
            />
          </div>

          {/* Password Field */}
          <div className="login-field">
            <div className="login-label-row">
              <label className="login-label">{t('password', 'Password')}</label>
              <button type="button" className="login-forgot">{t('forgotPassword', 'Forgot?')}</button>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="login-input"
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="login-error">
              <AlertCircle size={18} />
              <span>{error.toUpperCase()}</span>
            </div>
          )}

          {/* Submit Button */}
          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>{t('signingIn', 'SIGNING IN...')}</span>
              </>
            ) : (
              <span>{t('login', 'Login')}</span>
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="login-footer">
          <span className="login-version">V1.2</span>
          <div className="login-footer-icons">
            <Shield size={16} className="text-accent" />
            <Lock size={16} className="text-slate-400" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginForm
