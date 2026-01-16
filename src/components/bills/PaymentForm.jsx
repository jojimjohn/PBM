/**
 * PaymentForm Component
 * Form for recording payments on bills
 *
 * Extracted from Purchase.jsx inline component
 *
 * @module components/bills/PaymentForm
 */
import React, { useState } from 'react';
import DateInput from '../ui/DateInput';

/**
 * @typedef {import('../../modules/oil-trading/types/purchase.types').Bill} Bill
 * @typedef {import('../../modules/oil-trading/types/purchase.types').PaymentData} PaymentData
 */

/**
 * @typedef {Object} PaymentFormProps
 * @property {Bill} bill - Bill to record payment for
 * @property {(data: PaymentData) => Promise<void>} onSubmit - Submit handler
 * @property {() => void} onCancel - Cancel handler
 * @property {(amount: number) => string} formatCurrency - Currency formatter
 */

/**
 * Payment form component
 *
 * @param {PaymentFormProps} props - Component props
 * @returns {JSX.Element} Payment form
 */
const PaymentForm = ({ bill, onSubmit, onCancel, formatCurrency }) => {
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [paymentReference, setPaymentReference] = useState('');
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const balanceDue = parseFloat(bill.balance_due) || 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = parseFloat(paymentAmount);

    if (isNaN(amount) || amount <= 0) {
      alert('Please enter a valid payment amount');
      return;
    }

    if (amount > balanceDue) {
      alert(`Payment amount cannot exceed balance due (${formatCurrency(balanceDue)})`);
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit({
        amount,
        paymentMethod,
        reference: paymentReference,
        paymentDate,
        notes
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="payment-form">
      <div className="payment-summary">
        <div className="summary-row">
          <span className="label">Invoice Amount:</span>
          <span className="value">{formatCurrency(bill.invoice_amount)}</span>
        </div>
        <div className="summary-row">
          <span className="label">Already Paid:</span>
          <span className="value paid">{formatCurrency(bill.paid_amount)}</span>
        </div>
        <div className="summary-row highlight">
          <span className="label">Balance Due:</span>
          <span className="value due">{formatCurrency(balanceDue)}</span>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="paymentAmount">Payment Amount *</label>
        <input
          type="number"
          id="paymentAmount"
          value={paymentAmount}
          onChange={(e) => setPaymentAmount(e.target.value)}
          placeholder={`Max: ${formatCurrency(balanceDue)}`}
          step="0.001"
          min="0"
          max={balanceDue}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <DateInput
          id="paymentDate"
          value={paymentDate}
          onChange={setPaymentDate}
          label="Payment Date"
          required
          isClearable
        />
      </div>

      <div className="form-group">
        <label htmlFor="paymentMethod">Payment Method *</label>
        <select
          id="paymentMethod"
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value)}
          required
          className="form-select"
        >
          <option value="bank_transfer">Bank Transfer</option>
          <option value="cash">Cash</option>
          <option value="cheque">Cheque</option>
          <option value="card">Card Payment</option>
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="paymentReference">Reference / Transaction ID</label>
        <input
          type="text"
          id="paymentReference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          placeholder="e.g., Bank transaction reference"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label htmlFor="notes">Notes</label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Optional payment notes..."
          rows={2}
          className="form-textarea"
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-outline"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={submitting || !paymentAmount}
        >
          {submitting ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  );
};

export default PaymentForm;
