import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import DataTable from './ui/DataTable'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { 
  Plus, Edit, Trash2, Save, MapPin, Warehouse, 
  Building, Package, AlertTriangle, CheckCircle 
} from 'lucide-react'
import './StorageLocationManager.css'

const LOCATION_TYPES = [
  { id: 'tank_farm', name: 'Tank Farm', icon: Package },
  { id: 'warehouse', name: 'Warehouse', icon: Warehouse },
  { id: 'yard', name: 'Storage Yard', icon: Building },
  { id: 'secure', name: 'Secure Storage', icon: CheckCircle },
  { id: 'temporary', name: 'Temporary Storage', icon: AlertTriangle }
]

const StorageLocationManager = ({ 
  isOpen, 
  onClose,
  onLocationSelect = null // If provided, this becomes a selection modal
}) => {
  const { formatDate } = useSystemSettings()
  
  const [locations, setLocations] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: 'warehouse',
    capacity: '',
    unit: 'liters',
    description: '',
    isActive: true,
    address: '',
    contactPerson: '',
    contactPhone: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadStorageLocations()
    }
  }, [isOpen])

  const loadStorageLocations = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockLocations = [
        {
          id: 1,
          name: 'Main Warehouse',
          code: 'WH-001',
          type: 'warehouse',
          capacity: 50000,
          unit: 'liters',
          description: 'Primary storage facility',
          isActive: true,
          address: 'Industrial Area, Muscat',
          contactPerson: 'Ahmed Al-Rashid',
          contactPhone: '+968 24 123456',
          currentStock: 35000,
          createdAt: '2024-01-15'
        },
        {
          id: 2,
          name: 'Tank Farm A-1',
          code: 'TF-A1',
          type: 'tank_farm',
          capacity: 100000,
          unit: 'liters',
          description: 'Heavy oil storage tank',
          isActive: true,
          address: 'Tank Farm Complex A',
          contactPerson: 'Mohammed Al-Balushi',
          contactPhone: '+968 24 123457',
          currentStock: 75000,
          createdAt: '2024-01-10'
        },
        {
          id: 3,
          name: 'Storage Yard B',
          code: 'YD-B01',
          type: 'yard',
          capacity: 200,
          unit: 'drums',
          description: 'Drum storage area',
          isActive: true,
          address: 'Yard Complex B',
          contactPerson: 'Salem Al-Hinai',
          contactPhone: '+968 24 123458',
          currentStock: 150,
          createdAt: '2024-01-12'
        }
      ]
      
      setLocations(mockLocations)
    } catch (error) {
      console.error('Error loading storage locations:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateLocation = () => {
    setFormData({
      name: '',
      code: '',
      type: 'warehouse',
      capacity: '',
      unit: 'liters',
      description: '',
      isActive: true,
      address: '',
      contactPerson: '',
      contactPhone: ''
    })
    setErrors({})
    setShowCreateForm(true)
  }

  const handleEditLocation = (location) => {
    setFormData({ ...location })
    setSelectedLocation(location)
    setErrors({})
    setShowEditForm(true)
  }

  const handleDeleteLocation = async (location) => {
    if (location.currentStock > 0) {
      alert('Cannot delete location with existing stock. Please move all materials first.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete storage location "${location.name}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      // Mock deletion - replace with actual API call
      setLocations(prev => prev.filter(loc => loc.id !== location.id))
      alert('Storage location deleted successfully')
    } catch (error) {
      console.error('Error deleting location:', error)
      alert('Failed to delete storage location')
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Location name is required'
    }

    if (!formData.code.trim()) {
      newErrors.code = 'Location code is required'
    } else if (!/^[A-Z0-9-]+$/.test(formData.code)) {
      newErrors.code = 'Code must contain only uppercase letters, numbers, and hyphens'
    }

    if (!formData.capacity || formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be greater than 0'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    // Check if code is unique
    const existingLocation = locations.find(loc => 
      loc.code === formData.code && 
      (!selectedLocation || loc.id !== selectedLocation.id)
    )
    
    if (existingLocation) {
      newErrors.code = 'Location code must be unique'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveLocation = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const locationData = {
        ...formData,
        capacity: parseFloat(formData.capacity),
        createdAt: selectedLocation ? selectedLocation.createdAt : new Date().toISOString(),
        currentStock: selectedLocation ? selectedLocation.currentStock : 0
      }

      if (selectedLocation) {
        // Update existing location
        setLocations(prev => prev.map(loc => 
          loc.id === selectedLocation.id 
            ? { ...locationData, id: selectedLocation.id }
            : loc
        ))
        setShowEditForm(false)
        alert('Storage location updated successfully')
      } else {
        // Create new location
        const newLocation = {
          ...locationData,
          id: Math.max(...locations.map(l => l.id), 0) + 1,
          currentStock: 0
        }
        setLocations(prev => [...prev, newLocation])
        setShowCreateForm(false)
        alert('Storage location created successfully')
      }

      setSelectedLocation(null)
    } catch (error) {
      console.error('Error saving location:', error)
      alert('Failed to save storage location')
    }
  }

  const handleLocationSelect = (location) => {
    if (onLocationSelect) {
      onLocationSelect(location)
      onClose()
    }
  }

  const getLocationTypeInfo = (type) => {
    return LOCATION_TYPES.find(t => t.id === type) || LOCATION_TYPES[0]
  }

  const getCapacityUtilization = (location) => {
    if (!location.capacity || !location.currentStock) return 0
    return Math.round((location.currentStock / location.capacity) * 100)
  }

  const getUtilizationColor = (utilization) => {
    if (utilization >= 90) return '#ef4444' // Red
    if (utilization >= 70) return '#f59e0b' // Orange
    return '#10b981' // Green
  }

  const LocationForm = ({ isEdit = false }) => (
    <form onSubmit={handleSaveLocation} className="location-form">
      <div className="form-grid">
        <div className="field-group">
          <label>Location Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter location name"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="field-group">
          <label>Location Code *</label>
          <input
            type="text"
            value={formData.code}
            onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value.toUpperCase() }))}
            className={`form-input ${errors.code ? 'error' : ''}`}
            placeholder="WH-001, TF-A1, etc."
          />
          {errors.code && <span className="error-text">{errors.code}</span>}
        </div>

        <div className="field-group">
          <label>Location Type</label>
          <select
            value={formData.type}
            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
            className="form-select"
          >
            {LOCATION_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Capacity *</label>
          <div className="input-group">
            <input
              type="number"
              value={formData.capacity}
              onChange={(e) => setFormData(prev => ({ ...prev, capacity: e.target.value }))}
              className={`form-input ${errors.capacity ? 'error' : ''}`}
              placeholder="0"
              min="0"
              step="0.001"
            />
            <select
              value={formData.unit}
              onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
              className="form-select unit-select"
            >
              <option value="liters">Liters</option>
              <option value="drums">Drums</option>
              <option value="tons">Tons</option>
              <option value="pieces">Pieces</option>
            </select>
          </div>
          {errors.capacity && <span className="error-text">{errors.capacity}</span>}
        </div>

        <div className="field-group full-width">
          <label>Description *</label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            className={`form-textarea ${errors.description ? 'error' : ''}`}
            placeholder="Enter location description"
            rows="2"
          />
          {errors.description && <span className="error-text">{errors.description}</span>}
        </div>

        <div className="field-group full-width">
          <label>Address</label>
          <input
            type="text"
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className="form-input"
            placeholder="Enter physical address"
          />
        </div>

        <div className="field-group">
          <label>Contact Person</label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            className="form-input"
            placeholder="Enter contact person name"
          />
        </div>

        <div className="field-group">
          <label>Contact Phone</label>
          <input
            type="text"
            value={formData.contactPhone}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
            className="form-input"
            placeholder="+968 24 123456"
          />
        </div>

        <div className="field-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            Active Location
          </label>
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => {
            setShowCreateForm(false)
            setShowEditForm(false)
            setSelectedLocation(null)
          }}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          {isEdit ? 'Update Location' : 'Create Location'}
        </button>
      </div>
    </form>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={onLocationSelect ? "Select Storage Location" : "Storage Locations Management"}
      size="xl"
    >
      <div className="storage-location-manager">
        {!showCreateForm && !showEditForm && (
          <>
            {!onLocationSelect && (
              <div className="manager-header">
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateLocation}
                >
                  <Plus size={20} />
                  Add Storage Location
                </button>
              </div>
            )}

            <DataTable
              data={locations.map(location => ({
                ...location,
                typeInfo: getLocationTypeInfo(location.type),
                utilization: getCapacityUtilization(location),
                utilizationColor: getUtilizationColor(getCapacityUtilization(location))
              }))}
              columns={[
                {
                  key: 'name',
                  header: 'Location',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <div className="location-info">
                      <div className="location-name">{value}</div>
                      <div className="location-code">{row.code}</div>
                    </div>
                  )
                },
                {
                  key: 'type',
                  header: 'Type',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => {
                    const TypeIcon = row.typeInfo.icon
                    return (
                      <div className="location-type">
                        <TypeIcon size={16} />
                        <span>{row.typeInfo.name}</span>
                      </div>
                    )
                  }
                },
                {
                  key: 'capacity',
                  header: 'Capacity',
                  sortable: true,
                  render: (value, row) => (
                    <div className="capacity-info">
                      <div className="capacity-value">{value.toLocaleString()} {row.unit}</div>
                      <div 
                        className="utilization-bar"
                        style={{ 
                          background: `linear-gradient(to right, ${row.utilizationColor} ${row.utilization}%, #e5e7eb ${row.utilization}%)`
                        }}
                      >
                        <span className="utilization-text">{row.utilization}%</span>
                      </div>
                    </div>
                  )
                },
                {
                  key: 'currentStock',
                  header: 'Current Stock',
                  sortable: true,
                  render: (value, row) => (
                    <span>{value.toLocaleString()} {row.unit}</span>
                  )
                },
                {
                  key: 'isActive',
                  header: 'Status',
                  sortable: true,
                  filterable: true,
                  render: (value) => (
                    <span className={`status-badge ${value ? 'active' : 'inactive'}`}>
                      {value ? 'Active' : 'Inactive'}
                    </span>
                  )
                },
                {
                  key: 'actions',
                  header: 'Actions',
                  render: (value, row) => (
                    <div className="action-buttons">
                      {onLocationSelect ? (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleLocationSelect(row)}
                        >
                          <CheckCircle size={14} />
                          Select
                        </button>
                      ) : (
                        <>
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEditLocation(row)}
                            title="Edit Location"
                          >
                            <Edit size={14} />
                          </button>
                          <button 
                            className="btn btn-outline btn-sm btn-danger"
                            onClick={() => handleDeleteLocation(row)}
                            title="Delete Location"
                            disabled={row.currentStock > 0}
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      )}
                    </div>
                  )
                }
              ]}
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={!onLocationSelect}
              emptyMessage="No storage locations found"
              className="storage-locations-table"
            />
          </>
        )}

        {showCreateForm && (
          <div className="form-container">
            <h3>Create Storage Location</h3>
            <LocationForm />
          </div>
        )}

        {showEditForm && selectedLocation && (
          <div className="form-container">
            <h3>Edit Storage Location</h3>
            <LocationForm isEdit={true} />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default StorageLocationManager