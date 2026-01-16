/**
 * Stock Status Utilities
 * Shared logic for calculating stock status across the inventory module
 *
 * Consolidates duplicated logic from:
 * - useStockAlerts.js
 * - stockOverviewTableConfig.jsx
 * - inventoryService.js
 *
 * @module utils/stockStatusUtils
 */

/**
 * @typedef {import('../types/inventory.types').StockStatus} StockStatus
 * @typedef {import('../types/inventory.types').InventoryMap} InventoryMap
 * @typedef {import('../types/inventory.types').Material} Material
 * @typedef {import('../types/inventory.types').MaterialComposition} MaterialComposition
 */

/**
 * Calculate stock status based on quantity and reorder level
 * Single source of truth for stock status calculation
 *
 * @param {number} currentStock - Current stock quantity
 * @param {number} reorderLevel - Reorder/minimum stock level
 * @returns {StockStatus} Stock status string
 */
export function calculateStockStatus(currentStock, reorderLevel) {
  if (currentStock <= 0) return 'out-of-stock';
  if (reorderLevel <= 0) return 'good';
  if (currentStock <= reorderLevel * 0.5) return 'critical';
  if (currentStock <= reorderLevel) return 'low';
  return 'good';
}

/**
 * Get effective stock for a material (handles composites)
 * For composite materials, calculates how many complete units
 * can be made based on the limiting component
 *
 * @param {number} materialId - Material ID
 * @param {Material[]} materials - Array of all materials
 * @param {InventoryMap} inventory - Inventory map keyed by material ID
 * @param {Record<number, MaterialComposition[]>} materialCompositions - Compositions by composite material ID
 * @returns {{ currentStock: number, reorderLevel: number }} Stock info
 */
export function getEffectiveStock(materialId, materials, inventory, materialCompositions) {
  const matId = Number(materialId);
  const material = materials.find(m => Number(m.id) === matId);

  if (material?.is_composite) {
    const components = materialCompositions[matId] || [];
    if (components.length === 0) {
      return { currentStock: 0, reorderLevel: 0 };
    }

    let minUnits = Infinity;
    for (const comp of components) {
      const compStock = inventory[comp.component_material_id]?.currentStock || 0;
      // Ensure we don't divide by zero or very small numbers
      const qtyPerComposite = Math.max(
        parseFloat(String(comp.quantity_per_composite)) || 1,
        0.001
      );
      const availableUnits = Math.floor(compStock / qtyPerComposite);
      minUnits = Math.min(minUnits, availableUnits);
    }

    return {
      currentStock: minUnits === Infinity ? 0 : Math.max(0, minUnits),
      reorderLevel: material.minimumStockLevel || 0
    };
  }

  // Non-composite material - return from inventory directly
  const stock = inventory[matId];
  return {
    currentStock: stock?.currentStock || 0,
    reorderLevel: stock?.reorderLevel || stock?.minimumStockLevel || 0
  };
}

/**
 * Format currency for display (OMR)
 *
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
export function formatOMR(amount) {
  const numAmount = parseFloat(String(amount)) || 0;
  return `OMR ${numAmount.toFixed(3)}`;
}

/**
 * Get stock status CSS class
 *
 * @param {StockStatus} status - Stock status
 * @returns {string} CSS class name
 */
export function getStockStatusClass(status) {
  const classMap = {
    'good': 'status-good',
    'low': 'status-low',
    'critical': 'status-critical',
    'out-of-stock': 'status-out-of-stock'
  };
  return classMap[status] || 'status-unknown';
}

export default {
  calculateStockStatus,
  getEffectiveStock,
  formatOMR,
  getStockStatusClass
};
