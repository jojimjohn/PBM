import React, { useState, useEffect, useRef } from 'react'
import { useAuth } from '../context/AuthContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Label } from './ui/Label'
import { Select, SelectOption } from './ui/Select'
import { Badge } from './ui/Badge'
import { Icons } from './ui/Icons'
import './LoginForm.css'

const LoginForm = () => {
  const [email, setEmail] = useState('admin@alramrami.com')
  const [password, setPassword] = useState('admin123')
  const [selectedCompanyId, setSelectedCompanyId] = useState('al-ramrami')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  // MFA state (note: showMfaStep is now derived from context pendingMfa)
  const [mfaCode, setMfaCode] = useState('')
  const [useBackupCode, setUseBackupCode] = useState(false)

  const mfaInputRef = useRef(null)

  const { login, verifyMfa, pendingMfa, clearPendingMfa } = useAuth()

  // Derive showMfaStep from context pendingMfa (survives remounts)
  const showMfaStep = !!pendingMfa

  // Available companies (IDs must match backend format)
  const companies = [
    { id: 'al-ramrami', name: 'Al Ramrami Trading Enterprises', type: 'Oil Business' },
    { id: 'pride-muscat', name: 'Pride Muscat International LLC', type: 'Scrap Business' }
  ]

  // Focus MFA input when MFA step is shown
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
          // MFA is required - pendingMfa is set in AuthContext
          // showMfaStep is now derived from pendingMfa
          setMfaCode('')
          setIsLoading(false) // Stop loading immediately for MFA step
          return // Exit early - don't let finally block run
        }
        // If no MFA required, navigation will be handled by App component
      } else {
        setError(result.error || 'Login failed')
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

    // Validate code format
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

      if (result.success) {
        // Navigation will be handled by App component
        // Login successful, user will be redirected automatically
      } else {
        setError(result.error || 'Invalid code. Please try again.')
      }
    } catch (error) {
      setError(error.message || 'Verification failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    // Clear MFA state from context
    clearPendingMfa()
    setMfaCode('')
    setUseBackupCode(false)
    setError('')
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

  // MFA Verification Step
  if (showMfaStep) {
    return (
      <div className="login-container gradient-bg">
        <div className="login-wrapper">
          {/* Header */}
          <div className="login-header text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">
              Two-Factor Authentication
            </h1>
            <p className="text-sm text-gray-600">
              Enter the code from your authenticator app
            </p>
          </div>

          {/* MFA Card */}
          <Card className="login-card shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icons.shield style={{ width: '1.5rem', height: '1.5rem', color: '#10b981' }} />
                Verify Your Identity
              </CardTitle>
              <CardDescription>
                {useBackupCode
                  ? 'Enter one of your backup codes'
                  : 'Enter the 6-digit code from your authenticator app'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleMfaSubmit} className="login-form space-y-4">
                <div className="form-field space-y-2">
                  <Label htmlFor="mfaCode">
                    {useBackupCode ? 'Backup Code' : 'Authentication Code'}
                  </Label>
                  <div className="input-with-icon">
                    <Icons.key className="input-icon" />
                    <Input
                      ref={mfaInputRef}
                      id="mfaCode"
                      type="text"
                      value={mfaCode}
                      onChange={(e) => {
                        // Allow only digits for TOTP, alphanumeric for backup codes
                        const value = useBackupCode
                          ? e.target.value.toUpperCase()
                          : e.target.value.replace(/\D/g, '').slice(0, 6)
                        setMfaCode(value)
                      }}
                      placeholder={useBackupCode ? 'XXXX-XXXX' : '000000'}
                      className="pl-10 text-center text-2xl tracking-widest font-mono"
                      maxLength={useBackupCode ? 9 : 6}
                      autoComplete="one-time-code"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="error-message">
                    <div className="text-sm">{error}</div>
                  </div>
                )}

                <Button
                  type="submit"
                  className="w-full"
                  variant={selectedCompany?.id === 'al-ramrami' ? 'alramrami' : selectedCompany?.id === 'pride-muscat' ? 'pridemuscat' : 'primary'}
                  disabled={isLoading}
                  style={{
                    backgroundColor: selectedCompany?.id === 'al-ramrami' ? '#2c3e50' : selectedCompany?.id === 'pride-muscat' ? '#27ae60' : '#2563eb',
                    color: 'white'
                  }}
                >
                  {isLoading ? (
                    <>
                      <Icons.loader className="mr-2 animate-spin" style={{ width: '1rem', height: '1rem', color: 'white' }} />
                      Verifying...
                    </>
                  ) : (
                    'Verify & Sign In'
                  )}
                </Button>

                <div className="mfa-options text-center space-y-2">
                  <button
                    type="button"
                    onClick={() => {
                      setUseBackupCode(!useBackupCode)
                      setMfaCode('')
                      setError('')
                    }}
                    className="text-sm text-blue-600 hover:text-blue-800 underline"
                  >
                    {useBackupCode
                      ? 'Use authenticator app instead'
                      : "Can't access your authenticator? Use a backup code"
                    }
                  </button>

                  <div>
                    <button
                      type="button"
                      onClick={handleBackToLogin}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      ← Back to login
                    </button>
                  </div>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Help Card */}
          <Card className="demo-card">
            <CardContent>
              <h4 className="font-medium mb-2">Need help?</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>• Open your authenticator app (Google Authenticator, Authy, etc.)</p>
                <p>• Find the entry for "PBM" or your email</p>
                <p>• Enter the 6-digit code shown</p>
                <p className="text-xs text-gray-500 mt-2">
                  Codes refresh every 30 seconds
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Regular Login Form
  return (
    <div className="login-container gradient-bg">
      <div className="login-wrapper">
        {/* Header */}
        <div className="login-header text-center space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Petroleum Business Management
          </h1>
          <p className="text-sm text-gray-600">
            Al Ramrami Trading & Pride Muscat International
          </p>
        </div>

        {/* Company Preview */}
        {selectedCompany && (
          <Card className={`company-preview ${selectedCompany.id === 'al-ramrami' ? 'gradient-alramrami' : 'gradient-pridemuscat'}`}>
            <CardContent>
              <div className="flex items-center space-x-3">
                {selectedCompany.type === 'Oil Business' ? (
                  <Icons.droplets className="company-icon" style={{ color: 'var(--alramrami-primary)' }} />
                ) : (
                  <Icons.recycle className="company-icon" style={{ color: 'var(--pridemuscat-primary)' }} />
                )}
                <div>
                  <h3 className="company-name font-semibold text-lg">
                    {selectedCompany.name}
                  </h3>
                  <Badge variant={selectedCompany.id === 'al-ramrami' ? 'alramrami' : 'pridemuscat'}>
                    {selectedCompany.type}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Login Form */}
        <Card className="login-card shadow-xl">
          <CardHeader>
            <CardTitle>Sign in to your account</CardTitle>
            <CardDescription>
              Choose your company and enter your credentials below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="login-form space-y-4">
              <div className="form-field space-y-2">
                <Label htmlFor="company">Company</Label>
                <div className="input-with-icon">
                  <Icons.building className="input-icon" />
                  <Select
                    id="company"
                    value={selectedCompanyId}
                    onChange={(e) => setSelectedCompanyId(e.target.value)}
                    className="pl-10"
                    required
                  >
                    <SelectOption value="">Choose Company...</SelectOption>
                    {companies.map(company => (
                      <SelectOption key={company.id} value={company.id}>
                        {company.name}
                      </SelectOption>
                    ))}
                  </Select>
                </div>
              </div>

              <div className="form-field space-y-2">
                <Label htmlFor="email">Email or Username</Label>
                <div className="input-with-icon">
                  <Icons.mail className="input-icon" />
                  <Input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value.toLowerCase())}
                    placeholder="Enter email or username"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="form-field space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="input-with-icon">
                  <Icons.lock className="input-icon" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="error-message">
                  <div className="text-sm">{error}</div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                variant={selectedCompany?.id === 'al-ramrami' ? 'alramrami' : selectedCompany?.id === 'pride-muscat' ? 'pridemuscat' : 'primary'}
                disabled={isLoading}
                style={{
                  backgroundColor: selectedCompany?.id === 'al-ramrami' ? '#2c3e50' : selectedCompany?.id === 'pride-muscat' ? '#27ae60' : '#2563eb',
                  color: 'white'
                }}
              >
                {isLoading ? (
                  <>
                    <Icons.loader className="mr-2 animate-spin" style={{ width: '1rem', height: '1rem', color: 'white' }} />
                    Signing in...
                  </>
                ) : (
                  'Sign in'
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Demo Credentials */}
        <Card className="demo-card">
          <CardContent>
            <h4 className="font-medium mb-4">Development Credentials:</h4>
            <div className="demo-list space-y-2 text-sm">
              <div><span className="font-medium">Al Ramrami Admin:</span> admin@alramrami.com</div>
              <div><span className="font-medium">Pride Muscat Admin:</span> admin@pridemuscat.com</div>
              <div><span className="font-medium">Password:</span> admin123</div>
              <div className="text-xs text-gray-500 mt-2">⚠️ Change passwords in production!</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginForm
