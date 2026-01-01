import React, { useState, useCallback, forwardRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, FileText, Image as ImageIcon, Loader,
  AlertCircle, Check, Eye, Download, RefreshCw, Trash2
} from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
import storageService from '../../services/storageService'
import './ReceiptUpload.css'

/**
 * ReceiptUpload Component
 *
 * Single file upload component for petty cash expense receipts.
 * Integrates with S3 storage via pettyCashService.
 *
 * Usage:
 * <ReceiptUpload
 *   value={selectedFile}
 *   onChange={setSelectedFile}
 *   existingReceipt={expense.receiptUrl}
 *   onUpload={handleUpload}
 *   onDelete={handleDelete}
 * />
 */

const ReceiptUpload = forwardRef(({
  // File state
  value,              // Currently selected file (File object)
  onChange,           // Handler for file selection
  existingReceipt,    // URL of existing uploaded receipt
  existingReceiptKey, // S3 key of existing receipt

  // Upload handlers
  onUpload,           // Function to call when uploading (returns Promise)
  onDelete,           // Function to call when deleting (returns Promise)
  onView,             // Function to call when viewing receipt

  // States
  isUploading = false,
  uploadProgress = 0,
  error,

  // Options
  label,
  required = false,
  disabled = false,
  showPreview = true,
  allowReplace = true,
  canDelete = false,  // Admin-only delete capability
  className = '',

  ...props
}, ref) => {
  const { t, isRTL } = useLocalization()
  const [internalError, setInternalError] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [isDeletingReceipt, setIsDeletingReceipt] = useState(false)

  // Create preview URL for selected file
  useEffect(() => {
    if (value && storageService.isImage(value)) {
      const url = storageService.createPreviewUrl(value)
      setPreviewUrl(url)
      return () => storageService.revokePreviewUrl(url)
    } else {
      setPreviewUrl(null)
    }
  }, [value])

  // File drop handler
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setInternalError(null)

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      const errors = rejection.errors.map(e => {
        if (e.code === 'file-too-large') return t('fileTooLarge')
        if (e.code === 'file-invalid-type') return t('invalidFileType')
        return e.message
      })
      setInternalError(errors.join(', '))
      return
    }

    // Take first file only
    const file = acceptedFiles[0]
    if (file && onChange) {
      // Validate file
      const validation = storageService.validateReceipt(file)
      if (!validation.valid) {
        setInternalError(validation.error)
        return
      }

      onChange(file)

      // Auto-upload if handler provided
      if (onUpload) {
        onUpload(file)
      }
    }
  }, [onChange, onUpload, t])

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf']
    },
    maxSize: storageService.MAX_RECEIPT_SIZE,
    multiple: false,
    disabled: disabled || isUploading
  })

  // Handle file removal (local only, doesn't delete from S3)
  const handleRemoveFile = () => {
    if (onChange) {
      onChange(null)
    }
    setInternalError(null)
  }

  // Handle receipt deletion from S3
  const handleDeleteReceipt = async () => {
    if (!onDelete) return

    setIsDeletingReceipt(true)
    try {
      await onDelete()
    } finally {
      setIsDeletingReceipt(false)
    }
  }

  // Handle view receipt
  const handleViewReceipt = () => {
    if (onView) {
      onView()
    } else if (existingReceipt) {
      window.open(existingReceipt, '_blank')
    }
  }

  const hasError = error || internalError
  const hasExistingReceipt = existingReceipt || existingReceiptKey
  const hasSelectedFile = !!value

  // Determine what to show
  const showDropzone = !hasExistingReceipt || (allowReplace && !hasSelectedFile)
  const showExistingReceipt = hasExistingReceipt && !hasSelectedFile
  const showSelectedFile = hasSelectedFile

  return (
    <div
      ref={ref}
      className={`receipt-upload ${className} ${isRTL ? 'rtl' : ''}`}
      {...props}
    >
      {/* Label */}
      {label && (
        <label className="receipt-upload-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      {/* Existing Receipt Display */}
      <AnimatePresence mode="wait">
        {showExistingReceipt && (
          <motion.div
            className="existing-receipt"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            key="existing"
          >
            <div className="receipt-preview-icon">
              <Check size={24} className="check-icon" />
              <FileText size={32} />
            </div>

            <div className="receipt-info">
              <span className="receipt-status">{t('receiptUploaded')}</span>
              <span className="receipt-hint">{allowReplace ? t('replaceReceipt') : t('viewReceiptFile')}</span>
            </div>

            <div className="receipt-actions">
              <button
                type="button"
                className="receipt-action-btn view"
                onClick={handleViewReceipt}
                title={t('viewReceiptFile')}
              >
                <Eye size={18} />
              </button>

              {allowReplace && !disabled && (
                <label className="receipt-action-btn replace" title={t('replaceReceipt')}>
                  <RefreshCw size={18} />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => e.target.files?.[0] && onDrop([e.target.files[0]], [])}
                    style={{ display: 'none' }}
                  />
                </label>
              )}

              {canDelete && !disabled && (
                <button
                  type="button"
                  className="receipt-action-btn delete"
                  onClick={handleDeleteReceipt}
                  disabled={isDeletingReceipt}
                  title={t('removeReceipt')}
                >
                  {isDeletingReceipt ? <Loader size={18} className="spinner" /> : <Trash2 size={18} />}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Selected File Preview */}
        {showSelectedFile && (
          <motion.div
            className="selected-file"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            key="selected"
          >
            {/* Preview */}
            <div className="file-preview">
              {previewUrl ? (
                <img src={previewUrl} alt={value.name} className="preview-image" />
              ) : (
                <div className="preview-icon">
                  {storageService.isPDF(value) ? <FileText size={28} /> : <ImageIcon size={28} />}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="file-info">
              <span className="file-name">{value.name}</span>
              <span className="file-size">{storageService.formatFileSize(value.size)}</span>
            </div>

            {/* Progress or Actions */}
            {isUploading ? (
              <div className="upload-progress">
                <Loader size={20} className="spinner" />
                <span>{uploadProgress}%</span>
              </div>
            ) : (
              <button
                type="button"
                className="remove-file-btn"
                onClick={handleRemoveFile}
                disabled={disabled}
                title={t('removeReceipt')}
              >
                <X size={20} />
              </button>
            )}
          </motion.div>
        )}

        {/* Dropzone */}
        {showDropzone && !showSelectedFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            key="dropzone"
          >
            <div
              {...getRootProps()}
              className={`
                receipt-dropzone
                ${isDragActive ? 'drag-active' : ''}
                ${isDragAccept ? 'drag-accept' : ''}
                ${isDragReject ? 'drag-reject' : ''}
                ${hasError ? 'has-error' : ''}
                ${disabled ? 'disabled' : ''}
              `}
            >
              <input {...getInputProps()} />

              <motion.div
                className="dropzone-icon"
                animate={{ y: isDragActive ? -5 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Upload size={36} />
              </motion.div>

              <p className="dropzone-text">
                {isDragActive ? t('dragDropReceipt').split(',')[0] : t('dragDropReceipt')}
              </p>

              <p className="dropzone-formats">{t('supportedFormats')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            className="receipt-upload-error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <AlertCircle size={16} />
            <span>{error || internalError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

ReceiptUpload.displayName = 'ReceiptUpload'

export default ReceiptUpload
