import React, { useState, useEffect } from 'react'
import { usePermissions } from '../../../hooks/usePermissions'
import employeeService from '../../../services/employeeService'

const ROLE_LABELS = {
  in_charge: 'In Charge',
  staff: 'Staff',
  driver: 'Driver',
  helper: 'Helper'
}

const ROLE_COLORS = {
  in_charge: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  staff: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  driver: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  helper: 'bg-gray-500/15 text-gray-400 border-gray-500/25'
}

const LocationAssignmentPanel = ({ employeeId, locations = [] }) => {
  const { hasPermission } = usePermissions()
  const canManage = hasPermission('MANAGE_EMPLOYEES')

  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ location_id: '', role: 'staff', assigned_from: new Date().toISOString().split('T')[0], assigned_to: '' })

  const loadAssignments = async () => {
    setLoading(true)
    const result = await employeeService.getLocationAssignments(employeeId)
    if (result.success) setAssignments(result.data)
    setLoading(false)
  }

  useEffect(() => { loadAssignments() }, [employeeId])

  const handleAssign = async (e) => {
    e.preventDefault()
    const payload = {
      location_id: parseInt(form.location_id),
      role: form.role,
      assigned_from: form.assigned_from,
      assigned_to: form.assigned_to || null
    }
    const result = await employeeService.assignLocation(employeeId, payload)
    if (result.success) {
      setShowForm(false)
      setForm({ location_id: '', role: 'staff', assigned_from: new Date().toISOString().split('T')[0], assigned_to: '' })
      loadAssignments()
    }
  }

  const handleRemove = async (assignId) => {
    if (!confirm('Remove this location assignment?')) return
    const result = await employeeService.removeLocationAssignment(employeeId, assignId)
    if (result.success) loadAssignments()
  }

  const currentAssignments = assignments.filter(a => !a.assigned_to)
  const pastAssignments = assignments.filter(a => a.assigned_to)

  if (loading) return <div className="text-sm text-gray-400 py-4">Loading assignments...</div>

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-300">Location Assignments</h3>
        {canManage && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
          >
            {showForm ? 'Cancel' : '+ Assign'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleAssign} className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Location</label>
              <select
                value={form.location_id}
                onChange={e => setForm(f => ({ ...f, location_id: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200"
                required
              >
                <option value="">Select location...</option>
                {locations.map(loc => (
                  <option key={loc.id} value={loc.id}>{loc.locationName} ({loc.locationCode})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Role</label>
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200"
              >
                {Object.entries(ROLE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">From</label>
              <input
                type="date"
                value={form.assigned_from}
                onChange={e => setForm(f => ({ ...f, assigned_from: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200"
                required
              />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">To (blank = current)</label>
              <input
                type="date"
                value={form.assigned_to}
                onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                className="w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-200"
              />
            </div>
          </div>
          <button type="submit" className="px-4 py-2 rounded-lg bg-accent text-white text-sm hover:bg-accent/90 transition-colors">
            Assign Location
          </button>
        </form>
      )}

      {/* Current assignments */}
      {currentAssignments.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Current</p>
          <div className="space-y-2">
            {currentAssignments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <span className={`inline-flex px-2 py-0.5 text-xs font-medium border rounded-full ${ROLE_COLORS[a.role]}`}>
                    {ROLE_LABELS[a.role]}
                  </span>
                  <div>
                    <p className="text-sm text-gray-200">{a.locationName}</p>
                    <p className="text-xs text-gray-500">Since {a.assigned_from}</p>
                  </div>
                </div>
                {canManage && (
                  <button onClick={() => handleRemove(a.id)} className="text-xs text-red-400 hover:text-red-300">
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Past assignments */}
      {pastAssignments.length > 0 && (
        <div>
          <p className="text-xs text-gray-500 mb-2 uppercase tracking-wider">Past</p>
          <div className="space-y-2">
            {pastAssignments.map(a => (
              <div key={a.id} className="p-3 rounded-lg bg-white/3 border border-white/5 opacity-60">
                <div className="flex items-center gap-3">
                  <span className="inline-flex px-2 py-0.5 text-xs font-medium border rounded-full bg-gray-500/10 text-gray-500 border-gray-500/20">
                    {ROLE_LABELS[a.role]}
                  </span>
                  <div>
                    <p className="text-sm text-gray-400">{a.locationName}</p>
                    <p className="text-xs text-gray-600">{a.assigned_from} — {a.assigned_to}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assignments.length === 0 && (
        <p className="text-sm text-gray-500 py-4 text-center">No location assignments yet</p>
      )}
    </div>
  )
}

export default LocationAssignmentPanel
