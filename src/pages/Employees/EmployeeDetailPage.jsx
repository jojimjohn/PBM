import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import employeeService from '../../services/employeeService'
import DocumentExpiryBadge from './components/DocumentExpiryBadge'
import LocationAssignmentPanel from './components/LocationAssignmentPanel'
import { ArrowLeft, Save, Trash2 } from 'lucide-react'

const TABS = ['Profile', 'Addresses', 'Documents', 'Locations']

const EMPTY_EMPLOYEE = {
  full_name: '', phone: '', email: '', nationality: '',
  date_of_birth: '', gender: '', employment_start_date: '',
  designation: '', department: '', status: 'active'
}

const EMPTY_ADDRESS = {
  address_type: 'oman_residential', address_line1: '', address_line2: '',
  city: '', state: '', country: '', postal_code: ''
}

const EMPTY_DOCUMENT = {
  document_type: 'passport', document_number: '',
  issue_date: '', expiry_date: '', file_path: '', notes: ''
}

const EmployeeDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const { selectedCompany } = useAuth()
  const isNew = id === 'new'
  const canManage = hasPermission('MANAGE_EMPLOYEES')
  const canDelete = hasPermission('DELETE_EMPLOYEES')

  const [activeTab, setActiveTab] = useState('Profile')
  const [employee, setEmployee] = useState(EMPTY_EMPLOYEE)
  const [addresses, setAddresses] = useState([])
  const [documents, setDocuments] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [docForm, setDocForm] = useState(null) // null = hidden, object = editing
  const [editingDocId, setEditingDocId] = useState(null)

  // Load employee data
  const loadEmployee = useCallback(async () => {
    if (isNew) return
    setLoading(true)
    const result = await employeeService.getById(id)
    if (result.success && result.data) {
      const { addresses: addrs, ...emp } = result.data
      setEmployee(emp)
      setAddresses(addrs || [])
    } else {
      navigate('/employees')
    }
    setLoading(false)
  }, [id, isNew, navigate])

  const loadDocuments = useCallback(async () => {
    if (isNew) return
    const result = await employeeService.getDocuments(id)
    if (result.success) setDocuments(result.data)
  }, [id, isNew])

  const loadLocations = useCallback(async () => {
    // Load available supplier_locations for the assignment dropdown
    try {
      const { makeAuthenticatedRequest } = await import('../../services/authService').then(m => m.default)
      const { API_BASE_URL } = await import('../../config/api.js')
      const data = await makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations`)
      setLocations(data.data || data || [])
    } catch { setLocations([]) }
  }, [])

  useEffect(() => { loadEmployee() }, [loadEmployee])
  useEffect(() => { if (activeTab === 'Documents' && !isNew) loadDocuments() }, [activeTab, loadDocuments, isNew])
  useEffect(() => { if (activeTab === 'Locations') loadLocations() }, [activeTab, loadLocations])

  // Save employee profile
  const handleSaveProfile = async () => {
    setSaving(true)
    const payload = { ...employee }
    delete payload.id
    delete payload.employee_code
    delete payload.created_at
    delete payload.updated_at

    const result = isNew
      ? await employeeService.create(payload)
      : await employeeService.update(id, payload)

    if (result.success) {
      if (isNew && result.data?.id) {
        navigate(`/employees/${result.data.id}`, { replace: true })
      } else {
        loadEmployee()
      }
    }
    setSaving(false)
  }

  // Save addresses
  const handleSaveAddresses = async () => {
    setSaving(true)
    const result = await employeeService.updateAddresses(id, addresses)
    if (result.success && result.data) setAddresses(result.data)
    setSaving(false)
  }

  // Delete (soft)
  const handleDelete = async () => {
    if (!confirm('Deactivate this employee? This will set their status to terminated.')) return
    const result = await employeeService.delete(id)
    if (result.success) navigate('/employees')
  }

  // Document save
  const handleSaveDocument = async () => {
    setSaving(true)
    const payload = { ...docForm }
    if (!payload.issue_date) payload.issue_date = null
    if (!payload.expiry_date) payload.expiry_date = null
    if (!payload.file_path) payload.file_path = null

    const result = editingDocId
      ? await employeeService.updateDocument(id, editingDocId, payload)
      : await employeeService.addDocument(id, payload)

    if (result.success) {
      setDocForm(null)
      setEditingDocId(null)
      loadDocuments()
    }
    setSaving(false)
  }

  // Ensure oman + home_country slots exist
  const ensureAddressSlots = (addrs) => {
    const result = [...addrs]
    if (!result.find(a => a.address_type === 'oman_residential')) {
      result.push({ ...EMPTY_ADDRESS, address_type: 'oman_residential' })
    }
    if (!result.find(a => a.address_type === 'home_country')) {
      result.push({ ...EMPTY_ADDRESS, address_type: 'home_country' })
    }
    return result
  }

  if (loading) return <div className="p-6 text-gray-400">Loading...</div>

  const inputClass = "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200 focus:outline-none focus:border-accent/50"
  const labelClass = "block text-xs font-medium text-gray-400 mb-1"

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/employees')} className="p-2 rounded-lg hover:bg-white/5 text-gray-400">
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1 className="text-xl font-semibold text-gray-100">
              {isNew ? 'New Employee' : employee.full_name}
            </h1>
            {!isNew && <p className="text-xs text-gray-500">{employee.employee_code}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canDelete && !isNew && employee.status !== 'terminated' && (
            <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 text-sm">
              <Trash2 size={14} /> Deactivate
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      {!isNew && (
        <div className="flex gap-1 border-b border-white/10">
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? 'border-accent text-accent'
                  : 'border-transparent text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      )}

      {/* Profile Tab */}
      {(activeTab === 'Profile' || isNew) && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className={labelClass}>Full Name *</label>
              <input className={inputClass} value={employee.full_name} onChange={e => setEmployee(p => ({ ...p, full_name: e.target.value }))} required />
            </div>
            <div>
              <label className={labelClass}>Phone</label>
              <input className={inputClass} value={employee.phone || ''} onChange={e => setEmployee(p => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Email</label>
              <input className={inputClass} type="email" value={employee.email || ''} onChange={e => setEmployee(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Nationality</label>
              <input className={inputClass} value={employee.nationality || ''} onChange={e => setEmployee(p => ({ ...p, nationality: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Date of Birth</label>
              <input className={inputClass} type="date" value={employee.date_of_birth || ''} onChange={e => setEmployee(p => ({ ...p, date_of_birth: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Gender</label>
              <select className={inputClass} value={employee.gender || ''} onChange={e => setEmployee(p => ({ ...p, gender: e.target.value || null }))}>
                <option value="">Select...</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>Employment Start Date</label>
              <input className={inputClass} type="date" value={employee.employment_start_date || ''} onChange={e => setEmployee(p => ({ ...p, employment_start_date: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Designation</label>
              <input className={inputClass} value={employee.designation || ''} onChange={e => setEmployee(p => ({ ...p, designation: e.target.value }))} />
            </div>
            <div>
              <label className={labelClass}>Department</label>
              <input className={inputClass} value={employee.department || ''} onChange={e => setEmployee(p => ({ ...p, department: e.target.value }))} />
            </div>
            {!isNew && (
              <div>
                <label className={labelClass}>Status</label>
                <select className={inputClass} value={employee.status} onChange={e => setEmployee(p => ({ ...p, status: e.target.value }))}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="terminated">Terminated</option>
                </select>
              </div>
            )}
          </div>
          {canManage && (
            <button
              onClick={handleSaveProfile}
              disabled={saving || !employee.full_name}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving...' : isNew ? 'Create Employee' : 'Save Changes'}
            </button>
          )}
        </div>
      )}

      {/* Addresses Tab */}
      {activeTab === 'Addresses' && !isNew && (
        <div className="space-y-6">
          {ensureAddressSlots(addresses).map((addr, idx) => (
            <div key={addr.address_type} className="p-4 rounded-xl bg-white/3 border border-white/10 space-y-3">
              <h3 className="text-sm font-medium text-gray-300">
                {addr.address_type === 'oman_residential' ? 'Oman Residential Address' : 'Home Country Address'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Address Line 1</label>
                  <input className={inputClass} value={addr.address_line1 || ''} onChange={e => {
                    const updated = ensureAddressSlots(addresses).map(a =>
                      a.address_type === addr.address_type ? { ...a, address_line1: e.target.value } : a
                    )
                    setAddresses(updated)
                  }} />
                </div>
                <div>
                  <label className={labelClass}>Address Line 2</label>
                  <input className={inputClass} value={addr.address_line2 || ''} onChange={e => {
                    const updated = ensureAddressSlots(addresses).map(a =>
                      a.address_type === addr.address_type ? { ...a, address_line2: e.target.value } : a
                    )
                    setAddresses(updated)
                  }} />
                </div>
                <div>
                  <label className={labelClass}>City</label>
                  <input className={inputClass} value={addr.city || ''} onChange={e => {
                    const updated = ensureAddressSlots(addresses).map(a =>
                      a.address_type === addr.address_type ? { ...a, city: e.target.value } : a
                    )
                    setAddresses(updated)
                  }} />
                </div>
                <div>
                  <label className={labelClass}>State / Region</label>
                  <input className={inputClass} value={addr.state || ''} onChange={e => {
                    const updated = ensureAddressSlots(addresses).map(a =>
                      a.address_type === addr.address_type ? { ...a, state: e.target.value } : a
                    )
                    setAddresses(updated)
                  }} />
                </div>
                <div>
                  <label className={labelClass}>Country</label>
                  <input className={inputClass} value={addr.country || ''} onChange={e => {
                    const updated = ensureAddressSlots(addresses).map(a =>
                      a.address_type === addr.address_type ? { ...a, country: e.target.value } : a
                    )
                    setAddresses(updated)
                  }} />
                </div>
                <div>
                  <label className={labelClass}>Postal Code</label>
                  <input className={inputClass} value={addr.postal_code || ''} onChange={e => {
                    const updated = ensureAddressSlots(addresses).map(a =>
                      a.address_type === addr.address_type ? { ...a, postal_code: e.target.value } : a
                    )
                    setAddresses(updated)
                  }} />
                </div>
              </div>
            </div>
          ))}
          {canManage && (
            <button
              onClick={handleSaveAddresses}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 transition-colors"
            >
              <Save size={14} />
              {saving ? 'Saving...' : 'Save Addresses'}
            </button>
          )}
        </div>
      )}

      {/* Documents Tab */}
      {activeTab === 'Documents' && !isNew && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-medium text-gray-300">Employee Documents</h3>
            {canManage && !docForm && (
              <button
                onClick={() => { setDocForm({ ...EMPTY_DOCUMENT }); setEditingDocId(null) }}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                + Add Document
              </button>
            )}
          </div>

          {/* Document form */}
          {docForm && (
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                <div>
                  <label className={labelClass}>Document Type *</label>
                  <select className={inputClass} value={docForm.document_type} onChange={e => setDocForm(f => ({ ...f, document_type: e.target.value }))}>
                    <option value="passport">Passport</option>
                    <option value="resident_id">Resident ID</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Document Number</label>
                  <input className={inputClass} value={docForm.document_number} onChange={e => setDocForm(f => ({ ...f, document_number: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Issue Date</label>
                  <input className={inputClass} type="date" value={docForm.issue_date || ''} onChange={e => setDocForm(f => ({ ...f, issue_date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>Expiry Date</label>
                  <input className={inputClass} type="date" value={docForm.expiry_date || ''} onChange={e => setDocForm(f => ({ ...f, expiry_date: e.target.value }))} />
                </div>
                <div>
                  <label className={labelClass}>File Path</label>
                  <input className={inputClass} value={docForm.file_path || ''} onChange={e => setDocForm(f => ({ ...f, file_path: e.target.value }))} placeholder="/uploads/docs/..." />
                </div>
                <div>
                  <label className={labelClass}>Notes</label>
                  <input className={inputClass} value={docForm.notes || ''} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} />
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={handleSaveDocument} disabled={saving} className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 disabled:opacity-50">
                  {saving ? 'Saving...' : editingDocId ? 'Update' : 'Add'}
                </button>
                <button onClick={() => { setDocForm(null); setEditingDocId(null) }} className="px-4 py-2 rounded-lg text-sm text-gray-400 hover:bg-white/5">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Document list */}
          <div className="space-y-2">
            {documents.length === 0 && !docForm && (
              <p className="text-sm text-gray-500 py-4 text-center">No documents recorded</p>
            )}
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-white/3 border border-white/10">
                <div className="flex items-center gap-4">
                  <div>
                    <p className="text-sm text-gray-200 capitalize">{doc.document_type.replace('_', ' ')}</p>
                    {doc.document_number && <p className="text-xs text-gray-500">{doc.document_number}</p>}
                  </div>
                  <DocumentExpiryBadge expiryDate={doc.expiry_date} daysRemaining={doc.daysRemaining} />
                </div>
                <div className="flex items-center gap-2">
                  {doc.expiry_date && <span className="text-xs text-gray-500">Exp: {doc.expiry_date}</span>}
                  {canManage && (
                    <button
                      onClick={() => {
                        setDocForm({
                          document_type: doc.document_type,
                          document_number: doc.document_number || '',
                          issue_date: doc.issue_date || '',
                          expiry_date: doc.expiry_date || '',
                          file_path: doc.file_path || '',
                          notes: doc.notes || ''
                        })
                        setEditingDocId(doc.id)
                      }}
                      className="text-xs text-accent hover:text-accent/80"
                    >
                      Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Locations Tab */}
      {activeTab === 'Locations' && !isNew && (
        <LocationAssignmentPanel employeeId={parseInt(id)} locations={locations} />
      )}
    </div>
  )
}

export default EmployeeDetailPage
