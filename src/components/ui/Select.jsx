import React from 'react'
// CSS moved to global index.css Tailwind

const Select = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <select
    className={`form-input-tw h-10 cursor-pointer ${className}`}
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
    className={`bg-white text-slate-800 p-2 ${className}`}
    {...props}
  />
))
SelectOption.displayName = "SelectOption"

export { Select, SelectOption }