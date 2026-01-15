/**
 * useAttachments Hook
 *
 * Manages file attachments for any entity (customers, contracts, etc.)
 * using S3 upload service. Extracts repeated file management logic.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import uploadService from '../../../services/uploadService'

/**
 * @typedef {import('../types/customer.types').FileAttachment} FileAttachment
 */

/**
 * Normalize file object from API response
 * Backend returns snake_case, frontend uses camelCase
 * @param {Object} file - File object from API
 * @returns {FileAttachment}
 */
const normalizeFile = (file) => ({
  id: file.id,
  originalFilename: file.original_filename || file.originalFilename,
  contentType: file.content_type || file.contentType,
  fileSize: file.file_size || file.fileSize,
  downloadUrl: file.download_url || file.downloadUrl
})

/**
 * Hook for managing file attachments
 * @param {string} entityType - Entity type (e.g., 'customers', 'contracts')
 * @param {string|number|null} entityId - Entity ID (null for new entities)
 * @returns {Object} Attachment state and operations
 */
export const useAttachments = (entityType, entityId) => {
  /** @type {[FileAttachment[], Function]} */
  const [attachments, setAttachments] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Track loaded entity to prevent duplicate API calls (React.StrictMode, re-renders)
  const loadedEntityRef = useRef(null)

  /**
   * Load attachments for the entity
   */
  const loadAttachments = useCallback(async () => {
    if (!entityId) return

    setLoading(true)
    setError(null)

    try {
      const result = await uploadService.getS3Files(entityType, entityId)
      if (result.success) {
        setAttachments((result.data || []).map(normalizeFile))
      } else {
        throw new Error(result.error || 'Failed to load attachments')
      }
    } catch (err) {
      console.error('Error loading attachments:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [entityType, entityId])

  // Load on mount if entity exists - prevent duplicate calls for same entity
  useEffect(() => {
    const entityKey = entityId ? `${entityType}-${entityId}` : null

    if (entityId && entityKey !== loadedEntityRef.current) {
      loadedEntityRef.current = entityKey
      loadAttachments()
    }

    // Reset ref when entity is null (modal closed)
    if (!entityId) {
      loadedEntityRef.current = null
      setAttachments([])
    }
  }, [entityType, entityId, loadAttachments])

  /**
   * Upload multiple files
   * @param {File[]} files - Files to upload
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const uploadFiles = useCallback(async (files) => {
    if (!entityId) {
      return { success: false, error: 'Entity must be saved before uploading attachments' }
    }

    try {
      const result = await uploadService.uploadMultipleToS3(entityType, entityId, files)
      if (result.success) {
        await loadAttachments() // Refresh list after upload
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Upload error:', err)
      return { success: false, error: err.message }
    }
  }, [entityType, entityId, loadAttachments])

  /**
   * Delete a file
   * @param {string} fileId - File ID to delete
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  const deleteFile = useCallback(async (fileId) => {
    if (!entityId) {
      return { success: false, error: 'Entity not found' }
    }

    try {
      const result = await uploadService.deleteS3File(entityType, entityId, fileId)
      if (result.success) {
        setAttachments(prev => prev.filter(f => f.id !== fileId))
        return { success: true }
      }
      return { success: false, error: result.error }
    } catch (err) {
      console.error('Delete error:', err)
      return { success: false, error: err.message }
    }
  }, [entityType, entityId])

  /**
   * Refresh download URL for a file (S3 URLs expire)
   * @param {string} fileId - File ID to refresh
   * @returns {Promise<string|null>} Fresh download URL or null
   */
  const refreshFileUrl = useCallback(async (fileId) => {
    if (!entityId) return null

    try {
      const result = await uploadService.getS3Files(entityType, entityId)
      if (result.success) {
        const file = result.data.find(f => f.id === fileId)
        return file?.download_url || file?.downloadUrl || null
      }
    } catch (err) {
      console.error('Error refreshing URL:', err)
    }
    return null
  }, [entityType, entityId])

  /**
   * Force reload attachments (clears duplicate prevention)
   */
  const forceReload = useCallback(() => {
    loadedEntityRef.current = null
    return loadAttachments()
  }, [loadAttachments])

  return {
    attachments,
    loading,
    error,
    uploadFiles,
    deleteFile,
    refreshFileUrl,
    reload: forceReload
  }
}

export default useAttachments
