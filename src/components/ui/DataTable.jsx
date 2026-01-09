import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react'
import {
  ChevronUp,
  ChevronDown,
  Search,
  Filter,
  Download,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  MoreHorizontal,
  Calendar,
  FileSpreadsheet,
  FileText,
  Printer,
  X
} from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
import { useSystemSettings } from '../../context/SystemSettingsContext'
import './DataTable.css'

// Helper function to access nested properties
const getNestedProperty = (obj, path) => {
  return path.split('.').reduce((current, key) => current?.[key], obj)
}

// Export data to CSV
const exportToCSV = (data, columns, filename = 'export.csv') => {
  const headers = columns.filter(col => col.key !== 'actions').map(col => col.header)
  const rows = data.map(row => 
    columns
      .filter(col => col.key !== 'actions')
      .map(col => {
        const value = getNestedProperty(row, col.key)
        return typeof value === 'string' && value.includes(',') 
          ? `"${value}"` 
          : value || ''
      })
  )
  
  const csv = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n')
  
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

const DataTable = ({
  data = [],
  columns = [],
  title,
  subtitle,
  headerActions = null,
  customFilters = null, // Custom filter elements to render next to search
  searchable = true,
  filterable = true,
  sortable = true,
  paginated = true,
  exportable = false,
  selectable = false,
  actions = null,
  onRowClick = null,
  loading = false,
  emptyMessage,
  className = '',
  initialPageSize = 10,
  stickyHeader = false,
  enableColumnToggle = true,
  // Server-side pagination props
  serverSide = false,
  totalRows = 0,
  currentServerPage = 1,
  onPageChange = null,
  onSort = null,
  onSearch = null,
  onPageSizeChange = null
}) => {
  const { t, isRTL } = useLocalization()

  // Get system date formatting (with fallback for standalone use)
  let systemFormatDate = null
  try {
    const settings = useSystemSettings()
    systemFormatDate = settings?.formatDate
  } catch (e) {
    // Component used outside SystemSettingsProvider
  }

  // State management
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(initialPageSize)
  const [filters, setFilters] = useState({})
  const [advancedFilters, setAdvancedFilters] = useState({})
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedRows, setSelectedRows] = useState(new Set())
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col) => ({ ...acc, [col.key]: col.visible !== false }), {})
  )
  const [showColumnToggle, setShowColumnToggle] = useState(false)
  const [showMobileCards, setShowMobileCards] = useState(false)
  const tableRef = useRef(null)
  const searchDebounceRef = useRef(null)

  // Debounced search handler for server-side mode
  const handleSearchChange = useCallback((value) => {
    setSearchTerm(value)

    // SERVER-SIDE MODE: Debounce and call parent search callback
    if (serverSide && onSearch) {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current)
      }
      searchDebounceRef.current = setTimeout(() => {
        onSearch(value)
      }, 300) // 300ms debounce for server requests
    }
  }, [serverSide, onSearch])

  // Get visible columns
  const activeColumns = useMemo(() => {
    return columns.filter(col => visibleColumns[col.key])
  }, [columns, visibleColumns])

  // Filter and search data
  // In server-side mode, data is already filtered/searched by the server
  const filteredData = useMemo(() => {
    if (!data || !Array.isArray(data)) return []

    // SERVER-SIDE MODE: Skip client-side filtering - data already filtered by server
    if (serverSide) {
      return data
    }

    // CLIENT-SIDE MODE: Apply all filters locally
    let filtered = [...data]

    // Apply search
    if (searchTerm && searchable) {
      filtered = filtered.filter(row =>
        activeColumns.some(col => {
          const value = getNestedProperty(row, col.key)
          if (value == null) return false
          return String(value).toLowerCase().includes(searchTerm.toLowerCase())
        })
      )
    }

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== 'all') {
        filtered = filtered.filter(row => {
          const rowValue = getNestedProperty(row, key)
          if (Array.isArray(value)) {
            return value.includes(rowValue)
          }
          return String(rowValue).toLowerCase().includes(String(value).toLowerCase())
        })
      }
    })

    // Apply advanced filters - simplified version without debouncing
    if (advancedFilters && typeof advancedFilters === 'object') {
      try {
        Object.entries(advancedFilters).forEach(([key, filter]) => {
          if (filter && filter.enabled) {
            const column = columns.find(col => col.key === key)

            if (column?.type === 'date' && filter.dateRange) {
              filtered = filtered.filter(row => {
                const value = getNestedProperty(row, key)
                if (!value) return false
                const date = new Date(value)
                if (isNaN(date.getTime())) return false
                const from = filter.dateRange.from ? new Date(filter.dateRange.from) : null
                const to = filter.dateRange.to ? new Date(filter.dateRange.to) : null

                if (from && !isNaN(from.getTime()) && date < from) return false
                if (to && !isNaN(to.getTime()) && date > to) return false
                return true
              })
            }

            if ((column?.type === 'currency' || column?.type === 'number') && (filter.min !== undefined || filter.max !== undefined)) {
              filtered = filtered.filter(row => {
                const value = getNestedProperty(row, key)
                const num = parseFloat(value)
                if (isNaN(num)) return false
                if (filter.min !== undefined && num < filter.min) return false
                if (filter.max !== undefined && num > filter.max) return false
                return true
              })
            }

            if (filter.values && Array.isArray(filter.values) && filter.values.length > 0) {
              filtered = filtered.filter(row => {
                const value = getNestedProperty(row, key)
                return filter.values.includes(value)
              })
            }
          }
        })
      } catch (error) {
        console.warn('Error in advanced filters:', error)
        // Continue without advanced filters if there's an error
      }
    }

    return filtered
  }, [data, searchTerm, filters, advancedFilters, activeColumns, searchable, columns, serverSide])

  // Sort data
  // In server-side mode, data is already sorted by the server
  const sortedData = useMemo(() => {
    // SERVER-SIDE MODE: Skip client-side sorting - data already sorted by server
    if (serverSide) {
      return filteredData
    }

    // CLIENT-SIDE MODE: Sort locally
    if (!sortConfig.key || !sortable) return filteredData

    const sorted = [...filteredData].sort((a, b) => {
      const aValue = getNestedProperty(a, sortConfig.key)
      const bValue = getNestedProperty(b, sortConfig.key)

      if (aValue == null) return 1
      if (bValue == null) return -1

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue
      }

      const aStr = String(aValue).toLowerCase()
      const bStr = String(bValue).toLowerCase()

      if (sortConfig.direction === 'asc') {
        return aStr.localeCompare(bStr)
      }
      return bStr.localeCompare(aStr)
    })

    return sorted
  }, [filteredData, sortConfig, sortable, serverSide])

  // Paginate data
  // In server-side mode, data is already paginated by the server
  const paginatedData = useMemo(() => {
    if (!paginated) return sortedData

    // SERVER-SIDE MODE: Data is already paginated by server - use as-is
    if (serverSide) {
      return sortedData
    }

    // CLIENT-SIDE MODE: Slice locally
    const startIndex = (currentPage - 1) * pageSize
    return sortedData.slice(startIndex, startIndex + pageSize)
  }, [sortedData, currentPage, pageSize, paginated, serverSide])

  // Pagination calculations
  // In server-side mode, use totalRows from server; otherwise use local data length
  const effectiveTotalRows = serverSide ? totalRows : sortedData.length
  const effectiveCurrentPage = serverSide ? currentServerPage : currentPage
  const totalPages = Math.ceil(effectiveTotalRows / pageSize)
  const startRow = paginated ? (effectiveCurrentPage - 1) * pageSize + 1 : 1
  const endRow = paginated ? Math.min(effectiveCurrentPage * pageSize, effectiveTotalRows) : effectiveTotalRows

  // Handle sorting
  const handleSort = (key) => {
    if (!sortable) return

    const newDirection = sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'

    // SERVER-SIDE MODE: Call parent callback to trigger server-side sort
    if (serverSide && onSort) {
      onSort(key, newDirection)
    }

    // Always update local state (for UI indicators)
    setSortConfig({ key, direction: newDirection })
  }

  // Handle row selection
  const handleRowSelect = (rowId, checked) => {
    if (!selectable) return

    const newSelectedRows = new Set(selectedRows)
    if (checked) {
      newSelectedRows.add(rowId)
    } else {
      newSelectedRows.delete(rowId)
    }
    setSelectedRows(newSelectedRows)
  }

  // Handle select all
  const handleSelectAll = (checked) => {
    if (!selectable) return

    if (checked) {
      const allIds = paginatedData.map((row, index) => row.id || index)
      setSelectedRows(new Set(allIds))
    } else {
      setSelectedRows(new Set())
    }
  }

  // Reset pagination when data changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, filters, advancedFilters])

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setShowMobileCards(window.innerWidth < 640)
    }
    
    checkMobile()
    window.addEventListener('resize', checkMobile)
    
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!tableRef.current || e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return

      const navigateToPage = (page) => {
        if (serverSide && onPageChange) {
          onPageChange(page)
        } else {
          setCurrentPage(page)
        }
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (effectiveCurrentPage > 1) {
            navigateToPage(effectiveCurrentPage - 1)
          }
          break
        case 'ArrowRight':
          if (effectiveCurrentPage < totalPages) {
            navigateToPage(effectiveCurrentPage + 1)
          }
          break
        case 'Home':
          if (e.ctrlKey) {
            navigateToPage(1)
          }
          break
        case 'End':
          if (e.ctrlKey) {
            navigateToPage(totalPages)
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [effectiveCurrentPage, totalPages, serverSide, onPageChange])

  // Render cell content
  const renderCell = (row, column) => {
    const value = getNestedProperty(row, column.key)
    
    if (column.render) {
      return column.render(value, row)
    }

    if (column.type === 'currency') {
      return new Intl.NumberFormat('en-OM', {
        style: 'currency',
        currency: 'OMR',
        minimumFractionDigits: 3
      }).format(value || 0)
    }

    if (column.type === 'date') {
      if (!value) return '-'
      return systemFormatDate ? systemFormatDate(value) : new Date(value).toLocaleDateString()
    }

    if (column.type === 'status') {
      return (
        <span className={`status-badge ${String(value).toLowerCase()}`}>
          {value}
        </span>
      )
    }

    return value || '-'
  }

  // Get filter options for a column
  const getFilterOptions = (columnKey) => {
    if (!data || !Array.isArray(data)) return []
    const uniqueValues = [...new Set(data.map(row => {
      const value = getNestedProperty(row, columnKey)
      return value
    }).filter(value => value != null))]
    return uniqueValues.map(value => ({ value, label: String(value) }))
  }

  // Get column filter options
  // Supports custom filterOptions on column definition, falls back to auto-generated from data
  const columnFilterOptions = useMemo(() => {
    const options = {}
    activeColumns.forEach(col => {
      if (col.filterable !== false && col.key !== 'actions') {
        // Use custom filterOptions if provided on the column, otherwise auto-generate
        if (col.filterOptions && Array.isArray(col.filterOptions)) {
          options[col.key] = col.filterOptions
        } else {
          options[col.key] = getFilterOptions(col.key)
        }
      }
    })
    return options
  }, [data, activeColumns])


  // Skeleton loading component
  const SkeletonTable = () => (
    <div className="table-wrapper">
      <table className="data-table skeleton-table">
        <thead>
          <tr>
            {selectable && <th className="skeleton-header-cell select-header"></th>}
            {columns.map((col, index) => (
              <th key={col.key || index} className="skeleton-header-cell">
                <div className={`skeleton skeleton-header ${index % 3 === 0 ? 'skeleton-short' : index % 3 === 1 ? 'skeleton-medium' : ''}`}></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, rowIndex) => (
            <tr key={rowIndex} className="skeleton-row">
              {selectable && (
                <td className="skeleton-cell select-cell">
                  <div className="skeleton skeleton-icon"></div>
                </td>
              )}
              {columns.map((col, colIndex) => (
                <td key={col.key || colIndex} className="skeleton-cell">
                  {col.type === 'status' ? (
                    <div className="skeleton skeleton-badge"></div>
                  ) : (
                    <div className={`skeleton ${colIndex % 2 === 0 ? 'skeleton-short' : colIndex % 3 === 1 ? 'skeleton-medium' : 'skeleton-long'}`}></div>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  if (loading) {
    return (
      <div className={`data-table-container ${className || ''} ${isRTL ? 'rtl' : ''}`}>
        {/* Header */}
        {(title || subtitle) && (
          <div className="data-table-header">
            {title && <h2 className="data-table-title">{title}</h2>}
            {subtitle && <p className="data-table-subtitle">{subtitle}</p>}
          </div>
        )}

        {/* Skeleton loading */}
        <SkeletonTable />

        {/* Skeleton pagination */}
        {paginated && (
          <div className="data-table-pagination">
            <div className="pagination-info">
              <div className="skeleton" style={{ width: '150px', height: '14px' }}></div>
            </div>
            <div className="pagination-controls">
              {Array.from({ length: 7 }).map((_, i) => (
                <div key={i} className="skeleton" style={{ width: '32px', height: '32px', borderRadius: '4px' }}></div>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  // Early return if we don't have essential data
  if (!columns || !Array.isArray(columns) || columns.length === 0) {
    return (
      <div className="data-table-container">
        <div className="data-table-loading">
          <p>{t('noColumnsConfigured', 'No columns configured')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`data-table-container ${className || ''} ${isRTL ? 'rtl' : ''}`}>
      {/* Header */}
      {(title || subtitle || headerActions) && (
        <div className="data-table-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            {title && <h2 className="data-table-title">{title}</h2>}
            {subtitle && <p className="data-table-subtitle">{subtitle}</p>}
          </div>
          {headerActions && (
            <div className="data-table-header-actions">
              {headerActions}
            </div>
          )}
        </div>
      )}

      {/* Toolbar */}
      <div className="data-table-toolbar">
        <div className="toolbar-left">
          {/* Search */}
          {searchable && (
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={t('search')}
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="search-input"
              />
            </div>
          )}

          {/* Custom Filters (passed as prop) */}
          {customFilters && (
            <div className="custom-filters-container">
              {customFilters}
            </div>
          )}

          {/* Auto-generated Column Filters */}
          {filterable && activeColumns && activeColumns.some(col => col && col.filterable) && (
            <div className="filters-container">
              {activeColumns
                .filter(col => col && col.filterable)
                .map(col => col && (
                  <select
                    key={col.key}
                    value={filters[col.key] || 'all'}
                    onChange={(e) => setFilters(prev => ({ ...prev, [col.key]: e.target.value }))}
                    className="filter-select"
                  >
                    <option value="all">{t('all')} {col.header || col.key}</option>
                    {(columnFilterOptions[col.key] || []).map(option => option && (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ))}
            </div>
          )}
        </div>

        <div className="toolbar-right">
          {/* Column Toggle */}
          {enableColumnToggle && (
            <div className="column-toggle">
              <button
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={() => setShowColumnToggle(!showColumnToggle)}
                title={t('columns')}
              >
                <Eye size={16} />
              </button>
              {showColumnToggle && (
                <div className="column-toggle-dropdown">
                  {columns.map(col => (
                    <label key={col.key} className="column-toggle-item">
                      <input
                        type="checkbox"
                        checked={visibleColumns[col.key]}
                        onChange={(e) => setVisibleColumns(prev => ({
                          ...prev,
                          [col.key]: e.target.checked
                        }))}
                      />
                      {col.header}
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Advanced Filters */}
          {filterable && (
            <button
              className="btn btn-outline btn-sm btn-icon-only"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              title={t('advancedFilters')}
            >
              <Filter size={16} />
              {Object.values(advancedFilters).some(f => f.enabled) && (
                <span className="filter-count">
                  {Object.values(advancedFilters).filter(f => f.enabled).length}
                </span>
              )}
            </button>
          )}

          {/* Export */}
          {exportable && (
            <div className="export-buttons">
              <button
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={() => {
                  const filename = `${title || 'data'}_${new Date().toISOString().split('T')[0]}.csv`
                  exportToCSV(sortedData, activeColumns, filename)
                }}
                title={t('exportCSV') || 'Export to CSV'}
              >
                <FileSpreadsheet size={16} />
              </button>
              <button
                className="btn btn-outline btn-sm btn-icon-only"
                onClick={() => {
                  // Add print class to container for targeted print styles
                  if (tableRef.current) {
                    tableRef.current.closest('.data-table-container')?.classList.add('printing')
                  }
                  window.print()
                  // Remove class after print dialog closes
                  setTimeout(() => {
                    if (tableRef.current) {
                      tableRef.current.closest('.data-table-container')?.classList.remove('printing')
                    }
                  }, 100)
                }}
                title={t('print') || 'Print / Save as PDF'}
              >
                <Printer size={16} />
              </button>
            </div>
          )}

          {/* Actions */}
          {actions && selectedRows.size > 0 && (
            <div className="bulk-actions">
              {actions(Array.from(selectedRows))}
            </div>
          )}
        </div>
      </div>

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <>
          <div 
            className="advanced-filters-backdrop"
            onClick={() => setShowAdvancedFilters(false)}
          />
          <div className="advanced-filters-panel">
          <div className="filters-header">
            <h3>{t('advancedFilters')}</h3>
            <button 
              className="btn-icon"
              onClick={() => setShowAdvancedFilters(false)}
            >
              <X size={16} />
            </button>
          </div>
          <div className="filters-content">
            {activeColumns
              .filter(col => col.filterable !== false && col.key !== 'actions')
              .map(col => (
                <div key={col.key} className="filter-group">
                  <label>{col.header}</label>
                  {(col.type === 'date') ? (
                    <div className="date-range-filter">
                      <input
                        type="date"
                        placeholder={t('from')}
                        value={advancedFilters[col.key]?.dateRange?.from || ''}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          [col.key]: {
                            ...prev[col.key],
                            enabled: true,
                            dateRange: {
                              ...prev[col.key]?.dateRange,
                              from: e.target.value
                            }
                          }
                        }))}
                      />
                      <input
                        type="date"
                        placeholder={t('to')}
                        value={advancedFilters[col.key]?.dateRange?.to || ''}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          [col.key]: {
                            ...prev[col.key],
                            enabled: true,
                            dateRange: {
                              ...prev[col.key]?.dateRange,
                              to: e.target.value
                            }
                          }
                        }))}
                      />
                    </div>
                  ) : (col.type === 'currency' || col.type === 'number') ? (
                    <div className="number-range-filter">
                      <input
                        type="number"
                        placeholder={t('min')}
                        value={advancedFilters[col.key]?.min || ''}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          [col.key]: {
                            ...prev[col.key],
                            enabled: true,
                            min: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }))}
                      />
                      <input
                        type="number"
                        placeholder={t('max')}
                        value={advancedFilters[col.key]?.max || ''}
                        onChange={(e) => setAdvancedFilters(prev => ({
                          ...prev,
                          [col.key]: {
                            ...prev[col.key],
                            enabled: true,
                            max: e.target.value ? parseFloat(e.target.value) : undefined
                          }
                        }))}
                      />
                    </div>
                  ) : (
                    <select
                      multiple
                      value={advancedFilters[col.key]?.values || []}
                      onChange={(e) => {
                        const values = Array.from(e.target.selectedOptions, option => option.value)
                        setAdvancedFilters(prev => ({
                          ...prev,
                          [col.key]: {
                            enabled: values.length > 0,
                            values
                          }
                        }))
                      }}
                    >
                      {(columnFilterOptions[col.key] || []).map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  )}
                  {advancedFilters[col.key]?.enabled && (
                    <button
                      className="clear-filter"
                      onClick={() => setAdvancedFilters(prev => {
                        const newFilters = { ...prev }
                        delete newFilters[col.key]
                        return newFilters
                      })}
                    >
                      {t('clear')}
                    </button>
                  )}
                </div>
              ))}
          </div>
          <div className="filters-footer">
            <button 
              className="btn btn-outline"
              onClick={() => setAdvancedFilters({})}
            >
              {t('clearAll')}
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => setShowAdvancedFilters(false)}
            >
              {t('apply')}
            </button>
          </div>
        </div>
        </>
      )}

      {/* Mobile Card Layout */}
      {showMobileCards && paginatedData.length > 0 ? (
        <div className="data-table-mobile-cards">
          {paginatedData.map((row, index) => (
            <div 
              key={row.id || index} 
              className="mobile-data-card"
              onClick={() => onRowClick && onRowClick(row)}
            >
              <div className="mobile-card-header">
                <div className="mobile-card-title">
                  {columns[0] && renderCell(row, columns[0])}
                </div>
                <div className="mobile-card-actions">
                  {columns.find(col => col.key === 'actions') && 
                    renderCell(row, columns.find(col => col.key === 'actions'))
                  }
                </div>
              </div>
              <div className="mobile-card-body">
                {activeColumns
                  .filter((col, idx) => idx > 0 && col.key !== 'actions')
                  .slice(0, 4)
                  .map(col => (
                    <div key={col.key} className="mobile-card-field">
                      <div className="mobile-field-label">{col.header}</div>
                      <div className="mobile-field-value">{renderCell(row, col)}</div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Regular Table Layout */
        <div className={`table-wrapper ${stickyHeader ? 'sticky-header' : ''}`} ref={tableRef}>
        <table className="data-table">
          <thead>
            <tr>
              {selectable && (
                <th className="select-header">
                  <input
                    type="checkbox"
                    checked={selectedRows.size === paginatedData.length && paginatedData.length > 0}
                    indeterminate={selectedRows.size > 0 && selectedRows.size < paginatedData.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                  />
                </th>
              )}
              {activeColumns.map(column => (
                <th
                  key={column.key}
                  className={`${column.sortable !== false && sortable ? 'sortable' : ''} ${
                    column.align ? `text-${column.align}` : ''
                  }`}
                  style={{ width: column.width }}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                >
                  <div className="header-content">
                    <span>{column.header}</span>
                    {column.sortable !== false && sortable && (
                      <div className="sort-icons">
                        {sortConfig.key === column.key ? (
                          sortConfig.direction === 'asc' ? (
                            <ChevronUp size={14} className="sort-active" />
                          ) : (
                            <ChevronDown size={14} className="sort-active" />
                          )
                        ) : (
                          <div className="sort-inactive">
                            <ChevronUp size={12} />
                            <ChevronDown size={12} />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <tr
                  key={row.id || index}
                  className={`${onRowClick ? 'clickable' : ''} ${
                    selectedRows.has(row.id || index) ? 'selected' : ''
                  }`}
                  onClick={() => onRowClick && onRowClick(row)}
                >
                  {selectable && (
                    <td className="select-cell">
                      <input
                        type="checkbox"
                        checked={selectedRows.has(row.id || index)}
                        onChange={(e) => handleRowSelect(row.id || index, e.target.checked)}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </td>
                  )}
                  {activeColumns.map(column => (
                    <td
                      key={column.key}
                      className={column.align ? `text-${column.align}` : ''}
                    >
                      {renderCell(row, column)}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={activeColumns.length + (selectable ? 1 : 0)} className="empty-state">
                  <div className="empty-content">
                    <p>{emptyMessage || t('notFound')}</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {/* Pagination */}
      {paginated && effectiveTotalRows > 0 && (
        <div className="data-table-pagination">
          <div className="pagination-info">
            <span>
              {t('showing')} {startRow} {t('to')} {endRow} {t('of')} {effectiveTotalRows} {t('results')}
            </span>
            <select
              value={pageSize}
              onChange={(e) => {
                const newSize = Number(e.target.value)
                setPageSize(newSize)
                setCurrentPage(1)
                // SERVER-SIDE MODE: Notify parent of page size change
                if (serverSide && onPageSizeChange) {
                  onPageSizeChange(newSize)
                }
              }}
              className="page-size-select"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="pagination-controls">
            <button
              onClick={() => {
                if (serverSide && onPageChange) {
                  onPageChange(1)
                } else {
                  setCurrentPage(1)
                }
              }}
              disabled={effectiveCurrentPage === 1}
              className="pagination-btn"
              title={t('firstPage')}
            >
              <ChevronsLeft size={16} />
            </button>
            <button
              onClick={() => {
                const newPage = Math.max(1, effectiveCurrentPage - 1)
                if (serverSide && onPageChange) {
                  onPageChange(newPage)
                } else {
                  setCurrentPage(newPage)
                }
              }}
              disabled={effectiveCurrentPage === 1}
              className="pagination-btn"
              title={t('previousPage')}
            >
              <ChevronLeft size={16} />
            </button>

            <div className="page-numbers">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum
                if (totalPages <= 5) {
                  pageNum = i + 1
                } else if (effectiveCurrentPage <= 3) {
                  pageNum = i + 1
                } else if (effectiveCurrentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i
                } else {
                  pageNum = effectiveCurrentPage - 2 + i
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => {
                      if (serverSide && onPageChange) {
                        onPageChange(pageNum)
                      } else {
                        setCurrentPage(pageNum)
                      }
                    }}
                    className={`pagination-btn ${effectiveCurrentPage === pageNum ? 'active' : ''}`}
                  >
                    {pageNum}
                  </button>
                )
              })}
            </div>

            <button
              onClick={() => {
                const newPage = Math.min(totalPages, effectiveCurrentPage + 1)
                if (serverSide && onPageChange) {
                  onPageChange(newPage)
                } else {
                  setCurrentPage(newPage)
                }
              }}
              disabled={effectiveCurrentPage === totalPages}
              className="pagination-btn"
              title={t('nextPage')}
            >
              <ChevronRight size={16} />
            </button>
            <button
              onClick={() => {
                if (serverSide && onPageChange) {
                  onPageChange(totalPages)
                } else {
                  setCurrentPage(totalPages)
                }
              }}
              disabled={effectiveCurrentPage === totalPages}
              className="pagination-btn"
              title={t('lastPage')}
            >
              <ChevronsRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Wrap with React.memo to prevent unnecessary re-renders
// Only re-renders when props actually change
export default React.memo(DataTable)