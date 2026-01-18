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
// CSS moved to global index.css Tailwind

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
 * Button Tailwind class mapping for each variant
 */
const VARIANT_BUTTON_CLASSES = {
  danger: 'btn-tw-danger',
  warning: 'bg-amber-600 text-white hover:bg-amber-700 border-amber-600',
  info: 'btn-tw-primary',
  default: 'btn-tw-primary'
}

/**
 * Icon background Tailwind classes for each variant
 */
const VARIANT_ICON_CLASSES = {
  danger: 'bg-status-error-bg text-status-error-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  info: 'bg-status-info-bg text-status-info-text',
  default: 'bg-slate-100 text-slate-600'
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
  const iconClass = VARIANT_ICON_CLASSES[variant] || VARIANT_ICON_CLASSES.default
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
    <div className="confirm-dialog-actions flex gap-3 justify-end w-full">
      <button
        type="button"
        className="btn-tw-secondary min-w-[100px]"
        onClick={handleCancel}
        disabled={loading}
      >
        {cancelText || t('cancel', 'Cancel')}
      </button>
      <button
        type="button"
        className={`btn-tw ${buttonClass} min-w-[100px]`}
        onClick={handleConfirm}
        disabled={loading}
        autoFocus
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin" size={16} />
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
      <div className="flex flex-col items-center text-center gap-4 py-2">
        {showIcon && (
          <motion.div
            className={`w-14 h-14 rounded-full flex items-center justify-center shrink-0 ${iconClass}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Icon size={28} />
          </motion.div>
        )}
        <div className="flex flex-col gap-2">
          {title && <h3 className="text-lg font-semibold text-slate-800 leading-tight">{title}</h3>}
          {message && (
            <div className="text-sm text-slate-600 leading-relaxed">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default ConfirmDialog
