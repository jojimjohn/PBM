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
  DollarSign,
  Package,
  TrendingUp,
  Save,
  X
} from 'lucide-react'
import '../styles/Suppliers.css'

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
      // Use hardcoded specializations since they're static reference data
      const specializations = [
        { id: 1, name: 'Aluminum Scrap', isActive: true },
        { id: 2, name: 'Copper Materials', isActive: true },
        { id: 3, name: 'Steel & Iron', isActive: true },
        { id: 4, name: 'Electronic Waste', isActive: true },
        { id: 5, name: 'Mixed Metals', isActive: true }
      ]
      setSpecializations(specializations)
    } catch (error) {
      console.error('Error loading specializations:', error)
    }
  }

  const loadCollectionAreas = async () => {
    try {
      // Use hardcoded collection areas since they're static reference data
      const collectionAreas = [
        { id: 1, name: 'Muscat Governorate', isActive: true },
        { id: 2, name: 'Al Batinah North', isActive: true },
        { id: 3, name: 'Al Batinah South', isActive: true },
        { id: 4, name: 'Ad Dakhiliyah', isActive: true },
        { id: 5, name: 'Al Sharqiyah North', isActive: true },
        { id: 6, name: 'Al Sharqiyah South', isActive: true }
      ]
      setCollectionAreas(collectionAreas)
    } catch (error) {
      console.error('Error loading collection areas:', error)
    }
  }

  const initializeForm = (supplier = null) => {
    if (supplier) {
      return {
        id: supplier.id,
        code: supplier.code,
        name: supplier.name,
        type: supplier.type,
        businessRegistration: supplier.businessRegistration || '',
        contactPerson: supplier.contactPerson || '',
        nationalId: supplier.nationalId || '',
        phone: supplier.contact?.phone || '',
        email: supplier.contact?.email || '',
        vatRegistrationNumber: supplier.contact?.vatRegistrationNumber || '',
        street: supplier.contact?.address?.street || '',
        city: supplier.contact?.address?.city || '',
        region: supplier.contact?.address?.region || '',
        specialization: supplier.specialization || [],
        collectionAreas: supplier.collectionAreas || [],
        paymentTerms: supplier.paymentTerms || 0,
        taxNumber: supplier.taxNumber || '',
        bankName: supplier.bankDetails?.bankName || '',
        accountNumber: supplier.bankDetails?.accountNumber || '',
        iban: supplier.bankDetails?.iban || '',
        status: supplier.status || 'active'
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
        street: '',
        city: 'Muscat',
        region: 'Muscat Governorate',
        specialization: [],
        collectionAreas: [],
        paymentTerms: 0,
        taxNumber: '',
        bankName: '',
        accountNumber: '',
        iban: '',
        status: 'active'
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

      // Create supplier object
      const supplierData = {
        id: isEdit ? formData.id : `supp_${Date.now()}`,
        code: formData.code,
        name: formData.name,
        type: formData.type,
        businessRegistration: formData.businessRegistration,
        contactPerson: formData.contactPerson,
        nationalId: formData.nationalId,
        contact: {
          phone: formData.phone,
          email: formData.email,
          vatRegistrationNumber: formData.vatRegistrationNumber,
          address: {
            street: formData.street,
            city: formData.city,
            region: formData.region,
            country: 'Oman'
          }
        },
        specialization: formData.specialization,
        collectionAreas: formData.collectionAreas,
        paymentTerms: formData.paymentTerms,
        taxNumber: formData.taxNumber,
        bankDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          iban: formData.iban
        },
        status: formData.status,
        isActive: formData.status === 'active',
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
    const matchesStatus = statusFilter === 'all' || supplier.status === statusFilter
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
      render: (value, row) => (
        <div className="supplier-info">
          <div className="supplier-avatar" style={{ backgroundColor: getTypeColor(row.type) }}>
            {value.substring(0, 2).toUpperCase()}
          </div>
          <div className="supplier-details">
            <strong>{value}</strong>
            <span className="supplier-type">{supplierTypes[row.type]?.name || row.type}</span>
          </div>
        </div>
      )
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
          <span>{row.contact?.phone || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'specialization',
      header: t('specialization'),
      sortable: false,
      render: (value) => (
        <div className="specialization-tags">
          {value?.slice(0, 2).map((spec, index) => (
            <span key={index} className="spec-tag">
              {spec.replace('_', ' ')}
            </span>
          ))}
          {value?.length > 2 && (
            <span className="more-specs">+{value.length - 2}</span>
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
        <div className="volume-info">
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
      key: 'status',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span 
          className="supplier-status-badge"
          style={{ backgroundColor: getStatusColor(value) }}
        >
          {supplierStatuses[value]?.name || value}
        </span>
      )
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
    <div className="scrap-suppliers-page">
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
              {suppliers.reduce((sum, s) => sum + (s.performance?.monthlyVolume || 0), 0).toLocaleString()} KG
            </p>
            <p className="summary-label">{t('monthlyVolume', 'Monthly Volume')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon profit">
            <DollarSign size={24} />
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

  const handleCollectionAreaChange = (area) => {
    const currentAreas = formData.collectionAreas || []
    if (currentAreas.includes(area)) {
      setFormData(prev => ({
        ...prev,
        collectionAreas: currentAreas.filter(a => a !== area)
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        collectionAreas: [...currentAreas, area]
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
              <input
                type="text"
                value={formData.street || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, street: e.target.value }))}
                placeholder="Building, Street, Area"
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
              <input
                type="text"
                value={formData.region || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, region: e.target.value }))}
                placeholder="Muscat Governorate"
              />
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
              <label>{t('collectionAreas', 'Collection Areas')}</label>
              <div className="checkbox-grid">
                {collectionAreas.map(area => (
                  <label key={area.id} className="checkbox-card">
                    <input
                      type="checkbox"
                      checked={(formData.collectionAreas || []).includes(area.id)}
                      onChange={() => handleCollectionAreaChange(area.id)}
                    />
                    <div className="checkbox-content">
                      <span className="checkbox-title">{area.name}</span>
                      <span className="checkbox-description">{area.governorate}</span>
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
                value={formData.status || 'active'}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
                <option value="pending_approval">Pending Approval</option>
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
            <DollarSign size={20} />
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
      title={`${supplier.name} - Supplier Details`}
      onClose={onClose}
      className="modal-xl supplier-details-modal"
    >
      <div className="supplier-view-professional">
        {/* Professional Header Section */}
        <div className="supplier-header-section">
          <div className="supplier-main-info">
            <div className="supplier-avatar-large" style={{ backgroundColor: supplierTypes[supplier.type]?.color }}>
              {supplier.name.substring(0, 2).toUpperCase()}
            </div>
            <div className="supplier-identity">
              <h2 className="supplier-name-large">{supplier.name}</h2>
              <div className="supplier-meta">
                <span className="supplier-code-badge">{supplier.code}</span>
                <span className="supplier-type-badge">{supplierTypes[supplier.type]?.name || supplier.type}</span>
                <span 
                  className="supplier-status-professional"
                  style={{ backgroundColor: supplierStatuses[supplier.status]?.color }}
                >
                  {supplierStatuses[supplier.status]?.name || supplier.status}
                </span>
              </div>
            </div>
          </div>
          
          {/* Key Performance Metrics */}
          <div className="supplier-kpi-cards">
            <div className="kpi-card primary">
              <div className="kpi-icon">
                <Package size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{supplier.performance?.monthlyVolume || 0}</span>
                <span className="kpi-label">KG/Month</span>
              </div>
            </div>
            <div className="kpi-card success">
              <div className="kpi-icon">
                <DollarSign size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{formatCurrency(supplier.purchaseHistory?.totalValue || 0)}</span>
                <span className="kpi-label">Total Value</span>
              </div>
            </div>
            <div className="kpi-card info">
              <div className="kpi-icon">
                <TrendingUp size={20} />
              </div>
              <div className="kpi-content">
                <span className="kpi-value">{supplier.performance?.reliability || 0}%</span>
                <span className="kpi-label">Reliability</span>
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
                <span className="info-value">{supplier.contact?.phone || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Email Address</span>
                <span className="info-value">{supplier.contact?.email || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">{t('vatRegistrationNumber')}</span>
                <span className="info-value">{supplier.contact?.vatRegistrationNumber || 'Not provided'}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Physical Address</span>
                <span className="info-value">
                  {supplier.contact?.address ? 
                    `${supplier.contact.address.street}, ${supplier.contact.address.city}, ${supplier.contact.address.region}` 
                    : 'Not provided'
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
                <span className="info-value">{supplierTypes[supplier.type]?.name || supplier.type}</span>
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

          {/* Specialization & Areas Card */}
          <div className="info-card full-width">
            <div className="info-card-header">
              <Package size={18} />
              <h3>Specialization & Service Areas</h3>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <span className="info-label">Material Specialization</span>
                <div className="specialization-professional">
                  {supplier.specialization?.map((spec, index) => (
                    <span key={index} className="spec-badge-professional">
                      {spec.replace('_', ' ').toUpperCase()}
                    </span>
                  )) || <span className="info-value">Not specified</span>}
                </div>
              </div>
              <div className="info-row">
                <span className="info-label">Collection Areas</span>
                <span className="info-value">{supplier.collectionAreas?.join(', ') || 'Not specified'}</span>
              </div>
            </div>
          </div>

          {/* Performance Metrics Card */}
          <div className="info-card">
            <div className="info-card-header">
              <TrendingUp size={18} />
              <h3>Performance Metrics</h3>
            </div>
            <div className="info-card-content">
              <div className="metrics-grid">
                <div className="metric-item">
                  <span className="metric-value">{supplier.performance?.reliability || 0}%</span>
                  <span className="metric-label">Reliability Score</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{supplier.performance?.qualityScore || 0}%</span>
                  <span className="metric-label">Quality Rating</span>
                </div>
                <div className="metric-item">
                  <span className="metric-value">{formatCurrency(supplier.performance?.averageRate || 0)}</span>
                  <span className="metric-label">Average Rate</span>
                </div>
              </div>
            </div>
          </div>

          {/* Purchase History Card */}
          <div className="info-card">
            <div className="info-card-header">
              <Calendar size={18} />
              <h3>Purchase History</h3>
            </div>
            <div className="info-card-content">
              <div className="info-row">
                <span className="info-label">Total Transactions</span>
                <span className="info-value">{supplier.purchaseHistory?.totalTransactions || 0}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Purchase Value</span>
                <span className="info-value">{formatCurrency(supplier.purchaseHistory?.totalValue || 0)}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Total Material Weight</span>
                <span className="info-value">{supplier.purchaseHistory?.totalWeight || 0} KG</span>
              </div>
              <div className="info-row">
                <span className="info-label">Last Purchase Date</span>
                <span className="info-value">{formatDate(supplier.purchaseHistory?.lastPurchaseDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information - Only show if available */}
        {(supplier.contractDetails || supplier.bankDetails) && (
          <div className="additional-info-section">
            {supplier.contractDetails && (
              <div className="info-card">
                <div className="info-card-header">
                  <Award size={18} />
                  <h3>Contract Information</h3>
                </div>
                <div className="info-card-content">
                  <div className="info-row">
                    <span className="info-label">Contract ID</span>
                    <span className="info-value">{supplier.contractDetails.contractId}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Contract Period</span>
                    <span className="info-value">
                      {formatDate(supplier.contractDetails.startDate)} - {formatDate(supplier.contractDetails.endDate)}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Contract Status</span>
                    <span className={`contract-status-badge ${supplier.contractDetails.status}`}>
                      {supplier.contractDetails.status.toUpperCase()}
                    </span>
                  </div>
                  {supplier.contractDetails.specialTerms && (
                    <div className="info-row">
                      <span className="info-label">Special Terms</span>
                      <span className="info-value">{supplier.contractDetails.specialTerms}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {supplier.bankDetails && (
              <div className="info-card">
                <div className="info-card-header">
                  <DollarSign size={18} />
                  <h3>Banking Information</h3>
                </div>
                <div className="info-card-content">
                  <div className="info-row">
                    <span className="info-label">Bank Name</span>
                    <span className="info-value">{supplier.bankDetails.bankName}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Account Number</span>
                    <span className="info-value">{supplier.bankDetails.accountNumber}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">IBAN</span>
                    <span className="info-value">{supplier.bankDetails.iban}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Professional Action Footer */}
        <div className="supplier-actions-footer">
          <div className="actions-left">
            <span className="last-updated">
              Last updated: {formatDate(supplier.createdAt)}
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

export default ScrapMaterialsSuppliers