/**
 * Oil Trading Module - Custom Hooks
 *
 * Centralized exports for all custom hooks in the oil-trading module.
 */

// Customer Hooks
export { useCustomers } from './useCustomers'
export { useCustomerForm } from './useCustomerForm'
export { useAttachments } from './useAttachments'
export {
  useContractRates,
  useContractEditor,
  calculateActualRate,
  calculateSavings
} from './useContractRates'

// Sales Hooks
export { useSalesOrders } from './useSalesOrders'
export { useSalesOrderForm } from './useSalesOrderForm'
export {
  useSalesContractRates,
  CONTRACT_RATE_TYPES,
  RATE_WARNING_TYPES
} from './useSalesContractRates'
export {
  useStockValidation,
  STOCK_STATUS
} from './useStockValidation'

// =============================================
// INVENTORY HOOKS
// =============================================
// Data loading and state management
export { useInventoryData } from './useInventoryData'

// Stock alerts and status calculations
export { useStockAlerts } from './useStockAlerts'

// Composite material operations
export { useMaterialComposition } from './useMaterialComposition'

// Material CRUD operations
export { useMaterialMaster } from './useMaterialMaster'

// Type definitions: See types/inventory.types.js
