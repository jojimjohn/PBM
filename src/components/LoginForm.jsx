import React, { useState, useEffect } from 'react'
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
  const [password, setPassword] = useState('pass123!')
  const [selectedCompanyId, setSelectedCompanyId] = useState('al-ramrami')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()
  
  // Available companies (IDs must match backend format)
  const companies = [
    { id: 'al-ramrami', name: 'Al Ramrami Trading Enterprises', type: 'Oil Business' },
    { id: 'pride-muscat', name: 'Pride Muscat International LLC', type: 'Scrap Business' }
  ]

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
        // Navigation will be handled by App component
        // Login successful, user will be redirected automatically
      } else {
        setError(result.error || 'Login failed')
      }
    } catch (error) {
      setError(error.message || 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const selectedCompany = companies.find(c => c.id === selectedCompanyId)

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
                <Label htmlFor="email">Email</Label>
                <div className="input-with-icon">
                  <Icons.mail className="input-icon" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
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
                variant={selectedCompany?.id === 'al-ramrami' ? 'alramrami' : selectedCompany?.id === 'pride-muscat' ? 'pridemuscat' : 'default'}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Icons.loader className="mr-2 animate-spin" style={{ width: '1rem', height: '1rem' }} />
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
              <div><span className="font-medium">Password:</span> pass123!</div>
              <div className="text-xs text-gray-500 mt-2">⚠️ Change passwords in production!</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginForm