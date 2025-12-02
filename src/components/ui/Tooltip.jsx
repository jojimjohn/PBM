import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import './Tooltip.css';

/**
 * Tooltip Provider Component
 *
 * Wrap your app or component tree with this to enable tooltips
 */
export const TooltipProvider = TooltipPrimitive.Provider;

/**
 * Tooltip Root Component
 */
export const Tooltip = TooltipPrimitive.Root;

/**
 * Tooltip Trigger Component
 */
export const TooltipTrigger = TooltipPrimitive.Trigger;

/**
 * Tooltip Content Component
 *
 * The tooltip content with smart positioning
 *
 * @param {React.ReactNode} children - Tooltip content
 * @param {'top'|'right'|'bottom'|'left'} side - Preferred side to show tooltip
 * @param {number} sideOffset - Offset from trigger (default: 4)
 * @param {string} className - Additional CSS classes
 */
export const TooltipContent = React.forwardRef(
  ({ className = '', sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={`tooltip-content ${className}`}
        {...props}
      />
    </TooltipPrimitive.Portal>
  )
);
TooltipContent.displayName = 'TooltipContent';

/**
 * Simple Tooltip Component
 *
 * A convenient wrapper for common tooltip use cases
 *
 * @param {React.ReactNode} children - Element to trigger tooltip
 * @param {string|React.ReactNode} content - Tooltip content
 * @param {'top'|'right'|'bottom'|'left'} side - Tooltip position
 * @param {number} delayDuration - Delay before showing (ms)
 * @param {boolean} disabled - Disable tooltip
 */
export const SimpleTooltip = ({
  children,
  content,
  side = 'top',
  delayDuration = 200,
  disabled = false,
  ...props
}) => {
  if (disabled || !content) {
    return children;
  }

  return (
    <Tooltip delayDuration={delayDuration}>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent side={side} {...props}>
        {content}
      </TooltipContent>
    </Tooltip>
  );
};

/**
 * Example Usage:
 *
 * // Simple usage
 * <TooltipProvider>
 *   <SimpleTooltip content="This is a tooltip">
 *     <button>Hover me</button>
 *   </SimpleTooltip>
 * </TooltipProvider>
 *
 * // Advanced usage
 * <TooltipProvider>
 *   <Tooltip>
 *     <TooltipTrigger asChild>
 *       <button>Hover me</button>
 *     </TooltipTrigger>
 *     <TooltipContent side="right">
 *       <div>Custom content</div>
 *     </TooltipContent>
 *   </Tooltip>
 * </TooltipProvider>
 */

export default {
  Provider: TooltipProvider,
  Root: Tooltip,
  Trigger: TooltipTrigger,
  Content: TooltipContent,
  Simple: SimpleTooltip,
};
