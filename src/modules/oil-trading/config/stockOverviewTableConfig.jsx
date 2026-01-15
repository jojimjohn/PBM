/**
 * Stock Overview Table Configuration
 * Column definitions for inventory stock overview DataTable
 *
 * @module config/stockOverviewTableConfig
 */
import { Droplets, Fuel, Drum, Factory, Building, ChevronDown, ChevronRight, Layers, Edit, FileText } from 'lucide-react'

/**
 * Category display configuration with icons and colors
 */
export const categoryDisplayConfig = {
  'engine-oils': {
    name: 'Engine Oils',
    icon: Droplets,
    color: 'var(--blue-600)',
    subcategories: ['with-drums', 'without-drums', 'transformer-oil', 'lube-oil', 'cooking-oil']
  },
  'diesel': {
    name: 'Diesel',
    icon: Fuel,
    color: 'var(--orange-600)',
    subcategories: ['unused', 'used']
  },
  'drums': {
    name: 'Empty Drums',
    icon: Drum,
    color: 'var(--gray-600)',
    subcategories: ['collection']
  },
  'crude-sludge': {
    name: 'Crude Sludge',
    icon: Factory,
    color: 'var(--purple-600)',
    subcategories: ['raw']
  }
}

/**
 * Get stock overview table columns
 * @param {Object} options - Configuration options
 * @param {Function} options.t - Translation function
 * @param {Set} options.expandedRows - Set of expanded row IDs
 * @param {Object} options.materialCompositions - Composite material compositions map
 * @param {Array} options.branches - Branch list
 * @param {Function} options.toggleExpandRow - Toggle row expansion callback
 * @param {Function} options.formatCurrency - Currency formatter
 * @param {Function} options.handleViewBatches - View batches callback
 * @param {Function} options.handleAdjustStock - Adjust stock callback
 * @param {Function} options.handleViewHistory - View history callback
 * @returns {Array} Column configuration array
 */
export const getStockOverviewColumns = ({
  t,
  expandedRows,
  materialCompositions,
  branches,
  toggleExpandRow,
  formatCurrency,
  handleViewBatches,
  handleAdjustStock,
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
              onClick={(e) => {
                e.stopPropagation()
                toggleExpandRow(row.id)
              }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </span>
          )}
          <div className="cell-info">
            <span className="cell-text">{value}</span>
            <span className="cell-code">{row.code}</span>
          </div>
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
      if (row.isComponent) return null
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
    key: 'branchName',
    header: 'Location',
    sortable: true,
    filterable: true,
    render: (value, row) => {
      if (row.isComponent) return null
      const branchName = row.stock?.branchName || branches.find(b => b.id === row.stock?.branch_id)?.name || 'Main'
      return (
        <span className="location-cell">
          <Building size={14} />
          {branchName}
        </span>
      )
    }
  },
  {
    key: 'stock.currentStock',
    header: t('currentStock'),
    type: 'number',
    sortable: true,
    render: (value, row) => {
      if (row.is_composite && !row.isComponent) {
        return <span className="cell-number muted">See components</span>
      }
      return (
        <span className="cell-number">
          {value} {row.stock.unit}
        </span>
      )
    }
  },
  {
    key: 'stock.reorderLevel',
    header: t('reorderLevel'),
    type: 'number',
    sortable: true,
    render: (value, row) => {
      if (row.is_composite && !row.isComponent) {
        return <span className="reorder-level muted">—</span>
      }
      return (
        <span className="reorder-level">
          {value > 0 ? `${value} ${row.stock.unit}` : 'Not set'}
        </span>
      )
    }
  },
  {
    key: 'status',
    header: t('status'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <span className={`status-badge ${value}`}>
        {value === 'good' ? 'In Stock' :
         value === 'low' ? 'Low Stock' :
         value === 'critical' ? 'Critical' : 'Out of Stock'}
      </span>
    )
  },
  {
    key: 'stockValue',
    header: t('stockValue'),
    type: 'currency',
    align: 'right',
    sortable: true,
    render: (value) => <span className="cell-number">{formatCurrency(value)}</span>
  },
  {
    key: 'actions',
    header: t('actions'),
    sortable: false,
    render: (value, row) => {
      if (row.is_composite && !row.isComponent) {
        return <span className="no-actions">—</span>
      }

      const materialForAction = row.isComponent
        ? { ...row, id: row.componentMaterialId, name: row.name, code: row.code, unit: row.stock?.unit || 'units' }
        : row

      return (
        <div className="cell-actions" onClick={(e) => e.stopPropagation()}>
          <button className="btn btn-icon" onClick={() => handleViewBatches(materialForAction)} title="View Batches">
            <Layers size={14} />
          </button>
          <button className="btn btn-icon" onClick={() => handleAdjustStock(materialForAction)} title="Adjust Stock">
            <Edit size={14} />
          </button>
          <button className="btn btn-icon" onClick={() => handleViewHistory(materialForAction)} title="View History">
            <FileText size={14} />
          </button>
        </div>
      )
    }
  }
]

/**
 * Prepare stock overview table data
 * Expands composite materials into parent + component rows
 *
 * @param {Object} options
 * @param {Array} options.materials - Filtered materials list
 * @param {Object} options.inventory - Inventory map by material ID
 * @param {Set} options.expandedRows - Set of expanded row IDs
 * @param {Object} options.materialCompositions - Composite compositions map
 * @param {Function} options.getStockStatus - Get stock status function
 * @returns {Array} Prepared table data
 */
export const prepareStockOverviewData = ({
  materials,
  inventory,
  expandedRows,
  materialCompositions,
  getStockStatus
}) => {
  return materials.flatMap(material => {
    const stock = inventory[Number(material.id)]
    const status = getStockStatus(material.id)
    const stockValue = stock ? stock.currentStock * material.standardPrice : 0
    const category = categoryDisplayConfig[material.category]

    const rows = [{
      ...material,
      stock: stock || { currentStock: 0, unit: material.unit, reorderLevel: 0 },
      status,
      stockValue,
      categoryInfo: category,
      isComponent: false
    }]

    // Add component rows if expanded
    if (material.is_composite && expandedRows.has(material.id)) {
      const components = materialCompositions[material.id] || []
      components.forEach(comp => {
        const compStock = inventory[comp.component_material_id]
        const compCurrentStock = compStock?.currentStock || 0
        const compReorderLevel = compStock?.reorderLevel || 0
        let compStatus = 'good'
        if (compCurrentStock === 0) compStatus = 'out-of-stock'
        else if (compReorderLevel > 0) {
          if (compCurrentStock <= compReorderLevel * 0.5) compStatus = 'critical'
          else if (compCurrentStock <= compReorderLevel) compStatus = 'low'
        }

        rows.push({
          id: `${material.id}-comp-${comp.component_material_id}`,
          componentMaterialId: comp.component_material_id,
          parentId: material.id,
          name: comp.component_material_name,
          code: comp.component_material_code,
          category: '',
          stock: { currentStock: compCurrentStock, unit: comp.unit, reorderLevel: compReorderLevel },
          status: compStatus,
          stockValue: 0,
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
  categoryDisplayConfig,
  getStockOverviewColumns,
  prepareStockOverviewData
}
