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
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 text-center animate-in fade-in zoom-in duration-200">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full">
          <Clock size={40} className="animate-pulse" />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-bold text-slate-800 mb-3">
          Session Expiring Soon
        </h2>

        {/* Countdown */}
        <p className="text-slate-600 mb-2">
          Your session will expire in{' '}
          <span className="inline-block px-3 py-1 bg-red-100 text-red-700 font-mono font-bold text-xl rounded-lg">
            {formatTime(countdown)}
          </span>
        </p>

        {/* Submessage */}
        <p className="text-slate-500 mb-6">
          Would you like to stay logged in?
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            onClick={onExtend}
            disabled={isExtending}
          >
            {isExtending ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
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
            className="inline-flex items-center justify-center gap-2 px-6 py-3 text-base font-semibold text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 focus:ring-4 focus:ring-slate-200 transition-all"
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
