import React, { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useLocalization } from '../context/LocalizationContext'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { usePermissions } from '../hooks/usePermissions'
import { PERMISSIONS } from '../config/roles'
import { 
  Settings as SettingsIcon, 
  Globe, 
  Calendar, 
  DollarSign, 
  Clock, 
  Monitor,
  Save,
  RotateCcw,
  Shield,
  Palette,
  Bell,
  Database,
  Users,
  Building,
  AlertTriangle
} from 'lucide-react'
import './Settings.css'

const Settings = () => {
  const { user } = useAuth()
  const { t, currentLanguage, changeLanguage, getSupportedLanguages, isRTL } = useLocalization()
  const { settings, updateSettings, resetToDefaults, getSettingsInfo } = useSystemSettings()
  const { hasPermission } = usePermissions()
  
  const [activeTab, setActiveTab] = useState('localization')
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  // Check if user can manage settings
  const canManageSettings = hasPermission(PERMISSIONS.MANAGE_SETTINGS) || user?.role === 'SUPER_ADMIN'

  useEffect(() => {
    if (!canManageSettings) {
      setMessage({ type: 'error', text: t('unauthorized') })
      return
    }
    
    // Initialize form data with current settings
    setFormData({
      language: currentLanguage,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
      currency: settings.currency,
      timezone: settings.timezone,
      firstDayOfWeek: settings.firstDayOfWeek,
      fiscalYearStart: settings.fiscalYearStart
    })
  }, [settings, currentLanguage, canManageSettings, t])

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleSave = async () => {
    if (!canManageSettings) {
      setMessage({ type: 'error', text: t('unauthorized') })
      return
    }

    setLoading(true)
    try {
      // Update language (now available for all users)
      if (formData.language !== currentLanguage) {
        changeLanguage(formData.language)
      }

      // Update system settings
      const { language, ...systemSettings } = formData
      await updateSettings(systemSettings)

      setMessage({ type: 'success', text: t('settingsSaved') })
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      setMessage({ type: 'error', text: t('somethingWentWrong') })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    if (!canManageSettings) return
    
    if (confirm(t('confirm') + ': Reset all settings to defaults?')) {
      resetToDefaults()
      setFormData({
        language: 'en',
        dateFormat: 'DD/MM/YYYY',
        timeFormat: '24h',
        currency: 'OMR',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        firstDayOfWeek: 1,
        fiscalYearStart: '01-04'
      })
      setMessage({ type: 'success', text: 'Settings reset to defaults' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (!canManageSettings) {
    return (
      <div className="settings-page">
        <div className="settings-header">
          <div className="page-title-section">
            <h1><Shield size={24} /> {t('settings')}</h1>
            <p>{t('systemConfiguration')}</p>
          </div>
        </div>
        <div className="access-denied">
          <AlertTriangle size={48} />
          <h2>Access Denied</h2>
          <p>You don't have permission to access system settings.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'localization', label: t('localizationSettings'), icon: Globe },
    { id: 'system', label: t('generalSettings'), icon: SettingsIcon },
    { id: 'appearance', label: t('appearanceSettings'), icon: Palette },
    { id: 'notifications', label: t('notificationSettings'), icon: Bell }
  ]

  return (
    <div className="settings-page">
      <div className="settings-header">
        <div className="page-title-section">
          <h1><SettingsIcon size={24} /> {t('settings')}</h1>
          <p>{t('configureGlobalSettings')}</p>
        </div>
        
        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}
      </div>

      <div className="settings-container">
        {/* Settings Navigation */}
        <div className="settings-nav">
          {tabs.map(tab => {
            const IconComponent = tab.icon
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <IconComponent size={20} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Settings Content */}
        <div className="settings-content">
          {/* Localization Settings */}
          {activeTab === 'localization' && (
            <div className="settings-section">
              <div className="section-header">
                <Globe size={20} />
                <h2>{t('localizationSettings')}</h2>
                <p>{t('configureLanguageAndRegion')}</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label htmlFor="language">{t('language')}</label>
                  <select
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                  >
                    {getSupportedLanguages().map(lang => (
                      <option key={lang.code} value={lang.code}>
                        {lang.nativeName} ({lang.name})
                      </option>
                    ))}
                  </select>
                  <span className="setting-note">{t('languagePreferenceSavedPerUser')}</span>
                </div>

                <div className="setting-group">
                  <label htmlFor="dateFormat">{t('dateFormat')}</label>
                  <select
                    id="dateFormat"
                    value={formData.dateFormat}
                    onChange={(e) => handleInputChange('dateFormat', e.target.value)}
                  >
                    <option value="DD/MM/YYYY">DD/MM/YYYY (31/12/2024)</option>
                    <option value="MM/DD/YYYY">MM/DD/YYYY (12/31/2024)</option>
                    <option value="YYYY-MM-DD">YYYY-MM-DD (2024-12-31)</option>
                    <option value="DD-MM-YYYY">DD-MM-YYYY (31-12-2024)</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label htmlFor="timeFormat">{t('timeFormat')}</label>
                  <select
                    id="timeFormat"
                    value={formData.timeFormat}
                    onChange={(e) => handleInputChange('timeFormat', e.target.value)}
                  >
                    <option value="24h">24 Hour (13:30)</option>
                    <option value="12h">12 Hour (1:30 PM)</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label htmlFor="currency">{t('currency')}</label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <option value="OMR">OMR - Omani Rial</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label htmlFor="timezone">{t('timezone')}</label>
                  <select
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => handleInputChange('timezone', e.target.value)}
                  >
                    <option value="Asia/Muscat">Asia/Muscat (UTC+4)</option>
                    <option value="Asia/Dubai">Asia/Dubai (UTC+4)</option>
                    <option value="Asia/Riyadh">Asia/Riyadh (UTC+3)</option>
                    <option value="UTC">UTC (UTC+0)</option>
                    <option value="America/New_York">America/New_York (EST)</option>
                    <option value="Europe/London">Europe/London (GMT)</option>
                  </select>
                </div>

                <div className="setting-group">
                  <label htmlFor="firstDayOfWeek">First Day of Week</label>
                  <select
                    id="firstDayOfWeek"
                    value={formData.firstDayOfWeek}
                    onChange={(e) => handleInputChange('firstDayOfWeek', parseInt(e.target.value))}
                  >
                    <option value={0}>Sunday</option>
                    <option value={1}>Monday</option>
                    <option value={6}>Saturday</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="settings-section">
              <div className="section-header">
                <SettingsIcon size={20} />
                <h2>{t('generalSettings')}</h2>
                <p>{t('configureGlobalSettings')}</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label htmlFor="fiscalYearStart">Fiscal Year Start</label>
                  <select
                    id="fiscalYearStart"
                    value={formData.fiscalYearStart}
                    onChange={(e) => handleInputChange('fiscalYearStart', e.target.value)}
                  >
                    <option value="01-01">January 1</option>
                    <option value="01-04">April 1</option>
                    <option value="01-07">July 1</option>
                    <option value="01-10">October 1</option>
                  </select>
                </div>

                <div className="setting-info">
                  <h3>{t('currentSettingsInformation')}</h3>
                  <div className="info-grid">
                    <div className="info-item">
                      <strong>{t('settingsSource')}:</strong>
                      <span className={`source-badge ${getSettingsInfo().source}`}>
                        {getSettingsInfo().source.replace('_', ' ')}
                      </span>
                    </div>
                    <div className="info-item">
                      <strong>{t('isCustomized')}:</strong>
                      <span>{getSettingsInfo().isCustomized ? 'Yes' : 'No'}</span>
                    </div>
                    <div className="info-item">
                      <strong>Company:</strong>
                      <span>{getSettingsInfo().companyName}</span>
                    </div>
                    <div className="info-item">
                      <strong>User:</strong>
                      <span>{getSettingsInfo().userName}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="settings-section">
              <div className="section-header">
                <Palette size={20} />
                <h2>{t('appearanceSettings')}</h2>
                <p>{t('customizeVisualAppearance')}</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>{t('theme')}</label>
                  <div className="theme-options">
                    <button className="theme-option light active">
                      <Monitor size={20} />
                      {t('lightTheme')}
                    </button>
                    <button className="theme-option dark">
                      <Monitor size={20} />
                      {t('darkTheme')}
                    </button>
                  </div>
                  <span className="setting-note">{t('availableInFutureUpdate')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="settings-section">
              <div className="section-header">
                <Bell size={20} />
                <h2>{t('notificationSettings')}</h2>
                <p>{t('configureNotificationsAndAlerts')}</p>
              </div>

              <div className="settings-grid">
                <div className="setting-group">
                  <label>{t('notifications')}</label>
                  <div className="setting-info">
                    <h3>{t('comingSoon')}</h3>
                    <p>{t('availableInFutureUpdate')}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Actions */}
          <div className="settings-actions">
            <button 
              className="btn btn-outline"
              onClick={handleReset}
              disabled={loading}
            >
              <RotateCcw size={16} />
              {t('resetToDefaults')}
            </button>
            
            <button 
              className="btn btn-primary"
              onClick={handleSave}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="loading-spinner" />
                  {t('saving')}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t('saveSettings')}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Settings