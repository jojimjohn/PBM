import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import { PERMISSIONS } from '../../../config/roles'
import PermissionGate from '../../../components/PermissionGate'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import contractService from '../../../services/contractService'
import customerService from '../../../services/customerService'
import materialService from '../../../services/materialService'
import { Edit, Plus, Save, X, Eye, FileText, User, Calendar, DollarSign, Settings, Check, AlertTriangle, Clock, Briefcase } from 'lucide-react'
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
  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  const [editFormData, setEditFormData] = useState({})
  const [createFormData, setCreateFormData] = useState({})

  useEffect(() => {
    loadContracts()
    loadCustomersAndMaterials()
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
        setContractTypes(['project-based', 'contract', 'walk-in'])
        setContractStatuses(['active', 'expired', 'pending', 'cancelled'])
      } else {
        console.error('Failed to load contracts:', response.error)
        setContracts([])
      }
    } catch (error) {
      console.error('Error loading contracts:', error)
      setContracts([])
    } finally {
      setLoading(false)
    }
  }

  const loadCustomersAndMaterials = async () => {
    try {
      // Load customers using API service
      const customersResponse = await customerService.getAll()
      const companyCustomers = customersResponse.success ? customersResponse.data : []
      setCustomers(companyCustomers)

      // Load materials using API service
      const materialsResponse = await materialService.getAll()
      const companyMaterials = materialsResponse.success ? materialsResponse.data : []
      setMaterials(companyMaterials)
    } catch (error) {
      console.error('Error loading customers and materials:', error)
      setCustomers([])
      setMaterials([])
    }
  }

  const handleEditContract = (contract) => {
    setSelectedContract(contract)
    
    // Initialize edit form with contract data
    const formData = {
      contractId: contract.id,
      customerId: contract.customerId || '',
      customerName: contract.customerName,
      contractType: contract.contractType,
      startDate: contract.startDate,
      endDate: contract.endDate,
      status: contract.status,
      specialTerms: contract.terms?.specialTerms || '',
      paymentTerms: contract.terms?.paymentTerms || 'net_30',
      fuelItems: contract.fuelItems || [],
      rates: {}
    }
    
    // Convert fuel items to rates format for editing
    if (contract.fuelItems) {
      contract.fuelItems.forEach(item => {
        formData.rates[item.materialId || `fuel_${item.fuelType}`] = {
          type: 'fixed_rate',
          contractRate: item.contractRate,
          startDate: contract.startDate,
          endDate: contract.endDate,
          status: contract.status,
          description: `Contract rate for ${item.fuelType}`
        }
      })
    }
    
    setEditFormData(formData)
    setShowEditForm(true)
  }

  const handleCreateContract = () => {
    // Initialize create form with empty data
    const formData = {
      contractId: `CON-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      customerId: '',
      contractType: 'fuel_supply',
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 year from now
      status: 'active',
      specialTerms: '',
      paymentTerms: 'net_30',
      rates: {}
    }
    
    setCreateFormData(formData)
    setShowCreateForm(true)
  }

  const handleSaveContract = async (formData, isEdit = false) => {
    try {
      setLoading(true)
      
      // In a real application, this would make an API call
      console.log(`${isEdit ? 'Updating' : 'Creating'} contract:`, formData)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Update local state (in production, refetch from server)
      if (isEdit) {
        setContracts(prev => prev.map(contract => 
          contract.id === formData.contractId 
            ? { ...contract, ...formData, updatedAt: new Date().toISOString() }
            : contract
        ))
      } else {
        const newContract = {
          ...formData,
          id: formData.contractId,
          companyId: selectedCompany?.id,
          createdAt: new Date().toISOString(),
          performance: {
            totalValue: 0,
            onTimeDeliveryRate: 1.0
          },
          fuelItems: Object.entries(formData.rates).map(([materialId, rateInfo]) => {
            const material = materials.find(m => m.id === materialId)
            return {
              materialId,
              fuelType: material?.name || materialId,
              contractRate: rateInfo.contractRate,
              unit: material?.unit || 'L',
              deliverySchedule: 'as_required'
            }
          })
        }
        setContracts(prev => [...prev, newContract])
      }
      
      // Close modals
      setShowEditForm(false)
      setShowCreateForm(false)
      setSelectedContract(null)
      
      alert(`Contract ${isEdit ? 'updated' : 'created'} successfully!`)
    } catch (error) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} contract:`, error)
      alert(`Failed to ${isEdit ? 'update' : 'create'} contract. Please try again.`)
    } finally {
      setLoading(false)
    }
  }

  const addRateToForm = (formData, setFormData) => {
    const materialId = Object.keys(formData.rates || {}).length > 0 
      ? '' : (materials[0]?.id || '')
    
    const newRates = {
      ...(formData.rates || {}),
      [materialId || `rate_${Date.now()}`]: {
        type: 'fixed_rate',
        contractRate: 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status: 'active',
        description: ''
      }
    }
    
    setFormData(prev => ({ ...prev, rates: newRates }))
  }

  const removeRateFromForm = (materialId, formData, setFormData) => {
    const newRates = { ...(formData.rates || {}) }
    delete newRates[materialId]
    setFormData(prev => ({ ...prev, rates: newRates }))
  }

  const updateRateInForm = (materialId, field, value, formData, setFormData) => {
    const newRates = {
      ...(formData.rates || {}),
      [materialId]: {
        ...(formData.rates?.[materialId] || {}),
        [field]: value
      }
    }
    setFormData(prev => ({ ...prev, rates: newRates }))
  }

  const filteredContracts = contracts

  const getStatusColor = (status) => {
    return contractStatuses[status]?.color || '#6b7280'
  }

  const getStatusName = (status) => {
    return contractStatuses[status]?.name || status
  }

  const formatCurrency = (amount) => {
    return `OMR ${amount.toFixed(2)}`
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-GB')
  }

  const getDaysUntilExpiry = (endDate) => {
    const today = new Date()
    const expiry = new Date(endDate)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  const getExpiryStatus = (endDate, status) => {
    if (status === 'expired') return 'expired'
    
    const daysUntilExpiry = getDaysUntilExpiry(endDate)
    if (daysUntilExpiry < 0) return 'expired'
    if (daysUntilExpiry <= 30) return 'expiring_soon'
    if (daysUntilExpiry <= 90) return 'renewal_due'
    return 'active'
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
      key: 'customerName',
      header: t('customer'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="customer-info">
          <User size={14} />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'contractType',
      header: t('type'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="contract-type">
          <Briefcase size={14} />
          <span>{contractTypes[value]?.name || value}</span>
        </div>
      )
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
        const daysUntilExpiry = getDaysUntilExpiry(value)
        const expiryStatus = getExpiryStatus(value, row.status)
        return (
          <div className="expiry-info">
            <div className="date">{formatDate(value)}</div>
            {expiryStatus === 'expiring_soon' && (
              <div className="expiry-warning">
                <Clock size={12} />
                <span>{daysUntilExpiry} days</span>
              </div>
            )}
          </div>
        )
      }
    },
    {
      key: 'status',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span 
          className="contract-status-badge"
          style={{ backgroundColor: getStatusColor(value) }}
        >
          {getStatusName(value)}
        </span>
      )
    },
    {
      key: 'fuelItems',
      header: t('fuelItems'),
      sortable: false,
      render: (value) => (
        <div className="fuel-items-summary">
          <div className="item-count">{value.length} {t('items')}</div>
          <div className="item-types">
            {value.slice(0, 2).map((item, index) => (
              <span key={index} className="fuel-type">
                {item.fuelType.replace('_', ' ')}
              </span>
            ))}
            {value.length > 2 && (
              <span className="more-items">+{value.length - 2} {t('more')}</span>
            )}
          </div>
        </div>
      )
    },
    {
      key: 'performance.totalValue',
      header: t('totalValue'),
      type: 'currency',
      align: 'right',
      sortable: true,
      render: (value, row) => formatCurrency(row.performance?.totalValue || 0)
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
              className="btn-icon" 
              title={t('viewDetails')}
            >
              <Eye size={16} />
            </button>
          </PermissionGate>
          
          <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
            <button 
              className="btn-icon" 
              onClick={() => handleEditContract(row)}
              title={t('edit')}
            >
              <Edit size={16} />
            </button>
          </PermissionGate>
          
          {row.status === 'pending_renewal' && (
            <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
              <button 
                className="btn-icon primary" 
                title={t('renewContract')}
              >
                <Settings size={16} />
              </button>
            </PermissionGate>
          )}
        </div>
      )
    }
  ]

  if (loading) {
    return (
      <div className="contracts-page">
        <div className="loading-spinner">{t('loadingContracts')}</div>
      </div>
    )
  }

  return (
    <div className="contracts-page">
      <div className="page-header">
        <div className="page-title-section">
          <h1>Contract Management</h1>
          <p>Manage fuel supply contracts and agreements</p>
        </div>
        
        <PermissionGate permission={PERMISSIONS.MANAGE_CONTRACTS}>
          <div className="page-actions">
            <button 
              className="btn btn-primary"
              onClick={handleCreateContract}
            >
              <Plus size={20} />
              New Contract
            </button>
          </div>
        </PermissionGate>
      </div>


      {/* Contracts Summary Cards */}
      <div className="contracts-summary">
        <div className="summary-card">
          <div className="summary-icon active">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14,2 14,8 20,8" />
            </svg>
          </div>
          <div className="summary-content">
            <h3>Active Contracts</h3>
            <p className="summary-number">{contracts.filter(c => c.status === 'active').length}</p>
            <p className="summary-change">Currently running</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon expiring">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12,6 12,12 16,14" />
            </svg>
          </div>
          <div className="summary-content">
            <h3>Expiring Soon</h3>
            <p className="summary-number">
              {contracts.filter(c => getExpiryStatus(c.endDate, c.status) === 'expiring_soon').length}
            </p>
            <p className="summary-change">Within 30 days</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon renewal">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M1 4v6h6" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
          </div>
          <div className="summary-content">
            <h3>Pending Renewal</h3>
            <p className="summary-number">{contracts.filter(c => c.status === 'pending_renewal').length}</p>
            <p className="summary-change">Action required</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="summary-icon value">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="summary-content">
            <h3>Total Value</h3>
            <p className="summary-number">
              {formatCurrency(contracts.reduce((sum, c) => sum + (c.performance?.totalValue || 0), 0))}
            </p>
            <p className="summary-change">Year to date</p>
          </div>
        </div>
      </div>

      {/* Contracts Table */}
      <div className="contracts-table-container">
        <DataTable
          data={contracts}
          columns={contractColumns}
          title={t('contractManagement')}
          subtitle={t('contractSubtitle')}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          emptyMessage={t('noContractsFound')}
          className="contracts-table"
          initialPageSize={10}
          stickyHeader={true}
          enableColumnToggle={true}
        />
      </div>

      {/* Edit Contract Modal */}
      {showEditForm && selectedContract && (
        <ContractFormModal
          isOpen={showEditForm}
          onClose={() => {
            setShowEditForm(false)
            setSelectedContract(null)
          }}
          onSave={(formData) => handleSaveContract(formData, true)}
          title={t('editContract')}
          formData={editFormData}
          setFormData={setEditFormData}
          customers={customers}
          materials={materials}
          isEdit={true}
          loading={loading}
          addRateToForm={addRateToForm}
          removeRateFromForm={removeRateFromForm}
          updateRateInForm={updateRateInForm}
        />
      )}

      {/* Create Contract Modal */}
      {showCreateForm && (
        <ContractFormModal
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSave={(formData) => handleSaveContract(formData, false)}
          title={t('createNewContract')}
          formData={createFormData}
          setFormData={setCreateFormData}
          customers={customers}
          materials={materials}
          isEdit={false}
          loading={loading}
          addRateToForm={addRateToForm}
          removeRateFromForm={removeRateFromForm}
          updateRateInForm={updateRateInForm}
        />
      )}
    </div>
  )
}

// Contract Form Modal Component
const ContractFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  formData, 
  setFormData, 
  customers, 
  materials, 
  isEdit, 
  loading, 
  addRateToForm, 
  removeRateFromForm, 
  updateRateInForm 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault()
    
    // Basic validation
    if (!formData.customerId) {
      alert('Please select a customer')
      return
    }
    
    if (!formData.startDate || !formData.endDate) {
      alert('Please set contract start and end dates')
      return
    }
    
    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      alert('End date must be after start date')
      return
    }
    
    const ratesCount = Object.keys(formData.rates || {}).length
    if (ratesCount === 0) {
      alert('Please add at least one material rate')
      return
    }
    
    onSave(formData)
  }
  
  const selectedCustomer = customers.find(c => c.id === formData.customerId)
  
  return (
    <Modal 
      title={title} 
      onClose={onClose}
      className="modal-xl"
    >
      <form className="contract-form" onSubmit={handleSubmit}>
        {/* Contract Basic Information */}
        <div className="form-section">
          <div className="form-section-title">
            <FileText size={20} />
            Contract Information
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>Contract ID *</label>
              <input
                type="text"
                value={formData.contractId}
                onChange={(e) => setFormData(prev => ({ ...prev, contractId: e.target.value }))}
                required
                readOnly={isEdit}
                className={isEdit ? 'readonly' : ''}
              />
            </div>

            <div className="form-group">
              <label>Customer *</label>
              <select
                value={formData.customerId}
                onChange={(e) => {
                  const customer = customers.find(c => c.id === e.target.value)
                  setFormData(prev => ({ 
                    ...prev, 
                    customerId: e.target.value,
                    customerName: customer?.name || ''
                  }))
                }}
                required
                disabled={isEdit}
              >
                <option value="">Select Customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} ({customer.type.replace('_', ' ').toUpperCase()})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Contract Type</label>
              <select
                value={formData.contractType}
                onChange={(e) => setFormData(prev => ({ ...prev, contractType: e.target.value }))}
              >
                <option value="fuel_supply">Fuel Supply Contract</option>
                <option value="bulk_supply">Bulk Supply Contract</option>
                <option value="exclusive_supply">Exclusive Supply Contract</option>
                <option value="project_based">Project-Based Contract</option>
              </select>
            </div>

            <div className="form-group">
              <label>Contract Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="pending_renewal">Pending Renewal</option>
                <option value="expired">Expired</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>

            <div className="form-group">
              <label>Start Date *</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                required
              />
            </div>

            <div className="form-group">
              <label>End Date *</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                min={formData.startDate}
                required
              />
            </div>

            <div className="form-group">
              <label>Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData(prev => ({ ...prev, paymentTerms: e.target.value }))}
              >
                <option value="net_15">Net 15 Days</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_45">Net 45 Days</option>
                <option value="net_60">Net 60 Days</option>
                <option value="cash_on_delivery">Cash on Delivery</option>
                <option value="advance_payment">Advance Payment</option>
              </select>
            </div>
          </div>

          <div className="form-group full-width">
            <label>Special Terms & Conditions</label>
            <textarea
              value={formData.specialTerms}
              onChange={(e) => setFormData(prev => ({ ...prev, specialTerms: e.target.value }))}
              placeholder="Enter special terms, conditions, or notes for this contract..."
              rows="3"
            />
          </div>
        </div>

        {/* Material Rates Section */}
        <div className="form-section">
          <div className="form-section-title">
            <div className="title-with-action">
              <span>
                <DollarSign size={20} />
                Material Rates & Pricing
              </span>
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={() => addRateToForm(formData, setFormData)}
              >
                <Plus size={16} />
                Add Material Rate
              </button>
            </div>
          </div>

          <div className="rates-table">
            {Object.keys(formData.rates || {}).length === 0 ? (
              <div className="empty-rates">
                <DollarSign size={48} className="empty-icon" />
                <h3>No Material Rates Added</h3>
                <p>Add material rates to define pricing for this contract</p>
                <button
                  type="button"
                  className="btn btn-primary"
                  onClick={() => addRateToForm(formData, setFormData)}
                >
                  <Plus size={16} />
                  Add First Rate
                </button>
              </div>
            ) : (
              <div className="rates-grid">
                {Object.entries(formData.rates || {}).map(([materialId, rateInfo]) => {
                  const material = materials.find(m => m.id === materialId)
                  
                  return (
                    <div key={materialId} className="rate-item">
                      <div className="rate-header">
                        <div className="rate-material">
                          <select
                            value={materialId}
                            onChange={(e) => {
                              const oldMaterialId = materialId
                              const newMaterialId = e.target.value
                              
                              if (newMaterialId && newMaterialId !== oldMaterialId) {
                                const newRates = { ...formData.rates }
                                newRates[newMaterialId] = { ...rateInfo }
                                delete newRates[oldMaterialId]
                                setFormData(prev => ({ ...prev, rates: newRates }))
                              }
                            }}
                            className="material-select"
                          >
                            <option value="">Select Material...</option>
                            {materials.map(mat => (
                              <option key={mat.id} value={mat.id}>
                                {mat.name} ({mat.unit})
                              </option>
                            ))}
                          </select>
                        </div>
                        
                        <button 
                          type="button"
                          className="btn btn-outline btn-small btn-danger"
                          onClick={() => removeRateFromForm(materialId, formData, setFormData)}
                          title="Remove this rate"
                        >
                          <X size={14} />
                        </button>
                      </div>

                      <div className="rate-config">
                        <div className="form-group">
                          <label>Rate Type</label>
                          <select
                            value={rateInfo.type || 'fixed_rate'}
                            onChange={(e) => updateRateInForm(materialId, 'type', e.target.value, formData, setFormData)}
                          >
                            <option value="fixed_rate">Fixed Rate</option>
                            <option value="discount_percentage">Discount Percentage</option>
                            <option value="minimum_price_guarantee">Minimum Price Guarantee</option>
                          </select>
                        </div>

                        {(rateInfo.type === 'fixed_rate' || rateInfo.type === 'minimum_price_guarantee' || !rateInfo.type) && (
                          <div className="form-group">
                            <label>Contract Rate (OMR)</label>
                            <input
                              type="number"
                              value={rateInfo.contractRate || ''}
                              onChange={(e) => updateRateInForm(materialId, 'contractRate', parseFloat(e.target.value) || 0, formData, setFormData)}
                              placeholder="0.000"
                              step="0.001"
                              min="0"
                            />
                          </div>
                        )}

                        {rateInfo.type === 'discount_percentage' && (
                          <div className="form-group">
                            <label>Discount Percentage (%)</label>
                            <input
                              type="number"
                              value={rateInfo.discountPercentage || ''}
                              onChange={(e) => updateRateInForm(materialId, 'discountPercentage', parseFloat(e.target.value) || 0, formData, setFormData)}
                              placeholder="0.0"
                              step="0.1"
                              min="0"
                              max="100"
                            />
                          </div>
                        )}

                        <div className="form-group full-width">
                          <label>Description</label>
                          <input
                            type="text"
                            value={rateInfo.description || ''}
                            onChange={(e) => updateRateInForm(materialId, 'description', e.target.value, formData, setFormData)}
                            placeholder="Optional description for this rate..."
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Customer Information (if selected) */}
        {selectedCustomer && (
          <div className="form-section">
            <div className="form-section-title">
              <User size={20} />
              Customer Information
            </div>
            
            <div className="customer-info-grid">
              <div className="customer-detail">
                <label>Customer Name:</label>
                <span>{selectedCustomer.name}</span>
              </div>
              <div className="customer-detail">
                <label>Customer Type:</label>
                <span className="customer-type-badge">
                  {selectedCustomer.type.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <div className="customer-detail">
                <label>Contact Person:</label>
                <span>{selectedCustomer.contactPerson || 'N/A'}</span>
              </div>
              <div className="customer-detail">
                <label>Phone:</label>
                <span>{selectedCustomer.contact?.phone || 'N/A'}</span>
              </div>
              <div className="customer-detail">
                <label>Email:</label>
                <span>{selectedCustomer.contact?.email || 'N/A'}</span>
              </div>
              <div className="customer-detail">
                <label>Credit Limit:</label>
                <span>{selectedCustomer.creditLimit ? `OMR ${selectedCustomer.creditLimit.toLocaleString()}` : 'N/A'}</span>
              </div>
            </div>
          </div>
        )}

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