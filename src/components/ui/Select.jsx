import React from 'react'
import './Select.css'

const Select = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <select
    className={`select ${className}`}
    ref={ref}
    {...props}
  >
    {children}
  </select>
))
Select.displayName = "Select"

const SelectOption = React.forwardRef(({ className = '', ...props }, ref) => (
  <option
    ref={ref}
    className={`select-option ${className}`}
    {...props}
  />
))
SelectOption.displayName = "SelectOption"

export { Select, SelectOption }