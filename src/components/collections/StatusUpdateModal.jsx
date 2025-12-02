import React, { useState, useEffect } from 'react';
import { CheckCircle, Clock, Truck, Package, XCircle, AlertCircle, Calendar, Navigation, PackageSearch } from 'lucide-react';
import toast from 'react-hot-toast';
import { useLocalization } from '../../context/LocalizationContext';
import Modal from '../ui/Modal';
import { calloutService } from '../../services/collectionService';
import '../../styles/CustomToast.css';

/**
 * StatusUpdateModal Component
 *
 * @param {Object} collectionOrder - Collection order to update
 * @param {boolean} isOpen - Modal visibility state
 * @param {Function} onClose - Close modal callback
 * @param {Function} onSuccess - Callback after successful status update
 */
const StatusUpdateModal = ({ collectionOrder, isOpen, onClose, onSuccess = () => {} }) => {
  const { t, isRTL } = useLocalization();
  const [selectedStatus, setSelectedStatus] = useState('');
  const [statusNotes, setStatusNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Define all possible statuses (matching database ENUM)
  const allStatusOptions = [
    { value: 'scheduled', label: t('status_scheduled') || 'Scheduled', icon: Calendar, color: 'blue', description: t('statusDesc_scheduled') || 'Collection is planned and scheduled' },
    { value: 'in_transit', label: t('status_in_transit') || 'In Transit', icon: Truck, color: 'purple', description: t('statusDesc_in_transit') || 'Driver heading to location' },
    { value: 'collecting', label: t('status_collecting') || 'Collecting', icon: Package, color: 'orange', description: t('statusDesc_collecting') || 'Collecting materials at location' },
    { value: 'completed', label: t('status_completed') || 'Completed', icon: CheckCircle, color: 'green', description: t('statusDesc_completed') || 'Collection finished successfully' },
    { value: 'cancelled', label: t('status_cancelled') || 'Cancelled', icon: XCircle, color: 'red', description: t('statusDesc_cancelled') || 'Collection has been cancelled' },
    { value: 'failed', label: t('status_failed') || 'Failed', icon: AlertCircle, color: 'yellow', description: t('statusDesc_failed') || 'Collection failed - can retry' }
  ];

  // Show all statuses except the current one
  const statusOptions = collectionOrder
    ? allStatusOptions.filter(option => option.value !== collectionOrder.status)
    : allStatusOptions;

  useEffect(() => {
    if (collectionOrder && isOpen) {
      // Don't pre-select a status - let user choose
      setSelectedStatus('');
      setStatusNotes('');
      setErrors({});
    }
  }, [collectionOrder, isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (!selectedStatus) {
      newErrors.status = t('statusRequired');
    }

    // Require notes for certain status changes (cancelled, completed, failed)
    if ((selectedStatus === 'cancelled' || selectedStatus === 'completed' || selectedStatus === 'failed') && !statusNotes.trim()) {
      newErrors.statusNotes = t('notesRequiredForStatus');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    // Show loading toast
    const toastId = toast.loading(t('updatingStatus'));

    try {
      // Prepare status update payload
      const statusData = {
        status: selectedStatus,
        notes: statusNotes.trim() // Backend expects 'notes', not 'statusNotes'
      };

      // Call backend API to persist status change (Task 2.3)
      const result = await calloutService.updateCalloutStatus(collectionOrder.id, statusData);

      if (!result.success) {
        throw new Error(result.error || t('errorUpdatingStatus'));
      }

      // Dismiss loading toast
      toast.dismiss(toastId);

      // Show success toast
      toast.success(t('statusUpdatedSuccessfully'), {
        duration: 3000,
        style: {
          background: '#f0fdf4',
          border: '1px solid #bbf7d0',
          color: '#166534',
        },
        iconTheme: {
          primary: '#16a34a',
          secondary: '#f0fdf4',
        },
      });

      // Task 2.5: Call onSuccess to refresh parent data
      await onSuccess();

      // Close modal
      onClose();
    } catch (error) {
      console.error('Error updating status:', error);

      // Dismiss loading toast
      toast.dismiss(toastId);

      // Task 2.4: Show custom error toast with retry button
      toast.custom((toastInstance) => (
        <div className="custom-toast custom-toast-error">
          <div className="toast-content">
            <div className="toast-title">{t('statusUpdateFailed')}</div>
            <div className="toast-message">{error.message || t('errorUpdatingStatus')}</div>
          </div>
          <button
            className="toast-retry-btn"
            onClick={() => {
              toast.dismiss(toastInstance.id);
              handleSubmit(e);
            }}
          >
            {t('retry')}
          </button>
          <button
            className="toast-dismiss"
            onClick={() => toast.dismiss(toastInstance.id)}
          >
            ×
          </button>
        </div>
      ), { duration: 5000 });

      // Set error state for inline display
      setErrors({ submit: error.message || t('errorUpdatingStatus') });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusIcon = (statusValue) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option ? option.icon : Clock;
  };

  const getStatusColor = (statusValue) => {
    const option = statusOptions.find(opt => opt.value === statusValue);
    return option ? option.color : 'gray';
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('updateStatus')}
      size="medium"
    >
      <form onSubmit={handleSubmit} style={{ padding: '24px', direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Current Status Banner */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: `var(--${getStatusColor(collectionOrder?.status)}-50)`,
          borderRadius: '8px',
          border: `1px solid var(--${getStatusColor(collectionOrder?.status)}-200)`
        }}>
          <p style={{ margin: '0 0 4px 0', fontSize: '12px', fontWeight: '600', color: `var(--${getStatusColor(collectionOrder?.status)}-700)`, textTransform: 'uppercase' }}>
            {t('currentStatus')}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {React.createElement(getStatusIcon(collectionOrder?.status), {
              style: { width: '20px', height: '20px', color: `var(--${getStatusColor(collectionOrder?.status)}-600)` }
            })}
            <span style={{ fontSize: '16px', fontWeight: '600', color: `var(--${getStatusColor(collectionOrder?.status)}-900)` }}>
              {t(`status_${collectionOrder?.status}`)}
            </span>
          </div>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: `var(--${getStatusColor(collectionOrder?.status)}-700)` }}>
            {t('calloutNumber')}: #{collectionOrder?.calloutNumber || collectionOrder?.id}
          </p>
        </div>

        {/* Status Selection */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '12px',
            fontSize: '14px',
            fontWeight: '600',
            color: 'var(--gray-700)'
          }}>
            {t('selectNewStatus')} *
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedStatus === option.value;
              const isCurrentStatus = collectionOrder?.status === option.value;

              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setSelectedStatus(option.value)}
                  disabled={isCurrentStatus}
                  style={{
                    padding: '12px',
                    border: `2px solid ${isSelected ? `var(--${option.color}-500)` : 'var(--gray-200)'}`,
                    borderRadius: '8px',
                    backgroundColor: isSelected ? `var(--${option.color}-50)` : 'white',
                    cursor: isCurrentStatus ? 'not-allowed' : 'pointer',
                    opacity: isCurrentStatus ? 0.5 : 1,
                    textAlign: 'left',
                    transition: 'all 0.2s',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <Icon style={{
                      width: '18px',
                      height: '18px',
                      color: isSelected ? `var(--${option.color}-600)` : 'var(--gray-500)'
                    }} />
                    <span style={{
                      fontSize: '14px',
                      fontWeight: '600',
                      color: isSelected ? `var(--${option.color}-900)` : 'var(--gray-700)'
                    }}>
                      {option.label}
                    </span>
                    {isCurrentStatus && (
                      <span style={{
                        fontSize: '10px',
                        padding: '2px 6px',
                        borderRadius: '4px',
                        backgroundColor: `var(--${option.color}-100)`,
                        color: `var(--${option.color}-700)`,
                        fontWeight: '600'
                      }}>
                        {t('current')}
                      </span>
                    )}
                  </div>
                  <p style={{
                    margin: 0,
                    fontSize: '12px',
                    color: isSelected ? `var(--${option.color}-700)` : 'var(--gray-600)',
                    lineHeight: '1.4'
                  }}>
                    {option.description}
                  </p>
                </button>
              );
            })}
          </div>
          {errors.status && (
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: 'var(--red-600)' }}>
              <AlertCircle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              {errors.status}
            </p>
          )}
        </div>

        {/* Status Notes */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--gray-700)'
          }}>
            {t('statusNotes')} {(selectedStatus === 'cancelled' || selectedStatus === 'completed' || selectedStatus === 'failed') && '*'}
          </label>
          <textarea
            value={statusNotes}
            onChange={(e) => {
              setStatusNotes(e.target.value);
              if (errors.statusNotes) {
                setErrors(prev => ({ ...prev, statusNotes: '' }));
              }
            }}
            placeholder={t('enterStatusNotes')}
            rows={3}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${errors.statusNotes ? 'var(--red-500)' : 'var(--gray-300)'}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              resize: 'vertical',
              fontFamily: 'inherit'
            }}
            required={selectedStatus === 'cancelled' || selectedStatus === 'completed' || selectedStatus === 'failed'}
          />
          {errors.statusNotes && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--red-600)' }}>
              <AlertCircle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              {errors.statusNotes}
            </p>
          )}
          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--gray-500)' }}>
            {t('statusNotesHint')}
          </p>
        </div>

        {/* Warning for Critical Status Changes */}
        {(selectedStatus === 'cancelled' || selectedStatus === 'completed' || selectedStatus === 'failed') && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: 'var(--yellow-50)',
            border: '1px solid var(--yellow-300)',
            borderRadius: '6px'
          }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: 'var(--yellow-600)', flexShrink: 0, marginTop: '2px' }} />
              <p style={{ margin: 0, fontSize: '13px', color: 'var(--yellow-900)', lineHeight: '1.5' }}>
                {selectedStatus === 'completed'
                  ? t('statusCompletedWarning')
                  : selectedStatus === 'failed'
                  ? (t('statusFailedWarning') || 'This collection will be marked as failed. You can retry by scheduling it again.')
                  : t('statusCancelledWarning')
                }
              </p>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {errors.submit && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: 'var(--red-50)',
            border: '1px solid var(--red-200)',
            borderRadius: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--red-700)' }}>
              <AlertCircle style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: 'var(--gray-700)',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting || selectedStatus === collectionOrder?.status}
            style={{
              padding: '10px 20px',
              backgroundColor: (submitting || selectedStatus === collectionOrder?.status) ? 'var(--primary-400)' : 'var(--primary-600)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (submitting || selectedStatus === collectionOrder?.status) ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {submitting ? t('updating') : t('updateStatus')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default StatusUpdateModal;
