import React from 'react'
// CSS moved to global index.css Tailwind

function Badge({ className = '', variant = 'default', ...props }) {
  return (
    <div className={`badge badge-${variant} ${className}`} {...props} />
  )
}

export { Badge }