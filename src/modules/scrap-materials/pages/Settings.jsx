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
    { id: 'security', label: t('securitySettings', 'Security'), icon: Lock },
    { id: 'branches', label: t('branchManagement', 'Branch Management'), icon: Building },
    { id: 'expense-categories', label: t('expenseCategories', 'Expense Categories'), icon: Tag },
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

                <div className="setting-group">
                  <label htmlFor="vatRate">
                    <Percent size={16} style={{ display: 'inline', marginRight: '4px' }} />
                    VAT Rate (%)
                  </label>
                  {editingVat ? (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <input
                        type="number"
                        id="vatRate"
                        min="0"
                        max="100"
                        step="0.01"
                        value={vatRate}
                        onChange={(e) => setVatRate(parseFloat(e.target.value) || 0)}
                        style={{ flex: 1 }}
                        disabled={savingVat}
                      />
                      <button
                        onClick={handleSaveVatRate}
                        disabled={savingVat}
                        className="btn btn-primary btn-small"
                      >
                        {savingVat ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={() => {
                          setEditingVat(false)
                          loadVatRate()
                        }}
                        disabled={savingVat}
                        className="btn btn-outline btn-small"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ padding: '8px 12px', background: '#f0f0f0', borderRadius: '4px', flex: 1 }}>
                        {vatRate}%
                      </span>
                      <button
                        onClick={() => setEditingVat(true)}
                        className="btn btn-outline btn-small"
                      >
                        Edit
                      </button>
                    </div>
                  )}
                  <small style={{ color: '#666', display: 'block', marginTop: '4px' }}>
                    This rate will be applied to all taxable customers' sales orders
                  </small>
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

          {/* Security Settings */}
          {activeTab === 'security' && (
            <div className="settings-section">
              <div className="section-header">
                <Lock size={20} />
                <h2>{t('securitySettings', 'Security Settings')}</h2>
                <p>{t('manageAccountSecurity', 'Manage your account security and two-factor authentication')}</p>
              </div>

              <div className="security-content">
                <MFASetup />
              </div>
            </div>
          )}

          {/* Branch Management */}
          {activeTab === 'branches' && (
            <div className="settings-section">
              <div className="section-header">
                <Building size={20} />
                <h2>{t('branchManagement', 'Branch Management')}</h2>
                <p>{t('manageBranchesDesc', 'Manage company branches and locations')}</p>
              </div>

              <div className="section-actions" style={{ marginBottom: '1.5rem' }}>
                <button className="btn btn-primary" onClick={handleAddBranch}>
                  <Plus size={16} />
                  {t('addBranch', 'Add Branch')}
                </button>
              </div>

              <div className="branches-table-container">
                {branches.length === 0 ? (
                  <div className="empty-state">
                    <Building size={48} />
                    <p>{t('noBranches', 'No branches configured yet')}</p>
                    <button className="btn btn-primary" onClick={handleAddBranch}>
                      <Plus size={16} />
                      {t('addFirstBranch', 'Add First Branch')}
                    </button>
                  </div>
                ) : (
                  <table className="branches-table">
                    <thead>
                      <tr>
                        <th>{t('code', 'Code')}</th>
                        <th>{t('name', 'Name')}</th>
                        <th>{t('city', 'City')}</th>
                        <th>{t('phone', 'Phone')}</th>
                        <th>{t('manager', 'Manager')}</th>
                        <th>{t('status', 'Status')}</th>
                        <th>{t('actions', 'Actions')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {branches.map(branch => (
                        <tr key={branch.id}>
                          <td><strong>{branch.code}</strong></td>
                          <td>{branch.name}</td>
                          <td>{branch.city || '-'}</td>
                          <td>{branch.phone || '-'}</td>
                          <td>{branch.manager_name || '-'}</td>
                          <td>
                            <span className={`status-badge ${branch.is_active ? 'active' : 'inactive'}`}>
                              {branch.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                            </span>
                          </td>
                          <td>
                            <div className="table-actions">
                              <button
                                className="btn-icon"
                                onClick={() => handleEditBranch(branch)}
                                title={t('edit', 'Edit')}
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                className="btn-icon delete"
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
            <div className="settings-section">
              <ExpenseCategoryManager />
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
