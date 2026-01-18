import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { PERMISSIONS } from '../../../config/roles'
import systemSettingsService from '../../../services/systemSettingsService'
import branchService from '../../../services/branchService'
import dataCacheService from '../../../services/dataCacheService'
import MFASetup from '../../../components/MFASetup'
import ExpenseCategoryManager from '../../../components/ExpenseCategoryManager'
import Modal from '../../../components/ui/Modal'
import {
  Settings as SettingsIcon,
  Globe,
  Calendar,
  Banknote,
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
  AlertTriangle,
  Percent,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Lock,
  Tag
} from 'lucide-react'
// CSS moved to global index.css - using Tailwind classes

const Settings = () => {
  const { user } = useAuth()
  const { t, currentLanguage, changeLanguage, getSupportedLanguages, isRTL } = useLocalization()
  const { settings, updateSettings, resetToDefaults, getSettingsInfo } = useSystemSettings()
  const { hasPermission } = usePermissions()

  const [activeTab, setActiveTab] = useState('localization')
  const [formData, setFormData] = useState({})
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)
  const [vatRate, setVatRate] = useState(5)
  const [editingVat, setEditingVat] = useState(false)
  const [savingVat, setSavingVat] = useState(false)

  // Session timeout state
  const [sessionTimeout, setSessionTimeout] = useState(30)
  const [editingSessionTimeout, setEditingSessionTimeout] = useState(false)
  const [savingSessionTimeout, setSavingSessionTimeout] = useState(false)

  // Branch management state
  const [branches, setBranches] = useState([])
  const [showBranchModal, setShowBranchModal] = useState(false)
  const [editingBranch, setEditingBranch] = useState(null)
  const [branchForm, setBranchForm] = useState({
    code: '',
    name: '',
    address: '',
    city: '',
    phone: '',
    email: '',
    manager_name: '',
    manager_phone: '',
    notes: '',
    is_active: true
  })
  const [savingBranch, setSavingBranch] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)

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

    // Load VAT rate from database
    loadVatRate()

    // Load session timeout setting
    loadSessionTimeout()

    // Load branches
    loadBranches()
  }, [settings, currentLanguage, canManageSettings, t])

  const loadVatRate = async () => {
    try {
      const rate = await systemSettingsService.getVatRate()
      setVatRate(rate)
    } catch (error) {
      console.error('Error loading VAT rate:', error)
    }
  }

  const loadSessionTimeout = async () => {
    try {
      const response = await systemSettingsService.getSessionTimeout()
      if (response && response.sessionTimeoutMinutes) {
        setSessionTimeout(response.sessionTimeoutMinutes)
      }
    } catch (error) {
      console.error('Error loading session timeout:', error)
    }
  }

  const handleSaveSessionTimeout = async () => {
    try {
      setSavingSessionTimeout(true)
      await systemSettingsService.updateSessionTimeout(sessionTimeout)
      setMessage({ type: 'success', text: t('sessionTimeoutUpdated', 'Session timeout updated successfully') })
      setEditingSessionTimeout(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: error.message || t('failedToUpdateSessionTimeout', 'Failed to update session timeout') })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSavingSessionTimeout(false)
    }
  }

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)
      const response = await branchService.getAll({ limit: 100 })
      if (response.success) {
        setBranches(response.data || [])
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  const handleSaveVatRate = async () => {
    try {
      setSavingVat(true)
      await systemSettingsService.updateSetting('vat_rate_percentage', vatRate)
      setMessage({ type: 'success', text: 'VAT rate updated successfully' })
      setEditingVat(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update VAT rate' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSavingVat(false)
    }
  }

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

  // Branch management functions
  const handleAddBranch = () => {
    setBranchForm({
      code: '',
      name: '',
      address: '',
      city: '',
      phone: '',
      email: '',
      manager_name: '',
      manager_phone: '',
      notes: '',
      is_active: true
    })
    setEditingBranch(null)
    setShowBranchModal(true)
  }

  const handleEditBranch = (branch) => {
    setBranchForm({
      code: branch.code || '',
      name: branch.name || '',
      address: branch.address || '',
      city: branch.city || '',
      phone: branch.phone || '',
      email: branch.email || '',
      manager_name: branch.manager_name || '',
      manager_phone: branch.manager_phone || '',
      notes: branch.notes || '',
      is_active: branch.is_active !== undefined ? branch.is_active : true
    })
    setEditingBranch(branch)
    setShowBranchModal(true)
  }

  const handleSaveBranch = async (e) => {
    e.preventDefault()

    if (!branchForm.code || !branchForm.name) {
      setMessage({ type: 'error', text: 'Branch code and name are required' })
      setTimeout(() => setMessage(null), 3000)
      return
    }

    try {
      setSavingBranch(true)

      let response
      if (editingBranch) {
        response = await branchService.update(editingBranch.id, branchForm)
      } else {
        response = await branchService.create(branchForm)
      }

      if (response.success) {
        dataCacheService.invalidateBranches() // Clear cache
        setMessage({
          type: 'success',
          text: `Branch ${editingBranch ? 'updated' : 'created'} successfully`
        })
        setShowBranchModal(false)
        loadBranches()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to save branch' })
      }

      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error saving branch:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to save branch' })
      setTimeout(() => setMessage(null), 3000)
    } finally {
      setSavingBranch(false)
    }
  }

  const handleDeleteBranch = async (branch) => {
    if (!confirm(`Are you sure you want to delete branch "${branch.name}"? This will deactivate the branch if it has associated orders.`)) {
      return
    }

    try {
      const response = await branchService.delete(branch.id)

      if (response.success) {
        dataCacheService.invalidateBranches() // Clear cache
        setMessage({ type: 'success', text: response.message || 'Branch deleted successfully' })
        loadBranches()
      } else {
        setMessage({ type: 'error', text: response.error || 'Failed to delete branch' })
      }

      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting branch:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to delete branch' })
      setTimeout(() => setMessage(null), 3000)
    }
  }

  if (!canManageSettings) {
    return (
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <Shield size={24} className="text-slate-700" />
          <div>
            <h1 className="text-xl font-bold text-slate-800 m-0">{t('settings')}</h1>
            <p className="text-sm text-slate-500 m-0">{t('systemConfiguration')}</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <AlertTriangle size={48} className="mb-4" />
          <h2 className="text-lg font-semibold text-slate-700 m-0 mb-2">Access Denied</h2>
          <p className="text-sm m-0">You don't have permission to access system settings.</p>
        </div>
      </div>
    )
  }

  const tabs = [
    { id: 'localization', label: t('localizationSettings'), icon: Globe },
    { id: 'system', label: t('generalSettings'), icon: SettingsIcon },
    { id: 'security', label: t('securitySettings', 'Security'), icon: Lock },
    { id: 'branches', label: t('branchManagement', 'Branch Management'), icon: Building },
    { id: 'expense-categories', label: t('expenseCategories', 'Expense Categories'), icon: Tag },
    { id: 'appearance', label: t('appearanceSettings'), icon: Palette },
    { id: 'notifications', label: t('notificationSettings'), icon: Bell }
  ]

  return (
    <div className="p-6">
      {/* Page Header */}
      <div className="flex items-center gap-3 mb-6">
        <SettingsIcon size={24} className="text-slate-700" />
        <div>
          <h1 className="text-xl font-bold text-slate-800 m-0">{t('settings')}</h1>
          <p className="text-sm text-slate-500 m-0">{t('configureGlobalSettings')}</p>
        </div>
      </div>

      {message && (
        <div className={`flex items-center gap-2 px-4 py-3 mb-4 text-sm ${
          message.type === 'success'
            ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
            : 'bg-red-50 border border-red-200 text-red-700'
        }`}>
          {message.text}
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="tab-navigation">
        {tabs.map(tab => {
          const IconComponent = tab.icon
          return (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Settings Content */}
      <div className="tab-content">
          {/* Localization Settings */}
          {activeTab === 'localization' && (
            <div className="form-section">
              <div className="form-section-title">
                <Globe size={18} />
                {t('localizationSettings')}
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500 m-0">{t('configureLanguageAndRegion')}</p>

              <div className="form-grid p-5">
                <div className="form-group">
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
                  <span className="text-xs text-slate-400 italic mt-1">{t('languagePreferenceSavedPerUser')}</span>
                </div>

                <div className="form-group">
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

                <div className="form-group">
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

                <div className="form-group">
                  <label htmlFor="currency">{t('currency')}</label>
                  <select
                    id="currency"
                    value={formData.currency}
                    onChange={(e) => handleInputChange('currency', e.target.value)}
                  >
                    <option value="OMR">OMR - Omani Rial</option>
                  </select>
                </div>

                <div className="form-group">
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

                <div className="form-group">
                  <label htmlFor="firstDayOfWeek">{t('firstDayOfWeek')}</label>
                  <select
                    id="firstDayOfWeek"
                    value={formData.firstDayOfWeek}
                    onChange={(e) => handleInputChange('firstDayOfWeek', parseInt(e.target.value))}
                  >
                    <option value={0}>{t('sunday')}</option>
                    <option value={1}>{t('monday')}</option>
                    <option value={6}>{t('saturday')}</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* System Settings */}
          {activeTab === 'system' && (
            <div className="form-section">
              <div className="form-section-title">
                <SettingsIcon size={18} />
                {t('generalSettings')}
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500 m-0">{t('configureGlobalSettings')}</p>

              <div className="form-grid p-5">
                <div className="form-group">
                  <label htmlFor="fiscalYearStart">{t('fiscalYearStart', 'Fiscal Year Start')}</label>
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

                <div className="form-group">
                  <label htmlFor="vatRate" className="flex items-center gap-1">
                    <Percent size={14} />
                    {t('vatRate', 'VAT Rate')} (%)
                  </label>
                  {editingVat ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        id="vatRate"
                        min="0"
                        max="100"
                        step="0.01"
                        value={vatRate}
                        onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                        className="flex-1"
                        disabled={savingVat}
                      />
                      <button
                        onClick={handleSaveVatRate}
                        disabled={savingVat}
                        className="btn btn-primary btn-sm"
                      >
                        {savingVat ? t('saving') : t('save')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingVat(false)
                          loadVatRate()
                        }}
                        disabled={savingVat}
                        className="btn btn-outline btn-sm"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="flex-1 px-3 py-2.5 bg-slate-100 border border-slate-200 text-sm">
                        {vatRate}%
                      </span>
                      <button
                        onClick={() => setEditingVat(true)}
                        className="btn btn-outline btn-sm"
                      >
                        {t('edit')}
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-slate-400 mt-1">
                    {t('vatRateDescription', 'This rate will be applied to all taxable customers\' sales orders')}
                  </span>
                </div>
              </div>

              {/* Settings Info */}
              <div className="mx-5 mb-5 p-4 bg-slate-100 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 m-0 mb-3">{t('currentSettingsInformation')}</h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t('settingsSource')}:</span>
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium">
                      {getSettingsInfo().source.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t('isCustomized')}:</span>
                    <span className="text-slate-800">{getSettingsInfo().isCustomized ? t('yes') : t('no')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t('company')}:</span>
                    <span className="text-slate-800">{getSettingsInfo().companyName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">{t('user')}:</span>
                    <span className="text-slate-800">{getSettingsInfo().userName}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="form-section">
              <div className="form-section-title">
                <Lock size={18} />
                {t('securitySettings', 'Security Settings')}
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500 m-0">{t('manageAccountSecurity', 'Manage your account security and two-factor authentication')}</p>

              <div className="form-grid p-5">
                {/* Session Timeout Setting */}
                <div className="form-group">
                  <label htmlFor="sessionTimeout" className="flex items-center gap-2">
                    <Clock size={14} />
                    {t('sessionTimeout', 'Session Timeout')} ({t('minutes', 'minutes')})
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium ml-2">
                      {t('globalSetting', 'Global Setting')}
                    </span>
                  </label>
                  {editingSessionTimeout ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="number"
                        id="sessionTimeout"
                        min="10"
                        max="120"
                        step="5"
                        value={sessionTimeout}
                        onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 30)}
                        className="flex-1"
                        disabled={savingSessionTimeout}
                      />
                      <button
                        onClick={handleSaveSessionTimeout}
                        disabled={savingSessionTimeout}
                        className="btn btn-primary btn-sm"
                      >
                        {savingSessionTimeout ? t('saving') : t('save')}
                      </button>
                      <button
                        onClick={() => {
                          setEditingSessionTimeout(false)
                          loadSessionTimeout()
                        }}
                        disabled={savingSessionTimeout}
                        className="btn btn-outline btn-sm"
                      >
                        {t('cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-2 items-center">
                      <span className="flex-1 px-3 py-2.5 bg-slate-100 border border-slate-200 text-sm">
                        {sessionTimeout} {t('minutes', 'minutes')}
                      </span>
                      <button
                        onClick={() => setEditingSessionTimeout(true)}
                        className="btn btn-outline btn-sm"
                      >
                        {t('edit')}
                      </button>
                    </div>
                  )}
                  <span className="text-xs text-slate-400 mt-1 block">
                    {t('sessionTimeoutDescription', 'Automatically log out users after this period of inactivity. Valid range: 10-120 minutes.')}
                  </span>
                  <span className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                    <Users size={12} />
                    {t('sessionTimeoutAffectsAll', 'This setting affects all users in the company.')}
                  </span>
                </div>
              </div>

              {/* Two-Factor Authentication */}
              <div className="mx-5 mb-5 p-5 bg-slate-50 border border-slate-200">
                <h4 className="text-sm font-semibold text-slate-700 m-0 mb-1 flex items-center gap-2">
                  {t('twoFactorAuth', 'Two-Factor Authentication')}
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium">
                    {t('personalSetting', 'Personal Setting')}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 m-0 mb-4">
                  {t('mfaPersonalDescription', 'MFA is configured individually for each user account.')}
                </p>
                <MFASetup />
              </div>
            </div>
          )}

          {/* Branch Management */}
          {activeTab === 'branches' && (
            <div className="form-section">
              <div className="form-section-title">
                <Building size={18} />
                {t('branchManagement', 'Branch Management')}
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500 m-0">{t('manageBranchesDesc', 'Manage company branches and locations')}</p>

              <div className="p-5">
                <div className="mb-4">
                  <button className="btn btn-primary" onClick={handleAddBranch}>
                    <Plus size={16} />
                    {t('addBranch', 'Add Branch')}
                  </button>
                </div>

                {branches.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                    <Building size={48} className="mb-3" />
                    <p className="text-sm m-0 mb-3">{t('noBranches', 'No branches configured yet')}</p>
                    <button className="btn btn-primary" onClick={handleAddBranch}>
                      <Plus size={16} />
                      {t('addFirstBranch', 'Add First Branch')}
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="data-table w-full">
                      <thead>
                        <tr>
                          <th>{t('code', 'Code')}</th>
                          <th>{t('name', 'Name')}</th>
                          <th>{t('city', 'City')}</th>
                          <th>{t('phone', 'Phone')}</th>
                          <th>{t('manager', 'Manager')}</th>
                          <th>{t('status', 'Status')}</th>
                          <th className="text-right">{t('actions', 'Actions')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {branches.map(branch => (
                          <tr key={branch.id}>
                            <td><strong className="text-slate-800">{branch.code}</strong></td>
                            <td>{branch.name}</td>
                            <td>{branch.city || '-'}</td>
                            <td>{branch.phone || '-'}</td>
                            <td>{branch.manager_name || '-'}</td>
                            <td>
                              <span className={`px-2 py-1 text-xs font-medium ${
                                branch.is_active
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}>
                                {branch.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                              </span>
                            </td>
                            <td>
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                  onClick={() => handleEditBranch(branch)}
                                  title={t('edit', 'Edit')}
                                >
                                  <Edit size={16} />
                                </button>
                                <button
                                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                  onClick={() => handleDeleteBranch(branch)}
                                  title={t('delete', 'Delete')}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Branch Modal */}
              <Modal
                isOpen={showBranchModal}
                onClose={() => !savingBranch && setShowBranchModal(false)}
                title={
                  <span className="flex items-center gap-2">
                    <Building size={20} />
                    {editingBranch ? t('editBranch', 'Edit Branch') : t('addBranch', 'Add Branch')}
                  </span>
                }
                size="md"
                footer={
                  <>
                    <button
                      type="button"
                      className="btn btn-outline"
                      onClick={() => setShowBranchModal(false)}
                      disabled={savingBranch}
                    >
                      {t('cancel', 'Cancel')}
                    </button>
                    <button
                      type="submit"
                      form="branch-form"
                      className="btn btn-primary"
                      disabled={savingBranch}
                    >
                      {savingBranch ? t('saving', 'Saving...') : t('save', 'Save')}
                    </button>
                  </>
                }
              >
                <form id="branch-form" onSubmit={handleSaveBranch}>
                  <div className="form-grid">
                    <div className="form-group">
                      <label htmlFor="branchCode">
                        {t('branchCode', 'Branch Code')} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="branchCode"
                        value={branchForm.code}
                        onChange={(e) => setBranchForm({...branchForm, code: e.target.value})}
                        required
                        disabled={savingBranch}
                        placeholder="HQ, BR1, BR2"
                      />
                      <small>{t('branchCodeHint', 'Unique identifier (e.g., HQ, BR1)')}</small>
                    </div>

                    <div className="form-group">
                      <label htmlFor="branchName">
                        {t('branchName', 'Branch Name')} <span className="required">*</span>
                      </label>
                      <input
                        type="text"
                        id="branchName"
                        value={branchForm.name}
                        onChange={(e) => setBranchForm({...branchForm, name: e.target.value})}
                        required
                        disabled={savingBranch}
                        placeholder="Head Office, Muscat Branch"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="branchAddress">{t('address', 'Address')}</label>
                      <input
                        type="text"
                        id="branchAddress"
                        value={branchForm.address}
                        onChange={(e) => setBranchForm({...branchForm, address: e.target.value})}
                        disabled={savingBranch}
                        placeholder="Street address"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="branchCity">{t('city', 'City')}</label>
                      <input
                        type="text"
                        id="branchCity"
                        value={branchForm.city}
                        onChange={(e) => setBranchForm({...branchForm, city: e.target.value})}
                        disabled={savingBranch}
                        placeholder="Muscat"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="branchPhone">{t('phone', 'Phone')}</label>
                      <input
                        type="tel"
                        id="branchPhone"
                        value={branchForm.phone}
                        onChange={(e) => setBranchForm({...branchForm, phone: e.target.value})}
                        disabled={savingBranch}
                        placeholder="+968 1234 5678"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="branchEmail">{t('email', 'Email')}</label>
                      <input
                        type="email"
                        id="branchEmail"
                        value={branchForm.email}
                        onChange={(e) => setBranchForm({...branchForm, email: e.target.value})}
                        disabled={savingBranch}
                        placeholder="branch@company.com"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="managerName">{t('managerName', 'Manager Name')}</label>
                      <input
                        type="text"
                        id="managerName"
                        value={branchForm.manager_name}
                        onChange={(e) => setBranchForm({...branchForm, manager_name: e.target.value})}
                        disabled={savingBranch}
                        placeholder="John Doe"
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="managerPhone">{t('managerPhone', 'Manager Phone')}</label>
                      <input
                        type="tel"
                        id="managerPhone"
                        value={branchForm.manager_phone}
                        onChange={(e) => setBranchForm({...branchForm, manager_phone: e.target.value})}
                        disabled={savingBranch}
                        placeholder="+968 9876 5432"
                      />
                    </div>

                    <div className="form-group full-width">
                      <label htmlFor="branchNotes">{t('notes', 'Notes')}</label>
                      <textarea
                        id="branchNotes"
                        value={branchForm.notes}
                        onChange={(e) => setBranchForm({...branchForm, notes: e.target.value})}
                        disabled={savingBranch}
                        rows="3"
                        placeholder="Additional information..."
                      />
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={branchForm.is_active}
                          onChange={(e) => setBranchForm({...branchForm, is_active: e.target.checked})}
                          disabled={savingBranch}
                        />
                        {t('active', 'Active')}
                      </label>
                      <small>{t('activeHint', 'Active branches can be selected in orders')}</small>
                    </div>
                  </div>
                </form>
              </Modal>
            </div>
          )}

          {/* Expense Categories Settings */}
          {activeTab === 'expense-categories' && (
            <div className="form-section">
              <ExpenseCategoryManager />
            </div>
          )}

          {/* Appearance Settings */}
          {activeTab === 'appearance' && (
            <div className="form-section">
              <div className="form-section-title">
                <Palette size={18} />
                {t('appearanceSettings')}
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500 m-0">{t('customizeVisualAppearance')}</p>

              <div className="p-5">
                <div className="form-group">
                  <label>{t('theme')}</label>
                  <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-blue-500 text-blue-700 text-sm font-medium cursor-pointer">
                      <Monitor size={18} />
                      {t('lightTheme')}
                    </button>
                    <button className="flex items-center gap-2 px-4 py-3 bg-white border border-slate-200 text-slate-600 text-sm font-medium cursor-pointer hover:bg-slate-50">
                      <Monitor size={18} />
                      {t('darkTheme')}
                    </button>
                  </div>
                  <span className="text-xs text-slate-400 italic mt-2">{t('availableInFutureUpdate')}</span>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Settings */}
          {activeTab === 'notifications' && (
            <div className="form-section">
              <div className="form-section-title">
                <Bell size={18} />
                {t('notificationSettings')}
              </div>
              <p className="px-5 pt-4 text-sm text-slate-500 m-0">{t('configureNotificationsAndAlerts')}</p>

              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Bell size={48} className="mb-3 opacity-50" />
                <h3 className="text-sm font-semibold text-slate-600 m-0 mb-1">{t('comingSoon')}</h3>
                <p className="text-xs m-0">{t('availableInFutureUpdate')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Settings Actions - Fixed at bottom */}
        <div className="form-actions mt-6">
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
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white animate-spin mr-2" style={{ borderRadius: '50%' }} />
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
  )
}

export default Settings