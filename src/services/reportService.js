/**
 * Report Service
 *
 * Provides API methods for reports and analytics:
 * - Purchase Cost Analysis
 * - WCN Register
 * - Collection Expenses
 * - Vendor Bill Tracking
 *
 * All reports support:
 * - Date range filtering
 * - Pagination
 * - Export to CSV/XLSX
 */

import authService from './authService';

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

/**
 * Build query string from params, filtering out empty values
 */
const buildQueryString = (params) => {
  const filtered = Object.entries(params).reduce((acc, [key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      acc[key] = value;
    }
    return acc;
  }, {});
  return new URLSearchParams(filtered).toString();
};

/**
 * Handle file download from blob response
 */
const downloadFile = async (url, filename) => {
  try {
    const token = authService.getToken();
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    const blob = await response.blob();
    const downloadUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(downloadUrl);

    return { success: true };
  } catch (error) {
    console.error('Download error:', error);
    return { success: false, error: error.message };
  }
};

const reportService = {
  // ========================================================================
  // PURCHASE COST ANALYSIS
  // ========================================================================

  /**
   * Get Purchase Cost Analysis Report
   * Shows purchase orders with collection expense attribution
   *
   * @param {Object} params - Query parameters
   * @param {string} params.from_date - Start date (YYYY-MM-DD)
   * @param {string} params.to_date - End date (YYYY-MM-DD)
   * @param {number} params.supplier_id - Filter by supplier
   * @param {number} params.page - Page number
   * @param {number} params.limit - Records per page
   * @param {string} params.sort_by - Sort column
   * @param {string} params.sort_order - Sort direction (asc/desc)
   */
  getPurchaseCostReport: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const data = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/reports/purchase-cost?${queryString}`
      );
      return { success: true, ...data };
    } catch (error) {
      console.error('Purchase Cost Report Error:', error);
      return { success: false, error: error.message || 'Failed to fetch report' };
    }
  },

  /**
   * Export Purchase Cost Report to CSV or XLSX
   */
  exportPurchaseCost: async (params = {}, format = 'csv') => {
    const queryString = buildQueryString({ ...params, format });
    const filename = `Purchase_Cost_Analysis_${params.from_date || 'all'}_to_${params.to_date || 'now'}.${format}`;
    return downloadFile(`${BASE_URL}/reports/purchase-cost/export?${queryString}`, filename);
  },

  // ========================================================================
  // WCN REGISTER
  // ========================================================================

  /**
   * Get WCN Register Report
   * Shows collection orders with WCN status and linked PO info
   *
   * @param {Object} params - Query parameters
   * @param {string} params.from_date - Start date
   * @param {string} params.to_date - End date
   * @param {number} params.supplier_id - Filter by supplier
   * @param {string} params.status - Filter by status (finalized/pending/all)
   */
  getWcnRegisterReport: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const data = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/reports/wcn-register?${queryString}`
      );
      return { success: true, ...data };
    } catch (error) {
      console.error('WCN Register Report Error:', error);
      return { success: false, error: error.message || 'Failed to fetch report' };
    }
  },

  /**
   * Export WCN Register to CSV or XLSX
   */
  exportWcnRegister: async (params = {}, format = 'csv') => {
    const queryString = buildQueryString({ ...params, format });
    const filename = `WCN_Register_${params.from_date || 'all'}_to_${params.to_date || 'now'}.${format}`;
    return downloadFile(`${BASE_URL}/reports/wcn-register/export?${queryString}`, filename);
  },

  // ========================================================================
  // COLLECTION EXPENSES
  // ========================================================================

  /**
   * Get Collection Expenses Report
   * Shows expense breakdown by category with monthly trends
   *
   * @param {Object} params - Query parameters
   * @param {string} params.from_date - Start date
   * @param {string} params.to_date - End date
   * @param {number} params.supplier_id - Filter by supplier
   * @param {string} params.category - Filter by expense category
   */
  getCollectionExpensesReport: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const data = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/reports/collection-expenses?${queryString}`
      );
      return { success: true, ...data };
    } catch (error) {
      console.error('Collection Expenses Report Error:', error);
      return { success: false, error: error.message || 'Failed to fetch report' };
    }
  },

  /**
   * Export Collection Expenses to CSV or XLSX
   */
  exportCollectionExpenses: async (params = {}, format = 'csv') => {
    const queryString = buildQueryString({ ...params, format });
    const filename = `Collection_Expenses_${params.from_date || 'all'}_to_${params.to_date || 'now'}.${format}`;
    return downloadFile(`${BASE_URL}/reports/collection-expenses/export?${queryString}`, filename);
  },

  // ========================================================================
  // VENDOR BILL TRACKING
  // ========================================================================

  /**
   * Get Vendor Bill Tracking Report
   * Shows vendor bills with payment status and multi-PO coverage
   *
   * @param {Object} params - Query parameters
   * @param {string} params.from_date - Start date
   * @param {string} params.to_date - End date
   * @param {number} params.supplier_id - Filter by supplier
   * @param {string} params.payment_status - Filter by status (paid/unpaid/partial/overdue/all)
   * @param {string} params.bill_type - Filter by type (company/vendor/all)
   */
  getVendorBillsReport: async (params = {}) => {
    try {
      const queryString = buildQueryString(params);
      const data = await authService.makeAuthenticatedRequest(
        `${BASE_URL}/reports/vendor-bills?${queryString}`
      );
      return { success: true, ...data };
    } catch (error) {
      console.error('Vendor Bills Report Error:', error);
      return { success: false, error: error.message || 'Failed to fetch report' };
    }
  },

  /**
   * Export Vendor Bills to CSV or XLSX
   */
  exportVendorBills: async (params = {}, format = 'csv') => {
    const queryString = buildQueryString({ ...params, format });
    const filename = `Vendor_Bills_${params.from_date || 'all'}_to_${params.to_date || 'now'}.${format}`;
    return downloadFile(`${BASE_URL}/reports/vendor-bills/export?${queryString}`, filename);
  },

  // ========================================================================
  // UTILITIES
  // ========================================================================

  /**
   * Get date range preset values
   * Returns { from, to } dates for common presets
   */
  getDateRangePreset: (preset) => {
    const today = new Date();
    const formatDate = (date) => date.toISOString().split('T')[0];

    switch (preset) {
      case 'today':
        return { from: formatDate(today), to: formatDate(today) };

      case 'this_week': {
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay());
        return { from: formatDate(startOfWeek), to: formatDate(today) };
      }

      case 'this_month': {
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        return { from: formatDate(startOfMonth), to: formatDate(today) };
      }

      case 'last_month': {
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);
        return { from: formatDate(startOfLastMonth), to: formatDate(endOfLastMonth) };
      }

      case 'this_quarter': {
        const quarter = Math.floor(today.getMonth() / 3);
        const startOfQuarter = new Date(today.getFullYear(), quarter * 3, 1);
        return { from: formatDate(startOfQuarter), to: formatDate(today) };
      }

      case 'this_year': {
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        return { from: formatDate(startOfYear), to: formatDate(today) };
      }

      default: {
        // Default: last 30 days
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(today.getDate() - 30);
        return { from: formatDate(thirtyDaysAgo), to: formatDate(today) };
      }
    }
  },

  /**
   * Get available expense categories
   */
  getExpenseCategories: () => [
    { value: 'fuel', label: 'Fuel' },
    { value: 'transportation', label: 'Transportation' },
    { value: 'loading_unloading', label: 'Loading/Unloading' },
    { value: 'permits_fees', label: 'Permits & Fees' },
    { value: 'equipment_rental', label: 'Equipment Rental' },
    { value: 'meals_accommodation', label: 'Meals & Accommodation' },
    { value: 'maintenance', label: 'Maintenance' },
    { value: 'other', label: 'Other' }
  ],

  /**
   * Get payment status options
   */
  getPaymentStatusOptions: () => [
    { value: 'all', label: 'All Statuses' },
    { value: 'paid', label: 'Paid' },
    { value: 'unpaid', label: 'Unpaid' },
    { value: 'partial', label: 'Partial' },
    { value: 'overdue', label: 'Overdue' }
  ],

  /**
   * Get bill type options
   */
  getBillTypeOptions: () => [
    { value: 'all', label: 'All Types' },
    { value: 'company', label: 'Company Bill' },
    { value: 'vendor', label: 'Vendor Bill' }
  ]
};

export default reportService;
