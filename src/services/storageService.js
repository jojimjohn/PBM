/**
 * Storage Service
 *
 * Frontend utilities for file uploads and S3 storage integration.
 * Provides file validation, type checking, and reusable upload helpers.
 */

// Allowed MIME types for receipts and documents
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png'];
export const ALLOWED_DOCUMENT_TYPES = ['application/pdf'];
export const ALLOWED_RECEIPT_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_DOCUMENT_TYPES];

// File size limits (in bytes)
export const MAX_RECEIPT_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;    // 5MB
export const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024; // 20MB

/**
 * Validate a file for upload
 * @param {File} file - The file to validate
 * @param {Object} options - Validation options
 * @param {string[]} options.allowedTypes - Array of allowed MIME types
 * @param {number} options.maxSize - Maximum file size in bytes
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export function validateFile(file, options = {}) {
  const {
    allowedTypes = ALLOWED_RECEIPT_TYPES,
    maxSize = MAX_RECEIPT_SIZE
  } = options;

  if (!file) {
    return { valid: false, error: 'No file selected' };
  }

  // Check file type
  if (!allowedTypes.includes(file.type)) {
    const typeNames = allowedTypes.map(t => {
      if (t === 'image/jpeg' || t === 'image/jpg') return 'JPEG';
      if (t === 'image/png') return 'PNG';
      if (t === 'application/pdf') return 'PDF';
      return t.split('/')[1]?.toUpperCase() || t;
    });
    const uniqueTypes = [...new Set(typeNames)];
    return {
      valid: false,
      error: `Invalid file type. Allowed: ${uniqueTypes.join(', ')}`
    };
  }

  // Check file size
  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size is ${maxMB}MB`
    };
  }

  return { valid: true };
}

/**
 * Validate a receipt file specifically
 * @param {File} file - The receipt file to validate
 * @returns {Object} Validation result { valid: boolean, error?: string }
 */
export function validateReceipt(file) {
  return validateFile(file, {
    allowedTypes: ALLOWED_RECEIPT_TYPES,
    maxSize: MAX_RECEIPT_SIZE
  });
}

/**
 * Get file extension from filename or MIME type
 * @param {File|string} fileOrName - File object or filename
 * @returns {string} File extension (lowercase, without dot)
 */
export function getFileExtension(fileOrName) {
  const name = typeof fileOrName === 'string' ? fileOrName : fileOrName?.name || '';
  const parts = name.split('.');
  return parts.length > 1 ? parts.pop().toLowerCase() : '';
}

/**
 * Check if file is an image
 * @param {File} file - The file to check
 * @returns {boolean} True if file is an image
 */
export function isImage(file) {
  return ALLOWED_IMAGE_TYPES.includes(file?.type);
}

/**
 * Check if file is a PDF
 * @param {File} file - The file to check
 * @returns {boolean} True if file is a PDF
 */
export function isPDF(file) {
  return file?.type === 'application/pdf';
}

/**
 * Format file size for display
 * @param {number} bytes - File size in bytes
 * @returns {string} Human-readable file size
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 B';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = bytes;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
}

/**
 * Create object URL for file preview
 * @param {File} file - The file to preview
 * @returns {string|null} Object URL or null if not previewable
 */
export function createPreviewUrl(file) {
  if (!file) return null;
  if (isImage(file)) {
    return URL.createObjectURL(file);
  }
  return null;
}

/**
 * Revoke object URL to free memory
 * @param {string} url - The object URL to revoke
 */
export function revokePreviewUrl(url) {
  if (url && url.startsWith('blob:')) {
    URL.revokeObjectURL(url);
  }
}

/**
 * Get appropriate icon name for file type
 * @param {File|string} fileOrType - File object or MIME type
 * @returns {string} Icon name (for use with lucide-react)
 */
export function getFileIcon(fileOrType) {
  const type = typeof fileOrType === 'string' ? fileOrType : fileOrType?.type;

  if (type?.startsWith('image/')) return 'Image';
  if (type === 'application/pdf') return 'FileText';
  return 'File';
}

/**
 * Generate a unique client-side ID for file tracking
 * @returns {string} Unique ID
 */
export function generateFileId() {
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default export as an object for compatibility
const storageService = {
  // Constants
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
  ALLOWED_RECEIPT_TYPES,
  MAX_RECEIPT_SIZE,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,

  // Validation
  validateFile,
  validateReceipt,

  // File utilities
  getFileExtension,
  isImage,
  isPDF,
  formatFileSize,
  getFileIcon,
  generateFileId,

  // Preview utilities
  createPreviewUrl,
  revokePreviewUrl,
};

export default storageService;
