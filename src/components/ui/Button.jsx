import React from 'react'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { buttonTapVariants } from '../../config/animations'
// CSS moved to global index.css Tailwind

/**
 * Enhanced Button Component
 *
 * Modern button with Framer Motion animations, multiple variants, and loading states.
 *
 * @param {string} variant - Button style variant
 *   - 'primary', 'secondary', 'outline', 'ghost', 'link'
 *   - 'success', 'warning', 'danger'
 *   - 'alramrami', 'pridemuscat' (company-specific)
 * @param {string} size - Button size: 'small', 'medium', 'large', 'icon'
 * @param {React.ReactNode} icon - Icon element to display
 * @param {string} iconPosition - Icon position: 'left' or 'right'
 * @param {boolean} loading - Show loading spinner
 * @param {boolean} disabled - Disable button
 * @param {boolean} fullWidth - Take full width of container
 * @param {boolean} iconOnly - Icon-only button (no text, square shape)
 * @param {boolean} animate - Enable Framer Motion animations (default: true)
 * @param {string} className - Additional CSS classes
 */
const Button = React.forwardRef(({
  className = '',
  variant = 'primary',
  size = 'medium',
  icon,
  iconPosition = 'left',
  loading = false,
  disabled = false,
  fullWidth = false,
  iconOnly = false,
  animate = true,
  children,
  ...props
}, ref) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    fullWidth && 'btn-full-width',
    iconOnly && 'btn-icon-only',
    loading && 'btn-loading',
    className
  ].filter(Boolean).join(' ')

  const isDisabled = disabled || loading

  const buttonContent = (
    <>
      {loading && (
        <span className="btn-spinner">
          <Loader2 className="btn-spinner-icon" />
        </span>
      )}
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn-icon btn-icon-left">{icon}</span>
      )}
      {!iconOnly && <span className="btn-content">{children}</span>}
      {iconOnly && !loading && icon && (
        <span className="btn-icon">{icon}</span>
      )}
      {icon && iconPosition === 'right' && !loading && !iconOnly && (
        <span className="btn-icon btn-icon-right">{icon}</span>
      )}
    </>
  )

  // Use Framer Motion for animations if enabled
  if (animate && !isDisabled) {
    return (
      <motion.button
        className={classes}
        disabled={isDisabled}
        ref={ref}
        variants={buttonTapVariants}
        whileTap="tap"
        {...props}
      >
        {buttonContent}
      </motion.button>
    )
  }

  // Regular button without animations
  return (
    <button
      className={classes}
      disabled={isDisabled}
      ref={ref}
      {...props}
    >
      {buttonContent}
    </button>
  )
})

Button.displayName = "Button"

export { Button }
export default Button