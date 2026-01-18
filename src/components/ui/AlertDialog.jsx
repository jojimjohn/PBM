/**
 * AlertDialog Component
 *
 * Reusable alert dialog for important messages requiring user acknowledgment.
 * Wraps Modal.jsx with alert-specific features - single button, no confirmation needed.
 *
 * @module components/ui/AlertDialog
 */

import React, { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import Modal from './Modal'
import { CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
// CSS moved to global index.css Tailwind

/**
 * Icon mapping for each variant
 */
const VARIANT_ICONS = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info
}

/**
 * Icon Tailwind class mapping for each variant - uses global status colors
 */
const VARIANT_ICON_CLASSES = {
  success: 'bg-status-success-bg text-status-success-text',
  error: 'bg-status-error-bg text-status-error-text',
  warning: 'bg-status-warning-bg text-status-warning-text',
  info: 'bg-status-info-bg text-status-info-text'
}

/**
 * AlertDialog Component
 *
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether dialog is visible
 * @param {Function} props.onClose - Called when user dismisses
 * @param {string} props.title - Dialog title
 * @param {string|React.ReactNode} props.message - Dialog message/content
 * @param {'success'|'error'|'warning'|'info'} [props.variant='info'] - Visual variant
 * @param {string} [props.buttonText] - Custom button text (default: 'OK')
 * @param {boolean} [props.showIcon=true] - Show variant icon
 * @param {React.ComponentType} [props.icon] - Custom icon component
 * @param {Function} [props.t] - Translation function
 */
const AlertDialog = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonText,
  showIcon = true,
  icon: CustomIcon,
  t = (key, fallback) => fallback || key
}) => {
  const buttonRef = useRef(null)
  const Icon = CustomIcon || VARIANT_ICONS[variant] || VARIANT_ICONS.info
  const iconClass = VARIANT_ICON_CLASSES[variant] || VARIANT_ICON_CLASSES.info

  // Auto-focus the button when dialog opens
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      // Small delay to ensure modal animation completes
      const timer = setTimeout(() => {
        buttonRef.current?.focus()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isOpen])

  const handleDismiss = () => {
    onClose()
  }

  const footer = (
    <div className="alert-dialog-actions flex justify-center w-full">
      <button
        ref={buttonRef}
        type="button"
        className="btn-tw-primary min-w-[100px]"
        onClick={handleDismiss}
      >
        {buttonText || t('ok', 'OK')}
      </button>
    </div>
  )

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleDismiss}
      size="sm"
      showCloseButton={true}
      closeOnOverlayClick={true}
      closeOnEsc={true}
      footer={footer}
      className={`alert-dialog alert-dialog-${variant}`}
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
          {title && <h3 className="alert-dialog-title text-lg font-semibold text-slate-800 leading-tight">{title}</h3>}
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

export default AlertDialog
