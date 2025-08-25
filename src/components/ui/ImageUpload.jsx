import React, { useCallback, useState } from 'react'
import { useDropzone } from 'react-dropzone'
import { Upload, X, Image, AlertCircle } from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
import './ImageUpload.css'

const ImageUpload = ({ 
  images = [], 
  onChange, 
  maxFiles = 5, 
  maxSizeBytes = 5 * 1024 * 1024, // 5MB default
  accept = {
    'image/jpeg': ['.jpeg', '.jpg'],
    'image/png': ['.png'],
    'image/webp': ['.webp']
  },
  required = false,
  label = null
}) => {
  const { t } = useLocalization()
  const [error, setError] = useState('')

  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError('')

    if (rejectedFiles.length > 0) {
      const errorMessages = rejectedFiles.map(file => {
        const errors = file.errors.map(err => {
          switch (err.code) {
            case 'file-too-large':
              return t('fileTooLarge', 'File is too large')
            case 'file-invalid-type':
              return t('invalidFileType', 'Invalid file type')
            default:
              return err.message
          }
        })
        return `${file.file.name}: ${errors.join(', ')}`
      })
      setError(errorMessages.join('\n'))
      return
    }

    if (images.length + acceptedFiles.length > maxFiles) {
      setError(t('tooManyFiles', `Maximum ${maxFiles} files allowed`))
      return
    }

    // Convert files to base64 strings
    const filePromises = acceptedFiles.map(file => {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            dataUrl: e.target.result,
            uploadDate: new Date().toISOString()
          })
        }
        reader.readAsDataURL(file)
      })
    })

    Promise.all(filePromises).then(newImages => {
      const updatedImages = [...images, ...newImages]
      onChange(updatedImages)
    })
  }, [images, maxFiles, onChange, t])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept,
    maxSize: maxSizeBytes,
    disabled: images.length >= maxFiles
  })

  const removeImage = (imageId) => {
    const updatedImages = images.filter(img => img.id !== imageId)
    onChange(updatedImages)
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="image-upload-container">
      {label && (
        <label className="image-upload-label">
          {label}
          {required && <span className="required-asterisk">*</span>}
        </label>
      )}

      {/* Upload Area */}
      {images.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${error ? 'error' : ''}`}
        >
          <input {...getInputProps()} />
          <div className="dropzone-content">
            <Upload size={32} />
            <p className="dropzone-text">
              {isDragActive
                ? t('dropFilesHere', 'Drop files here...')
                : t('dragDropOrClick', 'Drag & drop images here, or click to select')
              }
            </p>
            <p className="dropzone-info">
              {t('maxFiles', `Max ${maxFiles} files`)} • {t('maxSize', `Max ${formatFileSize(maxSizeBytes)} each`)}
            </p>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="upload-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="image-preview-grid">
          {images.map((image) => (
            <div key={image.id} className="image-preview-item">
              <div className="image-preview">
                <img 
                  src={image.dataUrl || image.url} 
                  alt={image.name}
                  className="preview-image"
                />
                <button
                  type="button"
                  className="remove-image-btn"
                  onClick={() => removeImage(image.id)}
                  title={t('removeImage', 'Remove image')}
                >
                  <X size={16} />
                </button>
              </div>
              <div className="image-info">
                <p className="image-name" title={image.name}>{image.name}</p>
                <p className="image-size">{formatFileSize(image.size)}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {images.length === 0 && required && (
        <div className="empty-state">
          <Image size={24} />
          <p>{t('noImagesUploaded', 'No images uploaded')}</p>
        </div>
      )}
    </div>
  )
}

export default ImageUpload