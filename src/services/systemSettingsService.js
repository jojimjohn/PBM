import authService from './authService'
import { API_BASE_URL } from '../config/api'

const systemSettingsService = {
  /**
   * Get all system settings for the company
   * @returns {Promise<Object>} Response with settings array
   */
  async getAll() {
    try {
      const url = `${API_BASE_URL}/system-settings`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error('Error fetching system settings:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch system settings'
      }
    }
  },

  /**
   * Get a specific setting by key
   * @param {string} key - Setting key (e.g., 'vat_rate_percentage')
   * @returns {Promise<Object>} Response with setting value
   */
  async getSetting(key) {
    try {
      const url = `${API_BASE_URL}/system-settings/${key}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error(`Error fetching setting ${key}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch setting'
      }
    }
  },

  /**
   * Get VAT rate percentage
   * @returns {Promise<number>} VAT rate percentage (defaults to 5 if not found)
   */
  async getVatRate() {
    try {
      const response = await this.getSetting('vat_rate_percentage')
      if (response.success && response.data) {
        return parseFloat(response.data.setting_value) || 5
      }
      return 5 // Default fallback
    } catch (error) {
      console.error('Error fetching VAT rate:', error)
      return 5 // Default fallback
    }
  },

  /**
   * Update a system setting
   * @param {string} key - Setting key
   * @param {any} value - New value
   * @returns {Promise<Object>} Response
   */
  async updateSetting(key, value) {
    try {
      const url = `${API_BASE_URL}/system-settings/${key}`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ setting_value: value })
      })
      return data
    } catch (error) {
      console.error(`Error updating setting ${key}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to update setting'
      }
    }
  },

  // ============================================================================
  // Session Timeout Settings
  // ============================================================================

  /**
   * Get session timeout setting
   * @returns {Promise<Object>} Response with sessionTimeoutMinutes
   */
  async getSessionTimeout() {
    try {
      const url = `${API_BASE_URL}/system-settings/security/session-timeout`
      const data = await authService.makeAuthenticatedRequest(url)
      if (data.success) {
        return data.data
      }
      return { sessionTimeoutMinutes: 30 } // Default fallback
    } catch (error) {
      console.error('Error fetching session timeout:', error)
      return { sessionTimeoutMinutes: 30 } // Default fallback
    }
  },

  /**
   * Update session timeout setting
   * @param {number} timeoutMinutes - Session timeout in minutes (10-120)
   * @returns {Promise<Object>} Response
   */
  async updateSessionTimeout(timeoutMinutes) {
    try {
      const url = `${API_BASE_URL}/system-settings/security/session-timeout`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ timeoutMinutes })
      })
      if (!data.success) {
        throw new Error(data.error || 'Failed to update session timeout')
      }
      return data
    } catch (error) {
      console.error('Error updating session timeout:', error)
      throw error
    }
  },

  // ============================================================================
  // User Preferences
  // ============================================================================

  /**
   * Get all user preferences for the current user
   * @returns {Promise<Object>} Response with preferences object
   */
  async getUserPreferences() {
    try {
      const url = `${API_BASE_URL}/system-settings/user/preferences`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error('Error fetching user preferences:', error)
      return {
        success: false,
        error: error.message || 'Failed to fetch user preferences'
      }
    }
  },

  /**
   * Get a specific user preference
   * @param {string} key - Preference key (e.g., 'theme', 'language')
   * @returns {Promise<Object>} Response with preference value
   */
  async getUserPreference(key) {
    try {
      const url = `${API_BASE_URL}/system-settings/user/preferences/${key}`
      const data = await authService.makeAuthenticatedRequest(url)
      return data
    } catch (error) {
      console.error(`Error fetching user preference ${key}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to fetch preference'
      }
    }
  },

  /**
   * Update a user preference
   * @param {string} key - Preference key
   * @param {any} value - New value
   * @returns {Promise<Object>} Response
   */
  async updateUserPreference(key, value) {
    try {
      const url = `${API_BASE_URL}/system-settings/user/preferences/${key}`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ value })
      })
      return data
    } catch (error) {
      console.error(`Error updating user preference ${key}:`, error)
      return {
        success: false,
        error: error.message || 'Failed to update preference'
      }
    }
  },

  /**
   * Bulk update user preferences
   * @param {Object} preferences - Object with preference key-value pairs
   * @returns {Promise<Object>} Response
   */
  async updateUserPreferences(preferences) {
    try {
      const url = `${API_BASE_URL}/system-settings/user/preferences`
      const data = await authService.makeAuthenticatedRequest(url, {
        method: 'PUT',
        body: JSON.stringify({ preferences })
      })
      return data
    } catch (error) {
      console.error('Error updating user preferences:', error)
      return {
        success: false,
        error: error.message || 'Failed to update preferences'
      }
    }
  },

  /**
   * Get user's theme preference
   * @returns {Promise<string>} Theme ('light' or 'dark'), defaults to 'light'
   */
  async getThemePreference() {
    try {
      const response = await this.getUserPreference('theme')
      if (response.success && response.data?.value) {
        return response.data.value
      }
      return 'light' // Default
    } catch (error) {
      console.error('Error fetching theme preference:', error)
      return 'light'
    }
  },

  /**
   * Save user's theme preference
   * @param {string} theme - 'light' or 'dark'
   * @returns {Promise<Object>} Response
   */
  async saveThemePreference(theme) {
    return this.updateUserPreference('theme', theme)
  }
}

export default systemSettingsService
