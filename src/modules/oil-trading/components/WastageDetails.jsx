import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../../components/ui/Modal'
import { Textarea } from '../../../components/ui/Input'
import { useLocalization } from '../../../context/LocalizationContext'
import { WASTAGE_TYPE_COLORS } from '../pages/Wastage'
import {
  Package,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Link as LinkIcon,
  Image as ImageIcon,
  Download,
  AlertTriangle,
  Loader2,
  ExternalLink
} from 'lucide-react'
import './WastageDetails.css'

const WastageDetails = ({
  isOpen,
  onClose,
  wastage,
  materials = [],
  wasteTypes = [],
  onApprove,
  onReject,
  canApprove = false
}) => {
  const { t } = useLocalization()
  const navigate = useNavigate()

  // Dialog state
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectionDialog, setShowRejectionDialog] = useState(false)
  const [approvalNotes, setApprovalNotes] = useState('')
  const [rejectionReason, setRejectionReason] = useState('')
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState(null)

  if (!wastage) return null

  // Get material details
  const material = materials.find(m => m.id === wastage.materialId) || {}

  // Get waste type label
  const wasteType = wasteTypes.find(wt => wt.value === wastage.wasteType) || {}
  const wasteTypeColor = WASTAGE_TYPE_COLORS[wastage.wasteType] || WASTAGE_TYPE_COLORS.other

  // Calculate total cost
  const totalCost = (wastage.quantity || 0) * (wastage.unitCost || 0)

  // Format date helper
  const formatDate = (dateString) => {
    if (!dateString) return '-'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // Format currency
  const formatCurrency = (amount) => {
    const num = parseFloat(amount) || 0
    return `OMR ${num.toFixed(3)}`
  }

  // Get status info
  const getStatusInfo = (status) => {
    switch (status) {
      case 'pending':
      case 'pending_approval':
        return {
          label: t('pendingApproval', 'Pending Approval'),
          className: 'status-pending',
          icon: Clock
        }
      case 'approved':
        return {
          label: t('approved', 'Approved'),
          className: 'status-approved',
          icon: CheckCircle
        }
      case 'rejected':
        return {
          label: t('rejected', 'Rejected'),
          className: 'status-rejected',
          icon: XCircle
        }
      default:
        return {
          label: status,
          className: 'status-default',
          icon: Clock
        }
    }
  }

  const statusInfo = getStatusInfo(wastage.status)
  const StatusIcon = statusInfo.icon

  // Check if wastage is pending (handle both status values)
  const isPending = wastage.status === 'pending' || wastage.status === 'pending_approval'

  // Handle approval
  const handleApprove = async () => {
    setProcessing(true)
    setError(null)

    try {
      await onApprove(wastage.id, { notes: approvalNotes })
      setShowApprovalDialog(false)
      setApprovalNotes('')
    } catch (err) {
      setError(err.message || t('networkErrorRetry', 'Network error. Please try again.'))
    } finally {
      setProcessing(false)
    }
  }

  // Handle rejection
  const handleReject = async () => {
    if (rejectionReason.length < 10) return

    setProcessing(true)
    setError(null)

    try {
      await onReject(wastage.id, { reason: rejectionReason })
      setShowRejectionDialog(false)
      setRejectionReason('')
    } catch (err) {
      setError(err.message || t('networkErrorRetry', 'Network error. Please try again.'))
    } finally {
      setProcessing(false)
    }
  }

  // Navigate to collection
  const handleViewCollection = () => {
    if (wastage.collectionOrderId && !wastage.collectionDeleted) {
      navigate(`/collections?id=${wastage.collectionOrderId}`)
      onClose()
    }
  }

  // Open attachment
  const handleOpenAttachment = (attachment) => {
    if (attachment.data) {
      // Base64 data
      const link = document.createElement('a')
      link.href = attachment.data
      link.download = attachment.name || 'attachment'
      link.target = '_blank'
      link.click()
    } else if (attachment.url) {
      window.open(attachment.url, '_blank')
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`${t('wastageNumber', 'Wastage Number')}: ${wastage.referenceNumber || wastage.id}`}
        className="wastage-details-modal"
      >
        <div className="wastage-details">
          {/* Material Info Section */}
          <div className="detail-section">
            <h4 className="section-header">
              <Package size={18} />
              {t('materialInfo', 'Material Information')}
            </h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">{t('material', 'Material')}</span>
                <span className="detail-value">{material.name || wastage.materialName || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('materialCode', 'Material Code')}</span>
                <span className="detail-value">{material.materialCode || wastage.materialCode || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('unit', 'Unit')}</span>
                <span className="detail-value">{material.unit || wastage.unit || '-'}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('wasteType', 'Waste Type')}</span>
                <span className="detail-value">
                  <span
                    className="type-badge"
                    style={{ backgroundColor: `${wasteTypeColor}20`, color: wasteTypeColor }}
                  >
                    <span className="type-dot" style={{ backgroundColor: wasteTypeColor }} />
                    {wasteType.label || wastage.wasteType || '-'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quantities & Costs Section */}
          <div className="detail-section">
            <h4 className="section-header">
              <DollarSign size={18} />
              {t('quantitiesAndCosts', 'Quantities & Costs')}
            </h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">{t('quantity', 'Quantity')}</span>
                <span className="detail-value">
                  {wastage.quantity || 0} {material.unit || wastage.unit || ''}
                </span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('unitCost', 'Unit Cost')}</span>
                <span className="detail-value">{formatCurrency(wastage.unitCost)}</span>
              </div>
              <div className="detail-item highlight">
                <span className="detail-label">{t('totalCost', 'Total Cost')}</span>
                <span className="detail-value">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="detail-section">
            <h4 className="section-header">
              <Calendar size={18} />
              {t('dates', 'Dates')}
            </h4>
            <div className="detail-grid">
              <div className="detail-item">
                <span className="detail-label">{t('wastageDate', 'Wastage Date')}</span>
                <span className="detail-value">{formatDate(wastage.wastageDate || wastage.date)}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">{t('createdAt', 'Created')}</span>
                <span className="detail-value">{formatDate(wastage.createdAt)}</span>
              </div>
              {wastage.status === 'approved' && wastage.approvedAt && (
                <div className="detail-item">
                  <span className="detail-label">{t('approvedAtLabel', 'Approved At')}</span>
                  <span className="detail-value">{formatDate(wastage.approvedAt)}</span>
                </div>
              )}
              {wastage.status === 'rejected' && wastage.rejectedAt && (
                <div className="detail-item">
                  <span className="detail-label">{t('rejectedAt', 'Rejected At')}</span>
                  <span className="detail-value">{formatDate(wastage.rejectedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="detail-section status-section">
            <h4 className="section-header">{t('status', 'Status')}</h4>
            <div className={`status-badge ${statusInfo.className}`}>
              <StatusIcon size={16} />
              {statusInfo.label}
            </div>
          </div>

          {/* Approval Info Section (only if processed) */}
          {!isPending && (
            <div className={`detail-section approval-info-section ${wastage.status === 'approved' ? 'approved' : 'rejected'}`}>
              <h4 className="section-header">
                {wastage.status === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {t('approvalInfo', 'Approval Information')}
              </h4>
              <div className="detail-grid">
                {wastage.status === 'approved' && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">{t('approvedByLabel', 'Approved By')}</span>
                      <span className="detail-value">
                        <User size={14} />
                        {wastage.approvedByName || wastage.approvedBy || '-'}
                      </span>
                    </div>
                    {wastage.approvalNotes && (
                      <div className="detail-item full-width">
                        <span className="detail-label">{t('approvalNotesLabel', 'Approval Notes')}</span>
                        <span className="detail-value">{wastage.approvalNotes}</span>
                      </div>
                    )}
                  </>
                )}
                {wastage.status === 'rejected' && (
                  <>
                    <div className="detail-item">
                      <span className="detail-label">{t('rejectedByLabel', 'Rejected By')}</span>
                      <span className="detail-value">
                        <User size={14} />
                        {wastage.rejectedByName || wastage.rejectedBy || '-'}
                      </span>
                    </div>
                    <div className="detail-item full-width">
                      <span className="detail-label">{t('rejectionReasonLabel', 'Rejection Reason')}</span>
                      <span className="detail-value rejection-reason">{wastage.rejectionReason || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Collection Link Section */}
          {wastage.collectionOrderId && (
            <div className="detail-section">
              <h4 className="section-header">
                <LinkIcon size={18} />
                {t('linkedCollection', 'Linked Collection')}
              </h4>
              <div className="collection-link">
                {wastage.collectionDeleted ? (
                  <span className="deleted-collection">
                    {wastage.collectionReference || wastage.collectionOrderId}
                    <span className="deleted-tag">{t('collectionDeleted', '(Deleted)')}</span>
                  </span>
                ) : (
                  <button className="collection-link-btn" onClick={handleViewCollection}>
                    <ExternalLink size={14} />
                    {t('viewCollection', 'View Collection')} #{wastage.collectionReference || wastage.collectionOrderId}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Location Section */}
          {wastage.location && (
            <div className="detail-section">
              <h4 className="section-header">
                <MapPin size={18} />
                {t('wastageLocation', 'Location')}
              </h4>
              <p className="detail-text">{wastage.location}</p>
            </div>
          )}

          {/* Attachments Section */}
          {wastage.attachments && wastage.attachments.length > 0 && (
            <div className="detail-section">
              <h4 className="section-header">
                <FileText size={18} />
                {t('attachments', 'Attachments')}
              </h4>
              <div className="attachment-gallery">
                {wastage.attachments.map((attachment, index) => (
                  <div key={index} className="attachment-item" onClick={() => handleOpenAttachment(attachment)}>
                    {attachment.type?.startsWith('image/') ? (
                      <ImageIcon size={24} />
                    ) : (
                      <FileText size={24} />
                    )}
                    <span className="attachment-name">{attachment.name || `Attachment ${index + 1}`}</span>
                    <Download size={14} className="download-icon" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          {(wastage.reason || wastage.description) && (
            <div className="detail-section">
              <h4 className="section-header">
                <FileText size={18} />
                {t('description', 'Description')}
              </h4>
              {wastage.reason && (
                <div className="description-block">
                  <span className="description-label">{t('wastageReason', 'Reason')}:</span>
                  <p className="detail-text">{wastage.reason}</p>
                </div>
              )}
              {wastage.description && (
                <div className="description-block">
                  <span className="description-label">{t('wastageDescription', 'Description')}:</span>
                  <p className="detail-text">{wastage.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="modal-actions">
            {canApprove && isPending && (
              <>
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    setError(null)
                    setShowRejectionDialog(true)
                  }}
                >
                  <XCircle size={16} />
                  {t('reject', 'Reject')}
                </button>
                <button
                  className="btn btn-success"
                  onClick={() => {
                    setError(null)
                    setShowApprovalDialog(true)
                  }}
                >
                  <CheckCircle size={16} />
                  {t('approve', 'Approve')}
                </button>
              </>
            )}
            <button className="btn btn-primary" onClick={onClose}>
              {t('close', 'Close')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Approval Confirmation Dialog */}
      <Modal
        isOpen={showApprovalDialog}
        onClose={() => !processing && setShowApprovalDialog(false)}
        title={t('approveWastage', 'Approve Wastage')}
        className="approval-dialog"
      >
        <div className="dialog-content">
          {error && (
            <div className="dialog-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <p className="dialog-message">
            {t('approveWastageConfirm', 'Are you sure you want to approve this wastage?')}
          </p>
          <div className="dialog-input">
            <label>{t('approvalNotesLabel', 'Approval Notes')}</label>
            <Textarea
              value={approvalNotes}
              onChange={(e) => setApprovalNotes(e.target.value)}
              placeholder={t('optionalNotes', 'Optional notes...')}
              rows={3}
              disabled={processing}
            />
          </div>
          <div className="dialog-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowApprovalDialog(false)}
              disabled={processing}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              className="btn btn-success"
              onClick={handleApprove}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="spin" size={16} />
                  {t('approving', 'Approving...')}
                </>
              ) : (
                <>
                  <CheckCircle size={16} />
                  {t('confirm', 'Confirm')}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Rejection Dialog */}
      <Modal
        isOpen={showRejectionDialog}
        onClose={() => !processing && setShowRejectionDialog(false)}
        title={t('rejectWastage', 'Reject Wastage')}
        className="rejection-dialog"
      >
        <div className="dialog-content">
          {error && (
            <div className="dialog-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          <p className="dialog-message">
            {t('rejectWastageConfirm', 'Please provide a reason for rejection:')}
          </p>
          <div className="dialog-input">
            <Textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder={t('enterRejectionReason', 'Enter rejection reason...')}
              rows={3}
              disabled={processing}
            />
            <div className="char-count">
              <span className={rejectionReason.length < 10 ? 'insufficient' : 'sufficient'}>
                {rejectionReason.length}/10
              </span>
              {rejectionReason.length < 10 && (
                <span className="hint">{t('minRejectionChars', 'Minimum 10 characters required')}</span>
              )}
            </div>
          </div>
          <div className="dialog-actions">
            <button
              className="btn btn-outline"
              onClick={() => setShowRejectionDialog(false)}
              disabled={processing}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              className="btn btn-danger"
              onClick={handleReject}
              disabled={processing || rejectionReason.length < 10}
            >
              {processing ? (
                <>
                  <Loader2 className="spin" size={16} />
                  {t('rejecting', 'Rejecting...')}
                </>
              ) : (
                <>
                  <XCircle size={16} />
                  {t('confirmReject', 'Confirm Rejection')}
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default WastageDetails
