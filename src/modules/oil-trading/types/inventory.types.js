/**
 * Inventory Module Type Definitions
 * JSDoc types for inventory, materials, stock, and movements
 */

// ============================================
// MATERIAL TYPES
// ============================================

/**
 * @typedef {Object} Material
 * @property {number} id - Unique material identifier
 * @property {string} name - Material name
 * @property {string} code - Material code (e.g., 'EO-001')
 * @property {string} category - Category key (e.g., 'engine-oils')
 * @property {string} unit - Unit of measurement (e.g., 'liters', 'drums')
 * @property {number} standardPrice - Standard selling price
 * @property {number} [minimumStockLevel] - Minimum stock level for alerts
 * @property {number} [maximumStockLevel] - Maximum stock level
 * @property {boolean} [is_composite] - Whether material has components
 * @property {boolean} [is_disposable] - Whether material is disposable
 * @property {boolean} [is_active] - Whether material is active
 */

/**
 * @typedef {Object} MaterialComposition
 * @property {number} id - Composition ID
 * @property {number} composite_material_id - Parent composite material ID
 * @property {number} component_material_id - Component material ID
 * @property {string} component_material_name - Component name
 * @property {string} component_material_code - Component code
 * @property {'container'|'content'} component_type - Type of component
 * @property {number} quantity_per_composite - Quantity per composite unit
 * @property {string} capacity_unit - Unit for capacity
 * @property {number} [currentStock] - Current stock of component
 */

// ============================================
// INVENTORY TYPES
// ============================================

/**
 * @typedef {Object} InventoryItem
 * @property {number} materialId - Material ID
 * @property {string} materialName - Material name
 * @property {string} materialCode - Material code
 * @property {string} category - Material category
 * @property {string} unit - Unit of measurement
 * @property {number} currentStock - Current stock quantity
 * @property {number} reservedQuantity - Reserved quantity
 * @property {number} availableQuantity - Available quantity
 * @property {number} totalValue - Total inventory value
 * @property {number} averageCost - Weighted average cost
 * @property {number} standardPrice - Standard selling price
 * @property {number} minimumStockLevel - Reorder level
 * @property {number} maximumStockLevel - Maximum stock level
 * @property {number} reorderLevel - Reorder trigger level
 * @property {InventoryBatch[]} batches - Inventory batches
 */

/**
 * @typedef {Object} InventoryBatch
 * @property {number} id - Batch ID
 * @property {string} batchNumber - Batch number
 * @property {number} quantity - Batch quantity
 * @property {number} currentStock - Current stock in batch
 * @property {number} averageCost - Cost per unit
 * @property {number} lastPurchasePrice - Last purchase price
 * @property {string} location - Storage location
 * @property {string} [notes] - Batch notes
 * @property {string} [expiryDate] - Expiry date if applicable
 */

/**
 * @typedef {Object.<number, InventoryItem>} InventoryMap
 * Inventory keyed by material ID
 */

// ============================================
// STOCK STATUS TYPES
// ============================================

/**
 * @typedef {'good'|'low'|'critical'|'out-of-stock'} StockStatus
 */

/**
 * @typedef {Object} StockAlert
 * @property {string} id - Alert ID
 * @property {'warning'|'critical'} type - Alert type
 * @property {'warning'|'critical'} severity - Alert severity
 * @property {string} material - Material name
 * @property {number} currentStock - Current stock level
 * @property {number} reorderLevel - Reorder level
 * @property {string} unit - Unit of measurement
 * @property {string} message - Alert message
 */

// ============================================
// STOCK MOVEMENT TYPES
// ============================================

/**
 * @typedef {Object} StockMovement
 * @property {number} id - Movement ID
 * @property {number} materialId - Material ID
 * @property {string} [materialName] - Material name
 * @property {string} [materialCode] - Material code
 * @property {'in'|'out'} type - Movement direction
 * @property {number} quantity - Movement quantity
 * @property {string} reason - Movement reason
 * @property {string} [reference] - Reference document
 * @property {string} date - Movement date
 * @property {number} [runningBalance] - Running balance after movement
 * @property {number} [unitCost] - Unit cost at time of movement
 * @property {number} [totalValue] - Total value of movement
 * @property {string} [batchNumber] - Associated batch number
 * @property {string} [branchName] - Branch name
 * @property {number} [branchId] - Branch ID
 */

// ============================================
// COMPOSITE ADJUSTMENT TYPES
// ============================================

/**
 * @typedef {Object} CompositeComponentData
 * @property {number} componentId - Component material ID
 * @property {string} componentName - Component name
 * @property {string} componentCode - Component code
 * @property {'container'|'content'} componentType - Component type
 * @property {number} currentStock - Current stock level
 * @property {number} newStock - New stock level to set
 * @property {string} unit - Unit of measurement
 * @property {InventoryItem} [inventoryRecord] - Full inventory record
 */

/**
 * @typedef {Object} CompositeAdjustData
 * @property {Material} compositeMaterial - The composite material
 * @property {CompositeComponentData[]} components - Component data array
 */

// ============================================
// BATCH MODAL TYPES
// ============================================

/**
 * @typedef {Object} BatchModalData
 * @property {Material} material - The material
 * @property {InventoryBatch[]} batches - Batch records
 * @property {number} totalStock - Total stock across batches
 * @property {string} unit - Unit of measurement
 */

// ============================================
// STOCK STATUS CONSTANTS
// ============================================

/**
 * Stock status configuration with colors and labels
 */
export const STOCK_STATUS_CONFIG = {
  'good': { label: 'In Stock', color: 'var(--green-600)', bgColor: 'var(--green-50)' },
  'low': { label: 'Low Stock', color: 'var(--yellow-600)', bgColor: 'var(--yellow-50)' },
  'critical': { label: 'Critical', color: 'var(--red-600)', bgColor: 'var(--red-50)' },
  'out-of-stock': { label: 'Out of Stock', color: 'var(--gray-600)', bgColor: 'var(--gray-100)' }
}

/**
 * Category display configuration with icons
 */
export const CATEGORY_KEYS = {
  ENGINE_OILS: 'engine-oils',
  DIESEL: 'diesel',
  DRUMS: 'drums',
  CRUDE_SLUDGE: 'crude-sludge'
}
