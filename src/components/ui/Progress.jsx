import React from 'react';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import './Progress.css';

/**
 * Progress Bar Component
 *
 * Linear progress indicator
 *
 * @param {number} value - Progress value (0-100)
 * @param {number} max - Maximum value (default: 100)
 * @param {'primary'|'success'|'warning'|'error'} variant - Color variant
 * @param {string} label - Optional label text
 * @param {boolean} showValue - Show percentage value
 * @param {'sm'|'md'|'lg'} size - Bar height
 * @param {string} className - Additional CSS classes
 */
export const ProgressBar = ({
  value = 0,
  max = 100,
  variant = 'primary',
  label = null,
  showValue = false,
  size = 'md',
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={`progress-bar-container ${className}`}>
      {(label || showValue) && (
        <div className="progress-bar-header">
          {label && <span className="progress-bar-label">{label}</span>}
          {showValue && <span className="progress-bar-value">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div className={`progress-bar-track progress-bar-${size}`} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
        <motion.div
          className={`progress-bar-fill progress-bar-fill-${variant}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
};

/**
 * Circular Progress Component
 *
 * Circular/radial progress indicator
 *
 * @param {number} value - Progress value (0-100)
 * @param {number} max - Maximum value (default: 100)
 * @param {'primary'|'success'|'warning'|'error'} variant - Color variant
 * @param {'sm'|'md'|'lg'|'xl'} size - Circle size
 * @param {boolean} showValue - Show percentage in center
 * @param {number} strokeWidth - Stroke thickness
 * @param {string} className - Additional CSS classes
 */
export const CircularProgress = ({
  value = 0,
  max = 100,
  variant = 'primary',
  size = 'md',
  showValue = true,
  strokeWidth = 8,
  className = '',
}) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizeMap = {
    sm: 40,
    md: 60,
    lg: 80,
    xl: 120,
  };

  const circleSize = sizeMap[size];
  const radius = (circleSize - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={`circular-progress circular-progress-${size} ${className}`}>
      <svg width={circleSize} height={circleSize} className="circular-progress-svg">
        {/* Background circle */}
        <circle
          className="circular-progress-bg"
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <motion.circle
          className={`circular-progress-fill circular-progress-fill-${variant}`}
          cx={circleSize / 2}
          cy={circleSize / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </svg>
      {showValue && (
        <div className="circular-progress-value">
          {Math.round(percentage)}%
        </div>
      )}
    </div>
  );
};

/**
 * Spinner Component
 *
 * Indeterminate loading spinner
 *
 * @param {'sm'|'md'|'lg'} size - Spinner size
 * @param {'primary'|'white'|'gray'} variant - Color variant
 * @param {string} className - Additional CSS classes
 */
export const Spinner = ({
  size = 'md',
  variant = 'primary',
  className = '',
}) => {
  const sizeMap = {
    sm: 16,
    md: 24,
    lg: 32,
  };

  return (
    <Loader2
      className={`spinner spinner-${variant} ${className}`}
      size={sizeMap[size]}
    />
  );
};

/**
 * Skeleton Component
 *
 * Placeholder loading state for content
 *
 * @param {'text'|'circle'|'rect'} variant - Skeleton shape
 * @param {string} width - Width (CSS value)
 * @param {string} height - Height (CSS value)
 * @param {string} className - Additional CSS classes
 */
export const Skeleton = ({
  variant = 'rect',
  width = '100%',
  height = variant === 'text' ? '1em' : '100%',
  className = '',
}) => {
  return (
    <div
      className={`skeleton skeleton-${variant} ${className}`}
      style={{ width, height }}
      aria-live="polite"
      aria-busy="true"
    />
  );
};

/**
 * SkeletonText Component
 *
 * Multi-line text skeleton
 *
 * @param {number} lines - Number of lines
 * @param {string} className - Additional CSS classes
 */
export const SkeletonText = ({
  lines = 3,
  className = '',
}) => {
  return (
    <div className={`skeleton-text ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          width={i === lines - 1 ? '80%' : '100%'}
        />
      ))}
    </div>
  );
};

/**
 * SkeletonCard Component
 *
 * Card-style skeleton for loading states
 */
export const SkeletonCard = ({ className = '' }) => {
  return (
    <div className={`skeleton-card ${className}`}>
      <Skeleton variant="rect" height="200px" className="skeleton-card-image" />
      <div className="skeleton-card-body">
        <Skeleton variant="text" width="60%" height="24px" />
        <SkeletonText lines={2} />
      </div>
    </div>
  );
};

export default {
  Bar: ProgressBar,
  Circular: CircularProgress,
  Spinner,
  Skeleton,
  SkeletonText,
  SkeletonCard,
};
