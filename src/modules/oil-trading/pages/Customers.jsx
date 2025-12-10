import React, { useState, useEffect } from 'react'
import { useAuth } from '../../../context/AuthContext'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import LoadingSpinner from '../../../components/LoadingSpinner'
import Modal from '../../../components/ui/Modal'
import DataTable from '../../../components/ui/DataTable'
import customerService from '../../../services/customerService'
import typesService from '../../../services/typesService'
import materialService from '../../../services/materialService'
import { Eye, Edit, ShoppingCart, FileText, User, Phone, Mail, Calendar, DollarSign, AlertTriangle, Trash } from 'lucide-react'
import '../styles/Customers.css'

const OilTradingCustomers = () => {
  const { selectedCompany } = useAuth()
  const { t } = useLocalization()
  const { canEdit, canDelete, hasPermission } = usePermissions()
  const [customers, setCustomers] = useState([])
  const [customerTypes, setCustomerTypes] = useState([])
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [viewingCustomer, setViewingCustomer] = useState(null)
  const [viewingContract, setViewingContract] = useState(null)
  const [editingContract, setEditingContract] = useState(null)
  const [error, setError] = useState(null)

  // Load customer types
  useEffect(() => {
    const loadCustomerTypes = async () => {
      try {
        const result = await typesService.getCustomerTypes()
        if (result.success) {
          setCustomerTypes(result.data || [])
        }
      } catch (error) {
        console.error('Error loading customer types:', error)
      }
    }
    loadCustomerTypes()
  }, [])

  // Load customers data
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await customerService.getAll()

        if (result.success) {
          setCustomers(result.data || [])
        } else {
          throw new Error(result.error || 'Failed to load customers')
        }
      } catch (error) {
        console.error('Error loading customers:', error)
        setError(error.message)
        setCustomers([])
      } finally {
        setLoading(false)
      }
    }

    if (selectedCompany?.id) {
      loadCustomers()
    }
  }, [selectedCompany])

  const handleAddCustomer = async (customerData) => {
    try {
      setLoading(true)
      const result = await customerService.create(customerData)
      
      if (result.success) {
        // Refresh customer list
        const listResult = await customerService.getAll()
        if (listResult.success) {
          setCustomers(listResult.data || [])
        }
        setShowAddForm(false)
      } else {
        console.error('Error creating customer:', result.error)
        alert('Error creating customer: ' + result.error)
      }
    } catch (error) {
      console.error('Error creating customer:', error)
      alert('Error creating customer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleEditCustomer = async (customerId, customerData) => {
    try {
      setLoading(true)
      const result = await customerService.update(customerId, customerData)
      
      if (result.success) {
        // Refresh customer list
        const listResult = await customerService.getAll()
        if (listResult.success) {
          setCustomers(listResult.data || [])
        }
        setEditingCustomer(null)
      } else {
        console.error('Error updating customer:', result.error)
        alert('Error updating customer: ' + result.error)
      }
    } catch (error) {
      console.error('Error updating customer:', error)
      alert('Error updating customer: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    if (window.confirm('Are you sure you want to delete this customer?')) {
      try {
        setLoading(true)
        const result = await customerService.delete(customerId)
        
        if (result.success) {
          // Refresh customer list
          const listResult = await customerService.getAll()
          if (listResult.success) {
            setCustomers(listResult.data || [])
          }
        } else {
          console.error('Error deleting customer:', result.error)
          alert('Error deleting customer: ' + result.error)
        }
      } catch (error) {
        console.error('Error deleting customer:', error)
        alert('Error deleting customer: ' + error.message)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleToggleStatus = async (customerId) => {
    try {
      const customer = customers.find(c => c.id === customerId)
      const result = await customerService.updateStatus(customerId, !customer.isActive)
      if (result.success) {
        const updatedCustomers = customers.map(c => 
          c.id === customerId ? result.data : c
        )
        setCustomers(updatedCustomers)
      } else {
        console.error('Error updating customer status:', result.error)
        // Show error message to user
      }
    } catch (error) {
      console.error('Error updating customer status:', error)
      // Show error message to user
    }
  }

  const handleViewDetails = (customer) => {
    setViewingCustomer(customer)
  }

  const handleCreateOrder = (customer) => {
    // Store customer for cross-module integration
    sessionStorage.setItem('selectedCustomerForOrder', JSON.stringify(customer))
    
    // Navigate to sales module page
    window.location.href = '/sales'
  }

  const handleViewContract = (customer) => {
    console.log('Viewing contract for customer:', customer?.name, 'has contract:', !!customer?.contractDetails)
    if (customer && customer.contractDetails) {
      setViewingContract(customer)
    } else {
      alert('This customer does not have contract details available.')
    }
  }

  // Define table columns
  const columns = [
    {
      key: 'name',
      header: t('customerName'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="customer-name-cell">
          <div className="customer-avatar-mini">
            {value.split(' ').map(word => word[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="customer-name-info">
            <div className="name">{value}</div>
            <div className="code">{row.code}</div>
          </div>
        </div>
      )
    },
    {
      key: 'type',
      header: t('type'),
      sortable: true,
      filterable: true,
      render: (value, row) => {
        const typeObj = customerTypes.find(t => t.code === value)
        return (
          <span className={`customer-type-badge ${value}`}>
            {typeObj ? typeObj.name : value}
          </span>
        )
      }
    },
    {
      key: 'contactPerson',
      header: t('contactPerson'),
      sortable: true,
      render: (value) => value || t('notAvailable')
    },
    {
      key: 'phone',
      header: t('phone'),
      sortable: true,
      render: (value, row) => (
        <div className="contact-info">
          <Phone size={14} />
          <span>{row.contact?.phone || t('notAvailable')}</span>
        </div>
      )
    },
    {
      key: 'email',
      header: t('email'),
      sortable: true,
      render: (value, row) => (
        <div className="contact-info">
          <Mail size={14} />
          <span>{row.contact?.email || t('notAvailable')}</span>
        </div>
      )
    },
    {
      key: 'salesHistory.totalValue',
      header: t('totalValue'),
      type: 'currency',
      align: 'right',
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="sales-summary">
          <div className="total-value">OMR {(row.salesHistory?.totalValue || 0).toFixed(2)}</div>
          <div className="order-count">{row.salesHistory?.totalOrders || 0} {t('orders')}</div>
        </div>
      )
    },
    {
      key: 'isActive',
      header: t('status'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'active' : 'inactive'}`}>
          {value ? t('active') : t('inactive')}
        </span>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      sortable: false,
      width: '200px',
      render: (value, row) => (
        <div className="table-actions">
          <button 
            className="btn-icon" 
            onClick={(e) => {
              e.stopPropagation();
              handleViewDetails(row);
            }}
            title={t('viewDetails')}
          >
            <Eye size={16} />
          </button>
          
          <button 
            className="btn-icon primary" 
            onClick={(e) => {
              e.stopPropagation();
              handleCreateOrder(row);
            }}
            disabled={!row.isActive}
            title={t('createOrder')}
          >
            <ShoppingCart size={16} />
          </button>

          {row.type === 'contract' && row.contractDetails && (
            <button 
              className="btn-icon secondary" 
              onClick={(e) => {
                e.stopPropagation();
                handleViewContract(row);
              }}
              title={t('viewContract')}
            >
              <FileText size={16} />
            </button>
          )}

          {canEdit('customers') && (
            <button 
              className="btn-icon" 
              onClick={(e) => {
                e.stopPropagation();
                setEditingCustomer(row);
              }}
              title={t('edit')}
            >
              <Edit size={16} />
            </button>
          )}

          {canDelete('customers') && (
            <button 
              className="btn-icon danger" 
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteCustomer(row.id);
              }}
              title={t('delete')}
            >
              <Trash size={16} />
            </button>
          )}
        </div>
      )
    }
  ]

  // Remove early return - let DataTable handle loading state with skeleton

  return (
    <div className="oil-customers-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Customer Management</h1>
          <p>Manage fuel customers and delivery contracts - {customers.length} customers</p>
        </div>
        <div className="header-actions">
          {hasPermission('MANAGE_CUSTOMERS') && (
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="8.5" cy="7" r="4" />
                <line x1="20" y1="8" x2="20" y2="14" />
                <line x1="23" y1="11" x2="17" y2="11" />
              </svg>
              Add Customer
            </button>
          )}
        </div>
      </div>

      <div className="customers-content">
        <DataTable
          data={customers}
          columns={columns}
          title={t('customerManagement')}
          subtitle={t('customerSubtitle')}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          onRowClick={handleViewDetails}
          emptyMessage={t('noCustomersFound')}
          className="customers-table"
          initialPageSize={10}
          stickyHeader={true}
          enableColumnToggle={true}
        />
      </div>

      {/* Add Customer Form Modal */}
      {showAddForm && (
        <CustomerFormModal
          customer={null}
          onSave={handleAddCustomer}
          onCancel={() => setShowAddForm(false)}
          customerTypes={customerTypes}
          t={t}
        />
      )}

      {/* Edit Customer Form Modal */}
      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onSave={(data) => handleEditCustomer(editingCustomer.id, data)}
          onCancel={() => setEditingCustomer(null)}
          customerTypes={customerTypes}
          t={t}
        />
      )}

      {/* Customer Details Modal */}
      {viewingCustomer && (
        <CustomerDetailsModal
          customer={viewingCustomer}
          onClose={() => setViewingCustomer(null)}
          onEdit={() => {
            setEditingCustomer(viewingCustomer)
            setViewingCustomer(null)
          }}
          onCreateOrder={() => handleCreateOrder(viewingCustomer)}
          t={t}
        />
      )}

      {/* Contract Details Modal */}
      {viewingContract && (
        <ContractDetailsModal
          customer={viewingContract}
          onClose={() => setViewingContract(null)}
          onEdit={() => {
            console.log('Opening contract editor for:', viewingContract.name)
            setEditingContract(viewingContract)
            setViewingContract(null)
          }}
        />
      )}

      {/* Contract Edit Modal */}
      {editingContract && (
        <ContractEditModal
          customer={editingContract}
          onClose={() => setEditingContract(null)}
          onSave={(contractData) => {
            // Update customer with new contract data
            const updatedCustomers = customers.map(customer => 
              customer.id === editingContract.id 
                ? { ...customer, contractDetails: contractData }
                : customer
            )
            setCustomers(updatedCustomers)
            setEditingContract(null)
            alert('✅ Contract updated successfully!')
          }}
        />
      )}
    </div>
  )
}

// Customer Form Modal Component
const CustomerFormModal = ({ customer, onSave, onCancel, customerTypes, t }) => {
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    type: customer?.type || 'walk_in',
    contactPerson: customer?.contactPerson || '',
    phone: customer?.contact?.phone || customer?.phone || '',
    email: customer?.contact?.email || customer?.email || '',
    vatRegistrationNumber: customer?.contact?.vatRegistrationNumber || customer?.vatRegistration || '',
    street: customer?.contact?.address?.street || '',
    city: customer?.contact?.address?.city || '',
    region: customer?.contact?.address?.region || '',
    country: customer?.contact?.address?.country || 'Oman',
    creditLimit: customer?.creditLimit || 0,
    paymentTerms: customer?.paymentTerms || customer?.paymentTermDays || 0,
    specialTerms: customer?.contractDetails?.specialTerms || '',
    isTaxable: customer?.is_taxable !== false  // Default to true
  })

  const handleSubmit = (e) => {
    e.preventDefault()

    // Map frontend customer type codes to backend ENUM values
    const typeMapping = {
      'individual': 'walk-in',
      'business': 'walk-in',  // Business customers also use walk-in type
      'project': 'project-based',
      'contract': 'contract'
    }

    // Map frontend form data to backend API format
    const customerData = {
      name: formData.name,
      customerType: typeMapping[formData.type] || 'walk-in',
      contactPerson: formData.contactPerson,
      phone: formData.phone,
      email: formData.email,
      vatRegistration: formData.vatRegistrationNumber,
      address: `${formData.street}, ${formData.city}, ${formData.region}`.replace(/^, |, $/g, '').replace(/, ,/g, ','),
      creditLimit: parseFloat(formData.creditLimit) || 0,
      paymentTermDays: parseInt(formData.paymentTerms) || 0,
      notes: formData.specialTerms || '',
      is_taxable: formData.isTaxable,
      isActive: true
    }

    if (formData.type === 'contract' && formData.specialTerms) {
      customerData.contractDetails = {
        contractId: customer?.contractDetails?.contractId || `CNT-${Date.now()}`,
        startDate: customer?.contractDetails?.startDate || new Date().toISOString().split('T')[0],
        endDate: customer?.contractDetails?.endDate || new Date(Date.now() + 365*24*60*60*1000).toISOString().split('T')[0],
        status: 'active',
        specialTerms: formData.specialTerms,
        rates: customer?.contractDetails?.rates || {}
      }
    }

    onSave(customerData)
  }

  return (
    <Modal
      isOpen={true}
      title={customer ? 'Edit Customer' : 'Add New Customer'}
      onClose={onCancel}
      closeOnOverlayClick={false}
    >
      <form onSubmit={handleSubmit} className="customer-form">
        {/* Basic Information Section */}
        <div className="form-section">
          <div className="form-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="8.5" cy="7" r="4" />
            </svg>
            Basic Information
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Customer Name *</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="Enter customer name"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Customer Type *</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({...formData, type: e.target.value})}
                required
              >
                <option value="">Select Type...</option>
                {customerTypes.map(type => (
                  <option key={type.id} value={type.code}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="form-group">
              <label>Contact Person</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input
                  type="text"
                  value={formData.contactPerson}
                  onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                  placeholder="Enter contact person name"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Phone Number *</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                </svg>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+968 XXXX XXXX"
                  required
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Email Address</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="customer@example.com"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>{t('vatRegistrationNumber')}</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14,2 14,8 20,8" />
                  <line x1="16" y1="13" x2="8" y2="13" />
                  <line x1="16" y1="17" x2="8" y2="17" />
                  <polyline points="10,9 9,9 8,9" />
                </svg>
                <input
                  type="text"
                  value={formData.vatRegistrationNumber}
                  onChange={(e) => setFormData({...formData, vatRegistrationNumber: e.target.value})}
                  placeholder="OM12345678901"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Information Section */}
        <div className="form-section">
          <div className="form-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Address Information
          </div>
          <div className="form-grid">
            <div className="form-group full-width">
              <label>Street Address</label>
              <input
                type="text"
                value={formData.street}
                onChange={(e) => setFormData({...formData, street: e.target.value})}
                placeholder="Enter street address"
              />
            </div>
            
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => setFormData({...formData, city: e.target.value})}
                placeholder="Enter city"
              />
            </div>
            
            <div className="form-group">
              <label>Region</label>
              <input
                type="text"
                value={formData.region}
                onChange={(e) => setFormData({...formData, region: e.target.value})}
                placeholder="Enter region/governorate"
              />
            </div>
          </div>
        </div>

        {/* Business Terms Section */}
        <div className="form-section">
          <div className="form-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="1" x2="12" y2="23" />
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Business Terms
          </div>
          <div className="form-grid">
            <div className="form-group">
              <label>Credit Limit (OMR)</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.creditLimit}
                  onChange={(e) => setFormData({...formData, creditLimit: e.target.value})}
                  placeholder="0.00"
                />
              </div>
            </div>
            
            <div className="form-group">
              <label>Payment Terms (days)</label>
              <div className="input-with-icon">
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12,6 12,12 16,14" />
                </svg>
                <input
                  type="number"
                  min="0"
                  value={formData.paymentTerms}
                  onChange={(e) => setFormData({...formData, paymentTerms: e.target.value})}
                  placeholder="30"
                />
              </div>
            </div>
          </div>

          {/* Tax Status */}
          <div className="form-group full-width" style={{ marginTop: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={formData.isTaxable}
                onChange={(e) => setFormData({...formData, isTaxable: e.target.checked})}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <span>Customer is Taxable (Apply VAT on sales)</span>
            </label>
            <small style={{ color: '#666', marginLeft: '26px', display: 'block', marginTop: '4px' }}>
              If unchecked, no VAT will be applied to this customer's sales orders
            </small>
          </div>
        </div>

        {/* Contract Terms Section - Only for Contract Customers */}
        {formData.type === 'contract' && (
          <div className="contract-terms-section">
            <div className="form-section-title">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14,2 14,8 20,8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10,9 9,9 8,9" />
              </svg>
              Contract Terms & Conditions
            </div>
            <div className="form-group full-width">
              <label>Special Terms & Conditions</label>
              <textarea
                value={formData.specialTerms}
                onChange={(e) => setFormData({...formData, specialTerms: e.target.value})}
                rows="4"
                placeholder="Enter special contract terms, pricing agreements, delivery conditions, payment terms, etc..."
              />
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onCancel}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {customer ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </form>
    </Modal>
  )
}

// Customer Details Modal Component
const CustomerDetailsModal = ({ customer, onClose, onEdit, onCreateOrder, t }) => {
  return (
    <Modal
      isOpen={true}
      title={`Customer Details - ${customer.name}`}
      onClose={onClose}
      className="modal-xl"
      closeOnOverlayClick={false}
    >
      <div className="view-modal-content">
        <div className="form-section">
          <div className="form-section-title">
            Basic Information
            <span className={`badge ${customer.isActive ? 'active' : 'inactive'}`}>
              {customer.isActive ? 'Active' : 'Inactive'}
            </span>
          </div>
          <div className="details-grid two-col">
            <div className="detail-item">
              <label>Customer Name</label>
              <span>{customer.name}</span>
            </div>
            <div className="detail-item">
              <label>Customer Code</label>
              <span>{customer.code}</span>
            </div>
            <div className="detail-item">
              <label>Customer Type</label>
              <span className="badge">{customer.type ? customer.type.replace('_', ' ').toUpperCase() : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Contact Information</div>
          <div className="details-grid two-col">
            <div className="detail-item">
              <label>Contact Person</label>
              <span>{customer.contactPerson || 'N/A'}</span>
            </div>
            <div className="detail-item">
              <label>Phone</label>
              <span>{customer.contact?.phone || 'N/A'}</span>
            </div>
            <div className="detail-item full-width">
              <label>Email</label>
              <span>{customer.contact?.email || 'N/A'}</span>
            </div>
            <div className="detail-item full-width">
              <label>{t('vatRegistrationNumber')}</label>
              <span>{customer.contact?.vatRegistrationNumber || 'N/A'}</span>
            </div>
            <div className="detail-item full-width">
              <label>Address</label>
              <span>
                {customer.contact?.address ? 
                  `${customer.contact.address.street}, ${customer.contact.address.city}, ${customer.contact.address.region}` 
                  : 'N/A'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">Business Terms</div>
          <div className="details-grid two-col">
            <div className="detail-item">
              <label>Credit Limit</label>
              <span className="highlight">OMR {customer.creditLimit?.toFixed(2) || '0.00'}</span>
            </div>
            <div className="detail-item">
              <label>Payment Terms</label>
              <span>{customer.paymentTerms || 0} days</span>
            </div>
            <div className="detail-item">
              <label>Tax Status</label>
              <span className={`badge ${customer.is_taxable !== false ? 'success' : 'secondary'}`}>
                {customer.is_taxable !== false ? '✓ Taxable (VAT Applied)' : '✗ Non-Taxable (No VAT)'}
              </span>
            </div>
          </div>
        </div>

        {customer.salesHistory && (
          <div className="form-section">
            <div className="form-section-title">Sales History</div>
            <div className="details-grid three-col">
              <div className="detail-item text-center">
                <label>Total Orders</label>
                <span className="highlight large">{customer.salesHistory.totalOrders}</span>
              </div>
              <div className="detail-item text-center">
                <label>Total Value</label>
                <span className="highlight large">OMR {customer.salesHistory.totalValue?.toFixed(2) || '0.00'}</span>
              </div>
              <div className="detail-item text-center">
                <label>Last Order Date</label>
                <span>
                  {customer.salesHistory.lastOrderDate ? 
                    new Date(customer.salesHistory.lastOrderDate).toLocaleDateString() 
                    : 'No orders yet'
                  }
                </span>
              </div>
            </div>
          </div>
        )}

        {customer.type === 'contract' && customer.contractDetails && (
          <div className="form-section contract-section">
            <div className="form-section-title">Contract Information</div>
            <div className="details-grid two-col">
              <div className="detail-item">
                <label>Contract ID</label>
                <span>{customer.contractDetails.contractId}</span>
              </div>
              <div className="detail-item">
                <label>Contract Status</label>
                <span className={`badge ${customer.contractDetails.status}`}>
                  {customer.contractDetails.status.toUpperCase()}
                </span>
              </div>
              <div className="detail-item full-width">
                <label>Contract Period</label>
                <span>
                  {new Date(customer.contractDetails.startDate).toLocaleDateString()} - 
                  {new Date(customer.contractDetails.endDate).toLocaleDateString()}
                </span>
              </div>
              {customer.contractDetails.specialTerms && (
                <div className="detail-item full-width">
                  <label>Special Terms</label>
                  <p className="terms-text">{customer.contractDetails.specialTerms}</p>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="form-actions">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
          <button className="btn btn-secondary" onClick={onEdit}>
            Edit Customer
          </button>
          <button className="btn btn-primary" onClick={onCreateOrder}>
            Create Order
          </button>
        </div>
      </div>
    </Modal>
  )
}

// Contract Details Modal Component
const ContractDetailsModal = ({ customer, onClose, onEdit }) => {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Early validation
  if (!customer) {
    console.error('ContractDetailsModal: customer prop is missing')
    return null
  }

  const contract = customer.contractDetails
  
  useEffect(() => {
    // Load materials for contract rates
    const loadMaterials = async () => {
      try {
        console.log('ContractDetailsModal - Loading materials for contract modal...')
        console.log('Customer:', customer?.name, 'Contract ID:', contract?.contractId)
        setLoading(true)
        setError(null)
        
        const result = await materialService.getAll()
        if (!result.success) {
          throw new Error(result.error || 'Failed to fetch materials')
        }
        const companyMaterials = result.data || []
        console.log('Materials loaded:', companyMaterials.length, 'items')
        console.log('Contract rates available for:', Object.keys(contract?.rates || {}))
        setMaterials(companyMaterials)
      } catch (error) {
        console.error('Error loading materials:', error)
        setError(error.message)
        setMaterials([])
      } finally {
        setLoading(false)
      }
    }
    
    if (contract) {
      loadMaterials()
    } else {
      setLoading(false)
    }
  }, [customer, contract])

  if (!contract) {
    console.log('No contract details found for customer:', customer?.name)
    return (
      <Modal
        isOpen={true}
        title="Contract Details - No Contract Found"
        onClose={onClose}
        className="modal-lg"
        closeOnOverlayClick={false}
      >
        <div className="view-modal-content">
          <div className="empty-rates">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <h3>No Contract Found</h3>
            <p>This customer doesn't have contract details available.</p>
          </div>
          <div className="form-actions">
            <button className="btn btn-outline" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal
      isOpen={true}
      title={`Contract Details - ${contract.contractId}`}
      onClose={onClose}
      className="modal-xxl"
      closeOnOverlayClick={false}
    >
      <div className="view-modal-content">
        {loading && (
          <div className="loading-section">
            <div className="loading-spinner"></div>
            <p>Loading contract details...</p>
          </div>
        )}
        {error && (
          <div className="error-section">
            <div className="empty-rates">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3>Error Loading Contract Details</h3>
              <p>Failed to load materials data: {error}</p>
            </div>
            <div className="form-actions">
              <button className="btn btn-outline" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-primary" onClick={() => window.location.reload()}>
                Retry
              </button>
            </div>
          </div>
        )}
        {!loading && !error && (
          <>
            <div className="form-section">
          <div className="form-section-title">Contract Information</div>
          <div className="details-grid three-col">
            <div className="detail-item">
              <label>Customer</label>
              <span>{customer.name}</span>
            </div>
            <div className="detail-item">
              <label>Contract ID</label>
              <span>{contract.contractId}</span>
            </div>
            <div className="detail-item">
              <label>Status</label>
              <span className={`badge ${contract.status}`}>{contract.status.toUpperCase()}</span>
            </div>
            <div className="detail-item">
              <label>Start Date</label>
              <span>{new Date(contract.startDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>End Date</label>
              <span>{new Date(contract.endDate).toLocaleDateString()}</span>
            </div>
            <div className="detail-item">
              <label>Days Remaining</label>
              <span className="highlight">{Math.max(0, Math.ceil((new Date(contract.endDate) - new Date()) / (1000 * 60 * 60 * 24)))} days</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <div className="form-section-title">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5Z"/>
              <path d="M12 5L8 21l4-7 4 7-4-16"/>
            </svg>
            Material Rates
          </div>
          
          {materials.length > 0 && contract.rates && Object.keys(contract.rates).length > 0 ? (
            <div className="rates-section">
              <table className="rates-table">
                <thead>
                  <tr>
                    <th>Material</th>
                    <th>Standard Rate</th>
                    <th>Contract Rate</th>
                    <th>Discount</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.filter(m => contract.rates?.[m.id]).map(material => {
                    const contractRateInfo = contract.rates[material.id]
                    const standardRate = material.standardPrice || 0
                    
                    // Calculate actual contract rate based on type
                    let actualContractRate = 0
                    if (contractRateInfo.type === 'fixed_rate') {
                      actualContractRate = contractRateInfo.contractRate
                    } else if (contractRateInfo.type === 'discount_percentage') {
                      actualContractRate = standardRate * (1 - contractRateInfo.discountPercentage / 100)
                    } else if (contractRateInfo.type === 'minimum_price_guarantee') {
                      actualContractRate = Math.min(standardRate, contractRateInfo.contractRate)
                    }
                    
                    const savings = standardRate > 0 ? ((standardRate - actualContractRate) / standardRate * 100).toFixed(1) : '0.0'
                    
                    return (
                      <tr key={material.id}>
                        <td>
                          <div className="material-info">
                            <span className="material-name">{material.name}</span>
                            <span className="material-unit">per {material.unit}</span>
                          </div>
                        </td>
                        <td className="rate-cell standard">
                          <span className="currency">OMR</span>
                          <span className="amount">{standardRate.toFixed(3)}</span>
                        </td>
                        <td className="rate-cell contract">
                          <span className="currency">OMR</span>
                          <span className="amount">{actualContractRate.toFixed(3)}</span>
                        </td>
                        <td className="discount-cell">
                          <div className={`discount-badge ${parseFloat(savings) >= 10 ? 'high' : parseFloat(savings) >= 5 ? 'medium' : 'low'}`}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"></polyline>
                              <polyline points="16 7 22 7 22 13"></polyline>
                            </svg>
                            {savings}%
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="4" className="rates-summary">
                      <div className="summary-content">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10"/>
                          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/>
                          <path d="M12 18V6"/>
                        </svg>
                        <span>{materials.filter(m => contract.rates?.[m.id]).length} materials with special pricing</span>
                      </div>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="empty-rates">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3>No Special Rates Configured</h3>
              <p>This contract doesn't have any special material rates. Standard pricing will apply.</p>
            </div>
          )}
        </div>

        {contract.specialTerms && (
          <div className="form-section">
            <div className="form-section-title">Special Terms & Conditions</div>
            <p className="terms-text">{contract.specialTerms}</p>
          </div>
        )}
        
            <div className="form-actions">
              <button className="btn btn-outline" onClick={onClose}>
                Close
              </button>
              <button className="btn btn-secondary" onClick={() => {
                console.log('Edit contract clicked for customer:', customer.name)
                onEdit()
              }}>
                Edit Contract
              </button>
              <button className="btn btn-warning">
                Renew Contract
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  )
}

// Contract Edit Modal Component
const ContractEditModal = ({ customer, onClose, onSave }) => {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [formData, setFormData] = useState({
    contractId: customer?.contractDetails?.contractId || '',
    startDate: customer?.contractDetails?.startDate || '',
    endDate: customer?.contractDetails?.endDate || '',
    status: customer?.contractDetails?.status || 'active',
    specialTerms: customer?.contractDetails?.specialTerms || '',
    rates: customer?.contractDetails?.rates || {}
  })

  useEffect(() => {
    const loadMaterials = async () => {
      try {
        const result = await materialService.getAll()
        const companyMaterials = result.success ? (result.data || []) : []
        setMaterials(companyMaterials)
      } catch (error) {
        console.error('Error loading materials:', error)
      } finally {
        setLoading(false)
      }
    }
    loadMaterials()
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  const handleRateChange = (materialId, field, value) => {
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [materialId]: {
          ...prev.rates[materialId],
          [field]: value
        }
      }
    }))
  }

  const addMaterialRate = (materialId) => {
    setFormData(prev => ({
      ...prev,
      rates: {
        ...prev.rates,
        [materialId]: {
          type: 'fixed_rate',
          contractRate: 0,
          startDate: prev.startDate,
          endDate: prev.endDate,
          status: 'active',
          description: ''
        }
      }
    }))
  }

  const removeMaterialRate = (materialId) => {
    setFormData(prev => ({
      ...prev,
      rates: Object.fromEntries(
        Object.entries(prev.rates).filter(([key]) => key !== materialId)
      )
    }))
  }

  if (loading) {
    return (
      <Modal isOpen={true} title="Edit Contract" onClose={onClose} className="modal-xxl" closeOnOverlayClick={false}>
        <div className="loading-section">
          <div className="loading-spinner"></div>
          <p>Loading contract editor...</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={true} title={`Edit Contract - ${customer.name}`} onClose={onClose} className="modal-xxl" closeOnOverlayClick={false}>
      <form onSubmit={handleSubmit} className="view-modal-content">
        {/* Contract Basic Information */}
        <div className="form-section">
          <div className="form-section-title">Contract Information</div>
          <div className="form-grid">
            <div className="form-group">
              <label>Contract ID</label>
              <input
                type="text"
                value={formData.contractId}
                onChange={(e) => setFormData({...formData, contractId: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({...formData, status: e.target.value})}
              >
                <option value="active">Active</option>
                <option value="expired">Expired</option>
                <option value="suspended">Suspended</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                required
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={formData.endDate}
                onChange={(e) => setFormData({...formData, endDate: e.target.value})}
                required
              />
            </div>
          </div>
        </div>

        {/* Special Terms */}
        <div className="form-section">
          <div className="form-section-title">Special Terms & Conditions</div>
          <div className="form-group full-width">
            <label>Contract Terms</label>
            <textarea
              value={formData.specialTerms}
              onChange={(e) => setFormData({...formData, specialTerms: e.target.value})}
              rows="3"
              placeholder="Enter special contract terms, conditions, and notes..."
            />
          </div>
        </div>

        {/* Material Rates */}
        <div className="form-section">
          <div className="form-section-title">
            Material Rates
            <select
              onChange={(e) => {
                if (e.target.value) {
                  addMaterialRate(e.target.value)
                  e.target.value = ''
                }
              }}
              className="btn btn-outline btn-sm"
            >
              <option value="">Add Material Rate...</option>
              {materials
                .filter(m => !formData.rates[m.id])
                .map(material => (
                  <option key={material.id} value={material.id}>
                    {material.name}
                  </option>
                ))
              }
            </select>
          </div>

          {Object.keys(formData.rates).length > 0 ? (
            <div className="rates-editor">
              {Object.entries(formData.rates).map(([materialId, rateInfo]) => {
                const material = materials.find(m => m.id === materialId)
                if (!material) return null

                return (
                  <div key={materialId} className="rate-item">
                    <div className="rate-header">
                      <h4>{material.name}</h4>
                      <button
                        type="button"
                        className="btn btn-outline btn-sm"
                        onClick={() => removeMaterialRate(materialId)}
                      >
                        Remove
                      </button>
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label>Rate Type</label>
                        <select
                          value={rateInfo.type}
                          onChange={(e) => handleRateChange(materialId, 'type', e.target.value)}
                        >
                          <option value="fixed_rate">Fixed Rate</option>
                          <option value="discount_percentage">Discount Percentage</option>
                          <option value="minimum_price_guarantee">Minimum Price Guarantee</option>
                        </select>
                      </div>
                      <div className="form-group">
                        <label>
                          {rateInfo.type === 'fixed_rate' ? 'Contract Rate (OMR)' :
                           rateInfo.type === 'discount_percentage' ? 'Discount (%)' :
                           'Maximum Rate (OMR)'}
                        </label>
                        <input
                          type="number"
                          step="0.001"
                          value={rateInfo.type === 'discount_percentage' ? rateInfo.discountPercentage : rateInfo.contractRate}
                          onChange={(e) => handleRateChange(
                            materialId, 
                            rateInfo.type === 'discount_percentage' ? 'discountPercentage' : 'contractRate', 
                            parseFloat(e.target.value)
                          )}
                        />
                      </div>
                      <div className="form-group full-width">
                        <label>Description</label>
                        <input
                          type="text"
                          value={rateInfo.description}
                          onChange={(e) => handleRateChange(materialId, 'description', e.target.value)}
                          placeholder="Rate description..."
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="empty-rates">
              <p>No material rates configured. Use the dropdown above to add rates.</p>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            Update Contract
          </button>
        </div>
      </form>
    </Modal>
  )
}

export default OilTradingCustomers