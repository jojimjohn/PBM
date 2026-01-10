import React, { useState, useCallback, forwardRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, Image as ImageIcon, Loader, AlertCircle, Check, File } from 'lucide-react'
import { API_BASE_URL } from '../../config/api.js'
import './FileUpload.css'

/**
 * FileUpload Component (Modernized)
 *
 * Drag & drop file uploader with preview, progress, and form integration
 *
 * Modern Usage (Form Integration):
 * <FileUpload
 *   label="Documents"
 *   value={files}
 *   onChange={setFiles}
 *   multiple
 *   accept=".pdf,.jpg,.png"
 * />
 *
 * Legacy Usage (Backward Compatible):
 * <FileUpload
 *   onUpload={handleUpload}
 *   onDelete={handleDelete}
 *   existingFiles={files}
 * />
 */
const FileUpload = forwardRef(({
  // Modern API
  label,
  value,
  onChange,
  error,
  helperText,
  required = false,
  showPreview = true,
  uploadText,
  className = '',

  // Legacy/Shared API
  mode = 'multiple',
  multiple, // Alternative to mode - if true, mode='multiple'
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 10 * 1024 * 1024, // 10MB
  maxFiles = 10,
  disabled = false,

  // Callback APIs
  onUpload,
  onDelete,
  onProgress, // Callback for upload progress: (fileId, progress) => {}
  onError, // Callback for errors: (error, file) => {}
  existingFiles = [],

  ...props
}, ref) => {
  const [uploadProgress, setUploadProgress] = useState({})
  const [uploadErrors, setUploadErrors] = useState({})
  const [internalError, setInternalError] = useState(null)

  // Determine which API pattern is being used
  const isModernAPI = onChange !== undefined
  const files = isModernAPI ? (Array.isArray(value) ? value : []) : existingFiles
  const hasError = !!error || !!internalError

  // Support both 'mode' and 'multiple' props
  const effectiveMode = multiple !== undefined ? (multiple ? 'multiple' : 'single') : mode

  // Helper to handle errors (calls external callback if provided)
  const handleError = (errorMessage, file = null) => {
    setInternalError(errorMessage)
    if (onError) {
      onError(errorMessage, file)
    }
  }

  // File drop handler
  const onDrop = useCallback(async (acceptedFiles, rejectedFiles) => {
    setInternalError(null)

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors: fileErrors }) => {
        const errorMessages = fileErrors.map(e => {
          if (e.code === 'file-too-large') return `${file.name}: File too large (max ${formatFileSize(maxSize)})`
          if (e.code === 'file-invalid-type') return `${file.name}: Invalid file type`
          return `${file.name}: ${e.message}`
        })
        return errorMessages.join(', ')
      })
      const errorMessage = errors.join('\n')
      handleError(errorMessage, rejectedFiles[0]?.file)
      return
    }

    // Check max files limit
    const totalFiles = files.length + acceptedFiles.length
    if (effectiveMode === 'multiple' && totalFiles > maxFiles) {
      handleError(`Maximum ${maxFiles} files allowed`)
      return
    }

    // Modern API: Add files to value
    if (isModernAPI) {
      const newFiles = acceptedFiles.map(file => ({
        file,
        id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: file.name,
        size: file.size,
        type: file.type,
        preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null,
        uploaded: false,
        progress: 0
      }))

      onChange(effectiveMode === 'single' ? newFiles.slice(0, 1) : [...files, ...newFiles])
    }
    // Legacy API: Call onUpload callback
    else if (onUpload) {
      try {
        await onUpload(effectiveMode === 'single' ? acceptedFiles[0] : acceptedFiles)
      } catch (err) {
        handleError(err.message || 'Upload failed', acceptedFiles[0])
      }
    }
  }, [effectiveMode, maxSize, maxFiles, files, onChange, onUpload, isModernAPI, handleError])

  // Dropzone config
  const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize,
    multiple: effectiveMode === 'multiple',
    disabled
  })

  // Update progress for a specific file (can be called by parent via ref or directly)
  const updateFileProgress = useCallback((fileId, progress) => {
    setUploadProgress(prev => ({ ...prev, [fileId]: progress }))
    if (onProgress) {
      onProgress(fileId, progress)
    }
  }, [onProgress])

  // Mark file as uploaded
  const markFileUploaded = useCallback((fileId) => {
    if (isModernAPI && onChange) {
      const updatedFiles = files.map(f =>
        f.id === fileId ? { ...f, uploaded: true, progress: 100 } : f
      )
      onChange(updatedFiles)
    }
    setUploadProgress(prev => ({ ...prev, [fileId]: 100 }))
  }, [isModernAPI, onChange, files])

  // Remove file
  const handleRemoveFile = (index) => {
    const fileToRemove = files[index]

    // Revoke object URL
    if (fileToRemove?.preview) {
      URL.revokeObjectURL(fileToRemove.preview)
    }

    if (isModernAPI) {
      const newFiles = files.filter((_, i) => i !== index)
      onChange(newFiles)
    } else if (onDelete && fileToRemove?.filename) {
      onDelete(fileToRemove.filename)
    }
  }

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Get file icon
  const getFileIcon = (fileType) => {
    if (fileType?.startsWith('image/')) return <ImageIcon size={20} />
    if (fileType?.includes('pdf')) return <FileText size={20} />
    return <File size={20} />
  }

  return (
    <div ref={ref} className={`file-upload-wrapper ${className}`} {...props}>
      {label && (
        <label className="file-upload-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      {/* Drop Zone */}
      {!disabled && (
        <div
          {...getRootProps()}
          className={`
            file-upload-dropzone
            ${isDragActive ? 'dropzone-active' : ''}
            ${isDragAccept ? 'dropzone-accept' : ''}
            ${isDragReject ? 'dropzone-reject' : ''}
            ${hasError ? 'dropzone-error' : ''}
          `}
        >
          <input {...getInputProps()} />

          <div className="dropzone-content">
            <motion.div
              className="dropzone-icon"
              animate={{ y: isDragActive ? -5 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <Upload size={48} />
            </motion.div>

            <p className="dropzone-text">
              {uploadText || (isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse')}
            </p>

            <p className="dropzone-hint">
              Accepted: {accept} • Max size: {formatFileSize(maxSize)}
              {effectiveMode === 'multiple' && ` • Max files: ${maxFiles}`}
            </p>
          </div>
        </div>
      )}

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="file-upload-list"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            {files.map((fileData, index) => {
              const isLegacyFile = fileData.filename !== undefined
              const fileName = isLegacyFile ? (fileData.originalName || fileData.filename) : fileData.name
              const fileSize = fileData.size
              const fileType = isLegacyFile ? '' : fileData.type
              const preview = fileData.preview
              const fileId = fileData.id || `file-${index}`
              const progress = uploadProgress[fileId] ?? fileData.progress ?? 0
              const isUploading = progress > 0 && progress < 100 && !fileData.uploaded

              return (
                <motion.div
                  key={fileId}
                  className={`file-item ${isUploading ? 'file-item-uploading' : ''}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {/* File Preview/Icon */}
                  <div className="file-preview">
                    {showPreview && preview ? (
                      <img src={preview} alt={fileName} className="file-preview-image" />
                    ) : isUploading ? (
                      <div className="file-icon file-icon-uploading">
                        <Loader size={20} className="spin" />
                      </div>
                    ) : (
                      <div className="file-icon">{getFileIcon(fileType)}</div>
                    )}
                  </div>

                  {/* File Info */}
                  <div className="file-info">
                    <p className="file-name">{fileName}</p>
                    <p className="file-size">
                      {formatFileSize(fileSize)}
                      {isUploading && ` • ${progress}%`}
                    </p>
                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="file-progress-bar">
                        <div
                          className="file-progress-fill"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="file-actions">
                    {isLegacyFile && (
                      <a
                        href={`${API_BASE_URL}/uploads/${fileData.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="file-view-btn"
                        title="View file"
                      >
                        View
                      </a>
                    )}

                    {fileData.uploaded && (
                      <div className="file-status-success">
                        <Check size={18} />
                      </div>
                    )}

                    {!disabled && !isUploading && (
                      <button
                        type="button"
                        className="file-remove-btn"
                        onClick={() => handleRemoveFile(index)}
                        title="Remove file"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error & Helper Text */}
      <AnimatePresence>
        {(error || internalError) && (
          <motion.div
            className="file-upload-error"
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

      {helperText && !error && !internalError && (
        <p className="file-upload-helper-text">{helperText}</p>
      )}

      {/* Empty State */}
      {files.length === 0 && !hasError && (
        <p className="file-upload-empty-state">No files attached</p>
      )}
    </div>
  )
})

FileUpload.displayName = 'FileUpload'

export default FileUpload
