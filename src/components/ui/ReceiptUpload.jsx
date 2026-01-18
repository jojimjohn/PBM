import React, { useState, useCallback, forwardRef, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Upload, X, FileText, Image as ImageIcon, Loader,
  AlertCircle, Check, Eye, Download, RefreshCw, Trash2
} from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
import storageService from '../../services/storageService'
// CSS moved to global index.css Tailwind

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

  // Dropzone styling based on state (matching FileUpload pattern)
  const getDropzoneClasses = () => {
    let base = 'relative flex flex-col items-center justify-center p-6 border-2 border-dashed transition-all cursor-pointer'

    if (disabled) {
      return `${base} border-slate-200 bg-slate-50 cursor-not-allowed opacity-60`
    }
    if (isDragReject || hasError) {
      return `${base} border-red-400 bg-red-50`
    }
    if (isDragAccept) {
      return `${base} border-emerald-400 bg-emerald-50`
    }
    if (isDragActive) {
      return `${base} border-blue-400 bg-blue-50`
    }
    return `${base} border-slate-300 bg-slate-50 hover:border-blue-400 hover:bg-blue-50/50`
  }

  return (
    <div
      ref={ref}
      className={`space-y-3 ${className} ${isRTL ? 'rtl' : ''}`}
      {...props}
    >
      {/* Label */}
      {label && (
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Existing Receipt Display */}
      <AnimatePresence mode="wait">
        {showExistingReceipt && (
          <motion.div
            className="flex items-center gap-3 p-3 bg-emerald-50 border border-emerald-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            key="existing"
          >
            <div className="w-10 h-10 flex items-center justify-center bg-emerald-100 text-emerald-600 relative">
              <FileText size={24} />
              <Check size={14} className="absolute -bottom-1 -right-1 text-emerald-500" />
            </div>

            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-emerald-700">{t('receiptUploaded')}</span>
              <span className="block text-xs text-emerald-600">{allowReplace ? t('replaceReceipt') : t('viewReceiptFile')}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={handleViewReceipt}
                title={t('viewReceiptFile')}
              >
                <Eye size={14} />
              </button>

              {allowReplace && !disabled && (
                <label className="btn btn-outline btn-sm cursor-pointer" title={t('replaceReceipt')}>
                  <RefreshCw size={14} />
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={(e) => e.target.files?.[0] && onDrop([e.target.files[0]], [])}
                    className="hidden"
                  />
                </label>
              )}

              {canDelete && !disabled && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleDeleteReceipt}
                  disabled={isDeletingReceipt}
                  title={t('removeReceipt')}
                >
                  {isDeletingReceipt ? <Loader size={14} className="animate-spin" /> : <Trash2 size={14} />}
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* Selected File Preview */}
        {showSelectedFile && (
          <motion.div
            className="flex items-center gap-3 p-3 bg-white border border-slate-200"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            key="selected"
          >
            {/* Preview */}
            <div className="w-10 h-10 flex items-center justify-center bg-slate-100 shrink-0 overflow-hidden">
              {previewUrl ? (
                <img src={previewUrl} alt={value.name} className="w-full h-full object-cover" />
              ) : (
                <div className={storageService.isPDF(value) ? 'text-red-500' : 'text-blue-500'}>
                  {storageService.isPDF(value) ? <FileText size={22} /> : <ImageIcon size={22} />}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-medium text-slate-700 truncate">{value.name}</span>
              <span className="block text-xs text-slate-400">{storageService.formatFileSize(value.size)}</span>
            </div>

            {/* Progress or Actions */}
            {isUploading ? (
              <div className="flex items-center gap-2 text-blue-600">
                <Loader size={18} className="animate-spin" />
                <span className="text-xs font-medium">{uploadProgress}%</span>
              </div>
            ) : (
              <button
                type="button"
                className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                onClick={handleRemoveFile}
                disabled={disabled}
                title={t('removeReceipt')}
              >
                <X size={18} />
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
            <div {...getRootProps()} className={getDropzoneClasses()}>
              <input {...getInputProps()} />

              <motion.div
                className={`w-12 h-12 flex items-center justify-center mb-3 ${isDragActive ? 'text-blue-500' : 'text-slate-400'}`}
                animate={{ y: isDragActive ? -3 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <Upload size={32} />
              </motion.div>

              <p className="text-sm font-medium text-slate-700 mb-1">
                {isDragActive ? t('dragDropReceipt').split(',')[0] : t('dragDropReceipt')}
              </p>

              <p className="text-xs text-slate-400">{t('supportedFormats')}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Message */}
      <AnimatePresence>
        {hasError && (
          <motion.div
            className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            <AlertCircle size={14} className="mt-0.5 shrink-0" />
            <span>{error || internalError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

ReceiptUpload.displayName = 'ReceiptUpload'

export default ReceiptUpload
