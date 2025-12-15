import React, { useState, useRef } from 'react';
import { Upload, X, FileText, Image, AlertCircle, Download, Eye } from 'lucide-react';
import { useSystemSettings } from '../context/SystemSettingsContext';
import './DocumentUpload.css';

const DocumentUpload = ({
  attachments = [],
  onUpload,
  onDelete,
  onPreview,
  maxFiles = 5,
  maxSizeMB = 5,
  disabled = false,
  label = 'Attachments'
}) => {
  const { formatDate } = useSystemSettings();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  // Handle drag events
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  // Handle drop
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Handle file selection
  const handleFileSelect = (e) => {
    if (disabled) return;

    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
  };

  // Validate and process files
  const handleFiles = async (files) => {
    setError('');

    // Check number of files
    if (attachments.length + files.length > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Validate each file
    const validFiles = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // Check file type
      if (!allowedTypes.includes(file.type)) {
        setError(`Invalid file type: ${file.name}. Only PDF, JPG, and PNG files are allowed.`);
        continue;
      }

      // Check file size
      if (file.size > maxSizeBytes) {
        setError(`File ${file.name} exceeds ${maxSizeMB}MB limit`);
        continue;
      }

      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Upload files
    setUploading(true);
    try {
      await onUpload(validFiles);
    } catch (err) {
      setError(err.message || 'Upload failed');
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Get file icon based on MIME type
  const getFileIcon = (mimetype) => {
    if (mimetype === 'application/pdf') {
      return <FileText size={24} />;
    } else if (mimetype?.startsWith('image/')) {
      return <Image size={24} />;
    }
    return <FileText size={24} />;
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <div className="document-upload-container">
      <label className="document-upload-label">{label}</label>

      {/* Upload Area */}
      <div
        className={`document-upload-dropzone ${dragActive ? 'active' : ''} ${disabled ? 'disabled' : ''}`}
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <Upload size={32} className="document-upload-icon" />
        <p className="document-upload-text">
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p className="document-upload-hint">
          PDF, JPG, PNG (max {maxSizeMB}MB per file, max {maxFiles} files)
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.jpg,.jpeg,.png"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="document-upload-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Uploading State */}
      {uploading && (
        <div className="document-upload-loading">
          <div className="document-upload-spinner"></div>
          <span>Uploading...</span>
        </div>
      )}

      {/* Attachments List */}
      {attachments.length > 0 && (
        <div className="document-upload-list">
          <h4 className="document-upload-list-title">
            Attached Files ({attachments.length}/{maxFiles})
          </h4>
          {attachments.map((attachment, index) => (
            <div key={index} className="document-upload-item">
              <div className="document-upload-item-info">
                <div className="document-upload-item-icon">
                  {getFileIcon(attachment.mimetype)}
                </div>
                <div className="document-upload-item-details">
                  <p className="document-upload-item-name">
                    {attachment.originalName || attachment.filename}
                  </p>
                  <p className="document-upload-item-meta">
                    {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
                    {attachment.uploadedAt && (
                      <span> • {formatDate(attachment.uploadedAt)}</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="document-upload-item-actions">
                {onPreview && (
                  <button
                    type="button"
                    className="document-upload-item-button document-upload-item-button-preview"
                    onClick={() => onPreview(attachment)}
                    title="Preview"
                  >
                    <Eye size={16} />
                  </button>
                )}
                <button
                  type="button"
                  className="document-upload-item-button document-upload-item-button-download"
                  onClick={() => window.open(`${import.meta.env.VITE_API_URL}/../uploads/${attachment.path}`, '_blank')}
                  title="Download"
                >
                  <Download size={16} />
                </button>
                {!disabled && onDelete && (
                  <button
                    type="button"
                    className="document-upload-item-button document-upload-item-button-delete"
                    onClick={() => onDelete(attachment.filename)}
                    title="Delete"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
