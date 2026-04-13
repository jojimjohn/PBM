import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import { useAuth } from '../../context/AuthContext'
import employeeService from '../../services/employeeService'
import authService from '../../services/authService'
import { API_BASE_URL } from '../../config/api.js'
import Modal from '../../components/ui/Modal'
import showToast from '../../components/ui/Toast'
import DocumentExpiryBadge from './components/DocumentExpiryBadge'
import LocationAssignmentPanel from './components/LocationAssignmentPanel'
import EmployeeFormModal from './components/EmployeeFormModal'
import { ArrowLeft, Edit, Save, Plus, FileText, MapPin, User, Home } from 'lucide-react'

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'addresses', label: 'Addresses', icon: Home },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'locations', label: 'Locations', icon: MapPin }
]

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
  const canManage = hasPermission('MANAGE_EMPLOYEES')

  const [activeTab, setActiveTab] = useState('profile')
  const [employee, setEmployee] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [documents, setDocuments] = useState([])
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Modal state
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [docForm, setDocForm] = useState(EMPTY_DOCUMENT)
  const [editingDocId, setEditingDocId] = useState(null)

  const loadEmployee = useCallback(async () => {
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
  }, [id, navigate])

  const loadDocuments = useCallback(async () => {
    const result = await employeeService.getDocuments(id)
    if (result.success) setDocuments(result.data)
  }, [id])

  const loadLocations = useCallback(async () => {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/supplier-locations`)
      setLocations(data.data || data || [])
    } catch { setLocations([]) }
  }, [])

  useEffect(() => { loadEmployee() }, [loadEmployee])
  useEffect(() => { if (activeTab === 'documents') loadDocuments() }, [activeTab, loadDocuments])
  useEffect(() => { if (activeTab === 'locations') loadLocations() }, [activeTab, loadLocations])

  // Save employee (from edit modal)
  const handleSaveEmployee = async (formData) => {
    setSaving(true)
    const result = await employeeService.update(id, formData)
    if (result.success) {
      showToast.success('Employee updated')
      setShowEditModal(false)
      loadEmployee()
    } else {
      showToast.error(result.error || 'Failed to update')
    }
    setSaving(false)
  }

  // Save addresses
  const handleSaveAddresses = async () => {
    setSaving(true)
    const result = await employeeService.updateAddresses(id, addresses)
    if (result.success) {
      if (result.data) setAddresses(result.data)
      showToast.success('Addresses saved')
    } else {
      showToast.error(result.error || 'Failed to save addresses')
    }
    setSaving(false)
  }

  // Save document
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
      showToast.success(editingDocId ? 'Document updated' : 'Document added')
      setShowDocModal(false)
      setEditingDocId(null)
      loadDocuments()
    } else {
      showToast.error(result.error || 'Failed to save document')
    }
    setSaving(false)
  }

  // Address helpers
  const ensureAddressSlots = (addrs) => {
    const result = [...addrs]
    if (!result.find(a => a.address_type === 'oman_residential'))
      result.push({ ...EMPTY_ADDRESS, address_type: 'oman_residential' })
    if (!result.find(a => a.address_type === 'home_country'))
      result.push({ ...EMPTY_ADDRESS, address_type: 'home_country' })
    return result
  }

  const updateAddress = (addressType, field, value) => {
    setAddresses(prev => {
      const slots = ensureAddressSlots(prev)
      return slots.map(a => a.address_type === addressType ? { ...a, [field]: value } : a)
    })
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>
  if (!employee) return null

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/employees')} className="btn btn-outline btn-sm">
            <ArrowLeft size={16} />
          </button>
          <div>
            <h1 className="text-xl font-bold text-slate-800">{employee.full_name}</h1>
            <p className="text-xs text-slate-500 font-mono">{employee.employee_code} · {employee.designation || 'No designation'} · <span className="capitalize">{employee.status}</span></p>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
            <Edit size={16} />
            Edit Employee
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="tab-navigation">
        {TABS.map(tab => (
          <button
            key={tab.id}
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {/* Profile Tab - Read-only display */}
        {activeTab === 'profile' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                ['Full Name', employee.full_name],
                ['Phone', employee.phone],
                ['Email', employee.email],
                ['Nationality', employee.nationality],
                ['Date of Birth', employee.date_of_birth],
                ['Gender', employee.gender ? employee.gender.charAt(0).toUpperCase() + employee.gender.slice(1) : null],
                ['Designation', employee.designation],
                ['Department', employee.department],
                ['Start Date', employee.employment_start_date],
                ['Status', employee.status?.toUpperCase()]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm text-slate-800 font-medium">{value || '—'}</dd>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Addresses Tab */}
        {activeTab === 'addresses' && (
          <div className="space-y-6">
            {ensureAddressSlots(addresses).map(addr => (
              <div key={addr.address_type} className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
                <div className="form-section">
                  <div className="form-section-title">
                    <Home size={20} />
                    {addr.address_type === 'oman_residential' ? 'Oman Residential Address' : 'Home Country Address'}
                  </div>
                  <div className="form-grid">
                    {['address_line1', 'address_line2', 'city', 'state', 'country', 'postal_code'].map(field => (
                      <div className="form-group" key={field}>
                        <label>{field.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</label>
                        <input
                          type="text"
                          value={addr[field] || ''}
                          onChange={e => updateAddress(addr.address_type, field, e.target.value)}
                          disabled={!canManage}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {canManage && (
              <div className="flex justify-end">
                <button className="btn btn-primary" onClick={handleSaveAddresses} disabled={saving}>
                  <Save size={16} />
                  {saving ? 'Saving...' : 'Save Addresses'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Documents Tab */}
        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Employee Documents</h3>
              {canManage && (
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => { setDocForm({ ...EMPTY_DOCUMENT }); setEditingDocId(null); setShowDocModal(true) }}
                >
                  <Plus size={14} />
                  Add Document
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {documents.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-slate-400">No documents recorded</div>
              ) : (
                documents.map(doc => (
                  <div key={doc.id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="text-sm font-medium text-slate-800 capitalize">{doc.document_type.replace('_', ' ')}</p>
                        {doc.document_number && <p className="text-xs text-slate-500 font-mono">{doc.document_number}</p>}
                      </div>
                      <DocumentExpiryBadge expiryDate={doc.expiry_date} daysRemaining={doc.daysRemaining} />
                    </div>
                    <div className="flex items-center gap-3">
                      {doc.expiry_date && <span className="text-xs text-slate-400">Exp: {doc.expiry_date}</span>}
                      {canManage && (
                        <button
                          className="btn btn-outline btn-sm"
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
                            setShowDocModal(true)
                          }}
                        >
                          <Edit size={14} />
                          Edit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Locations Tab */}
        {activeTab === 'locations' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
            <LocationAssignmentPanel employeeId={parseInt(id)} locations={locations} />
          </div>
        )}
      </div>

      {/* Edit Employee Modal */}
      {showEditModal && (
        <EmployeeFormModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          onSave={handleSaveEmployee}
          employee={employee}
          loading={saving}
        />
      )}

      {/* Document Form Modal */}
      <Modal
        isOpen={showDocModal}
        onClose={() => { setShowDocModal(false); setEditingDocId(null) }}
        title={editingDocId ? 'Edit Document' : 'Add Document'}
        size="md"
        footer={
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => { setShowDocModal(false); setEditingDocId(null) }}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleSaveDocument} disabled={saving}>
              <Save size={16} />
              {saving ? 'Saving...' : editingDocId ? 'Update' : 'Add Document'}
            </button>
          </div>
        }
      >
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group">
              <label>Document Type *</label>
              <select value={docForm.document_type} onChange={e => setDocForm(f => ({ ...f, document_type: e.target.value }))}>
                <option value="passport">Passport</option>
                <option value="resident_id">Resident ID</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div className="form-group">
              <label>Document Number</label>
              <input type="text" value={docForm.document_number} onChange={e => setDocForm(f => ({ ...f, document_number: e.target.value }))} placeholder="e.g. AB1234567" />
            </div>
            <div className="form-group">
              <label>Issue Date</label>
              <input type="date" value={docForm.issue_date || ''} onChange={e => setDocForm(f => ({ ...f, issue_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Expiry Date</label>
              <input type="date" value={docForm.expiry_date || ''} onChange={e => setDocForm(f => ({ ...f, expiry_date: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>File Path</label>
              <input type="text" value={docForm.file_path || ''} onChange={e => setDocForm(f => ({ ...f, file_path: e.target.value }))} placeholder="/uploads/docs/..." />
            </div>
            <div className="form-group">
              <label>Notes</label>
              <input type="text" value={docForm.notes || ''} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default EmployeeDetailPage
