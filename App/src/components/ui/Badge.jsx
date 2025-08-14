import React from 'react'
import './Badge.css'

function Badge({ className = '', variant = 'default', ...props }) {
  return (
    <div className={`badge badge-${variant} ${className}`} {...props} />
  )
}

export { Badge }