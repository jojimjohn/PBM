import React from 'react'

const EXPIRY_THRESHOLDS = { CRITICAL: 7, WARNING: 30, NOTICE: 60 }

const getSeverity = (daysRemaining) => {
  if (daysRemaining === null || daysRemaining === undefined) return null
  if (daysRemaining <= 0) return 'expired'
  if (daysRemaining <= EXPIRY_THRESHOLDS.CRITICAL) return 'critical'
  if (daysRemaining <= EXPIRY_THRESHOLDS.WARNING) return 'warning'
  if (daysRemaining <= EXPIRY_THRESHOLDS.NOTICE) return 'notice'
  return 'valid'
}

const BADGE_STYLES = {
  expired: 'bg-red-600/20 text-red-400 border-red-500/30',
  critical: 'bg-red-500/15 text-red-400 border-red-500/25',
  warning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  notice: 'bg-blue-500/15 text-blue-400 border-blue-500/25',
  valid: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25'
}

const DocumentExpiryBadge = ({ expiryDate, daysRemaining: propDays }) => {
  let daysRemaining = propDays
  if (daysRemaining === undefined && expiryDate) {
    const now = new Date()
    const expiry = new Date(expiryDate)
    daysRemaining = Math.ceil((expiry - now) / (1000 * 60 * 60 * 24))
  }

  const severity = getSeverity(daysRemaining)
  if (!severity) return <span className="text-xs text-gray-500">No expiry</span>

  const label = severity === 'expired'
    ? 'Expired'
    : severity === 'valid'
      ? 'Valid'
      : `Expires in ${daysRemaining}d`

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium border rounded-full ${BADGE_STYLES[severity]}`}>
      {severity === 'expired' && (
        <svg className="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      )}
      {label}
    </span>
  )
}

export { EXPIRY_THRESHOLDS }
export default DocumentExpiryBadge
