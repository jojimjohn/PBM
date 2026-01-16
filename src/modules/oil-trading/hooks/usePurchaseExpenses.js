/**
 * usePurchaseExpenses Hook
 * Manages purchase expense loading and CRUD operations
 *
 * Extracted from Purchase.jsx to improve composition
 *
 * @module hooks/usePurchaseExpenses
 */
import { useState, useCallback, useRef } from 'react';
import expenseService from '../../../services/expenseService';
import purchaseOrderExpenseService from '../../../services/purchaseOrderExpenseService';

/**
 * @typedef {import('../types/purchase.types').PurchaseExpense} PurchaseExpense
 * @typedef {import('../types/purchase.types').ExpenseFormData} ExpenseFormData
 * @typedef {import('../types/purchase.types').PurchaseOrder} PurchaseOrder
 */

/**
 * @typedef {Object} UsePurchaseExpensesOptions
 * @property {Function} [getProjectQueryParam] - Function to get project filter params
 */

/**
 * @typedef {Object} UsePurchaseExpensesReturn
 * @property {PurchaseExpense[]} expenses - Array of purchase expenses
 * @property {boolean} loading - Loading state
 * @property {string|null} error - Error message if any
 * @property {Function} loadExpenses - Load expenses from server
 * @property {Function} createExpense - Create a new expense
 * @property {Function} deleteExpense - Delete an expense
 * @property {Function} uploadReceipt - Upload receipt for expense
 * @property {Function} removeReceipt - Remove receipt from expense
 * @property {Function} normalizeExpenses - Normalize expense data with order info
 * @property {Function} setExpenses - Direct setter for expenses
 */

/**
 * Hook for managing purchase expenses
 *
 * @param {UsePurchaseExpensesOptions} [options={}] - Hook options
 * @returns {UsePurchaseExpensesReturn} Expenses state and actions
 */
export function usePurchaseExpenses(options = {}) {
  const { getProjectQueryParam = () => ({}) } = options;

  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Track request ID to prevent race conditions
  const requestIdRef = useRef(0);

  /**
   * Normalize expense data with order information
   *
   * @param {Object[]} rawExpenses - Raw expense data from API
   * @param {PurchaseOrder[]} orders - Purchase orders for reference
   * @returns {PurchaseExpense[]} Normalized expenses
   */
  const normalizeExpenses = useCallback((rawExpenses, orders = []) => {
    return rawExpenses.map(expense => {
      const po = orders.find(p => p.id === expense.referenceId);
      return {
        ...expense,
        orderNumber: po?.orderNumber || expense.orderNumber || `PO #${expense.referenceId}`,
        vendor: expense.vendor || expense.vendorName || expense.supplierName || '',
        status: expense.status || (expense.referenceType === 'purchase_order' ? 'recorded' : 'pending')
      };
    });
  }, []);

  /**
   * Load purchase expenses from server
   *
   * @param {PurchaseOrder[]} [orders=[]] - Purchase orders for normalization
   */
  const loadExpenses = useCallback(async (orders = []) => {
    const thisRequestId = ++requestIdRef.current;

    try {
      setLoading(true);
      setError(null);

      const projectParams = getProjectQueryParam();

      const result = await expenseService.getAll({
        expenseType: 'purchase',
        ...projectParams
      });

      // Ignore if a newer request has been made
      if (thisRequestId !== requestIdRef.current) return;

      if (result.success) {
        const normalized = normalizeExpenses(result.data || [], orders);
        setExpenses(normalized);
      } else {
        setExpenses([]);
        setError(result.error || 'Failed to load expenses');
      }
    } catch (err) {
      if (thisRequestId !== requestIdRef.current) return;
      setExpenses([]);
      setError(err instanceof Error ? err.message : 'Failed to load expenses');
    } finally {
      if (thisRequestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  }, [getProjectQueryParam, normalizeExpenses]);

  /**
   * Create expense(s) for a purchase order
   *
   * @param {number} orderId - Purchase order ID
   * @param {ExpenseFormData|{expenses: ExpenseFormData[]}} expenseData - Expense data
   * @param {PurchaseOrder} [order] - Order for reference info
   */
  const createExpense = useCallback(async (orderId, expenseData, order = null) => {
    const expenseList = expenseData.expenses || [expenseData];
    const savedExpenses = [];

    for (const expense of expenseList) {
      const result = await purchaseOrderExpenseService.createExpense(orderId, {
        category: expense.category,
        description: expense.description,
        amount: parseFloat(expense.amount),
        expenseDate: expense.expenseDate || new Date().toISOString().split('T')[0],
        vendor: expense.vendor || '',
        referenceNumber: expense.receiptNumber || expense.referenceNumber || '',
        notes: expense.notes || '',
        receiptPhoto: expense.receiptPhoto || null
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create expense');
      }

      savedExpenses.push({
        ...result.data,
        orderNumber: order?.orderNumber || `PO #${orderId}`
      });
    }

    setExpenses(prev => [...prev, ...savedExpenses]);
    return savedExpenses;
  }, []);

  /**
   * Delete an expense
   *
   * @param {number} expenseId - Expense ID to delete
   */
  const deleteExpense = useCallback(async (expenseId) => {
    const result = await purchaseOrderExpenseService.deleteExpense(expenseId);
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete expense');
    }
    setExpenses(prev => prev.filter(e => e.id !== expenseId));
  }, []);

  /**
   * Upload receipt for an expense
   *
   * @param {number} expenseId - Expense ID
   * @param {string} receiptData - Receipt data (base64 or URL)
   */
  const uploadReceipt = useCallback(async (expenseId, receiptData) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    const result = await purchaseOrderExpenseService.updateExpense(expenseId, {
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      vendor: expense.vendor || '',
      referenceNumber: expense.receiptNumber || '',
      notes: expense.notes || '',
      receiptPhoto: receiptData
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload receipt');
    }

    setExpenses(prev => prev.map(e =>
      e.id === expenseId ? { ...e, receiptPhoto: receiptData } : e
    ));

    return result.data;
  }, [expenses]);

  /**
   * Remove receipt from an expense
   *
   * @param {number} expenseId - Expense ID
   */
  const removeReceipt = useCallback(async (expenseId) => {
    const expense = expenses.find(e => e.id === expenseId);
    if (!expense) {
      throw new Error('Expense not found');
    }

    const result = await purchaseOrderExpenseService.updateExpense(expenseId, {
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: expense.expenseDate,
      vendor: expense.vendor || '',
      referenceNumber: expense.receiptNumber || '',
      notes: expense.notes || '',
      receiptPhoto: null
    });

    if (!result.success) {
      throw new Error(result.error || 'Failed to remove receipt');
    }

    setExpenses(prev => prev.map(e =>
      e.id === expenseId ? { ...e, receiptPhoto: null } : e
    ));

    return result.data;
  }, [expenses]);

  return {
    expenses,
    loading,
    error,
    loadExpenses,
    createExpense,
    deleteExpense,
    uploadReceipt,
    removeReceipt,
    normalizeExpenses,
    setExpenses
  };
}

export default usePurchaseExpenses;
