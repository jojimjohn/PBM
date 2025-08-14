/**
 * Inventory Service
 * Handles all inventory-related operations including stock updates, movements, and validation
 */

class InventoryService {
  constructor() {
    this.inventory = null
    this.loadInventory()
  }

  async loadInventory() {
    try {
      const response = await fetch('/data/inventory.json')
      const data = await response.json()
      this.inventory = data.inventory
      return this.inventory
    } catch (error) {
      console.error('Error loading inventory:', error)
      return null
    }
  }

  /**
   * Get current stock for a specific material in a company
   * @param {string} companyId - Company identifier (alramrami/pridemuscat)
   * @param {string} materialId - Material identifier
   * @returns {object|null} Inventory item or null if not found
   */
  getCurrentStock(companyId, materialId) {
    if (!this.inventory || !this.inventory[companyId]) {
      console.warn(`No inventory data found for company: ${companyId}`)
      return null
    }

    const inventoryItem = this.inventory[companyId].find(item => item.materialId === materialId)
    return inventoryItem || null
  }

  /**
   * Check if sufficient stock is available for a sale
   * @param {string} companyId - Company identifier
   * @param {array} items - Array of items to check {materialId, quantity}
   * @returns {object} Validation result with available quantities
   */
  validateStockAvailability(companyId, items) {
    const validation = {
      isValid: true,
      insufficientItems: [],
      availableQuantities: {}
    }

    for (const item of items) {
      const inventoryItem = this.getCurrentStock(companyId, item.materialId)
      
      if (!inventoryItem) {
        validation.isValid = false
        validation.insufficientItems.push({
          materialId: item.materialId,
          requested: item.quantity,
          available: 0,
          reason: 'Material not found in inventory'
        })
        validation.availableQuantities[item.materialId] = 0
        continue
      }

      const availableStock = inventoryItem.currentStock
      validation.availableQuantities[item.materialId] = availableStock

      if (availableStock < item.quantity) {
        validation.isValid = false
        validation.insufficientItems.push({
          materialId: item.materialId,
          requested: item.quantity,
          available: availableStock,
          reason: 'Insufficient stock'
        })
      }
    }

    return validation
  }

  /**
   * Reduce inventory stock for sales order
   * @param {string} companyId - Company identifier
   * @param {array} items - Array of items to reduce {materialId, quantity}
   * @param {string} referenceId - Sales order reference (e.g., SO-2025-001)
   * @returns {object} Result of the stock reduction
   */
  async reduceStock(companyId, items, referenceId) {
    try {
      // First validate all items have sufficient stock
      const validation = this.validateStockAvailability(companyId, items)
      
      if (!validation.isValid) {
        return {
          success: false,
          error: 'Insufficient stock for one or more items',
          details: validation.insufficientItems
        }
      }

      // Reduce stock for each item and record movements
      for (const item of items) {
        const inventoryItem = this.getCurrentStock(companyId, item.materialId)
        
        // Reduce current stock
        inventoryItem.currentStock -= item.quantity
        
        // Update total value (using current average cost)
        inventoryItem.totalValue = inventoryItem.currentStock * inventoryItem.averageCost
        
        // Update last updated timestamp
        inventoryItem.lastUpdated = new Date().toISOString()
        
        // Add movement record
        const movement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'out',
          quantity: item.quantity,
          reference: referenceId,
          date: new Date().toISOString(), // July 25, 2025
          cost: inventoryItem.averageCost,
          notes: `Stock reduction for sales order ${referenceId}`
        }
        
        inventoryItem.movements.push(movement)
      }

      // In a real application, this would persist to database
      // For now, we'll update the in-memory inventory
      console.log('Inventory updated successfully for sales order:', referenceId)
      
      return {
        success: true,
        message: `Stock reduced successfully for ${items.length} items`,
        updatedItems: items.map(item => ({
          materialId: item.materialId,
          quantityReduced: item.quantity,
          newStock: this.getCurrentStock(companyId, item.materialId).currentStock
        }))
      }
      
    } catch (error) {
      console.error('Error reducing stock:', error)
      return {
        success: false,
        error: 'Failed to reduce stock',
        details: error.message
      }
    }
  }

  /**
   * Add inventory stock for purchase orders
   * @param {string} companyId - Company identifier
   * @param {array} items - Array of items to add {materialId, quantity, cost}
   * @param {string} referenceId - Purchase order reference
   * @returns {object} Result of the stock addition
   */
  async addStock(companyId, items, referenceId) {
    try {
      for (const item of items) {
        let inventoryItem = this.getCurrentStock(companyId, item.materialId)
        
        // If material doesn't exist in inventory, create it
        if (!inventoryItem) {
          inventoryItem = {
            materialId: item.materialId,
            materialCode: item.materialCode || item.materialId,
            currentStock: 0,
            unit: item.unit || 'units',
            reorderLevel: item.reorderLevel || 10,
            maxStock: item.maxStock || 1000,
            averageCost: 0,
            totalValue: 0,
            lastUpdated: new Date().toISOString(),
            movements: []
          }
          this.inventory[companyId].push(inventoryItem)
        }

        // Calculate new average cost
        const currentValue = inventoryItem.currentStock * inventoryItem.averageCost
        const newValue = item.quantity * item.cost
        const newTotalStock = inventoryItem.currentStock + item.quantity
        
        inventoryItem.averageCost = (currentValue + newValue) / newTotalStock
        inventoryItem.currentStock = newTotalStock
        inventoryItem.totalValue = newTotalStock * inventoryItem.averageCost
        inventoryItem.lastUpdated = new Date().toISOString()
        
        // Add movement record
        const movement = {
          id: `mov_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
          type: 'in',
          quantity: item.quantity,
          reference: referenceId,
          date: new Date().toISOString(), // July 25, 2025
          cost: item.cost,
          notes: `Stock addition from purchase order ${referenceId}`
        }
        
        inventoryItem.movements.push(movement)
      }

      return {
        success: true,
        message: `Stock added successfully for ${items.length} items`,
        updatedItems: items.map(item => ({
          materialId: item.materialId,
          quantityAdded: item.quantity,
          newStock: this.getCurrentStock(companyId, item.materialId).currentStock
        }))
      }
      
    } catch (error) {
      console.error('Error adding stock:', error)
      return {
        success: false,
        error: 'Failed to add stock',
        details: error.message
      }
    }
  }

  /**
   * Get low stock items that need reordering
   * @param {string} companyId - Company identifier
   * @returns {array} Items below reorder level
   */
  getLowStockItems(companyId) {
    if (!this.inventory || !this.inventory[companyId]) {
      return []
    }

    return this.inventory[companyId].filter(item => 
      item.currentStock <= item.reorderLevel
    ).map(item => ({
      ...item,
      reorderQuantity: item.maxStock - item.currentStock
    }))
  }

  /**
   * Get inventory value for a company
   * @param {string} companyId - Company identifier
   * @returns {object} Total inventory value and count
   */
  getInventoryValue(companyId) {
    if (!this.inventory || !this.inventory[companyId]) {
      return { totalValue: 0, itemCount: 0 }
    }

    const items = this.inventory[companyId]
    return {
      totalValue: items.reduce((sum, item) => sum + item.totalValue, 0),
      itemCount: items.length,
      totalUnits: items.reduce((sum, item) => sum + item.currentStock, 0)
    }
  }

  /**
   * Set stock level for a specific material
   * @param {string} companyId - Company identifier
   * @param {string} materialId - Material identifier
   * @param {number} newStock - New stock level
   * @returns {object} Update result
   */
  setStock(companyId, materialId, newStock) {
    try {
      if (!this.inventory[companyId]) {
        this.inventory[companyId] = []
      }

      const items = this.inventory[companyId]
      const existingItemIndex = items.findIndex(item => item.materialId === materialId)

      if (existingItemIndex >= 0) {
        // Update existing item
        const item = items[existingItemIndex]
        const oldStock = item.currentStock
        
        items[existingItemIndex] = {
          ...item,
          currentStock: newStock,
          lastUpdated: new Date().toISOString(),
          totalValue: newStock * (item.unitCost || 0)
        }

        console.log(`Stock updated for ${materialId}: ${oldStock} → ${newStock}`)
        
        return {
          success: true,
          message: `Stock level updated successfully`,
          oldStock,
          newStock,
          materialId
        }
      } else {
        // Create new inventory item if it doesn't exist
        const newItem = {
          materialId,
          materialCode: materialId,
          currentStock: newStock,
          reorderLevel: 100, // Default reorder level
          unitCost: 0, // Will be updated when purchases are made
          totalValue: 0,
          lastUpdated: new Date().toISOString()
        }

        items.push(newItem)

        console.log(`New inventory item created for ${materialId} with stock: ${newStock}`)
        
        return {
          success: true,
          message: `New inventory item created with stock level: ${newStock}`,
          newStock,
          materialId
        }
      }
    } catch (error) {
      console.error('Error setting stock:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }
}

// Create and export a singleton instance
const inventoryService = new InventoryService()
export default inventoryService