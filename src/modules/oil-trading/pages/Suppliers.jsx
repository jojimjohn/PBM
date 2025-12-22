import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import LoadingSpinner from '../../../components/LoadingSpinner'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import supplierService from '../../../services/supplierService'
import materialService from '../../../services/materialService'
import typesService from '../../../services/typesService'
import SupplierLocationManager from '../../../components/suppliers/SupplierLocationManager'
import { 
  Plus, 
  Search, 
  Filter,
  Eye,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  Truck,
  Award,
  Calendar,
  Banknote,
  Package,
  TrendingUp,
  Save,
  X,
  Settings,
  Users
} from 'lucide-react'
import '../styles/Suppliers.css'

const OilTradingSuppliers = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [supplierTypes, setSupplierTypes] = useState([])
  const [regions, setRegions] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [formData, setFormData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('suppliers')

  const supplierStatuses = {
    'active': { name: 'Active', color: '#10b981' },
    'inactive': { name: 'Inactive', color: '#6b7280' },
    'suspended': { name: 'Suspended', color: '#ef4444' },
    'pending_approval': { name: 'Pending Approval', color: '#f59e0b' }
  }

  useEffect(() => {
    loadSuppliers()
    loadRegions()
    loadSpecializations()
    loadSupplierTypes()
  }, [selectedCompany])

  const loadSupplierTypes = async () => {
    try {
      const result = await typesService.getSupplierTypes()
      if (result.success) {
        setSupplierTypes(result.data || [])
      }
    } catch (error) {
      console.error('Error loading supplier types:', error)
    }
  }

  const loadSuppliers = async () => {
    try {
      const result = await supplierService.getAll()
      if (result.success) {
        setSuppliers(result.data)
      } else {
        console.error('Error loading suppliers:', result.error)
        setSuppliers([])
      }
    } catch (error) {
      console.error('Error loading suppliers:', error)
      setSuppliers([])
    } finally {
      setLoading(false)
    }
  }

  const loadRegions = async () => {
    try {
      // Load regions for dropdown selection
      const result = await materialService.getRegions()
      if (result.success) {
        setRegions(result.data || [])
      } else {
        console.error('Error loading regions:', result.error)
        setRegions([])
      }
    } catch (error) {
      console.error('Error loading regions:', error)
      setRegions([])
    }
  }

  const loadSpecializations = async () => {
    try {
      console.log('Loading specializations for oil business...')
      // Load specializations from material categories API for oil business
      const result = await materialService.getCategories({ business_type: 'oil' })
      console.log('Specializations API result:', result)
      if (result.success) {
        console.log('Specializations data:', result.data)
        setSpecializations(result.data || [])
      } else {
        console.error('Error loading specializations:', result.error)
        setSpecializations([])
      }
    } catch (error) {
      console.error('Error loading specializations:', error)
      setSpecializations([])
    }
  }

  // Generate next supplier code based on highest existing code
  const generateNextSupplierCode = () => {
    if (suppliers.length === 0) {
      return 'AR-SUP-001'
    }

    // Find the highest numeric suffix from existing codes
    let maxNumber = 0
    suppliers.forEach(supplier => {
      if (supplier.code) {
        const match = supplier.code.match(/AR-SUP-(\d+)/)
        if (match) {
          const num = parseInt(match[1], 10)
          if (num > maxNumber) {
            maxNumber = num
          }
        }
      }
    })

    // Return next available code
    return `AR-SUP-${String(maxNumber + 1).padStart(3, '0')}`
  }

  const initializeForm = (supplier = null) => {
    if (supplier) {
      return {
        id: supplier.id,
        code: supplier.code || '',
        name: supplier.name || '',
        type: supplier.type || 'business',
        businessRegistration: supplier.businessRegistration || '',
        contactPerson: supplier.contactPerson || '',
        nationalId: supplier.nationalId || '',
        // Direct database fields
        phone: supplier.phone || '',
        email: supplier.email || '',
        vatRegistrationNumber: supplier.vatRegistration || '',
        address: supplier.address || '',
        city: supplier.city || '',
        region_id: supplier.region_id || null,
        paymentTerms: supplier.paymentTermDays || 0,
        specialization: supplier.specialization ? supplier.specialization.split(',').map(s => parseInt(s.trim()) || s.trim()) : [],
        taxNumber: supplier.taxNumber || '',
        // Bank fields now supported by database
        bankName: supplier.bankName || '',
        accountNumber: supplier.accountNumber || '',
        iban: supplier.iban || '',
        notes: supplier.notes || '',
        isActive: supplier.isActive === true || supplier.isActive === 1 || supplier.isActive === '1'
      }
    } else {
      return {
        code: generateNextSupplierCode(),
        name: '',
        type: 'business',
        businessRegistration: '',
        contactPerson: '',
        nationalId: '',
        phone: '',
        email: '',
        vatRegistrationNumber: '',
        address: '',
        city: 'Muscat',
        region_id: null,
        paymentTerms: 30,
        specialization: [],
        taxNumber: '',
        bankName: '',
        accountNumber: '',
        iban: '',
        notes: '',
        isActive: true
      }
    }
  }

  const handleSpecializationChange = (spec) => {
    const currentSpecs = formData.specialization || []
    if (currentSpecs.includes(spec)) {
      setFormData(prev => ({
        ...prev,
        specialization: currentSpecs.filter(s => s !== spec)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        specialization: [...currentSpecs, spec]
      }))
    }
  }

  const handleAddSupplier = () => {
    setFormData(initializeForm())
    setShowAddForm(true)
  }

  const handleEditSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setFormData(initializeForm(supplier))
    setShowEditForm(true)
  }

  const handleViewSupplier = (supplier) => {
    setSelectedSupplier(supplier)
    setShowViewModal(true)
  }

  const handleDeleteSupplier = async (supplierId) => {
    if (!confirm(t('confirmDelete'))) {
      return
    }

    try {
      const result = await supplierService.delete(supplierId)
      if (result.success) {
        setSuppliers(prev => prev.filter(s => s.id !== supplierId))
        alert(t('supplierDeleted'))
      } else {
        console.error('Error deleting supplier:', result.error)
        alert(t('errorDeleting'))
      }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      alert(t('errorDeleting'))
    }
  }

  const handleSaveSupplier = async (isEdit = false) => {
    try {
      setLoading(true)
      
      // Basic validation
      if (!formData.name || !formData.phone) {
        alert(t('fillRequiredFields'))
        return
      }

      // Create supplier object matching database schema
      const supplierData = {
        id: isEdit ? formData.id : undefined, // Let database auto-generate ID
        code: formData.code,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        region_id: formData.region_id,
        vatRegistration: formData.vatRegistrationNumber,
        contactPerson: formData.contactPerson,
        businessRegistration: formData.businessRegistration,
        nationalId: formData.nationalId,
        taxNumber: formData.taxNumber,
        specialization: formData.specialization,
        creditBalance: 0,
        paymentTermDays: formData.paymentTerms,
        bankName: formData.bankName,
        accountNumber: formData.accountNumber,
        iban: formData.iban,
        notes: formData.notes,
        isActive: formData.isActive !== false,
        createdAt: isEdit ? selectedSupplier.createdAt : new Date().toISOString(),
        lastTransaction: isEdit ? selectedSupplier.lastTransaction : null,
        performance: isEdit ? selectedSupplier.performance : {
          monthlyVolume: 0,
          averageRate: 0,
          reliability: 0,
          qualityScore: 0
        },
        purchaseHistory: isEdit ? selectedSupplier.purchaseHistory : {
          totalTransactions: 0,
          totalValue: 0,
          totalWeight: 0
        }
      }

      // Save via API
      let result
      if (isEdit) {
        result = await supplierService.update(supplierData.id, supplierData)
      } else {
        result = await supplierService.create(supplierData)
      }

      if (result.success) {
        // Update local state
        if (isEdit) {
          setSuppliers(prev => prev.map(s => s.id === result.data.id ? result.data : s))
        } else {
          setSuppliers(prev => [...prev, result.data])
        }

        // Close modals
        setShowAddForm(false)
        setShowEditForm(false)
        setSelectedSupplier(null)
        
        alert(t(isEdit ? 'supplierUpdated' : 'supplierCreated', isEdit ? 'Supplier updated successfully!' : 'Supplier created successfully!'))
      } else {
        console.error('Error saving supplier:', result.error)
        alert(t('errorSaving'))
      }
    } catch (error) {
      console.error('Error saving supplier:', error)
      alert(t('errorSaving'))
    } finally {
      setLoading(false)
    }
  }

  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.contact?.phone?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && supplier.isActive) ||
                         (statusFilter === 'inactive' && !supplier.isActive)
    const matchesType = typeFilter === 'all' || supplier.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const formatCurrency = (amount) => {
    return `OMR ${amount.toFixed(2)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  // Remove early return - let DataTable handle loading state with skeleton

  // Define table columns for oil trading suppliers
  const supplierColumns = [
    {
      key: 'code',
      header: t('supplierCode'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="supplier-code">
          <strong>{value}</strong>
        </div>
      )
    },
    {
      key: 'name',
      header: t('supplierName'),
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const supplierType = supplierTypes.find(t => t.code === row.type)
        return (
          <div className="supplier-info">
            <div className="supplier-avatar" style={{ backgroundColor: '#3b82f6' }}>
              {value.substring(0, 2).toUpperCase()}
            </div>
            <div className="supplier-details">
              <strong>{value}</strong>
              <span className="supplier-type">{supplierType?.name || row.type}</span>
            </div>
          </div>
        )
      }
    },
    {
      key: 'contactPerson',
      header: t('contactPerson'),
      sortable: true,
      render: (value, row) => (
        <div className="contact-info">
          <User size={14} />
          <span>{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'contact.phone',
      header: t('phone'),
      sortable: false,
      render: (value, row) => (
        <div className="phone-info">
          <Phone size={14} />
          <span>{row.phone || row.contactPhone || row.contact?.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'contact.address.city',
      header: t('city'),
      sortable: true,
      render: (value, row) => (
        <div className="location-info">
          <MapPin size={14} />
          <span>{row.city || row.contact?.address?.city || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const isActive = value === true || value === 1 || value === '1';
        return (
          <span 
            className="supplier-status-badge"
            style={{ backgroundColor: isActive ? '#10b981' : '#ef4444' }}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (value, row) => (
        <div className="table-actions">
          <PermissionGate permission={PERMISSIONS.VIEW_SUPPLIERS}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={(e) => {
                e.stopPropagation()
                handleViewSupplier(row)
              }}
              title={t('viewDetails')}
            >
              <Eye size={14} />
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_SUPPLIERS}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={(e) => {
                e.stopPropagation()
                handleEditSupplier(row)
              }}
              title={t('edit')}
            >
              <Edit size={14} />
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_SUPPLIERS}>
            <button 
              className="btn btn-outline btn-sm btn-danger" 
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteSupplier(row.id)
              }}
              title={t('delete')}
            >
              <Trash2 size={14} />
            </button>
          </PermissionGate>
        </div>
      )
    }
  ]

  return (
    <div className="oil-suppliers-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>{t('supplierManagement')}</h1>
          <p>{t('manageOilSuppliers', 'Manage oil trading suppliers and collection locations')}</p>
        </div>
        
        <PermissionGate permission={PERMISSIONS.MANAGE_SUPPLIERS}>
          <div className="page-actions">
            {activeTab === 'suppliers' && (
              <button 
                className="btn btn-primary"
                onClick={handleAddSupplier}
              >
                <Plus size={20} />
                {t('addSupplier')}
              </button>
            )}
          </div>
        </PermissionGate>
      </div>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <button
          className={`tab-button ${activeTab === 'suppliers' ? 'active' : ''}`}
          onClick={() => setActiveTab('suppliers')}
        >
          <Users size={18} />
          {t('suppliers', 'Suppliers')}
        </button>
        <button
          className={`tab-button ${activeTab === 'locations' ? 'active' : ''}`}
          onClick={() => setActiveTab('locations')}
        >
          <MapPin size={18} />
          {t('supplierLocations', 'Supplier Locations')}
        </button>
      </div>

      {/* Suppliers Tab */}
      {activeTab === 'suppliers' && (
        <>
          {/* Suppliers Summary Cards */}
          <div className="suppliers-summary">
            <div className="summary-card">
              <div className="summary-icon">
                <User size={24} />
              </div>
              <div className="summary-info">
                <p className="summary-value">{suppliers.length}</p>
                <p className="summary-label">{t('totalSuppliers', 'Total Suppliers')}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon business">
                <Building size={24} />
              </div>
              <div className="summary-info">
                <p className="summary-value">{suppliers.filter(s => s.type === 'business').length}</p>
                <p className="summary-label">{t('businessSuppliers', 'Business Suppliers')}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon success">
                <Package size={24} />
              </div>
              <div className="summary-info">
                <p className="summary-value">
                  {suppliers.reduce((sum, s) => sum + (s.performance?.monthlyVolume || 0), 0).toLocaleString()} L
                </p>
                <p className="summary-label">{t('monthlyVolume', 'Monthly Volume')}</p>
              </div>
            </div>

            <div className="summary-card">
              <div className="summary-icon profit">
                <Banknote size={24} />
              </div>
              <div className="summary-info">
                <p className="summary-value">
                  {formatCurrency(suppliers.reduce((sum, s) => sum + (s.purchaseHistory?.totalValue || 0), 0))}
                </p>
                <p className="summary-label">{t('totalValue', 'Total Value')}</p>
              </div>
            </div>
          </div>

          {/* Suppliers Table */}
          <div className="suppliers-table-container">
            <DataTable
              data={filteredSuppliers}
              columns={supplierColumns}
              title={t('supplierManagement', 'Supplier Management')}
              subtitle={t('supplierSubtitle', 'Manage oil trading suppliers and collection partners')}
              loading={loading}
              searchable={true}
              filterable={true}
              sortable={true}
              paginated={true}
              exportable={true}
              selectable={false}
              onRowClick={handleViewSupplier}
              emptyMessage={t('noSuppliersFound', 'No suppliers found')}
              className="suppliers-table"
              initialPageSize={10}
              stickyHeader={true}
              enableColumnToggle={true}
            />
          </div>
        </>
      )}

      {/* Supplier Locations Tab */}
      {activeTab === 'locations' && (
        <div className="supplier-locations-container">
          <SupplierLocationManager />
        </div>
      )}

      {/* Add Supplier Modal */}
      {showAddForm && (
        <SupplierFormModal
          isOpen={showAddForm}
          onClose={() => setShowAddForm(false)}
          onSave={() => handleSaveSupplier(false)}
          title={t('addNewSupplier', 'Add New Supplier')}
          formData={formData}
          setFormData={setFormData}
          supplierTypes={supplierTypes}
          regions={regions}
          specializations={specializations}
          handleSpecializationChange={handleSpecializationChange}
          isEdit={false}
          loading={loading}
          t={t}
        />
      )}

      {/* Edit Supplier Modal */}
      {showEditForm && selectedSupplier && (
        <SupplierFormModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedSupplier(null)
          }}
          onSave={() => handleSaveSupplier(true)}
          title={t('editSupplier', 'Edit Supplier')}
          formData={formData}
          setFormData={setFormData}
          supplierTypes={supplierTypes}
          regions={regions}
          specializations={specializations}
          handleSpecializationChange={handleSpecializationChange}
          isEdit={true}
          loading={loading}
          t={t}
        />
      )}

      {/* View Supplier Modal */}
      {showViewModal && selectedSupplier && (
        <SupplierViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setSelectedSupplier(null)
          }}
          onEdit={() => {
            setShowEditForm(true)
            setShowViewModal(false)
            setFormData(initializeForm(selectedSupplier))
          }}
          supplier={selectedSupplier}
          supplierTypes={supplierTypes}
          supplierStatuses={supplierStatuses}
          formatCurrency={formatCurrency}
          formatDate={formatDate}
          t={t}
        />
      )}
    </div>
  )
}

// Supplier Form Modal Component
const SupplierFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  formData, 
  setFormData, 
  supplierTypes,
  regions,
  specializations,
  handleSpecializationChange,
  isEdit, 
  loading,
  t 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave()
  }

  return (
    <Modal 
      isOpen={isOpen}
      title={title} 
      onClose={onClose}
      className="modal-xl"
    >
      <form className="supplier-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <div className="form-section-title">
            <User size={20} />
            Basic Information
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Supplier Code *</label>
              <input
                type="text"
                value={formData.code || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                required
                placeholder="Enter supplier code"
              />
            </div>

            <div className="form-group">
              <label>Supplier Name *</label>
              <input
                type="text"
                value={formData.name || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                required
                placeholder="Enter supplier name"
              />
            </div>

            <div className="form-group">
              <label>Supplier Type</label>
              <select
                value={formData.type || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="">Select Type...</option>
                {supplierTypes.map(type => (
                  <option key={type.id} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {formData.type !== 'individual' && (
              <div className="form-group">
                <label>Business Registration</label>
                <input
                  type="text"
                  value={formData.businessRegistration || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, businessRegistration: e.target.value }))}
                  placeholder="CR-12345678"
                />
              </div>
            )}

            <div className="form-group">
              <label>Contact Person</label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Enter contact person name"
              />
            </div>

            <div className="form-group">
              <label>National ID</label>
              <input
                type="text"
                value={formData.nationalId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, nationalId: e.target.value }))}
                placeholder="12345678"
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Phone size={20} />
            Contact Information
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Phone Number *</label>
              <input
                type="tel"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                required
                placeholder="+968 1234 5678"
              />
            </div>

            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={formData.email || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="supplier@example.com"
              />
            </div>

            <div className="form-group">
              <label>{t('vatRegistrationNumber')}</label>
              <input
                type="text"
                value={formData.vatRegistrationNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, vatRegistrationNumber: e.target.value }))}
                placeholder="OM12345678901"
              />
            </div>

            <div className="form-group">
              <label>Street Address</label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Building, street, area (excluding city and region)"
                rows="2"
              />
            </div>

            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                placeholder="Muscat"
              />
            </div>

            <div className="form-group">
              <label>Region</label>
              <select
                value={formData.region_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, region_id: parseInt(e.target.value) || null }))}
              >
                <option value="">Select Region</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name} - {region.governorate}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="form-section">
          <div className="form-section-title">
            <Package size={20} />
            Business Details
          </div>
          
          <div className="form-grid">
            <div className="form-group full-width">
              <label>{t('specialization', 'Specialization')}</label>
              <div className="checkbox-grid">
                {specializations.map(spec => (
                  <label key={spec.id} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={(formData.specialization || []).includes(spec.id)}
                      onChange={() => handleSpecializationChange(spec.id)}
                    />
                    <div className="checkbox-content">
                      <span className="checkbox-title">{spec.name}</span>
                      <span className="checkbox-description">{spec.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.paymentTerms || 30}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 30 }))}
                min="0"
                max="365"
              />
            </div>

            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.isActive === true || formData.isActive === 1 || formData.isActive === '1' ? 'active' : 'inactive'}
                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.value === 'active' }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            {formData.type !== 'individual' && (
              <div className="form-group">
                <label>Tax Number</label>
                <input
                  type="text"
                  value={formData.taxNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                  placeholder="TAX-12345678"
                />
              </div>
            )}
          </div>
        </div>

        {/* Banking Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Banknote size={20} />
            Banking Information
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Bank Name</label>
              <input
                type="text"
                value={formData.bankName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, bankName: e.target.value }))}
                placeholder="Bank Muscat"
              />
            </div>

            <div className="form-group">
              <label>Account Number</label>
              <input
                type="text"
                value={formData.accountNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, accountNumber: e.target.value }))}
                placeholder="1234567890"
              />
            </div>

            <div className="form-group">
              <label>IBAN</label>
              <input
                type="text"
                value={formData.iban || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, iban: e.target.value }))}
                placeholder="OM81BMAG0001234567890"
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="form-section">
          <h4>Additional Information</h4>
          <div className="form-group full-width">
            <label>Notes</label>
            <textarea
              value={formData.notes || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Enter any additional information about this supplier..."
              rows="4"
              className="form-control"
            />
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Update Supplier' : 'Create Supplier'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Supplier View Modal Component
const SupplierViewModal = ({
  isOpen,
  onClose,
  onEdit,
  supplier,
  supplierTypes,
  supplierStatuses,
  formatCurrency,
  formatDate,
  t
}) => {
  // Debug logging
  console.log('🔍 Supplier ViewModal Debug:')
  console.log('- supplier.type:', supplier.type)
  console.log('- supplierTypes array:', supplierTypes)
  console.log('- Found type:', supplierTypes.find(t => t.code === supplier.type))

  return (
    <Modal 
      isOpen={isOpen}
      title={`${supplier.name} - Supplier Details`}
      onClose={onClose}
      className="modal-xl supplier-details-modal"
    >
      <div className="supplier-view-professional">
        {/* Professional Header Section */}
        <div className="supplier-header-section">
          <div className="supplier-main-info">
            <div className="supplier-avatar-large" style={{ backgroundColor: supplierTypes.find(t => t.code === supplier.type)?.color || '#6366f1' }}>
              {supplier.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="supplier-identity">
              <h2 className="supplier-name-large">{supplier.name}</h2>
              <div className="supplier-meta">
                <span className="supplier-code-badge">{supplier.code}</span>
                <span className="supplier-type-badge">{supplierTypes.find(t => t.code === supplier.type)?.name || supplier.type}</span>
                <span
                  className="supplier-status-professional"
                  style={{ backgroundColor: supplier.isActive ? '#10b981' : '#ef4444' }}
                >
                  {supplier.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Information Grid */}
        <div className="supplier-info-grid">
          {/* Contact Information Card */}
          <div className="info-card">
            <div className="info-card-header">
              <Phone size={18} />
              <h3>Contact Information</h3>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <span className="info-label">Contact Person</span>
                <span className="info-value">{supplier.contactPerson || 'Not specified'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Phone Number</span>
                <span className="info-value">{supplier.phone || supplier.contactPhone || supplier.contact?.phone || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email Address</span>
                <span className="info-value">{supplier.email || supplier.contactEmail || supplier.contact?.email || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('vatRegistrationNumber')}</span>
                <span className="info-value">{supplier.vatRegistration || supplier.vatRegistrationNumber || supplier.contact?.vatRegistrationNumber || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Physical Address</span>
                <span className="info-value">
                  {supplier.address || (supplier.contact?.address ? 
                    `${supplier.contact.address.street}, ${supplier.contact.address.city}, ${supplier.contact.address.region}` 
                    : 'Not provided')
                  }
                </span>
              </div>
            </div>
          </div>

          {/* Business Information Card */}
          <div className="info-card">
            <div className="info-card-header">
              <Building size={18} />
              <h3>Business Information</h3>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <span className="info-label">Supplier Type</span>
                <span className="info-value">
                  {supplierTypes.find(t => t.code === supplier.type)?.name || supplier.type}
                </span>
              </div>
              {supplier.businessRegistration && (
                <div className="info-row">
                  <span className="info-label">Business Registration</span>
                  <span className="info-value">{supplier.businessRegistration}</span>
                </div>
              )}
              <div className="info-row">
                <span className="info-label">Payment Terms</span>
                <span className="info-value">{supplier.paymentTerms} days</span>
              </div>
              <div className="info-row">
                <span className="info-label">Tax Number</span>
                <span className="info-value">{supplier.taxNumber || 'Not provided'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Professional Action Footer */}
        <div className="supplier-actions-footer">
          <div className="actions-left">
            <span className="last-updated">
              Last updated: {formatDate(supplier.updated_at || supplier.created_at || supplier.createdAt)}
            </span>
          </div>
          <div className="actions-right">
            <button className="btn btn-outline" onClick={onClose}>
              Close
            </button>
            <button className="btn btn-primary" onClick={onEdit}>
              <Edit size={16} />
              Edit Supplier
            </button>
            <button className="btn btn-success">
              <Plus size={16} />
              New Purchase Order
            </button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export default OilTradingSuppliers