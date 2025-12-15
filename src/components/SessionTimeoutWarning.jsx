/**
 * Session Timeout Warning Modal
 *
 * Displays a warning when the user's session is about to expire.
 * Provides options to extend the session or logout.
 */

import React, { useEffect, useState } from 'react';
import { Clock, LogOut, RefreshCw } from 'lucide-react';
import './SessionTimeoutWarning.css';

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
    </div>
  );
};

export default SessionTimeoutWarning;
