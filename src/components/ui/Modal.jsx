import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { modalVariants, backdropVariants } from '../../config/animations';
import { useTourBroadcast } from '../../context/TourContext';
// CSS moved to global index.css Tailwind

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
 * @param {boolean} closeOnOverlayClick - Close when clicking backdrop (default: false - prevents accidental data loss)
 * @param {boolean} closeOnEsc - Close when pressing ESC key (default: false - prevents accidental data loss)
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
  closeOnOverlayClick = false,
  closeOnEsc = false,
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

  // Prevent body AND main-content-area scroll when modal is open
  useEffect(() => {
    if (!preventScroll) return;

    const mainContent = document.querySelector('.main-content-area');

    if (isOpen) {
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      // Also lock the main content area scroll
      if (mainContent) {
        mainContent.style.overflow = 'hidden';
      }
    } else {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (mainContent) {
        mainContent.style.overflow = '';
      }
    }

    return () => {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      if (mainContent) {
        mainContent.style.overflow = '';
      }
    };
  }, [isOpen, preventScroll]);

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  // Size mapping to Tailwind max-width classes
  const sizeClasses = {
    sm: 'max-w-sm',      // 400px
    md: 'max-w-xl',      // 600px
    lg: 'max-w-3xl',     // 800px
    xl: 'max-w-5xl',     // 1000px
    xxl: 'max-w-6xl',    // 1200px
    full: 'max-w-[95vw]' // 95% viewport
  };

  const modalContent = (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop - using Tailwind for core layout */}
          <motion.div
            className="modal-overlay-tw"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={handleOverlayClick}
          >
            {/* Modal Container - using Tailwind classes */}
            <motion.div
              ref={modalRef}
              className={`modal-content-tw ${sizeClasses[size] || sizeClasses.md} ${className}`}
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
            >
              {/* Header - using Tailwind classes */}
              {(title || showCloseButton) && (
                <div className="modal-header-tw">
                  <div className="flex-1 min-w-0">
                    {title && (
                      <h2 id="modal-title" className="modal-title-tw">
                        {title}
                      </h2>
                    )}
                    {description && (
                      <p id="modal-description" className="text-sm text-slate-500 mt-1">
                        {description}
                      </p>
                    )}
                  </div>
                  {showCloseButton && (
                    <button
                      className="modal-close-tw"
                      onClick={onClose}
                      aria-label="Close modal"
                      type="button"
                    >
                      <X size={20} />
                    </button>
                  )}
                </div>
              )}

              {/* Body - using Tailwind class */}
              <div className="modal-body-tw">{children}</div>

              {/* Footer - using Tailwind class */}
              {footer && <div className="modal-footer-tw">{footer}</div>}
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
