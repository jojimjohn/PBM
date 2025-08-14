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
  const [username, setUsername] = useState('admin')
  const [password, setPassword] = useState('password123')
  const [selectedCompanyId, setSelectedCompanyId] = useState('')
  const [companies, setCompanies] = useState([])
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  const { login } = useAuth()

  // Load companies on component mount
  useEffect(() => {
    const loadCompanies = async () => {
      try {
        const response = await fetch('/data/companies.json')
        const data = await response.json()
        setCompanies(data.companies)
        // Auto-select first company
        if (data.companies.length > 0) {
          setSelectedCompanyId(data.companies[0].id)
        }
      } catch (error) {
        setError('Failed to load companies')
      }
    }
    
    loadCompanies()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!username || !password || !selectedCompanyId) {
      setError('Please fill in all fields')
      return
    }

    setIsLoading(true)

    try {
      await login(username, password, selectedCompanyId)
      // Navigation will be handled by App component
    } catch (error) {
      setError(error.message)
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
          <Card className={`company-preview ${selectedCompany.id === 'alramrami' ? 'gradient-alramrami' : 'gradient-pridemuscat'}`}>
            <CardContent>
              <div className="flex items-center space-x-3">
                {selectedCompany.businessType === 'oil' ? (
                  <Icons.droplets className="company-icon" style={{ color: 'var(--alramrami-primary)' }} />
                ) : (
                  <Icons.recycle className="company-icon" style={{ color: 'var(--pridemuscat-primary)' }} />
                )}
                <div>
                  <h3 className="company-name font-semibold text-lg">
                    {selectedCompany.name}
                  </h3>
                  <Badge variant={selectedCompany.id === 'alramrami' ? 'alramrami' : 'pridemuscat'}>
                    {selectedCompany.businessType === 'oil' ? 'Oil Business' : 'Scrap Business'}
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
                <Label htmlFor="username">Username</Label>
                <div className="input-with-icon">
                  <Icons.user className="input-icon" />
                  <Input
                    id="username"
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
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
                variant={selectedCompany?.id === 'alramrami' ? 'alramrami' : selectedCompany?.id === 'pridemuscat' ? 'pridemuscat' : 'default'}
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
            <h4 className="font-medium mb-4">Demo Credentials:</h4>
            <div className="demo-list space-y-2 text-sm">
              <div><span className="font-medium">Super Admin:</span> admin / password123</div>
              <div><span className="font-medium">Al Ramrami Admin:</span> alramrami_admin / password123</div>
              <div><span className="font-medium">Pride Muscat Admin:</span> pridemuscat_admin / password123</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default LoginForm