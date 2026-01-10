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

  // ========================================================================
  // S3/MinIO Attachment Methods (New API)
  // ========================================================================
  // These methods work with the standardized S3-based attachment system.
  // URL pattern: /{module}/{id}/attachments
  // ========================================================================

  /**
   * Upload a file to S3 storage for any module
   * @param {string} module - Module name (e.g., 'sales-orders', 'customers', 'contracts')
   * @param {number|string} referenceId - Parent record ID
   * @param {File} file - File to upload
   * @param {Object} options - Optional settings
   * @param {function} options.onProgress - Progress callback: (progress: number) => void
   * @returns {Promise<Object>} Upload result with attachment data
   */
  async uploadToS3(module, referenceId, file, options = {}) {
    const { onProgress } = options;

    try {
      const formData = new FormData();
      formData.append('file', file);

      const token = authService.getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Use XMLHttpRequest for progress tracking
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();

        // Progress event
        if (onProgress) {
          xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable) {
              const progress = Math.round((event.loaded / event.total) * 100);
              onProgress(progress);
            }
          });
        }

        // Completion event
        xhr.addEventListener('load', () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.error || 'Upload failed'));
            }
          } catch (e) {
            reject(new Error('Invalid response from server'));
          }
        });

        // Error event
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        // Abort event
        xhr.addEventListener('abort', () => {
          reject(new Error('Upload cancelled'));
        });

        xhr.open('POST', `${API_BASE_URL}/${module}/${referenceId}/attachments`);
        xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        xhr.send(formData);
      });
    } catch (error) {
      console.error('Error uploading to S3:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload file'
      };
    }
  }

  /**
   * Upload multiple files to S3 storage
   * @param {string} module - Module name
   * @param {number|string} referenceId - Parent record ID
   * @param {File[]} files - Files to upload
   * @param {Object} options - Optional settings
   * @param {function} options.onProgress - Progress callback: (fileIndex, progress) => void
   * @param {function} options.onFileComplete - Callback when a file completes: (fileIndex, result) => void
   * @returns {Promise<Object>} Upload results for all files
   */
  async uploadMultipleToS3(module, referenceId, files, options = {}) {
    const { onProgress, onFileComplete } = options;
    const results = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      try {
        const result = await this.uploadToS3(module, referenceId, file, {
          onProgress: onProgress ? (progress) => onProgress(i, progress) : undefined
        });
        results.push({ file: file.name, ...result });
        if (onFileComplete) {
          onFileComplete(i, result);
        }
      } catch (error) {
        results.push({ file: file.name, success: false, error: error.message });
        if (onFileComplete) {
          onFileComplete(i, { success: false, error: error.message });
        }
      }
    }

    return {
      success: results.every(r => r.success !== false),
      data: { attachments: results }
    };
  }

  /**
   * Get all attachments for a module record (S3)
   * @param {string} module - Module name
   * @param {number|string} referenceId - Parent record ID
   * @returns {Promise<Object>} List of attachments with presigned download URLs
   */
  async getS3Files(module, referenceId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/${module}/${referenceId}/attachments`
      );
      return data;
    } catch (error) {
      console.error('Error fetching S3 files:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch files',
        data: { attachments: [] }
      };
    }
  }

  /**
   * Delete an S3 attachment
   * @param {string} module - Module name
   * @param {number|string} referenceId - Parent record ID
   * @param {number|string} fileId - Attachment ID
   * @returns {Promise<Object>} Delete result
   */
  async deleteS3File(module, referenceId, fileId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/${module}/${referenceId}/attachments/${fileId}`,
        { method: 'DELETE' }
      );
      return data;
    } catch (error) {
      console.error('Error deleting S3 file:', error);
      return {
        success: false,
        error: error.message || 'Failed to delete file'
      };
    }
  }

  /**
   * Refresh presigned download URL for an attachment
   * @param {string} module - Module name
   * @param {number|string} referenceId - Parent record ID
   * @param {number|string} fileId - Attachment ID
   * @returns {Promise<Object>} New presigned URL
   */
  async refreshS3Url(module, referenceId, fileId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/${module}/${referenceId}/attachments/${fileId}`
      );
      return data;
    } catch (error) {
      console.error('Error refreshing S3 URL:', error);
      return {
        success: false,
        error: error.message || 'Failed to refresh download URL'
      };
    }
  }

  // ========================================================================
  // Module-Specific Convenience Methods (S3)
  // ========================================================================

  // Sales Orders
  async uploadSalesOrderAttachment(salesOrderId, file, options) {
    return this.uploadToS3('sales-orders', salesOrderId, file, options);
  }
  async getSalesOrderAttachments(salesOrderId) {
    return this.getS3Files('sales-orders', salesOrderId);
  }
  async deleteSalesOrderAttachment(salesOrderId, fileId) {
    return this.deleteS3File('sales-orders', salesOrderId, fileId);
  }

  // Purchase Orders
  async uploadPurchaseOrderAttachment(purchaseOrderId, file, options) {
    return this.uploadToS3('purchase-orders', purchaseOrderId, file, options);
  }
  async getPurchaseOrderAttachments(purchaseOrderId) {
    return this.getS3Files('purchase-orders', purchaseOrderId);
  }
  async deletePurchaseOrderAttachment(purchaseOrderId, fileId) {
    return this.deleteS3File('purchase-orders', purchaseOrderId, fileId);
  }

  // Customers
  async uploadCustomerAttachment(customerId, file, options) {
    return this.uploadToS3('customers', customerId, file, options);
  }
  async getCustomerAttachments(customerId) {
    return this.getS3Files('customers', customerId);
  }
  async deleteCustomerAttachment(customerId, fileId) {
    return this.deleteS3File('customers', customerId, fileId);
  }

  // Suppliers
  async uploadSupplierAttachment(supplierId, file, options) {
    return this.uploadToS3('suppliers', supplierId, file, options);
  }
  async getSupplierAttachments(supplierId) {
    return this.getS3Files('suppliers', supplierId);
  }
  async deleteSupplierAttachment(supplierId, fileId) {
    return this.deleteS3File('suppliers', supplierId, fileId);
  }

  // Contracts
  async uploadContractAttachment(contractId, file, options) {
    return this.uploadToS3('contracts', contractId, file, options);
  }
  async getContractAttachments(contractId) {
    return this.getS3Files('contracts', contractId);
  }
  async deleteContractAttachment(contractId, fileId) {
    return this.deleteS3File('contracts', contractId, fileId);
  }

  // Materials
  async uploadMaterialAttachment(materialId, file, options) {
    return this.uploadToS3('materials', materialId, file, options);
  }
  async getMaterialAttachments(materialId) {
    return this.getS3Files('materials', materialId);
  }
  async deleteMaterialAttachment(materialId, fileId) {
    return this.deleteS3File('materials', materialId, fileId);
  }

  // Wastages
  async uploadWastageAttachment(wastageId, file, options) {
    return this.uploadToS3('wastages', wastageId, file, options);
  }
  async getWastageAttachments(wastageId) {
    return this.getS3Files('wastages', wastageId);
  }
  async deleteWastageAttachment(wastageId, fileId) {
    return this.deleteS3File('wastages', wastageId, fileId);
  }

  // Projects
  async uploadProjectAttachment(projectId, file, options) {
    return this.uploadToS3('projects', projectId, file, options);
  }
  async getProjectAttachments(projectId) {
    return this.getS3Files('projects', projectId);
  }
  async deleteProjectAttachment(projectId, fileId) {
    return this.deleteS3File('projects', projectId, fileId);
  }

  // Bank Transactions
  async uploadBankTransactionAttachment(transactionId, file, options) {
    return this.uploadToS3('bank-transactions', transactionId, file, options);
  }
  async getBankTransactionAttachments(transactionId) {
    return this.getS3Files('bank-transactions', transactionId);
  }
  async deleteBankTransactionAttachment(transactionId, fileId) {
    return this.deleteS3File('bank-transactions', transactionId, fileId);
  }

  // Collection Expenses
  async uploadCollectionExpenseAttachment(collectionOrderId, file, options) {
    return this.uploadToS3('collection-orders', collectionOrderId, file, options);
  }
  async getCollectionExpenseAttachments(collectionOrderId) {
    return this.getS3Files('collection-orders', collectionOrderId);
  }
  async deleteCollectionExpenseAttachment(collectionOrderId, fileId) {
    return this.deleteS3File('collection-orders', collectionOrderId, fileId);
  }
}

const uploadService = new UploadService();
export default uploadService;
