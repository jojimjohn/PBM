import React from 'react'
import './Label.css'

const Label = React.forwardRef(({ className = '', ...props }, ref) => (
  <label
    ref={ref}
    className={`label ${className}`}
    {...props}
  />
))
Label.displayName = "Label"

export { Label }