import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import authService from '../services/authService'
import systemSettingsService from '../services/systemSettingsService'
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
  const [vatRate, setVatRate] = useState(5) // Default 5%, will be loaded from API

  // Theme state with localStorage persistence
  // Load initial theme from localStorage immediately (before user login) to prevent flash
  const getInitialTheme = () => {
    try {
      const savedTheme = localStorage.getItem('pbm_theme')
      if (savedTheme === 'dark' || savedTheme === 'light') {
        return savedTheme
      }
      // Check system preference as fallback
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        return 'dark'
      }
    } catch (e) {
      console.warn('Could not access localStorage for theme:', e)
    }
    return 'light'
  }

  const [theme, setThemeState] = useState(getInitialTheme)

  // Function to set theme and persist it
  const setTheme = async (newTheme) => {
    if (newTheme !== 'light' && newTheme !== 'dark') return

    setThemeState(newTheme)

    // Save to database via API if logged in
    if (user && selectedCompany) {
      try {
        // Save to API (database)
        const response = await systemSettingsService.saveThemePreference(newTheme)
        if (!response.success) {
          console.warn('Could not save theme to database:', response.error)
        }

        // Update pbm_theme for quick loading on next visit
        localStorage.setItem('pbm_theme', newTheme)

        // Also save to user-specific localStorage for backup/offline access
        const userSettingsKey = `userSettings_${user.id}_${selectedCompany.id}`
        const existing = localStorage.getItem(userSettingsKey)
        const parsed = existing ? JSON.parse(existing) : {}
        localStorage.setItem(userSettingsKey, JSON.stringify({
          ...parsed,
          theme: newTheme,
          lastUpdated: new Date().toISOString()
        }))
      } catch (e) {
        console.warn('Could not save theme preference:', e)
      }
    } else {
      // No user logged in - just save to general localStorage
      try {
        localStorage.setItem('pbm_theme', newTheme)
      } catch (e) {
        console.warn('Could not save theme to localStorage:', e)
      }
    }
  }

  // Toggle theme helper
  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    // Tailwind dark mode requires 'dark' class on documentElement (html)
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
    }
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
      // Load user preferences from database API
      const prefsResponse = await systemSettingsService.getUserPreferences()

      if (prefsResponse.success && prefsResponse.data) {
        const prefs = prefsResponse.data

        // Load theme from database if available
        if (prefs.theme === 'dark' || prefs.theme === 'light') {
          setThemeState(prefs.theme)
          // Also update localStorage for quick loading on next visit
          localStorage.setItem('pbm_theme', prefs.theme)
        }

        // Store other preferences for local access
        const userSettingsKey = `userSettings_${user.id}_${selectedCompany.id}`
        localStorage.setItem(userSettingsKey, JSON.stringify({
          ...prefs,
          lastUpdated: new Date().toISOString()
        }))

        setSettings(prev => ({
          ...prev,
          ...prefs,
          systemDate: new Date(),
          settingsSource: 'user_preferences'
        }))
      } else {
        // Fallback to localStorage if API fails
        const userSettingsKey = `userSettings_${user.id}_${selectedCompany.id}`
        const savedSettings = localStorage.getItem(userSettingsKey)

        if (savedSettings) {
          const parsed = JSON.parse(savedSettings)

          if (parsed.theme === 'dark' || parsed.theme === 'light') {
            setThemeState(parsed.theme)
            localStorage.setItem('pbm_theme', parsed.theme)
          }

          setSettings(prev => ({
            ...prev,
            ...parsed,
            systemDate: new Date(),
            settingsSource: 'user_preferences'
          }))
        } else {
          // Use company defaults if no preferences found
          const companyDefaults = getDefaultSettings()
          setSettings(companyDefaults)
        }
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

  const formatTime = (date, format = settings.timeFormat, includeSeconds = false) => {
    if (!date) return ''

    const d = new Date(date)
    if (isNaN(d.getTime())) return ''

    const options = {
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds && { second: '2-digit' }),
      hour12: format === '12h'
    }

    return d.toLocaleTimeString(format === '12h' ? 'en-US' : 'en-GB', options)
  }

  const formatDateTime = (date, dateFormat = settings.dateFormat, timeFormat = settings.timeFormat, includeSeconds = false) => {
    const formattedDate = formatDate(date, dateFormat)
    const formattedTime = formatTime(date, timeFormat, includeSeconds)
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

  // Convert date to ISO format for API calls (YYYY-MM-DD)
  // IMPORTANT: Always use this when sending dates to the backend!
  const toAPIDateFormat = (date) => {
    if (!date) return null
    const d = new Date(date)
    if (isNaN(d.getTime())) return null

    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day = String(d.getDate()).padStart(2, '0')

    return `${year}-${month}-${day}`
  }

  // Parse date string from any format to Date object
  // Handles both API format (YYYY-MM-DD) and display formats
  const parseDate = (dateString) => {
    if (!dateString) return null
    if (dateString instanceof Date) return dateString

    // Try ISO format first (from API)
    const isoDate = new Date(dateString)
    if (!isNaN(isoDate.getTime())) return isoDate

    // Try to parse based on current settings format
    const format = settings.dateFormat
    const parts = dateString.split(/[-\/]/)

    if (parts.length === 3) {
      let year, month, day

      if (format === 'DD/MM/YYYY' || format === 'DD-MM-YYYY') {
        day = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
        year = parseInt(parts[2], 10)
      } else if (format === 'MM/DD/YYYY') {
        month = parseInt(parts[0], 10) - 1
        day = parseInt(parts[1], 10)
        year = parseInt(parts[2], 10)
      } else if (format === 'YYYY-MM-DD') {
        year = parseInt(parts[0], 10)
        month = parseInt(parts[1], 10) - 1
        day = parseInt(parts[2], 10)
      }

      if (year && month !== undefined && day) {
        return new Date(year, month, day)
      }
    }

    return null
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
    toAPIDateFormat,  // Use when sending dates to backend API
    parseDate,        // Use when parsing dates from various formats
    systemDate: settings.systemDate,
    theme,
    setTheme,         // Set theme directly (for Settings page)
    toggleTheme,      // Toggle between light/dark (for header button)
    vatRate // VAT rate percentage from system settings
  }

  return (
    <SystemSettingsContext.Provider value={value}>
      {children}
    </SystemSettingsContext.Provider>
  )
}

export default SystemSettingsProvider