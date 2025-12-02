import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import authService from '../services/authService'
import { API_BASE_URL } from '../config/api'

const SystemSettingsContext = createContext({})

export const useSystemSettings = () => {
  const context = useContext(SystemSettingsContext)
  if (!context) {
    throw new Error('useSystemSettings must be used within a SystemSettingsProvider')
  }
  return context
}

export const SystemSettingsProvider = ({ children }) => {
  const { user, selectedCompany } = useAuth()
  
  // Get default settings based on company regional preferences
  const getDefaultSettings = () => {
    const companyDefaults = {
      dateFormat: selectedCompany?.preferences?.dateFormat || 'DD/MM/YYYY',
      timeFormat: selectedCompany?.preferences?.timeFormat || '24h',
      timezone: selectedCompany?.preferences?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: selectedCompany?.preferences?.currency || 'OMR',
      language: selectedCompany?.preferences?.language || 'en',
      firstDayOfWeek: selectedCompany?.preferences?.firstDayOfWeek || 1,
      fiscalYearStart: selectedCompany?.preferences?.fiscalYearStart || '01-04'
    }
    
    return {
      ...companyDefaults,
      systemDate: new Date(), // Always current date
      settingsSource: 'company_defaults' // Track where settings come from
    }
  }
  
  const [settings, setSettings] = useState(getDefaultSettings())
  const [theme, setTheme] = useState('light')
  const [vatRate, setVatRate] = useState(5) // Default 5%, will be loaded from API

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
  };

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  // Update system date every minute to keep it current
  useEffect(() => {
    const updateSystemDate = () => {
      setSettings(prev => ({
        ...prev,
        systemDate: new Date()
      }))
    }

    // Update immediately
    updateSystemDate()

    // Update every minute
    const interval = setInterval(updateSystemDate, 60000)

    return () => clearInterval(interval)
  }, [])

  // Load VAT rate from system settings API
  const loadVatRate = async () => {
    if (!user || !selectedCompany) {
      setVatRate(5) // Default
      return
    }

    try {
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/system-settings/vat_rate_percentage`,
        { method: 'GET' }
      )

      if (response.success && response.data) {
        const rate = parseFloat(response.data.setting_value)
        setVatRate(isNaN(rate) ? 5 : rate)
      } else {
        setVatRate(5) // Default on error
      }
    } catch (error) {
      console.error('Error loading VAT rate:', error)
      setVatRate(5) // Default on error
    }
  }

  // Load user-specific settings when user or company changes
  useEffect(() => {
    if (user && selectedCompany) {
      loadUserSettings()
      loadVatRate()
    } else {
      // Reset to defaults when no user/company
      setSettings(getDefaultSettings())
      setVatRate(5)
    }
  }, [user?.id, selectedCompany?.id])
  
  const loadUserSettings = async () => {
    try {
      // Try to load from server-side user preferences first
      const userSettingsKey = `userSettings_${user.id}_${selectedCompany.id}`
      
      // Simulate API call - in real app this would be a REST API call
      // For now, we'll use a more structured localStorage approach with user/company context
      const savedSettings = localStorage.getItem(userSettingsKey)
      
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings)
        setSettings(prev => ({
          ...prev,
          ...parsed,
          systemDate: new Date(), // Always override with current date
          settingsSource: 'user_preferences'
        }))
      } else {
        // Use company defaults if no user preferences found
        const companyDefaults = getDefaultSettings()
        setSettings(companyDefaults)
      }
    } catch (error) {
      console.error('Error loading user settings:', error)
      // Fallback to company defaults on error
      setSettings(getDefaultSettings())
    }
  }

  // Save settings with proper user/company context
  const updateSettings = async (newSettings) => {
    const updatedSettings = {
      ...settings,
      ...newSettings,
      systemDate: new Date(), // Always keep current date
      settingsSource: 'user_preferences' // Mark as user customized
    }
    
    setSettings(updatedSettings)
    
    // Save to user-specific storage if user is logged in
    if (user && selectedCompany) {
      try {
        const userSettingsKey = `userSettings_${user.id}_${selectedCompany.id}`
        const { systemDate, settingsSource, ...settingsToSave } = updatedSettings
        
        // In a real application, this would be an API call to save user preferences
        // For now, use structured localStorage with user/company context
        localStorage.setItem(userSettingsKey, JSON.stringify({
          ...settingsToSave,
          lastUpdated: new Date().toISOString(),
          userId: user.id,
          companyId: selectedCompany.id
        }))
        
        // Optional: Also sync to server
        // await syncSettingsToServer(userSettingsKey, settingsToSave)
        
      } catch (error) {
        console.error('Error saving user settings:', error)
        // Could show user notification about settings not being saved
      }
    }
  }
  
  // Utility to reset settings to company defaults
  const resetToDefaults = () => {
    const defaults = getDefaultSettings()
    setSettings(defaults)
    
    // Clear user-specific settings
    if (user && selectedCompany) {
      const userSettingsKey = `userSettings_${user.id}_${selectedCompany.id}`
      localStorage.removeItem(userSettingsKey)
    }
  }
  
  // Get settings info for UI display
  const getSettingsInfo = () => {
    return {
      source: settings.settingsSource,
      isCustomized: settings.settingsSource === 'user_preferences',
      companyName: selectedCompany?.name || 'Unknown',
      userName: user?.username || 'Guest'
    }
  }

  // Utility functions for date formatting
  const formatDate = (date, format = settings.dateFormat) => {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()

    switch (format) {
      case 'DD/MM/YYYY':
        return `${day}/${month}/${year}`
      case 'MM/DD/YYYY':
        return `${month}/${day}/${year}`
      case 'YYYY-MM-DD':
        return `${year}-${month}-${day}`
      case 'DD-MM-YYYY':
        return `${day}-${month}-${year}`
      default:
        return `${day}/${month}/${year}`
    }
  }

  const formatTime = (date, format = settings.timeFormat) => {
    if (!date) return ''
    
    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    if (format === '12h') {
      return d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: true 
      })
    } else {
      return d.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      })
    }
  }

  const formatDateTime = (date, dateFormat = settings.dateFormat, timeFormat = settings.timeFormat) => {
    const formattedDate = formatDate(date, dateFormat)
    const formattedTime = formatTime(date, timeFormat)
    return `${formattedDate} ${formattedTime}`
  }

  const formatCurrency = (amount, currency = settings.currency) => {
    // Convert string to number if needed (MySQL returns DECIMAL as strings)
    const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

    // Handle invalid values
    if (typeof numericAmount !== 'number' || isNaN(numericAmount)) {
      return `${currency} 0.000`
    }

    return `${currency} ${numericAmount.toFixed(3)}`
  }

  // Get current date in various formats
  const getCurrentDate = (format = settings.dateFormat) => {
    return formatDate(settings.systemDate, format)
  }

  const getCurrentDateTime = (dateFormat = settings.dateFormat, timeFormat = settings.timeFormat) => {
    return formatDateTime(settings.systemDate, dateFormat, timeFormat)
  }

  // Get input-ready date format (always YYYY-MM-DD for HTML inputs)
  const getInputDate = (date = settings.systemDate) => {
    return formatDate(date, 'YYYY-MM-DD')
  }

  const value = {
    settings,
    updateSettings,
    resetToDefaults,
    getSettingsInfo,
    formatDate,
    formatTime,
    formatDateTime,
    formatCurrency,
    getCurrentDate,
    getCurrentDateTime,
    getInputDate,
    systemDate: settings.systemDate,
    theme,
    toggleTheme,
    vatRate // VAT rate percentage from system settings
  }

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export default SystemSettingsProvider