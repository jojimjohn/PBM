/**
 * Expense Submit Form
 *
 * Simple form for petty cash users to submit expenses.
 * Mobile-optimized with large touch targets and camera support.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Receipt,
  Camera,
  Banknote,
  FileText,
  Store,
  Calendar,
  Send,
  X,
  Loader2,
  CheckCircle,
  AlertCircle,
  Image,
} from 'lucide-react';
import pettyCashPortalService from '../../services/pettyCashPortalService';
import './PettyCashPortal.css';

// Category icons mapping
const categoryIcons = {
  fuel: '⛽',
  transport: '🚕',
  meals: '🍽️',
  office_supplies: '📦',
  maintenance: '🔧',
  communication: '📱',
  travel: '✈️',
  miscellaneous: '📋',
  emergency: '🚨',
};

const ExpenseSubmitForm = ({
  user,
  categories = [],
  onSuccess,
  onCancel,
}) => {
  const [formData, setFormData] = useState({
    category: '',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: '',
    receiptNumber: '',
  });
  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef(null);

  // Get current balance
  const currentBalance = user?.currentBalance || 0;

  // Validate form
  const isValid = formData.category && formData.description && formData.amount && formData.expenseDate;
  const amountExceedsBalance = parseFloat(formData.amount) > currentBalance;

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!validTypes.includes(file.type)) {
        setError('Invalid file type. Please upload an image or PDF.');
        return;
      }

      // Validate file size (5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setReceipt(file);
      setError(null);

      // Create preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setReceiptPreview(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setReceiptPreview(null);
      }
    }
  };

  // Remove receipt
  const handleRemoveReceipt = () => {
    setReceipt(null);
    setReceiptPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!isValid || isSubmitting || amountExceedsBalance) return;

    setIsSubmitting(true);
    setError(null);

    try {
      // Submit expense
      const expenseData = {
        category: formData.category,
        description: formData.description,
        amount: parseFloat(formData.amount),
        expenseDate: formData.expenseDate,
        vendor: formData.vendor || null,
        receiptNumber: formData.receiptNumber || null,
      };

      const result = await pettyCashPortalService.submitExpense(expenseData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit expense');
      }

      // Upload receipt if present
      if (receipt && result.data?.id) {
        const uploadResult = await pettyCashPortalService.uploadReceipt(result.data.id, receipt);
        if (!uploadResult.success) {
          console.warn('Receipt upload failed:', uploadResult.error);
          // Don't fail the whole operation, expense was created
        }
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess?.(result.data);
      }, 1500);
    } catch (err) {
      setError(err.message || 'Failed to submit expense');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Success screen
  if (success) {
    return (
      <div className="expense-form-success">
        <div className="success-icon">
          <CheckCircle size={64} />
        </div>
        <h2>Expense Submitted!</h2>
        <p>Your expense has been submitted for approval.</p>
      </div>
    );
  }

  return (
    <form className="expense-submit-form" onSubmit={handleSubmit}>
      {/* Header with balance */}
      <div className="expense-form-header">
        <h2>New Expense</h2>
        <div className="balance-badge">
          <span className="balance-label">Available Balance</span>
          <span className="balance-amount">{currentBalance.toFixed(3)} OMR</span>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="form-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Category Selection */}
      <div className="form-group">
        <label className="form-label">
          <Receipt size={18} />
          Category *
        </label>
        <div className="category-grid">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`category-btn ${formData.category === cat.id ? 'selected' : ''}`}
              onClick={() => setFormData((prev) => ({ ...prev, category: cat.id }))}
            >
              <span className="category-icon">{categoryIcons[cat.id] || '📋'}</span>
              <span className="category-name">{cat.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Amount */}
      <div className="form-group">
        <label className="form-label">
          <Banknote size={18} />
          Amount (OMR) *
        </label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          className={`form-input amount-input ${amountExceedsBalance ? 'error' : ''}`}
          placeholder="0.000"
          step="0.001"
          min="0.001"
          max={currentBalance}
          required
        />
        {amountExceedsBalance && (
          <span className="input-error">Amount exceeds available balance</span>
        )}
      </div>

      {/* Description */}
      <div className="form-group">
        <label className="form-label">
          <FileText size={18} />
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          className="form-input form-textarea"
          placeholder="What was this expense for?"
          rows={3}
          required
        />
      </div>

      {/* Vendor */}
      <div className="form-group">
        <label className="form-label">
          <Store size={18} />
          Vendor / Shop
        </label>
        <input
          type="text"
          name="vendor"
          value={formData.vendor}
          onChange={handleChange}
          className="form-input"
          placeholder="Where did you make this purchase?"
        />
      </div>

      {/* Date */}
      <div className="form-group">
        <label className="form-label">
          <Calendar size={18} />
          Date *
        </label>
        <input
          type="date"
          name="expenseDate"
          value={formData.expenseDate}
          onChange={handleChange}
          className="form-input"
          max={new Date().toISOString().split('T')[0]}
          required
        />
      </div>

      {/* Receipt Number */}
      <div className="form-group">
        <label className="form-label">
          <Receipt size={18} />
          Receipt Number
        </label>
        <input
          type="text"
          name="receiptNumber"
          value={formData.receiptNumber}
          onChange={handleChange}
          className="form-input"
          placeholder="Optional receipt number"
        />
      </div>

      {/* Receipt Upload */}
      <div className="form-group">
        <label className="form-label">
          <Camera size={18} />
          Receipt Photo
        </label>
        {receiptPreview ? (
          <div className="receipt-preview">
            <img src={receiptPreview} alt="Receipt preview" />
            <button
              type="button"
              className="remove-receipt-btn"
              onClick={handleRemoveReceipt}
            >
              <X size={20} />
            </button>
          </div>
        ) : receipt ? (
          <div className="receipt-file">
            <FileText size={24} />
            <span>{receipt.name}</span>
            <button
              type="button"
              className="remove-receipt-btn"
              onClick={handleRemoveReceipt}
            >
              <X size={20} />
            </button>
          </div>
        ) : (
          <div className="receipt-upload">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileChange}
              className="file-input"
              capture="environment"
            />
            <button
              type="button"
              className="upload-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              <Camera size={24} />
              <span>Take Photo or Upload</span>
            </button>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="form-actions">
        <button
          type="button"
          className="btn-cancel"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-submit"
          disabled={!isValid || isSubmitting || amountExceedsBalance}
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="spinning" />
              Submitting...
            </>
          ) : (
            <>
              <Send size={20} />
              Submit Expense
            </>
          )}
        </button>
      </div>
    </form>
  );
};

export default ExpenseSubmitForm;
