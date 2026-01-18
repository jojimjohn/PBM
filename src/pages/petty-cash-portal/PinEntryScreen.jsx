/**
 * PIN Entry Screen
 *
 * Large number pad for PIN entry, optimized for mobile touch interfaces.
 * Displays remaining attempts on failure and handles account lockout.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Lock, Delete, AlertCircle, Loader2 } from 'lucide-react';
// CSS moved to global index.css - using Tailwind classes

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
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-slate-100 to-slate-200">
      <div className="w-full max-w-xs bg-white shadow-xl p-6 space-y-6">
        {/* Header */}
        <div className="text-center space-y-3">
          <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
            PETTY CASH
          </h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-widest">Employee Portal</p>
          <div className="w-14 h-14 mx-auto flex items-center justify-center bg-blue-600 text-white rounded-full mt-4">
            <Lock size={28} />
          </div>
          <p className="text-lg font-semibold text-slate-700">Enter PIN</p>
          {companyName && (
            <p className="text-xs text-slate-400">{companyName}</p>
          )}
        </div>

        {/* PIN Display */}
        <div className={`flex items-center justify-center gap-3 py-4 ${shake ? 'animate-[shake_0.5s_ease-in-out]' : ''}`}>
          {Array.from({ length: MAX_PIN_LENGTH }).map((_, index) => (
            <div
              key={index}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-150
                ${index < pin.length
                  ? 'bg-blue-600 border-blue-600 scale-110'
                  : index < PIN_LENGTH
                    ? 'border-slate-400'
                    : 'border-slate-200'
                }`}
            />
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-700 text-sm">
            <AlertCircle size={18} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Remaining Attempts Warning */}
        {remainingAttempts !== null && remainingAttempts <= 2 && (
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 text-amber-700 text-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>
              {remainingAttempts === 0
                ? 'Account locked. Contact administrator.'
                : `${remainingAttempts} attempt${remainingAttempts > 1 ? 's' : ''} remaining`}
            </span>
          </div>
        )}

        {/* Number Pad - Mobile-first grid */}
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
            <button
              key={num}
              type="button"
              className="aspect-square text-2xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => handleNumberPress(String(num))}
              disabled={isLoading || pin.length >= MAX_PIN_LENGTH}
            >
              {num}
            </button>
          ))}
          {/* Bottom row */}
          <button
            type="button"
            className="aspect-square flex items-center justify-center text-slate-500 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={handleBackspace}
            disabled={isLoading || pin.length === 0}
          >
            <Delete size={24} />
          </button>
          <button
            type="button"
            className="aspect-square text-2xl font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            onClick={() => handleNumberPress('0')}
            disabled={isLoading || pin.length >= MAX_PIN_LENGTH}
          >
            0
          </button>
          <button
            type="button"
            className={`aspect-square flex items-center justify-center text-lg font-bold transition-all active:scale-95
              ${isValidPin
                ? 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
              }`}
            onClick={handleSubmit}
            disabled={isLoading || !isValidPin}
          >
            {isLoading ? <Loader2 size={24} className="animate-spin" /> : 'OK'}
          </button>
        </div>

        {/* Help Text */}
        <p className="text-center text-xs text-slate-400">
          Enter your 4-6 digit PIN to continue
        </p>
      </div>
    </div>
  );
};

export default PinEntryScreen;
