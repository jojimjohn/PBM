/**
 * Attachments Section Component
 *
 * Manages file uploads and display for customer records.
 * Uses the useAttachments hook for state management.
 */

import React from 'react'
import { FileText } from 'lucide-react'
import FileUpload from '../../../../components/ui/FileUpload'
import FileViewer from '../../../../components/ui/FileViewer'
import { useAttachments } from '../../hooks/useAttachments'

/**
 * Attachments section for customer form
 * Only renders when editing an existing customer (needs entity ID)
 *
 * @param {Object} props
 * @param {number|null} props.customerId - Customer ID (null for new customers)
 * @param {Function} props.t - Translation function
 */
const AttachmentsSection = ({ customerId, t }) => {
  const {
    attachments,
    loading,
    uploadFiles,
    deleteFile,
    refreshFileUrl
  } = useAttachments('customers', customerId)

  // Don't render for new customers (no ID yet)
  if (!customerId) return null

  const handleUpload = async (files) => {
    const result = await uploadFiles(files)
    if (result.success) {
      alert('Files uploaded successfully')
    } else {
      alert('Failed to upload files: ' + result.error)
    }
  }

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return

    const result = await deleteFile(fileId)
    if (result.success) {
      alert('File deleted successfully')
    } else {
      alert('Failed to delete file: ' + result.error)
    }
  }

  return (
    <div className="form-section">
      <div className="form-section-title">
        <FileText size={16} />
        Attachments
      </div>

      <div style={{ padding: '1.25rem' }}>
        <FileUpload
          mode="multiple"
          accept=".pdf,.jpg,.jpeg,.png"
          maxSize={5242880} // 5MB
          maxFiles={10}
          onUpload={handleUpload}
          existingFiles={[]}
        />

        {loading ? (
          <div className="attachments-loading">Loading attachments...</div>
        ) : attachments.length > 0 ? (
          <FileViewer
            files={attachments}
            onDelete={handleDelete}
            onRefreshUrl={refreshFileUrl}
            canDelete={true}
          />
        ) : (
          <div className="empty-state text-sm">{t('noAttachments')}</div>
        )}
      </div>
    </div>
  )
}

export default AttachmentsSection
