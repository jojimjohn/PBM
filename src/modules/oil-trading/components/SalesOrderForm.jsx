/**
 * SalesOrderForm Component
 *
 * Refactored to use custom hooks for form state, contract rates, and stock validation.
 * Uses ConfirmDialog and showToast instead of native browser dialogs.
 *
 * @module components/SalesOrderForm
 */

import React, { useState, useEffect } from 'react'
import { useLocalization } from '../../../context/LocalizationContext'
import Modal from '../../../components/ui/Modal'
import FIFOPreviewModal from '../../../components/FIFOPreviewModal'
import FileUpload from '../../../components/ui/FileUpload'
import FileViewer from '../../../components/ui/FileViewer'
import DateInput from '../../../components/ui/DateInput'
import Autocomplete from '../../../components/ui/Autocomplete'
import Input, { Textarea } from '../../../components/ui/Input'
import ConfirmDialog from '../../../components/ui/ConfirmDialog'
import AlertDialog from '../../../components/ui/AlertDialog'
import showToast from '../../../components/ui/Toast'
import { useSystemSettings } from '../../../context/SystemSettingsContext'
import { useTourBroadcast } from '../../../context/TourContext'
import systemSettingsService from '../../../services/systemSettingsService'
import customerService from '../../../services/customerService'
import materialService from '../../../services/materialService'
import branchService from '../../../services/branchService'
import uploadService from '../../../services/uploadService'
import { useSalesOrderForm } from '../hooks/useSalesOrderForm'
import { useSalesContractRates } from '../hooks/useSalesContractRates'
import { useStockValidation } from '../hooks/useStockValidation'
import RateOverrideModal from './RateOverrideModal'
import { Plus, Trash2, AlertTriangle, Check, User, FileText, ChevronDown, ChevronUp, Package } from 'lucide-react'
import './SalesOrderForm.css'

const SalesOrderForm = ({ isOpen, onClose, onSave, selectedCustomer = null, editingOrder = null }) => {
  const { t } = useLocalization()
  const { getInputDate } = useSystemSettings()
  const { broadcast, isTourActive } = useTourBroadcast()

  // Data loading states
  const [customers, setCustomers] = useState([])
  const [materials, setMaterials] = useState([])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingBranches, setLoadingBranches] = useState(false)
  const [defaultVatRate, setDefaultVatRate] = useState(5)

  // UI states
  const [contractTermsExpanded, setContractTermsExpanded] = useState(false)
  const [showFIFOPreview, setShowFIFOPreview] = useState(false)
  const [pendingOrderData, setPendingOrderData] = useState(null)
  const [attachments, setAttachments] = useState([])
  const [loadingAttachments, setLoadingAttachments] = useState(false)

  // Rate override modal states
  const [showOverrideModal, setShowOverrideModal] = useState(false)
  const [currentOverride, setCurrentOverride] = useState(null)

  // Dialog states for file operations
  const [deleteFileDialog, setDeleteFileDialog] = useState({ isOpen: false, fileId: null })
  const [alertDialog, setAlertDialog] = useState({ isOpen: false, title: '', message: '', variant: 'error' })

  // Initialize hooks with loaded data
  const formHook = useSalesOrderForm({
    editingOrder,
    selectedCustomer,
    customers,
    materials,
    defaultVatRate
  })

  const contractRates = useSalesContractRates({ customers, materials })

  const stockValidation = useStockValidation({ materials })

  // Load initial data
  useEffect(() => {
    if (isOpen) {
      loadCustomersAndMaterials()
      loadVatRate()
      loadBranches()
    }
  }, [isOpen])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      formHook.reset()
      contractRates.resetContractState()
      setAttachments([])
      setContractTermsExpanded(false)
    }
  }, [isOpen])

  // Load contract rates when customer changes
  useEffect(() => {
    if (formHook.formData.customer) {
      contractRates.loadContractRates(formHook.formData.customer.id)
    } else {
      contractRates.resetContractState()
    }
  }, [formHook.formData.customer?.id])

  // Load S3 attachments when editing
  useEffect(() => {
    const loadAttachments = async () => {
      if (isOpen && editingOrder?.id) {
        setLoadingAttachments(true)
        try {
          const result = await uploadService.getSalesOrderAttachments(editingOrder.id)
          if (result.success) {
            const mappedFiles = (result.data || []).map(file => ({
              id: file.id,
              originalFilename: file.original_filename || file.originalFilename,
              contentType: file.content_type || file.contentType,
              fileSize: file.file_size || file.fileSize,
              downloadUrl: file.download_url || file.downloadUrl
            }))
            setAttachments(mappedFiles)
          } else {
            setAttachments([])
          }
        } catch (error) {
          console.error('Error loading attachments:', error)
          setAttachments([])
        } finally {
          setLoadingAttachments(false)
        }
      } else {
        setAttachments([])
      }
    }
    loadAttachments()
  }, [isOpen, editingOrder?.id])

  // Tour context broadcast
  useEffect(() => {
    if (isTourActive && isOpen) {
      const validItemCount = formHook.formData.items.filter(item => item.materialId).length
      const completeItemCount = formHook.formData.items.filter(
        item => item.materialId && item.quantity && item.rate
      ).length

      broadcast({
        formState: {
          hasCustomer: !!formHook.formData.customer,
          hasBranch: !!formHook.formData.branch_id,
          hasOrderDate: !!formHook.formData.orderDate,
          hasDeliveryDate: !!formHook.formData.deliveryDate,
          itemCount: validItemCount,
          completeItemCount: completeItemCount,
          hasContractRates: Object.keys(contractRates.contractRates).length > 0,
          hasNotes: !!formHook.formData.notes,
          isDraft: formHook.formData.status === 'draft',
          isEdit: !!editingOrder
        }
      })
    }
  }, [formHook.formData, contractRates.contractRates, isTourActive, isOpen, editingOrder, broadcast])

  const loadVatRate = async () => {
    try {
      const vatRate = await systemSettingsService.getVatRate()
      setDefaultVatRate(vatRate)
    } catch (error) {
      console.error('Error loading VAT rate:', error)
    }
  }

  const loadBranches = async () => {
    try {
      setLoadingBranches(true)
      const response = await branchService.getActive()
      if (response.success) {
        setBranches(response.data || [])
      }
    } catch (error) {
      console.error('Error loading branches:', error)
    } finally {
      setLoadingBranches(false)
    }
  }

  const loadCustomersAndMaterials = async () => {
    try {
      const [customersResponse, materialsResponse] = await Promise.all([
        customerService.getAll(),
        materialService.getAll()
      ])

      const companyCustomers = customersResponse.success ? customersResponse.data : []
      const companyMaterials = materialsResponse.success ? materialsResponse.data : []

      setCustomers(companyCustomers)
      setMaterials(companyMaterials)

      // Load stock info for all materials
      await stockValidation.loadAllStock(companyMaterials)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const handleCustomerChange = (customerId) => {
    const customer = formHook.setCustomer(customerId)
    contractRates.clearAllWarnings()
    return customer
  }

  const handleItemChange = (index, field, value) => {
    if (field === 'materialId') {
      const rateResult = contractRates.getEffectiveRate(value)
      formHook.updateItemWithRate(index, value, rateResult.effectiveRate, {
        isContractRate: rateResult.isContractRate,
        marketPrice: rateResult.marketPrice
      })

      // Fetch real-time stock for the selected material
      if (value) {
        stockValidation.fetchMaterialStock(value)
      }

      // Add contract rate warning if applicable
      if (contractRates.hasContractRate(value)) {
        const rateDetails = contractRates.getRateDetails(value)
        if (rateDetails.warningType) {
          contractRates.addWarning({
            type: rateDetails.warningType,
            materialId: value,
            message: rateDetails.description
          })
        }
      }
    } else if (field === 'rate') {
      const materialId = formHook.formData.items[index].materialId
      const newRate = parseFloat(value) || 0
      const rateResult = contractRates.getEffectiveRate(materialId)

      // Check if trying to change active contracted rate
      if (contractRates.isRateLocked(materialId) &&
          Math.abs(newRate - rateResult.effectiveRate) > 0.001) {
        setCurrentOverride({
          itemIndex: index,
          materialId,
          contractRate: rateResult.effectiveRate,
          requestedRate: newRate,
          material: materials.find(m => m.id === materialId)
        })
        setShowOverrideModal(true)
        return
      }

      formHook.updateItem(index, 'rate', newRate)
    } else {
      formHook.updateItem(index, field, value)
    }
  }

  const handleOverrideRequest = (reason, approverPassword) => {
    if (!currentOverride) return

    // Simple password check for demo (in real app, this would be proper authentication)
    if (approverPassword !== 'manager123') {
      setAlertDialog({
        isOpen: true,
        title: t('invalidCredentials', 'Invalid Credentials'),
        message: t('invalidApproverCredentials', 'The approver credentials are incorrect. Please try again.'),
        variant: 'error'
      })
      return
    }

    // Apply the override using hook
    formHook.applyRateOverride(currentOverride.itemIndex, currentOverride.requestedRate, {
      reason,
      originalRate: currentOverride.contractRate,
      approvedBy: 'Manager',
      approvedAt: new Date().toISOString()
    })

    // Track override in contract rates
    contractRates.applyOverride(currentOverride.materialId, {
      originalRate: currentOverride.contractRate,
      overrideRate: currentOverride.requestedRate,
      reason,
      approvedBy: 'Manager'
    })

    setShowOverrideModal(false)
    setCurrentOverride(null)
    showToast.success(t('rateOverrideApplied', 'Rate override applied successfully'))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    try {
      const isDraft = formHook.formData.status === 'draft'
      const isConfirmed = formHook.formData.status === 'confirmed'

      // Validate form
      if (!formHook.validate(isDraft)) {
        throw new Error(formHook.errors.customer || formHook.errors.items || 'Please fill in required fields')
      }

      // Stock validation for non-draft orders
      if (!isDraft) {
        const stockResult = stockValidation.validateStock(formHook.formData.items)
        if (!stockResult.isValid) {
          throw new Error(`Insufficient stock for:\n${stockResult.errors.join('\n')}`)
        }
      }

      // Prepare order data
      const orderData = {
        ...formHook.getCleanData(),
        id: editingOrder?.id || `order_${Date.now()}`,
        createdAt: new Date().toISOString(),
        createdBy: 'current_user',
        contractInfo: formHook.formData.customer?.contractDetails ? {
          contractId: formHook.formData.customer.contractDetails.contractId,
          ratesApplied: formHook.getCleanData().items.map(item => ({
            materialId: item.materialId,
            contractRate: contractRates.contractRates[item.materialId] || null,
            standardRate: materials.find(m => m.id === item.materialId)?.standardPrice || 0,
            appliedRate: item.unitPrice
          }))
        } : null
      }

      // For confirmed orders, show FIFO preview before submitting
      if (isConfirmed && formHook.hasValidItems) {
        setPendingOrderData(orderData)
        setShowFIFOPreview(true)
        setLoading(false)
        return
      }

      await onSave(orderData)
      showToast.success(editingOrder ? t('orderUpdated', 'Order updated successfully') : t('orderCreated', 'Order created successfully'))
      onClose()
    } catch (error) {
      console.error('Error creating sales order:', error)
      setAlertDialog({
        isOpen: true,
        title: t('error', 'Error'),
        message: error.message,
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFIFOConfirm = async (fifoData) => {
    setShowFIFOPreview(false)
    setLoading(true)

    try {
      const orderWithFIFO = {
        ...pendingOrderData,
        fifoPreview: {
          totalCOGS: fifoData.summary.totalCOGS,
          grossMargin: fifoData.summary.grossMargin,
          allocations: fifoData.items.map(item => ({
            materialId: item.materialId,
            cogs: item.cogs,
            batches: item.allocations.length
          }))
        }
      }

      await onSave(orderWithFIFO)
      showToast.success(editingOrder ? t('orderUpdated', 'Order updated successfully') : t('orderCreated', 'Order created successfully'))
      setPendingOrderData(null)
      onClose()
    } catch (error) {
      console.error('Error saving order after FIFO confirmation:', error)
      setAlertDialog({
        isOpen: true,
        title: t('error', 'Error'),
        message: error.message,
        variant: 'error'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleFIFOCancel = () => {
    setShowFIFOPreview(false)
    setPendingOrderData(null)
  }

  // File operations with dialogs
  const handleFileUpload = async (files) => {
    try {
      const result = await uploadService.uploadMultipleToS3('sales-orders', editingOrder.id, files)
      if (result.success) {
        const attachmentsResult = await uploadService.getSalesOrderAttachments(editingOrder.id)
        if (attachmentsResult.success) {
          const mappedFiles = (attachmentsResult.data || []).map(file => ({
            id: file.id,
            originalFilename: file.original_filename || file.originalFilename,
            contentType: file.content_type || file.contentType,
            fileSize: file.file_size || file.fileSize,
            downloadUrl: file.download_url || file.downloadUrl
          }))
          setAttachments(mappedFiles)
        }
        showToast.success(t('filesUploaded', 'Files uploaded successfully'))
      } else {
        showToast.error(t('uploadFailed', 'Failed to upload files') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Upload error:', error)
      showToast.error(t('uploadFailed', 'Failed to upload files') + ': ' + error.message)
    }
  }

  const handleFileDeleteConfirm = async () => {
    const fileId = deleteFileDialog.fileId
    setDeleteFileDialog({ isOpen: false, fileId: null })

    try {
      const result = await uploadService.deleteSalesOrderAttachment(editingOrder.id, fileId)
      if (result.success) {
        setAttachments(prev => prev.filter(f => f.id !== fileId))
        showToast.success(t('fileDeleted', 'File deleted successfully'))
      } else {
        showToast.error(t('deleteFailed', 'Failed to delete file') + ': ' + result.error)
      }
    } catch (error) {
      console.error('Delete error:', error)
      showToast.error(t('deleteFailed', 'Failed to delete file') + ': ' + error.message)
    }
  }

  if (!isOpen) {
    return null
  }

  const { formData } = formHook

  return (
    <Modal
      isOpen={isOpen}
      title={editingOrder ? t('editSalesOrder', 'Edit Sales Order') : t('createSalesOrder', 'Create Sales Order')}
      onClose={onClose}
      className="modal-xxl"
      closeOnOverlayClick={false}
      tourId="SalesOrderForm"
    >
      <form className="sales-order-form" onSubmit={handleSubmit}>
        {/* Draft Mode Info */}
        {formData.status === 'draft' && (
          <div className="info-banner" style={{ background: '#e3f2fd', padding: '12px', borderRadius: '4px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} style={{ color: '#1976d2' }} />
            <span style={{ color: '#1565c0' }}>
              <strong>{t('draftMode', 'Draft Mode')}:</strong> {t('draftModeInfo', 'You can save with minimal information (Customer only). Additional details can be added later.')}
            </span>
          </div>
        )}

        {/* Order Header */}
        <div className="form-section">
          <div className="form-section-title">
            <FileText size={20} />
            {t('orderInformation', 'Order Information')}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <Input
                label={t('orderNumber', 'Order Number')}
                type="text"
                value={formData.orderNumber}
                onChange={(e) => formHook.setField('orderNumber', e.target.value)}
                required
                readOnly
              />
            </div>
            <div className="form-group">
              <DateInput
                label={t('orderDate', 'Order Date')}
                value={formData.orderDate || ''}
                onChange={(value) => formHook.setField('orderDate', value || '')}
                required
              />
            </div>
            <div className="form-group">
              <DateInput
                label={t('expectedDeliveryDate', 'Expected Delivery Date')}
                value={formData.deliveryDate || ''}
                onChange={(value) => formHook.setField('deliveryDate', value || '')}
                minDate={formData.orderDate || ''}
              />
            </div>
            <div className="form-group">
              <Autocomplete
                label={t('orderStatus', 'Order Status')}
                options={[
                  { value: 'draft', label: t('draft', 'Draft') },
                  { value: 'confirmed', label: t('confirmed', 'Confirmed') },
                  { value: 'delivered', label: t('delivered', 'Delivered') },
                  { value: 'cancelled', label: t('cancelled', 'Cancelled') }
                ]}
                value={formData.status}
                onChange={(value) => formHook.setField('status', value)}
                searchable={false}
              />
            </div>
          </div>
        </div>

        {/* Customer Selection */}
        <div className="form-section">
          <div className="form-section-title">
            <User size={20} />
            {t('customerDetails', 'Customer Details')}
            {formData.customer?.contractDetails && (
              <span className="contract-indicator">
                <Check size={16} />
                {t('contractCustomer', 'Contract Customer')}
              </span>
            )}
          </div>
          <div className="form-grid">
            <div className="form-group">
              <Autocomplete
                label={t('selectCustomer', 'Select Customer')}
                options={customers}
                value={formData.customer?.id || null}
                onChange={(customerId) => handleCustomerChange(customerId)}
                getOptionLabel={(customer) => customer ? `${customer.name} (${customer.type.replace('_', ' ').toUpperCase()})` : ''}
                getOptionValue={(customer) => customer?.id || ''}
                placeholder={t('chooseCustomer', 'Choose a customer...')}
                searchable
                required
                loading={loading && customers.length === 0}
                data-tour="so-customer-select"
              />
            </div>

            <div className="form-group">
              <Autocomplete
                label={`${t('branch', 'Branch')} ${formData.status !== 'draft' ? '*' : ''}`}
                options={branches}
                value={formData.branch_id || null}
                onChange={(branchId) => formHook.setField('branch_id', branchId)}
                getOptionLabel={(branch) => branch ? `${branch.name} (${branch.code})` : ''}
                getOptionValue={(branch) => branch?.id || ''}
                placeholder={t('selectBranch', 'Select Branch...')}
                searchable
                required={formData.status !== 'draft'}
                disabled={loadingBranches}
                loading={loadingBranches}
                helperText={loadingBranches ? t('loadingBranches', 'Loading branches...') : null}
              />
            </div>

            {formData.customer && (
              <>
                <div className="form-group">
                  <Input
                    label={t('contactPerson', 'Contact Person')}
                    type="text"
                    value={formData.customer.contactPerson || 'N/A'}
                    readOnly
                  />
                </div>
                <div className="form-group">
                  <Input
                    label={t('phone', 'Phone')}
                    type="text"
                    value={formData.customer.contact?.phone || 'N/A'}
                    readOnly
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* Contract Terms Display - Collapsible */}
        {formData.customer?.contractDetails && (
          <div className="form-section contract-terms-display">
            <div
              className="form-section-title clickable"
              onClick={() => setContractTermsExpanded(!contractTermsExpanded)}
            >
              <Check size={20} />
              {t('activeContractTerms', 'Active Contract Terms')}
              <div className="contract-header-right">
                <span className="contract-status-badge active">
                  {t('validUntil', 'Valid until')} {formData.customer.contractDetails.endDate}
                </span>
                {contractTermsExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>
            </div>

            {contractTermsExpanded && (
              <div className="contract-summary">
                <div className="contract-info-grid">
                  <div className="contract-detail">
                    <label>{t('contractId', 'Contract ID')}:</label>
                    <span>{formData.customer.contractDetails.contractId}</span>
                  </div>
                  <div className="contract-detail">
                    <label>{t('status', 'Status')}:</label>
                    <span className={`status-badge ${formData.customer.contractDetails.status}`}>
                      {formData.customer.contractDetails.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>

                {formData.customer.contractDetails.specialTerms && (
                  <div className="special-terms">
                    <label>{t('specialTerms', 'Special Terms')}:</label>
                    <p>{formData.customer.contractDetails.specialTerms}</p>
                  </div>
                )}

                <div className="material-rates-summary">
                  <h4>{t('contractRates', 'Contract Rates')}:</h4>
                  <div className="rates-compact">
                    {Object.entries(formData.customer.contractDetails.rates || {}).map(([materialId, rateInfo]) => {
                      const material = materials.find(m => m.id === materialId)
                      if (!material) return null

                      const rateDetails = contractRates.getRateDetails(materialId)
                      const isActive = contractRates.isContractActive(materialId)
                      const statusClass = isActive ? 'active' : 'expired'

                      return (
                        <div
                          key={materialId}
                          className={`rate-compact-item ${statusClass}`}
                          title={rateDetails?.description || ''}
                        >
                          <span className="material-name">{material.name}</span>
                          <div className="rate-info">
                            {typeof rateInfo === 'object' ? (
                              <span className={`rate-badge ${rateInfo.type}`}>
                                {rateInfo.type === 'fixed_rate' && `OMR ${rateInfo.contractRate.toFixed(3)}`}
                                {rateInfo.type === 'discount_percentage' && `${rateInfo.discountPercentage}% OFF`}
                                {rateInfo.type === 'minimum_price_guarantee' && `MAX OMR ${rateInfo.contractRate.toFixed(3)}`}
                              </span>
                            ) : (
                              <span className="rate-badge fixed_rate">OMR {rateInfo.toFixed(3)}</span>
                            )}
                            <span className={`status-indicator ${statusClass}`}>
                              {isActive ? t('active', 'ACTIVE') : t('expired', 'EXPIRED')}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Warnings */}
        {contractRates.warnings.length > 0 && (
          <div className="warnings-section">
            {contractRates.warnings.map((warning, index) => (
              <div key={index} className={`warning-item ${warning.type}`}>
                <AlertTriangle size={16} />
                <span>{warning.message}</span>
              </div>
            ))}
          </div>
        )}

        {/* Order Items */}
        <div className="form-section" data-tour="so-items-section">
          <div className="form-section-title">
            <div className="title-with-action">
              <span>{t('orderItems', 'Order Items')}</span>
              <button
                type="button"
                className="btn btn-outline btn-small"
                onClick={formHook.addItem}
              >
                <Plus size={16} />
                {t('addItem', 'Add Item')}
              </button>
            </div>
          </div>

          <div className="items-table">
            <div className="items-header">
              <span>{t('material', 'Material')}</span>
              <span>{t('quantity', 'Quantity')}</span>
              <span>{t('unit', 'Unit')}</span>
              <span>{t('rateOMR', 'Rate (OMR)')}</span>
              <span>{t('amountOMR', 'Amount (OMR)')}</span>
              <span>{t('actions', 'Actions')}</span>
            </div>

            {formData.items.map((item, index) => {
              const selectedMaterial = materials.find(m => m.id === item.materialId)
              const hasContractRate = contractRates.hasContractRate(item.materialId)
              const rateLocked = contractRates.isRateLocked(item.materialId)
              const discountInfo = contractRates.getDiscountInfo(item.materialId)
              const isOverridden = item.isOverridden
              const isDraft = formData.status === 'draft'
              const stock = stockValidation.getStockForMaterial(item.materialId)
              const stockWarning = stockValidation.getStockWarning(item.materialId, item.quantity)

              return (
                <div key={item.tempId || index} className="item-row">
                  <div className="item-field material-autocomplete-field">
                    <Autocomplete
                      options={materials}
                      value={item.materialId}
                      onChange={(materialId) => handleItemChange(index, 'materialId', materialId)}
                      getOptionLabel={(material) => {
                        if (!material) return ''
                        const matStock = stockValidation.getStockForMaterial(material.id)
                        const stockDisplay = matStock ? `(Stock: ${matStock.currentStock} ${matStock.unit})` : '(Stock: N/A)'
                        return `${material.name} ${stockDisplay}`
                      }}
                      getOptionValue={(material) => material?.id || ''}
                      placeholder={t('selectMaterial', 'Select material...')}
                      searchable
                      required={!isDraft}
                      size="small"
                    />
                  </div>

                  <div className="item-field">
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                      placeholder="0"
                      min="0"
                      step="0.001"
                      required={!isDraft}
                    />
                    {/* Stock validation display */}
                    {item.materialId && stock && (
                      <div className="stock-info">
                        {stock.isOutOfStock || stock.currentStock <= 0 ? (
                          <div className="stock-error">
                            <AlertTriangle size={14} />
                            <span>{t('outOfStock', 'Out of stock!')}</span>
                          </div>
                        ) : stockWarning?.type === 'error' ? (
                          <div className="stock-warning">
                            <AlertTriangle size={14} />
                            <span>
                              {t('insufficient', 'Insufficient!')} {t('available', 'Available')}: {stock.currentStock.toFixed(3)} {stock.unit}
                              {formData.status !== 'draft' && <strong> ({t('cannotSubmit', 'Cannot submit')})</strong>}
                            </span>
                          </div>
                        ) : stock.isLowStock ? (
                          <div className="stock-low">
                            <Package size={14} />
                            <span>{t('lowStock', 'Low stock')}: {stock.currentStock.toFixed(3)} {stock.unit}</span>
                          </div>
                        ) : (
                          <div className="stock-ok">
                            <Check size={14} />
                            <span>{t('available', 'Available')}: {stock.currentStock.toFixed(3)} {stock.unit}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="item-field">
                    <span className="unit-display">
                      {selectedMaterial ? selectedMaterial.unit : '-'}
                    </span>
                  </div>

                  <div className="item-field rate-field">
                    <input
                      type="number"
                      value={item.rate}
                      onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                      placeholder="0.000"
                      min="0"
                      step="0.001"
                      required={!isDraft}
                      readOnly={rateLocked}
                      className={rateLocked ? 'locked-rate' : ''}
                      title={rateLocked ? t('contractRateLocked', 'Contract rate is locked. Attempt to change will require manager approval.') : ''}
                    />
                    {hasContractRate && (
                      <div className="contract-indicators">
                        <span className={`contract-rate-indicator ${isOverridden ? 'overridden' : ''}`}>
                          {isOverridden ? t('rateOverridden', 'Rate Overridden') : t('contractRate', 'Contract Rate')}
                          {rateLocked && <span className="lock-icon">🔒</span>}
                        </span>
                        {discountInfo.hasDiscount && (
                          <span className="discount-indicator">
                            {discountInfo.percentage}% {t('discountApplied', 'Discount Applied')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="item-field">
                    <span className="amount-display">
                      {(parseFloat(item.amount) || 0).toFixed(3)}
                    </span>
                  </div>

                  <div className="item-field">
                    <button
                      type="button"
                      className="btn btn-outline btn-small"
                      onClick={() => formHook.removeItem(index)}
                      disabled={formData.items.length === 1}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Order Totals */}
        <div className="form-section">
          <div className="totals-section">
            <div className="totals-row">
              <label>{t('subtotal', 'Subtotal')}:</label>
              <span>OMR {formData.totalAmount.toFixed(3)}</span>
            </div>
            <div className="totals-row">
              <label>
                {t('discount', 'Discount')}:
                <input
                  type="number"
                  value={formData.discountPercent}
                  onChange={(e) => formHook.setField('discountPercent', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                  className="discount-input"
                />
                %
              </label>
              <span>OMR {formData.discountAmount.toFixed(3)}</span>
            </div>
            {formData.vatAmount > 0 && (
              <div className="totals-row">
                <label>{t('vat', 'VAT')} ({formData.vatRate}%):</label>
                <span>OMR {formData.vatAmount.toFixed(3)}</span>
              </div>
            )}
            <div className="totals-row total-row">
              <label>{t('totalAmount', 'Total Amount')}:</label>
              <span>OMR {formData.netAmount.toFixed(3)}</span>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <div className="form-section-title">{t('additionalInformation', 'Additional Information')}</div>
          <div className="form-grid">
            <div className="form-group full-width">
              <Textarea
                label={t('orderNotes', 'Order Notes')}
                value={formData.notes}
                onChange={(e) => formHook.setField('notes', e.target.value)}
                placeholder={t('orderNotesPlaceholder', 'Any notes or comments about this order...')}
                rows={3}
              />
            </div>
            <div className="form-group full-width">
              <Textarea
                label={t('specialInstructions', 'Special Instructions')}
                value={formData.specialInstructions}
                onChange={(e) => formHook.setField('specialInstructions', e.target.value)}
                placeholder={t('specialInstructionsPlaceholder', 'Special delivery or handling instructions...')}
                rows={2}
              />
            </div>
          </div>
        </div>

        {/* Attachments - Only in edit mode */}
        {editingOrder?.id && (
          <div className="form-section">
            <div className="form-section-title">{t('attachments', 'Attachments')}</div>

            <FileUpload
              mode="multiple"
              accept=".pdf,.jpg,.jpeg,.png"
              maxSize={5242880}
              maxFiles={10}
              onUpload={handleFileUpload}
              existingFiles={[]}
            />

            {loadingAttachments ? (
              <div className="attachments-loading">{t('loadingAttachments', 'Loading attachments...')}</div>
            ) : attachments.length > 0 ? (
              <FileViewer
                files={attachments}
                onDelete={(fileId) => setDeleteFileDialog({ isOpen: true, fileId })}
                onRefreshUrl={async (fileId) => {
                  const result = await uploadService.getSalesOrderAttachments(editingOrder.id)
                  if (result.success) {
                    const file = result.data.find(f => f.id === fileId)
                    if (file) {
                      return file.download_url || file.downloadUrl
                    }
                  }
                  return null
                }}
                canDelete={true}
              />
            ) : (
              <div className="empty-state text-sm">{t('noAttachments', 'No attachments')}</div>
            )}
          </div>
        )}

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            data-tour="so-submit-button"
          >
            {loading
              ? (editingOrder ? t('updatingOrder', 'Updating Order...') : t('creatingOrder', 'Creating Order...'))
              : (editingOrder ? t('updateSalesOrder', 'Update Sales Order') : t('createSalesOrder', 'Create Sales Order'))}
          </button>
        </div>
      </form>

      {/* Rate Override Modal */}
      <RateOverrideModal
        isOpen={showOverrideModal}
        override={currentOverride}
        onApprove={handleOverrideRequest}
        onCancel={() => {
          setShowOverrideModal(false)
          setCurrentOverride(null)
        }}
        t={t}
      />

      {/* FIFO Preview Modal */}
      <FIFOPreviewModal
        isOpen={showFIFOPreview}
        onClose={handleFIFOCancel}
        onConfirm={handleFIFOConfirm}
        items={pendingOrderData?.items?.filter(item => item.materialId).map(item => ({
          materialId: parseInt(item.materialId, 10),
          quantity: parseFloat(item.quantity) || 0,
          unitPrice: parseFloat(item.unitPrice) || 0
        })) || []}
        branchId={pendingOrderData?.branch_id ? parseInt(pendingOrderData.branch_id, 10) : null}
        formatCurrency={(val) => `${parseFloat(val || 0).toFixed(3)} OMR`}
      />

      {/* File Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteFileDialog.isOpen}
        onClose={() => setDeleteFileDialog({ isOpen: false, fileId: null })}
        onConfirm={handleFileDeleteConfirm}
        title={t('confirmDelete', 'Confirm Delete')}
        message={t('deleteFileConfirmation', 'Are you sure you want to delete this file? This action cannot be undone.')}
        variant="danger"
        confirmText={t('delete', 'Delete')}
        cancelText={t('cancel', 'Cancel')}
        t={t}
      />

      {/* Alert Dialog for Errors */}
      <AlertDialog
        isOpen={alertDialog.isOpen}
        onClose={() => setAlertDialog({ isOpen: false, title: '', message: '', variant: 'error' })}
        title={alertDialog.title}
        message={alertDialog.message}
        variant={alertDialog.variant}
        t={t}
      />
    </Modal>
  )
}

export default SalesOrderForm
