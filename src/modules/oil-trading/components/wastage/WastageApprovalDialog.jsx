/**
 * WastageApprovalDialog Component
 *
 * Dialog for approving or rejecting wastage records.
 * Provides input for approval notes or rejection reason.
 */

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle, AlertTriangle } from 'lucide-react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import { Textarea } from '../../../../components/ui/Input';
import { useLocalization } from '../../../../context/LocalizationContext';
import { formatCurrency } from '../../../../lib/utils';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Dialog visibility
 * @param {Function} props.onClose - Close handler
 * @param {string} props.mode - 'approve' or 'reject'
 * @param {Object} props.wastage - Wastage record being acted upon
 * @param {Function} props.onConfirm - Confirm handler (notes/reason) => Promise
 * @param {boolean} props.isLoading - Loading state during action
 * @param {string} props.error - Error message if action failed
 */
export function WastageApprovalDialog({
  isOpen,
  onClose,
  mode,
  wastage,
  onConfirm,
  isLoading = false,
  error = null
}) {
  const { t } = useLocalization();
  const [inputValue, setInputValue] = useState('');
  const [validationError, setValidationError] = useState('');

  const isApprove = mode === 'approve';

  // Reset input when dialog opens/closes
  useEffect(() => {
    if (isOpen) {
      setInputValue('');
      setValidationError('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    // Validate rejection reason
    if (!isApprove && (!inputValue.trim() || inputValue.trim().length < 10)) {
      setValidationError(
        t('rejectionReasonMinLength') || 'Rejection reason must be at least 10 characters'
      );
      return;
    }

    setValidationError('');
    await onConfirm(inputValue.trim());
  };

  const handleClose = () => {
    setInputValue('');
    setValidationError('');
    onClose();
  };

  if (!wastage) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isApprove
        ? (t('approveWastage') || 'Approve Wastage')
        : (t('rejectWastage') || 'Reject Wastage')
      }
      size="md"
    >
      <div className="space-y-4">
        {/* Wastage Summary */}
        <div className={`p-4 rounded-lg ${isApprove ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="flex items-start gap-3">
            {isApprove ? (
              <CheckCircle className="w-6 h-6 text-green-600 mt-0.5" />
            ) : (
              <XCircle className="w-6 h-6 text-red-600 mt-0.5" />
            )}
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {wastage.materialName}
              </h4>
              <p className="text-sm text-gray-600">
                {wastage.quantity} {wastage.materialUnit} - {formatCurrency(wastage.totalCost)}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {wastage.wastageTypeName}
              </p>
            </div>
          </div>
        </div>

        {/* Warning for rejection */}
        {!isApprove && (
          <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
            <p className="text-sm text-amber-800">
              {t('rejectionWarning') || 'Rejecting this wastage will require the user to resubmit with corrections.'}
            </p>
          </div>
        )}

        {/* Input Field */}
        <Textarea
          label={isApprove
            ? (t('approvalNotes') || 'Approval Notes (Optional)')
            : (t('rejectionReason') || 'Rejection Reason (Required)')
          }
          value={inputValue}
          onChange={(e) => {
            setInputValue(e.target.value);
            setValidationError('');
          }}
          placeholder={isApprove
            ? (t('approvalNotesPlaceholder') || 'Add any notes for this approval...')
            : (t('rejectionReasonPlaceholder') || 'Explain why this wastage is being rejected...')
          }
          rows={3}
          error={validationError}
          required={!isApprove}
        />

        {/* Error Message */}
        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button
            variant="secondary"
            onClick={handleClose}
            disabled={isLoading}
          >
            {t('cancel') || 'Cancel'}
          </Button>
          <Button
            variant={isApprove ? 'success' : 'danger'}
            onClick={handleConfirm}
            loading={isLoading}
          >
            {isApprove
              ? (t('approve') || 'Approve')
              : (t('reject') || 'Reject')
            }
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default WastageApprovalDialog;
