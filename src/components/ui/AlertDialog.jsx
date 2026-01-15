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
import './AlertDialog.css'

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
 * Icon color class mapping for each variant
 */
const VARIANT_ICON_CLASSES = {
  success: 'alert-dialog-icon-success',
  error: 'alert-dialog-icon-error',
  warning: 'alert-dialog-icon-warning',
  info: 'alert-dialog-icon-info'
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
    <div className="alert-dialog-actions">
      <button
        ref={buttonRef}
        type="button"
        className="btn btn-primary"
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
      <div className="alert-dialog-content">
        {showIcon && (
          <motion.div
            className={`alert-dialog-icon ${iconClass}`}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, damping: 20 }}
          >
            <Icon size={28} />
          </motion.div>
        )}
        <div className="alert-dialog-text">
          {title && <h3 className="alert-dialog-title">{title}</h3>}
          {message && (
            <div className="alert-dialog-message">
              {typeof message === 'string' ? <p>{message}</p> : message}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}

export default AlertDialog
