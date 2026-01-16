/**
 * Inventory Module Type Definitions
 * TypeScript types for inventory, materials, stock, and movements
 *
 * @module types/inventory
 */

// ============================================
// MATERIAL TYPES
// ============================================

export interface Material {
  id: number;
  name: string;
  code: string;
  category: CategoryKey;
  unit: string;
  standardPrice: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  is_composite?: boolean;
  is_disposable?: boolean;
  is_active?: boolean;
}

export interface MaterialComposition {
  id: number;
  composite_material_id: number;
  component_material_id: number;
  component_material_name: string;
  component_material_code: string;
  component_type: ComponentType;
  quantity_per_composite: number;
  capacity_unit: string;
  currentStock?: number;
}

export type ComponentType = 'container' | 'content';

// ============================================
// INVENTORY TYPES
// ============================================

export interface InventoryItem {
  materialId: number;
  materialName: string;
  materialCode: string;
  category: string;
  unit: string;
  currentStock: number;
  reservedQuantity: number;
  availableQuantity: number;
  totalValue: number;
  averageCost: number;
  standardPrice: number;
  minimumStockLevel: number;
  maximumStockLevel: number;
  reorderLevel: number;
  batches: InventoryBatch[];
}

export interface InventoryBatch {
  id: number;
  batchNumber: string;
  quantity: number;
  currentStock: number;
  averageCost: number;
  lastPurchasePrice: number;
  location: string;
  notes?: string;
  expiryDate?: string;
}

export type InventoryMap = Record<number, InventoryItem>;

// ============================================
// STOCK STATUS TYPES
// ============================================

export type StockStatus = 'good' | 'low' | 'critical' | 'out-of-stock';

export interface StockAlert {
  id: string;
  type: 'warning' | 'critical';
  severity: 'warning' | 'critical';
  material: string;
  materialId: number;
  currentStock: number;
  reorderLevel: number;
  unit: string;
  message: string;
}

export interface StockStatusConfig {
  label: string;
  labelAr: string;
  color: string;
  bgColor: string;
  icon: string;
}

// ============================================
// STOCK MOVEMENT TYPES
// ============================================

export interface StockMovement {
  id: number;
  materialId: number;
  materialName?: string;
  materialCode?: string;
  type: MovementDirection;
  quantity: number;
  reason: string;
  reference?: string;
  date: string;
  runningBalance?: number;
  unitCost?: number;
  totalValue?: number;
  batchNumber?: string;
  branchName?: string;
  branchId?: number;
}

export type MovementDirection = 'in' | 'out';
export type MovementType = 'receipt' | 'sale' | 'wastage' | 'adjustment' | 'transfer';

// ============================================
// COMPOSITE ADJUSTMENT TYPES
// ============================================

export interface CompositeComponentData {
  componentId: number;
  componentName: string;
  componentCode: string;
  componentType: ComponentType;
  currentStock: number;
  newStock: number;
  unit: string;
  inventoryRecord?: InventoryItem;
}

export interface CompositeAdjustData {
  compositeMaterial: Material;
  components: CompositeComponentData[];
}

// ============================================
// BATCH MODAL TYPES
// ============================================

export interface BatchModalData {
  material: Material;
  batches: InventoryBatch[];
  totalStock: number;
  unit: string;
}

// ============================================
// STOCK MOVEMENTS FILTER
// ============================================

export interface StockMovementsFilter {
  startDate?: string;
  endDate?: string;
  materialId?: number;
  type?: MovementType;
  page?: number;
  limit?: number;
}

// ============================================
// CONSTANTS
// ============================================

export const STOCK_STATUS_CONFIG: Record<StockStatus, StockStatusConfig> = {
  'good': {
    label: 'In Stock',
    labelAr: 'متوفر',
    color: 'var(--green-600)',
    bgColor: 'var(--green-50)',
    icon: 'check-circle'
  },
  'low': {
    label: 'Low Stock',
    labelAr: 'مخزون منخفض',
    color: 'var(--yellow-600)',
    bgColor: 'var(--yellow-50)',
    icon: 'alert-triangle'
  },
  'critical': {
    label: 'Critical',
    labelAr: 'حرج',
    color: 'var(--red-600)',
    bgColor: 'var(--red-50)',
    icon: 'alert-circle'
  },
  'out-of-stock': {
    label: 'Out of Stock',
    labelAr: 'نفذ من المخزون',
    color: 'var(--gray-600)',
    bgColor: 'var(--gray-100)',
    icon: 'x-circle'
  }
};

export type CategoryKey = 'engine-oils' | 'diesel' | 'drums' | 'crude-sludge';

export const CATEGORY_KEYS = {
  ENGINE_OILS: 'engine-oils' as const,
  DIESEL: 'diesel' as const,
  DRUMS: 'drums' as const,
  CRUDE_SLUDGE: 'crude-sludge' as const
};

export const MOVEMENT_TYPE_LABELS: Record<MovementType, string> = {
  'receipt': 'Stock Receipt',
  'sale': 'Sale',
  'wastage': 'Wastage',
  'adjustment': 'Adjustment',
  'transfer': 'Transfer'
};
