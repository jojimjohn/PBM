/**
 * usePurchaseOrders Hook
 * Manages purchase orders loading, pagination, and CRUD operations
 *
 * Extracted from Purchase.jsx to improve composition
 *
 * @module hooks/usePurchaseOrders
 */
import { useState, useCallback, useRef } from 'react';
import purchaseOrderService from '../../../services/purchaseOrderService';
import purchaseOrderAmendmentService from '../../../services/purchaseOrderAmendmentService';
import dataCacheService from '../../../services/dataCacheService';

/**
 * @typedef {import('../types/purchase.types').PurchaseOrder} PurchaseOrder
 * @typedef {import('../types/purchase.types').PaginationState} PaginationState
 * @typedef {import('../types/purchase.types').Vendor} Vendor
 */

/**
 * @typedef {Object} UsePurchaseOrdersOptions
 * @property {number} [initialLimit=10] - Initial items per page
 * @property {string} [initialSearch=''] - Initial search term
 * @property {Function} [getProjectQueryParam] - Function to get project filter params
 */

/**
 * @typedef {Object} UsePurchaseOrdersReturn
 * @property {PurchaseOrder[]} orders - Array of purchase orders
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message if any
 * @property {PaginationState} pagination - Pagination state
 * @property {Object} amendmentCounts - Map of orderId -> amendment count
 * @property {Vendor[]} vendors - List of vendors/suppliers
 * @property {Object[]} materials - List of materials
 * @property {Object} orderStatuses - Order status configuration
 * @property {Function} loadOrders - Load orders with pagination
 * @property {Function} loadFullData - Load all purchase data
 * @property {Function} createOrder - Create a new order
 * @property {Function} updateOrder - Update an existing order
 * @property {Function} getOrderDetails - Get full order details
 * @property {Function} receiveOrder - Mark order as received
 * @property {Function} setOrders - Direct setter for orders
 * @property {Function} updatePagination - Update pagination params
 */

const DEFAULT_ORDER_STATUSES = {
  draft: { name: 'Draft', color: '#6b7280' },
  pending: { name: 'Pending Approval', color: '#f59e0b' },
  approved: { name: 'Approved', color: '#10b981' },
  sent: { name: 'Sent to Vendor', color: '#3b82f6' },
  received: { name: 'Received', color: '#059669' },
  completed: { name: 'Completed', color: '#059669' },
  cancelled: { name: 'Cancelled', color: '#ef4444' }
};

/**
 * Hook for managing purchase orders
 *
 * @param {UsePurchaseOrdersOptions} [options={}] - Hook options
 * @returns {UsePurchaseOrdersReturn} Purchase orders state and actions
 */
export function usePurchaseOrders(options = {}) {
  const {
    initialLimit = 10,
    initialSearch = '',
    getProjectQueryParam = () => ({})
  } = options;

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [amendmentCounts, setAmendmentCounts] = useState({});
  const [vendors, setVendors] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [orderStatuses] = useState(DEFAULT_ORDER_STATUSES);

  const [pagination, setPagination] = useState({
    page: 1,
    limit: initialLimit,
    total: 0,
    totalPages: 0,
    search: initialSearch,
    sortBy: 'created_at',
    sortOrder: 'desc',
    status: ''
  });

  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0);

  /**
   * Load purchase orders with server-side pagination
   */
  const loadOrders = useCallback(async (paginationParams = {}) => {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const projectParams = getProjectQueryParam();

      const params = {
        page: paginationParams.page ?? pagination.page,
        limit: paginationParams.limit ?? pagination.limit,
        search: paginationParams.search ?? pagination.search,
        status: paginationParams.status ?? pagination.status,
        sortBy: paginationParams.sortBy ?? pagination.sortBy,
        sortOrder: paginationParams.sortOrder ?? pagination.sortOrder,
        ...projectParams
      };

      const result = await purchaseOrderService.getAll(params);

      // Ignore if a newer request has been made
      if (thisRequestId !== requestIdRef.current) return;

      if (result.success) {
        setOrders(result.data || []);
        if (result.pagination) {
          setPagination(prev => ({
            ...prev,
            ...params,
            total: result.pagination.total || 0,
            totalPages: result.pagination.totalPages || 0
          }));
        }
      } else {
        setOrders([]);
        setError(result.error || 'Failed to load orders');
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setOrders([]);
      setError(err instanceof Error ? err.message : 'Failed to load orders');
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pagination, getProjectQueryParam]);

  /**
   * Load all purchase-related data (orders, vendors, materials, amendments)
   */
  const loadFullData = useCallback(async () => {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const projectParams = getProjectQueryParam();

      const [
        ordersResult,
        countsResult,
        suppliersData,
        materialsData
      ] = await Promise.all([
        purchaseOrderService.getAll({
          page: pagination.page,
          limit: pagination.limit,
          search: pagination.search,
          status: pagination.status,
          sortBy: pagination.sortBy,
          sortOrder: pagination.sortOrder,
          ...projectParams
        }),
        purchaseOrderAmendmentService.getAllCounts().catch(() => ({ success: false, data: {} })),
        dataCacheService.getSuppliers().catch(() => []),
        dataCacheService.getMaterials().catch(() => [])
      ]);

      if (thisRequestId !== requestIdRef.current) return;

      // Process orders
      if (ordersResult.success) {
        setOrders(ordersResult.data || []);
        if (ordersResult.pagination) {
          setPagination(prev => ({
            ...prev,
            total: ordersResult.pagination.total || 0,
            totalPages: ordersResult.pagination.totalPages || 0
          }));
        }
      }

      // Process amendment counts
      if (countsResult.success && countsResult.data) {
        setAmendmentCounts(countsResult.data);
      }

      // Process suppliers as vendors - filter out inactive ones and include all relevant fields
      const supplierVendors = (suppliersData || [])
        .filter(supplier => supplier.isActive !== false && supplier.isActive !== 0)
        .map(supplier => ({
          id: supplier.id,
          name: supplier.name,
          vendorCode: supplier.supplierCode || `VEN-${supplier.id.toString().padStart(3, '0')}`,
          contactPerson: supplier.contactPerson,
          phone: supplier.phone,
          email: supplier.email,
          paymentTermDays: supplier.paymentTermDays,
          isActive: supplier.isActive
        }));
      setVendors(supplierVendors);

      // Process materials
      setMaterials(materialsData || []);

    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [pagination, getProjectQueryParam]);

  /**
   * Get full order details by ID
   */
  const getOrderDetails = useCallback(async (orderId) => {
    const result = await purchaseOrderService.getById(orderId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to load order details');
    }
    return result.data;
  }, []);

  /**
   * Create a new purchase order
   */
  const createOrder = useCallback(async (orderData) => {
    const result = await purchaseOrderService.create(orderData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create order');
    }
    setOrders(prev => [...prev, result.data]);
    return result.data;
  }, []);

  /**
   * Update an existing purchase order
   */
  const updateOrder = useCallback(async (orderId, orderData) => {
    const result = await purchaseOrderService.update(orderId, orderData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update order');
    }
    setOrders(prev => prev.map(order =>
      order.id === orderId ? { ...result.data } : order
    ));
    return result.data;
  }, []);

  /**
   * Receive a purchase order (updates inventory)
   */
  const receiveOrder = useCallback(async (orderId, receiptData) => {
    const result = await purchaseOrderService.receive(orderId, receiptData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to receive order');
    }
    setOrders(prev => prev.map(order =>
      order.id === orderId
        ? { ...order, status: 'received', actualDeliveryDate: new Date().toISOString() }
        : order
    ));
    return result.data;
  }, []);

  /**
   * Update pagination parameters
   */
  const updatePagination = useCallback((params) => {
    setPagination(prev => ({ ...prev, ...params }));
  }, []);

  return {
    orders,
    loading,
    error,
    pagination,
    amendmentCounts,
    vendors,
    materials,
    orderStatuses,
    loadOrders,
    loadFullData,
    createOrder,
    updateOrder,
    getOrderDetails,
    receiveOrder,
    setOrders,
    updatePagination
  };
}

export default usePurchaseOrders;
