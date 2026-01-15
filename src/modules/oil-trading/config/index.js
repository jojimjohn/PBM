/**
 * Oil Trading Module Configuration Index
 * Re-exports all table configurations for easy importing
 *
 * @module config
 */

// Stock Overview Table
export {
  categoryDisplayConfig,
  getStockOverviewColumns,
  prepareStockOverviewData
} from './stockOverviewTableConfig'

// Material Master Table
export {
  getMaterialMasterColumns,
  prepareMaterialMasterData
} from './materialMasterTableConfig'

// Stock Movements Table
export {
  getStockMovementsColumns,
  prepareStockMovementsData,
  movementTypeLabels,
  transformMovementForDisplay
} from './stockMovementsTableConfig'
