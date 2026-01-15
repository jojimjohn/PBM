/**
 * Locations Table Configuration
 *
 * Defines table columns for the supplier locations DataTable.
 * Extracted from SupplierLocationManager for better separation of concerns.
 */

import React from 'react'
import { MapPin, Building, Phone, User, Edit, Trash2, RefreshCw } from 'lucide-react'

/**
 * Location avatar with map pin icon
 */
const LocationAvatar = () => (
  <div className="location-avatar">
    <MapPin size={16} />
  </div>
)

/**
 * Supplier avatar with initials
 * @param {Object} props
 * @param {string} props.name - Supplier name
 */
const SupplierAvatar = ({ name }) => {
  const initials = name ? name.substring(0, 2).toUpperCase() : '??'
  return <div className="supplier-avatar primary">{initials}</div>
}

/**
 * Action buttons for location row
 */
const LocationActions = ({
  location,
  onEdit,
  onDelete,
  onReactivate,
  t
}) => {
  const handleClick = (handler, param) => (e) => {
    e.stopPropagation()
    handler(param)
  }

  const isActive = location.isActive === true ||
                   location.isActive === 1 ||
                   location.isActive === '1'

  return (
    <div className="table-actions">
      <button
        className="btn btn-outline btn-sm"
        onClick={handleClick(onEdit, location)}
        title={t('edit', 'Edit')}
      >
        <Edit size={14} />
      </button>

      {isActive ? (
        <button
          className="btn btn-danger btn-sm"
          onClick={handleClick(onDelete, location)}
          title={t('delete', 'Delete')}
        >
          <Trash2 size={14} />
        </button>
      ) : (
        <button
          className="btn btn-outline btn-sm btn-success"
          onClick={handleClick(onReactivate, location)}
          title={t('reactivate', 'Reactivate')}
        >
          <RefreshCw size={14} />
        </button>
      )}
    </div>
  )
}

/**
 * Generate table columns with event handlers
 *
 * @param {Object} config - Column configuration
 * @param {Function} config.t - Translation function
 * @param {Function} config.onEdit - Edit location handler
 * @param {Function} config.onDelete - Delete location handler
 * @param {Function} config.onReactivate - Reactivate location handler
 * @returns {Array} Column definitions for DataTable
 */
export const getLocationColumns = ({
  t,
  onEdit,
  onDelete,
  onReactivate
}) => [
  {
    key: 'supplierName',
    header: t('supplier', 'Supplier'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <div className="supplier-info">
        <SupplierAvatar name={value} />
        <div className="supplier-details">
          <strong>{value || 'Unknown Supplier'}</strong>
        </div>
      </div>
    )
  },
  {
    key: 'locationCode',
    header: t('locationCode', 'Location Code'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <div className="location-code">
        <code>{value}</code>
      </div>
    )
  },
  {
    key: 'locationName',
    header: t('locationName', 'Location Name'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <div className="location-info">
        <LocationAvatar />
        <div className="location-details">
          <strong>{value}</strong>
        </div>
      </div>
    )
  },
  {
    key: 'address',
    header: t('address', 'Address'),
    sortable: false,
    render: (value) => (
      <div className="address-info">
        <Building size={14} />
        <span>{value || 'Not provided'}</span>
      </div>
    )
  },
  {
    key: 'regionName',
    header: t('region', 'Region'),
    sortable: true,
    render: (value, row) => (
      <div className="region-info">
        <MapPin size={14} />
        <span>
          {value ? `${value} - ${row.regionGovernorate}` : 'Not specified'}
        </span>
      </div>
    )
  },
  {
    key: 'contactPerson',
    header: t('contactPerson', 'Contact Person'),
    sortable: true,
    render: (value) => (
      <div className="contact-info">
        <User size={14} />
        <span>{value || 'Not specified'}</span>
      </div>
    )
  },
  {
    key: 'contactPhone',
    header: t('phone', 'Phone'),
    sortable: false,
    render: (value) => (
      <div className="phone-info">
        <Phone size={14} />
        <span>{value || 'Not provided'}</span>
      </div>
    )
  },
  {
    key: 'isActive',
    header: t('status', 'Status'),
    sortable: true,
    filterable: true,
    render: (value) => {
      const isActive = value === true || value === 1 || value === '1'
      return (
        <span className={`supplier-status-badge ${isActive ? 'active' : 'inactive'}`}>
          {isActive ? t('active', 'Active') : t('inactive', 'Inactive')}
        </span>
      )
    }
  },
  {
    key: 'actions',
    header: t('actions', 'Actions'),
    sortable: false,
    render: (value, row) => (
      <LocationActions
        location={row}
        onEdit={onEdit}
        onDelete={onDelete}
        onReactivate={onReactivate}
        t={t}
      />
    )
  }
]

export default getLocationColumns
