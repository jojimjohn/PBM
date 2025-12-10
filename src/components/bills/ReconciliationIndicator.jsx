import React from 'react'
import { CheckCircle, AlertTriangle, Clock, Info } from 'lucide-react'

/**
 * ReconciliationIndicator Component
 *
 * Visual indicator showing reconciliation status between vendor and company bills:
 * - Green checkmark: Amounts match
 * - Red warning: Amount mismatch (shows difference)
 * - Orange clock: Missing company bills for covered POs
 *
 * @param {Object} reconciliation - Reconciliation data from groupBillsForDisplay
 * @param {Function} formatCurrency - Currency formatting function
 */
const ReconciliationIndicator = ({ reconciliation, formatCurrency }) => {
  if (!reconciliation) {
    return <span className="reconciliation-na">-</span>
  }

  const {
    isMatched,
    difference,
    coveredPOs,
    linkedBills,
    missingBills
  } = reconciliation

  // Determine the status
  const hasMismatch = !isMatched && Math.abs(difference) >= 0.01
  const hasMissingBills = missingBills > 0

  // Fully reconciled - amounts match and all POs have company bills
  if (isMatched && !hasMissingBills) {
    return (
      <div className="reconciliation-indicator matched" title="Amounts match - Fully reconciled">
        <CheckCircle size={14} />
        <span>Matched</span>
      </div>
    )
  }

  // Amount mismatch
  if (hasMismatch) {
    const diffLabel = difference > 0
      ? `Vendor +${formatCurrency(difference)}`
      : `Company +${formatCurrency(Math.abs(difference))}`

    return (
      <div className="reconciliation-indicator mismatch" title={`Amount difference: ${formatCurrency(Math.abs(difference))}`}>
        <AlertTriangle size={14} />
        <span>{diffLabel}</span>
        {hasMissingBills && (
          <span className="missing-indicator" title={`${missingBills} PO(s) missing company bill`}>
            +{missingBills} missing
          </span>
        )}
      </div>
    )
  }

  // Missing company bills but amounts could still match
  if (hasMissingBills) {
    return (
      <div className="reconciliation-indicator warning" title={`${missingBills} covered PO(s) don't have company bills yet`}>
        <Clock size={14} />
        <span>{missingBills} PO pending</span>
      </div>
    )
  }

  // Fallback - partial info
  return (
    <div className="reconciliation-indicator info" title="Reconciliation info available">
      <Info size={14} />
      <span>{linkedBills}/{coveredPOs} linked</span>
    </div>
  )
}

export default ReconciliationIndicator
