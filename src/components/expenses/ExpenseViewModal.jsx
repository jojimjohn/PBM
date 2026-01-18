import React, { useState } from 'react';
import Modal from '../ui/Modal';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import useExpenseCategories from '../../hooks/useExpenseCategories';
import {
  Receipt, Calendar, Banknote, User, FileText,
  CreditCard, Hash, Building2, Image, X, Download, Upload, Trash2
} from 'lucide-react';
// CSS moved to global index.css Tailwind

/**
 * Expense View Modal
 * Displays detailed view of a purchase order expense with receipt support and upload capability
 */
const ExpenseViewModal = ({
  isOpen,
  onClose,
  expense,
  purchaseOrder,
  onUploadReceipt, // Callback to handle receipt upload: (expenseId, base64Data) => Promise
  onRemoveReceipt, // Callback to handle receipt removal: (expenseId) => Promise
  t = (key) => key, // Translation function
  formatCurrency = (val) => `OMR ${(parseFloat(val) || 0).toFixed(3)}`,
  formatDate: formatDateProp = null
}) => {
  const { formatDate: systemFormatDate } = useSystemSettings();
  // Load categories from database for label display
  // Purchase expenses use 'operational' type categories
  const { getCategoryLabel } = useExpenseCategories(expense?.expenseType === 'purchase' ? 'operational' : expense?.expenseType || 'operational');
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // Use provided formatDate prop, system settings, or fallback
  const formatDate = formatDateProp || systemFormatDate || ((date) => date ? new Date(date).toLocaleDateString() : '-');

  if (!expense) return null;

  // Handle receipt file upload
  const handleReceiptUpload = async (file) => {
    if (!file || !onUploadReceipt) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please upload an image (JPEG, PNG, GIF) or PDF file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setUploadError(null);

    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          await onUploadReceipt(expense.id, e.target.result);
          setUploading(false);
        } catch (err) {
          setUploadError(err.message || 'Failed to upload receipt');
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setUploadError(err.message || 'Failed to upload receipt');
      setUploading(false);
    }
  };

  // Handle receipt removal
  const handleRemoveReceipt = async () => {
    if (!onRemoveReceipt) return;

    if (!window.confirm('Are you sure you want to remove this receipt?')) return;

    setUploading(true);
    setUploadError(null);

    try {
      await onRemoveReceipt(expense.id);
      setUploading(false);
    } catch (err) {
      setUploadError(err.message || 'Failed to remove receipt');
      setUploading(false);
    }
  };

  // Helper to view receipt properly (handles base64 data URIs)
  const viewReceipt = (receiptData) => {
    if (!receiptData) return;

    if (receiptData.startsWith('data:')) {
      const isPDF = receiptData.startsWith('data:application/pdf');
      const newWindow = window.open();
      if (newWindow) {
        if (isPDF) {
          newWindow.document.write(`<embed src="${receiptData}" width="100%" height="100%" type="application/pdf" />`);
        } else {
          newWindow.document.write(`<html><head><title>Receipt</title></head><body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#1a1a1a;"><img src="${receiptData}" style="max-width:100%;max-height:100vh;object-fit:contain;"/></body></html>`);
        }
        newWindow.document.close();
      }
    } else {
      window.open(receiptData, '_blank');
    }
  };

  const paymentMethodLabels = {
    'cash': 'Cash',
    'card': 'Card',
    'bank_transfer': 'Bank Transfer',
    'company_account': 'Company Account'
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="expense-modal-title">
          <Receipt size={24} />
          <span>Expense Details</span>
        </div>
      }
      size="medium"
      className="expense-view-modal"
    >
      <div className="expense-view-content">
        {/* Header Section */}
        <div className="expense-header">
          <div className="expense-category-badge">
            <span className="category-icon">
              <Receipt size={16} />
            </span>
            <span className="category-label">
              {getCategoryLabel(expense.category)}
            </span>
          </div>
          <div className="expense-amount">
            {formatCurrency(expense.amount)}
          </div>
        </div>

        {/* PO Reference Section */}
        {purchaseOrder && (
          <div className="expense-po-reference">
            <FileText size={16} />
            <span>Linked to Purchase Order: </span>
            <strong>{purchaseOrder.orderNumber}</strong>
          </div>
        )}

        {/* Description Card */}
        <div className="expense-section">
          <h4 className="section-title">
            <FileText size={16} />
            Description
          </h4>
          <p className="expense-description">
            {expense.description || 'No description provided'}
          </p>
        </div>

        {/* Details Grid */}
        <div className="expense-details-grid">
          {/* Expense Date */}
          <div className="detail-item">
            <span className="detail-icon">
              <Calendar size={16} />
            </span>
            <div className="detail-content">
              <span className="detail-label">Expense Date</span>
              <span className="detail-value">{formatDate(expense.expenseDate)}</span>
            </div>
          </div>

          {/* Vendor/Service Provider */}
          {expense.vendor && (
            <div className="detail-item">
              <span className="detail-icon">
                <Building2 size={16} />
              </span>
              <div className="detail-content">
                <span className="detail-label">Service Provider</span>
                <span className="detail-value">{expense.vendor}</span>
              </div>
            </div>
          )}

          {/* Receipt Number */}
          {expense.receiptNumber && (
            <div className="detail-item">
              <span className="detail-icon">
                <Hash size={16} />
              </span>
              <div className="detail-content">
                <span className="detail-label">Receipt Number</span>
                <span className="detail-value">{expense.receiptNumber}</span>
              </div>
            </div>
          )}

          {/* Paid By */}
          {expense.paidBy && (
            <div className="detail-item">
              <span className="detail-icon">
                <User size={16} />
              </span>
              <div className="detail-content">
                <span className="detail-label">Paid By</span>
                <span className="detail-value">{expense.paidBy}</span>
              </div>
            </div>
          )}

          {/* Payment Method */}
          {expense.paymentMethod && (
            <div className="detail-item">
              <span className="detail-icon">
                <CreditCard size={16} />
              </span>
              <div className="detail-content">
                <span className="detail-label">Payment Method</span>
                <span className="detail-value">
                  {paymentMethodLabels[expense.paymentMethod] || expense.paymentMethod}
                </span>
              </div>
            </div>
          )}

          {/* Currency */}
          <div className="detail-item">
            <span className="detail-icon">
              <Banknote size={16} />
            </span>
            <div className="detail-content">
              <span className="detail-label">Currency</span>
              <span className="detail-value">{expense.currency || 'OMR'}</span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {expense.notes && (
          <div className="expense-section">
            <h4 className="section-title">
              <FileText size={16} />
              Notes
            </h4>
            <p className="expense-notes">{expense.notes}</p>
          </div>
        )}

        {/* Receipt Photo Section */}
        <div className="expense-section receipt-section">
          <h4 className="section-title">
            <Image size={16} />
            Receipt Document
          </h4>

          {uploadError && (
            <div className="upload-error">
              {uploadError}
            </div>
          )}

          {expense.receiptPhoto ? (
            <div className="receipt-preview">
              {expense.receiptPhoto.startsWith('data:image') || expense.receiptPhoto.startsWith('http') ? (
                <>
                  <img
                    src={expense.receiptPhoto}
                    alt="Receipt"
                    className="receipt-image"
                    onClick={() => viewReceipt(expense.receiptPhoto)}
                  />
                  <div className="receipt-actions">
                    <button
                      className="btn-view-receipt"
                      onClick={() => viewReceipt(expense.receiptPhoto)}
                    >
                      <Image size={14} />
                      View Full Size
                    </button>
                    <a
                      href={expense.receiptPhoto}
                      download={`receipt-${expense.receiptNumber || expense.id}.jpg`}
                      className="btn-download-receipt"
                    >
                      <Download size={14} />
                      Download
                    </a>
                    {onRemoveReceipt && (
                      <button
                        className="btn-remove-receipt"
                        onClick={handleRemoveReceipt}
                        disabled={uploading}
                      >
                        <Trash2 size={14} />
                        {uploading ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </div>
                </>
              ) : expense.receiptPhoto.startsWith('data:application/pdf') ? (
                <div className="receipt-pdf-preview">
                  <FileText size={32} />
                  <span>PDF Document</span>
                  <div className="receipt-actions">
                    <button
                      className="btn-view-receipt"
                      onClick={() => viewReceipt(expense.receiptPhoto)}
                    >
                      <FileText size={14} />
                      View PDF
                    </button>
                    {onRemoveReceipt && (
                      <button
                        className="btn-remove-receipt"
                        onClick={handleRemoveReceipt}
                        disabled={uploading}
                      >
                        <Trash2 size={14} />
                        {uploading ? 'Removing...' : 'Remove'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="receipt-text">
                  <FileText size={24} />
                  <span>Receipt attached</span>
                </div>
              )}
            </div>
          ) : (
            // Upload UI when no receipt exists
            <div className="receipt-upload-section">
              {onUploadReceipt ? (
                <div className="receipt-upload-zone">
                  <input
                    type="file"
                    id="expense-receipt-upload"
                    accept="image/jpeg,image/png,image/gif,application/pdf"
                    onChange={(e) => handleReceiptUpload(e.target.files[0])}
                    className="receipt-input"
                    disabled={uploading}
                  />
                  <label htmlFor="expense-receipt-upload" className="receipt-upload-label">
                    <Upload size={24} />
                    <span>{uploading ? 'Uploading...' : 'Upload Receipt'}</span>
                    <span className="upload-hint">JPEG, PNG, GIF or PDF (max 5MB)</span>
                  </label>
                </div>
              ) : (
                <div className="no-receipt">
                  <FileText size={24} />
                  <span>No receipt attached</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Metadata Footer */}
        <div className="expense-metadata">
          <span className="metadata-item">
            Created: {formatDate(expense.createdAt)}
          </span>
          {expense.updatedAt && expense.updatedAt !== expense.createdAt && (
            <span className="metadata-item">
              Updated: {formatDate(expense.updatedAt)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="expense-modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            <X size={16} />
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default ExpenseViewModal;
