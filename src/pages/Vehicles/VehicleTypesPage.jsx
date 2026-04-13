import React, { useState, useEffect, useCallback } from 'react'
import { usePermissions } from '../../hooks/usePermissions'
import vehicleTypeService from '../../services/vehicleTypeService'
import Modal from '../../components/ui/Modal'
import showToast from '../../components/ui/Toast'
import { Plus, Edit, Trash2, Save, RefreshCw } from 'lucide-react'

const VehicleTypesPage = () => {
  const { hasPermission } = usePermissions()
  const canManage = hasPermission('MANAGE_VEHICLE_TYPES')

  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingType, setEditingType] = useState(null)
  const [form, setForm] = useState({ type_name: '', description: '', is_active: true })

  const loadTypes = useCallback(async () => {
    setLoading(true)
    const result = await vehicleTypeService.getAll()
    if (result.success) setTypes(result.data)
    setLoading(false)
  }, [])

  useEffect(() => { loadTypes() }, [loadTypes])

  const openCreate = () => { setEditingType(null); setForm({ type_name: '', description: '', is_active: true }); setShowModal(true) }
  const openEdit = (type) => { setEditingType(type); setForm({ type_name: type.type_name, description: type.description || '', is_active: type.is_active }); setShowModal(true) }

  const handleSave = async () => {
    if (!form.type_name.trim()) return
    setSaving(true)
    const result = editingType
      ? await vehicleTypeService.update(editingType.id, form)
      : await vehicleTypeService.create(form)
    if (result.success) { showToast.success(editingType ? 'Updated' : 'Created'); setShowModal(false); loadTypes() }
    else showToast.error(result.error)
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this vehicle type?')) return
    const result = await vehicleTypeService.delete(id)
    if (result.success) { showToast.success('Deactivated'); loadTypes() }
    else showToast.error(result.error)
  }

  return (
    <div className="flex flex-col min-h-full bg-gray-50 dark:bg-slate-900 p-6">
      <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-slate-700 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Vehicle Types</h2>
            <p className="text-xs text-slate-500">Manage vehicle classification lookup table</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn btn-outline btn-sm" onClick={loadTypes}><RefreshCw size={14} /></button>
            {canManage && <button className="btn btn-primary btn-sm" onClick={openCreate}><Plus size={14} /> Add Type</button>}
          </div>
        </div>

        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-200 dark:border-slate-700">
              <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Type Name</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Description</th>
              <th className="text-left px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Status</th>
              <th className="text-right px-6 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-slate-700">
            {loading ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">Loading...</td></tr>
            ) : types.length === 0 ? (
              <tr><td colSpan={4} className="px-6 py-8 text-center text-sm text-slate-400">No vehicle types defined</td></tr>
            ) : types.map(type => (
              <tr key={type.id}>
                <td className="px-6 py-3 text-sm font-medium text-slate-800">{type.type_name}</td>
                <td className="px-6 py-3 text-sm text-slate-500">{type.description || '—'}</td>
                <td className="px-6 py-3"><span className={type.is_active ? 'badge badge-active' : 'badge badge-error'}>{type.is_active ? 'ACTIVE' : 'INACTIVE'}</span></td>
                <td className="px-6 py-3 text-right">
                  {canManage && (
                    <div className="flex items-center justify-end gap-1">
                      <button className="btn-icon" onClick={() => openEdit(type)} title="Edit"><Edit size={14} /></button>
                      {type.is_active && <button className="btn-icon text-red-500" onClick={() => handleDelete(type.id)} title="Deactivate"><Trash2 size={14} /></button>}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingType ? 'Edit Vehicle Type' : 'New Vehicle Type'} size="sm"
        footer={<div className="form-actions">
          <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving || !form.type_name.trim()}>
            <Save size={16} /> {saving ? 'Saving...' : 'Save'}
          </button>
        </div>}>
        <div className="form-section">
          <div className="form-grid">
            <div className="form-group">
              <label>Type Name *</label>
              <input type="text" value={form.type_name} onChange={e => setForm(f => ({ ...f, type_name: e.target.value }))} placeholder="e.g. Vacuum Tanker" required />
            </div>
            <div className="form-group">
              <label>Description</label>
              <input type="text" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Optional description" />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default VehicleTypesPage
