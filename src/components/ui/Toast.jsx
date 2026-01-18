import React from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { CheckCircle, AlertCircle, Info, AlertTriangle, X } from 'lucide-react';
// CSS moved to global index.css Tailwind

/**
 * Custom Toast Component
 *
 * Renders individual toast notifications with modern design
 */
const CustomToast = ({ t, type, message, title }) => {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="toast-icon toast-icon-success" />;
      case 'error':
        return <AlertCircle className="toast-icon toast-icon-error" />;
      case 'warning':
        return <AlertTriangle className="toast-icon toast-icon-warning" />;
      case 'info':
      default:
        return <Info className="toast-icon toast-icon-info" />;
    }
  };

  return (
    <div className={`custom-toast custom-toast-${type} ${t.visible ? 'custom-toast-enter' : 'custom-toast-exit'}`}>
      <div className="toast-icon-wrapper">
        {getIcon()}
      </div>
      <div className="toast-content">
        {title && <div className="toast-title">{title}</div>}
        <div className="toast-message">{message}</div>
      </div>
      <button
        className="toast-dismiss"
        onClick={() => toast.dismiss(t.id)}
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  );
};

/**
 * Toast Notification Provider
 *
 * Wrap your app with this component to enable toast notifications
 */
export const ToastProvider = ({ position = 'top-right', ...props }) => {
  return (
    <Toaster
      position={position}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          margin: 0,
        },
        success: {
          iconTheme: {
            primary: 'var(--success-600)',
            secondary: 'white',
          },
        },
        error: {
          iconTheme: {
            primary: 'var(--error-600)',
            secondary: 'white',
          },
        },
      }}
      {...props}
    />
  );
};

/**
 * Toast notification utilities
 */
export const showToast = {
  /**
   * Show success toast
   * @param {string} message - Toast message
   * @param {string} title - Optional title
   */
  success: (message, title = null) => {
    toast.custom((t) => (
      <CustomToast t={t} type="success" message={message} title={title} />
    ), {
      duration: 4000,
    });
  },

  /**
   * Show error toast
   * @param {string} message - Toast message
   * @param {string} title - Optional title
   */
  error: (message, title = null) => {
    toast.custom((t) => (
      <CustomToast t={t} type="error" message={message} title={title} />
    ), {
      duration: 5000,
    });
  },

  /**
   * Show warning toast
   * @param {string} message - Toast message
   * @param {string} title - Optional title
   */
  warning: (message, title = null) => {
    toast.custom((t) => (
      <CustomToast t={t} type="warning" message={message} title={title} />
    ), {
      duration: 4500,
    });
  },

  /**
   * Show info toast
   * @param {string} message - Toast message
   * @param {string} title - Optional title
   */
  info: (message, title = null) => {
    toast.custom((t) => (
      <CustomToast t={t} type="info" message={message} title={title} />
    ), {
      duration: 4000,
    });
  },

  /**
   * Show loading toast
   * @param {string} message - Loading message
   */
  loading: (message) => {
    return toast.loading(message, {
      style: {
        background: 'white',
        color: 'var(--gray-800)',
        padding: '12px 16px',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-lg)',
      },
    });
  },

  /**
   * Show promise toast (auto-updates based on promise state)
   * @param {Promise} promise - Promise to track
   * @param {object} messages - Messages for loading, success, error states
   */
  promise: (promise, messages) => {
    return toast.promise(
      promise,
      {
        loading: messages.loading || 'Loading...',
        success: messages.success || 'Success!',
        error: messages.error || 'Error occurred',
      },
      {
        style: {
          background: 'white',
          color: 'var(--gray-800)',
          padding: '12px 16px',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
        },
      }
    );
  },

  /**
   * Dismiss specific toast
   * @param {string} toastId - Toast ID to dismiss
   */
  dismiss: (toastId) => {
    toast.dismiss(toastId);
  },

  /**
   * Dismiss all toasts
   */
  dismissAll: () => {
    toast.dismiss();
  },
};

export default showToast;
