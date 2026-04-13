import React, { useState, useEffect } from 'react'
import { Truck, Save } from 'lucide-react'
import Modal from '../../../components/ui/Modal'

const EMPTY_VEHICLE = {
  vehicle_plate: '', vehicle_type_id: '', make: '', model: '',
  year: '', status: 'active', photo_path: '', notes: ''
}

const VehicleFormModal = ({ isOpen, onClose, onSave, vehicle = null, vehicleTypes = [], loading }) => {
  const isEdit = !!vehicle
  const [formData, setFormData] = useState(EMPTY_VEHICLE)

  useEffect(() => {
    if (vehicle) {
      setFormData({
        vehicle_plate: vehicle.vehicle_plate || '',
        vehicle_type_id: vehicle.vehicle_type_id || '',
        make: vehicle.make || '',
        model: vehicle.model || '',
        year: vehicle.year || '',
        status: vehicle.status || 'active',
        photo_path: vehicle.photo_path || '',
        notes: vehicle.notes || ''
      })
    } else {
      setFormData(EMPTY_VEHICLE)
    }
  }, [vehicle])

  const updateField = (field, value) => setFormData(prev => ({ ...prev, [field]: value }))

  const handleSubmit = () => {
    if (!formData.vehicle_plate.trim()) return
    const payload = {
      ...formData,
      vehicle_plate: formData.vehicle_plate.toUpperCase().trim(),
      vehicle_type_id: formData.vehicle_type_id ? parseInt(formData.vehicle_type_id) : null,
      year: formData.year ? parseInt(formData.year) : null
    }
    onSave(payload)
  }

  const footer = (
    <div className="form-actions">
      <button className="btn btn-outline" onClick={onClose} disabled={loading}>Cancel</button>
      <button className="btn btn-primary" onClick={handleSubmit} disabled={loading || !formData.vehicle_plate.trim()}>
        <Save size={16} />
        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Vehicle'}
      </button>
    </div>
  )

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEdit ? 'Edit Vehicle' : 'New Vehicle'}
      description={isEdit ? `Editing ${vehicle.vehicle_plate}` : 'Register a new vehicle'} size="lg" footer={footer}>
      <div className="form-section">
        <div className="form-section-title"><Truck size={20} /> Vehicle Information</div>
        <div className="form-grid">
          <div className="form-group">
            <label>Vehicle Plate *</label>
            <input type="text" value={formData.vehicle_plate} onChange={e => updateField('vehicle_plate', e.target.value.toUpperCase())} placeholder="e.g. AB 1234" required />
          </div>
          <div className="form-group">
            <label>Vehicle Type</label>
            <select value={formData.vehicle_type_id} onChange={e => updateField('vehicle_type_id', e.target.value)}>
              <option value="">Select type...</option>
              {vehicleTypes.filter(t => t.is_active).map(t => (
                <option key={t.id} value={t.id}>{t.type_name}</option>
              ))}
            </select>
          </div>
          <div className="form-group">
            <label>Make</label>
            <input type="text" value={formData.make} onChange={e => updateField('make', e.target.value)} placeholder="e.g. Toyota, Isuzu" />
          </div>
          <div className="form-group">
            <label>Model</label>
            <input type="text" value={formData.model} onChange={e => updateField('model', e.target.value)} placeholder="e.g. Hilux, FVR" />
          </div>
          <div className="form-group">
            <label>Year</label>
            <input type="number" value={formData.year} onChange={e => updateField('year', e.target.value)} placeholder="e.g. 2023" min="1900" max="2100" />
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Status</label>
              <select value={formData.status} onChange={e => updateField('status', e.target.value)}>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="under_maintenance">Under Maintenance</option>
              </select>
            </div>
          )}
          <div className="form-group" style={{ gridColumn: '1 / -1' }}>
            <label>Notes</label>
            <textarea value={formData.notes || ''} onChange={e => updateField('notes', e.target.value)} rows={2} placeholder="Optional notes..." />
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default VehicleFormModal
