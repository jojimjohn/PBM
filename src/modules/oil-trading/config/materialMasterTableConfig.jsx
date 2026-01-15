/**
 * Material Master Table Configuration
 * Column definitions for material catalog DataTable
 *
 * @module config/materialMasterTableConfig
 */
import { Layers, Recycle, ChevronDown, ChevronRight, Edit, FileText } from 'lucide-react'
import { categoryDisplayConfig } from './stockOverviewTableConfig'

/**
 * Get material master table columns
 * @param {Object} options - Configuration options
 * @param {Function} options.t - Translation function
 * @param {Set} options.expandedRows - Set of expanded row IDs
 * @param {Object} options.materialCompositions - Composite material compositions map
 * @param {Function} options.toggleExpandRow - Toggle row expansion callback
 * @param {Function} options.formatCurrency - Currency formatter
 * @param {Function} options.handleEditMaterial - Edit material callback
 * @param {Function} options.handleViewHistory - View history callback
 * @returns {Array} Column configuration array
 */
export const getMaterialMasterColumns = ({
  t,
  expandedRows,
  materialCompositions,
  toggleExpandRow,
  formatCurrency,
  handleEditMaterial,
  handleViewHistory
}) => [
  {
    key: 'name',
    header: t('material'),
    sortable: true,
    filterable: true,
    render: (value, row) => {
      if (row.isComponent) {
        return (
          <div className="cell-row component-row">
            <span className="cell-text">{value}</span>
            <span className={`status-badge ${row.componentType}`}>
              {row.componentType === 'container' ? 'Container' : 'Content'}
            </span>
          </div>
        )
      }

      const isComposite = !!row.is_composite
      const isExpanded = expandedRows.has(row.id)
      const hasComponents = isComposite && materialCompositions[row.id]?.length > 0

      return (
        <div className="cell-row">
          {isComposite && hasComponents && (
            <span
              className="expand-icon"
              onClick={(e) => { e.stopPropagation(); toggleExpandRow(row.id) }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          <div className="cell-info">
            <span className="cell-text">{value}</span>
            <span className="cell-code">{row.code}</span>
          </div>
          {row.is_disposable && (
            <span className="status-badge disposable" title="Disposable material - auto-converted to wastage">
              <Recycle size={12} />
              Disposable
            </span>
          )}
        </div>
      )
    }
  },
  {
    key: 'category',
    header: t('category'),
    sortable: true,
    filterable: true,
    render: (value, row) => {
      if (!row.categoryInfo?.icon) {
        return <span className="category-text">{value || 'N/A'}</span>
      }
      const CategoryIcon = row.categoryInfo.icon
      return (
        <div className="cell-icon">
          <CategoryIcon size={14} />
          {row.categoryInfo.name}
        </div>
      )
    }
  },
  {
    key: 'is_disposable',
    header: 'Type',
    sortable: true,
    filterable: true,
    render: (value, row) => {
      if (row.isComponent) return null
      if (row.is_composite) {
        return (
          <span className="status-badge composite">
            <Layers size={12} />
            Composite
          </span>
        )
      }
      if (value) {
        return (
          <span className="status-badge disposable">
            <Recycle size={12} />
            Disposable
          </span>
        )
      }
      return <span className="status-badge standard">Standard</span>
    }
  },
  {
    key: 'code',
    header: 'Material Code',
    sortable: true,
    filterable: true,
    render: (value) => <span className="cell-code accent">{value}</span>
  },
  {
    key: 'unit',
    header: 'Unit',
    sortable: true,
    render: (value) => <span className="status-badge">{value}</span>
  },
  {
    key: 'standardPrice',
    header: 'Standard Price',
    type: 'currency',
    sortable: true,
    render: (value, row) => (
      <span className="cell-number">
        {formatCurrency(value)} / {row.unit}
      </span>
    )
  },
  {
    key: 'actions',
    header: 'Actions',
    sortable: false,
    render: (value, row) => {
      if (row.isComponent) return null

      return (
        <div className="cell-actions">
          <button className="btn btn-icon" onClick={() => handleEditMaterial(row)} title="Edit Material">
            <Edit size={14} />
          </button>
          <button className="btn btn-icon" onClick={() => handleViewHistory(row)} title="View Details">
            <FileText size={14} />
          </button>
        </div>
      )
    }
  }
]

/**
 * Prepare material master table data
 * Expands composite materials into parent + component rows
 *
 * @param {Object} options
 * @param {Array} options.materials - Filtered materials list
 * @param {Set} options.expandedRows - Set of expanded row IDs
 * @param {Object} options.materialCompositions - Composite compositions map
 * @returns {Array} Prepared table data
 */
export const prepareMaterialMasterData = ({
  materials,
  expandedRows,
  materialCompositions
}) => {
  return materials.flatMap(material => {
    const category = categoryDisplayConfig[material.category]
    const rows = [{ ...material, categoryInfo: category, isComponent: false }]

    if (material.is_composite && expandedRows.has(material.id)) {
      const components = materialCompositions[material.id] || []
      components.forEach(comp => {
        rows.push({
          id: `${material.id}-comp-${comp.component_material_id}`,
          componentMaterialId: comp.component_material_id,
          parentId: material.id,
          name: comp.component_material_name,
          code: comp.component_material_code,
          category: '',
          unit: comp.unit,
          standardPrice: 0,
          currentStock: comp.currentStock,
          componentType: comp.component_type,
          categoryInfo: null,
          isComponent: true
        })
      })
    }

    return rows
  })
}

export default {
  getMaterialMasterColumns,
  prepareMaterialMasterData
}
