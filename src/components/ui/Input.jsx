import React from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
import './Input.css'

/**
 * Enhanced Input Component
 *
 * Form input with validation states, icons, helper text, and labels
 *
 * @param {string} label - Input label
 * @param {string} helperText - Helper text below input
 * @param {string} error - Error message (sets error state)
 * @param {boolean} success - Success state
 * @param {React.ReactNode} leftIcon - Icon on the left side
 * @param {React.ReactNode} rightIcon - Icon on the right side
 * @param {'small'|'medium'|'large'} size - Input size
 * @param {boolean} fullWidth - Take full width of container
 * @param {boolean} required - Required field indicator
 * @param {string} className - Additional CSS classes
 */
const Input = React.forwardRef(({
  className = '',
  type = 'text',
  label,
  helperText,
  error,
  success = false,
  leftIcon,
  rightIcon,
  size = 'medium',
  fullWidth = true,
  required = false,
  id,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = React.useState(false)
  const [isFocused, setIsFocused] = React.useState(false)

  const inputId = id || React.useId()
  const isPassword = type === 'password'
  const hasError = !!error
  const inputType = isPassword && showPassword ? 'text' : type

  // Determine which validation icon to show
  const validationIcon = hasError ? (
    <AlertCircle className="input-validation-icon input-error-icon" />
  ) : success ? (
    <CheckCircle className="input-validation-icon input-success-icon" />
  ) : null

  // Password toggle icon
  const passwordToggle = isPassword ? (
    <button
      type="button"
      className="input-password-toggle"
      onClick={() => setShowPassword(!showPassword)}
      tabIndex={-1}
      aria-label={showPassword ? 'Hide password' : 'Show password'}
    >
      {showPassword ? (
        <EyeOff className="input-icon" />
      ) : (
        <Eye className="input-icon" />
      )}
    </button>
  ) : null

  // Combine right icon with validation icon and password toggle
  const combinedRightIcon = validationIcon || passwordToggle || rightIcon

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      <div
        className={`input-container input-container-${size} ${isFocused ? 'input-container-focused' : ''} ${hasError ? 'input-container-error' : ''} ${success ? 'input-container-success' : ''}`}
      >
        {leftIcon && (
          <div className="input-icon-wrapper input-icon-left">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          type={inputType}
          className={`input input-${size} ${leftIcon ? 'input-with-left-icon' : ''} ${combinedRightIcon ? 'input-with-right-icon' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={hasError}
          aria-describedby={helperText || error ? `${inputId}-helper` : undefined}
          {...props}
        />

        {combinedRightIcon && (
          <div className="input-icon-wrapper input-icon-right">
            {combinedRightIcon}
          </div>
        )}
      </div>

      {(helperText || error) && (
        <div
          id={`${inputId}-helper`}
          className={`input-helper ${hasError ? 'input-helper-error' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  )
})

Input.displayName = "Input"

/**
 * Textarea Component
 *
 * Multi-line text input
 */
export const Textarea = React.forwardRef(({
  className = '',
  label,
  helperText,
  error,
  success = false,
  fullWidth = true,
  required = false,
  id,
  rows = 4,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = React.useState(false)
  const inputId = id || React.useId()
  const hasError = !!error

  return (
    <div className={`input-wrapper ${fullWidth ? 'input-wrapper-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input-label">
          {label}
          {required && <span className="input-required">*</span>}
        </label>
      )}

      <div
        className={`textarea-container ${isFocused ? 'textarea-container-focused' : ''} ${hasError ? 'textarea-container-error' : ''} ${success ? 'textarea-container-success' : ''}`}
      >
        <textarea
          id={inputId}
          ref={ref}
          rows={rows}
          className="textarea"
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={hasError}
          aria-describedby={helperText || error ? `${inputId}-helper` : undefined}
          {...props}
        />
      </div>

      {(helperText || error) && (
        <div
          id={`${inputId}-helper`}
          className={`input-helper ${hasError ? 'input-helper-error' : ''}`}
        >
          {error || helperText}
        </div>
      )}
    </div>
  )
})

Textarea.displayName = "Textarea"

export { Input }
export default Input