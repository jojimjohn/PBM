/**
 * WastageFileUpload Component
 *
 * File upload component for wastage evidence/attachments.
 * Uses react-dropzone for drag-and-drop support.
 */

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File, Image } from 'lucide-react';
import { useLocalization } from '../../../../context/LocalizationContext';

const ACCEPTED_TYPES = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
};

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 5;

/**
 * Format file size to human readable string
 */
const formatFileSize = (bytes) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * @param {Object} props
 * @param {File[]} props.files - Currently selected files
 * @param {Function} props.onChange - Handler for file changes
 * @param {string[]} props.existingUrls - URLs of existing attachments (for edit mode)
 * @param {Function} props.onRemoveExisting - Handler for removing existing attachments
 * @param {boolean} props.disabled - Disable upload
 * @param {string} props.error - Error message
 */
export function WastageFileUpload({
  files = [],
  onChange,
  existingUrls = [],
  onRemoveExisting,
  disabled = false,
  error
}) {
  const { t } = useLocalization();

  const onDrop = useCallback((acceptedFiles) => {
    // Check total file count
    const totalFiles = files.length + existingUrls.length + acceptedFiles.length;
    if (totalFiles > MAX_FILES) {
      return; // Could show error toast here
    }

    onChange([...files, ...acceptedFiles]);
  }, [files, existingUrls, onChange]);

  const removeFile = useCallback((index) => {
    onChange(files.filter((_, i) => i !== index));
  }, [files, onChange]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: ACCEPTED_TYPES,
    maxSize: MAX_FILE_SIZE,
    maxFiles: MAX_FILES - files.length - existingUrls.length,
    disabled
  });

  const getFileIcon = (file) => {
    if (file.type?.startsWith('image/')) {
      return <Image className="w-5 h-5 text-blue-500" />;
    }
    return <File className="w-5 h-5 text-gray-500" />;
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {t('attachments') || 'Attachments'}
      </label>

      {/* Dropzone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive && !isDragReject ? 'border-blue-400 bg-blue-50' : ''}
          ${isDragReject ? 'border-red-400 bg-red-50' : ''}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-blue-400 hover:bg-blue-50'}
          ${error ? 'border-red-300' : 'border-gray-300'}
        `}
      >
        <input {...getInputProps()} />
        <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">
          {isDragActive
            ? (t('dropFilesHere') || 'Drop files here...')
            : (t('dragDropFiles') || 'Drag & drop files here, or click to select')
          }
        </p>
        <p className="text-xs text-gray-500 mt-1">
          {t('maxFileSize') || 'Max 10MB per file'} • {t('maxFiles') || 'Up to 5 files'}
        </p>
      </div>

      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}

      {/* Existing Files (Edit Mode) */}
      {existingUrls.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {t('existingAttachments') || 'Existing Attachments'}
          </p>
          {existingUrls.map((url, index) => (
            <div
              key={url}
              className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg"
            >
              <File className="w-5 h-5 text-gray-500" />
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 text-sm text-blue-600 hover:underline truncate"
              >
                {url.split('/').pop()}
              </a>
              {onRemoveExisting && !disabled && (
                <button
                  type="button"
                  onClick={() => onRemoveExisting(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* New Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            {t('newAttachments') || 'New Attachments'}
          </p>
          {files.map((file, index) => (
            <div
              key={`${file.name}-${index}`}
              className="flex items-center gap-3 p-2 bg-blue-50 rounded-lg"
            >
              {getFileIcon(file)}
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 truncate">{file.name}</p>
                <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="p-1 text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default WastageFileUpload;
