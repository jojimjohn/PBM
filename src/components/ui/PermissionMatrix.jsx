/**
 * PermissionMatrix Component
 *
 * Displays permissions in a grid format grouped by module.
 * Supports both read-only view mode and editable mode for role management.
 *
 * Props:
 * - permissions: Array of module groups from API
 * - selectedPermissions: Array of selected permission keys
 * - onChange: Callback when permissions change (editable mode)
 * - readonly: Boolean to disable editing
 * - loading: Show loading skeleton
 * - compact: Use compact styling
 */

import React, { useState, useMemo } from 'react'
import {
  Check,
  ChevronDown,
  ChevronRight,
  Search,
  Users,
  Building,
  UserCheck,
  Truck,
  Package,
  ShoppingCart,
  ShoppingBag,
  FileText,
  ClipboardList,
  DollarSign,
  CreditCard,
  Receipt,
  Trash2,
  BarChart,
  Settings,
  FolderOpen,
  Minus,
  Square,
  CheckSquare
} from 'lucide-react'
import { useLocalization } from '../../context/LocalizationContext'
// CSS moved to global index.css Tailwind

// Map module keys to icons
const MODULE_ICONS = {
  users: Users,
  company: Building,
  customers: UserCheck,
  suppliers: Truck,
  inventory: Package,
  sales: ShoppingCart,
  purchase: ShoppingBag,
  contracts: FileText,
  collections: ClipboardList,
  finance: DollarSign,
  petty_cash: CreditCard,
  invoices: Receipt,
  wastage: Trash2,
  reports: BarChart,
  system: Settings,
  projects: FolderOpen
}

const PermissionMatrix = ({
  permissions = [],
  selectedPermissions = [],
  onChange,
  readonly = false,
  loading = false,
  compact = false
}) => {
  const { t } = useLocalization()
  const [expandedModules, setExpandedModules] = useState(new Set(permissions.map(m => m.key)))
  const [searchQuery, setSearchQuery] = useState('')

  // Convert selected permissions to Set for efficient lookup
  const selectedSet = useMemo(() => new Set(selectedPermissions), [selectedPermissions])

  // Filter permissions by search query
  const filteredPermissions = useMemo(() => {
    if (!searchQuery.trim()) return permissions

    const query = searchQuery.toLowerCase()
    return permissions
      .map(module => ({
        ...module,
        permissions: module.permissions.filter(
          p =>
            p.label.toLowerCase().includes(query) ||
            p.key.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query)
        )
      }))
      .filter(module => module.permissions.length > 0)
  }, [permissions, searchQuery])

  // Toggle module expansion
  const toggleModule = (moduleKey) => {
    setExpandedModules(prev => {
      const next = new Set(prev)
      if (next.has(moduleKey)) {
        next.delete(moduleKey)
      } else {
        next.add(moduleKey)
      }
      return next
    })
  }

  // Toggle single permission
  const togglePermission = (permissionKey, event) => {
    if (readonly) return
    // Blur to prevent any residual scroll-into-view behavior
    event?.target?.blur?.()

    const newSelected = selectedSet.has(permissionKey)
      ? selectedPermissions.filter(p => p !== permissionKey)
      : [...selectedPermissions, permissionKey]
    onChange?.(newSelected)
  }

  // Toggle all permissions in a module
  const toggleModule_ = (module, event) => {
    if (readonly) return
    // Blur to prevent any residual scroll-into-view behavior
    event?.target?.blur?.()

    const modulePermKeys = module.permissions.map(p => p.key)
    const allSelected = modulePermKeys.every(key => selectedSet.has(key))

    let newSelected
    if (allSelected) {
      newSelected = selectedPermissions.filter(p => !modulePermKeys.includes(p))
    } else {
      const toAdd = modulePermKeys.filter(key => !selectedSet.has(key))
      newSelected = [...selectedPermissions, ...toAdd]
    }
    onChange?.(newSelected)
  }

  // Get module selection state
  const getModuleSelectionState = (module) => {
    const modulePermKeys = module.permissions.map(p => p.key)
    const selectedCount = modulePermKeys.filter(key => selectedSet.has(key)).length
    if (selectedCount === 0) return 'none'
    if (selectedCount === modulePermKeys.length) return 'all'
    return 'partial'
  }

  // Expand all / collapse all
  const expandAll = () => setExpandedModules(new Set(permissions.map(m => m.key)))
  const collapseAll = () => setExpandedModules(new Set())

  // Select all / deselect all
  const selectAll = () => {
    if (readonly) return
    const allKeys = permissions.flatMap(m => m.permissions.map(p => p.key))
    onChange?.(allKeys)
  }

  const deselectAll = () => {
    if (readonly) return
    onChange?.([])
  }

  if (loading) {
    return (
      <div className={`permission-matrix ${compact ? 'compact' : ''}`}>
        <div className="permission-matrix-skeleton">
          {[1, 2, 3].map(i => (
            <div key={i} className="skeleton-module">
              <div className="skeleton-header" />
              <div className="skeleton-permissions">
                {[1, 2, 3].map(j => <div key={j} className="skeleton-permission" />)}
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={`permission-matrix ${compact ? 'compact' : ''} ${readonly ? 'readonly' : ''}`}>
      {/* Toolbar */}
      <div className="permission-matrix-toolbar">
        <div className="search-box">
          <Search size={16} />
          <input
            type="text"
            placeholder={t('searchPermissions') || 'Search permissions...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="toolbar-actions">
          <button type="button" onClick={expandAll} className="toolbar-btn">
            {t('expandAll') || 'Expand All'}
          </button>
          <button type="button" onClick={collapseAll} className="toolbar-btn">
            {t('collapseAll') || 'Collapse All'}
          </button>
          {!readonly && (
            <>
              <span className="toolbar-divider" />
              <button type="button" onClick={selectAll} className="toolbar-btn">
                {t('selectAll') || 'Select All'}
              </button>
              <button type="button" onClick={deselectAll} className="toolbar-btn">
                {t('deselectAll') || 'Deselect All'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Summary */}
      <div className="permission-summary">
        <span className="summary-count">
          {selectedPermissions.length > 0
            ? `${selectedPermissions.length} / ${permissions.flatMap(m => m.permissions).length} ${t('permissionsSelected') || 'permissions selected'}`
            : t('noPermissionsSelected') || 'No permissions selected'
          }
        </span>
      </div>

      {/* Modules List */}
      <div className="permission-modules">
        {filteredPermissions.length === 0 ? (
          <div className="no-permissions">
            {searchQuery ? (t('noPermissionsFound') || 'No permissions match your search') : (t('noPermissionsAvailable') || 'No permissions available')}
          </div>
        ) : (
          filteredPermissions.map(module => {
            const Icon = MODULE_ICONS[module.key] || Settings
            const isExpanded = expandedModules.has(module.key)
            const selectionState = getModuleSelectionState(module)

            return (
              <div key={module.key} className={`permission-module ${isExpanded ? 'expanded' : ''}`}>
                <div className="module-header" onClick={() => toggleModule(module.key)}>
                  <div className="module-header-left">
                    {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                    <Icon size={18} className="module-icon" />
                    <span className="module-label">{t(module.key) || module.label}</span>
                    <span className="module-count">
                      ({module.permissions.filter(p => selectedSet.has(p.key)).length}/{module.permissions.length})
                    </span>
                  </div>
                  {!readonly && (
                    <button
                      type="button"
                      className={`module-checkbox ${selectionState}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        toggleModule_(module, e)
                      }}
                      title={selectionState === 'all' ? (t('deselectModule') || 'Deselect all in module') : (t('selectModule') || 'Select all in module')}
                    >
                      {selectionState === 'all' && <CheckSquare size={18} />}
                      {selectionState === 'partial' && <Minus size={18} />}
                      {selectionState === 'none' && <Square size={18} />}
                    </button>
                  )}
                </div>

                {isExpanded && (
                  <div className="module-permissions">
                    {module.permissions.map(permission => (
                      <label
                        key={permission.key}
                        className={`permission-item ${selectedSet.has(permission.key) ? 'selected' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSet.has(permission.key)}
                          onChange={(e) => togglePermission(permission.key, e)}
                          disabled={readonly}
                        />
                        <span className="checkbox-visual">
                          {selectedSet.has(permission.key) && <Check size={12} />}
                        </span>
                        <div className="permission-info">
                          <span className="permission-label">{permission.label}</span>
                          {!compact && permission.description && (
                            <span className="permission-description">{permission.description}</span>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

export default PermissionMatrix
