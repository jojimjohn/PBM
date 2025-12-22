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
import './Reports.css';

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
          <div className="summary-cards">
            <SummaryCard
              icon={<Banknote />}
              label="Total Base Cost"
              value={formatCurrency(summary.totalBaseCost)}
              color="blue"
            />
            <SummaryCard
              icon={<Truck />}
              label="Collection Expenses"
              value={formatCurrency(summary.totalExpenses)}
              color="orange"
            />
            <SummaryCard
              icon={<TrendingUp />}
              label="Actual Cost"
              value={formatCurrency(summary.totalActualCost)}
              color="green"
            />
            <SummaryCard
              icon={<BarChart3 />}
              label="Avg Expense %"
              value={`${summary.averageExpensePercentage}%`}
              color="purple"
            />
          </div>
        );

      case 'wcn-register':
        return (
          <div className="summary-cards">
            <SummaryCard
              icon={<FileText />}
              label="Total WCNs"
              value={summary.totalWcns}
              color="blue"
            />
            <SummaryCard
              icon={<CheckCircle />}
              label="Finalized"
              value={summary.finalizedCount}
              color="green"
            />
            <SummaryCard
              icon={<Clock />}
              label="Pending"
              value={summary.pendingCount}
              color="orange"
            />
            <SummaryCard
              icon={<RefreshCw />}
              label="Rectifications"
              value={summary.totalRectifications}
              color="purple"
            />
          </div>
        );

      case 'collection-expenses':
        return (
          <div className="summary-cards">
            <SummaryCard
              icon={<Banknote />}
              label="Total Expenses"
              value={formatCurrency(summary.totalExpenses)}
              color="blue"
            />
            <SummaryCard
              icon={<BarChart3 />}
              label="Avg per Collection"
              value={formatCurrency(summary.averagePerCollection)}
              color="green"
            />
            <SummaryCard
              icon={<Truck />}
              label="Collections"
              value={summary.collectionCount}
              color="orange"
            />
            <SummaryCard
              icon={<TrendingUp />}
              label="Top Category"
              value={summary.topCategory || 'N/A'}
              color="purple"
            />
          </div>
        );

      case 'vendor-bills':
        return (
          <div className="summary-cards">
            <SummaryCard
              icon={<Receipt />}
              label="Total Billed"
              value={formatCurrency(summary.totalBilled)}
              color="blue"
            />
            <SummaryCard
              icon={<CheckCircle />}
              label="Total Paid"
              value={formatCurrency(summary.totalPaid)}
              color="green"
            />
            <SummaryCard
              icon={<AlertTriangle />}
              label="Outstanding"
              value={formatCurrency(summary.totalOutstanding)}
              color="red"
            />
            <SummaryCard
              icon={<Package />}
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
      <div className="report-charts">
        {/* Category breakdown */}
        {byCategory && byCategory.length > 0 && (
          <div className="chart-container">
            <h4>Expenses by Category</h4>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={byCategory}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Bar dataKey="total" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Monthly trend */}
        {monthlyTrend && monthlyTrend.length > 0 && (
          <div className="chart-container">
            <h4>Monthly Trend</h4>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => formatCurrency(value)} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" name="Expenses" />
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
        <div className="empty-state">
          <AlertCircle size={48} />
          <p>No data available for the selected filters</p>
        </div>
      );
    }

    const { records, pagination } = reportData;

    switch (activeReport) {
      case 'purchase-cost':
        return (
          <>
            <table className="report-table">
              <thead>
                <tr>
                  <th>PO Number</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th className="align-right">Base Cost</th>
                  <th className="align-right">Expenses</th>
                  <th className="align-right">Actual Cost</th>
                  <th className="align-right">Expense %</th>
                  <th>WCN</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.poNumber}</td>
                    <td>{formatDate(row.orderDate)}</td>
                    <td>{row.supplierName}</td>
                    <td className="align-right">{formatCurrency(row.baseCost)}</td>
                    <td className="align-right">{formatCurrency(row.collectionExpenses)}</td>
                    <td className="align-right font-bold">{formatCurrency(row.actualCost)}</td>
                    <td className="align-right">
                      <span className={`percentage ${parseFloat(row.expensePercentage) > 15 ? 'high' : ''}`}>
                        {row.expensePercentage}%
                      </span>
                    </td>
                    <td className="mono">{row.wcnNumber || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination(pagination)}
          </>
        );

      case 'wcn-register':
        return (
          <>
            <table className="report-table">
              <thead>
                <tr>
                  <th>WCN Number</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Status</th>
                  <th className="align-center">Rectifications</th>
                  <th>Linked PO</th>
                  <th className="align-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.wcnNumber}</td>
                    <td>{formatDate(row.wcnDate)}</td>
                    <td>{row.supplierName}</td>
                    <td>
                      <span className={`status-badge ${row.isFinalized ? 'finalized' : 'pending'}`}>
                        {row.status}
                      </span>
                    </td>
                    <td className="align-center">{row.rectificationCount}</td>
                    <td className="mono">{row.linkedPo?.poNumber || '-'}</td>
                    <td className="align-right">
                      {row.linkedPo ? formatCurrency(row.linkedPo.amount) : '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination(pagination)}
          </>
        );

      case 'collection-expenses':
        return (
          <>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th className="align-right">Amount</th>
                  <th>Collection #</th>
                  <th>WCN</th>
                  <th>Supplier</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id}>
                    <td>{formatDate(row.expenseDate)}</td>
                    <td>
                      <span className="category-badge">{row.category}</span>
                    </td>
                    <td>{row.description || '-'}</td>
                    <td className="align-right">{formatCurrency(row.amount)}</td>
                    <td className="mono">{row.collectionNumber}</td>
                    <td className="mono">{row.wcnNumber}</td>
                    <td>{row.supplierName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {renderPagination(pagination)}
          </>
        );

      case 'vendor-bills':
        return (
          <>
            <table className="report-table">
              <thead>
                <tr>
                  <th>Invoice #</th>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Type</th>
                  <th className="align-right">Amount</th>
                  <th className="align-right">Balance</th>
                  <th>Status</th>
                  <th className="align-center">Days</th>
                  <th className="align-center">POs</th>
                </tr>
              </thead>
              <tbody>
                {records.map((row) => (
                  <tr key={row.id}>
                    <td className="mono">{row.invoiceNumber}</td>
                    <td>{formatDate(row.invoiceDate)}</td>
                    <td>{row.supplierName}</td>
                    <td>
                      <span className={`type-badge ${row.billType}`}>
                        {row.billType === 'vendor' ? 'Vendor' : 'Company'}
                      </span>
                    </td>
                    <td className="align-right">{formatCurrency(row.invoiceAmount)}</td>
                    <td className="align-right">{formatCurrency(row.balanceDue)}</td>
                    <td>
                      <span className={`status-badge ${row.paymentStatus}`}>
                        {row.paymentStatus}
                      </span>
                    </td>
                    <td className="align-center">
                      {row.paymentStatus !== 'paid' && row.daysOutstanding > 0 && (
                        <span className={`days ${row.daysOutstanding > 30 ? 'overdue' : ''}`}>
                          {row.daysOutstanding}
                        </span>
                      )}
                    </td>
                    <td className="align-center">
                      {row.isMultiPo && (
                        <span className="multi-po-badge">{row.poCount}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage(p => p - 1)}
        >
          Previous
        </button>
        <span>
          Page {pagination.page} of {pagination.pages} ({pagination.total} records)
        </span>
        <button
          disabled={page >= pagination.pages}
          onClick={() => setPage(p => p + 1)}
        >
          Next
        </button>
      </div>
    );
  };

  // Render report-specific filters
  const renderReportFilters = () => {
    switch (activeReport) {
      case 'wcn-register':
        return (
          <div className="filter-group">
            <label>Status</label>
            <select
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
          <div className="filter-group">
            <label>Category</label>
            <select
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
            <div className="filter-group">
              <label>Payment Status</label>
              <select
                value={paymentStatusFilter}
                onChange={(e) => { setPaymentStatusFilter(e.target.value); setPage(1); }}
              >
                {reportService.getPaymentStatusOptions().map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>Bill Type</label>
              <select
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
    <div className={`reports-page ${isRTL ? 'rtl' : ''}`}>
      {/* Sidebar */}
      <aside className="reports-sidebar">
        <h2><BarChart3 size={20} /> Reports</h2>
        <nav className="report-nav">
          {reports.map((report) => {
            const Icon = report.icon;
            const hasAccess = hasPermission(report.permission);
            return (
              <button
                key={report.id}
                className={`report-nav-item ${activeReport === report.id ? 'active' : ''} ${!hasAccess ? 'disabled' : ''}`}
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
      <main className="reports-main">
        {/* Header */}
        <header className="report-header">
          <div className="report-title">
            {(() => {
              const report = reports.find(r => r.id === activeReport);
              const Icon = report?.icon || BarChart3;
              return (
                <>
                  <Icon size={24} />
                  <h1>{report?.name}</h1>
                </>
              );
            })()}
          </div>

          <div className="report-actions">
            <div className="export-dropdown">
              <button
                className="btn-export"
                disabled={loading || exporting || !reportData?.records?.length}
              >
                <Download size={16} />
                {exporting ? 'Exporting...' : 'Export'}
                <ChevronDown size={14} />
              </button>
              <div className="dropdown-menu">
                <button onClick={() => handleExport('csv')}>Export to CSV</button>
                <button onClick={() => handleExport('xlsx')}>Export to Excel</button>
              </div>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="report-filters">
          <div className="filter-group">
            <label>Date Range</label>
            <select
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
              <div className="filter-group">
                <label>From</label>
                <input
                  type="date"
                  value={dateRange.from}
                  onChange={(e) => { setDateRange(prev => ({ ...prev, from: e.target.value })); setPage(1); }}
                />
              </div>
              <div className="filter-group">
                <label>To</label>
                <input
                  type="date"
                  value={dateRange.to}
                  onChange={(e) => { setDateRange(prev => ({ ...prev, to: e.target.value })); setPage(1); }}
                />
              </div>
            </>
          )}

          <div className="filter-group">
            <label>Supplier</label>
            <select
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

          <button
            className="btn-refresh"
            onClick={fetchReport}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Date range indicator */}
        <div className="date-indicator">
          <Calendar size={14} />
          <span>
            Showing data from <strong>{formatDate(dateRange.from)}</strong> to <strong>{formatDate(dateRange.to)}</strong>
          </span>
        </div>

        {/* Error state */}
        {error && (
          <div className="error-banner">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Loading state */}
        {loading ? (
          <div className="loading-state">
            <RefreshCw size={32} className="spin" />
            <p>Loading report data...</p>
          </div>
        ) : (
          <>
            {/* Summary cards */}
            {renderSummaryCards()}

            {/* Charts (for collection expenses) */}
            {renderExpenseCharts()}

            {/* Data table */}
            <div className="report-table-container">
              {renderDataTable()}
            </div>
          </>
        )}
      </main>
    </div>
  );
};

// Summary Card Component
const SummaryCard = ({ icon, label, value, color }) => (
  <div className={`summary-card ${color}`}>
    <div className="card-icon">{icon}</div>
    <div className="card-content">
      <span className="card-label">{label}</span>
      <span className="card-value">{value}</span>
    </div>
  </div>
);

export default Reports;
