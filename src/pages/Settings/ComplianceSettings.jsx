import React, { useState, useEffect } from 'react'
import complianceService from '../../services/complianceService'
import showToast from '../../components/ui/Toast'
import { Save, ShieldCheck } from 'lucide-react'

/**
 * ComplianceSettings — Company-level compliance data used in
 * WCN manifests (MD 18/2017) and OTA e-invoices.
 *
 * These values populate the seller/receiver sections of generated documents.
 * Required for WCN manifest generation and e-invoice issuance.
 */
const FIELDS = [
  { key: 'company.name', label: 'Company Legal Name', placeholder: 'Al Ramrami Trading Enterprises LLC' },
  { key: 'company.cr_number', label: 'Commercial Registration (CR) Number', placeholder: '1234567' },
  { key: 'company.vat_registration', label: 'VAT Registration Number', placeholder: 'OM1234567890003' },
  { key: 'company.address', label: 'Registered Address', placeholder: 'Building 123, Way 4567, Al Khuwair, Muscat, Oman' },
  { key: 'company.environmental_permit_number', label: 'Environmental Permit # (MD 18/2017)', placeholder: 'ENV-2024-OMAN-####' },
  { key: 'company.authorized_signatory_name', label: 'Authorized Signatory (for WCN)', placeholder: 'John Doe, Operations Manager' },
  { key: 'company.treatment_method', label: 'Default Treatment Method', placeholder: 'Collection, Sorting & Transfer' }
]

const ComplianceSettings = () => {
  const [values, setValues] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    complianceService.getCompanyInfo().then(result => {
      if (result.success) setValues(result.data || {})
      setLoading(false)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const result = await complianceService.saveCompanyInfo(values)
    if (result.success) {
      showToast.success('Compliance settings saved')
      if (result.data) setValues(result.data)
    } else {
      showToast.error(result.error || 'Failed to save')
    }
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-slate-500">Loading compliance settings...</div>

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <ShieldCheck className="text-emerald-600" size={24} />
        <div>
          <h1 className="text-xl font-bold text-slate-800">Compliance Settings</h1>
          <p className="text-sm text-slate-500">
            Company details used in WCN manifests (MD 18/2017) and OTA e-invoices.
            These values appear on every generated document.
          </p>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="form-section">
          <div className="form-section-title">
            <ShieldCheck size={18} />
            Company Compliance Data
          </div>
          <div className="form-grid">
            {FIELDS.map(field => (
              <div className="form-group" key={field.key} style={{ gridColumn: field.key === 'company.address' ? '1 / -1' : 'auto' }}>
                <label>{field.label}</label>
                <input
                  type="text"
                  value={values[field.key] || ''}
                  onChange={e => setValues(v => ({ ...v, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions mt-6">
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn btn-primary"
          >
            <Save size={16} />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>

      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-900">
        <strong>Why this matters:</strong>
        <ul className="mt-2 list-disc ml-5 space-y-1 text-xs">
          <li><strong>VAT registration</strong> is required on every e-invoice PDF and XML.</li>
          <li><strong>Environmental Permit #</strong> is required on WCN manifests for MD 18/2017.</li>
          <li><strong>Authorized signatory</strong> name appears on the receiver section of waste manifests.</li>
          <li>These settings apply to the currently-selected company.</li>
        </ul>
      </div>
    </div>
  )
}

export default ComplianceSettings
