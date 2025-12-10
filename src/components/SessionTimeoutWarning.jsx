/**
 * Session Timeout Warning Modal
 *
 * Displays a warning when the user's session is about to expire.
 * Provides options to extend the session or logout.
 */

import React, { useEffect, useState } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';

const SessionTimeoutWarning = ({
  show,
  remainingMinutes,
  onExtend,
  onLogout,
  isExtending,
}) => {
  const [countdown, setCountdown] = useState(remainingMinutes * 60);

  // Update countdown every second when warning is shown
  useEffect(() => {
    if (!show) {
      setCountdown(remainingMinutes * 60);
      return;
    }

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          // Auto logout when countdown reaches 0
          if (onLogout) onLogout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [show, remainingMinutes, onLogout]);

  // Format countdown as MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (!show) return null;

  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <div className="session-timeout-icon">
          <Clock size={48} className="clock-icon" />
        </div>

        <h2 className="session-timeout-title">Session Expiring Soon</h2>

        <p className="session-timeout-message">
          Your session will expire in{' '}
          <span className="countdown">{formatTime(countdown)}</span>
        </p>

        <p className="session-timeout-submessage">
          Would you like to stay logged in?
        </p>

        <div className="session-timeout-actions">
          <button
            className="btn btn-primary extend-btn"
            onClick={onExtend}
            disabled={isExtending}
          >
            {isExtending ? (
              <>
                <RefreshCw size={18} className="spinning" />
                Extending...
              </>
            ) : (
              <>
                <RefreshCw size={18} />
                Stay Logged In
              </>
            )}
          </button>

          <button
            className="btn btn-secondary logout-btn"
            onClick={onLogout}
          >
            <LogOut size={18} />
            Logout Now
          </button>
        </div>
      </div>

      <style jsx>{`
        .session-timeout-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          backdrop-filter: blur(4px);
        }

        .session-timeout-modal {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 400px;
          width: 90%;
          text-align: center;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: slideIn 0.3s ease-out;
        }

        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .session-timeout-icon {
          margin-bottom: 20px;
        }

        .clock-icon {
          color: #f59e0b;
          animation: pulse 1s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .session-timeout-title {
          font-size: 1.5rem;
          font-weight: 600;
          color: #1f2937;
          margin: 0 0 16px 0;
        }

        .session-timeout-message {
          font-size: 1rem;
          color: #4b5563;
          margin: 0 0 8px 0;
        }

        .countdown {
          font-size: 1.5rem;
          font-weight: 700;
          color: #dc2626;
          font-family: monospace;
        }

        .session-timeout-submessage {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0 0 24px 0;
        }

        .session-timeout-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: #2563eb;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1d4ed8;
        }

        .btn-primary:disabled {
          background: #93c5fd;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f3f4f6;
          color: #374151;
        }

        .btn-secondary:hover {
          background: #e5e7eb;
        }

        .spinning {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* RTL Support */
        [dir="rtl"] .session-timeout-actions {
          flex-direction: column;
        }

        /* Dark mode support */
        @media (prefers-color-scheme: dark) {
          .session-timeout-modal {
            background: #1f2937;
          }

          .session-timeout-title {
            color: #f9fafb;
          }

          .session-timeout-message {
            color: #d1d5db;
          }

          .session-timeout-submessage {
            color: #9ca3af;
          }

          .btn-secondary {
            background: #374151;
            color: #f9fafb;
          }

          .btn-secondary:hover {
            background: #4b5563;
          }
        }
      `}</style>
    </div>
  );
};

export default SessionTimeoutWarning;
