import React, { useState, useRef, useEffect, forwardRef } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Check, ChevronDown, Loader } from 'lucide-react'
// CSS moved to global index.css Tailwind

/**
 * Autocomplete Component
 *
 * Searchable select with async support and multi-select capability
 *
 * @param {string} label - Field label
 * @param {Array} options - Array of options: [{ value, label, ...customProps }]
 * @param {any|Array} value - Selected value(s)
 * @param {Function} onChange - Change handler (value) => void
 * @param {string} placeholder - Placeholder text
 * @param {boolean} multiple - Enable multi-select
 * @param {boolean} searchable - Enable search filtering
 * @param {Function} onSearch - Async search handler (query) => Promise<options>
 * @param {boolean} loading - Loading state for async options
 * @param {boolean} disabled - Disable the select
 * @param {boolean} readOnly - Make select read-only
 * @param {string} error - Error message
 * @param {string} helperText - Helper text
 * @param {boolean} required - Required field indicator
 * @param {string} size - Input size: 'small' | 'medium' | 'large'
 * @param {Function} renderOption - Custom option renderer (option) => ReactNode
 * @param {Function} getOptionLabel - Get label from option (option) => string
 * @param {Function} getOptionValue - Get value from option (option) => any
 * @param {string} noOptionsMessage - Message when no options available
 * @param {string} loadingMessage - Message during loading
 * @param {number} debounceMs - Debounce delay for search (default: 300ms)
 * @param {string} className - Additional CSS classes
 */
const Autocomplete = forwardRef(({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  multiple = false,
  searchable = true,
  onSearch,
  loading = false,
  disabled = false,
  readOnly = false,
  error,
  helperText,
  required = false,
  size = 'medium',
  renderOption,
  getOptionLabel = (option) => option?.label || '',
  getOptionValue = (option) => option?.value,
  noOptionsMessage = 'No options found',
  loadingMessage = 'Loading...',
  debounceMs = 300,
  className = '',
  ...props
}, ref) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredOptions, setFilteredOptions] = useState(options)
  const [focusedIndex, setFocusedIndex] = useState(-1)
  const [isSearching, setIsSearching] = useState(false)
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0, width: 0 })

  const containerRef = useRef(null)
  const inputRef = useRef(null)
  const listRef = useRef(null)
  const debounceTimer = useRef(null)

  // Get selected option(s)
  const getSelectedOptions = () => {
    if (multiple) {
      return Array.isArray(value)
        ? options.filter(opt => value.includes(getOptionValue(opt)))
        : []
    }
    return options.find(opt => getOptionValue(opt) === value) || null
  }

  const selectedOptions = getSelectedOptions()

  // Filter options based on search query
  useEffect(() => {
    if (!searchable || !searchQuery) {
      setFilteredOptions(options)
      return
    }

    // If async search is provided, use it
    if (onSearch) {
      setIsSearching(true)

      // Clear previous debounce timer
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }

      // Debounce the search
      debounceTimer.current = setTimeout(async () => {
        try {
          const results = await onSearch(searchQuery)
          setFilteredOptions(results || [])
        } catch (err) {
          console.error('Autocomplete search error:', err)
          setFilteredOptions([])
        } finally {
          setIsSearching(false)
        }
      }, debounceMs)
    } else {
      // Client-side filtering
      const filtered = options.filter(option => {
        const label = getOptionLabel(option).toLowerCase()
        return label.includes(searchQuery.toLowerCase())
      })
      setFilteredOptions(filtered)
    }

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current)
      }
    }
  }, [searchQuery, options, searchable, onSearch])

  // Calculate dropdown position
  useEffect(() => {
    const updatePosition = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setDropdownPosition({
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width
        })
      }
    }

    if (isOpen) {
      updatePosition()

      // Update position on scroll/resize
      window.addEventListener('scroll', updatePosition, true)
      window.addEventListener('resize', updatePosition)

      return () => {
        window.removeEventListener('scroll', updatePosition, true)
        window.removeEventListener('resize', updatePosition)
      }
    }
  }, [isOpen])

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideControl = containerRef.current && containerRef.current.contains(event.target)
      const clickedInsideDropdown = listRef.current && listRef.current.contains(event.target)

      if (!clickedInsideControl && !clickedInsideDropdown) {
        setIsOpen(false)
        setSearchQuery('')
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (disabled || readOnly) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        if (!isOpen) {
          setIsOpen(true)
        } else {
          setFocusedIndex(prev =>
            prev < filteredOptions.length - 1 ? prev + 1 : prev
          )
        }
        break

      case 'ArrowUp':
        e.preventDefault()
        if (isOpen) {
          setFocusedIndex(prev => prev > 0 ? prev - 1 : prev)
        }
        break

      case 'Enter':
        e.preventDefault()
        if (isOpen && focusedIndex >= 0) {
          handleSelectOption(filteredOptions[focusedIndex])
        } else {
          setIsOpen(!isOpen)
        }
        break

      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setSearchQuery('')
        break

      case 'Tab':
        setIsOpen(false)
        break

      default:
        break
    }
  }

  // Scroll focused option into view
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const focusedElement = listRef.current.children[focusedIndex]
      if (focusedElement) {
        focusedElement.scrollIntoView({ block: 'nearest' })
      }
    }
  }, [focusedIndex])

  // Handle option selection
  const handleSelectOption = (option) => {
    if (multiple) {
      const optionValue = getOptionValue(option)
      const currentValues = Array.isArray(value) ? value : []
      const isSelected = currentValues.includes(optionValue)

      const newValues = isSelected
        ? currentValues.filter(v => v !== optionValue)
        : [...currentValues, optionValue]

      onChange(newValues)
    } else {
      onChange(getOptionValue(option))
      setIsOpen(false)
      setSearchQuery('')
    }
  }

  // Handle remove selected (for multi-select)
  const handleRemoveOption = (optionToRemove, e) => {
    e.stopPropagation()
    const currentValues = Array.isArray(value) ? value : []
    const newValues = currentValues.filter(v => v !== getOptionValue(optionToRemove))
    onChange(newValues)
  }

  // Handle clear all
  const handleClear = (e) => {
    e.stopPropagation()
    onChange(multiple ? [] : null)
    setSearchQuery('')
  }

  // Check if option is selected
  const isOptionSelected = (option) => {
    if (multiple) {
      return Array.isArray(value) && value.includes(getOptionValue(option))
    }
    return getOptionValue(option) === value
  }

  const hasError = !!error
  const isDisabled = disabled || readOnly
  const hasValue = multiple ? Array.isArray(value) && value.length > 0 : value != null

  const sizeClasses = {
    small: 'autocomplete-input-small',
    medium: 'autocomplete-input-medium',
    large: 'autocomplete-input-large'
  }

  return (
    <div
      ref={containerRef}
      className={`autocomplete-wrapper ${className}`}
      {...props}
    >
      {label && (
        <label className="autocomplete-label">
          {label}
          {required && <span className="required-indicator">*</span>}
        </label>
      )}

      <div
        ref={ref}
        className={`
          autocomplete-control
          ${sizeClasses[size]}
          ${hasError ? 'autocomplete-control-error' : ''}
          ${isDisabled ? 'autocomplete-control-disabled' : ''}
          ${isOpen ? 'autocomplete-control-open' : ''}
        `}
        onClick={() => !isDisabled && setIsOpen(!isOpen)}
        onKeyDown={handleKeyDown}
        tabIndex={isDisabled ? -1 : 0}
      >
        <div className="autocomplete-value-container">
          {/* Multi-select chips */}
          {multiple && hasValue && (
            <div className="autocomplete-chips">
              {selectedOptions.map((option, index) => (
                <span key={index} className="autocomplete-chip">
                  {getOptionLabel(option)}
                  {!isDisabled && (
                    <button
                      type="button"
                      className="autocomplete-chip-remove"
                      onClick={(e) => handleRemoveOption(option, e)}
                    >
                      <X size={14} />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}

          {/* Search input or selected value */}
          {searchable && isOpen ? (
            <input
              ref={inputRef}
              type="text"
              className="autocomplete-search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={hasValue && !multiple ? getOptionLabel(selectedOptions) : placeholder}
              disabled={isDisabled}
              autoFocus
            />
          ) : (
            <div className="autocomplete-placeholder">
              {!multiple && hasValue
                ? getOptionLabel(selectedOptions)
                : (!multiple && placeholder) || (multiple && !hasValue && placeholder)
              }
            </div>
          )}
        </div>

        <div className="autocomplete-indicators">
          {(loading || isSearching) && (
            <Loader className="autocomplete-spinner" size={18} />
          )}

          {hasValue && !isDisabled && (
            <button
              type="button"
              className="autocomplete-clear-btn"
              onClick={handleClear}
            >
              <X size={18} />
            </button>
          )}

          <div className="autocomplete-dropdown-indicator">
            <ChevronDown size={18} />
          </div>
        </div>
      </div>

      {/* Dropdown Menu - Rendered using Portal */}
      {isOpen && createPortal(
        <AnimatePresence>
          <motion.div
            className="autocomplete-menu"
            style={{
              position: 'absolute',
              top: `${dropdownPosition.top}px`,
              left: `${dropdownPosition.left}px`,
              width: `${dropdownPosition.width}px`
            }}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            <ul ref={listRef} className="autocomplete-options">
              {(loading || isSearching) ? (
                <li className="autocomplete-message">{loadingMessage}</li>
              ) : filteredOptions.length === 0 ? (
                <li className="autocomplete-message">{noOptionsMessage}</li>
              ) : (
                filteredOptions.map((option, index) => {
                  const isSelected = isOptionSelected(option)
                  const isFocused = index === focusedIndex

                  return (
                    <li
                      key={index}
                      className={`
                        autocomplete-option
                        ${isSelected ? 'autocomplete-option-selected' : ''}
                        ${isFocused ? 'autocomplete-option-focused' : ''}
                      `}
                      onClick={() => handleSelectOption(option)}
                      onMouseEnter={() => setFocusedIndex(index)}
                    >
                      {renderOption ? (
                        renderOption(option)
                      ) : (
                        <>
                          <span className="autocomplete-option-label">
                            {getOptionLabel(option)}
                          </span>
                          {isSelected && (
                            <Check className="autocomplete-option-check" size={18} />
                          )}
                        </>
                      )}
                    </li>
                  )
                })
              )}
            </ul>
          </motion.div>
        </AnimatePresence>,
        document.body
      )}

      {/* Error & Helper Text */}
      <AnimatePresence>
        {error && (
          <motion.p
            className="autocomplete-error-text"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {helperText && !error && (
        <p className="autocomplete-helper-text">{helperText}</p>
      )}
    </div>
  )
})

Autocomplete.displayName = 'Autocomplete'

export default Autocomplete
