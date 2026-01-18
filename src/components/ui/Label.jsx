import React from 'react'
// CSS moved to global index.css Tailwind

const Label = React.forwardRef(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`label ${className}`}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }