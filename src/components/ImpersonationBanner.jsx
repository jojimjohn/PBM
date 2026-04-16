import React, { useState } from 'react'
import { UserCheck, LogOut, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import authService from '../services/authService'

/**
 * ImpersonationBanner
 *
 * Shown at the top of every page when a super admin is impersonating another
 * user. Provides a one-click exit to restore the original session.
 */
const ImpersonationBanner = () => {
  const { user, logout } = useAuth()
  const [exiting, setExiting] = useState(false)

  // Only show if actively impersonating
  if (!user?.impersonation?.active) return null

  const handleExit = async () => {
    setExiting(true)
    const result = await authService.stopImpersonating()
    if (result.success) {
      // Force a full page reload to ensure all state resets cleanly
      window.location.href = '/dashboard'
    } else {
      // Fallback: full logout
      await logout()
      window.location.href = '/'
    }
  }

  return (
    <div
      className="w-full flex items-center justify-between px-4 py-2 bg-amber-500 text-white shadow-md border-b-2 border-amber-600"
      style={{ zIndex: 60 }}
    >
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle size={16} />
        <UserCheck size={16} />
        <span className="font-semibold">
          Impersonating {user.firstName} {user.lastName} ({user.email})
        </span>
        {user.impersonation.impersonator_email && (
          <span className="text-xs opacity-75">
            · Logged in as {user.impersonation.impersonator_email}
          </span>
        )}
      </div>
      <button
        onClick={handleExit}
        disabled={exiting}
        className="flex items-center gap-1 px-3 py-1 rounded bg-white text-amber-700 text-xs font-bold hover:bg-amber-50 transition-colors disabled:opacity-50"
      >
        <LogOut size={12} />
        {exiting ? 'Exiting...' : 'Exit Impersonation'}
      </button>
    </div>
  )
}

export default ImpersonationBanner
