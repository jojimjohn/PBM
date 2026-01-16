/**
 * Wastage Module Type Definitions
 *
 * Defines all data structures used in the wastage management system.
 * These types ensure type safety across components and hooks.
 */

// ─────────────────────────────────────────────────────────────
// Core Entity Types
// ─────────────────────────────────────────────────────────────

export type WastageStatus = 'pending' | 'approved' | 'rejected' | 'amended';

export type WastageSource = 'manual' | 'collection' | 'wcn_finalization';

export interface WastageType {
  id: string;
  name: string;
  description?: string;
  requiresApproval: boolean;
}

export interface Material {
  id: string;
  name: string;
  unit: string;
  currentStock?: number;
  minStockLevel?: number;
}

export interface User {
  id: string;
  name: string;
  email?: string;
  role?: string;
}

export interface Attachment {
  id: string;
  filename: string;
  url: string;
  uploadedAt: string;
  fileSize?: number;
  mimeType?: string;
}

// ─────────────────────────────────────────────────────────────
// Wastage Record Types
// ─────────────────────────────────────────────────────────────

export interface WastageRecord {
  id: string;
  wastageDate: string;
  materialId: string;
  materialName: string;
  materialUnit: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  wastageTypeId: string;
  wastageTypeName: string;
  reason: string;
  status: WastageStatus;
  source: WastageSource;
  collectionOrderId?: string;
  collectionOrderNumber?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  approvedBy?: string;
  approvedByName?: string;
  approvedAt?: string;
  rejectionReason?: string;
  attachments?: Attachment[];
  notes?: string;
}

export interface WastageFormData {
  wastageDate: string;
  materialId: string;
  quantity: string | number;
  unitCost: string | number;
  wastageTypeId: string;
  reason: string;
  collectionOrderId?: string;
  notes?: string;
  attachments?: File[];
  existingAttachments?: string[];
}

export interface WastageFormErrors {
  wastageDate?: string;
  materialId?: string;
  quantity?: string;
  unitCost?: string;
  wastageTypeId?: string;
  reason?: string;
  general?: string;
}

// ─────────────────────────────────────────────────────────────
// API Response Types
// ─────────────────────────────────────────────────────────────

export interface WastageListResponse {
  success: boolean;
  data: WastageRecord[];
  pagination?: PaginationInfo;
  message?: string;
}

export interface WastageSingleResponse {
  success: boolean;
  data: WastageRecord;
  message?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// ─────────────────────────────────────────────────────────────
// Filter & Query Types
// ─────────────────────────────────────────────────────────────

export interface WastageFilters {
  status: WastageStatus | 'all';
  materialId: string | 'all';
  wastageTypeId: string | 'all';
  dateFrom: string;
  dateTo: string;
  searchTerm: string;
}

export interface WastageQueryParams {
  page?: number;
  limit?: number;
  status?: WastageStatus;
  materialId?: string;
  wastageTypeId?: string;
  startDate?: string;
  endDate?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  projectId?: string;
}

// ─────────────────────────────────────────────────────────────
// Analytics Types
// ─────────────────────────────────────────────────────────────

export interface WastageAnalytics {
  summary: WastageSummary;
  byType: WastageByType[];
  byMaterial: WastageByMaterial[];
  monthlyTrends: MonthlyTrend[];
}

export interface WastageSummary {
  totalRecords: number;
  totalQuantity: number;
  totalCost: number;
  pendingCount: number;
  pendingCost: number;
  approvedCount: number;
  approvedCost: number;
  rejectedCount: number;
}

export interface WastageByType {
  wastageTypeId: string;
  wastageTypeName: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
  percentage: number;
}

export interface WastageByMaterial {
  materialId: string;
  materialName: string;
  count: number;
  totalQuantity: number;
  totalCost: number;
  unit: string;
}

export interface MonthlyTrend {
  month: string;
  year: number;
  count: number;
  totalCost: number;
  avgCostPerRecord: number;
}

// ─────────────────────────────────────────────────────────────
// Component Props Types
// ─────────────────────────────────────────────────────────────

export interface WastageFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: WastageFormData) => Promise<void>;
  editingWastage?: WastageRecord | null;
  materials: Material[];
  wastageTypes: WastageType[];
  collections?: CollectionOrderSummary[];
}

export interface WastageDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  wastage: WastageRecord | null;
  onApprove?: (id: string, notes?: string) => Promise<void>;
  onReject?: (id: string, reason: string) => Promise<void>;
  canApprove?: boolean;
  onStatusChange?: () => void;
}

export interface WastageAnalyticsProps {
  isOpen: boolean;
  onClose: () => void;
  dateRange?: { start: string; end: string };
}

export interface CollectionOrderSummary {
  id: string;
  orderNumber: string;
  supplierName: string;
  collectionDate: string;
  status: string;
}

// ─────────────────────────────────────────────────────────────
// Hook Return Types
// ─────────────────────────────────────────────────────────────

export interface UseWastagesReturn {
  wastages: WastageRecord[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationInfo | null;
  materials: Material[];
  wastageTypes: WastageType[];
  refresh: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
  loadWithParams: (params: WastageQueryParams) => Promise<void>;
}

export interface UseWastageFormReturn {
  formData: WastageFormData;
  errors: WastageFormErrors;
  isSubmitting: boolean;
  isDirty: boolean;
  setField: <K extends keyof WastageFormData>(field: K, value: WastageFormData[K]) => void;
  setErrors: (errors: WastageFormErrors) => void;
  validate: () => boolean;
  reset: (initialData?: Partial<WastageFormData>) => void;
  submit: () => Promise<boolean>;
}

export interface UseWastageFiltersReturn {
  filters: WastageFilters;
  setFilter: <K extends keyof WastageFilters>(key: K, value: WastageFilters[K]) => void;
  resetFilters: () => void;
  getQueryParams: () => WastageQueryParams;
  hasActiveFilters: boolean;
}

export interface UseWastageApprovalReturn {
  isApproving: boolean;
  isRejecting: boolean;
  approve: (id: string, notes?: string) => Promise<boolean>;
  reject: (id: string, reason: string) => Promise<boolean>;
  error: string | null;
  clearError: () => void;
}

// ─────────────────────────────────────────────────────────────
// Summary Card Types
// ─────────────────────────────────────────────────────────────

export interface WastageSummaryCardData {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalCost: number;
  pendingCost: number;
}

// ─────────────────────────────────────────────────────────────
// Status Configuration
// ─────────────────────────────────────────────────────────────

export interface StatusConfig {
  icon: React.ComponentType<{ className?: string }>;
  className: string;
  label: string;
}

export type StatusConfigMap = Record<WastageStatus, StatusConfig>;
