/**
 * DateInput Component
 *
 * An enhanced date input that allows users to type dates directly
 * or use a calendar picker. Supports multiple date formats based on
 * user's system settings.
 *
 * Features:
 * - Type dates in DD/MM/YYYY, MM/DD/YYYY, YYYY-MM-DD, or DD-MM-YYYY formats
 * - Display format respects user's SystemSettings dateFormat preference
 * - Calendar picker for visual date selection
 * - Real-time format validation
 * - minDate/maxDate constraints
 * - RTL support for Arabic locale
 * - Consistent styling with design system
 */

import React, { useState, useRef, useEffect } from 'react';
import { Calendar, AlertCircle, X } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import {
  parseDate,
  formatDateForDisplay,
  formatDateForAPI,
  isDateInRange
} from '../../utils/dateParser';
// CSS moved to global index.css Tailwind

const DateInput = React.forwardRef(({
  value,
  onChange,
  label,
  placeholder,
  required = false,
  disabled = false,
  error,
  helperText,
  minDate,
  maxDate,
  showCalendar = true,
  isClearable = false,
  size = 'medium',
  className = '',
  id,
  name,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  const { t, currentLanguage } = useLocalization();
  const { settings } = useSystemSettings();
  const isRTL = currentLanguage === 'ar';

  // Get display format from system settings (default: DD/MM/YYYY)
  const displayFormat = settings?.dateFormat || 'DD/MM/YYYY';

  // Internal state for text input
  const [inputValue, setInputValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [validationError, setValidationError] = useState('');

  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const nativeDateRef = useRef(null);
  const inputId = id || `date-input-${Math.random().toString(36).substr(2, 9)}`;

  // Format for native date picker (always ISO)
  const getNativeDateValue = () => {
    if (!value) return '';
    const parsed = parseDate(value);
    return parsed ? formatDateForAPI(parsed) : '';
  };

  // Sync input value with external value
  useEffect(() => {
    if (!isFocused) {
      if (value) {
        const parsed = parseDate(value);
        setInputValue(parsed ? formatDateForDisplay(parsed, displayFormat) : '');
        setValidationError('');
      } else {
        setInputValue('');
        setValidationError('');
      }
    }
  }, [value, isFocused, displayFormat]);

  // Handle text input change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Clear validation error while typing
    if (validationError) {
      setValidationError('');
    }
  };

  // Validate and emit on blur
  const handleInputBlur = (e) => {
    setIsFocused(false);

    if (!inputValue.trim()) {
      onChange?.(null);
      setValidationError('');
    } else {
      const parsed = parseDate(inputValue);

      if (!parsed) {
        setValidationError(t('invalidDateFormat', 'Invalid date format. Use {{format}}', { format: displayFormat }));
      } else if (minDate || maxDate) {
        if (!isDateInRange(parsed, minDate, maxDate)) {
          const minParsed = minDate ? parseDate(minDate) : null;
          const maxParsed = maxDate ? parseDate(maxDate) : null;

          if (minParsed && parsed < minParsed) {
            setValidationError(t('dateBeforeMin', 'Date must be after {{date}}', {
              date: formatDateForDisplay(minParsed, displayFormat)
            }));
          } else if (maxParsed && parsed > maxParsed) {
            setValidationError(t('dateAfterMax', 'Date must be before {{date}}', {
              date: formatDateForDisplay(maxParsed, displayFormat)
            }));
          }
        } else {
          setValidationError('');
          setInputValue(formatDateForDisplay(parsed, displayFormat));
          onChange?.(formatDateForAPI(parsed));
        }
      } else {
        setValidationError('');
        setInputValue(formatDateForDisplay(parsed, displayFormat));
        onChange?.(formatDateForAPI(parsed));
      }
    }

    onBlur?.(e);
  };

  const handleInputFocus = (e) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  // Handle native date picker change
  const handleNativeDateChange = (e) => {
    const isoDate = e.target.value;
    if (isoDate) {
      const parsed = parseDate(isoDate);
      if (parsed) {
        setInputValue(formatDateForDisplay(parsed, displayFormat));
        setValidationError('');
        onChange?.(isoDate);
      }
    } else {
      setInputValue('');
      setValidationError('');
      onChange?.(null);
    }
  };

  // Handle clear button
  const handleClear = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setInputValue('');
    setValidationError('');
    onChange?.(null);
    inputRef.current?.focus();
  };

  // Determine effective error message
  const displayError = error || validationError;
  const hasError = !!displayError;

  // Size classes
  const sizeClasses = {
    small: 'date-input-small',
    medium: 'date-input-medium',
    large: 'date-input-large'
  };

  return (
    <div
      ref={containerRef}
      className={`date-input-wrapper ${className} ${isRTL ? 'rtl' : ''}`}
    >
      {label && (
        <label htmlFor={inputId} className="date-input-label">
          {label}
          {required && <span className="date-input-required">*</span>}
        </label>
      )}

      <div
        className={`
          date-input-container
          ${sizeClasses[size]}
          ${isFocused ? 'date-input-focused' : ''}
          ${hasError ? 'date-input-error' : ''}
          ${disabled ? 'date-input-disabled' : ''}
        `}
      >
        {/* Left calendar icon (decorative) */}
        <div className="date-input-icon-left">
          <Calendar size={18} />
        </div>

        {/* Text input for manual typing */}
        <input
          ref={(el) => {
            inputRef.current = el;
            if (typeof ref === 'function') ref(el);
            else if (ref) ref.current = el;
          }}
          id={inputId}
          name={name}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          onFocus={handleInputFocus}
          placeholder={placeholder || displayFormat}
          disabled={disabled}
          className="date-input-text"
          autoComplete="off"
          aria-invalid={hasError}
          aria-describedby={displayError ? `${inputId}-error` : helperText ? `${inputId}-helper` : undefined}
          {...props}
        />

        {/* Right side actions */}
        <div className="date-input-actions">
          {/* Clear button */}
          {isClearable && inputValue && !disabled && (
            <button
              type="button"
              className="date-input-clear-btn"
              onClick={handleClear}
              tabIndex={-1}
              aria-label={t('clearDate', 'Clear date')}
            >
              <X size={16} />
            </button>
          )}

          {/* Native date picker - visible calendar button */}
          {showCalendar && !disabled && (
            <div className="date-input-picker-container">
              <button
                type="button"
                className="date-input-calendar-btn"
                onClick={() => {
                  const input = nativeDateRef.current;
                  if (input) {
                    if (typeof input.showPicker === 'function') {
                      try {
                        input.showPicker();
                      } catch (e) {
                        // Fallback for browsers that don't support showPicker
                        input.click();
                      }
                    } else {
                      input.click();
                    }
                  }
                }}
                tabIndex={-1}
                aria-label={t('openCalendar', 'Open calendar')}
              >
                <Calendar size={18} />
              </button>
              <input
                ref={nativeDateRef}
                type="date"
                className="date-input-native"
                value={getNativeDateValue()}
                onChange={handleNativeDateChange}
                min={minDate ? formatDateForAPI(parseDate(minDate)) : undefined}
                max={maxDate ? formatDateForAPI(parseDate(maxDate)) : undefined}
                disabled={disabled}
                tabIndex={-1}
                aria-hidden="true"
              />
            </div>
          )}
        </div>

        {/* Error icon */}
        {hasError && (
          <div className="date-input-error-icon">
            <AlertCircle size={16} />
          </div>
        )}
      </div>

      {/* Error message */}
      {displayError && (
        <div id={`${inputId}-error`} className="date-input-error-text">
          {displayError}
        </div>
      )}

      {/* Helper text */}
      {helperText && !displayError && (
        <div id={`${inputId}-helper`} className="date-input-helper">
          {helperText}
        </div>
      )}
    </div>
  );
});

DateInput.displayName = 'DateInput';

export default DateInput;
