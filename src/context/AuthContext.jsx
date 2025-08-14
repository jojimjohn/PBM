import React, { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [selectedCompany, setSelectedCompany] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  // Load authentication state from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('auth_user')
    const savedCompany = localStorage.getItem('selected_company')
    
    if (savedUser) {
      setUser(JSON.parse(savedUser))
    }
    if (savedCompany) {
      setSelectedCompany(JSON.parse(savedCompany))
    }
    setIsLoading(false)
  }, [])

  const login = async (username, password, companyId) => {
    setIsLoading(true)
    
    try {
      // Load users data
      const response = await fetch('/data/users.json')
      const userData = await response.json()
      
      // Find user
      const foundUser = userData.users.find(u => 
        u.username === username && u.isActive
      )
      
      if (!foundUser) {
        throw new Error('Invalid username or user is inactive')
      }

      // Simple password validation (in real app, this would be properly hashed)
      if (password !== 'password123') {
        throw new Error('Invalid password')
      }

      // Check if user has access to selected company
      if (!foundUser.companies.includes(companyId)) {
        throw new Error('User does not have access to selected company')
      }

      // Load company data
      const companyResponse = await fetch('/data/companies.json')
      const companyData = await companyResponse.json()
      const company = companyData.companies.find(c => c.id === companyId)
      
      if (!company) {
        throw new Error('Company not found')
      }

      // Update last login
      const updatedUser = {
        ...foundUser,
        lastLogin: new Date().toISOString()
      }

      // Save to state and localStorage
      setUser(updatedUser)
      setSelectedCompany(company)
      localStorage.setItem('auth_user', JSON.stringify(updatedUser))
      localStorage.setItem('selected_company', JSON.stringify(company))

      return { success: true, user: updatedUser, company }
    } catch (error) {
      throw new Error(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    setSelectedCompany(null)
    localStorage.removeItem('auth_user')
    localStorage.removeItem('selected_company')
  }

  const switchCompany = async (companyId) => {
    if (!user) {
      throw new Error('User not authenticated')
    }

    // Check if user has access to the company
    if (!user.companies.includes(companyId)) {
      throw new Error('User does not have access to this company')
    }

    try {
      const response = await fetch('/data/companies.json')
      const companyData = await response.json()
      const company = companyData.companies.find(c => c.id === companyId)
      
      if (!company) {
        throw new Error('Company not found')
      }

      setSelectedCompany(company)
      localStorage.setItem('selected_company', JSON.stringify(company))
      
      return { success: true, company }
    } catch (error) {
      throw new Error(error.message)
    }
  }

  const hasPermission = (permission) => {
    if (!user) return false
    
    // Super admin has all permissions
    if (user.role === 'SUPER_ADMIN') return true
    
    // Legacy permission check - this will be replaced by the new RBAC system
    const rolePermissions = {
      COMPANY_ADMIN: ['manage_users', 'view_reports', 'manage_customers', 'manage_inventory', 'manage_purchases', 'manage_sales', 'manage_expenses'],
      MANAGER: ['view_reports', 'manage_customers', 'manage_inventory', 'manage_purchases', 'manage_sales', 'approve_expenses'],
      SALES: ['manage_customers', 'manage_sales', 'view_inventory', 'view_sales_reports'],
      PURCHASE: ['manage_purchases', 'manage_inventory', 'view_purchase_reports'],
      ACCOUNTS: ['manage_expenses', 'manage_petty_cash', 'view_financial_reports']
    }

    const userPermissions = rolePermissions[user.role] || []
    return userPermissions.includes(permission)
  }

  const canSwitchCompany = () => {
    return user?.permissions?.canSwitchCompany || false
  }

  const value = {
    user,
    selectedCompany,
    isLoading,
    login,
    logout,
    switchCompany,
    hasPermission,
    canSwitchCompany,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}