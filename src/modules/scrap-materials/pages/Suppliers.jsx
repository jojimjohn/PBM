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
import dataCacheService from '../../../services/dataCacheService'
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
  X
} from 'lucide-react'
const ScrapMaterialsSuppliers = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { hasPermission } = usePermissions()
  const [loading, setLoading] = useState(true)
  const [suppliers, setSuppliers] = useState([])
  const [supplierTypes, setSupplierTypes] = useState({})
  const [supplierStatuses, setSupplierStatuses] = useState({})
  const [materials, setMaterials] = useState([])
  const [specializations, setSpecializations] = useState([])
  const [regions, setRegions] = useState([])
  const [collectionAreas, setCollectionAreas] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedSupplier, setSelectedSupplier] = useState(null)
  const [formData, setFormData] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')

  useEffect(() => {
    loadSuppliers()
    loadMaterials()
    loadSpecializations()
    loadRegions()
    loadCollectionAreas()
  }, [selectedCompany])

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

  const loadMaterials = async () => {
    try {
      const result = await materialService.getAll()
      if (result.success) {
        setMaterials(result.data)
      } else {
        console.error('Error loading materials:', result.error)
        setMaterials([])
      }
    } catch (error) {
      console.error('Error loading materials:', error)
      setMaterials([])
    }
  }

  const loadSpecializations = async () => {
    try {
      // Load specializations from material categories API
      const result = await materialService.getCategories({ business_type: 'scrap' })
      if (result.success) {
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

  const loadCollectionAreas = async () => {
    try {
      // Load collection areas from regions API
      const result = await materialService.getRegions()
      if (result.success) {
        setCollectionAreas(result.data || [])
      } else {
        console.error('Error loading collection areas:', result.error)
        setCollectionAreas([])
      }
    } catch (error) {
      console.error('Error loading collection areas:', error)
      setCollectionAreas([])
    }
  }

  const initializeForm = (supplier = null) => {
    if (supplier) {
      return {
        id: supplier.id,
        code: supplier.code || '',
        name: supplier.name || '',
        type: supplier.type || 'business', // Keep for UI logic only
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
        specialization: supplier.specialization ? supplier.specialization.split(',').map(s => parseInt(s.trim()) || s.trim()) : [],
        paymentTerms: supplier.paymentTermDays || 0,
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
        code: `PM-SUP-${String(suppliers.length + 1).padStart(3, '0')}`,
        name: '',
        type: 'individual',
        businessRegistration: '',
        contactPerson: '',
        nationalId: '',
        phone: '',
        email: '',
        vatRegistrationNumber: '',
        address: '',
        city: '',
        region_id: null,
        specialization: [],
        paymentTerms: 0,
        taxNumber: '',
        bankName: '',
        accountNumber: '',
        iban: '',
        notes: '',
        isActive: true
      }
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
        dataCacheService.invalidateSuppliers() // Clear cache
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
        isActive: formData.isActive !== false
      }

      // Save via API
      let result
      if (isEdit) {
        result = await supplierService.update(supplierData.id, supplierData)
      } else {
        result = await supplierService.create(supplierData)
      }

      if (result.success) {
        // Invalidate cache so other pages see updated data
        dataCacheService.invalidateSuppliers()

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
                         supplier.phone?.includes(searchTerm)
    const matchesStatus = statusFilter === 'all' || (supplier.isActive ? 'active' : 'inactive') === statusFilter
    const matchesType = typeFilter === 'all' || supplier.type === typeFilter
    
    return matchesSearch && matchesStatus && matchesType
  })

  const getTypeColor = (type) => {
    return supplierTypes[type]?.color || '#6b7280'
  }

  const getStatusColor = (status) => {
    return supplierStatuses[status]?.color || '#6b7280'
  }

  const formatCurrency = (amount) => {
    return `OMR ${amount.toFixed(2)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message="Loading suppliers..." size="large" />
      </div>
    )
  }

  // Define table columns for suppliers - consistent with other modules
  const supplierColumns = [
    {
      key: 'code',
      header: t('supplierCode'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="font-mono font-semibold text-gray-700">
          {value}
        </div>
      )
    },
    {
      key: 'name',
      header: t('supplierName'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-semibold text-xs text-white shrink-0" style={{ backgroundColor: getTypeColor(row.type) }}>
            {value.substring(0, 2).toUpperCase()}
          </div>
          <div className="flex flex-col gap-1">
            <strong className="text-gray-900 font-semibold">{value}</strong>
            <span className="text-xs text-gray-600 capitalize">{supplierTypes[row.type]?.name || row.type}</span>
          </div>
        </div>
      )
    },
    {
      key: 'contactPerson',
      header: t('contactPerson'),
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2 text-gray-700">
          <User size={14} />
          <span>{value || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'phone',
      header: t('phone'),
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Phone size={14} />
          <span>{row.phone || row.contactPhone || row.contact_phone || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'city',
      header: t('city'),
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2 text-gray-700">
          <MapPin size={14} />
          <span>{row.city || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'specialization',
      header: t('specialization'),
      sortable: false,
      render: (value) => (
        <div className="flex flex-wrap gap-1 max-w-[200px]">
          {value?.slice(0, 2).map((spec, index) => (
            <span key={index} className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-xs font-medium capitalize">
              {spec.replace('_', ' ')}
            </span>
          ))}
          {value?.length > 2 && (
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded text-xs font-medium">+{value.length - 2}</span>
          )}
        </div>
      )
    },
    {
      key: 'performance.monthlyVolume',
      header: t('monthlyVolume'),
      type: 'number',
      align: 'right',
      sortable: true,
      render: (value, row) => (
        <div className="flex items-center gap-2 text-gray-700">
          <Package size={14} />
          <span>{row.performance?.monthlyVolume || 0} KG</span>
        </div>
      )
    },
    {
      key: 'purchaseHistory.totalValue',
      header: t('totalPurchases'),
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (value, row) => formatCurrency(row.purchaseHistory?.totalValue || 0)
    },
    {
      key: 'isActive',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <span className={`px-3 py-1 rounded-full text-xs font-medium text-white ${value ? 'bg-emerald-500' : 'bg-red-500'}`}>
          {value ? 'Active' : 'Inactive'}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      render: (value, row) => (
        <div className="flex items-center gap-2">
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
    <div className="flex flex-col min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="page-header">
        <div className="page-title-section">
          <h1>{t('supplierManagement')}</h1>
          <p>{t('manageScrapSuppliers')}</p>
        </div>

        <PermissionGate permission={PERMISSIONS.MANAGE_SUPPLIERS}>
          <div className="page-actions">
            <button
              className="btn btn-primary"
              onClick={handleAddSupplier}
            >
              <Plus size={20} />
              {t('addSupplier')}
            </button>
          </div>
        </PermissionGate>
      </div>

      {/* Suppliers Summary Cards */}
      <div className="grid grid-cols-4 gap-2 mb-3 flex-shrink-0 max-lg:grid-cols-2 max-md:grid-cols-1">
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
          <div className="summary-icon !bg-blue-100 !text-blue-600">
            <Building size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">{suppliers.filter(s => s.type === 'business').length}</p>
            <p className="summary-label">{t('businessSuppliers', 'Business Suppliers')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon !bg-green-100 !text-green-600">
            <Package size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">
              {suppliers.reduce((sum, s) => sum + (s.performance?.monthlyVolume || 0), 0).toLocaleString()} KG
            </p>
            <p className="summary-label">{t('monthlyVolume', 'Monthly Volume')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon !bg-amber-100 !text-amber-600">
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
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <DataTable
          data={filteredSuppliers}
          columns={supplierColumns}
          title={t('supplierManagement', 'Supplier Management')}
          subtitle={t('supplierSubtitle', 'Manage scrap material suppliers and collection partners')}
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
          materials={materials}
          specializations={specializations}
          collectionAreas={collectionAreas}
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
          materials={materials}
          specializations={specializations}
          collectionAreas={collectionAreas}
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
  materials,
  specializations,
  collectionAreas, 
  isEdit, 
  loading,
  t 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave()
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
                readOnly={isEdit}
                className={isEdit ? 'readonly' : ''}
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
                value={formData.type || 'individual'}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
              >
                {Object.entries(supplierTypes).map(([key, type]) => (
                  <option key={key} value={key}>
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
            <div className="form-group">
              <label>{t('specialization', 'Specialization')}</label>
              <div className="ds-checkbox-grid">
                {specializations.map(spec => (
                  <label key={spec.id} className="ds-checkbox-card">
                    <input
                      type="checkbox"
                      checked={(formData.specialization || []).includes(spec.id)}
                      onChange={() => handleSpecializationChange(spec.id)}
                    />
                    <div className="ds-checkbox-content">
                      <span className="ds-checkbox-title">{spec.name}</span>
                      <span className="ds-checkbox-description">{spec.description}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>


            <div className="form-group">
              <label>Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.paymentTerms || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: parseInt(e.target.value) || 0 }))}
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
              <>
                <div className="form-group">
                  <label>Tax Number</label>
                  <input
                    type="text"
                    value={formData.taxNumber || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxNumber: e.target.value }))}
                    placeholder="TAX-12345678"
                  />
                </div>
              </>
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
  return (
    <Modal
      isOpen={isOpen}
      title=""
      onClose={onClose}
      className="ds-form-modal ds-modal-lg"
    >
      {/* Header Section */}
      <div className="modal-header">
        <div className="cell-row">
          <div className="avatar avatar-xl primary">
            {supplier.name.substring(0, 2).toUpperCase()}
          </div>
          <div className="cell-info">
            <h3 className="modal-title">{supplier.name}</h3>
            <div className="flex-row">
              <code className="cell-code accent">{supplier.code || 'N/A'}</code>
              <span className="type-badge">
                {supplier.businessRegistration ? 'Business' : 'Individual'}
              </span>
              <span className={`status-badge ${supplier.isActive ? 'active' : 'inactive'}`}>
                {supplier.isActive ? '● Active' : '○ Inactive'}
              </span>
            </div>
          </div>
        </div>
        <div className="cell-actions">
          <button className="btn-icon-action secondary" onClick={onEdit} title="Edit Supplier">
            <Edit size={18} />
          </button>
        </div>
      </div>

      {/* Content Section */}
      <div className="modal-body">
        {/* Contact Information */}
        <div className="ds-form-section">
          <div className="ds-form-section-title">
            <Phone size={16} /> Contact Information
          </div>
          <div className="ds-form-grid two-col">
            <div className="ds-form-group">
              <label className="ds-form-label">Contact Person</label>
              <div className="cell-text">{supplier.contactPerson || 'Not specified'}</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Phone Number</label>
              <div className="cell-text">{supplier.phone || supplier.contactPhone || supplier.contact_phone || 'Not provided'}</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Email Address</label>
              <div className="cell-text">{supplier.email || supplier.contactEmail || supplier.contact_email || 'Not provided'}</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">{t('vatRegistrationNumber')}</label>
              <div className="cell-text">{supplier.vatRegistration || supplier.vatRegistrationNumber || supplier.vat_registration || 'Not provided'}</div>
            </div>
            <div className="ds-form-group full-width">
              <label className="ds-form-label">Physical Address</label>
              <div className="cell-text">
                {supplier.address || supplier.physical_address || 'Not provided'}
                {supplier.city && `, ${supplier.city}`}
              </div>
            </div>
          </div>
        </div>

        {/* Business Information */}
        <div className="ds-form-section">
          <div className="ds-form-section-title">
            <Building size={16} /> Business Information
          </div>
          <div className="ds-form-grid two-col">
            <div className="ds-form-group">
              <label className="ds-form-label">Supplier Type</label>
              <div className="cell-text">{supplier.businessRegistration ? 'Business' : 'Individual'}</div>
            </div>
            {supplier.businessRegistration && (
              <div className="ds-form-group">
                <label className="ds-form-label">Business Registration</label>
                <div className="cell-text">{supplier.businessRegistration}</div>
              </div>
            )}
            <div className="ds-form-group">
              <label className="ds-form-label">Payment Terms</label>
              <div className="cell-text">{supplier.paymentTermDays || 0} days</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Tax Number</label>
              <div className="cell-text">{supplier.taxNumber || 'Not provided'}</div>
            </div>
          </div>
        </div>

        {/* Specialization */}
        <div className="ds-form-section">
          <div className="ds-form-section-title">
            <Package size={16} /> Specialization & Service Areas
          </div>
          <div className="ds-form-grid two-col">
            <div className="ds-form-group">
              <label className="ds-form-label">Material Specialization</label>
              <div className="flex-row flex-wrap">
                {supplier.specialization ? (
                  supplier.specialization.split(',').map((spec, index) => (
                    <span key={index} className="type-badge">
                      {spec.trim().replace('_', ' ').toUpperCase()}
                    </span>
                  ))
                ) : (
                  <span className="cell-text-secondary">Not specified</span>
                )}
              </div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Collection Areas</label>
              <div className="cell-text-secondary">Managed via supplier locations</div>
            </div>
          </div>
        </div>

        {/* Performance & Purchase History */}
        <div className="ds-form-section">
          <div className="ds-form-section-title">
            <TrendingUp size={16} /> Performance & Purchase History
          </div>
          <div className="ds-form-grid three-col">
            <div className="ds-form-group">
              <label className="ds-form-label">Reliability Score</label>
              <div className="cell-text">0%</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Quality Rating</label>
              <div className="cell-text">0%</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Average Rate</label>
              <div className="cell-text">{formatCurrency(0)}</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Total Transactions</label>
              <div className="cell-text">0</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Total Purchase Value</label>
              <div className="cell-text text-success font-semibold">{formatCurrency(0)}</div>
            </div>
            <div className="ds-form-group">
              <label className="ds-form-label">Total Material Weight</label>
              <div className="cell-text">0 KG</div>
            </div>
          </div>
        </div>

        {/* Banking Information - Only show if available */}
        {(supplier.bankName || supplier.accountNumber || supplier.iban) && (
          <div className="ds-form-section">
            <div className="ds-form-section-title">
              <Banknote size={16} /> Banking Information
            </div>
            <div className="ds-form-grid three-col">
              <div className="ds-form-group">
                <label className="ds-form-label">Bank Name</label>
                <div className="cell-text">{supplier.bankName || 'Not provided'}</div>
              </div>
              <div className="ds-form-group">
                <label className="ds-form-label">Account Number</label>
                <div className="cell-text">{supplier.accountNumber || 'Not provided'}</div>
              </div>
              <div className="ds-form-group">
                <label className="ds-form-label">IBAN</label>
                <div className="cell-text">{supplier.iban || 'Not provided'}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="modal-footer">
        <span className="cell-text-secondary">
          Last updated: {formatDate(supplier.updated_at || supplier.created_at)}
        </span>
        <div className="flex-row">
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
    </Modal>
  )
}

export default ScrapMaterialsSuppliers