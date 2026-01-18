/**
 * Sales Orders Table Configuration
 *
 * Defines table columns for the sales orders DataTable.
 * Extracted from Sales.jsx for better separation of concerns.
 *
 * @module pages/salesOrdersTableConfig
 */

import React from 'react'
import {
  Eye,
  Edit,
  FileText,
  User,
  CheckCircle,
  Truck,
  XCircle,
  Trash2
} from 'lucide-react'

/**
 * @typedef {import('../types/sales.types').SalesOrder} SalesOrder
 * @typedef {import('../types/sales.types').SalesOrderStatus} SalesOrderStatus
 */

/**
 * Status transitions for order workflow
 */
export const STATUS_TRANSITIONS = {
  draft: ['confirmed', 'cancelled'],
  confirmed: ['delivered', 'cancelled'],
  delivered: ['cancelled'],
  cancelled: []
}

/**
 * Status display labels
 */
export const STATUS_LABELS = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  delivered: 'Delivered',
  cancelled: 'Cancelled'
}

/**
 * Get next possible status transitions for an order
 * @param {SalesOrderStatus} currentStatus - Current order status
 * @returns {SalesOrderStatus[]} Array of possible next statuses
 */
export const getNextStatuses = (currentStatus) => {
  return STATUS_TRANSITIONS[currentStatus] || []
}

/**
 * Check if order can be deleted
 * @param {SalesOrder} order - Order to check
 * @returns {boolean} True if order can be deleted
 */
export const canDeleteOrder = (order) => {
  return ['draft', 'cancelled'].includes(order.status)
}

/**
 * Order actions component
 */
const OrderActions = ({
  order,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onGenerateInvoice,
  t
}) => {
  const nextStatuses = getNextStatuses(order.status)
  const canDelete = canDeleteOrder(order)

  return (
    <div className="cell-actions">
      <button
        className="btn btn-outline btn-sm"
        title={t('view', 'View')}
        onClick={(e) => { e.stopPropagation(); onView(order) }}
      >
        <Eye size={14} />
      </button>

      <button
        className="btn btn-outline btn-sm"
        title={t('edit', 'Edit')}
        onClick={(e) => { e.stopPropagation(); onEdit(order) }}
      >
        <Edit size={14} />
      </button>

      {/* Quick Status Actions */}
      {order.status === 'draft' && (
        <button
          className="btn btn-primary btn-sm"
          title={t('confirm', 'Confirm')}
          onClick={(e) => { e.stopPropagation(); onStatusChange(order, 'confirmed') }}
        >
          <CheckCircle size={14} />
        </button>
      )}

      {order.status === 'confirmed' && (
        <button
          className="btn btn-success btn-sm"
          title={t('markDelivered', 'Mark Delivered')}
          onClick={(e) => { e.stopPropagation(); onStatusChange(order, 'delivered') }}
        >
          <Truck size={14} />
        </button>
      )}

      {nextStatuses.includes('cancelled') && !order.invoiceNumber && (
        <button
          className="btn btn-danger btn-sm"
          title={t('cancel', 'Cancel')}
          onClick={(e) => { e.stopPropagation(); onStatusChange(order, 'cancelled') }}
        >
          <XCircle size={14} />
        </button>
      )}

      {/* Delete Button - Only for draft/cancelled orders */}
      {canDelete && (
        <button
          className="btn btn-danger btn-sm"
          title={t('delete', 'Delete')}
          onClick={(e) => { e.stopPropagation(); onDelete(order) }}
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Invoice Actions */}
      {(order.status === 'confirmed' || order.status === 'delivered') && (
        order.invoiceNumber ? (
          <button
            className="btn btn-outline btn-success btn-sm"
            title={`Invoice: ${order.invoiceNumber}`}
            onClick={(e) => e.stopPropagation()}
          >
            <FileText size={14} />
          </button>
        ) : (
          <button
            className="btn btn-outline btn-sm"
            title={t('generateInvoice', 'Generate Invoice')}
            onClick={(e) => { e.stopPropagation(); onGenerateInvoice(order) }}
          >
            <FileText size={14} />
          </button>
        )
      )}
    </div>
  )
}

/**
 * Generate table columns for sales orders
 *
 * @param {Object} config - Column configuration
 * @param {Function} config.t - Translation function
 * @param {Function} config.formatDate - Date formatting function
 * @param {Function} config.onView - View order handler
 * @param {Function} config.onEdit - Edit order handler
 * @param {Function} config.onStatusChange - Status change handler
 * @param {Function} config.onDelete - Delete order handler
 * @param {Function} config.onGenerateInvoice - Generate invoice handler
 * @returns {Array} Column definitions for DataTable
 */
export const getSalesOrderColumns = ({
  t,
  formatDate,
  onView,
  onEdit,
  onStatusChange,
  onDelete,
  onGenerateInvoice
}) => [
  {
    key: 'orderNumber',
    header: t('orderNumber', 'Order Number'),
    sortable: true,
    render: (value, row) => (
      <div>
        <strong className="font-semibold text-gray-900">{value || row.orderNumber || row.id}</strong>
      </div>
    )
  },
  {
    key: 'customerName',
    header: t('customer', 'Customer'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <div className="customer-info">
        <User size={14} />
        <span>{value || '-'}</span>
      </div>
    )
  },
  {
    key: 'date',
    header: t('date', 'Date'),
    type: 'date',
    sortable: true,
    render: (value) => {
      if (!value) return '-'
      return formatDate ? formatDate(value) : new Date(value).toLocaleDateString()
    }
  },
  {
    key: 'itemCount',
    header: t('items', 'Items'),
    sortable: true,
    render: (value) => {
      const count = parseInt(value) || 0
      return (
        <div className="inline-flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded text-sm">
          <span className="font-semibold text-gray-900">{count}</span>
          <span className="text-gray-500 text-xs">{count === 1 ? t('item', 'item') : t('items', 'items')}</span>
        </div>
      )
    }
  },
  {
    key: 'total',
    header: t('total', 'Total'),
    type: 'currency',
    align: 'right',
    sortable: true,
    render: (value, row) => {
      const total = parseFloat(value || row.totalAmount) || 0
      return `OMR ${total.toFixed(2)}`
    }
  },
  {
    key: 'invoiceNumber',
    header: t('invoice', 'Invoice'),
    sortable: true,
    render: (value, row) => {
      if (value || row.invoiceNumber) {
        return (
          <div className="flex items-center gap-1.5">
            <FileText size={14} className="text-green-600 shrink-0" />
            <span className="text-green-600 font-medium">{value || row.invoiceNumber}</span>
          </div>
        )
      }
      return <span className="text-muted">-</span>
    }
  },
  {
    key: 'status',
    header: t('status', 'Status'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <span className={`status-badge ${value}`}>
        {STATUS_LABELS[value] || value}
      </span>
    )
  },
  {
    key: 'actions',
    header: t('actions', 'Actions'),
    sortable: false,
    width: '220px',
    render: (value, row) => (
      <OrderActions
        order={row}
        onView={onView}
        onEdit={onEdit}
        onStatusChange={onStatusChange}
        onDelete={onDelete}
        onGenerateInvoice={onGenerateInvoice}
        t={t}
      />
    )
  }
]

export default getSalesOrderColumns
