import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalVariants, backdropVariants } from '../../config/animations';
import { useTourBroadcast } from '../../context/TourContext';
import './Modal.css';

/**
 * Enhanced Modal Component
 *
 * Accessible modal dialog with Framer Motion animations, focus management,
 * and flexible content areas.
 *
 * @param {boolean} isOpen - Whether modal is visible
 * @param {function} onClose - Callback when modal is closed
 * @param {string} title - Modal title
 * @param {string} description - Optional description/subtitle
 * @param {React.ReactNode} children - Modal body content
 * @param {React.ReactNode} footer - Optional footer content
 * @param {'sm'|'md'|'lg'|'xl'|'xxl'|'full'} size - Modal size
 * @param {boolean} closeOnOverlayClick - Close when clicking backdrop (default: true)
 * @param {boolean} closeOnEsc - Close when pressing ESC key (default: true)
 * @param {boolean} showCloseButton - Show X button in header (default: true)
 * @param {boolean} preventScroll - Prevent body scroll when open (default: true)
 * @param {string} className - Additional CSS classes
 * @param {string} tourId - Optional ID for product tour context detection
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
  closeOnOverlayClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  preventScroll = true,
  className = '',
  tourId = null,
}) => {
  const modalRef = useRef(null);
  const previousFocusRef = useRef(null);
  const { broadcast } = useTourBroadcast();

  // Broadcast modal state to tour context
  useEffect(() => {
    if (tourId) {
      if (isOpen) {
        broadcast({ currentModal: tourId, modalProps: { title } });
      } else {
        broadcast({ currentModal: null, modalProps: {} });
      }
    }
  }, [isOpen, tourId, title, broadcast]);

  // Handle ESC key press
  useEffect(() => {
    if (!isOpen || !closeOnEsc) return;

    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeOnEsc, onClose]);

  // Focus management
  useEffect(() => {
    if (isOpen) {
      // Save currently focused element
      previousFocusRef.current = document.activeElement;

      // Focus modal
      setTimeout(() => {
        modalRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when modal closes
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return;

    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    };
  }, [isOpen, preventScroll]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="modal-overlay"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
            style={{
              position: 'fixed',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {/* Modal Container */}
            <motion.div
              ref={modalRef}
              className={`modal-container modal-${size} ${className}`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby={title ? 'modal-title' : undefined}
              aria-describedby={description ? 'modal-description' : undefined}
              tabIndex={-1}
              style={{
                position: 'relative',
                margin: 'auto',
              }}
            >
              {/* Header */}
              {(title || showCloseButton) && (
                <div className="modal-header">
                  <div className="modal-header-content">
                    {title && (
                      <h2 id="modal-title" className="modal-title">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id="modal-description" className="modal-description">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      className="modal-close-btn"
                      onClick={onClose}
                      aria-label="Close modal"
                      type="button"
                    >
                      <X className="modal-close-icon" />
                    </button>
                  )}
                </div>
              )}

              {/* Body */}
              <div className="modal-body">{children}</div>

              {/* Footer */}
              {footer && <div className="modal-footer">{footer}</div>}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );

  // Render in portal
  return createPortal(modalContent, document.body);
};

/**
 * Modal Header Component
 *
 * For custom header layouts within Modal body
 */
export const ModalHeader = ({ children, className = '' }) => (
  <div className={`modal-custom-header ${className}`}>{children}</div>
);

/**
 * Modal Footer Component
 *
 * For custom footer layouts within Modal body
 */
export const ModalFooter = ({ children, className = '' }) => (
  <div className={`modal-custom-footer ${className}`}>{children}</div>
);

/**
 * Modal Title Component
 *
 * For custom title styling
 */
export const ModalTitle = ({ children, className = '' }) => (
  <h3 className={`modal-custom-title ${className}`}>{children}</h3>
);

export { Modal };
export default Modal;
