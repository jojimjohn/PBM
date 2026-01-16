/**
 * Bill Utilities
 * Shared logic for bill calculations and grouping
 *
 * @module utils/billUtils
 */

/**
 * @typedef {import('../types/purchase.types').Bill} Bill
 * @typedef {import('../types/purchase.types').BillSummary} BillSummary
 * @typedef {import('../types/purchase.types').GroupedBillsResult} GroupedBillsResult
 * @typedef {import('../types/purchase.types').VendorBillWithChildren} VendorBillWithChildren
 */

/**
 * Calculate summary statistics for a list of bills
 *
 * @param {Bill[]} bills - Array of bills
 * @returns {BillSummary} Bill summary statistics
 */
export function calculateBillSummary(bills) {
  return {
    total: bills.length,
    companyBills: bills.filter(b => b.bill_type === 'company').length,
    vendorBills: bills.filter(b => b.bill_type === 'vendor').length,
    unpaid: bills.filter(b => b.payment_status === 'unpaid').length,
    overdue: bills.filter(b => b.payment_status === 'overdue').length,
    totalAmount: bills.reduce((sum, b) => sum + (parseFloat(b.invoice_amount) || 0), 0),
    paidAmount: bills.reduce((sum, b) => sum + (parseFloat(b.paid_amount) || 0), 0),
    balanceDue: bills.reduce((sum, b) => sum + (parseFloat(b.balance_due) || 0), 0)
  };
}

/**
 * Group bills for hierarchical display
 * - Vendor bills become parent rows with nested company bills
 * - Orphan company bills (not linked to vendor bill) shown separately
 * - Calculates reconciliation metrics for each vendor bill
 *
 * Supports two workflows:
 * - New: covers_company_bills (direct company bill IDs)
 * - Legacy: covers_purchase_orders (PO IDs → company bills)
 *
 * @param {Bill[]} bills - All bills to group
 * @returns {GroupedBillsResult} Grouped vendor bills and orphan company bills
 */
export function groupBillsForDisplay(bills) {
  const vendorBills = bills.filter(b => b.bill_type === 'vendor');
  const companyBills = bills.filter(b => b.bill_type === 'company');

  // Map company bills by ID for direct lookup (new workflow)
  const companyBillsById = {};
  companyBills.forEach(cb => {
    companyBillsById[cb.id] = cb;
  });

  // Map company bills by PO ID for legacy lookup
  const companyBillsByPO = {};
  companyBills.forEach(cb => {
    if (cb.purchase_order_id) {
      companyBillsByPO[cb.purchase_order_id] = cb;
    }
  });

  // Track which company bills are linked to vendor bills
  const linkedCompanyBillIds = new Set();

  // Group vendor bills with their linked company bills
  const groupedBills = vendorBills.map(vb => {
    let linkedCompanyBills = [];

    // New workflow: Use covers_company_bills (direct company bill IDs)
    if (vb.covers_company_bills && vb.covers_company_bills.length > 0) {
      linkedCompanyBills = vb.covers_company_bills
        .map(cbId => companyBillsById[cbId])
        .filter(Boolean);
    }
    // Legacy workflow: Use covers_purchase_orders (PO IDs → company bills)
    else if (vb.covers_purchase_orders && vb.covers_purchase_orders.length > 0) {
      linkedCompanyBills = vb.covers_purchase_orders
        .map(poId => companyBillsByPO[poId])
        .filter(Boolean);
    }

    // Mark these company bills as linked
    linkedCompanyBills.forEach(cb => linkedCompanyBillIds.add(cb.id));

    // Calculate reconciliation metrics
    const companyTotal = linkedCompanyBills.reduce(
      (sum, cb) => sum + parseFloat(cb.invoice_amount || 0), 0
    );
    const vendorAmount = parseFloat(vb.invoice_amount || 0);
    const difference = vendorAmount - companyTotal;

    // Count covered items (use company bills count or PO count for legacy)
    const coveredCount = vb.covers_company_bills?.length ||
      vb.covers_purchase_orders?.length || 0;

    return {
      ...vb,
      childBills: linkedCompanyBills,
      isExpanded: false,
      reconciliation: {
        companyTotal,
        vendorAmount,
        difference,
        isMatched: Math.abs(difference) < 0.01,
        coveredPOs: coveredCount,
        linkedBills: linkedCompanyBills.length,
        missingBills: coveredCount - linkedCompanyBills.length
      }
    };
  });

  // Find orphan company bills (not linked to any vendor bill)
  const orphanBills = companyBills.filter(cb => !linkedCompanyBillIds.has(cb.id));

  return { groupedBills, orphanBills };
}

/**
 * Get payment status display info
 *
 * @param {string} status - Payment status
 * @returns {{ label: string, className: string }} Display info
 */
export function getPaymentStatusDisplay(status) {
  const statusMap = {
    unpaid: { label: 'Unpaid', className: 'status-unpaid' },
    partial: { label: 'Partially Paid', className: 'status-partial' },
    paid: { label: 'Paid', className: 'status-paid' },
    overdue: { label: 'Overdue', className: 'status-overdue' }
  };
  return statusMap[status] || { label: status, className: 'status-unknown' };
}

/**
 * Check if a bill is overdue based on due date
 *
 * @param {Bill} bill - Bill to check
 * @returns {boolean} True if overdue
 */
export function isBillOverdue(bill) {
  if (!bill.due_date || bill.payment_status === 'paid') return false;
  const dueDate = new Date(bill.due_date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return dueDate < today;
}

export default {
  calculateBillSummary,
  groupBillsForDisplay,
  getPaymentStatusDisplay,
  isBillOverdue
};
