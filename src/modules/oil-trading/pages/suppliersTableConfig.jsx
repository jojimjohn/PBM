/**
 * Suppliers Table Configuration
 *
 * Defines table columns for the suppliers DataTable.
 * Extracted from main component to improve readability.
 */

import React from 'react'
import { Eye, Edit, Trash2, Phone, MapPin, User } from 'lucide-react'
import PermissionGate from '../../../components/PermissionGate'
import { PERMISSIONS } from '../../../config/roles'

/**
 * @typedef {import('../types/supplier.types').Supplier} Supplier
 * @typedef {import('../types/supplier.types').SupplierType} SupplierType
 */

/**
 * Supplier avatar with initials
 * @param {Object} props
 * @param {string} props.name - Supplier name
 */
const SupplierAvatar = ({ name }) => {
  const initials = name
    .substring(0, 2)
    .toUpperCase()

  return <div className="cell-avatar">{initials}</div>
}

/**
 * Action buttons for supplier row
 */
const SupplierActions = ({
  supplier,
  onViewDetails,
  onEdit,
  onDelete,
  t
}) => {
  // Prevent row click when clicking action buttons
  const handleClick = (handler) => (e) => {
    e.stopPropagation()
    handler(supplier)
  }

  return (
    <div className="table-actions">
      <PermissionGate permission={PERMISSIONS.VIEW_SUPPLIERS}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleClick(onViewDetails)}
          title={t('viewDetails')}
        >
          <Eye size={14} />
        </button>
      </PermissionGate>

      <PermissionGate permission={PERMISSIONS.MANAGE_SUPPLIERS}>
        <button
          className="btn btn-outline btn-sm"
          onClick={handleClick(onEdit)}
          title={t('edit')}
        >
          <Edit size={14} />
        </button>
      </PermissionGate>

      <PermissionGate permission={PERMISSIONS.MANAGE_SUPPLIERS}>
        <button
          className="btn btn-danger btn-sm"
          onClick={(e) => {
            e.stopPropagation()
            onDelete(supplier.id)
          }}
          title={t('delete')}
        >
          <Trash2 size={14} />
        </button>
      </PermissionGate>
    </div>
  )
}

/**
 * Generate table columns with event handlers
 *
 * @param {Object} config - Column configuration
 * @param {Function} config.t - Translation function
 * @param {SupplierType[]} config.supplierTypes - Available supplier types
 * @param {Function} config.onViewDetails - View details handler
 * @param {Function} config.onEdit - Edit supplier handler
 * @param {Function} config.onDelete - Delete supplier handler
 * @returns {Array} Column definitions for DataTable
 */
export const getTableColumns = ({
  t,
  supplierTypes,
  onViewDetails,
  onEdit,
  onDelete
}) => [
  {
    key: 'code',
    header: t('supplierCode'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <span className="cell-code accent">{value}</span>
    )
  },
  {
    key: 'name',
    header: t('supplierName'),
    sortable: true,
    filterable: true,
    render: (value, row) => {
      const supplierType = supplierTypes.find(type => type.code === row.type)
      return (
        <div className="cell-row">
          <SupplierAvatar name={value} />
          <div className="cell-info">
            <span className="cell-text">{value}</span>
            <span className="cell-text-secondary">
              {supplierType?.name || row.type}
            </span>
          </div>
        </div>
      )
    }
  },
  {
    key: 'contactPerson',
    header: t('contactPerson'),
    sortable: true,
    render: (value) => (
      <div className="cell-icon">
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
      <div className="cell-icon">
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
      <div className="cell-icon">
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
    render: (value) => {
      const isActive = value === true || value === 1 || value === '1'
      return (
        <span className={`supplier-status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? 'Active' : 'Inactive'}
        </span>
      )
    }
  },
  {
    key: 'actions',
    header: t('actions'),
    sortable: false,
    render: (value, row) => (
      <SupplierActions
        supplier={row}
        onViewDetails={onViewDetails}
        onEdit={onEdit}
        onDelete={onDelete}
        t={t}
      />
    )
  }
]

export default getTableColumns
