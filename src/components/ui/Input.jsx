import React from 'react'
import { AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'
// CSS moved to global index.css Tailwind

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

  // Size mapping to Tailwind classes
  const sizeClasses = {
    small: 'h-8 text-xs',
    medium: 'h-10 text-sm',
    large: 'h-12 text-base'
  }

  // State classes using Tailwind
  const getContainerStateClasses = () => {
    if (hasError) return 'border-red-500 focus-within:ring-red-500/20 focus-within:border-red-500'
    if (success) return 'border-green-500 focus-within:ring-green-500/20 focus-within:border-green-500'
    return 'border-slate-200 hover:border-slate-300 focus-within:border-blue-500 focus-within:ring-blue-500/20'
  }

  return (
    <div className={`form-group-tw ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label-tw">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={`input-container relative flex items-center w-full bg-white border rounded transition-all focus-within:ring-2 ${sizeClasses[size]} ${getContainerStateClasses()}`}
      >
        {leftIcon && (
          <div className="input-icon-wrapper input-icon-left absolute flex items-center justify-center w-10 h-full text-slate-500 pointer-events-none">
            {leftIcon}
          </div>
        )}

        <input
          id={inputId}
          ref={ref}
          type={inputType}
          className={`flex-1 w-full px-3 py-2 bg-transparent border-none outline-none text-slate-800 placeholder:text-slate-400 disabled:opacity-60 disabled:cursor-not-allowed disabled:bg-slate-50 ${leftIcon ? 'pl-10' : ''} ${combinedRightIcon ? 'pr-10' : ''}`}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          aria-invalid={hasError}
          aria-describedby={helperText || error ? `${inputId}-helper` : undefined}
          {...props}
        />

        {combinedRightIcon && (
          <div className="input-icon-wrapper input-icon-right absolute right-0 flex items-center justify-center w-10 h-full text-slate-500 pointer-events-none">
            {combinedRightIcon}
          </div>
        )}
      </div>

      {(helperText || error) && (
        <div
          id={`${inputId}-helper`}
          className={hasError ? 'form-error-tw' : 'form-hint-tw'}
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
  const inputId = id || React.useId()
  const hasError = !!error

  // State classes using Tailwind
  const getStateClasses = () => {
    if (hasError) return 'border-red-500 focus:ring-red-500/20 focus:border-red-500'
    if (success) return 'border-green-500 focus:ring-green-500/20 focus:border-green-500'
    return 'border-slate-200 hover:border-slate-300 focus:border-blue-500 focus:ring-blue-500/20'
  }

  return (
    <div className={`form-group-tw ${fullWidth ? 'w-full' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="form-label-tw">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <textarea
        id={inputId}
        ref={ref}
        rows={rows}
        className={`form-input-tw resize-y min-h-[80px] ${getStateClasses()}`}
        aria-invalid={hasError}
        aria-describedby={helperText || error ? `${inputId}-helper` : undefined}
        {...props}
      />

      {(helperText || error) && (
        <div
          id={`${inputId}-helper`}
          className={hasError ? 'form-error-tw' : 'form-hint-tw'}
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