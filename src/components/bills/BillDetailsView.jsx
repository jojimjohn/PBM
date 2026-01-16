/**
 * BillDetailsView Component
 * Displays detailed information about a bill
 *
 * Extracted from Purchase.jsx inline component
 *
 * @module components/bills/BillDetailsView
 */
import React from 'react';
import { Banknote, AlertTriangle } from 'lucide-react';

/**
 * @typedef {import('../../modules/oil-trading/types/purchase.types').Bill} Bill
 */

/**
 * @typedef {Object} BillDetailsViewProps
 * @property {Bill} bill - Bill to display
 * @property {Bill[]} bills - All bills (for company bill lookup)
 * @property {() => void} onRecordPayment - Handler for record payment action
 * @property {() => void} onClose - Close handler
 * @property {(amount: number) => string} formatCurrency - Currency formatter
 * @property {(date: string) => string} formatDate - Date formatter
 */

/**
 * Bill details view component
 *
 * @param {BillDetailsViewProps} props - Component props
 * @returns {JSX.Element} Bill details view
 */
const BillDetailsView = ({ bill, bills, onRecordPayment, onClose, formatCurrency, formatDate }) => {
  const isPaid = bill.payment_status === 'paid';
  const isVendorBill = bill.bill_type === 'vendor';
  const balanceDue = parseFloat(bill.balance_due) || 0;

  /**
   * Get company bill details by ID
   */
  const getCompanyBillDetails = (billId) => {
    const companyBill = bills?.find(b => b.id === billId && b.bill_type === 'company');
    return companyBill || null;
  };

  // Get linked company bills for vendor bills
  const linkedCompanyBills = isVendorBill && bill.covers_company_bills?.length > 0
    ? bill.covers_company_bills.map(billId => getCompanyBillDetails(billId)).filter(Boolean)
    : [];

  return (
    <div className="bill-details-view">
      {/* Bill Header */}
      <div className="bill-header-section">
        <div className="bill-type-indicator">
          <span className={`bill-type-badge ${bill.bill_type}`}>
            {isVendorBill ? 'Vendor Bill' : 'Company Bill'}
          </span>
          <span className={`status-badge ${bill.payment_status}`}>
            {bill.payment_status === 'unpaid' ? 'Unpaid' :
             bill.payment_status === 'partial' ? 'Partially Paid' :
             bill.payment_status === 'paid' ? 'Paid' : 'Overdue'}
          </span>
        </div>
      </div>

      {/* Bill Information Grid */}
      <div className="bill-info-grid">
        <div className="info-section">
          <h4>Bill Information</h4>
          <div className="info-row">
            <span className="info-label">Bill Number</span>
            <span className="info-value">{bill.invoice_number}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Supplier</span>
            <span className="info-value">{bill.supplierName || 'N/A'}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Invoice Date</span>
            <span className="info-value">{formatDate(bill.invoice_date)}</span>
          </div>
          {bill.due_date && (
            <div className="info-row">
              <span className="info-label">Due Date</span>
              <span className="info-value">{formatDate(bill.due_date)}</span>
            </div>
          )}
        </div>

        <div className="info-section">
          <h4>Payment Details</h4>
          <div className="info-row">
            <span className="info-label">Invoice Amount</span>
            <span className="info-value amount">{formatCurrency(bill.invoice_amount)}</span>
          </div>
          <div className="info-row">
            <span className="info-label">Paid Amount</span>
            <span className="info-value paid">{formatCurrency(bill.paid_amount)}</span>
          </div>
          <div className="info-row highlight">
            <span className="info-label">Balance Due</span>
            <span className={`info-value ${balanceDue > 0 ? 'due' : 'paid'}`}>
              {formatCurrency(balanceDue)}
            </span>
          </div>
        </div>
      </div>

      {/* Purchase Order / Company Bills Information */}
      <div className="po-section">
        {isVendorBill ? (
          <>
            <h4>Linked Company Bills</h4>
            {linkedCompanyBills.length > 0 ? (
              <div className="po-list">
                <div className="po-count">
                  This vendor bill covers <strong>{linkedCompanyBills.length}</strong> company bill(s)
                </div>
                <div className="linked-bills-table">
                  <table className="mini-table">
                    <thead>
                      <tr>
                        <th>Bill #</th>
                        <th>PO #</th>
                        <th>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {linkedCompanyBills.map((companyBill) => (
                        <tr key={companyBill.id}>
                          <td>{companyBill.invoice_number}</td>
                          <td>{companyBill.orderNumber || `PO-${companyBill.purchase_order_id}`}</td>
                          <td>{formatCurrency(companyBill.invoice_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : bill.covers_company_bills?.length > 0 ? (
              <div className="po-list">
                <div className="po-count">
                  This vendor bill covers <strong>{bill.covers_company_bills.length}</strong> company bill(s)
                </div>
                <div className="po-ids">
                  {bill.covers_company_bills.map((billId) => (
                    <span key={billId} className="po-id-badge">
                      Bill #{billId}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p className="no-po">No company bills linked to this vendor bill</p>
            )}
          </>
        ) : (
          <>
            <h4>Related Purchase Order</h4>
            {bill.purchase_order_id ? (
              <div className="po-list">
                <span className="po-id-badge">
                  {bill.orderNumber || `PO-${bill.purchase_order_id}`}
                </span>
              </div>
            ) : (
              <p className="no-po">No purchase order linked to this bill</p>
            )}
          </>
        )}
      </div>

      {/* Notes */}
      {bill.notes && (
        <div className="notes-section">
          <h4>Notes</h4>
          <p>{bill.notes}</p>
        </div>
      )}

      {/* Actions */}
      <div className="bill-actions">
        <button className="btn btn-outline" onClick={onClose}>
          Close
        </button>
        {!isPaid && isVendorBill && (
          <button className="btn btn-primary" onClick={onRecordPayment}>
            <Banknote size={16} />
            Record Payment
          </button>
        )}
        {!isPaid && !isVendorBill && (
          <div className="payment-info-message">
            <AlertTriangle size={16} />
            <span>Company bills are paid via their linked vendor bill</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillDetailsView;
