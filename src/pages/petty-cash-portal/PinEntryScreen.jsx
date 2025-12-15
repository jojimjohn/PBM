/**
 * PIN Entry Screen
 *
 * Large number pad for PIN entry, optimized for mobile touch interfaces.
 * Displays remaining attempts on failure and handles account lockout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, AlertCircle, Loader2 } from 'lucide-react';
import './PettyCashPortal.css';

const PinEntryScreen = ({
  onSubmit,
  isLoading = false,
  error = null,
  remainingAttempts = null,
  companyName = '',
}) => {
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  const PIN_LENGTH = 4; // Minimum PIN length
  const MAX_PIN_LENGTH = 6;

  // Shake animation on error
  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // Handle number input
  const handleNumberPress = useCallback((num) => {
    if (pin.length < MAX_PIN_LENGTH) {
      setPin((prev) => prev + num);
    }
  }, [pin]);

  // Handle backspace
  const handleBackspace = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  // Handle submit
  const handleSubmit = useCallback(() => {
    if (pin.length >= PIN_LENGTH && !isLoading) {
      onSubmit(pin);
    }
  }, [pin, isLoading, onSubmit]);

  // Clear PIN on new attempt
  useEffect(() => {
    if (error) {
      setPin('');
    }
  }, [error]);

  // Auto-submit when PIN is long enough (optional UX enhancement)
  // Disabled for now to let users verify their PIN before submitting
  // useEffect(() => {
  //   if (pin.length === MAX_PIN_LENGTH) {
  //     handleSubmit();
  //   }
  // }, [pin, handleSubmit]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key >= '0' && e.key <= '9') {
        handleNumberPress(e.key);
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Enter' && pin.length >= PIN_LENGTH) {
        handleSubmit();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNumberPress, handleBackspace, handleSubmit, pin.length]);

  const isValidPin = pin.length >= PIN_LENGTH;

  return (
    <div className="pin-entry-screen">
      <div className="pin-entry-card">
        {/* Header */}
        <div className="pin-entry-header">
          <div className="pin-entry-icon">
            <Lock size={40} />
          </div>
          <h1 className="pin-entry-title">Enter PIN</h1>
          {companyName && (
            <p className="pin-entry-company">{companyName}</p>
          )}
        </div>

        {/* PIN Display */}
        <div className={`pin-display ${shake ? 'shake' : ''}`}>
          {Array.from({ length: MAX_PIN_LENGTH }).map((_, index) => (
            <div
              key={index}
              className={`pin-dot ${index < pin.length ? 'filled' : ''} ${index < PIN_LENGTH ? 'required' : ''}`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="pin-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Remaining Attempts Warning */}
        {remainingAttempts !== null && remainingAttempts <= 2 && (
          <div className="pin-warning">
            <AlertCircle size={16} />
            <span>
              {remainingAttempts === 0
                ? 'Account locked. Contact administrator.'
                : `${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining`}
            </span>
          </div>
        )}

        {/* Number Pad */}
        <div className="pin-numpad">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="numpad-btn"
              onClick={() => handleNumberPress(String(num))}
              disabled={isLoading || pin.length >= MAX_PIN_LENGTH}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            className="numpad-btn numpad-action"
            onClick={handleBackspace}
            disabled={isLoading || pin.length === 0}
          >
            <Delete size={24} />
          </button>
          <button
            type="button"
            className="numpad-btn"
            onClick={() => handleNumberPress('0')}
            disabled={isLoading || pin.length >= MAX_PIN_LENGTH}
          >
            0
          </button>
          <button
            type="button"
            className={`numpad-btn numpad-submit ${isValidPin ? 'active' : ''}`}
            onClick={handleSubmit}
            disabled={isLoading || !isValidPin}
          >
            {isLoading ? <Loader2 size={24} className="spinning" /> : 'OK'}
          </button>
        </div>

        {/* Help Text */}
        <p className="pin-help">
          Enter your 4-6 digit PIN to continue
        </p>
      </div>
    </div>
  );
};

export default PinEntryScreen;
