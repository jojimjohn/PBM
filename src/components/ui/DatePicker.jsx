import React, { forwardRef, useState } from 'react'
import ReactDatePicker from 'react-datepicker'
import { Calendar, Clock, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import 'react-datepicker/dist/react-datepicker.css'
import './DatePicker.css'

/**
 * DatePicker Component
 *
 * Modern date and time picker with range selection support
 *
 * @param {string} label - Field label
 * @param {Date|null} value - Selected date value
 * @param {Function} onChange - Change handler (date) => void
 * @param {string} placeholder - Placeholder text
 * @param {boolean} showTimeSelect - Enable time picker
 * @param {boolean} showTimeSelectOnly - Show only time picker
 * @param {string} timeFormat - Time format (12h/24h)
 * @param {string} dateFormat - Date format string
 * @param {Date} minDate - Minimum selectable date
 * @param {Date} maxDate - Maximum selectable date
 * @param {boolean} selectsRange - Enable date range selection
 * @param {Date|null} startDate - Range start date
 * @param {Date|null} endDate - Range end date
 * @param {boolean} inline - Display calendar inline (always visible)
 * @param {boolean} isClearable - Show clear button
 * @param {boolean} disabled - Disable the picker
 * @param {boolean} readOnly - Make picker read-only
 * @param {string} error - Error message
 * @param {string} helperText - Helper text
 * @param {boolean} required - Required field indicator
 * @param {string} size - Input size: 'small' | 'medium' | 'large'
 * @param {string} className - Additional CSS classes
 */
const DatePicker = forwardRef(({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  showTimeSelect = false,
  showTimeSelectOnly = false,
  timeFormat = '12h',
  dateFormat,
  minDate,
  maxDate,
  selectsRange = false,
  startDate,
  endDate,
  inline = false,
  isClearable = false,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  required = false,
  size = 'medium',
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)

  // Determine date format based on picker type
  const getDateFormat = () => {
    if (dateFormat) return dateFormat
    if (showTimeSelectOnly) return timeFormat === '24h' ? 'HH:mm' : 'h:mm aa'
    if (showTimeSelect) return timeFormat === '24h' ? 'dd/MM/yyyy HH:mm' : 'dd/MM/yyyy h:mm aa'
    return 'dd/MM/yyyy'
  }

  // Custom input component
  const CustomInput = forwardRef(({ value, onClick, onChange }, ref) => {
    const hasError = !!error
    const isDisabled = disabled || readOnly

    const sizeClasses = {
      small: 'datepicker-input-small',
      medium: 'datepicker-input-medium',
      large: 'datepicker-input-large'
    }

    return (
      <div className={`datepicker-wrapper ${className}`}>
        {label && (
          <label className="datepicker-label">
            {label}
            {required && <span className="required-indicator">*</span>}
          </label>
        )}

        <div className="datepicker-input-container">
          <div
            ref={ref}
            className={`
              datepicker-input
              ${sizeClasses[size]}
              ${hasError ? 'datepicker-input-error' : ''}
              ${isDisabled ? 'datepicker-input-disabled' : ''}
              ${value ? 'datepicker-input-filled' : ''}
            `}
            onClick={!isDisabled ? onClick : undefined}
          >
            <div className="datepicker-icon">
              {showTimeSelectOnly ? (
                <Clock size={18} />
              ) : (
                <Calendar size={18} />
              )}
            </div>

            <input
              type="text"
              value={value || ''}
              onChange={onChange}
              placeholder={placeholder}
              readOnly
              disabled={isDisabled}
              className="datepicker-text-input"
            />

            {isClearable && value && !isDisabled && (
              <button
                type="button"
                className="datepicker-clear-btn"
                onClick={(e) => {
                  e.stopPropagation()
                  onChange({ target: { value: null } })
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              className="datepicker-error-text"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.15 }}
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {helperText && !error && (
          <p className="datepicker-helper-text">{helperText}</p>
        )}
      </div>
    )
  })

  CustomInput.displayName = 'CustomInput'

  return (
    <ReactDatePicker
      ref={ref}
      selected={value}
      onChange={onChange}
      startDate={startDate}
      endDate={endDate}
      selectsRange={selectsRange}
      showTimeSelect={showTimeSelect}
      showTimeSelectOnly={showTimeSelectOnly}
      timeFormat={timeFormat === '24h' ? 'HH:mm' : 'h:mm aa'}
      timeIntervals={15}
      dateFormat={getDateFormat()}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      readOnly={readOnly}
      inline={inline}
      isClearable={isClearable}
      customInput={<CustomInput />}
      calendarClassName="datepicker-calendar"
      popperClassName="datepicker-popper"
      onCalendarOpen={() => setIsOpen(true)}
      onCalendarClose={() => setIsOpen(false)}
      {...props}
    />
  )
})

DatePicker.displayName = 'DatePicker'

export default DatePicker
