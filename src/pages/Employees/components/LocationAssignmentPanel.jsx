import React, { useState, useEffect } from 'react'
import { usePermissions } from '../../../hooks/usePermissions'
import employeeService from '../../../services/employeeService'
import showToast from '../../../components/ui/Toast'
import Modal from '../../../components/ui/Modal'
import { Plus, Trash2, Save, MapPin } from 'lucide-react'

const ROLE_LABELS = {
  in_charge: 'In Charge',
  staff: 'Staff',
  driver: 'Driver',
  helper: 'Helper'
}

const ROLE_BADGE = {
  in_charge: 'badge badge-active',
  staff: 'badge badge-info',
  driver: 'badge badge-pending',
  helper: 'badge badge-neutral'
}

const LocationAssignmentPanel = ({ employeeId, locations = [] }) => {
  const { hasPermission } = usePermissions()
  const canManage = hasPermission('MANAGE_EMPLOYEES')

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({
    location_id: '', location_key: '', role: 'staff',
    assigned_from: new Date().toISOString().split('T')[0],
    assigned_to: ''
  })

  const loadAssignments = async () => {
    setLoading(true)
    const result = await employeeService.getLocationAssignments(employeeId)
    if (result.success) setAssignments(result.data)
    setLoading(false)
  }

  useEffect(() => { loadAssignments() }, [employeeId])

  const handleAssign = async () => {
    setSaving(true)
    // Find the selected location to determine its source
    const selectedLoc = locations.find(l => String(l.id) === String(form.location_id) && l._locKey === form.location_key)
    const location_source = selectedLoc?._type === 'supplier_location' ? 'supplier_location' : 'branch'

    const payload = {
      location_id: parseInt(form.location_id),
      location_source,
      role: form.role,
      assigned_from: form.assigned_from,
      assigned_to: form.assigned_to || null
    }
    const result = await employeeService.assignLocation(employeeId, payload)
    if (result.success) {
      showToast.success('Location assigned')
      setShowModal(false)
      setForm({ location_id: '', location_key: '', role: 'staff', assigned_from: new Date().toISOString().split('T')[0], assigned_to: '' })
      loadAssignments()
    } else {
      showToast.error(result.error || 'Failed to assign')
    }
    setSaving(false)
  }

  const handleRemove = async (assignId) => {
    if (!confirm('Remove this location assignment?')) return
    const result = await employeeService.removeLocationAssignment(employeeId, assignId)
    if (result.success) {
      showToast.success('Assignment removed')
      loadAssignments()
    }
  }

  const currentAssignments = assignments.filter(a => !a.assigned_to)
  const pastAssignments = assignments.filter(a => a.assigned_to)

  if (loading) return <div className="text-sm text-slate-400 py-4">Loading assignments...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Location Assignments</h3>
        {canManage && (
          <button className="btn btn-primary btn-sm" onClick={() => setShowModal(true)}>
            <Plus size={14} />
            Assign Location
          </button>
        )}
      </div>

      {/* Current */}
      {currentAssignments.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Current</p>
          <div className="divide-y divide-gray-200 dark:divide-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
            {currentAssignments.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center justify-between bg-white dark:bg-slate-800">
                <div className="flex items-center gap-3">
                  <span className={ROLE_BADGE[a.role] || 'badge'}>{ROLE_LABELS[a.role]}</span>
                  <div>
                    <p className="text-sm font-medium text-slate-800">{a.locationName}</p>
                    <p className="text-xs text-slate-400">Since {a.assigned_from}</p>
                  </div>
                </div>
                {canManage && (
                  <button className="btn-icon text-red-500" onClick={() => handleRemove(a.id)} title="Remove">
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past */}
      {pastAssignments.length > 0 && (
        <div className="mb-4">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">Past</p>
          <div className="divide-y divide-gray-200 dark:divide-slate-700 border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden opacity-60">
            {pastAssignments.map(a => (
              <div key={a.id} className="px-4 py-3 flex items-center gap-3 bg-white dark:bg-slate-800">
                <span className="badge badge-neutral">{ROLE_LABELS[a.role]}</span>
                <div>
                  <p className="text-sm text-slate-600">{a.locationName}</p>
                  <p className="text-xs text-slate-400">{a.assigned_from} — {a.assigned_to}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <p className="text-sm text-slate-400 py-8 text-center">No location assignments yet</p>
      )}

      {/* Assign Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Assign to Location"
        size="md"
        footer={
          <div className="form-actions">
            <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
            <button className="btn btn-primary" onClick={handleAssign} disabled={saving || !form.location_id}>
              <Save size={16} />
              {saving ? 'Assigning...' : 'Assign'}
            </button>
          </div>
        }
      >
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group">
              <label>Location *</label>
              <select
                value={form.location_key}
                onChange={e => {
                  const key = e.target.value
                  const loc = locations.find(l => l._locKey === key)
                  setForm(f => ({
                    ...f,
                    location_id: loc ? loc.id : '',
                    location_key: key
                  }))
                }}
                required
              >
                <option value="">Select location...</option>
                {locations.map(loc => {
                  const key = `${loc._type || 'branch'}-${loc.id}`
                  // Attach the key to the location object so handleAssign can find it
                  loc._locKey = key
                  return (
                    <option key={key} value={key}>
                      {loc.locationName} {loc.locationCode ? `(${loc.locationCode})` : ''}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>From Date *</label>
              <input type="date" value={form.assigned_from} onChange={e => setForm(f => ({ ...f, assigned_from: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label>To Date (blank = current)</label>
              <input type="date" value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default LocationAssignmentPanel
