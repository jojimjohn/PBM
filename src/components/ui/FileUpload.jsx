import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, FileText, Image as ImageIcon, Loader, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../../config/api.js';
import './FileUpload.css';

/**
 * FileUpload Component
 *
 * Reusable drag-and-drop file upload component with:
 * - Single or multiple file modes
 * - File type and size validation
 * - Upload progress tracking
 * - File preview and management
 * - Existing files display
 *
 * @param {Object} props
 * @param {'single'|'multiple'} props.mode - Single or multiple file upload
 * @param {string} props.accept - Accepted file types (e.g., '.pdf,.jpg,.jpeg,.png')
 * @param {number} props.maxSize - Maximum file size in bytes (default: 5MB)
 * @param {number} props.maxFiles - Maximum number of files (default: 10)
 * @param {Function} props.onUpload - Callback when files are ready to upload
 * @param {Function} props.onDelete - Callback when file is deleted
 * @param {Array} props.existingFiles - Array of existing file objects
 * @param {boolean} props.disabled - Disable upload functionality
 */
const FileUpload = ({
  mode = 'multiple',
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5242880, // 5MB
  maxFiles = 10,
  onUpload,
  onDelete,
  existingFiles = [],
  disabled = false
}) => {
  const [pendingFiles, setPendingFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);

  // Dropzone configuration
  const onDrop = useCallback((acceptedFiles, rejectedFiles) => {
    setError(null);

    // Handle rejected files
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => {
        const errorMessages = errors.map(e => {
          if (e.code === 'file-too-large') {
            return `${file.name}: File too large (max ${formatFileSize(maxSize)})`;
          }
          if (e.code === 'file-invalid-type') {
            return `${file.name}: Invalid file type`;
          }
          return `${file.name}: ${e.message}`;
        });
        return errorMessages.join(', ');
      });
      setError(errors.join('\n'));
      return;
    }

    // Check max files limit
    const totalFiles = existingFiles.length + pendingFiles.length + acceptedFiles.length;
    if (mode === 'multiple' && totalFiles > maxFiles) {
      setError(`Maximum ${maxFiles} files allowed`);
      return;
    }

    // Add files to pending list
    if (mode === 'single') {
      setPendingFiles([acceptedFiles[0]]);
    } else {
      setPendingFiles(prev => [...prev, ...acceptedFiles]);
    }
  }, [mode, maxSize, maxFiles, existingFiles.length, pendingFiles.length]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    maxSize,
    multiple: mode === 'multiple',
    disabled: disabled || uploading
  });

  // Remove pending file
  const removePendingFile = (index) => {
    setPendingFiles(prev => prev.filter((_, i) => i !== index));
    setError(null);
  };

  // Upload all pending files
  const handleUploadAll = async () => {
    if (pendingFiles.length === 0) return;

    setUploading(true);
    setError(null);

    try {
      await onUpload(mode === 'single' ? pendingFiles[0] : pendingFiles);
      setPendingFiles([]);
    } catch (err) {
      setError(err.message || 'Failed to upload files');
    } finally {
      setUploading(false);
    }
  };

  // Delete existing file
  const handleDeleteExisting = async (filename) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      try {
        await onDelete(filename);
      } catch (err) {
        setError(err.message || 'Failed to delete file');
      }
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Get file icon
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (ext === 'pdf') return <FileText size={20} className="file-icon-pdf" />;
    if (['jpg', 'jpeg', 'png'].includes(ext)) return <ImageIcon size={20} className="file-icon-image" />;
    return <FileText size={20} className="file-icon-default" />;
  };

  return (
    <div className="file-upload-container">
      {/* Dropzone */}
      {!disabled && (
        <div
          {...getRootProps()}
          className={`dropzone ${isDragActive ? 'active' : ''} ${uploading ? 'uploading' : ''} ${error ? 'error' : ''}`}
        >
          <input {...getInputProps()} />
          <Upload size={48} className="dropzone-icon" />
          <p className="dropzone-text">
            {isDragActive
              ? 'Drop files here...'
              : 'Drag & drop files here, or click to browse'
            }
          </p>
          <p className="dropzone-hint">
            Accepted: {accept} (Max {formatFileSize(maxSize)} per file)
          </p>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="file-upload-error">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* Pending Files */}
      {pendingFiles.length > 0 && (
        <div className="file-list">
          <h4 className="file-list-title">Files to Upload</h4>
          {pendingFiles.map((file, index) => (
            <div key={index} className="file-item pending">
              {getFileIcon(file.name)}
              <div className="file-info">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{formatFileSize(file.size)}</span>
              </div>
              {!uploading && (
                <button
                  className="file-delete-btn"
                  onClick={() => removePendingFile(index)}
                  title="Remove file"
                >
                  <X size={16} />
                </button>
              )}
            </div>
          ))}
          <button
            className="upload-btn"
            onClick={handleUploadAll}
            disabled={uploading}
          >
            {uploading ? (
              <>
                <Loader size={16} className="spinner" />
                Uploading...
              </>
            ) : (
              <>
                <Upload size={16} />
                Upload {pendingFiles.length} {pendingFiles.length === 1 ? 'File' : 'Files'}
              </>
            )}
          </button>
        </div>
      )}

      {/* Existing Files */}
      {existingFiles.length > 0 && (
        <div className="file-list">
          <h4 className="file-list-title">Attached Files</h4>
          {existingFiles.map((file, index) => (
            <div key={index} className="file-item existing">
              {getFileIcon(file.originalName || file.filename)}
              <div className="file-info">
                <span className="file-name">{file.originalName || file.filename}</span>
                <span className="file-size">
                  {file.size ? formatFileSize(file.size) : 'Unknown size'}
                </span>
              </div>
              <div className="file-actions">
                <a
                  href={`${API_BASE_URL}/uploads/${file.path}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="file-view-btn"
                  title="View file"
                >
                  View
                </a>
                {!disabled && onDelete && (
                  <button
                    className="file-delete-btn"
                    onClick={() => handleDeleteExisting(file.filename)}
                    title="Delete file"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {existingFiles.length === 0 && pendingFiles.length === 0 && !error && (
        <p className="empty-state">No files attached</p>
      )}
    </div>
  );
};

export default FileUpload;
