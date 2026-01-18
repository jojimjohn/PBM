/**
 * Reports & Analytics Page
 *
 * Provides access to business reports:
 * - Purchase Cost Analysis
 * - WCN Register
 * - Collection Expenses
 * - Vendor Bill Tracking
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { usePermissions } from '../hooks/usePermissions';
import { PERMISSIONS } from '../config/roles';
import reportService from '../services/reportService';
import supplierService from '../services/supplierService';
import {
  BarChart3,
  Banknote,
  FileText,
  Truck,
  Receipt,
  Calendar,
  Download,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Package,
  CheckCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// Chart colors
const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

// Local date formatter (LocalizationContext doesn't export formatDate)
const formatDate = (dateString) => {
  if (!dateString) return '-';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const Reports = () => {
  const { user } = useAuth();
  const { t, formatCurrency, isRTL } = useLocalization();
  const { hasPermission } = usePermissions();

  // Report selection
  const [activeReport, setActiveReport] = useState('purchase-cost');

  // Filter state
  const [dateRange, setDateRange] = useState(() => {
    const defaultRange = reportService.getDateRangePreset('this_month');
    return { from: defaultRange.from, to: defaultRange.to };
  });
  const [datePreset, setDatePreset] = useState('this_month');
  const [supplierId, setSupplierId] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('all');
  const [billTypeFilter, setBillTypeFilter] = useState('all');

  // Data state
  const [reportData, setReportData] = useState(null);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState(null);

  // Export dropdown
  const [showExportMenu, setShowExportMenu] = useState(false);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  // Report definitions
  const reports = [
    {
      id: 'purchase-cost',
      name: 'Purchase Cost Analysis',
      icon: Banknote,
      description: 'Purchase costs with collection expenses',
      permission: PERMISSIONS.VIEW_PURCHASE
    },
    {
      id: 'wcn-register',
      name: 'WCN Register',
      icon: FileText,
      description: 'Waste consignment notes tracking',
      permission: PERMISSIONS.VIEW_COLLECTIONS
    },
    {
      id: 'collection-expenses',
      name: 'Collection Expenses',
      icon: Truck,
      description: 'Expense breakdown and trends',
      permission: PERMISSIONS.VIEW_COLLECTIONS
    },
    {
      id: 'vendor-bills',
      name: 'Vendor Bill Tracking',
      icon: Receipt,
      description: 'Invoice status and payments',
      permission: PERMISSIONS.VIEW_PURCHASE
    }
  ];

  // Date presets
  const datePresets = [
    { value: 'today', label: 'Today' },
    { value: 'this_week', label: 'This Week' },
    { value: 'this_month', label: 'This Month' },
    { value: 'last_month', label: 'Last Month' },
    { value: 'this_quarter', label: 'This Quarter' },
    { value: 'this_year', label: 'This Year' },
    { value: 'custom', label: 'Custom Range' }
  ];

  // Load suppliers on mount
  useEffect(() => {
    const loadSuppliers = async () => {
      try {
        const result = await supplierService.getAll();
        if (result.success) {
          setSuppliers(result.data || []);
        }
      } catch (err) {
        console.error('Failed to load suppliers:', err);
      }
    };
    loadSuppliers();
  }, []);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    setLoading(true);
    setError(null);

    const params = {
      from_date: dateRange.from,
      to_date: dateRange.to,
      supplier_id: supplierId || undefined,
      page,
      limit
    };

    try {
      let result;
      switch (activeReport) {
        case 'purchase-cost':
          result = await reportService.getPurchaseCostReport(params);
          break;
        case 'wcn-register':
          result = await reportService.getWcnRegisterReport({ ...params, status: statusFilter });
          break;
        case 'collection-expenses':
          result = await reportService.getCollectionExpensesReport({ ...params, category: categoryFilter || undefined });
          break;
        case 'vendor-bills':
          result = await reportService.getVendorBillsReport({
            ...params,
            payment_status: paymentStatusFilter,
            bill_type: billTypeFilter
          });
          break;
        default:
          result = { success: false, error: 'Unknown report type' };
      }

      if (result.success) {
        setReportData(result.data);
      } else {
        setError(result.error || 'Failed to fetch report');
      }
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [activeReport, dateRange, supplierId, statusFilter, categoryFilter, paymentStatusFilter, billTypeFilter, page, limit]);

  // Fetch report when filters change
  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle date preset change
  const handleDatePresetChange = (preset) => {
    setDatePreset(preset);
    if (preset !== 'custom') {
      const range = reportService.getDateRangePreset(preset);
      setDateRange(range);
    }
    setPage(1);
  };

  // Handle export
  const handleExport = async (format) => {
    setExporting(true);
    setShowExportMenu(false);
    try {
      const params = {
        from_date: dateRange.from,
        to_date: dateRange.to,
        supplier_id: supplierId || undefined
      };

      let result;
      switch (activeReport) {
        case 'purchase-cost':
          result = await reportService.exportPurchaseCost(params, format);
          break;
        case 'wcn-register':
          result = await reportService.exportWcnRegister({ ...params, status: statusFilter }, format);
          break;
        case 'collection-expenses':
          result = await reportService.exportCollectionExpenses({ ...params, category: categoryFilter }, format);
          break;
        case 'vendor-bills':
          result = await reportService.exportVendorBills({
            ...params,
            payment_status: paymentStatusFilter,
            bill_type: billTypeFilter
          }, format);
          break;
      }

      if (!result.success) {
        setError('Export failed');
      }
    } catch (err) {
      setError(err.message || 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  // Handle report change
  const handleReportChange = (reportId) => {
    setActiveReport(reportId);
    setReportData(null);
    setPage(1);
    // Reset report-specific filters
    setStatusFilter('all');
    setCategoryFilter('');
    setPaymentStatusFilter('all');
    setBillTypeFilter('all');
  };

  // Render summary cards
  const renderSummaryCards = () => {
    if (!reportData?.summary) return null;
    const { summary } = reportData;

    switch (activeReport) {
      case 'purchase-cost':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<Banknote size={20} />}
              label="Total Base Cost"
              value={formatCurrency(summary.totalBaseCost)}
              color="blue"
            />
            <SummaryCard
              icon={<Truck size={20} />}
              label="Collection Expenses"
              value={formatCurrency(summary.totalExpenses)}
              color="orange"
            />
            <SummaryCard
              icon={<TrendingUp size={20} />}
              label="Actual Cost"
              value={formatCurrency(summary.totalActualCost)}
              color="green"
            />
            <SummaryCard
              icon={<BarChart3 size={20} />}
              label="Avg Expense %"
              value={`${summary.averageExpensePercentage}%`}
              color="purple"
            />
          </div>
        );

      case 'wcn-register':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<FileText size={20} />}
              label="Total WCNs"
              value={summary.totalWcns}
              color="blue"
            />
            <SummaryCard
              icon={<CheckCircle size={20} />}
              label="Finalized"
              value={summary.finalizedCount}
              color="green"
            />
            <SummaryCard
              icon={<Clock size={20} />}
              label="Pending"
              value={summary.pendingCount}
              color="orange"
            />
            <SummaryCard
              icon={<RefreshCw size={20} />}
              label="Rectifications"
              value={summary.totalRectifications}
              color="purple"
            />
          </div>
        );

      case 'collection-expenses':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<Banknote size={20} />}
              label="Total Expenses"
              value={formatCurrency(summary.totalExpenses)}
              color="blue"
            />
            <SummaryCard
              icon={<BarChart3 size={20} />}
              label="Avg per Collection"
              value={formatCurrency(summary.averagePerCollection)}
              color="green"
            />
            <SummaryCard
              icon={<Truck size={20} />}
              label="Collections"
              value={summary.collectionCount}
              color="orange"
            />
            <SummaryCard
              icon={<TrendingUp size={20} />}
              label="Top Category"
              value={summary.topCategory || 'N/A'}
              color="purple"
            />
          </div>
        );

      case 'vendor-bills':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <SummaryCard
              icon={<Receipt size={20} />}
              label="Total Billed"
              value={formatCurrency(summary.totalBilled)}
              color="blue"
            />
            <SummaryCard
              icon={<CheckCircle size={20} />}
              label="Total Paid"
              value={formatCurrency(summary.totalPaid)}
              color="green"
            />
            <SummaryCard
              icon={<AlertTriangle size={20} />}
              label="Outstanding"
              value={formatCurrency(summary.totalOutstanding)}
              color="red"
            />
            <SummaryCard
              icon={<Package size={20} />}
              label="Multi-PO Bills"
              value={summary.multiPoBillCount}
              color="purple"
            />
          </div>
        );

      default:
        return null;
    }
  };

  // Render charts for collection expenses
  const renderExpenseCharts = () => {
    if (activeReport !== 'collection-expenses' || !reportData) return null;

    const { byCategory, monthlyTrend } = reportData;

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Category breakdown */}
        {byCategory && byCategory.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-base font-semibold text-slate-800 mb-4">Expenses by Category</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="category" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Bar dataKey="total" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly trend */}
        {monthlyTrend && monthlyTrend.length > 0 && (
          <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
            <h4 className="text-base font-semibold text-slate-800 mb-4">Monthly Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 12 }} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} />
                <Tooltip
                  formatter={(value) => formatCurrency(value)}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Expenses" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // Render data table
  const renderDataTable = () => {
    if (!reportData?.records || reportData.records.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-slate-400">
          <AlertCircle size={48} className="mb-4 opacity-50" />
          <p className="text-lg">No data available for the selected filters</p>
        </div>
      );
    }

    const { records, pagination } = reportData;

    switch (activeReport) {
      case 'purchase-cost':
        return (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">PO Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Supplier</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Base Cost</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Expenses</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Actual Cost</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Expense %</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">WCN</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-slate-800">{row.poNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(row.orderDate)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.supplierName}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.baseCost)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.collectionExpenses)}</td>
                      <td className="px-4 py-3 text-right font-semibold text-slate-800">{formatCurrency(row.actualCost)}</td>
                      <td className="px-4 py-3 text-right">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          parseFloat(row.expensePercentage) > 15
                            ? 'bg-red-100 text-red-700'
                            : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {row.expensePercentage}%
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{row.wcnNumber || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(pagination)}
          </>
        );

      case 'wcn-register':
        return (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">WCN Number</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Supplier</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Rectifications</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Linked PO</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-slate-800">{row.wcnNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(row.wcnDate)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.supplierName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          row.isFinalized
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-600">{row.rectificationCount}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{row.linkedPo?.poNumber || '-'}</td>
                      <td className="px-4 py-3 text-right text-slate-700">
                        {row.linkedPo ? formatCurrency(row.linkedPo.amount) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(pagination)}
          </>
        );

      case 'collection-expenses':
        return (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Category</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Description</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Collection #</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">WCN</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Supplier</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 text-slate-600">{formatDate(row.expenseDate)}</td>
                      <td className="px-4 py-3">
                        <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">
                          {row.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{row.description || '-'}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.amount)}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{row.collectionNumber}</td>
                      <td className="px-4 py-3 font-mono text-sm text-slate-600">{row.wcnNumber}</td>
                      <td className="px-4 py-3 text-slate-700">{row.supplierName}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(pagination)}
          </>
        );

      case 'vendor-bills':
        return (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50">
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Invoice #</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Date</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Supplier</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Type</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Amount</th>
                    <th className="px-4 py-3 text-right font-semibold text-slate-700">Balance</th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-700">Status</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">Days</th>
                    <th className="px-4 py-3 text-center font-semibold text-slate-700">POs</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((row) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-mono text-sm text-slate-800">{row.invoiceNumber}</td>
                      <td className="px-4 py-3 text-slate-600">{formatDate(row.invoiceDate)}</td>
                      <td className="px-4 py-3 text-slate-700">{row.supplierName}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                          row.billType === 'vendor'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {row.billType === 'vendor' ? 'Vendor' : 'Company'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.invoiceAmount)}</td>
                      <td className="px-4 py-3 text-right text-slate-700">{formatCurrency(row.balanceDue)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded ${
                          row.paymentStatus === 'paid'
                            ? 'bg-emerald-100 text-emerald-700'
                            : row.paymentStatus === 'partial'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}>
                          {row.paymentStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.paymentStatus !== 'paid' && row.daysOutstanding > 0 && (
                          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded ${
                            row.daysOutstanding > 30
                              ? 'bg-red-100 text-red-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {row.daysOutstanding}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {row.isMultiPo && (
                          <span className="inline-block px-2 py-0.5 text-xs font-medium rounded bg-purple-100 text-purple-700">
                            {row.poCount}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {renderPagination(pagination)}
          </>
        );

      default:
        return null;
    }
  };

  // Render pagination
  const renderPagination = (pagination) => {
    if (!pagination || pagination.pages <= 1) return null;

    return (
      <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          <ChevronLeft size={16} />
          Previous
        </button>
        <span className="text-sm text-slate-600">
          Page <strong>{pagination.page}</strong> of <strong>{pagination.pages}</strong> ({pagination.total} records)
        </span>
        <button
          className="inline-flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={page >= pagination.pages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
          <ChevronRight size={16} />
        </button>
      </div>
    );
  };

  // Render report-specific filters
  const renderReportFilters = () => {
    switch (activeReport) {
      case 'wcn-register':
        return (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Status</label>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            >
              <option value="all">All Status</option>
              <option value="finalized">Finalized</option>
              <option value="pending">Pending</option>
            </select>
          </div>
        );

      case 'collection-expenses':
        return (
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Category</label>
            <select
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            >
              <option value="">All Categories</option>
              {reportService.getExpenseCategories().map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>
          </div>
        );

      case 'vendor-bills':
        return (
          <>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Payment Status</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={paymentStatusFilter}
                onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              >
                {reportService.getPaymentStatusOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Bill Type</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={billTypeFilter}
                onChange={(e) => { setBillTypeFilter(e.target.value); setPage(1); }}
              >
                {reportService.getBillTypeOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className={`flex min-h-[calc(100vh-4rem)] ${isRTL ? 'flex-row-reverse' : ''}`}>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 p-4 shrink-0">
        <h2 className="flex items-center gap-2 text-lg font-bold text-slate-800 mb-4">
          <BarChart3 size={20} className="text-blue-600" />
          Reports
        </h2>
        <nav className="space-y-1">
          {reports.map((report) => {
            const Icon = report.icon;
            const hasAccess = hasPermission(report.permission);
            return (
              <button
                key={report.id}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                  activeReport === report.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : hasAccess
                    ? 'text-slate-700 hover:bg-slate-100'
                    : 'text-slate-400 cursor-not-allowed'
                }`}
                onClick={() => hasAccess && handleReportChange(report.id)}
                disabled={!hasAccess}
                title={hasAccess ? report.description : 'No permission'}
              >
                <Icon size={18} />
                <span>{report.name}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-6 bg-slate-50 overflow-auto">
        {/* Header */}
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {(() => {
              const report = reports.find(r => r.id === activeReport);
              const Icon = report?.icon || BarChart3;
              return (
                <>
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-100 text-blue-600 rounded-lg">
                    <Icon size={22} />
                  </div>
                  <h1 className="text-2xl font-bold text-slate-800">{report?.name}</h1>
                </>
              );
            })()}
          </div>

          <div className="relative">
            <button
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              onClick={() => setShowExportMenu(!showExportMenu)}
              disabled={loading || exporting || !reportData?.records?.length}
            >
              <Download size={16} />
              {exporting ? 'Exporting...' : 'Export'}
              <ChevronDown size={14} />
            </button>
            {showExportMenu && (
              <div className="absolute right-0 mt-1 w-40 bg-white border border-slate-200 rounded-lg shadow-lg z-50 overflow-hidden">
                <button
                  className="w-full px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => handleExport('csv')}
                >
                  Export to CSV
                </button>
                <button
                  className="w-full px-4 py-2.5 text-sm text-left text-slate-700 hover:bg-slate-50 transition-colors"
                  onClick={() => handleExport('xlsx')}
                >
                  Export to Excel
                </button>
              </div>
            )}
          </div>
        </header>

        {/* Filters */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Date Range</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={datePreset}
                onChange={(e) => handleDatePresetChange(e.target.value)}
              >
                {datePresets.map(preset => (
                  <option key={preset.value} value={preset.value}>{preset.label}</option>
                ))}
              </select>
            </div>

            {datePreset === 'custom' && (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">From</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    value={dateRange.from}
                    onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setPage(1); }}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">To</label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                    value={dateRange.to}
                    onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setPage(1); }}
                  />
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide">Supplier</label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-md bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                value={supplierId}
                onChange={(e) => { setSupplierId(e.target.value); setPage(1); }}
              >
                <option value="">All Suppliers</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            {renderReportFilters()}

            <div className="flex items-end">
              <button
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={fetchReport}
                disabled={loading}
              >
                <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Date range indicator */}
        <div className="flex items-center gap-2 text-sm text-slate-600 mb-4">
          <Calendar size={14} className="text-slate-400" />
          <span>
            Showing data from <strong>{formatDate(dateRange.from)}</strong> to <strong>{formatDate(dateRange.to)}</strong>
          </span>
        </div>

        {/* Error state */}
        {error && (
          <div className="flex items-center gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-500">
            <RefreshCw size={32} className="animate-spin text-blue-500 mb-4" />
            <p>Loading report data...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {renderSummaryCards()}

            {/* Charts (for collection expenses) */}
            {renderExpenseCharts()}

            {/* Data table */}
            <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
              {renderDataTable()}
            </div>
          </>
        )}
      </main>

      {/* Click outside handler for export dropdown */}
      {showExportMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowExportMenu(false)}
        />
      )}
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon, label, value, color }) => {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-emerald-50 border-emerald-200 text-emerald-600',
    orange: 'bg-amber-50 border-amber-200 text-amber-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    red: 'bg-red-50 border-red-200 text-red-600'
  };

  const iconColorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    green: 'bg-emerald-100 text-emerald-600',
    orange: 'bg-amber-100 text-amber-600',
    purple: 'bg-purple-100 text-purple-600',
    red: 'bg-red-100 text-red-600'
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-lg border ${colorClasses[color] || colorClasses.blue}`}>
      <div className={`w-10 h-10 flex items-center justify-center rounded-lg ${iconColorClasses[color] || iconColorClasses.blue}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide truncate">{label}</p>
        <p className="text-lg font-bold text-slate-800 truncate">{value}</p>
      </div>
    </div>
  );
};

export default Reports;
