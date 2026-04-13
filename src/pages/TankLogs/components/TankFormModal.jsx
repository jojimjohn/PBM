import React, { useState, useEffect } from 'react'
import { Save } from 'lucide-react'
import Modal from '../../../components/ui/Modal'

const EMPTY_TANK = { tank_number: '', capacity_litres: '', material_type: '', location: '', notes: '', is_active: true }

const TankFormModal = ({ isOpen, onClose, onSave, tank = null, loading }) => {
  const isEdit = !!tank
  const [form, setForm] = useState(EMPTY_TANK)

  useEffect(() => {
    setForm(tank ? {
      tank_number: tank.tank_number || '',
      capacity_litres: tank.capacity_litres || '',
      material_type: tank.material_type || '',
      location: tank.location || '',
      notes: tank.notes || '',
      is_active: tank.is_active ?? true
    } : EMPTY_TANK)
  }, [tank])

  const update = (f, v) => setForm(p => ({ ...p, [f]: v }))

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Tank' : 'New Storage Tank'} size="md"
      footer={<div className="form-actions">
        <button className="btn btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn btn-primary" onClick={() => onSave({ ...form, capacity_litres: form.capacity_litres ? parseFloat(form.capacity_litres) : null })} disabled={loading || !form.tank_number.trim()}>
          <Save size={16} /> {loading ? 'Saving...' : 'Save'}
        </button>
      </div>}>
      <div className="form-section">
        <div className="form-grid">
          <div className="form-group"><label>Tank Number *</label><input type="text" value={form.tank_number} onChange={e => update('tank_number', e.target.value)} placeholder="e.g. Tank 01" required /></div>
          <div className="form-group"><label>Capacity (Litres)</label><input type="number" value={form.capacity_litres} onChange={e => update('capacity_litres', e.target.value)} placeholder="e.g. 50000" step="0.001" /></div>
          <div className="form-group"><label>Material Type</label><input type="text" value={form.material_type} onChange={e => update('material_type', e.target.value)} placeholder="e.g. Engine Oil" /></div>
          <div className="form-group"><label>Location</label><input type="text" value={form.location} onChange={e => update('location', e.target.value)} placeholder="e.g. Main Yard" /></div>
          <div className="form-group" style={{ gridColumn: '1 / -1' }}><label>Notes</label><textarea value={form.notes || ''} onChange={e => update('notes', e.target.value)} rows={2} /></div>
        </div>
      </div>
    </Modal>
  )
}

export default TankFormModal
