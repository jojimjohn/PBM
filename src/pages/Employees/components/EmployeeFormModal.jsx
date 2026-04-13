import React, { useState, useEffect } from 'react'
import { User, Save } from 'lucide-react'
import Modal from '../../../components/ui/Modal'

const EMPTY_EMPLOYEE = {
  full_name: '', phone: '', email: '', nationality: '',
  date_of_birth: '', gender: '', employment_start_date: '',
  designation: '', department: '', status: 'active'
}

const EmployeeFormModal = ({ isOpen, onClose, onSave, employee = null, loading }) => {
  const isEdit = !!employee
  const [formData, setFormData] = useState(EMPTY_EMPLOYEE)

  useEffect(() => {
    if (employee) {
      setFormData({
        full_name: employee.full_name || '',
        phone: employee.phone || '',
        email: employee.email || '',
        nationality: employee.nationality || '',
        date_of_birth: employee.date_of_birth || '',
        gender: employee.gender || '',
        employment_start_date: employee.employment_start_date || '',
        designation: employee.designation || '',
        department: employee.department || '',
        status: employee.status || 'active'
      })
    } else {
      setFormData(EMPTY_EMPLOYEE)
    }
  }, [employee])

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = () => {
    if (!formData.full_name.trim()) return
    onSave(formData)
  }

  const footer = (
    <div className="form-actions">
      <button className="btn btn-outline" onClick={onClose} disabled={loading}>
        Cancel
      </button>
      <button
        className="btn btn-primary"
        onClick={handleSubmit}
        disabled={loading || !formData.full_name.trim()}
      >
        <Save size={16} />
        {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Employee'}
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEdit ? 'Edit Employee' : 'New Employee'}
      description={isEdit ? `Editing ${employee.employee_code}` : 'Add a new employee record'}
      size="lg"
      footer={footer}
    >
      <div className="form-section">
        <div className="form-section-title">
          <User size={20} />
          Personal Information
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.full_name}
              onChange={e => updateField('full_name', e.target.value)}
              placeholder="Enter full name"
              required
            />
          </div>
          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={e => updateField('phone', e.target.value)}
              placeholder="e.g. +968 9XXX XXXX"
            />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={e => updateField('email', e.target.value)}
              placeholder="email@example.com"
            />
          </div>
          <div className="form-group">
            <label>Nationality</label>
            <input
              type="text"
              value={formData.nationality}
              onChange={e => updateField('nationality', e.target.value)}
              placeholder="e.g. Indian, Omani"
            />
          </div>
          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.date_of_birth}
              onChange={e => updateField('date_of_birth', e.target.value)}
            />
          </div>
          <div className="form-group">
            <label>Gender</label>
            <select
              value={formData.gender}
              onChange={e => updateField('gender', e.target.value)}
            >
              <option value="">Select...</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <div className="form-section-title">
          <User size={20} />
          Employment Details
        </div>
        <div className="form-grid">
          <div className="form-group">
            <label>Designation</label>
            <input
              type="text"
              value={formData.designation}
              onChange={e => updateField('designation', e.target.value)}
              placeholder="e.g. Driver, Operator"
            />
          </div>
          <div className="form-group">
            <label>Department</label>
            <input
              type="text"
              value={formData.department}
              onChange={e => updateField('department', e.target.value)}
              placeholder="e.g. Operations, Sales"
            />
          </div>
          <div className="form-group">
            <label>Start Date</label>
            <input
              type="date"
              value={formData.employment_start_date}
              onChange={e => updateField('employment_start_date', e.target.value)}
            />
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={e => updateField('status', e.target.value)}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default EmployeeFormModal
