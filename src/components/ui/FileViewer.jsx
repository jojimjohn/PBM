import React, { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Image as ImageIcon,
  File,
  Download,
  Trash2,
  ExternalLink,
  Loader,
  AlertCircle,
  RefreshCw
} from 'lucide-react'
import './FileViewer.css'

/**
 * FileViewer Component
 *
 * Displays uploaded files with download capability via presigned URLs.
 * Used for viewing attachments on existing records (sales orders, customers, etc.)
 *
 * Usage:
 * <FileViewer
 *   files={[
 *     { id: 1, originalFilename: 'invoice.pdf', contentType: 'application/pdf', fileSize: 245832, downloadUrl: '...' }
 *   ]}
 *   onDelete={(fileId) => handleDelete(fileId)}
 *   onRefreshUrl={(fileId) => handleRefreshUrl(fileId)}
 *   canDelete={hasPermission('DELETE_ATTACHMENTS')}
 * />
 */
const FileViewer = ({
  files = [],
  onDelete,
  onRefreshUrl,
  canDelete = true,
  loading = false,
  emptyMessage = 'No files attached',
  className = '',
  showFileSize = true,
  showUploader = true,
  compact = false
}) => {
  const [deletingIds, setDeletingIds] = useState(new Set())
  const [refreshingIds, setRefreshingIds] = useState(new Set())
  const [errorIds, setErrorIds] = useState(new Set())

  // Format file size
  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  // Get file icon based on content type
  const getFileIcon = (contentType) => {
    if (contentType?.startsWith('image/')) return <ImageIcon size={compact ? 16 : 20} />
    if (contentType?.includes('pdf')) return <FileText size={compact ? 16 : 20} />
    return <File size={compact ? 16 : 20} />
  }

  // Handle file download
  const handleDownload = useCallback(async (file) => {
    // Check if URL might be expired (simple heuristic - if it's been a while)
    if (!file.downloadUrl) {
      if (onRefreshUrl) {
        setRefreshingIds(prev => new Set([...prev, file.id]))
        try {
          await onRefreshUrl(file.id)
        } finally {
          setRefreshingIds(prev => {
            const next = new Set(prev)
            next.delete(file.id)
            return next
          })
        }
      }
      return
    }

    // Open download URL in new tab
    window.open(file.downloadUrl, '_blank', 'noopener,noreferrer')
  }, [onRefreshUrl])

  // Handle refresh URL
  const handleRefreshUrl = useCallback(async (fileId) => {
    if (!onRefreshUrl) return

    setRefreshingIds(prev => new Set([...prev, fileId]))
    setErrorIds(prev => {
      const next = new Set(prev)
      next.delete(fileId)
      return next
    })

    try {
      await onRefreshUrl(fileId)
    } catch (error) {
      setErrorIds(prev => new Set([...prev, fileId]))
    } finally {
      setRefreshingIds(prev => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
    }
  }, [onRefreshUrl])

  // Handle delete
  const handleDelete = useCallback(async (fileId) => {
    if (!onDelete) return

    const confirmed = window.confirm('Are you sure you want to delete this file?')
    if (!confirmed) return

    setDeletingIds(prev => new Set([...prev, fileId]))

    try {
      await onDelete(fileId)
    } catch (error) {
      console.error('Failed to delete file:', error)
    } finally {
      setDeletingIds(prev => {
        const next = new Set(prev)
        next.delete(fileId)
        return next
      })
    }
  }, [onDelete])

  // Loading state
  if (loading) {
    return (
      <div className={`file-viewer-wrapper ${className}`}>
        <div className="file-viewer-loading">
          <Loader size={24} className="spin" />
          <span>Loading files...</span>
        </div>
      </div>
    )
  }

  // Empty state
  if (!files || files.length === 0) {
    return (
      <div className={`file-viewer-wrapper ${className}`}>
        <div className="file-viewer-empty">
          <File size={32} />
          <span>{emptyMessage}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`file-viewer-wrapper ${compact ? 'file-viewer-compact' : ''} ${className}`}>
      <AnimatePresence>
        {files.map((file, index) => {
          const isDeleting = deletingIds.has(file.id)
          const isRefreshing = refreshingIds.has(file.id)
          const hasError = errorIds.has(file.id)

          return (
            <motion.div
              key={file.id || index}
              className={`file-viewer-item ${isDeleting ? 'file-viewer-item-deleting' : ''}`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
            >
              {/* File Icon */}
              <div className="file-viewer-icon">
                {getFileIcon(file.contentType)}
              </div>

              {/* File Info */}
              <div className="file-viewer-info">
                <p className="file-viewer-name" title={file.originalFilename}>
                  {file.originalFilename}
                </p>
                <div className="file-viewer-meta">
                  {showFileSize && file.fileSize && (
                    <span className="file-viewer-size">{formatFileSize(file.fileSize)}</span>
                  )}
                  {showUploader && file.uploaderName && (
                    <span className="file-viewer-uploader">by {file.uploaderName}</span>
                  )}
                  {file.uploadedAt && (
                    <span className="file-viewer-date">{formatDate(file.uploadedAt)}</span>
                  )}
                </div>
                {hasError && (
                  <div className="file-viewer-error">
                    <AlertCircle size={12} />
                    <span>Failed to load. Try refreshing.</span>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="file-viewer-actions">
                {/* Refresh URL button (if expired or error) */}
                {onRefreshUrl && (hasError || !file.downloadUrl) && (
                  <button
                    type="button"
                    className="file-viewer-btn file-viewer-btn-refresh"
                    onClick={() => handleRefreshUrl(file.id)}
                    disabled={isRefreshing}
                    title="Refresh download link"
                  >
                    {isRefreshing ? (
                      <Loader size={16} className="spin" />
                    ) : (
                      <RefreshCw size={16} />
                    )}
                  </button>
                )}

                {/* Download/View button */}
                {file.downloadUrl && (
                  <a
                    href={file.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-viewer-btn file-viewer-btn-download"
                    title="Download file"
                  >
                    <Download size={16} />
                    {!compact && <span>Download</span>}
                  </a>
                )}

                {/* Open in new tab */}
                {file.downloadUrl && file.contentType?.startsWith('image/') && (
                  <a
                    href={file.downloadUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="file-viewer-btn file-viewer-btn-view"
                    title="View in new tab"
                  >
                    <ExternalLink size={16} />
                  </a>
                )}

                {/* Delete button */}
                {canDelete && onDelete && (
                  <button
                    type="button"
                    className="file-viewer-btn file-viewer-btn-delete"
                    onClick={() => handleDelete(file.id)}
                    disabled={isDeleting}
                    title="Delete file"
                  >
                    {isDeleting ? (
                      <Loader size={16} className="spin" />
                    ) : (
                      <Trash2 size={16} />
                    )}
                  </button>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
}

export default FileViewer
