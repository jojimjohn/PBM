/**
 * Oil Trading Customers Page
 *
 * Main customer management page with table view and modal dialogs.
 * Refactored to use custom hooks and composed components.
 * Updated to use showToast and ConfirmDialog instead of native dialogs.
 *
 * Architecture:
 * - useCustomers hook: CRUD operations with cache invalidation
 * - Modals extracted to separate components
 * - Table columns defined as configuration
 */

import React, { useState, useEffect } from 'react'
import { useLocalization } from '../../../context/LocalizationContext'
import { usePermissions } from '../../../hooks/usePermissions'
import DataTable from '../../../components/ui/DataTable'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AlertDialog from '../../../components/ui/AlertDialog'
import showToast from '../../../components/ui/Toast'
import typesService from '../../../services/typesService'
import { useCustomers } from '../hooks/useCustomers'
import {
  CustomerFormModal,
  CustomerDetailsModal,
  ContractDetailsModal,
  ContractEditModal
} from '../components/customers'
import { getTableColumns } from './customersTableConfig'
import '../styles/Customers.css'

/**
 * @typedef {import('../types/customer.types').Customer} Customer
 */

const OilTradingCustomers = () => {
  const { t } = useLocalization()
  const { canEdit, canDelete, hasPermission } = usePermissions()

  // Customer data and operations from hook
  const {
    customers,
    loading,
    createCustomer,
    updateCustomer,
    deleteCustomer,
    toggleCustomerStatus,
    updateLocalCustomer
  } = useCustomers()

  // Customer types from database
  const [customerTypes, setCustomerTypes] = useState([])

  // Modal states - only one can be open at a time
  const [showAddForm, setShowAddForm] = useState(false)
  /** @type {[Customer|null, Function]} */
  const [editingCustomer, setEditingCustomer] = useState(null)
  /** @type {[Customer|null, Function]} */
  const [viewingCustomer, setViewingCustomer] = useState(null)
  /** @type {[Customer|null, Function]} */
  const [viewingContract, setViewingContract] = useState(null)
  /** @type {[Customer|null, Function]} */
  const [editingContract, setEditingContract] = useState(null)

  // Dialog states
  const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, customerId: null, action: null })
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', variant: 'info' })

  // Load customer types on mount
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

  // ─────────────────────────────────────────────────────────────────────────────
  // Event Handlers
  // ─────────────────────────────────────────────────────────────────────────────

  const handleAddCustomer = async (customerData) => {
    const result = await createCustomer(customerData)
    if (result.success) {
      setShowAddForm(false)
      showToast.success(t('customerCreated', 'Customer created successfully'))
    } else {
      showToast.error(result.error || t('errorCreatingCustomer', 'Error creating customer'))
    }
  }

  const handleEditCustomer = async (customerId, customerData) => {
    const result = await updateCustomer(customerId, customerData)
    if (result.success) {
      setEditingCustomer(null)
      showToast.success(t('customerUpdated', 'Customer updated successfully'))
    } else {
      showToast.error(result.error || t('errorUpdatingCustomer', 'Error updating customer'))
    }
  }

  const handleDeleteCustomer = async (customerId) => {
    // Show delete confirmation dialog
    setConfirmDialog({
      isOpen: true,
      customerId,
      action: 'delete'
    })
  }

  const handleDeleteConfirm = async () => {
    const { customerId } = confirmDialog
    setConfirmDialog({ isOpen: false, customerId: null, action: null })

    const result = await deleteCustomer(customerId)

    if (result.success) {
      showToast.success(t('customerDeleted', 'Customer deleted successfully'))
      return
    }

    // Offer deactivation if customer has existing orders
    if (result.shouldDeactivate) {
      setConfirmDialog({
        isOpen: true,
        customerId,
        action: 'deactivate'
      })
    } else {
      showToast.error(result.error || t('errorDeletingCustomer', 'Error deleting customer'))
    }
  }

  const handleDeactivateConfirm = async () => {
    const { customerId } = confirmDialog
    setConfirmDialog({ isOpen: false, customerId: null, action: null })

    const result = await toggleCustomerStatus(customerId)
    if (result.success) {
      showToast.success(t('customerDeactivated', 'Customer deactivated successfully'))
    } else {
      showToast.error(result.error || t('errorDeactivatingCustomer', 'Error deactivating customer'))
    }
  }

  const handleToggleStatus = async (customerId) => {
    const result = await toggleCustomerStatus(customerId)
    if (result.success) {
      showToast.success(t('statusUpdated', 'Customer status updated'))
    } else {
      showToast.error(result.error || t('errorUpdatingStatus', 'Error updating customer status'))
    }
  }

  const handleViewDetails = (customer) => {
    setViewingCustomer(customer)
  }

  const handleCreateOrder = (customer) => {
    // Store customer for cross-module integration
    sessionStorage.setItem('selectedCustomerForOrder', JSON.stringify(customer))
    window.location.href = '/sales'
  }

  const handleViewContract = (customer) => {
    if (customer?.contractDetails) {
      setViewingContract(customer)
    } else {
      setAlertDialog({
        isOpen: true,
        title: t('noContract', 'No Contract'),
        message: t('noContractDetails', 'This customer does not have contract details available.'),
        variant: 'info'
      })
    }
  }

  const handleSaveContract = (contractData) => {
    if (!editingContract) return

    // Update local state optimistically
    updateLocalCustomer(editingContract.id, { contractDetails: contractData })
    setEditingContract(null)
    showToast.success(t('contractUpdated', 'Contract updated successfully'))
  }

  // Handle confirm dialog action
  const handleConfirmAction = () => {
    if (confirmDialog.action === 'delete') {
      handleDeleteConfirm()
    } else if (confirmDialog.action === 'deactivate') {
      handleDeactivateConfirm()
    }
  }

  // Get confirm dialog content
  const getConfirmDialogContent = () => {
    const { action } = confirmDialog

    if (action === 'delete') {
      return {
        title: t('confirmDelete', 'Confirm Delete'),
        message: t('confirmDeleteCustomer', 'Are you sure you want to delete this customer?'),
        variant: 'danger',
        confirmText: t('delete', 'Delete')
      }
    }

    if (action === 'deactivate') {
      return {
        title: t('deactivateCustomer', 'Deactivate Customer'),
        message: t('deactivateCustomerMessage', 'This customer has existing orders and cannot be deleted.\n\nWould you like to deactivate this customer instead?\n\nDeactivated customers will not appear in active lists but their order history will be preserved.'),
        variant: 'warning',
        confirmText: t('deactivate', 'Deactivate')
      }
    }

    return { title: '', message: '', variant: 'default', confirmText: t('confirm', 'Confirm') }
  }

  const dialogContent = getConfirmDialogContent()

  // ─────────────────────────────────────────────────────────────────────────────
  // Table Configuration
  // ─────────────────────────────────────────────────────────────────────────────

  const columns = getTableColumns({
    t,
    customerTypes,
    canEdit,
    canDelete,
    onViewDetails: handleViewDetails,
    onCreateOrder: handleCreateOrder,
    onViewContract: handleViewContract,
    onEdit: setEditingCustomer,
    onDelete: handleDeleteCustomer,
    onReactivate: handleToggleStatus
  })

  // ─────────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="oil-customers-page">
      <div className="customers-content">
        <DataTable
          data={customers}
          columns={columns}
          title={t('customerManagement')}
          subtitle={`${t('customerSubtitle')} - ${customers.length} ${t('customers')}`}
          headerActions={
            hasPermission('MANAGE_CUSTOMERS') && (
              <AddCustomerButton onClick={() => setShowAddForm(true)} t={t} />
            )
          }
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

      {/* Add Customer Modal */}
      {showAddForm && (
        <CustomerFormModal
          customer={null}
          onSave={handleAddCustomer}
          onCancel={() => setShowAddForm(false)}
          t={t}
        />
      )}

      {/* Edit Customer Modal */}
      {editingCustomer && (
        <CustomerFormModal
          customer={editingCustomer}
          onSave={(data) => handleEditCustomer(editingCustomer.id, data)}
          onCancel={() => setEditingCustomer(null)}
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
          onSave={handleSaveContract}
        />
      )}

      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ isOpen: false, customerId: null, action: null })}
        onConfirm={handleConfirmAction}
        title={dialogContent.title}
        message={dialogContent.message}
        variant={dialogContent.variant}
        confirmText={dialogContent.confirmText}
        cancelText={t('cancel', 'Cancel')}
        t={t}
      />

      {/* Alert Dialog */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', variant: 'info' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        t={t}
      />
    </div>
  )
}

/**
 * Add Customer button with icon
 */
const AddCustomerButton = ({ onClick, t }) => (
  <button className="btn btn-primary" onClick={onClick}>
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="8.5" cy="7" r="4" />
      <line x1="20" y1="8" x2="20" y2="14" />
      <line x1="23" y1="11" x2="17" y2="11" />
    </svg>
    {t('addCustomer')}
  </button>
)

export default OilTradingCustomers
