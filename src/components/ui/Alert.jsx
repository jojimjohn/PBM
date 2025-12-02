import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';
import { fadeUpVariants } from '../../config/animations';
import './Alert.css';

/**
 * Alert Component
 *
 * Modern notification banner with multiple variants, icons, and dismissible functionality.
 * Supports modern dashboard aesthetic with clean design and smooth animations.
 *
 * @param {object} props
 * @param {'success'|'error'|'warning'|'info'} props.variant - Alert type
 * @param {string} props.title - Alert title
 * @param {string|React.ReactNode} props.description - Alert description/message
 * @param {boolean} props.dismissible - Whether alert can be dismissed
 * @param {function} props.onDismiss - Callback when alert is dismissed
 * @param {React.ReactNode} props.icon - Custom icon (overrides default)
 * @param {React.ReactNode} props.action - Optional action button/link
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.compact - Compact mode (smaller padding)
 */
const Alert = ({
  variant = 'info',
  title,
  description,
  dismissible = false,
  onDismiss,
  icon: customIcon,
  action,
  className = '',
  compact = false,
}) => {
  const [isVisible, setIsVisible] = React.useState(true);

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(() => {
      onDismiss?.();
    }, 200); // Wait for exit animation
  };

  const getDefaultIcon = () => {
    switch (variant) {
      case 'success':
        return <CheckCircle className="alert-icon" />;
      case 'error':
        return <AlertCircle className="alert-icon" />;
      case 'warning':
        return <AlertTriangle className="alert-icon" />;
      case 'info':
      default:
        return <Info className="alert-icon" />;
    }
  };

  const icon = customIcon || getDefaultIcon();

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`alert alert-${variant} ${compact ? 'alert-compact' : ''} ${className}`}
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          role="alert"
          aria-live="polite"
        >
          <div className="alert-icon-wrapper">
            {icon}
          </div>

          <div className="alert-content">
            {title && <div className="alert-title">{title}</div>}
            {description && <div className="alert-description">{description}</div>}
            {action && <div className="alert-action">{action}</div>}
          </div>

          {dismissible && (
            <button
              className="alert-dismiss"
              onClick={handleDismiss}
              aria-label="Dismiss alert"
            >
              <X size={18} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Alert;
