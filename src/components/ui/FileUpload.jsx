import React, { useState, useCallback, forwardRef } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, X, FileText, Image as ImageIcon, Loader, AlertCircle, Check, File } from 'lucide-react'
import { API_BASE_URL } from '../../config/api.js'

/**
 * FileUpload Component (Modernized with Tailwind CSS)
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
    if (fileType?.startsWith('image/')) return <ImageIcon size={18} className="text-blue-500" />
    if (fileType?.includes('pdf')) return <FileText size={18} className="text-red-500" />
    return <File size={18} className="text-slate-500" />
  }

  // Dropzone styling based on state
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
    <div ref={ref} className={`space-y-3 ${className}`} {...props}>
      {label && (
        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* Drop Zone */}
      {!disabled && (
        <div {...getRootProps()} className={getDropzoneClasses()}>
          <input {...getInputProps()} />

          <motion.div
            animate={{ y: isDragActive ? -3 : 0 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col items-center"
          >
            <div className={`w-12 h-12 flex items-center justify-center mb-3 ${
              isDragActive ? 'text-blue-500' : 'text-slate-400'
            }`}>
              <Upload size={32} />
            </div>

            <p className="text-sm font-medium text-slate-700 mb-1">
              {uploadText || (isDragActive ? 'Drop files here...' : 'Drag & drop files here, or click to browse')}
            </p>

            <p className="text-xs text-slate-400">
              {accept} • Max: {formatFileSize(maxSize)}
              {effectiveMode === 'multiple' && ` • Up to ${maxFiles} files`}
            </p>
          </motion.div>
        </div>
      )}

      {/* File List */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div
            className="space-y-2"
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
                  className={`flex items-center gap-3 p-3 bg-white border transition-all ${
                    isUploading ? 'border-blue-300 bg-blue-50/50' : 'border-slate-200'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  {/* File Preview/Icon */}
                  <div className="w-10 h-10 flex items-center justify-center bg-slate-100 shrink-0">
                    {showPreview && preview ? (
                      <img src={preview} alt={fileName} className="w-full h-full object-cover" />
                    ) : isUploading ? (
                      <Loader size={18} className="text-blue-500 animate-spin" />
                    ) : (
                      getFileIcon(fileType)
                    )}
                  </div>

                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{fileName}</p>
                    <p className="text-xs text-slate-400">
                      {formatFileSize(fileSize)}
                      {isUploading && ` • ${progress}%`}
                    </p>
                    {/* Progress Bar */}
                    {isUploading && (
                      <div className="h-1 w-full bg-slate-200 mt-1.5">
                        <div
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    {isLegacyFile && (
                      <a
                        href={`${API_BASE_URL}/uploads/${fileData.path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                      >
                        View
                      </a>
                    )}

                    {fileData.uploaded && (
                      <div className="w-6 h-6 flex items-center justify-center text-emerald-500">
                        <Check size={16} />
                      </div>
                    )}

                    {!disabled && !isUploading && (
                      <button
                        type="button"
                        className="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        onClick={() => handleRemoveFile(index)}
                        title="Remove file"
                      >
                        <X size={16} />
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

      {helperText && !error && !internalError && (
        <p className="text-xs text-slate-400">{helperText}</p>
      )}

      {/* Empty State */}
      {files.length === 0 && !hasError && (
        <p className="text-xs text-slate-400 text-center py-2">No files attached</p>
      )}
    </div>
  )
})

FileUpload.displayName = 'FileUpload'

export default FileUpload
