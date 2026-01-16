/**
 * Purchase Module Type Definitions
 * TypeScript types for purchase orders, bills, expenses, and collections
 *
 * @module types/purchase
 */

// ============================================
// PURCHASE ORDER TYPES
// ============================================

export type PurchaseOrderStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'sent'
  | 'received'
  | 'completed'
  | 'cancelled';

export type PurchaseSourceType = 'manual' | 'wcn_auto';

export interface PurchaseOrderItem {
  id: number;
  materialId: number;
  materialName: string;
  materialCode: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  receivedQuantity?: number;
  notes?: string;
}

export interface PurchaseOrder {
  id: number;
  orderNumber: string;
  supplierId: number;
  supplierName: string;
  orderDate: string;
  expectedDeliveryDate?: string;
  actualDeliveryDate?: string;
  status: PurchaseOrderStatus;
  sourceType: PurchaseSourceType;
  items: PurchaseOrderItem[];
  subtotal: number;
  taxAmount?: number;
  totalAmount: number;
  paymentTerms?: string;
  deliveryAddress?: string;
  notes?: string;
  createdBy?: number;
  createdAt?: string;
  updatedAt?: string;
  projectId?: number;
}

export interface PurchaseOrderAmendment {
  id: number;
  purchaseOrderId: number;
  amendmentNumber: number;
  reason: string;
  changesDescription: string;
  previousValues: Record<string, unknown>;
  newValues: Record<string, unknown>;
  status: 'pending' | 'approved' | 'rejected';
  createdBy: number;
  approvedBy?: number;
  createdAt: string;
  approvedAt?: string;
}

// ============================================
// BILL / INVOICE TYPES
// ============================================

export type BillType = 'company' | 'vendor';
export type PaymentStatus = 'unpaid' | 'partial' | 'paid' | 'overdue';
export type PaymentMethod = 'bank_transfer' | 'cash' | 'cheque' | 'card';

export interface Bill {
  id: number;
  invoice_number: string;
  bill_type: BillType;
  purchase_order_id?: number;
  orderNumber?: string;
  supplier_id: number;
  supplierName?: string;
  invoice_date: string;
  due_date?: string;
  invoice_amount: number;
  paid_amount: number;
  balance_due: number;
  payment_status: PaymentStatus;
  covers_company_bills?: number[];
  covers_purchase_orders?: number[];
  notes?: string;
  projectId?: number;
}

export interface VendorBillWithChildren extends Bill {
  childBills: Bill[];
  isExpanded: boolean;
  reconciliation: BillReconciliation;
}

export interface BillReconciliation {
  companyTotal: number;
  vendorAmount: number;
  difference: number;
  isMatched: boolean;
  coveredPOs: number;
  linkedBills: number;
  missingBills: number;
}

export interface GroupedBillsResult {
  groupedBills: VendorBillWithChildren[];
  orphanBills: Bill[];
}

export interface BillSummary {
  total: number;
  companyBills: number;
  vendorBills: number;
  unpaid: number;
  overdue: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
}

export interface PaymentData {
  amount: number;
  paymentMethod: PaymentMethod;
  reference: string;
  paymentDate: string;
  notes?: string;
}

// ============================================
// EXPENSE TYPES
// ============================================

export type ExpenseStatus = 'pending' | 'approved' | 'recorded' | 'rejected';

export interface PurchaseExpense {
  id: number;
  referenceId: number;
  referenceType: 'purchase_order';
  orderNumber?: string;
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  vendorName?: string;
  supplierName?: string;
  referenceNumber?: string;
  receiptNumber?: string;
  receiptPhoto?: string | null;
  notes?: string;
  status: ExpenseStatus;
  projectId?: number;
}

export interface ExpenseFormData {
  category: string;
  description: string;
  amount: number;
  expenseDate: string;
  vendor?: string;
  referenceNumber?: string;
  notes?: string;
  receiptPhoto?: string | null;
}

// ============================================
// COLLECTION TYPES
// ============================================

export type CollectionOrderStatus =
  | 'scheduled'
  | 'in_transit'
  | 'collecting'
  | 'completed'
  | 'cancelled';

export interface CollectionOrder {
  id: number;
  orderNumber: string;
  customerId?: number;
  customerName?: string;
  supplierId?: number;
  supplierName?: string;
  scheduledDate: string;
  status: CollectionOrderStatus;
  materials: CollectionMaterial[];
  totalWeight?: number;
  totalValue?: number;
  notes?: string;
  driverId?: number;
  vehicleId?: number;
  projectId?: number;
}

export interface CollectionMaterial {
  materialId: number;
  materialName: string;
  materialCode: string;
  estimatedQuantity: number;
  verifiedQuantity?: number;
  unit: string;
  unitPrice?: number;
}

export interface CollectionStatistics {
  pending: number;
  scheduled: number;
  inTransit: number;
  collecting: number;
  completed: number;
}

export interface CollectionDashboardData {
  activeCallouts: unknown[];
  recentOrders: CollectionOrder[];
  statistics: CollectionStatistics;
}

// ============================================
// PAGINATION TYPES
// ============================================

export interface PaginationParams {
  page: number;
  limit: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationState extends PaginationParams {
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination?: {
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  };
  error?: string;
}

// ============================================
// FILTER TYPES
// ============================================

export interface BillFilters {
  billType?: BillType | 'all';
  paymentStatus?: PaymentStatus | 'all';
  projectId?: number;
}

export interface OrderFilters extends PaginationParams {
  projectId?: number;
}

// ============================================
// STATUS CONFIGURATION
// ============================================

export interface StatusConfig {
  name: string;
  color: string;
}

export const ORDER_STATUS_CONFIG: Record<PurchaseOrderStatus, StatusConfig> = {
  draft: { name: 'Draft', color: '#6b7280' },
  pending: { name: 'Pending Approval', color: '#f59e0b' },
  approved: { name: 'Approved', color: '#10b981' },
  sent: { name: 'Sent to Vendor', color: '#3b82f6' },
  received: { name: 'Received', color: '#059669' },
  completed: { name: 'Completed', color: '#059669' },
  cancelled: { name: 'Cancelled', color: '#ef4444' }
};

export const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, StatusConfig> = {
  unpaid: { name: 'Unpaid', color: '#ef4444' },
  partial: { name: 'Partially Paid', color: '#f59e0b' },
  paid: { name: 'Paid', color: '#10b981' },
  overdue: { name: 'Overdue', color: '#dc2626' }
};

// ============================================
// VENDOR TYPES
// ============================================

export interface Vendor {
  id: number;
  name: string;
  vendorCode: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
}
