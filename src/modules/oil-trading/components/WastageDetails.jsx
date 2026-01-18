import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../../../components/ui/Modal'
import { useLocalization } from '../../../context/LocalizationContext'
import { WASTAGE_TYPE_COLORS } from '../pages/Wastage'
import { WastageApprovalDialog } from './wastage'
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
  ExternalLink,
  Edit
} from 'lucide-react'

const WastageDetails = ({
  isOpen,
  onClose,
  wastage,
  materials = [],
  wasteTypes = [],
  onApprove,
  onReject,
  onEdit, // New prop for editing wastage
  canApprove = false,
  canEdit = false // New prop to control edit button visibility
}) => {
  const { t } = useLocalization()
  const navigate = useNavigate()

  // Dialog state - using unified state for both approve/reject dialogs
  const [dialogMode, setDialogMode] = useState(null) // 'approve' | 'reject' | null
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
          className: 'bg-amber-100 text-amber-800',
          icon: Clock
        }
      case 'approved':
        return {
          label: t('approved', 'Approved'),
          className: 'bg-emerald-100 text-emerald-800',
          icon: CheckCircle
        }
      case 'rejected':
        return {
          label: t('rejected', 'Rejected'),
          className: 'bg-red-100 text-red-800',
          icon: XCircle
        }
      default:
        return {
          label: status,
          className: 'bg-gray-100 text-gray-700',
          icon: Clock
        }
    }
  }

  const statusInfo = getStatusInfo(wastage.status)
  const StatusIcon = statusInfo.icon

  // Check if wastage is pending (handle both status values)
  const isPending = wastage.status === 'pending' || wastage.status === 'pending_approval'

  // Check if wastage can be edited (not approved - so pending or rejected)
  const isEditable = wastage.status !== 'approved'

  // Handle approval/rejection via WastageApprovalDialog
  const handleDialogConfirm = async (notes) => {
    setProcessing(true)
    setError(null)

    try {
      if (dialogMode === 'approve') {
        await onApprove(wastage.id, { status: 'approved', approvalNotes: notes })
      } else {
        await onReject(wastage.id, { status: 'rejected', approvalNotes: notes })
      }
      setDialogMode(null)
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
        className="max-w-[1000px] w-[95vw] min-w-[700px] max-md:min-w-0 max-md:w-[98vw]"
      >
        <div className="flex flex-col gap-4">
          {/* Material Info Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
              <Package size={18} />
              {t('materialInfo', 'Material Information')}
            </h4>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('material', 'Material')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{material.name || wastage.materialName || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('materialCode', 'Material Code')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{material.materialCode || wastage.materialCode || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('unit', 'Unit')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{material.unit || wastage.unit || '-'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('wasteType', 'Waste Type')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">
                  <span
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium"
                    style={{ backgroundColor: `${wasteTypeColor}20`, color: wasteTypeColor }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: wasteTypeColor }} />
                    {wasteType.label || wastage.wasteType || '-'}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Quantities & Costs Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
              <DollarSign size={18} />
              {t('quantitiesAndCosts', 'Quantities & Costs')}
            </h4>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('quantity', 'Quantity')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">
                  {wastage.quantity || 0} {material.unit || wastage.unit || ''}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('unitCost', 'Unit Cost')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{formatCurrency(wastage.unitCost)}</span>
              </div>
              <div className="flex flex-col gap-1 bg-blue-100 p-2 rounded-md">
                <span className="text-xs text-gray-500 font-medium">{t('totalCost', 'Total Cost')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{formatCurrency(totalCost)}</span>
              </div>
            </div>
          </div>

          {/* Dates Section */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
              <Calendar size={18} />
              {t('dates', 'Dates')}
            </h4>
            <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('wastageDate', 'Wastage Date')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{formatDate(wastage.wastageDate || wastage.date)}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs text-gray-500 font-medium">{t('createdAt', 'Created')}</span>
                <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{formatDate(wastage.createdAt)}</span>
              </div>
              {wastage.status === 'approved' && wastage.approvedAt && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-medium">{t('approvedAtLabel', 'Approved At')}</span>
                  <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{formatDate(wastage.approvedAt)}</span>
                </div>
              )}
              {wastage.status === 'rejected' && wastage.rejectedAt && (
                <div className="flex flex-col gap-1">
                  <span className="text-xs text-gray-500 font-medium">{t('rejectedAt', 'Rejected At')}</span>
                  <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{formatDate(wastage.rejectedAt)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Status Section */}
          <div className="bg-gray-50 rounded-lg py-3 px-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">{t('status', 'Status')}</h4>
            <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium ${statusInfo.className}`}>
              <StatusIcon size={16} />
              {statusInfo.label}
            </div>
          </div>

          {/* Approval Info Section (only if processed) */}
          {!isPending && (
            <div className={`rounded-lg p-4 border ${wastage.status === 'approved' ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
              <h4 className={`flex items-center gap-2 text-sm font-semibold m-0 mb-3 pb-2 border-b ${wastage.status === 'approved' ? 'text-emerald-800 border-emerald-200' : 'text-red-800 border-red-200'}`}>
                {wastage.status === 'approved' ? <CheckCircle size={18} /> : <XCircle size={18} />}
                {t('approvalInfo', 'Approval Information')}
              </h4>
              <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                {wastage.status === 'approved' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium">{t('approvedByLabel', 'Approved By')}</span>
                      <span className="text-sm text-gray-900 font-medium flex items-center gap-1">
                        <User size={14} />
                        {wastage.approvedByName && wastage.approvedByLastName
                          ? `${wastage.approvedByName} ${wastage.approvedByLastName}`
                          : wastage.approvedByName || '-'}
                      </span>
                    </div>
                    {wastage.approvalNotes && (
                      <div className="flex flex-col gap-1 col-span-2 max-sm:col-span-1">
                        <span className="text-xs text-gray-500 font-medium">{t('approvalNotesLabel', 'Approval Notes')}</span>
                        <span className="text-sm text-gray-900 font-medium flex items-center gap-1">{wastage.approvalNotes}</span>
                      </div>
                    )}
                  </>
                )}
                {wastage.status === 'rejected' && (
                  <>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs text-gray-500 font-medium">{t('rejectedByLabel', 'Rejected By')}</span>
                      <span className="text-sm text-gray-900 font-medium flex items-center gap-1">
                        <User size={14} />
                        {wastage.approvedByName && wastage.approvedByLastName
                          ? `${wastage.approvedByName} ${wastage.approvedByLastName}`
                          : wastage.approvedByName || '-'}
                      </span>
                    </div>
                    <div className="flex flex-col gap-1 col-span-2 max-sm:col-span-1">
                      <span className="text-xs text-gray-500 font-medium">{t('rejectionReasonLabel', 'Rejection Reason')}</span>
                      <span className="text-sm text-red-700 font-medium italic flex items-center gap-1">{wastage.rejectionReason || '-'}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Collection Link Section */}
          {wastage.collectionOrderId && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
                <LinkIcon size={18} />
                {t('linkedCollection', 'Linked Collection')}
              </h4>
              <div className="py-2">
                {wastage.collectionDeleted ? (
                  <span className="inline-flex items-center gap-2 text-gray-500">
                    {wastage.collectionReference || wastage.collectionOrderId}
                    <span className="text-xs text-gray-400 italic">{t('collectionDeleted', '(Deleted)')}</span>
                  </span>
                ) : (
                  <button
                    className="inline-flex items-center gap-2 px-3 py-2 bg-blue-100 border border-blue-300 rounded-md text-blue-800 text-sm font-medium cursor-pointer transition-colors hover:bg-blue-200"
                    onClick={handleViewCollection}
                  >
                    <ExternalLink size={14} />
                    {t('viewCollection', 'View Collection')} #{wastage.collectionReference || wastage.collectionOrderId}
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Location Section */}
          {wastage.location && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
                <MapPin size={18} />
                {t('wastageLocation', 'Location')}
              </h4>
              <p className="text-sm text-gray-700 m-0 leading-relaxed">{wastage.location}</p>
            </div>
          )}

          {/* Attachments Section */}
          {wastage.attachments && wastage.attachments.length > 0 && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
                <FileText size={18} />
                {t('attachments', 'Attachments')}
              </h4>
              <div className="flex flex-wrap gap-2">
                {wastage.attachments.map((attachment, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-md cursor-pointer transition-colors hover:bg-gray-100 hover:border-gray-300"
                    onClick={() => handleOpenAttachment(attachment)}
                  >
                    {attachment.type?.startsWith('image/') ? (
                      <ImageIcon size={24} />
                    ) : (
                      <FileText size={24} />
                    )}
                    <span className="max-w-[150px] overflow-hidden text-ellipsis whitespace-nowrap text-xs text-gray-700">{attachment.name || `Attachment ${index + 1}`}</span>
                    <Download size={14} className="text-gray-500" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description Section */}
          {(wastage.reason || wastage.description) && (
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-700 m-0 mb-3 pb-2 border-b border-gray-200">
                <FileText size={18} />
                {t('description', 'Description')}
              </h4>
              {wastage.reason && (
                <div className="mb-3 last:mb-0">
                  <span className="text-xs font-medium text-gray-500 block mb-1">{t('wastageReason', 'Reason')}:</span>
                  <p className="text-sm text-gray-700 m-0 leading-relaxed">{wastage.reason}</p>
                </div>
              )}
              {wastage.description && (
                <div className="mb-3 last:mb-0">
                  <span className="text-xs font-medium text-gray-500 block mb-1">{t('wastageDescription', 'Description')}:</span>
                  <p className="text-sm text-gray-700 m-0 leading-relaxed">{wastage.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Modal Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-2 max-sm:flex-col-reverse">
            {/* Edit button for unapproved wastages (pending or rejected) */}
            {canEdit && isEditable && onEdit && (
              <button
                className="btn btn-outline max-sm:w-full"
                onClick={() => {
                  onEdit(wastage)
                  onClose()
                }}
              >
                <Edit size={16} />
                {t('edit', 'Edit')}
              </button>
            )}
            {canApprove && isPending && (
              <>
                <button
                  className="btn bg-red-500 text-white hover:bg-red-600 max-sm:w-full"
                  onClick={() => {
                    setError(null)
                    setDialogMode('reject')
                  }}
                >
                  <XCircle size={16} />
                  {t('reject', 'Reject')}
                </button>
                <button
                  className="btn bg-emerald-500 text-white hover:bg-emerald-600 max-sm:w-full"
                  onClick={() => {
                    setError(null)
                    setDialogMode('approve')
                  }}
                >
                  <CheckCircle size={16} />
                  {t('approve', 'Approve')}
                </button>
              </>
            )}
            <button className="btn btn-primary max-sm:w-full" onClick={onClose}>
              {t('close', 'Close')}
            </button>
          </div>
        </div>
      </Modal>

      {/* Unified Approval/Rejection Dialog - Using reusable WastageApprovalDialog component */}
      <WastageApprovalDialog
        isOpen={dialogMode !== null}
        onClose={() => !processing && setDialogMode(null)}
        mode={dialogMode || 'approve'}
        wastage={{
          ...wastage,
          materialName: material.name || wastage.materialName,
          materialUnit: material.unit || wastage.unit,
          totalCost: totalCost,
          wastageTypeName: wasteType.label || wastage.wasteType
        }}
        onConfirm={handleDialogConfirm}
        isLoading={processing}
        error={error}
      />
    </>
  )
}

export default WastageDetails
