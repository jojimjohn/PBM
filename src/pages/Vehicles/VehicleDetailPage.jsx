import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { usePermissions } from '../../hooks/usePermissions'
import vehicleService from '../../services/vehicleService'
import vehicleTypeService from '../../services/vehicleTypeService'
import Modal from '../../components/ui/Modal'
import showToast from '../../components/ui/Toast'
import DocumentExpiryBadge from '../Employees/components/DocumentExpiryBadge'
import VehicleFormModal from './components/VehicleFormModal'
import { ArrowLeft, Edit, Save, Plus, FileText, Truck, Image } from 'lucide-react'

const TABS = [
  { id: 'details', label: 'Details', icon: Truck },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'photo', label: 'Photo', icon: Image }
]

const EMPTY_DOCUMENT = {
  document_type: 'vehicle_license', document_number: '',
  issue_date: '', expiry_date: '', file_path: '', notes: ''
}

const DOC_TYPE_LABELS = {
  vehicle_license: 'Vehicle License',
  registration: 'Registration',
  insurance: 'Insurance',
  mulkiya: 'Mulkiya',
  other: 'Other'
}

const VehicleDetailPage = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { hasPermission } = usePermissions()
  const canManage = hasPermission('MANAGE_VEHICLES')

  const [activeTab, setActiveTab] = useState('details')
  const [vehicle, setVehicle] = useState(null)
  const [vehicleTypes, setVehicleTypes] = useState([])
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDocModal, setShowDocModal] = useState(false)
  const [docForm, setDocForm] = useState(EMPTY_DOCUMENT)
  const [editingDocId, setEditingDocId] = useState(null)

  const loadVehicle = useCallback(async () => {
    setLoading(true)
    const [vResult, vtResult] = await Promise.all([
      vehicleService.getById(id),
      vehicleTypeService.getAll()
    ])
    if (vResult.success) setVehicle(vResult.data)
    else navigate('/vehicles')
    if (vtResult.success) setVehicleTypes(vtResult.data)
    setLoading(false)
  }, [id, navigate])

  const loadDocuments = useCallback(async () => {
    const result = await vehicleService.getDocuments(id)
    if (result.success) setDocuments(result.data)
  }, [id])

  useEffect(() => { loadVehicle() }, [loadVehicle])
  useEffect(() => { if (activeTab === 'documents') loadDocuments() }, [activeTab, loadDocuments])

  const handleSaveVehicle = async (formData) => {
    setSaving(true)
    const result = await vehicleService.update(id, formData)
    if (result.success) { showToast.success('Vehicle updated'); setShowEditModal(false); loadVehicle() }
    else showToast.error(result.error)
    setSaving(false)
  }

  const handleSaveDocument = async () => {
    setSaving(true)
    const payload = { ...docForm }
    if (!payload.issue_date) payload.issue_date = null
    if (!payload.expiry_date) payload.expiry_date = null
    if (!payload.file_path) payload.file_path = null

    const result = editingDocId
      ? await vehicleService.updateDocument(id, editingDocId, payload)
      : await vehicleService.addDocument(id, payload)
    if (result.success) {
      showToast.success(editingDocId ? 'Document updated' : 'Document added')
      setShowDocModal(false); setEditingDocId(null); loadDocuments()
    } else showToast.error(result.error)
    setSaving(false)
  }

  if (loading) return <div className="p-6 text-slate-500">Loading...</div>
  if (!vehicle) return null

  const statusLabel = { active: 'Active', inactive: 'Inactive', under_maintenance: 'Under Maintenance' }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900">
      <div className="px-6 pt-6 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/vehicles')} className="btn btn-outline btn-sm"><ArrowLeft size={16} /></button>
          <div>
            <h1 className="text-xl font-bold text-slate-800 font-mono">{vehicle.vehicle_plate}</h1>
            <p className="text-xs text-slate-500">{vehicle.vehicle_type_name || 'No type'} · {[vehicle.make, vehicle.model, vehicle.year].filter(Boolean).join(' ') || 'No details'} · <span className="capitalize">{statusLabel[vehicle.status]}</span></p>
          </div>
        </div>
        {canManage && (
          <button className="btn btn-primary" onClick={() => setShowEditModal(true)}>
            <Edit size={16} /> Edit Vehicle
          </button>
        )}
      </div>

      <div className="tab-navigation">
        {TABS.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`} onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={16} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="p-6">
        {activeTab === 'details' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                ['Plate', vehicle.vehicle_plate],
                ['Type', vehicle.vehicle_type_name],
                ['Make', vehicle.make],
                ['Model', vehicle.model],
                ['Year', vehicle.year],
                ['Status', statusLabel[vehicle.status]],
                ['Notes', vehicle.notes]
              ].map(([label, value]) => (
                <div key={label}>
                  <dt className="text-[10px] uppercase font-bold tracking-widest text-slate-500">{label}</dt>
                  <dd className="mt-1 text-sm text-slate-800 font-medium">{value || '—'}</dd>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'documents' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
            <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Vehicle Documents</h3>
              {canManage && (
                <button className="btn btn-primary btn-sm" onClick={() => { setDocForm({ ...EMPTY_DOCUMENT }); setEditingDocId(null); setShowDocModal(true) }}>
                  <Plus size={14} /> Add Document
                </button>
              )}
            </div>
            <div className="divide-y divide-gray-200 dark:divide-slate-700">
              {documents.length === 0 ? (
                <div className="px-6 py-8 text-center text-sm text-slate-400">No documents recorded</div>
              ) : documents.map(doc => (
                <div key={doc.id} className="px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{DOC_TYPE_LABELS[doc.document_type] || doc.document_type}</p>
                      {doc.document_number && <p className="text-xs text-slate-500 font-mono">{doc.document_number}</p>}
                    </div>
                    <DocumentExpiryBadge expiryDate={doc.expiry_date} daysRemaining={doc.daysRemaining} />
                  </div>
                  <div className="flex items-center gap-3">
                    {doc.expiry_date && <span className="text-xs text-slate-400">Exp: {doc.expiry_date}</span>}
                    {canManage && (
                      <button className="btn btn-outline btn-sm" onClick={() => {
                        setDocForm({ document_type: doc.document_type, document_number: doc.document_number || '', issue_date: doc.issue_date || '', expiry_date: doc.expiry_date || '', file_path: doc.file_path || '', notes: doc.notes || '' })
                        setEditingDocId(doc.id); setShowDocModal(true)
                      }}><Edit size={14} /> Edit</button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'photo' && (
          <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl p-6 text-center">
            {vehicle.photo_path ? (
              <img src={vehicle.photo_path} alt={vehicle.vehicle_plate} className="max-w-md mx-auto rounded-lg" />
            ) : (
              <div className="py-12 text-slate-400">
                <Image size={48} className="mx-auto mb-3 opacity-30" />
                <p className="text-sm">No photo uploaded</p>
              </div>
            )}
          </div>
        )}
      </div>

      {showEditModal && <VehicleFormModal isOpen onClose={() => setShowEditModal(false)} onSave={handleSaveVehicle} vehicle={vehicle} vehicleTypes={vehicleTypes} loading={saving} />}

      <Modal isOpen={showDocModal} onClose={() => { setShowDocModal(false); setEditingDocId(null) }}
        title={editingDocId ? 'Edit Document' : 'Add Document'} size="md"
        footer={<div className="form-actions">
          <button className="btn btn-outline" onClick={() => { setShowDocModal(false); setEditingDocId(null) }}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSaveDocument} disabled={saving}><Save size={16} />{saving ? 'Saving...' : editingDocId ? 'Update' : 'Add'}</button>
        </div>}>
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group">
              <label>Document Type *</label>
              <select value={docForm.document_type} onChange={e => setDocForm(f => ({ ...f, document_type: e.target.value }))}>
                {Object.entries(DOC_TYPE_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Document Number</label><input type="text" value={docForm.document_number} onChange={e => setDocForm(f => ({ ...f, document_number: e.target.value }))} /></div>
            <div className="form-group"><label>Issue Date</label><input type="date" value={docForm.issue_date || ''} onChange={e => setDocForm(f => ({ ...f, issue_date: e.target.value }))} /></div>
            <div className="form-group"><label>Expiry Date</label><input type="date" value={docForm.expiry_date || ''} onChange={e => setDocForm(f => ({ ...f, expiry_date: e.target.value }))} /></div>
            <div className="form-group"><label>File Path</label><input type="text" value={docForm.file_path || ''} onChange={e => setDocForm(f => ({ ...f, file_path: e.target.value }))} /></div>
            <div className="form-group"><label>Notes</label><input type="text" value={docForm.notes || ''} onChange={e => setDocForm(f => ({ ...f, notes: e.target.value }))} /></div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default VehicleDetailPage
