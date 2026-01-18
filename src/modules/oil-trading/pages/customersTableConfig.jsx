/**
 * Customers Table Configuration
 *
 * Defines table columns for the customers DataTable.
 * Extracted from main component to improve readability.
 */

import React from 'react'
import { Eye, Edit, ShoppingCart, FileText, Trash2, RotateCcw, Phone, Mail } from 'lucide-react'
import PermissionGate from '../../../components/PermissionGate'
import { PERMISSIONS } from '../../../config/roles'

/**
 * Generate table columns with event handlers
 *
 * @param {Object} config - Column configuration
 * @param {Function} config.t - Translation function
 * @param {Array} config.customerTypes - Available customer types
 * @param {Function} config.onViewDetails - View details handler
 * @param {Function} config.onCreateOrder - Create order handler
 * @param {Function} config.onViewContract - View contract handler
 * @param {Function} config.onEdit - Edit customer handler
 * @param {Function} config.onDelete - Delete customer handler
 * @param {Function} config.onReactivate - Reactivate customer handler
 * @returns {Array} Column definitions for DataTable
 */
export const getTableColumns = ({
  t,
  customerTypes,
  onViewDetails,
  onCreateOrder,
  onViewContract,
  onEdit,
  onDelete,
  onReactivate
}) => [
  {
    key: 'name',
    header: t('customerName'),
    sortable: true,
    filterable: true,
    render: (value, row) => (
      <div className="cell-row">
        <CustomerAvatar name={value} />
        <div className="cell-info">
          <span className="cell-text">{value}</span>
          <span className="cell-code">{row.code}</span>
        </div>
      </div>
    )
  },
  {
    key: 'type',
    header: t('type'),
    sortable: true,
    filterable: true,
    // Explicit filter options to ensure all types show even if no customers exist
    filterOptions: [
      { value: 'individual', label: 'Individual' },
      { value: 'business', label: 'Business' },
      { value: 'project', label: 'Project' },
      { value: 'contract', label: 'Contract' }
    ],
    render: (value) => {
      const typeObj = customerTypes.find(type => type.code === value)
      return (
        <span className="status-badge">
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
      <div className="cell-icon">
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
      <div className="cell-icon">
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
      <div className="cell-info" style={{ alignItems: 'flex-end' }}>
        <span className="cell-number">
          OMR {(row.salesHistory?.totalValue || 0).toFixed(2)}
        </span>
        <span className="cell-text-secondary">
          {row.salesHistory?.totalOrders || 0} {t('orders')}
        </span>
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
    width: '240px',
    render: (value, row) => (
      <CustomerActions
        customer={row}
        onViewDetails={onViewDetails}
        onCreateOrder={onCreateOrder}
        onViewContract={onViewContract}
        onEdit={onEdit}
        onDelete={onDelete}
        onReactivate={onReactivate}
        t={t}
      />
    )
  }
]

/**
 * Customer avatar with initials
 */
const CustomerAvatar = ({ name }) => {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .substring(0, 2)
    .toUpperCase()

  return <div className="cell-avatar">{initials}</div>
}

/**
 * Action buttons for customer row
 */
const CustomerActions = ({
  customer,
  onViewDetails,
  onCreateOrder,
  onViewContract,
  onEdit,
  onDelete,
  onReactivate,
  t
}) => {
  // Prevent row click when clicking action buttons
  const handleClick = (handler) => (e) => {
    e.stopPropagation()
    handler(customer)
  }

  return (
    <div className="table-actions">
      {/* View Details */}
      <PermissionGate permission={PERMISSIONS.VIEW_CUSTOMERS}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleClick(onViewDetails)}
          title={t('viewDetails')}
        >
          <Eye size={14} />
        </button>
      </PermissionGate>

      {/* Create Order */}
      <PermissionGate permission={PERMISSIONS.CREATE_SALES}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleClick(onCreateOrder)}
          disabled={!customer.isActive}
          title={t('createOrder')}
        >
          <ShoppingCart size={14} />
        </button>
      </PermissionGate>

      {/* View Contract (only for contract customers) */}
      {customer.type === 'contract' && customer.contractDetails && (
        <PermissionGate permission={PERMISSIONS.VIEW_CONTRACTS}>
          <button
            className="btn btn-outline btn-sm"
            onClick={handleClick(onViewContract)}
            title={t('viewContract')}
          >
            <FileText size={14} />
          </button>
        </PermissionGate>
      )}

      {/* Edit (permission required) */}
      <PermissionGate permission={PERMISSIONS.MANAGE_CUSTOMERS}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleClick(onEdit)}
          title={t('edit')}
        >
          <Edit size={14} />
        </button>
      </PermissionGate>

      {/* Delete (permission required, only for active customers) */}
      {customer.isActive && (
        <PermissionGate permission={PERMISSIONS.MANAGE_CUSTOMERS}>
          <button
            className="btn btn-danger btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              onDelete(customer.id)
            }}
            title={t('delete')}
          >
            <Trash2 size={14} />
          </button>
        </PermissionGate>
      )}

      {/* Reactivate (permission required, only for inactive customers) */}
      {!customer.isActive && (
        <PermissionGate permission={PERMISSIONS.MANAGE_CUSTOMERS}>
          <button
            className="btn btn-outline btn-sm"
            onClick={(e) => {
              e.stopPropagation()
              if (window.confirm(`Reactivate customer "${customer.name}"?`)) {
                onReactivate(customer.id)
              }
            }}
            title={t('reactivate')}
          >
            <RotateCcw size={14} />
          </button>
        </PermissionGate>
      )}
    </div>
  )
}

export default getTableColumns
