import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

/**
 * UploadService
 *
 * Handles file upload operations for documents and attachments.
 * Supports multiple entity types: purchase-orders, sales-orders, contracts, invoices, receipts
 */
class UploadService {
  /**
   * Upload files to an entity
   * @param {string} entityType - Entity type (e.g., 'purchase-orders', 'sales-orders')
   * @param {number} entityId - ID of the entity
   * @param {File|File[]} files - File or array of files to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadFiles(entityType, entityId, files) {
    try {
      const formData = new FormData();

      // Add files to FormData
      if (Array.isArray(files)) {
        files.forEach(file => {
          formData.append('attachments', file);
        });
      } else {
        formData.append('attachments', files);
      }

      // Get token for authentication
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Make fetch request directly (don't use authService to avoid JSON Content-Type)
      const response = await fetch(
        `${API_BASE_URL}/uploads/${entityType}/${entityId}/attachments`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - browser will set it with boundary
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload files');
      }

      return data;
    } catch (error) {
      console.error('Error uploading files:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload files'
      };
    }
  }

  /**
   * Upload single file (for invoices and receipts)
   * @param {string} entityType - Entity type (e.g., 'invoices', 'receipts')
   * @param {number} entityId - ID of the entity
   * @param {File} file - File to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadSingleFile(entityType, entityId, file) {
    try {
      const formData = new FormData();
      formData.append('attachment', file);

      // Get token for authentication
      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Make fetch request directly (don't use authService to avoid JSON Content-Type)
      const response = await fetch(
        `${API_BASE_URL}/uploads/${entityType}/${entityId}/attachment`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
            // Don't set Content-Type - browser will set it with boundary
          },
          body: formData
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload file');
      }

      return data;
    } catch (error) {
      console.error('Error uploading file:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file'
      };
    }
  }

  /**
   * Delete an attachment
   * @param {string} entityType - Entity type (e.g., 'purchase-orders', 'sales-orders')
   * @param {number} entityId - ID of the entity
   * @param {string} filename - Filename to delete
   * @returns {Promise<Object>} Delete result
   */
  async deleteFile(entityType, entityId, filename) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/uploads/${entityType}/${entityId}/attachments/${filename}`,
        {
          method: 'DELETE'
        }
      );

      return data;
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete file'
      };
    }
  }

  /**
   * Delete single file attachment (for invoices and receipts)
   * @param {string} entityType - Entity type (e.g., 'invoices', 'receipts')
   * @param {number} entityId - ID of the entity
   * @returns {Promise<Object>} Delete result
   */
  async deleteSingleFile(entityType, entityId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/uploads/${entityType}/${entityId}/attachment`,
        {
          method: 'DELETE'
        }
      );

      return data;
    } catch (error) {
      console.error('Error deleting file:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete file'
      };
    }
  }

  /**
   * Get file URL for viewing/downloading
   * @param {string} filePath - Relative file path (e.g., 'purchase-orders/file.pdf')
   * @returns {string} Full URL to the file
   */
  getFileUrl(filePath) {
    return `${API_BASE_URL}/uploads/${filePath}`;
  }

  /**
   * Format file size for display
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size (e.g., '1.5 MB')
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Get file icon emoji based on file type
   * @param {string} filename - File name
   * @returns {string} Icon emoji
   */
  getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const iconMap = {
      'pdf': '📄',
      'jpg': '🖼️',
      'jpeg': '🖼️',
      'png': '🖼️'
    };
    return iconMap[ext] || '📎';
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result { valid: boolean, error?: string }
   */
  validateFile(file, options = {}) {
    const {
      maxSize = 5242880, // 5MB default
      allowedTypes = ['.pdf', '.jpg', '.jpeg', '.png']
    } = options;

    // Check file size
    if (file.size > maxSize) {
      return {
        valid: false,
        error: `File size exceeds maximum of ${this.formatFileSize(maxSize)}`
      };
    }

    // Check file type
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!allowedTypes.includes(ext)) {
      return {
        valid: false,
        error: `File type not allowed. Accepted types: ${allowedTypes.join(', ')}`
      };
    }

    return { valid: true };
  }

  /**
   * Batch validate files
   * @param {File[]} files - Files to validate
   * @param {Object} options - Validation options
   * @returns {Object} Validation result { valid: boolean, errors: string[] }
   */
  validateFiles(files, options = {}) {
    const errors = [];

    files.forEach((file, index) => {
      const result = this.validateFile(file, options);
      if (!result.valid) {
        errors.push(`File ${index + 1} (${file.name}): ${result.error}`);
      }
    });

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

const uploadService = new UploadService();
export default uploadService;
