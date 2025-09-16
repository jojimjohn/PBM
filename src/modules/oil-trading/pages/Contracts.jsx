import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import contractService from '../../../services/contractService'
import supplierService from '../../../services/supplierService'
import materialService from '../../../services/materialService'
import { Edit, Plus, Save, X, Eye, FileText, User, Calendar, DollarSign, Settings, Check, AlertTriangle, Clock, Briefcase, Package } from 'lucide-react'
import LoadingSpinner from '../../../components/LoadingSpinner'
import '../styles/Contracts.css'

const Contracts = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
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
  const [editFormData, setEditFormData] = useState({})
  const [createFormData, setCreateFormData] = useState({})

  useEffect(() => {
    loadContracts()
    loadSuppliersAndMaterials()
  }, [selectedCompany])

  const loadContracts = async () => {
    try {
      const response = await contractService.getAll()
      
      if (response.success) {
        // Contracts are already filtered by company in the service
        const companyContracts = response.data.filter(
          contract => contract.companyId === selectedCompany?.id
        )
        
        setContracts(companyContracts)
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

  const initializeCreateForm = () => {
    return {
      supplierId: '',
      contractType: 'service',
      title: '',
      description: '',
      startDate: '',
      endDate: '',
      totalValue: 0,
      currency: 'OMR',
      paymentTerms: '',
      specialTerms: '',
      status: 'draft',
      materials: []
    }
  }

  const handleCreateContract = async () => {
    try {
      setLoading(true)
      
      // Basic validation
      if (!createFormData.supplierId || !createFormData.title || !createFormData.startDate || !createFormData.endDate) {
        alert(t('fillRequiredFields'))
        return
      }

      const contractData = {
        ...createFormData,
        companyId: selectedCompany.id,
        createdAt: new Date().toISOString(),
        createdBy: 'current_user', // This should come from auth context
        totalValue: parseFloat(createFormData.totalValue) || 0,
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
      
      const response = await contractService.update(selectedContract.id, editFormData)
      
      if (response.success) {
        setContracts(prev => prev.map(c => c.id === selectedContract.id ? response.data : c))
        setShowEditForm(false)
        setSelectedContract(null)
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
    return `OMR ${(amount || 0).toFixed(2)}`
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getContractStatusInfo = (status) => {
    return contractStatuses[status] || { name: status, color: '#6b7280' }
  }

  const getContractTypeInfo = (type) => {
    return contractTypes[type] || { name: type, color: '#6b7280' }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <LoadingSpinner message="Loading contracts..." size="large" />
      </div>
    )
  }

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
              onClick={() => {
                setSelectedContract(row)
                // Show view modal logic would go here
              }}
              title={t('viewDetails')}
            >
              <Eye size={14} />
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
            <button 
              className="btn btn-outline btn-sm" 
              onClick={() => {
                setSelectedContract(row)
                setEditFormData(row)
                setShowEditForm(true)
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
              onClick={() => {
                setCreateFormData(initializeCreateForm())
                setShowCreateForm(true)
              }}
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
            <DollarSign size={24} />
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
          contractTypes={contractTypes}
          isEdit={false}
          loading={loading}
          t={t}
        />
      )}

      {/* Edit Contract Modal */}
      {showEditForm && selectedContract && (
        <ContractFormModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedContract(null)
          }}
          onSave={handleUpdateContract}
          title={t('editContract', 'Edit Contract')}
          formData={editFormData}
          setFormData={setEditFormData}
          suppliers={suppliers}
          materials={materials}
          contractTypes={contractTypes}
          isEdit={true}
          loading={loading}
          t={t}
        />
      )}
    </div>
  )
}

// Contract Form Modal Component (Simplified without locations)
const ContractFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  formData, 
  setFormData, 
  suppliers,
  materials,
  contractTypes,
  isEdit, 
  loading,
  t 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    onSave()
  }

  const addMaterial = () => {
    const newMaterial = {
      id: `mat_${Date.now()}`,
      materialId: '',
      materialName: '',
      rate: 0,
      currency: 'OMR',
      minimumQuantity: 0,
      maximumQuantity: 0,
      unit: ''
    }
    
    setFormData(prev => ({
      ...prev,
      materials: [...(prev.materials || []), newMaterial]
    }))
  }

  const removeMaterial = (materialIndex) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter((_, index) => index !== materialIndex)
    }))
  }

  const updateMaterial = (materialIndex, field, value) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.map((material, index) => 
        index === materialIndex 
          ? { ...material, [field]: value }
          : material
      )
    }))
  }

  return (
    <Modal 
      isOpen={isOpen}
      title={title} 
      onClose={onClose}
      className="modal-xl"
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
              <label>Contract Title *</label>
              <input
                type="text"
                value={formData.title || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                required
                placeholder="Enter contract title"
              />
            </div>

            <div className="form-group">
              <label>Supplier *</label>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierId: e.target.value }))}
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
                value={formData.contractType || 'service'}
                onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
              >
                {Object.entries(contractTypes).map(([key, type]) => (
                  <option key={key} value={key}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.startDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                value={formData.endDate || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
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
              <label>Description</label>
              <textarea
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Contract description"
                rows={3}
              />
            </div>

            <div className="form-group">
              <label>Payment Terms</label>
              <input
                type="text"
                value={formData.paymentTerms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
                placeholder="e.g., Net 30 days"
              />
            </div>

            <div className="form-group">
              <label>Special Terms</label>
              <textarea
                value={formData.specialTerms || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, specialTerms: e.target.value }))}
                placeholder="Any special terms or conditions"
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Contract Materials (Optional) */}
        <div className="form-section">
          <div className="form-section-title">
            <Package size={20} />
            Contract Materials
            <span className="section-subtitle">Define materials covered by this contract</span>
          </div>

          <div className="materials-container">
            {(formData.materials || []).map((material, materialIndex) => (
              <div key={material.id} className="material-item">
                <div className="material-header">
                  <h4>Material {materialIndex + 1}</h4>
                  <button 
                    type="button"
                    onClick={() => removeMaterial(materialIndex)}
                    className="btn btn-danger btn-xs"
                  >
                    <X size={14} />
                  </button>
                </div>

                <div className="material-fields">
                  <div className="form-group">
                    <label>Material</label>
                    <select
                      value={material.materialId || ''}
                      onChange={(e) => {
                        const selectedMaterial = materials.find(m => m.id === e.target.value)
                        if (selectedMaterial) {
                          updateMaterial(materialIndex, 'materialId', selectedMaterial.id)
                          updateMaterial(materialIndex, 'materialName', selectedMaterial.name)
                          updateMaterial(materialIndex, 'unit', selectedMaterial.unit)
                        }
                      }}
                    >
                      <option value="">Select Material</option>
                      {materials.map(mat => (
                        <option key={mat.id} value={mat.id}>
                          {mat.name} ({mat.type})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Rate per Unit</label>
                    <div className="rate-input-group">
                      <input
                        type="number"
                        step="0.001"
                        min="0"
                        value={material.rate || 0}
                        onChange={(e) => updateMaterial(materialIndex, 'rate', parseFloat(e.target.value) || 0)}
                        placeholder="0.000"
                      />
                      <select
                        value={material.currency || 'OMR'}
                        onChange={(e) => updateMaterial(materialIndex, 'currency', e.target.value)}
                        className="currency-select"
                      >
                        <option value="OMR">OMR</option>
                        <option value="USD">USD</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Minimum Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={material.minimumQuantity || 0}
                      onChange={(e) => updateMaterial(materialIndex, 'minimumQuantity', parseInt(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Maximum Quantity</label>
                    <input
                      type="number"
                      min="0"
                      value={material.maximumQuantity || 0}
                      onChange={(e) => updateMaterial(materialIndex, 'maximumQuantity', parseInt(e.target.value) || 0)}
                    />
                  </div>
                </div>
              </div>
            ))}

            <button 
              type="button"
              onClick={addMaterial}
              className="btn btn-outline btn-sm add-material-btn"
            >
              <Plus size={16} />
              Add Material
            </button>
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