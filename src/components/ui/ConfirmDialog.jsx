/**
 * ConfirmDialog Component
 *
 * Reusable confirmation dialog for destructive or important actions.
 * Wraps Modal.jsx with confirmation-specific features.
 *
 * @module components/ui/ConfirmDialog
 */

import React from 'react'
import { motion } from 'framer-motion'
import Modal from './Modal'
import { Trash2, AlertTriangle, Info, HelpCircle, Loader2 } from 'lucide-react'
import './ConfirmDialog.css'

/**
 * Icon mapping for each variant
 */
const VARIANT_ICONS = {
  danger: Trash2,
  warning: AlertTriangle,
  info: Info,
  default: HelpCircle
}

/**
 * Button class mapping for each variant
 */
const VARIANT_BUTTON_CLASSES = {
  danger: 'btn-danger',
  warning: 'btn-warning',
  info: 'btn-primary',
  default: 'btn-primary'
}

/**
 * Default confirm button text for each variant
 */
const VARIANT_CONFIRM_TEXT = {
  danger: 'Delete',
  warning: 'Continue',
  info: 'OK',
  default: 'Confirm'
}

/**
 * ConfirmDialog Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is visible
 * @param {Function} props.onClose - Called when user cancels or closes
 * @param {Function} props.onConfirm - Called when user confirms
 * @param {string} props.title - Dialog title
 * @param {string|React.ReactNode} props.message - Dialog message/content
 * @param {'danger'|'warning'|'info'|'default'} [props.variant='default'] - Visual variant
 * @param {string} [props.confirmText] - Custom confirm button text
 * @param {string} [props.cancelText='Cancel'] - Custom cancel button text
 * @param {boolean} [props.loading=false] - Show loading state on confirm button
 * @param {boolean} [props.showIcon=true] - Show variant icon
 * @param {React.ComponentType} [props.icon] - Custom icon component
 * @param {Function} [props.t] - Translation function
 */
const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  variant = 'default',
  confirmText,
  cancelText,
  loading = false,
  showIcon = true,
  icon: CustomIcon,
  t = (key, fallback) => fallback || key
}) => {
  const Icon = CustomIcon || VARIANT_ICONS[variant] || VARIANT_ICONS.default
  const buttonClass = VARIANT_BUTTON_CLASSES[variant] || VARIANT_BUTTON_CLASSES.default
  const defaultConfirmText = VARIANT_CONFIRM_TEXT[variant] || 'Confirm'

  const handleConfirm = async () => {
    if (loading) return
    if (onConfirm) {
      await onConfirm()
    }
  }

  const handleCancel = () => {
    if (loading) return
    onClose()
  }

  const footer = (
    <div className="confirm-dialog-actions">
      <button
        type="button"
        className="btn btn-secondary"
        onClick={handleCancel}
        disabled={loading}
      >
        {cancelText || t('cancel', 'Cancel')}
      </button>
      <button
        type="button"
        className={`btn ${buttonClass}`}
        onClick={handleConfirm}
        disabled={loading}
        autoFocus
      >
        {loading ? (
          <>
            <Loader2 className="btn-spinner" size={16} />
            {t('processing', 'Processing...')}
          </>
        ) : (
          <>
            {variant === 'danger' && <Trash2 size={16} />}
            {confirmText || t(variant === 'danger' ? 'delete' : 'confirm', defaultConfirmText)}
          </>
        )}
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleCancel}
      size="sm"
      showCloseButton={!loading}
      closeOnOverlayClick={false}
      closeOnEsc={!loading}
      footer={footer}
      className={`confirm-dialog confirm-dialog-${variant}`}
    >
      <div className="confirm-dialog-content">
        {showIcon && (
          <motion.div
            className={`confirm-dialog-icon confirm-dialog-icon-${variant}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Icon size={28} />
          </motion.div>
        )}
        <div className="confirm-dialog-text">
          {title && <h3 className="confirm-dialog-title">{title}</h3>}
          {message && (
            <div className="confirm-dialog-message">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
