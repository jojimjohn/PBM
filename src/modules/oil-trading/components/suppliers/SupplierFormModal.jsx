/**
 * Supplier Form Modal
 *
 * Modal component for creating and editing suppliers.
 * Uses composition of form section components.
 */

import React, { useEffect } from 'react'
import { Save } from 'lucide-react'
import Modal from '../../../../components/ui/Modal'
import FileUpload from '../../../../components/ui/FileUpload'
import FileViewer from '../../../../components/ui/FileViewer'
import { useSupplierForm } from '../../hooks/useSupplierForm'
import { useAttachments } from '../../hooks/useAttachments'
import {
  BasicInfoSection,
  ContactSection,
  BusinessSection,
  BankingSection,
  NotesSection
} from './FormSections'

/**
 * @typedef {import('../../types/supplier.types').Supplier} Supplier
 * @typedef {import('../../types/supplier.types').SupplierType} SupplierType
 * @typedef {import('../../types/supplier.types').Region} Region
 * @typedef {import('../../types/supplier.types').Specialization} Specialization
 */

/**
 * Supplier form modal for create/edit operations
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Modal visibility
 * @param {Function} props.onClose - Close handler
 * @param {Function} props.onSave - Save handler (receives API-formatted data)
 * @param {Supplier|null} props.supplier - Supplier to edit (null for create)
 * @param {SupplierType[]} props.supplierTypes - Available supplier types
 * @param {Region[]} props.regions - Available regions
 * @param {Specialization[]} props.specializations - Material categories
 * @param {string} props.nextCode - Pre-generated code for new suppliers
 * @param {boolean} props.loading - Loading state
 * @param {Function} props.t - Translation function
 */
const SupplierFormModal = ({
  isOpen,
  onClose,
  onSave,
  supplier = null,
  supplierTypes,
  regions,
  specializations,
  nextCode,
  loading,
  t
}) => {
  const isEdit = !!supplier

  // Form state management
  const {
    formData,
    updateField,
    toggleSpecialization,
    getApiData,
    isValid,
    validationErrors,
    loadSupplier
  } = useSupplierForm(supplier, nextCode)

  // Attachments (only for edit mode)
  const {
    attachments,
    loading: attachmentsLoading,
    uploadFiles,
    deleteFile,
    refreshFileUrl
  } = useAttachments('suppliers', isEdit ? supplier?.id : null)

  // Reload form when supplier changes (for edit mode)
  useEffect(() => {
    if (supplier) {
      loadSupplier(supplier)
    }
  }, [supplier, loadSupplier])

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!isValid) {
      alert(validationErrors.join('\n'))
      return
    }

    const apiData = getApiData()
    await onSave(apiData, isEdit)
  }

  const handleUpload = async (files) => {
    const result = await uploadFiles(files)
    if (result.success) {
      alert('Files uploaded successfully')
    } else {
      alert('Failed to upload files: ' + result.error)
    }
  }

  const handleDelete = async (fileId) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return

    const result = await deleteFile(fileId)
    if (result.success) {
      alert('File deleted successfully')
    } else {
      alert('Failed to delete file: ' + result.error)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      title={isEdit ? t('editSupplier', 'Edit Supplier') : t('addNewSupplier', 'Add New Supplier')}
      onClose={onClose}
      className="modal-xl"
    >
      <form className="supplier-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <BasicInfoSection
          formData={formData}
          updateField={updateField}
          supplierTypes={supplierTypes}
        />

        {/* Contact Information */}
        <ContactSection
          formData={formData}
          updateField={updateField}
          regions={regions}
          t={t}
        />

        {/* Business Details */}
        <BusinessSection
          formData={formData}
          updateField={updateField}
          toggleSpecialization={toggleSpecialization}
          specializations={specializations}
          t={t}
        />

        {/* Banking Information */}
        <BankingSection
          formData={formData}
          updateField={updateField}
        />

        {/* Notes */}
        <NotesSection
          formData={formData}
          updateField={updateField}
        />

        {/* Attachments - Only in edit mode */}
        {isEdit && supplier?.id && (
          <AttachmentsSectionWrapper
            attachments={attachments}
            loading={attachmentsLoading}
            onUpload={handleUpload}
            onDelete={handleDelete}
            onRefreshUrl={refreshFileUrl}
            t={t}
          />
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save size={16} />
                {isEdit ? 'Update Supplier' : 'Create Supplier'}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}

/**
 * Attachments section wrapper with FileUpload and FileViewer
 */
const AttachmentsSectionWrapper = ({
  attachments,
  loading,
  onUpload,
  onDelete,
  onRefreshUrl,
  t
}) => (
  <div className="form-section">
    <div className="form-section-title">
      Attachments
    </div>

    <FileUpload
      mode="multiple"
      accept=".pdf,.jpg,.jpeg,.png"
      maxSize={5242880}
      maxFiles={10}
      onUpload={onUpload}
      existingFiles={[]}
    />

    {loading ? (
      <div className="attachments-loading">Loading attachments...</div>
    ) : attachments.length > 0 ? (
      <FileViewer
        files={attachments}
        onDelete={onDelete}
        onRefreshUrl={onRefreshUrl}
        canDelete={true}
      />
    ) : (
      <div className="empty-state text-sm">{t('noAttachments')}</div>
    )}
  </div>
)

export default SupplierFormModal
