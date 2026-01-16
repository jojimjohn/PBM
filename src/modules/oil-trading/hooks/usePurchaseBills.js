/**
 * usePurchaseBills Hook
 * Manages purchase bills/invoices loading and operations
 *
 * Extracted from Purchase.jsx to improve composition
 *
 * @module hooks/usePurchaseBills
 */
import { useState, useCallback, useMemo, useRef } from 'react';
import purchaseInvoiceService from '../../../services/purchaseInvoiceService';
import { calculateBillSummary, groupBillsForDisplay } from '../utils/billUtils';

/**
 * @typedef {import('../types/purchase.types').Bill} Bill
 * @typedef {import('../types/purchase.types').BillFilters} BillFilters
 * @typedef {import('../types/purchase.types').BillSummary} BillSummary
 * @typedef {import('../types/purchase.types').GroupedBillsResult} GroupedBillsResult
 * @typedef {import('../types/purchase.types').PaymentData} PaymentData
 */

/**
 * @typedef {Object} UsePurchaseBillsOptions
 * @property {Function} [getProjectQueryParam] - Function to get project filter params
 */

/**
 * @typedef {Object} UsePurchaseBillsReturn
 * @property {Bill[]} bills - Array of bills
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message if any
 * @property {BillSummary} summary - Bill summary statistics
 * @property {GroupedBillsResult} groupedBills - Bills grouped for display
 * @property {BillFilters} filters - Current filter state
 * @property {Function} loadBills - Load bills with filters
 * @property {Function} setFilters - Update filter values
 * @property {Function} recordPayment - Record a payment on a bill
 * @property {Function} createVendorBill - Create a new vendor bill
 * @property {Function} updateBill - Update an existing bill
 * @property {Function} updateCompanyBillStatus - Update company bill status
 */

/**
 * Hook for managing purchase bills
 *
 * @param {UsePurchaseBillsOptions} [options={}] - Hook options
 * @returns {UsePurchaseBillsReturn} Bills state and actions
 */
export function usePurchaseBills(options = {}) {
  const { getProjectQueryParam = () => ({}) } = options;

  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    billType: 'all',
    paymentStatus: 'all'
  });

  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0);

  /**
   * Load bills with current filters
   */
  const loadBills = useCallback(async (customFilters = null) => {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const projectParams = getProjectQueryParam();
      const currentFilters = customFilters || filters;

      const apiFilters = {
        ...projectParams
      };

      if (currentFilters.billType !== 'all') {
        apiFilters.billType = currentFilters.billType;
      }
      if (currentFilters.paymentStatus !== 'all') {
        apiFilters.paymentStatus = currentFilters.paymentStatus;
      }

      const result = await purchaseInvoiceService.getAll(apiFilters);

      // Ignore if a newer request has been made
      if (thisRequestId !== requestIdRef.current) return;

      if (result.success) {
        setBills(result.data || []);
      } else {
        setBills([]);
        setError(result.error || 'Failed to load bills');
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setBills([]);
      setError(err instanceof Error ? err.message : 'Failed to load bills');
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [filters, getProjectQueryParam]);

  /**
   * Record a payment on a bill
   */
  const recordPayment = useCallback(async (billId, paymentData) => {
    const result = await purchaseInvoiceService.recordPayment(billId, paymentData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to record payment');
    }
    // Reload bills to get updated payment status
    await loadBills();
    return result.data;
  }, [loadBills]);

  /**
   * Create a new vendor bill
   */
  const createVendorBill = useCallback(async (billData) => {
    const result = await purchaseInvoiceService.createVendorBill(billData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to create vendor bill');
    }
    await loadBills();
    return result.data;
  }, [loadBills]);

  /**
   * Update an existing bill
   */
  const updateBill = useCallback(async (billId, updateData) => {
    const result = await purchaseInvoiceService.update(billId, updateData);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update bill');
    }
    await loadBills();
    return result.data;
  }, [loadBills]);

  /**
   * Update company bill status (e.g., mark as sent)
   */
  const updateCompanyBillStatus = useCallback(async (billId, status) => {
    const result = await purchaseInvoiceService.updateCompanyBillStatus(billId, status);
    if (!result.success) {
      throw new Error(result.error || 'Failed to update bill status');
    }
    await loadBills();
    return result.data;
  }, [loadBills]);

  /**
   * Update filter values
   */
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Memoized bill summary
  const summary = useMemo(() => calculateBillSummary(bills), [bills]);

  // Memoized grouped bills
  const groupedBills = useMemo(() => groupBillsForDisplay(bills), [bills]);

  return {
    bills,
    loading,
    error,
    summary,
    groupedBills,
    filters,
    loadBills,
    setFilters: updateFilters,
    recordPayment,
    createVendorBill,
    updateBill,
    updateCompanyBillStatus
  };
}

export default usePurchaseBills;
