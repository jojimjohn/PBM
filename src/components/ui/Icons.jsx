// Comprehensive Icon System using Lucide React
import React from 'react'
import * as LucideIcons from 'lucide-react'

// Re-export all Lucide icons for convenience
export * from 'lucide-react'

// Custom wrapper for consistent icon styling
export const Icon = ({ name, size = 20, color = 'currentColor', className = '', ...props }) => {
  const IconComponent = LucideIcons[name]
  
  if (!IconComponent) {
    console.warn(`Icon "${name}" not found`)
    return null
  }
  
  return (
    <IconComponent 
      size={size} 
      color={color} 
      className={`icon ${className}`} 
      {...props} 
    />
  )
}

// Legacy icon mapping for backward compatibility
export const Icons = {
  user: LucideIcons.User,
  lock: LucideIcons.Lock,
  mail: LucideIcons.Mail,
  building: LucideIcons.Building2,
  droplets: LucideIcons.Droplets,
  recycle: LucideIcons.Recycle,
  dashboard: LucideIcons.LayoutDashboard,
  settings: LucideIcons.Settings,
  refresh: LucideIcons.RefreshCw,
  logout: LucideIcons.LogOut,
  loader: LucideIcons.Loader2,
  bell: LucideIcons.Bell,
  chevronDown: LucideIcons.ChevronDown,
  users: LucideIcons.Users,
  package: LucideIcons.Package,
  dollarSign: LucideIcons.DollarSign,
  shoppingCart: LucideIcons.ShoppingCart,
  userPlus: LucideIcons.UserPlus,
}

// Business-specific custom icons
export const OilDropIcon = ({ size = 24, color = 'currentColor', className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
  </svg>
)

export const ScrapMetalIcon = ({ size = 24, color = 'currentColor', className = '', ...props }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke={color}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    <path d="M9 11l3 3L22 4" />
    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
  </svg>
)