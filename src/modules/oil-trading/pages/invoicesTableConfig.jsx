/**
 * Invoices Table Configuration
 *
 * Defines table columns for the sales invoices DataTable.
 * Extracted from Sales.jsx for better separation of concerns.
 *
 * @module pages/invoicesTableConfig
 */

import React from 'react'
import { Eye, FileText, User, Download } from 'lucide-react'

/**
 * @typedef {import('../types/sales.types').SalesInvoice} SalesInvoice
 */

/**
 * Invoice status display labels
 */
export const INVOICE_STATUS_LABELS = {
  draft: 'Draft',
  sent: 'Sent',
  paid: 'Paid',
  overdue: 'Overdue',
  cancelled: 'Cancelled'
}

/**
 * Invoice actions component
 */
const InvoiceActions = ({
  invoice,
  onView,
  onDownload,
  t
}) => (
  <div className="cell-actions">
    <button
      className="btn btn-outline btn-sm"
      title={t('view', 'View')}
      onClick={(e) => { e.stopPropagation(); onView(invoice) }}
    >
      <Eye size={14} />
    </button>
    <button
      className="btn btn-outline btn-sm"
      title={t('downloadInvoice', 'Download Invoice')}
      onClick={(e) => { e.stopPropagation(); onDownload(invoice) }}
    >
      <Download size={14} />
    </button>
  </div>
)

/**
 * Generate table columns for invoices
 *
 * @param {Object} config - Column configuration
 * @param {Function} config.t - Translation function
 * @param {Function} config.formatDate - Date formatting function
 * @param {Function} config.onView - View invoice handler
 * @param {Function} config.onDownload - Download invoice handler
 * @returns {Array} Column definitions for DataTable
 */
export const getInvoiceColumns = ({
  t,
  formatDate,
  onView,
  onDownload
}) => [
  {
    key: 'invoiceNumber',
    header: t('invoiceNumber', 'Invoice Number'),
    sortable: true,
    render: (value) => (
      <div className="invoice-number">
        <FileText size={14} />
        <strong>{value}</strong>
      </div>
    )
  },
  {
    key: 'orderNumber',
    header: t('orderNumber', 'Order Number'),
    sortable: true,
    render: (value) => <span className="text-muted">{value}</span>
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
    key: 'invoiceGeneratedAt',
    header: t('generatedDate', 'Generated Date'),
    type: 'date',
    sortable: true,
    render: (value) => {
      if (!value) return '-'
      const date = new Date(value)
      const formattedDate = formatDate ? formatDate(value) : date.toLocaleDateString()
      return formattedDate + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  },
  {
    key: 'total',
    header: t('amount', 'Amount'),
    type: 'currency',
    align: 'right',
    sortable: true,
    render: (value, row) => {
      const total = parseFloat(value || row.totalAmount) || 0
      return `OMR ${total.toFixed(2)}`
    }
  },
  {
    key: 'status',
    header: t('orderStatus', 'Status'),
    sortable: true,
    render: (value) => (
      <span className={`status-badge ${value}`}>
        {INVOICE_STATUS_LABELS[value] || value}
      </span>
    )
  },
  {
    key: 'actions',
    header: t('actions', 'Actions'),
    sortable: false,
    width: '120px',
    render: (value, row) => (
      <InvoiceActions
        invoice={row}
        onView={onView}
        onDownload={onDownload}
        t={t}
      />
    )
  }
]

/**
 * Filter orders to get only those with invoices
 * @param {Array} orders - All sales orders
 * @returns {Array} Orders that have invoices
 */
export const filterOrdersWithInvoices = (orders) => {
  return orders.filter(order => order.invoiceNumber)
}

export default getInvoiceColumns
