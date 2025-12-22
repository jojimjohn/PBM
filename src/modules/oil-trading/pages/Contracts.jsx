import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import DatePicker from '../../../components/ui/DatePicker'
import FileUpload from '../../../components/ui/FileUpload'
import contractService from '../../../services/contractService'
import supplierService from '../../../services/supplierService'
import materialService from '../../../services/materialService'
import supplierLocationService from '../../../services/supplierLocationService'
import uploadService from '../../../services/uploadService'
import { Edit, Plus, Save, X, Eye, FileText, User, Calendar, Banknote, Settings, Check, AlertTriangle, Clock, Briefcase, Package, MapPin } from 'lucide-react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import '../styles/Contracts.css'
import '../styles/ContractForm.css'

const Contracts = () => {
  const { selectedCompany, user } = useAuth()
  const { t } = useLocalization()
  const { formatDate: systemFormatDate } = useSystemSettings()
  const { hasPermission } = usePermissions()
  const [contracts, setContracts] = useState([])
  const [contractTypes, setContractTypes] = useState({})
  const [contractStatuses, setContractStatuses] = useState({})
  const [loading, setLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showEditForm, setShowEditForm] = useState(false)
  const [selectedContract, setSelectedContract] = useState(null)
  const [suppliers, setSuppliers] = useState([])
  const [materials, setMaterials] = useState([])
  const [supplierLocations, setSupplierLocations] = useState([])
  const [editFormData, setEditFormData] = useState({})
  const [createFormData, setCreateFormData] = useState({})
  const [showViewModal, setShowViewModal] = useState(false)
  const [viewContractData, setViewContractData] = useState(null)
  
  // Soft delete state management for edit mode
  const [pendingDeletions, setPendingDeletions] = useState({
    locations: [], // locationIds to be deleted
    materials: []  // materialIds to be deleted
  })
  const [originalFormData, setOriginalFormData] = useState(null)

  useEffect(() => {
    loadContracts()
    loadSuppliersAndMaterials()
  }, [selectedCompany])

  const loadContracts = async () => {
    try {
      const response = await contractService.getAll()
      
      if (response.success) {
        // Contracts are already filtered by company in the backend service
        setContracts(response.data || [])
        // Set default contract types and statuses if not provided by API
        setContractTypes({
          'service': { name: 'Service Contract', color: '#3b82f6' },
          'supply': { name: 'Supply Contract', color: '#10b981' },
          'maintenance': { name: 'Maintenance Contract', color: '#f59e0b' },
          'collection': { name: 'Collection Contract', color: '#8b5cf6' }
        })
        
        setContractStatuses({
          'draft': { name: 'Draft', color: '#6b7280' },
          'active': { name: 'Active', color: '#10b981' },
          'expired': { name: 'Expired', color: '#ef4444' },
          'terminated': { name: 'Terminated', color: '#dc2626' },
          'pending': { name: 'Pending Approval', color: '#f59e0b' }
        })
      } else {
        console.error('Error loading contracts:', response.error)
        setContracts([])
      }
    } catch (error) {
      console.error('Error loading contracts:', error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const loadSuppliersAndMaterials = async () => {
    try {
      const [suppliersResponse, materialsResponse] = await Promise.all([
        supplierService.getAll(),
        materialService.getAll()
      ])

      if (suppliersResponse.success) {
        setSuppliers(suppliersResponse.data || [])
      }

      if (materialsResponse.success) {
        setMaterials(materialsResponse.data || [])
      }
    } catch (error) {
      console.error('Error loading suppliers and materials:', error)
    }
  }

  const loadSupplierLocations = async (supplierId) => {
    try {
      if (!supplierId) {
        setSupplierLocations([])
        return
      }

      const response = await supplierLocationService.getBySupplier(supplierId)
      
      if (response.success) {
        setSupplierLocations(response.data || [])
      } else {
        console.error('Error loading supplier locations:', response.error)
        setSupplierLocations([])
      }
    } catch (error) {
      console.error('Error loading supplier locations:', error)
      setSupplierLocations([])
    }
  }

  const initializeCreateForm = () => {
    const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
    return {
      contractNumber: '',
      supplierId: '',
      title: '',
      startDate: today,
      endDate: '',
      totalValue: 0,
      currency: 'OMR',
      terms: '',
      notes: '',
      status: 'active',
      locations: []
    }
  }

  // Open create form with auto-generated contract number
  const openCreateContractForm = async () => {
    const formData = initializeCreateForm()

    // Fetch the next contract number from backend
    try {
      const result = await contractService.getNextContractNumber()
      if (result.success && result.contractNumber) {
        formData.contractNumber = result.contractNumber
      }
    } catch (error) {
      console.warn('Could not fetch next contract number:', error)
      // Continue without pre-populated number - backend will generate on save
    }

    setCreateFormData(formData)
    setShowCreateForm(true)
  }

  const validateContractForm = (formData) => {
    const errors = []
    
    // Basic field validation
    if (!formData.supplierId) errors.push('Supplier is required')
    // Contract number is optional - auto-generated by backend if not provided
    // Title is auto-generated, so not required from user
    if (!formData.startDate) errors.push('Start date is required')
    if (!formData.endDate) errors.push('End date is required')
    
    // Location and material validation
    if (!formData.locations || formData.locations.length === 0) {
      errors.push('At least one contract location is required')
    } else {
      let hasMaterialRates = false
      formData.locations.forEach((location, locationIndex) => {
        if (!location.materials || location.materials.length === 0) {
          errors.push(`Location "${location.locationName || location.name}" must have at least one material rate defined`)
        } else {
          location.materials.forEach((material, materialIndex) => {
            const locationName = location.locationName || location.name || `Location ${locationIndex + 1}`
            
            // Check if material ID is selected (could be string or number)
            const hasValidMaterial = material.materialId && material.materialId !== '' && material.materialId !== 'undefined'
            if (!hasValidMaterial) {
              errors.push(`${locationName} row ${materialIndex + 1}: Material selection is required`)
            }
            
            // Check if unit is selected
            if (!material.unit || material.unit === '') {
              errors.push(`${locationName} row ${materialIndex + 1}: Unit is required`)
            }
            
            // Check contract rate for non-free rate types
            if (material.rateType !== 'free' && (!material.contractRate || material.contractRate <= 0)) {
              errors.push(`${locationName} row ${materialIndex + 1}: Contract rate must be greater than 0`)
            }
            
            // Count valid material rates
            if (hasValidMaterial && material.unit && material.unit !== '' && 
                (material.rateType === 'free' || (material.contractRate && material.contractRate > 0))) {
              hasMaterialRates = true
            }
          })
        }
      })
      
      if (!hasMaterialRates) {
        errors.push('At least one complete material rate (material + unit + rate) must be defined')
      }
    }
    
    return errors
  }

  const isFormValid = (formData) => {
    const errors = validateContractForm(formData)
    return errors.length === 0
  }

  // Soft delete management functions
  const clearPendingDeletions = () => {
    setPendingDeletions({ locations: [], materials: [] })
    setOriginalFormData(null)
  }

  const markLocationForDeletion = (locationId) => {
    setPendingDeletions(prev => ({
      ...prev,
      locations: [...prev.locations, locationId]
    }))
  }

  const markMaterialForDeletion = (materialId) => {
    setPendingDeletions(prev => ({
      ...prev,
      materials: [...prev.materials, materialId]
    }))
  }

  const restoreFromOriginal = () => {
    if (originalFormData) {
      setEditFormData(JSON.parse(JSON.stringify(originalFormData)))
      clearPendingDeletions()
    }
  }

  const handleCreateContract = async () => {
    try {
      setLoading(true)
      
      // Comprehensive validation
      const validationErrors = validateContractForm(createFormData)
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
        setLoading(false)
        return
      }

      // Transform data to match backend schema
      const contractData = {
        contractNumber: createFormData.contractNumber,
        supplierId: parseInt(createFormData.supplierId),
        title: createFormData.title || `Contract ${createFormData.contractNumber}`,
        startDate: createFormData.startDate,
        endDate: createFormData.endDate,
        status: createFormData.status,
        terms: createFormData.terms || '',
        notes: createFormData.notes || '',
        totalValue: parseFloat(createFormData.totalValue) || 0,
        currency: createFormData.currency,
        createdBy: user?.id || 1, // From auth context
        locations: createFormData.locations.map(location => ({
          id: location.id ? location.id.toString() : undefined,
          locationName: location.locationName || '',
          locationCode: location.locationCode || `LOC_${Date.now()}`,
          materials: location.materials.map(material => {
            const materialData = materials.find(m => m.id === parseInt(material.materialId))
            return {
              materialId: parseInt(material.materialId),
              rateType: material.rateType || 'fixed_rate',
              contractRate: parseFloat(material.contractRate) || 0,
              discountPercentage: parseFloat(material.discountPercentage) || 0,
              minimumPrice: parseFloat(material.minimumPrice) || 0,
              paymentDirection: material.paymentDirection || 'we_receive',
              unit: material.unit || materialData?.unit || 'kg',
              minimumQuantity: parseFloat(material.minimumQuantity) || 0,
              maximumQuantity: parseFloat(material.maximumQuantity) || 0,
              description: material.description || ''
            }
          })
        }))
      }
      
      const response = await contractService.create(contractData)
      
      if (response.success) {
        setContracts(prev => [response.data, ...prev])
        setShowCreateForm(false)
        setCreateFormData(initializeCreateForm())
        alert(t('contractCreated', 'Contract created successfully!'))
      } else {
        console.error('Error creating contract:', response.error)
        alert(t('errorCreating', 'Error creating contract'))
      }
    } catch (error) {
      console.error('Error creating contract:', error)
      alert(t('errorCreating', 'Error creating contract'))
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateContract = async () => {
    try {
      setLoading(true)
      
      // Comprehensive validation for update
      const validationErrors = validateContractForm(editFormData)
      if (validationErrors.length > 0) {
        alert('Please fix the following errors:\n\n' + validationErrors.join('\n'))
        setLoading(false)
        return
      }
      
      // Ensure title is auto-generated if empty
      const updateData = {
        ...editFormData,
        title: editFormData.title || `Contract ${editFormData.contractNumber}`
      }
      
      const response = await contractService.update(selectedContract.id, updateData)
      
      if (response.success) {
        setContracts(prev => prev.map(c => c.id === selectedContract.id ? response.data : c))
        setShowEditForm(false)
        setSelectedContract(null)
        // Clear any pending deletions
        clearPendingDeletions()
        alert(t('contractUpdated', 'Contract updated successfully!'))
      } else {
        console.error('Error updating contract:', response.error)
        alert(t('errorUpdating', 'Error updating contract'))
      }
    } catch (error) {
      console.error('Error updating contract:', error)
      alert(t('errorUpdating', 'Error updating contract'))
    } finally {
      setLoading(false)
    }
  }

  const handleEditContract = async (contractId) => {
    try {
      setLoading(true)
      const response = await contractService.getById(contractId)
      
      if (response.success) {
        const contract = response.data
        
        // Store original data for rollback capability
        setOriginalFormData(JSON.parse(JSON.stringify(contract)))
        clearPendingDeletions()
        
        // Transform contract data to form format
        // Group rates by location
        const locationsMap = {}
        if (contract.rates && contract.rates.length > 0) {
          contract.rates.forEach(rate => {
            const locationKey = rate.locationId
            if (!locationsMap[locationKey]) {
              locationsMap[locationKey] = {
                id: rate.locationId,
                name: rate.locationName,
                locationCode: rate.locationCode,
                materials: []
              }
            }
            locationsMap[locationKey].materials.push({
              materialId: rate.materialId,
              materialName: rate.materialName,
              rateType: rate.rateType || 'fixed_rate',
              contractRate: rate.contractRate || 0,
              discountPercentage: rate.discountPercentage || 0,
              minimumPrice: rate.minimumPrice || 0,
              paymentDirection: rate.paymentDirection || 'we_receive',
              unit: rate.unit || 'liters',
              minimumQuantity: rate.minimumQuantity || 0,
              maximumQuantity: rate.maximumQuantity || 0,
              description: rate.description || '',
              locationCode: rate.locationCode
            })
          })
        }

        const formData = {
          contractNumber: contract.contractNumber || '',
          supplierId: contract.supplierId || '',
          title: contract.title || '',
          startDate: contract.startDate ? contract.startDate.split('T')[0] : '',
          endDate: contract.endDate ? contract.endDate.split('T')[0] : '', 
          status: contract.status || 'active',
          terms: contract.terms || '',
          locations: Object.values(locationsMap).map(location => ({
            id: String(location.id),
            locationName: location.name,
            locationCode: location.locationCode || 'LOC-' + location.id,
            materials: (location.materials || []).map(material => ({
              materialId: material.materialId,
              rateType: material.rateType,
              contractRate: material.contractRate,
              discountPercentage: material.discountPercentage || 0,
              minimumPrice: material.minimumPrice || 0,
              paymentDirection: material.paymentDirection || 'we_receive',
              unit: material.unit || 'liters',
              minimumQuantity: material.minimumQuantity || 0,
              maximumQuantity: material.maximumQuantity || 0,
              description: material.description || ''
            }))
          }))
        }
        
        setEditFormData(formData)
        // Load supplier locations for the contract's supplier
        if (contract.supplierId) {
          await loadSupplierLocations(contract.supplierId)
        }
        setShowEditForm(true)
      } else {
        console.error('Error fetching contract:', response.error)
        alert(t('errorFetching', 'Error fetching contract details'))
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert(t('errorFetching', 'Error fetching contract details'))
    } finally {
      setLoading(false)
    }
  }

  const handleViewContract = async (contractId) => {
    try {
      setLoading(true)
      const response = await contractService.getById(contractId)
      
      if (response.success) {
        const contract = response.data
        
        // Transform contract data to view format  
        // Group rates by location
        const locationsMap = {}
        if (contract.rates && contract.rates.length > 0) {
          contract.rates.forEach(rate => {
            const locationKey = rate.locationId
            if (!locationsMap[locationKey]) {
              locationsMap[locationKey] = {
                id: rate.locationId,
                name: rate.locationName,
                locationCode: rate.locationCode,
                materials: []
              }
            }
            locationsMap[locationKey].materials.push({
              materialId: rate.materialId,
              materialName: rate.materialName,
              rateType: rate.rateType || 'fixed_rate',
              contractRate: rate.contractRate || 0,
              discountPercentage: rate.discountPercentage || 0,
              minimumPrice: rate.minimumPrice || 0,
              paymentDirection: rate.paymentDirection || 'we_receive',
              unit: rate.unit || 'liters',
              minimumQuantity: rate.minimumQuantity || 0,
              maximumQuantity: rate.maximumQuantity || 0,
              description: rate.description || '',
              locationCode: rate.locationCode
            })
          })
        }

        const contractData = {
          ...contract,
          locations: Object.values(locationsMap),
          formattedStartDate: contract.startDate ? formatDate(contract.startDate) : 'N/A',
          formattedEndDate: contract.endDate ? formatDate(contract.endDate) : 'N/A'
        }
        
        setViewContractData(contractData)
        setShowViewModal(true)
      } else {
        console.error('Error fetching contract:', response.error)
        alert(t('errorFetching', 'Error fetching contract details'))
      }
    } catch (error) {
      console.error('Error fetching contract:', error)
      alert(t('errorFetching', 'Error fetching contract details'))
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteContract = async (contractId) => {
    if (!confirm(t('confirmDelete', 'Are you sure you want to delete this contract?'))) {
      return
    }

    try {
      const response = await contractService.delete(contractId)
      
      if (response.success) {
        setContracts(prev => prev.filter(c => c.id !== contractId))
        alert(t('contractDeleted', 'Contract deleted successfully!'))
      } else {
        console.error('Error deleting contract:', response.error)
        alert(t('errorDeleting', 'Error deleting contract'))
      }
    } catch (error) {
      console.error('Error deleting contract:', error)
      alert(t('errorDeleting', 'Error deleting contract'))
    }
  }

  const formatCurrency = (amount) => {
    const numAmount = parseFloat(amount) || 0
    return `OMR ${numAmount.toFixed(2)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return systemFormatDate ? systemFormatDate(dateString) : new Date(dateString).toLocaleDateString('en-GB')
  }

  const getContractStatusInfo = (status) => {
    return contractStatuses[status] || { name: status, color: '#6b7280' }
  }

  const getContractTypeInfo = (type) => {
    return contractTypes[type] || { name: type, color: '#6b7280' }
  }

  // Remove early return - let DataTable handle loading state with skeleton

  // Define table columns for contracts
  const contractColumns = [
    {
      key: 'id',
      header: t('contractId'),
      sortable: true,
      render: (value) => (
        <div className="contract-id">
          <strong>{value}</strong>
        </div>
      )
    },
    {
      key: 'supplierName',
      header: t('supplier'),
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const supplier = suppliers.find(s => s.id === row.supplierId)
        return (
          <div className="supplier-info">
            <User size={14} />
            <span>{supplier?.name || 'Unknown Supplier'}</span>
          </div>
        )
      }
    },
    {
      key: 'title',
      header: t('contractTitle'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="contract-title">
          <strong>{value}</strong>
        </div>
      )
    },
    {
      key: 'contractType',
      header: t('type'),
      sortable: true,
      filterable: true,
      render: (value) => {
        const typeInfo = getContractTypeInfo(value)
        return (
          <span 
            className="contract-type-badge"
            style={{ backgroundColor: typeInfo.color }}
          >
            {typeInfo.name}
          </span>
        )
      }
    },
    {
      key: 'startDate',
      header: t('startDate'),
      type: 'date',
      sortable: true,
      width: '120px'
    },
    {
      key: 'endDate',
      header: t('endDate'),
      type: 'date',
      sortable: true,
      width: '120px',
      render: (value, row) => {
        const endDate = new Date(value)
        const today = new Date()
        const isExpiringSoon = (endDate - today) / (1000 * 60 * 60 * 24) <= 30 && endDate > today
        const isExpired = endDate < today

        return (
          <div className={`date-cell ${isExpired ? 'expired' : isExpiringSoon ? 'expiring' : ''}`}>
            <span>{formatDate(value)}</span>
            {isExpired && <span className="status-indicator expired">Expired</span>}
            {isExpiringSoon && <span className="status-indicator expiring">Expiring Soon</span>}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value) => {
        const statusInfo = getContractStatusInfo(value)
        return (
          <span 
            className="contract-status-badge"
            style={{ backgroundColor: statusInfo.color }}
          >
            {statusInfo.name}
          </span>
        )
      }
    },
    {
      key: 'totalValue',
      header: t('totalValue'),
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (value, row) => formatCurrency(row.totalValue || 0)
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      width: '150px',
      render: (value, row) => (
        <div className="table-actions">
          <PermissionGate permission={PERMISSIONS.VIEW_CONTRACTS}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={async () => {
                setSelectedContract(row)
                await handleViewContract(row.id)
              }}
              title={t('viewDetails')}
            >
              <Eye size={14} />
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={async () => {
                setSelectedContract(row)
                await handleEditContract(row.id)
              }}
              title={t('edit')}
            >
              <Edit size={14} />
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
            <button 
              className="btn btn-outline btn-sm btn-danger" 
              onClick={() => handleDeleteContract(row.id)}
              title={t('delete')}
            >
              <X size={14} />
            </button>
          </PermissionGate>
        </div>
      )
    }
  ]

  return (
    <div className="contracts-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>{t('contractManagement')}</h1>
          <p>{t('manageContracts', 'Manage oil trading contracts with suppliers')}</p>
        </div>
        
        <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
          <div className="page-actions">
            <button
              className="btn btn-primary"
              onClick={openCreateContractForm}
            >
              <Plus size={20} />
              {t('newContract')}
            </button>
          </div>
        </PermissionGate>
      </div>

      {/* Contract Summary Cards */}
      <div className="contracts-summary">
        <div className="summary-card">
          <div className="summary-icon">
            <FileText size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">{contracts.length}</p>
            <p className="summary-label">{t('totalContracts', 'Total Contracts')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon success">
            <Check size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">{contracts.filter(c => c.status === 'active').length}</p>
            <p className="summary-label">{t('activeContracts', 'Active Contracts')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon warning">
            <Clock size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">
              {contracts.filter(c => {
                const endDate = new Date(c.endDate)
                const today = new Date()
                return (endDate - today) / (1000 * 60 * 60 * 24) <= 30 && endDate > today
              }).length}
            </p>
            <p className="summary-label">{t('expiringSoon', 'Expiring Soon')}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon profit">
            <Banknote size={24} />
          </div>
          <div className="summary-info">
            <p className="summary-value">
              {formatCurrency(contracts.reduce((sum, c) => sum + (c.totalValue || 0), 0))}
            </p>
            <p className="summary-label">{t('totalValue', 'Total Value')}</p>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="contracts-table-container">
        <DataTable
          data={contracts}
          columns={contractColumns}
          title={t('contractManagement', 'Contract Management')}
          subtitle={t('contractSubtitle', 'Manage contracts with oil suppliers')}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noContractsFound', 'No contracts found')}
          className="contracts-table"
          initialPageSize={10}
          stickyHeader={true}
          enableColumnToggle={true}
        />
      </div>

      {/* Create Contract Modal */}
      {showCreateForm && (
        <ContractFormModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={handleCreateContract}
          title={t('createContract', 'Create New Contract')}
          formData={createFormData}
          setFormData={setCreateFormData}
          suppliers={suppliers}
          materials={materials}
          supplierLocations={supplierLocations}
          loadSupplierLocations={loadSupplierLocations}
          contractTypes={contractTypes}
          isEdit={false}
          loading={loading}
          t={t}
          // Enhanced validation props
          validateForm={validateContractForm}
          isFormValid={isFormValid}
          clearPendingDeletions={clearPendingDeletions}
        />
      )}

      {/* Edit Contract Modal */}
      {showEditForm && selectedContract && (
        <ContractFormModal
          isOpen={showEditForm}
          onClose={() => {
            // Enhanced close with rollback protection
            if (originalFormData) {
              const hasChanges = JSON.stringify(editFormData) !== JSON.stringify(originalFormData)
              if (hasChanges) {
                const confirmClose = window.confirm(
                  'You have unsaved changes. Are you sure you want to close?\n\n' +
                  'Note: Any modifications will be lost and original data will be restored.'
                )
                if (!confirmClose) return
              }
            }
            
            setShowEditForm(false)
            setSelectedContract(null)
            clearPendingDeletions()
          }}
          onSave={handleUpdateContract}
          title={t('editContract', 'Edit Contract')}
          formData={editFormData}
          setFormData={setEditFormData}
          suppliers={suppliers}
          materials={materials}
          supplierLocations={supplierLocations}
          loadSupplierLocations={loadSupplierLocations}
          contractTypes={contractTypes}
          isEdit={true}
          loading={loading}
          t={t}
          // Enhanced validation props
          validateForm={validateContractForm}
          isFormValid={isFormValid}
          clearPendingDeletions={clearPendingDeletions}
          originalFormData={originalFormData}
          restoreFromOriginal={restoreFromOriginal}
        />
      )}

      {showViewModal && viewContractData && (
        <ContractViewModal
          isOpen={showViewModal}
          onClose={() => {
            setShowViewModal(false)
            setViewContractData(null)
          }}
          contractData={viewContractData}
          onEdit={() => {
            setShowViewModal(false)
            setSelectedContract(viewContractData)
            setEditFormData({
              contractNumber: viewContractData.contractNumber || '',
              supplierId: viewContractData.supplierId || '',
              title: viewContractData.title || '',
              startDate: viewContractData.startDate ? viewContractData.startDate.split('T')[0] : '',
              endDate: viewContractData.endDate ? viewContractData.endDate.split('T')[0] : '', 
              status: viewContractData.status || 'active',
              totalValue: viewContractData.totalValue || 0,
              currency: viewContractData.currency || 'OMR',
              terms: viewContractData.terms || '',
              notes: viewContractData.notes || '',
              locations: (viewContractData.locations || []).map(location => ({
                id: String(location.id),
                locationName: location.name,
                locationCode: location.locationCode || 'LOC-' + location.id,
                materials: (location.materials || []).map(material => ({
                  materialId: material.materialId,
                  rateType: material.rateType,
                  contractRate: material.contractRate,
                  discountPercentage: material.discountPercentage || 0,
                  minimumPrice: material.minimumPrice || 0,
                  paymentDirection: material.paymentDirection || 'we_receive',
                  unit: material.unit || 'liters',
                  minimumQuantity: material.minimumQuantity || 0,
                  maximumQuantity: material.maximumQuantity || 0,
                  description: material.description || ''
                }))
              }))
            })
            // Load supplier locations for the contract's supplier
            if (viewContractData.supplierId) {
              loadSupplierLocations(viewContractData.supplierId)
            }
            setShowEditForm(true)
          }}
          formatCurrency={formatCurrency}
          getContractStatusInfo={getContractStatusInfo}
          t={t}
        />
      )}
    </div>
  )
}

// Contract View Modal Component
const ContractViewModal = ({ 
  isOpen, 
  onClose, 
  contractData,
  onEdit,
  formatCurrency,
  getContractStatusInfo,
  t 
}) => {
  if (!contractData) return null

  const statusInfo = getContractStatusInfo(contractData.status)

  return (
    <Modal
      isOpen={isOpen}
      title={`${contractData.contractNumber} - ${t('contractDetails', 'Contract Details')}`}
      onClose={onClose}
      className="modal-xl contract-details-modal"
      closeOnOverlayClick={false}
    >
      <div className="supplier-view-professional">
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ 
            width: '48px', 
            height: '48px', 
            borderRadius: '12px', 
            backgroundColor: '#3b82f6', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            <FileText size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: '600', margin: '0 0 4px 0', color: '#1f2937' }}>
              {contractData.title}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span 
                style={{
                  padding: '4px 12px',
                  backgroundColor: statusInfo.color || '#10b981',
                  color: 'white',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                {statusInfo.name || contractData.status}
              </span>
            </div>
          </div>
        </div>

        {/* Contract Expiry Alert */}
        {(() => {
          const today = new Date();
          const endDate = new Date(contractData.endDate);
          const daysUntilExpiry = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          
          if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
            return (
              <div style={{
                padding: '12px 16px',
                backgroundColor: daysUntilExpiry <= 7 ? '#fef2f2' : '#fefbf2',
                border: `1px solid ${daysUntilExpiry <= 7 ? '#fecaca' : '#fed7aa'}`,
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle 
                  size={16} 
                  color={daysUntilExpiry <= 7 ? '#dc2626' : '#d97706'} 
                />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: daysUntilExpiry <= 7 ? '#dc2626' : '#d97706'
                }}>
                  {daysUntilExpiry <= 7 
                    ? `⚠️ Contract expires in ${daysUntilExpiry} day${daysUntilExpiry === 1 ? '' : 's'}!`
                    : `📅 Contract expires in ${daysUntilExpiry} days`
                  }
                </span>
              </div>
            );
          } else if (daysUntilExpiry <= 0) {
            return (
              <div style={{
                padding: '12px 16px',
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                marginBottom: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <AlertTriangle size={16} color="#dc2626" />
                <span style={{
                  fontSize: '14px',
                  fontWeight: '500',
                  color: '#dc2626'
                }}>
                  🚨 Contract has expired {Math.abs(daysUntilExpiry)} day{Math.abs(daysUntilExpiry) === 1 ? '' : 's'} ago!
                </span>
              </div>
            );
          }
          return null;
        })()}

        {/* Information Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '24px' }}>
          {/* Contract Information Card */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <FileText size={18} style={{ marginRight: '8px', color: '#6b7280' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>
                {t('contractInformation', 'Contract Information')}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{t('contractNumber', 'Contract Number')}</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{contractData.contractNumber}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Title</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{contractData.title}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{t('supplier', 'Supplier')}</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{contractData.supplierName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>Total Value</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{formatCurrency(contractData.totalValue || 0)}</span>
              </div>
            </div>
          </div>

          {/* Contract Period Card */}
          <div style={{
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Calendar size={18} style={{ marginRight: '8px', color: '#6b7280' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>
                {t('contractPeriod', 'Contract Period')}
              </h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{t('startDate', 'Start Date')}</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{contractData.formattedStartDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{t('endDate', 'End Date')}</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>{contractData.formattedEndDate}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#6b7280', fontSize: '14px' }}>{t('duration', 'Duration')}</span>
                <span style={{ fontWeight: '500', color: '#1f2937' }}>
                  {(() => {
                    const start = new Date(contractData.startDate)
                    const end = new Date(contractData.endDate)
                    const diffTime = Math.abs(end - start)
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
                    return `${diffDays} ${t('days', 'days')}`
                  })()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Contract Terms Card */}
        {contractData.terms && (
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Settings size={18} style={{ marginRight: '8px', color: '#6b7280' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>
                {t('terms', 'Terms & Conditions')}
              </h3>
            </div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              {contractData.terms}
            </div>
          </div>
        )}

        {/* Contract Notes Card */}
        {contractData.notes && (
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <FileText size={18} style={{ marginRight: '8px', color: '#6b7280' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>
                {t('notes', 'Notes')}
              </h3>
            </div>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f9fafb', 
              borderRadius: '8px',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              {contractData.notes}
            </div>
          </div>
        )}

        {/* Location-Material Rates Card */}
        {contractData.locations && contractData.locations.length > 0 && (
          <div style={{ 
            marginBottom: '24px',
            padding: '20px',
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '8px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px' }}>
              <Package size={18} style={{ marginRight: '8px', color: '#6b7280' }} />
              <h3 style={{ fontSize: '16px', fontWeight: '600', margin: 0, color: '#374151' }}>
                {t('locationMaterialRates', 'Location & Material Rates')}
              </h3>
            </div>
            {contractData.locations.map((location, locationIndex) => (
              <div key={locationIndex} style={{ marginBottom: '20px' }}>
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  marginBottom: '12px',
                  padding: '8px 12px',
                  backgroundColor: '#f3f4f6',
                  borderRadius: '6px'
                }}>
                  <MapPin size={16} style={{ marginRight: '8px', color: '#6b7280' }} />
                  <span style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    {location.name}
                  </span>
                </div>
                {location.materials && location.materials.length > 0 && (
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ 
                      width: '100%', 
                      borderCollapse: 'collapse',
                      fontSize: '14px'
                    }}>
                      <thead>
                        <tr style={{ backgroundColor: '#f9fafb' }}>
                          <th style={{ 
                            padding: '8px 12px', 
                            textAlign: 'left', 
                            fontWeight: '500',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            {t('material', 'Material')}
                          </th>
                          <th style={{ 
                            padding: '8px 12px', 
                            textAlign: 'left', 
                            fontWeight: '500',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            {t('unit', 'Unit')}
                          </th>
                          <th style={{ 
                            padding: '8px 12px', 
                            textAlign: 'left', 
                            fontWeight: '500',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            {t('rateType', 'Rate Type')}
                          </th>
                          <th style={{ 
                            padding: '8px 12px', 
                            textAlign: 'right', 
                            fontWeight: '500',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            {t('contractRate', 'Contract Rate')}
                          </th>
                          <th style={{ 
                            padding: '8px 12px', 
                            textAlign: 'center', 
                            fontWeight: '500',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            {t('minQty', 'Min Qty')}
                          </th>
                          <th style={{ 
                            padding: '8px 12px', 
                            textAlign: 'center', 
                            fontWeight: '500',
                            color: '#6b7280',
                            borderBottom: '1px solid #e5e7eb'
                          }}>
                            {t('maxQty', 'Max Qty')}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {location.materials.map((material, materialIndex) => (
                          <tr key={materialIndex}>
                            <td style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb',
                              color: '#1f2937'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center' }}>
                                <Package size={14} style={{ marginRight: '8px', color: '#6b7280' }} />
                                <span>{material.materialName}</span>
                              </div>
                            </td>
                            <td style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb',
                              color: '#374151'
                            }}>
                              {material.unit || 'liters'}
                            </td>
                            <td style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb'
                            }}>
                              <span style={{
                                padding: '2px 8px',
                                backgroundColor: '#e0f2fe',
                                color: '#0369a1',
                                borderRadius: '4px',
                                fontSize: '12px',
                                fontWeight: '500'
                              }}>
                                {material.rateType === 'fixed_rate' && t('fixedRate', 'Fixed Rate')}
                                {material.rateType === 'discount_percentage' && t('discountPercentage', 'Discount %')}
                                {material.rateType === 'minimum_price_guarantee' && t('minimumPriceGuarantee', 'Min. Price')}
                                {material.rateType === 'free' && t('free', 'Free')}
                                {material.rateType === 'we_pay' && t('wePay', 'We Pay')}
                              </span>
                            </td>
                            <td style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb',
                              textAlign: 'right'
                            }}>
                              {material.rateType === 'free' ? (
                                <span style={{ color: '#10b981', fontWeight: '500' }}>
                                  {t('free', 'Free')}
                                </span>
                              ) : (
                                <span style={{ fontWeight: '500', color: '#1f2937' }}>
                                  {formatCurrency(material.contractRate)}
                                </span>
                              )}
                            </td>
                            <td style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb',
                              textAlign: 'center',
                              color: '#374151'
                            }}>
                              {material.minimumQuantity || 0}
                            </td>
                            <td style={{ 
                              padding: '8px 12px', 
                              borderBottom: '1px solid #e5e7eb',
                              textAlign: 'center',
                              color: '#374151'
                            }}>
                              {material.maximumQuantity || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Modal Footer with Action Buttons */}
        <div style={{ 
          marginTop: '32px', 
          paddingTop: '24px', 
          borderTop: '1px solid #e5e7eb',
          display: 'flex', 
          gap: '12px', 
          justifyContent: 'flex-end' 
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#f9fafb',
              color: '#374151'
            }}
          >
            {t('close', 'Close')}
          </button>
          <button 
            type="button" 
            className="btn btn-primary" 
            onClick={onEdit}
            style={{
              padding: '8px 16px',
              fontSize: '14px',
              fontWeight: '500',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Edit size={16} />
            {t('editContract', 'Edit Contract')}
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Contract Form Modal Component (Enhanced with validation)
const ContractFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  formData, 
  setFormData, 
  suppliers,
  materials,
  supplierLocations,
  loadSupplierLocations,
  contractTypes,
  isEdit, 
  loading,
  t,
  // Enhanced validation props
  validateForm,
  isFormValid,
  originalFormData,
  restoreFromOriginal,
  clearPendingDeletions
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave()
  }

  const addLocation = (supplierLocationId) => {
    // Convert to number for comparison since IDs might be strings from select value
    const locationId = parseInt(supplierLocationId)
    const supplierLocation = supplierLocations.find(loc => parseInt(loc.id) === locationId)
    
    if (!supplierLocation) {
      return
    }

    // Check if location already added
    const alreadyAdded = formData.locations.some(loc => parseInt(loc.id) === locationId)
    if (alreadyAdded) {
      alert('This location is already added to the contract')
      return
    }

    const newLocation = {
      id: supplierLocation.id,
      locationName: supplierLocation.locationName,
      locationCode: supplierLocation.locationCode,
      address: supplierLocation.address,
      contactPerson: supplierLocation.contactPerson,
      contactPhone: supplierLocation.contactPhone,
      materials: []
    }
    
    setFormData(prev => {
      const newLocations = [...(prev.locations || []), newLocation]
      const newLocationIndex = newLocations.length - 1
      
      // Create a material row for the new location
      const newMaterial = {
        id: `mat_${Date.now()}`,
        materialId: '',
        rateType: 'fixed_rate',
        contractRate: 0,
        discountPercentage: 0,
        minimumPrice: 0,
        paymentDirection: 'we_receive',
        unit: '',
        minQuantity: '',
        maxQuantity: '',
        description: ''
      }
      
      // Add the material to the new location
      newLocations[newLocationIndex].materials = [newMaterial]
      
      return {
        ...prev,
        locations: newLocations
      }
    })
  }

  const removeLocation = (locationIndex) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.filter((_, index) => index !== locationIndex)
    }))
  }

  const updateLocation = (locationIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, index) => 
        index === locationIndex 
          ? { ...location, [field]: value }
          : location
      )
    }))
  }

  const addMaterialToLocation = (locationIndex) => {
    const newMaterial = {
      id: `mat_${Date.now()}`,
      materialId: '',
      materialName: '',
      materialType: '',
      rateType: 'fixed_rate',
      contractRate: '',
      discountPercentage: 0,
      minimumPrice: 0,
      paymentDirection: 'we_receive',
      currency: 'OMR',
      unit: '',
      minimumQuantity: '',
      maximumQuantity: '',
      description: '',
      isActive: true
    }
    
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, index) => 
        index === locationIndex 
          ? { 
              ...location, 
              materials: [...(location.materials || []), newMaterial]
            }
          : location
      )
    }))
  }

  const removeMaterialFromLocation = (locationIndex, materialIndex) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, index) => 
        index === locationIndex 
          ? { 
              ...location, 
              materials: location.materials.filter((_, mIndex) => mIndex !== materialIndex)
            }
          : location
      )
    }))
  }

  const updateLocationMaterial = (locationIndex, materialIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      locations: prev.locations.map((location, locIndex) => 
        locIndex === locationIndex 
          ? {
              ...location,
              materials: location.materials.map((material, matIndex) => 
                matIndex === materialIndex 
                  ? { ...material, [field]: value }
                  : material
              )
            }
          : location
      )
    }))
  }

  return (
    <Modal
      isOpen={isOpen}
      title={title}
      onClose={onClose}
      className="modal-xl"
      closeOnOverlayClick={false}
    >
      <form className="contract-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <div className="form-section-title">
            <FileText size={20} />
            Contract Information
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Contract Number</label>
              <input
                type="text"
                value={formData.contractNumber || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contractNumber: e.target.value }))}
                placeholder="Auto-generated (e.g., CT-202512-001)"
              />
              <small style={{ color: '#6b7280', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                {formData.contractNumber ? 'Auto-generated • Edit if needed' : 'Will be auto-generated on save'}
              </small>
            </div>


            <div className="form-group">
              <label>Supplier *</label>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => {
                  const selectedSupplier = suppliers.find(s => s.id === e.target.value)
                  setFormData(prev => ({ 
                    ...prev, 
                    supplierId: e.target.value,
                    supplierName: selectedSupplier ? selectedSupplier.name : '',
                    locations: [] // Reset locations when supplier changes
                  }))
                  loadSupplierLocations(e.target.value) // Load locations for selected supplier
                }}
                required
              >
                <option value="">Select Supplier</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Contract Type</label>
              <select
                value={formData.contractType || 'oil_supply'}
                onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
              >
                <option value="oil_supply">Oil Supply</option>
                <option value="waste_management">Waste Management</option>
                <option value="scrap_collection">Scrap Collection</option>
                <option value="material_supply">Material Supply</option>
              </select>
            </div>

            <div className="form-group">
              <DatePicker
                label={`${t('startDate')} *`}
                value={formData.startDate ? new Date(formData.startDate) : null}
                onChange={(date) => {
                  const dateStr = date ? date.toISOString().split('T')[0] : ''
                  setFormData(prev => ({ ...prev, startDate: dateStr }))
                }}
                required
              />
            </div>

            <div className="form-group">
              <DatePicker
                label={`${t('endDate')} *`}
                value={formData.endDate ? new Date(formData.endDate) : null}
                onChange={(date) => {
                  const dateStr = date ? date.toISOString().split('T')[0] : ''
                  setFormData(prev => ({ ...prev, endDate: dateStr }))
                }}
                minDate={formData.startDate ? new Date(formData.startDate) : null}
                required
              />
            </div>

            <div className="form-group">
              <label>Total Value</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.totalValue || 0}
                onChange={(e) => setFormData(prev => ({ ...prev, totalValue: parseFloat(e.target.value) || 0 }))}
                placeholder="0.000"
              />
            </div>

            <div className="form-group">
              <label>Notes</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Contract notes"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Terms</label>
              <textarea
                value={formData.terms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, terms: e.target.value }))}
                placeholder="Terms and conditions"
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Contract Locations with Materials */}
        <div className="form-section">
          <div className="form-section-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <MapPin size={20} />
                Contract Locations & Materials
                <span style={{ color: '#ef4444', fontWeight: 'bold' }}>*</span>
              </div>
              <span className="section-subtitle">Select supplier locations and define material rates</span>
            </div>
            {/* Validation Status Indicator */}
            {formData.locations && formData.locations.length > 0 && 
             formData.locations.some(loc => loc.materials && loc.materials.length > 0 && 
                                           loc.materials.some(mat => mat.materialId && mat.unit)) ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#10b981', 
                fontSize: '14px',
                fontWeight: '500',
                padding: '4px 8px',
                backgroundColor: '#f0fdf4',
                borderRadius: '6px',
                border: '1px solid #bbf7d0'
              }}>
                <Check size={16} />
                Valid
              </div>
            ) : (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px', 
                color: '#ef4444', 
                fontSize: '14px',
                fontWeight: '500',
                padding: '4px 8px',
                backgroundColor: '#fef2f2',
                borderRadius: '6px',
                border: '1px solid #fecaca'
              }}>
                <AlertTriangle size={16} />
                Required
              </div>
            )}
          </div>

          {/* Add Location Button */}
          {formData.supplierId && supplierLocations.length > 0 && (
            <div className="add-location-section">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addLocation(e.target.value)
                    e.target.value = ''
                  }
                }}
                className="location-selector-dropdown"
              >
                <option value="">+ Add Location to Contract</option>
                {supplierLocations
                  .filter(loc => !formData.locations.some(selected => parseInt(selected.id) === parseInt(loc.id)))
                  .map(location => (
                    <option key={location.id} value={location.id}>
                      {location.locationName} ({location.locationCode}) - {location.address}
                    </option>
                  ))
                }
              </select>
            </div>
          )}

          {/* No Supplier Selected */}
          {!formData.supplierId && (
            <div className="empty-state">
              <p>Please select a supplier first to see available locations.</p>
            </div>
          )}

          {/* No Locations Available */}
          {formData.supplierId && supplierLocations.length === 0 && (
            <div className="empty-state">
              <p>No locations found for this supplier. Please add locations in the Supplier Locations module first.</p>
            </div>
          )}

          {/* Selected Locations */}
          <div className="selected-locations">
            {(formData.locations || []).map((location, locationIndex) => (
              <div key={location.id || locationIndex} className="location-card">
                <div className="location-card-header">
                  <div className="location-info">
                    <h4 className="location-name">
                      <MapPin size={16} />
                      {location.locationName} ({location.locationCode})
                    </h4>
                    <p className="location-details">
                      {location.address} • {location.contactPerson} - {location.contactPhone}
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeLocation(locationIndex)}
                    className="remove-location-btn"
                    title="Remove Location"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Materials Table */}
                <div className="materials-table-section">
                  <div className="materials-table-header">
                    <h5>Materials & Rates</h5>
                    <button 
                      type="button"
                      onClick={() => addMaterialToLocation(locationIndex)}
                      className="add-material-btn-table"
                    >
                      <Plus size={14} />
                      Add Row
                    </button>
                  </div>

                  <div className="materials-table-container">
                    <table className="materials-table">
                      <thead>
                        <tr>
                          <th>Material</th>
                          <th>Unit</th>
                          <th>Rate Type</th>
                          <th>Rate</th>
                          <th>Currency</th>
                          <th>Min Qty</th>
                          <th>Max Qty</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(location.materials || []).length === 0 ? (
                          <tr className="empty-row">
                            <td colSpan="8" className="empty-message">
                              No materials added. Click "Add Row" to define rates for this location.
                            </td>
                          </tr>
                        ) : (
                          (location.materials || []).map((material, materialIndex) => (
                            <tr key={material.id || materialIndex} className="material-row">
                              <td className="material-cell">
                                <select
                                  value={material.materialId || ''}
                                  onChange={(e) => {
                                    const selectedMaterial = materials.find(m => String(m.id) === String(e.target.value))
                                    if (selectedMaterial) {
                                      updateLocationMaterial(locationIndex, materialIndex, 'materialId', selectedMaterial.id)
                                      updateLocationMaterial(locationIndex, materialIndex, 'materialName', selectedMaterial.name)
                                      updateLocationMaterial(locationIndex, materialIndex, 'materialType', selectedMaterial.category)
                                      updateLocationMaterial(locationIndex, materialIndex, 'unit', selectedMaterial.unit)
                                    }
                                  }}
                                  className="table-select"
                                  required
                                >
                                  <option value="">Select Material</option>
                                  {materials.map(mat => (
                                    <option key={mat.id} value={mat.id}>
                                      {mat.name}
                                    </option>
                                  ))}
                                </select>
                              </td>
                              
                              <td className="unit-cell">
                                <select
                                  value={material.unit || ''}
                                  onChange={(e) => updateLocationMaterial(locationIndex, materialIndex, 'unit', e.target.value)}
                                  className="table-select-small"
                                >
                                  <option value="">Unit</option>
                                  <option value="liters">Liters</option>
                                  <option value="drums">Drums</option>
                                  <option value="tons">Tons</option>
                                  <option value="kg">Kg</option>
                                  <option value="pieces">Pieces</option>
                                  <option value="cubic_meters">m³</option>
                                </select>
                              </td>
                              
                              <td className="rate-type-cell">
                                <select
                                  value={material.rateType || 'fixed_rate'}
                                  onChange={(e) => {
                                    updateLocationMaterial(locationIndex, materialIndex, 'rateType', e.target.value)
                                    // Auto-set rate to 0 for free type
                                    if (e.target.value === 'free') {
                                      updateLocationMaterial(locationIndex, materialIndex, 'contractRate', 0)
                                    }
                                  }}
                                  className="table-select-small"
                                >
                                  <option value="fixed_rate">Fixed Rate</option>
                                  <option value="discount_percentage">Discount %</option>
                                  <option value="minimum_price_guarantee">Min Price</option>
                                  <option value="free">Free</option>
                                  <option value="we_pay">We Pay</option>
                                </select>
                              </td>
                              
                              <td className="rate-cell">
                                <input
                                  type="number"
                                  step="0.001"
                                  min="0"
                                  value={material.rateType === 'free' ? '0.000' : (material.contractRate || '')}
                                  onChange={(e) => updateLocationMaterial(locationIndex, materialIndex, 'contractRate', parseFloat(e.target.value) || 0)}
                                  placeholder="0.000"
                                  className="table-input-number"
                                  disabled={material.rateType === 'free'}
                                  style={{
                                    backgroundColor: material.rateType === 'free' ? '#f3f4f6' : 'white',
                                    cursor: material.rateType === 'free' ? 'not-allowed' : 'text'
                                  }}
                                />
                              </td>
                              
                              <td className="currency-cell">
                                <span className="currency-display">OMR</span>
                                <input type="hidden" value="OMR" />
                              </td>
                              
                              <td className="min-qty-cell">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={material.minimumQuantity || ''}
                                  onChange={(e) => updateLocationMaterial(locationIndex, materialIndex, 'minimumQuantity', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="table-input-small"
                                />
                              </td>
                              
                              <td className="max-qty-cell">
                                <input
                                  type="number"
                                  min="0"
                                  step="0.001"
                                  value={material.maximumQuantity || ''}
                                  onChange={(e) => updateLocationMaterial(locationIndex, materialIndex, 'maximumQuantity', parseFloat(e.target.value) || 0)}
                                  placeholder="0"
                                  className="table-input-small"
                                />
                              </td>
                              
                              <td className="actions-cell">
                                <button 
                                  type="button"
                                  onClick={() => removeMaterialFromLocation(locationIndex, materialIndex)}
                                  className="table-remove-btn"
                                  title="Remove"
                                >
                                  <X size={14} />
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            ))}

            {formData.locations.length === 0 && formData.supplierId && supplierLocations.length > 0 && (
              <div className="empty-locations" style={{
                border: '2px dashed #ef4444',
                borderRadius: '8px',
                padding: '24px',
                textAlign: 'center',
                backgroundColor: '#fef2f2',
                margin: '16px 0'
              }}>
                <div className="empty-state-icon">
                  <AlertTriangle size={48} style={{ color: '#ef4444' }} />
                </div>
                <h3 style={{ color: '#ef4444', marginBottom: '8px' }}>⚠️ Contract Locations Required</h3>
                <p style={{ color: '#dc2626', fontWeight: '500' }}>
                  You must select locations and define material rates to create this contract.
                  <br />
                  Use the dropdown above to add locations, then define rates for each material.
                </p>
                <p style={{ color: '#991b1b', fontSize: '14px', marginTop: '8px' }}>
                  💡 Tip: Scroll up to find the "Add Location" dropdown
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Attachments - Only in edit mode */}
        {isEdit && formData?.id && (
          <div className="form-section">
            <div className="form-section-title">Attachments</div>
            <FileUpload
              mode="multiple"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5242880}
              maxFiles={10}
              onUpload={async (files) => {
                const result = await uploadService.uploadFiles('contracts', formData.id, files);
                if (result.success) {
                  // Refresh the contract data to get updated attachments
                  const updated = await contractService.getById(formData.id);
                  if (updated.success) {
                    setFormData(prev => ({
                      ...prev,
                      attachments: updated.data.attachments
                    }));
                  }
                  alert('Files uploaded successfully');
                } else {
                  alert('Failed to upload files: ' + result.error);
                }
              }}
              onDelete={async (filename) => {
                const result = await uploadService.deleteFile('contracts', formData.id, filename);
                if (result.success) {
                  // Refresh the contract data to get updated attachments
                  const updated = await contractService.getById(formData.id);
                  if (updated.success) {
                    setFormData(prev => ({
                      ...prev,
                      attachments: updated.data.attachments
                    }));
                  }
                  alert('File deleted successfully');
                } else {
                  alert('Failed to delete file: ' + result.error);
                }
              }}
              existingFiles={formData.attachments || []}
            />
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            className="btn btn-outline" 
            onClick={() => {
              if (isEdit && originalFormData && restoreFromOriginal) {
                // Check if form has been modified
                const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalFormData)
                if (hasChanges) {
                  const confirmCancel = window.confirm(
                    'You have unsaved changes. Are you sure you want to cancel?\n\n' +
                    'Note: Any modifications will be lost and original data will be restored.'
                  )
                  if (!confirmCancel) return
                  
                  // Restore original data
                  restoreFromOriginal()
                }
              }
              if (clearPendingDeletions) {
                clearPendingDeletions()
              }
              onClose()
            }}
          >
            Cancel
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading || (isFormValid ? !isFormValid(formData) : false)}
            style={{
              opacity: (isFormValid && !isFormValid(formData) && !loading) ? 0.6 : 1,
              cursor: (isFormValid && !isFormValid(formData) && !loading) ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Update Contract' : 'Create Contract'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default Contracts