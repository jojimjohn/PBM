import React, { useState, useRef } from 'react'
import { ChevronRight, ChevronDown, Eye, DollarSign, AlertTriangle, CheckCircle, Clock, FileText, Receipt, Download, FileSpreadsheet, Printer, Edit, Send } from 'lucide-react'
import ReconciliationIndicator from './ReconciliationIndicator'
import './GroupedBillsTable.css'

/**
 * GroupedBillsTable Component
 *
 * Displays bills in a hierarchical table:
 * - Vendor bills as expandable parent rows (payment_status: unpaid/partial/paid/overdue)
 * - Company bills nested underneath as children (bill_status: draft/sent)
 * - Orphan company bills in a separate section
 * - Reconciliation indicators for each vendor bill
 *
 * New Workflow:
 * - Company bills have bill_status (draft/sent) - they don't get paid directly
 * - Vendor bills have payment_status - they're the ones that get paid
 * - Vendor bills link to company bills via covers_company_bills
 *
 * @param {Array} groupedBills - Vendor bills with childBills and reconciliation
 * @param {Array} orphanBills - Company bills not linked to any vendor bill
 * @param {Function} onViewDetails - Callback when View Details clicked
 * @param {Function} onRecordPayment - Callback when Record Payment clicked (vendor bills only)
 * @param {Function} onEditVendorBill - Callback when Edit Vendor Bill clicked (optional)
 * @param {Function} onMarkAsSent - Callback when Mark as Sent clicked (company bills only)
 * @param {Function} formatCurrency - Currency formatting function
 * @param {Function} formatDate - Date formatting function
 */
const GroupedBillsTable = ({
  groupedBills = [],
  orphanBills = [],
  onViewDetails,
  onRecordPayment,
  onEditVendorBill,
  onMarkAsSent,
  formatCurrency,
  formatDate
}) => {
  // Track which vendor bills are expanded
  const [expandedRows, setExpandedRows] = useState(new Set())
  const tableRef = useRef(null)

  // Export to CSV
  const exportToCSV = () => {
    // Build header row - updated for new workflow
    const headers = ['Bill #', 'Type', 'Supplier', 'PO Reference', 'Date', 'Amount', 'Paid', 'Balance', 'Status', 'Parent Bill']

    // Build data rows - flatten hierarchical structure
    const rows = []

    // Add vendor bills with their children
    groupedBills.forEach(vendorBill => {
      // Add vendor bill row
      rows.push([
        vendorBill.invoice_number,
        'Vendor',
        vendorBill.supplierName || 'N/A',
        `${vendorBill.reconciliation?.coveredPOs || 0} PO(s)`,
        formatDate(vendorBill.invoice_date),
        vendorBill.invoice_amount,
        vendorBill.paid_amount,
        vendorBill.balance_due,
        vendorBill.payment_status,
        '' // No parent
      ])

      // Add child company bills
      if (vendorBill.childBills) {
        vendorBill.childBills.forEach(childBill => {
          rows.push([
            childBill.invoice_number,
            'Company',
            childBill.supplierName || 'N/A',
            childBill.orderNumber || '-',
            formatDate(childBill.invoice_date),
            childBill.invoice_amount,
            '-', // Company bills don't track payments
            '-', // Company bills don't have balance
            childBill.bill_status || 'sent', // Use bill_status for company bills
            vendorBill.invoice_number // Parent reference
          ])
        })
      }
    })

    // Add orphan bills
    orphanBills.forEach(bill => {
      rows.push([
        bill.invoice_number,
        'Company (Orphan)',
        bill.supplierName || 'N/A',
        bill.orderNumber || '-',
        formatDate(bill.invoice_date),
        bill.invoice_amount,
        '-', // Company bills don't track payments
        '-', // Company bills don't have balance
        bill.bill_status || 'draft', // Use bill_status for company bills
        '(No Vendor Bill)'
      ])
    })

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => {
        // Escape cells that contain commas or quotes
        const cellStr = String(cell || '')
        if (cellStr.includes(',') || cellStr.includes('"') || cellStr.includes('\n')) {
          return `"${cellStr.replace(/"/g, '""')}"`
        }
        return cellStr
      }).join(','))
    ].join('\n')

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    const filename = `bills_export_${new Date().toISOString().split('T')[0]}.csv`

    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Print / PDF Export (uses browser print functionality)
  const handlePrint = () => {
    window.print()
  }

  const toggleRow = (billId) => {
    setExpandedRows(prev => {
      const next = new Set(prev)
      if (next.has(billId)) {
        next.delete(billId)
      } else {
        next.add(billId)
      }
      return next
    })
  }

  // Payment status badge for vendor bills
  const getPaymentStatusBadge = (status) => {
    const config = {
      unpaid: { label: 'Unpaid', color: '#d97706', bg: 'rgba(245, 158, 11, 0.15)' },
      partial: { label: 'Partial', color: '#2563eb', bg: 'rgba(59, 130, 246, 0.15)' },
      paid: { label: 'Paid', color: '#059669', bg: 'rgba(16, 185, 129, 0.15)' },
      overdue: { label: 'Overdue', color: '#dc2626', bg: 'rgba(239, 68, 68, 0.15)' }
    }
    const { label, color, bg } = config[status] || { label: status, color: '#6b7280', bg: 'rgba(107, 114, 128, 0.15)' }

    return (
      <span className="status-badge" style={{ backgroundColor: bg, color }}>
        {label}
      </span>
    )
  }

  // Bill status badge for company bills (draft/sent workflow)
  const getBillStatusBadge = (status) => {
    const config = {
      draft: { label: 'Draft', color: '#d97706', bg: 'rgba(245, 158, 11, 0.15)', icon: <Clock size={12} /> },
      sent: { label: 'Sent', color: '#059669', bg: 'rgba(16, 185, 129, 0.15)', icon: <CheckCircle size={12} /> }
    }
    const { label, color, bg, icon } = config[status] || config.draft

    return (
      <span className="status-badge bill-status" style={{ backgroundColor: bg, color }}>
        {icon}
        {label}
      </span>
    )
  }

  const renderVendorBillRow = (bill, isExpanded) => {
    const hasChildren = bill.childBills && bill.childBills.length > 0

    return (
      <tr key={bill.id} className="vendor-bill-row">
        <td className="expand-cell">
          {hasChildren ? (
            <button
              className="expand-button"
              onClick={() => toggleRow(bill.id)}
              title={isExpanded ? 'Collapse' : 'Expand'}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="no-children-indicator">-</span>
          )}
        </td>
        <td>
          <div className="bill-number-cell">
            <Receipt size={14} className="icon-vendor" />
            <span className="bill-number">{bill.invoice_number}</span>
          </div>
        </td>
        <td>
          <span className="bill-type-badge vendor">Vendor</span>
        </td>
        <td>{bill.supplierName || 'N/A'}</td>
        <td>
          <span className="po-count-badge">
            {bill.reconciliation?.coveredPOs || 0} PO{(bill.reconciliation?.coveredPOs || 0) !== 1 ? 's' : ''}
          </span>
        </td>
        <td>{formatDate(bill.invoice_date)}</td>
        <td className="amount-cell">{formatCurrency(bill.invoice_amount)}</td>
        <td className="amount-cell">{formatCurrency(bill.paid_amount)}</td>
        <td className="amount-cell">
          <span className={parseFloat(bill.balance_due) > 0 ? 'balance-due' : 'balance-paid'}>
            {formatCurrency(bill.balance_due)}
          </span>
        </td>
        <td>{getPaymentStatusBadge(bill.payment_status)}</td>
        <td>
          <ReconciliationIndicator reconciliation={bill.reconciliation} formatCurrency={formatCurrency} />
        </td>
        <td>
          <div className="action-buttons">
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onViewDetails(bill)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {/* Edit button - only for unpaid vendor bills */}
            {onEditVendorBill && bill.payment_status !== 'paid' && (
              <button
                className="btn btn-icon btn-sm btn-warning"
                onClick={() => onEditVendorBill(bill)}
                title="Edit Vendor Bill"
              >
                <Edit size={14} />
              </button>
            )}
            {bill.payment_status !== 'paid' && (
              <button
                className="btn btn-icon btn-sm btn-success"
                onClick={() => onRecordPayment(bill)}
                title="Record Payment"
              >
                <DollarSign size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  const renderCompanyBillRow = (bill, isChild = false) => {
    // Company bills use bill_status (draft/sent), not payment_status
    const billStatus = bill.bill_status || 'sent' // Default to 'sent' for backward compatibility

    return (
      <tr key={bill.id} className={`company-bill-row ${isChild ? 'child-row' : ''}`}>
        <td className="expand-cell">
          {isChild && <span className="tree-connector">└</span>}
        </td>
        <td>
          <div className="bill-number-cell">
            <FileText size={14} className="icon-company" />
            <span className="bill-number">{bill.invoice_number}</span>
          </div>
        </td>
        <td>
          <span className="bill-type-badge company">Company</span>
        </td>
        <td>{bill.supplierName || 'N/A'}</td>
        <td>
          {bill.orderNumber ? (
            <span className="po-link">{bill.orderNumber}</span>
          ) : (
            <span className="no-po">-</span>
          )}
        </td>
        <td>{formatDate(bill.invoice_date)}</td>
        <td className="amount-cell">{formatCurrency(bill.invoice_amount)}</td>
        {/* Company bills don't have paid/balance - they don't get paid directly */}
        <td className="amount-cell na-cell">
          <span className="not-applicable">-</span>
        </td>
        <td className="amount-cell na-cell">
          <span className="not-applicable">-</span>
        </td>
        {/* Use bill_status instead of payment_status */}
        <td>{getBillStatusBadge(billStatus)}</td>
        <td>-</td>
        <td>
          <div className="action-buttons">
            <button
              className="btn btn-icon btn-sm"
              onClick={() => onViewDetails(bill)}
              title="View Details"
            >
              <Eye size={14} />
            </button>
            {/* Mark as Sent button - only for draft company bills */}
            {billStatus === 'draft' && onMarkAsSent && (
              <button
                className="btn btn-icon btn-sm btn-primary"
                onClick={() => onMarkAsSent(bill)}
                title="Mark as Sent"
              >
                <Send size={14} />
              </button>
            )}
          </div>
        </td>
      </tr>
    )
  }

  // Check if there are any bills to display
  const hasNoBills = groupedBills.length === 0 && orphanBills.length === 0
  const totalBills = groupedBills.length + orphanBills.length +
    groupedBills.reduce((sum, vb) => sum + (vb.childBills?.length || 0), 0)

  if (hasNoBills) {
    return (
      <div className="grouped-bills-table-container">
        <div className="empty-state">
          <Receipt size={48} className="empty-icon" />
          <h3>No Bills Found</h3>
          <p>There are no bills matching your current filters.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="grouped-bills-table-container">
      {/* Export Toolbar */}
      <div className="bills-export-toolbar">
        <span className="bills-count">{totalBills} bill(s)</span>
        <div className="export-buttons">
          <button
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={exportToCSV}
            title="Export to CSV"
          >
            <FileSpreadsheet size={16} />
          </button>
          <button
            className="btn btn-outline btn-sm btn-icon-only"
            onClick={handlePrint}
            title="Print / Save as PDF"
          >
            <Printer size={16} />
          </button>
        </div>
      </div>

      <table className="grouped-bills-table" ref={tableRef}>
        <thead>
          <tr>
            <th className="expand-header"></th>
            <th>Bill #</th>
            <th>Type</th>
            <th>Supplier</th>
            <th>PO Ref</th>
            <th>Date</th>
            <th className="amount-header">Amount</th>
            <th className="amount-header">Paid</th>
            <th className="amount-header">Balance</th>
            <th>Status</th>
            <th>Reconciliation</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {/* Vendor Bills with their Company Bills */}
          {groupedBills.map(vendorBill => {
            const isExpanded = expandedRows.has(vendorBill.id)
            return (
              <React.Fragment key={`group-${vendorBill.id}`}>
                {renderVendorBillRow(vendorBill, isExpanded)}
                {isExpanded && vendorBill.childBills && vendorBill.childBills.map(childBill =>
                  renderCompanyBillRow(childBill, true)
                )}
              </React.Fragment>
            )
          })}

          {/* Orphan Company Bills Section */}
          {orphanBills.length > 0 && (
            <>
              <tr className="orphan-section-header">
                <td colSpan="12">
                  <div className="orphan-header-content">
                    <AlertTriangle size={16} />
                    <span>Company Bills Not Linked to Vendor Bill ({orphanBills.length})</span>
                  </div>
                </td>
              </tr>
              {orphanBills.map(bill => renderCompanyBillRow(bill, false))}
            </>
          )}
        </tbody>
      </table>
    </div>
  )
}

export default GroupedBillsTable
