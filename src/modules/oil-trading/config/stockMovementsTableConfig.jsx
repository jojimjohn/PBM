/**
 * Stock Movements Table Configuration
 * Column definitions for stock movements DataTable
 *
 * @module config/stockMovementsTableConfig
 */
import { TrendingUp, TrendingDown, Building } from 'lucide-react'

/**
 * Get stock movements table columns
 * @param {Object} options - Configuration options
 * @param {Function} options.t - Translation function
 * @param {Function} options.formatDate - Date formatter function
 * @param {Array} options.branches - Branch list
 * @returns {Array} Column configuration array
 */
export const getStockMovementsColumns = ({
  t,
  formatDate,
  branches
}) => [
  {
    key: 'date',
    header: t('date', 'Date'),
    type: 'date',
    sortable: true,
    filterable: true,
    render: (value) => (
      <span className="movement-date">
        {value ? formatDate(new Date(value)) : '-'}
      </span>
    )
  },
  {
    key: 'materialName',
    header: t('material'),
    sortable: true,
    filterable: true,
    render: (value, row) => (
      <div className="cell-info">
        <span className="cell-text">{row.material.name}</span>
        <span className="cell-code">{row.material.code}</span>
      </div>
    )
  },
  {
    key: 'type',
    header: t('type', 'Type'),
    sortable: true,
    filterable: true,
    render: (value) => (
      <span className={`movement-type ${value}`}>
        {value === 'in' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
        {value === 'in' ? 'Stock In' : 'Stock Out'}
      </span>
    )
  },
  {
    key: 'branchName',
    header: 'Location',
    sortable: true,
    filterable: true,
    render: (value, row) => {
      const branchName = row.branchName || branches.find(b => b.id === row.branchId)?.name || 'Main'
      return (
        <span className="location-cell">
          <Building size={14} />
          {branchName}
        </span>
      )
    }
  },
  {
    key: 'quantity',
    header: t('quantity', 'Quantity'),
    type: 'number',
    sortable: true,
    render: (value, row) => (
      <span className="movement-quantity">
        {value} {row.material.unit}
      </span>
    )
  },
  {
    key: 'reason',
    header: t('reason', 'Reason'),
    sortable: true,
    filterable: true,
    render: (value) => <span className="movement-reason">{value}</span>
  },
  {
    key: 'reference',
    header: t('reference', 'Reference'),
    sortable: true,
    render: (value) => value ? <code className="reference-code">{value}</code> : '-'
  }
]

/**
 * Prepare stock movements table data
 * Resolves material information for each movement
 *
 * @param {Object} options
 * @param {Array} options.stockMovements - Raw stock movements array
 * @param {Array} options.materials - Materials list
 * @returns {Array} Prepared table data with resolved materials
 */
export const prepareStockMovementsData = ({
  stockMovements,
  materials
}) => {
  return stockMovements
    .filter(movement => {
      const material = materials.find(m => Number(m.id) === Number(movement.materialId))
      return material || movement.materialName
    })
    .map(movement => {
      const material = materials.find(m => Number(m.id) === Number(movement.materialId))
      const resolvedMaterial = material || {
        name: movement.materialName || 'Unknown',
        code: movement.materialCode || '',
        unit: ''
      }
      return {
        ...movement,
        materialName: resolvedMaterial.name,
        material: resolvedMaterial
      }
    })
}

/**
 * Movement type labels for display
 */
export const movementTypeLabels = {
  'receipt': 'Stock Receipt',
  'sale': 'Sale',
  'wastage': 'Wastage',
  'adjustment': 'Adjustment',
  'transfer': 'Transfer'
}

/**
 * Transform raw movement data for display
 * @param {Object} movement - Raw movement from API
 * @param {Object} material - Material object
 * @returns {Object} Transformed movement for UI
 */
export const transformMovementForDisplay = (movement, material) => {
  const isInflow = movement.quantity > 0
  const type = isInflow ? 'in' : 'out'

  let reference = ''
  if (movement.batchNumber) {
    reference = movement.batchNumber
  }
  if (movement.referenceType && movement.referenceType !== 'seed_data') {
    reference = reference ? `${reference} (${movement.referenceType})` : movement.referenceType
  }

  let reason = movementTypeLabels[movement.movementType] || movement.movementType
  if (movement.notes) {
    reason = `${reason}: ${movement.notes}`
  }

  return {
    id: movement.id,
    type,
    quantity: Math.abs(movement.quantity),
    reason,
    reference,
    date: movement.movementDate,
    runningBalance: movement.runningBalance,
    unitCost: movement.unitCost,
    totalValue: movement.totalValue,
    batchNumber: movement.batchNumber,
    supplierName: movement.supplierName
  }
}

export default {
  getStockMovementsColumns,
  prepareStockMovementsData,
  movementTypeLabels,
  transformMovementForDisplay
}
