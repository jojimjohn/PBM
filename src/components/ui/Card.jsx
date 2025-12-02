import React from 'react'
import { motion } from 'framer-motion'
import { cn } from "../../lib/utils"
import { cardHoverVariants } from '../../config/animations'
import './Card.css'

/**
 * Enhanced Card Component
 *
 * Flexible card container with variants, hover effects, and animations
 *
 * @param {'default'|'outlined'|'elevated'|'interactive'|'gradient'} variant - Card style variant
 * @param {boolean} hoverable - Enable hover lift effect
 * @param {boolean} animate - Enable Framer Motion animations
 * @param {function} onClick - Click handler (makes card interactive)
 * @param {string} className - Additional CSS classes
 */
const Card = React.forwardRef(({
  className,
  variant = 'default',
  hoverable = false,
  animate = true,
  onClick,
  ...props
}, ref) => {
  const isInteractive = !!onClick || hoverable;

  const cardClasses = cn(
    "card",
    `card-${variant}`,
    isInteractive && "card-interactive",
    className
  );

  if (animate && isInteractive) {
    return (
      <motion.div
        ref={ref}
        className={cardClasses}
        variants={cardHoverVariants}
        initial="rest"
        whileHover="hover"
        whileTap={onClick ? "tap" : undefined}
        onClick={onClick}
        {...props}
      />
    );
  }

  return (
    <div
      ref={ref}
      className={cardClasses}
      onClick={onClick}
      {...props}
    />
  );
})
Card.displayName = "Card"

/**
 * Card Header Component
 *
 * Container for card title and description
 */
const CardHeader = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-header", className)}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

/**
 * Card Title Component
 *
 * Main card heading
 */
const CardTitle = React.forwardRef(({ className, as: Component = 'h3', ...props }, ref) => (
  <Component
    ref={ref}
    className={cn("card-title", className)}
    {...props}
  />
))
CardTitle.displayName = "CardTitle"

/**
 * Card Description Component
 *
 * Subtitle or description text
 */
const CardDescription = React.forwardRef(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("card-description", className)}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

/**
 * Card Content Component
 *
 * Main content area
 */
const CardContent = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-content", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

/**
 * Card Footer Component
 *
 * Footer area for actions or additional info
 */
const CardFooter = React.forwardRef(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("card-footer", className)}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }