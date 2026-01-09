import React, { useState, useEffect } from 'react'
import Modal from './ui/Modal'
import DataTable from './ui/DataTable'
import { useSystemSettings } from '../context/SystemSettingsContext'
import { 
  Plus, Edit, Trash2, Save, Building, Phone, Mail, 
  MapPin, FileText, CheckCircle, AlertTriangle, User
} from 'lucide-react'
import './VendorManager.css'

const VENDOR_TYPES = [
  { id: 'oil_supplier', name: 'Oil Supplier' },
  { id: 'transport', name: 'Transportation' },
  { id: 'equipment', name: 'Equipment Supplier' },
  { id: 'service', name: 'Service Provider' },
  { id: 'maintenance', name: 'Maintenance' },
  { id: 'logistics', name: 'Logistics' },
  { id: 'other', name: 'Other' }
]

const VendorManager = ({ 
  isOpen, 
  onClose,
  onVendorSelect = null // If provided, this becomes a selection modal
}) => {
  const { formatDate } = useSystemSettings()
  
  const [vendors, setVendors] = useState([])
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedVendor, setSelectedVendor] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    vendorCode: '',
    vendorType: 'oil_supplier',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    country: 'Oman',
    vatNumber: '',
    crNumber: '',
    paymentTerms: 30,
    creditLimit: '',
    bankName: '',
    accountNumber: '',
    iban: '',
    isActive: true,
    notes: ''
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (isOpen) {
      loadVendors()
    }
  }, [isOpen])

  const loadVendors = async () => {
    try {
      setLoading(true)
      
      // Mock data - replace with actual API call
      const mockVendors = [
        {
          id: 1,
          name: 'Gulf Oil Trading LLC',
          vendorCode: 'VEN-001',
          vendorType: 'oil_supplier',
          contactPerson: 'Ahmed Al-Mazroui',
          phone: '+968 24 567890',
          email: 'ahmed@gulfoil.om',
          address: 'Industrial Area, Block 15',
          city: 'Muscat',
          country: 'Oman',
          vatNumber: 'OM123456789',
          crNumber: 'CR-12345678',
          paymentTerms: 30,
          creditLimit: 500000,
          isActive: true,
          totalPurchases: 2450000,
          lastPurchaseDate: '2024-08-15',
          createdAt: '2024-01-10'
        },
        {
          id: 2,
          name: 'Express Logistics Co.',
          vendorCode: 'VEN-002',
          vendorType: 'transport',
          contactPerson: 'Mohammed Al-Rashid',
          phone: '+968 24 678901',
          email: 'ops@expresslogistics.om',
          address: 'Transport Hub, Sohar',
          city: 'Sohar',
          country: 'Oman',
          vatNumber: 'OM987654321',
          crNumber: 'CR-87654321',
          paymentTerms: 15,
          creditLimit: 100000,
          isActive: true,
          totalPurchases: 85000,
          lastPurchaseDate: '2024-08-20',
          createdAt: '2024-02-15'
        },
        {
          id: 3,
          name: 'Al Waha Equipment Rental',
          vendorCode: 'VEN-003',
          vendorType: 'equipment',
          contactPerson: 'Salem Al-Hinai',
          phone: '+968 24 789012',
          email: 'rental@alwaha.om',
          address: 'Equipment Yard, Nizwa',
          city: 'Nizwa',
          country: 'Oman',
          vatNumber: '',
          crNumber: 'CR-11223344',
          paymentTerms: 7,
          creditLimit: 50000,
          isActive: true,
          totalPurchases: 32000,
          lastPurchaseDate: '2024-07-30',
          createdAt: '2024-03-01'
        }
      ]
      
      setVendors(mockVendors)
    } catch (error) {
      console.error('Error loading vendors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateVendor = () => {
    setFormData({
      name: '',
      vendorCode: '',
      vendorType: 'oil_supplier',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      city: '',
      country: 'Oman',
      vatNumber: '',
      crNumber: '',
      paymentTerms: 30,
      creditLimit: '',
      bankName: '',
      accountNumber: '',
      iban: '',
      isActive: true,
      notes: ''
    })
    setErrors({})
    setShowCreateForm(true)
  }

  const handleEditVendor = (vendor) => {
    setFormData({ ...vendor })
    setSelectedVendor(vendor)
    setErrors({})
    setShowEditForm(true)
  }

  const handleDeleteVendor = async (vendor) => {
    if (vendor.totalPurchases > 0) {
      alert('Cannot delete vendor with existing purchase history. You can deactivate the vendor instead.')
      return
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete vendor "${vendor.name}"?\n\nThis action cannot be undone.`
    )
    
    if (!confirmed) return

    try {
      // Mock deletion - replace with actual API call
      setVendors(prev => prev.filter(v => v.id !== vendor.id))
      alert('Vendor deleted successfully')
    } catch (error) {
      console.error('Error deleting vendor:', error)
      alert('Failed to delete vendor')
    }
  }

  const generateVendorCode = (name, type) => {
    if (!name) return ''
    
    const typePrefix = {
      'oil_supplier': 'OIL',
      'transport': 'TRP',
      'equipment': 'EQP',
      'service': 'SVC',
      'maintenance': 'MNT',
      'logistics': 'LOG',
      'other': 'OTH'
    }
    
    const prefix = typePrefix[type] || 'VEN'
    const nameCode = name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 3)
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
    
    return `${prefix}-${nameCode}-${randomNum}`
  }

  const validateForm = () => {
    const newErrors = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Vendor name is required'
    }

    if (!formData.vendorCode.trim()) {
      newErrors.vendorCode = 'Vendor code is required'
    } else if (!/^[A-Z0-9-]+$/.test(formData.vendorCode)) {
      newErrors.vendorCode = 'Code must contain only uppercase letters, numbers, and hyphens'
    }

    if (!formData.contactPerson.trim()) {
      newErrors.contactPerson = 'Contact person is required'
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address'
    }

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required'
    }

    if (formData.paymentTerms < 0 || formData.paymentTerms > 365) {
      newErrors.paymentTerms = 'Payment terms must be between 0 and 365 days'
    }

    if (formData.creditLimit && formData.creditLimit < 0) {
      newErrors.creditLimit = 'Credit limit cannot be negative'
    }

    // Check if vendor code is unique
    const existingVendor = vendors.find(vendor => 
      vendor.vendorCode === formData.vendorCode && 
      (!selectedVendor || vendor.id !== selectedVendor.id)
    )
    
    if (existingVendor) {
      newErrors.vendorCode = 'Vendor code must be unique'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSaveVendor = async (e) => {
    e.preventDefault()
    
    if (!validateForm()) return

    try {
      const vendorData = {
        ...formData,
        paymentTerms: parseInt(formData.paymentTerms) || 30,
        creditLimit: parseFloat(formData.creditLimit) || 0,
        createdAt: selectedVendor ? selectedVendor.createdAt : new Date().toISOString(),
        totalPurchases: selectedVendor ? selectedVendor.totalPurchases : 0,
        lastPurchaseDate: selectedVendor ? selectedVendor.lastPurchaseDate : null
      }

      if (selectedVendor) {
        // Update existing vendor
        setVendors(prev => prev.map(vendor => 
          vendor.id === selectedVendor.id 
            ? { ...vendorData, id: selectedVendor.id }
            : vendor
        ))
        setShowEditForm(false)
        alert('Vendor updated successfully')
      } else {
        // Create new vendor
        const newVendor = {
          ...vendorData,
          id: Math.max(...vendors.map(v => v.id), 0) + 1,
          totalPurchases: 0,
          lastPurchaseDate: null
        }
        setVendors(prev => [...prev, newVendor])
        setShowCreateForm(false)
        alert('Vendor created successfully')
      }

      setSelectedVendor(null)
    } catch (error) {
      console.error('Error saving vendor:', error)
      alert('Failed to save vendor')
    }
  }

  const handleVendorSelect = (vendor) => {
    if (onVendorSelect) {
      onVendorSelect(vendor)
      onClose()
    }
  }

  const getVendorTypeInfo = (type) => {
    return VENDOR_TYPES.find(t => t.id === type) || VENDOR_TYPES[0]
  }

  const VendorForm = ({ isEdit = false }) => (
    <form onSubmit={handleSaveVendor} className="vendor-form">
      <div className="form-grid">
        <div className="field-group">
          <label>Vendor Name *</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => {
              const name = e.target.value
              setFormData(prev => ({ 
                ...prev, 
                name,
                vendorCode: !isEdit && !prev.vendorCode ? generateVendorCode(name, prev.vendorType) : prev.vendorCode
              }))
            }}
            className={`form-input ${errors.name ? 'error' : ''}`}
            placeholder="Enter vendor name"
          />
          {errors.name && <span className="error-text">{errors.name}</span>}
        </div>

        <div className="field-group">
          <label>Vendor Code *</label>
          <input
            type="text"
            value={formData.vendorCode}
            onChange={(e) => setFormData(prev => ({ ...prev, vendorCode: e.target.value.toUpperCase() }))}
            className={`form-input ${errors.vendorCode ? 'error' : ''}`}
            placeholder="VEN-001, OIL-ABC-123, etc."
          />
          {errors.vendorCode && <span className="error-text">{errors.vendorCode}</span>}
        </div>

        <div className="field-group">
          <label>Vendor Type</label>
          <select
            value={formData.vendorType}
            onChange={(e) => {
              const type = e.target.value
              setFormData(prev => ({ 
                ...prev, 
                vendorType: type,
                vendorCode: !isEdit && prev.name ? generateVendorCode(prev.name, type) : prev.vendorCode
              }))
            }}
            className="form-select"
          >
            {VENDOR_TYPES.map(type => (
              <option key={type.id} value={type.id}>{type.name}</option>
            ))}
          </select>
        </div>

        <div className="field-group">
          <label>Contact Person *</label>
          <input
            type="text"
            value={formData.contactPerson}
            onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
            className={`form-input ${errors.contactPerson ? 'error' : ''}`}
            placeholder="Enter contact person name"
          />
          {errors.contactPerson && <span className="error-text">{errors.contactPerson}</span>}
        </div>

        <div className="field-group">
          <label>Phone Number *</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            className={`form-input ${errors.phone ? 'error' : ''}`}
            placeholder="+968 24 123456"
          />
          {errors.phone && <span className="error-text">{errors.phone}</span>}
        </div>

        <div className="field-group">
          <label>Email</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            className={`form-input ${errors.email ? 'error' : ''}`}
            placeholder="vendor@example.com"
          />
          {errors.email && <span className="error-text">{errors.email}</span>}
        </div>

        <div className="field-group full-width">
          <label>Address *</label>
          <textarea
            value={formData.address}
            onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
            className={`form-textarea ${errors.address ? 'error' : ''}`}
            placeholder="Enter complete address"
            rows="2"
          />
          {errors.address && <span className="error-text">{errors.address}</span>}
        </div>

        <div className="field-group">
          <label>City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
            className="form-input"
            placeholder="Enter city"
          />
        </div>

        <div className="field-group">
          <label>Country</label>
          <select
            value={formData.country}
            onChange={(e) => setFormData(prev => ({ ...prev, country: e.target.value }))}
            className="form-select"
          >
            <option value="Oman">Oman</option>
            <option value="UAE">UAE</option>
            <option value="Saudi Arabia">Saudi Arabia</option>
            <option value="Kuwait">Kuwait</option>
            <option value="Qatar">Qatar</option>
            <option value="Bahrain">Bahrain</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div className="field-group">
          <label>VAT Number</label>
          <input
            type="text"
            value={formData.vatNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, vatNumber: e.target.value }))}
            className="form-input"
            placeholder="OM123456789"
          />
        </div>

        <div className="field-group">
          <label>CR Number</label>
          <input
            type="text"
            value={formData.crNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, crNumber: e.target.value }))}
            className="form-input"
            placeholder="CR-12345678"
          />
        </div>

        <div className="field-group">
          <label>Payment Terms (Days)</label>
          <input
            type="number"
            value={formData.paymentTerms}
            onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
            className={`form-input ${errors.paymentTerms ? 'error' : ''}`}
            placeholder="30"
            min="0"
            max="365"
          />
          {errors.paymentTerms && <span className="error-text">{errors.paymentTerms}</span>}
        </div>

        <div className="field-group">
          <label>Credit Limit (OMR)</label>
          <input
            type="number"
            value={formData.creditLimit}
            onChange={(e) => setFormData(prev => ({ ...prev, creditLimit: e.target.value }))}
            className={`form-input ${errors.creditLimit ? 'error' : ''}`}
            placeholder="0.00"
            min="0"
            step="0.01"
          />
          {errors.creditLimit && <span className="error-text">{errors.creditLimit}</span>}
        </div>

        <div className="field-group">
          <label>Bank Name</label>
          <input
            type="text"
            value={formData.bankName}
            onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
            className="form-input"
            placeholder="Enter bank name"
          />
        </div>

        <div className="field-group">
          <label>Account Number</label>
          <input
            type="text"
            value={formData.accountNumber}
            onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
            className="form-input"
            placeholder="Enter account number"
          />
        </div>

        <div className="field-group">
          <label>IBAN</label>
          <input
            type="text"
            value={formData.iban}
            onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value.toUpperCase() }))}
            className="form-input"
            placeholder="OM81 0123 4567 8901 2345"
          />
        </div>

        <div className="field-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
            />
            Active Vendor
          </label>
        </div>

        <div className="field-group full-width">
          <label>Notes</label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            className="form-textarea"
            placeholder="Additional notes about this vendor"
            rows="3"
          />
        </div>
      </div>

      <div className="form-actions">
        <button 
          type="button" 
          className="btn btn-secondary"
          onClick={() => {
            setShowCreateForm(false)
            setShowEditForm(false)
            setSelectedVendor(null)
          }}
        >
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          <Save size={16} />
          {isEdit ? 'Update Vendor' : 'Create Vendor'}
        </button>
      </div>
    </form>
  )

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={onVendorSelect ? "Select Vendor" : "Vendor Management"}
      size="xl"
    >
      <div className="vendor-manager">
        {!showCreateForm && !showEditForm && (
          <>
            {!onVendorSelect && (
              <div className="manager-header">
                <button 
                  className="btn btn-primary"
                  onClick={handleCreateVendor}
                >
                  <Plus size={20} />
                  Add New Vendor
                </button>
              </div>
            )}

            <DataTable
              data={vendors.map(vendor => ({
                ...vendor,
                typeInfo: getVendorTypeInfo(vendor.vendorType)
              }))}
              columns={[
                {
                  key: 'name',
                  header: 'Vendor',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <div className="vendor-info">
                      <div className="vendor-name">{value}</div>
                      <div className="vendor-code">{row.vendorCode}</div>
                      <div className="vendor-contact">
                        <User size={12} />
                        {row.contactPerson}
                      </div>
                    </div>
                  )
                },
                {
                  key: 'vendorType',
                  header: 'Type',
                  sortable: true,
                  filterable: true,
                  render: (value, row) => (
                    <span className="vendor-type-badge">
                      {row.typeInfo.name}
                    </span>
                  )
                },
                {
                  key: 'phone',
                  header: 'Contact',
                  render: (value, row) => (
                    <div className="contact-info">
                      <div className="phone">
                        <Phone size={12} />
                        {value}
                      </div>
                      {row.email && (
                        <div className="email">
                          <Mail size={12} />
                          {row.email}
                        </div>
                      )}
                    </div>
                  )
                },
                {
                  key: 'totalPurchases',
                  header: 'Total Purchases',
                  sortable: true,
                  render: (value) => (
                    <span className="purchase-amount">
                      OMR {value.toLocaleString()}
                    </span>
                  )
                },
                {
                  key: 'paymentTerms',
                  header: 'Payment Terms',
                  sortable: true,
                  render: (value) => (
                    <span>{value} days</span>
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
                      {onVendorSelect ? (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleVendorSelect(row)}
                        >
                          <CheckCircle size={14} />
                          Select
                        </button>
                      ) : (
                        <>
                          <button 
                            className="btn btn-outline btn-sm"
                            onClick={() => handleEditVendor(row)}
                            title="Edit Vendor"
                          >
                            <Edit size={14} />
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDeleteVendor(row)}
                            title="Delete Vendor"
                            disabled={row.totalPurchases > 0}
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
              exportable={!onVendorSelect}
              emptyMessage="No vendors found"
              className="vendors-table"
            />
          </>
        )}

        {showCreateForm && (
          <div className="form-container">
            <h3>Create New Vendor</h3>
            <VendorForm />
          </div>
        )}

        {showEditForm && selectedVendor && (
          <div className="form-container">
            <h3>Edit Vendor</h3>
            <VendorForm isEdit={true} />
          </div>
        )}
      </div>
    </Modal>
  )
}

export default VendorManager