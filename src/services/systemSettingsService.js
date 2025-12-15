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
      return response
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
  }
}

export default systemSettingsService
