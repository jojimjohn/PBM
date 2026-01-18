/**
 * Stock Movements Page
 * Displays current stock levels and movement timeline
 * with toggleable views and comprehensive filtering
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  Download,
  Search,
  Loader2,
  AlertTriangle
} from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';
import inventoryService, { calculateStockStatus, stockStatusConfig } from '../../../services/inventoryService';
import dataCacheService from '../../../services/dataCacheService';
import ViewToggle from '../components/ViewToggle';
import TimelineView from '../components/TimelineView';

// Icon color classes for summary cards
const iconColorMap = {
  receipts: 'bg-emerald-100 text-emerald-600',
  sales: 'bg-red-100 text-red-600',
  adjustments: 'bg-amber-100 text-amber-600',
  wastage: 'bg-violet-100 text-violet-600'
};

// Summary card component
const SummaryCard = ({ icon: Icon, label, value, change, changeType, iconClass }) => {
  return (
    <div className="flex flex-col gap-2 p-5 bg-white border border-gray-200 rounded-xl shadow-sm">
      <div className="flex justify-between items-center">
        <div className={`flex items-center justify-center w-10 h-10 rounded-lg ${iconColorMap[iconClass] || 'bg-gray-100 text-gray-600'}`}>
          <Icon size={20} />
        </div>
        <span className="text-[13px] font-medium text-gray-500">{label}</span>
      </div>
      <div className="text-[28px] font-bold text-gray-900 font-mono">{value}</div>
      {change !== undefined && (
        <span className={`inline-flex items-center gap-1 text-xs font-medium ${changeType === 'positive' ? 'text-emerald-600' : 'text-red-600'}`}>
          {changeType === 'positive' ? '+' : ''}{change}%
        </span>
      )}
    </div>
  );
};

// Status badge color classes
const statusColorMap = {
  good: 'bg-emerald-100 text-emerald-600',
  low: 'bg-amber-100 text-amber-600',
  critical: 'bg-orange-100 text-orange-600',
  'out-of-stock': 'bg-red-100 text-red-600'
};

// Stock item card for current stock view
const StockItemCard = ({ item, t, formatCurrency, onClick }) => {
  const status = calculateStockStatus(item.quantity, item.minimumStockLevel);
  const statusInfo = stockStatusConfig[status];

  return (
    <div
      className="flex flex-col gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer transition-all hover:shadow-lg hover:border-blue-500"
      onClick={() => onClick && onClick(item)}
    >
      <div className="flex justify-between items-start gap-2">
        <div>
          <h4 className="text-[15px] font-semibold text-gray-700 m-0">{item.materialName}</h4>
          <span className="text-xs text-gray-500">{item.category}</span>
        </div>
        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold uppercase tracking-wide ${statusColorMap[status] || 'bg-gray-100 text-gray-600'}`}>
          {statusInfo?.label || status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t('quantity') || 'Quantity'}</span>
          <span className="text-sm font-semibold text-gray-700 font-mono">
            {item.quantity?.toFixed(3) || '0.000'} {item.unit}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t('avgCost') || 'Avg Cost'}</span>
          <span className="text-sm font-semibold text-gray-700 font-mono">
            {formatCurrency(item.averageCost || 0)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t('totalValue') || 'Total Value'}</span>
          <span className="text-sm font-semibold text-gray-700 font-mono">
            {formatCurrency(item.totalValue || 0)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] text-gray-400 uppercase tracking-wider">{t('reorderLevel') || 'Reorder Level'}</span>
          <span className="text-sm font-semibold text-gray-700 font-mono">
            {item.minimumStockLevel?.toFixed(3) || '0.000'}
          </span>
        </div>
      </div>

      <div className="flex justify-between items-center pt-2 border-t border-gray-200 text-xs text-gray-500">
        <span>{t('lastUpdated') || 'Last updated'}: {item.lastUpdated ? new Date(item.lastUpdated).toLocaleDateString() : 'N/A'}</span>
      </div>
    </div>
  );
};

// Main page component
const StockMovements = () => {
  const { t, isRTL, formatCurrency } = useLocalization();

  // View state
  const [activeView, setActiveView] = useState('current'); // 'current' or 'timeline'

  // Data state
  const [inventory, setInventory] = useState([]);
  const [summary, setSummary] = useState({
    totalReceipts: 0,
    totalSales: 0,
    totalAdjustments: 0,
    totalWastage: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Available categories (derived from data)
  const [categories, setCategories] = useState([]);

  // Fetch inventory data - PERFORMANCE FIX: Use dataCacheService for instant loading
  const fetchInventory = useCallback(async (forceRefresh = false) => {
    setLoading(true);
    setError(null);

    try {
      // If force refresh requested, invalidate cache first
      if (forceRefresh) {
        dataCacheService.invalidateInventory();
      }

      // Use dataCacheService for cached inventory (2 min TTL)
      const data = await dataCacheService.getInventory().catch(err => {
        console.error('Error loading inventory:', err);
        return [];
      });

      if (data) {
        setInventory(data);

        // Extract unique categories
        const uniqueCategories = [...new Set(data.map(item => item.category).filter(Boolean))];
        setCategories(uniqueCategories);

        // Calculate summary from inventory data
        const totalValue = data.reduce((sum, item) => sum + (item.totalValue || 0), 0);
        const totalQuantity = data.reduce((sum, item) => sum + (item.quantity || 0), 0);
        const lowStockCount = data.filter(item =>
          calculateStockStatus(item.quantity, item.minimumStockLevel) !== 'good'
        ).length;

        setSummary({
          totalItems: data.length,
          totalValue,
          totalQuantity,
          lowStockCount
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load inventory');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  // Filter inventory
  const filteredInventory = inventory.filter(item => {
    const matchesSearch = !searchTerm ||
      item.materialName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.materialCode?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = !categoryFilter || item.category === categoryFilter;

    const itemStatus = calculateStockStatus(item.quantity, item.minimumStockLevel);
    const matchesStatus = !statusFilter || itemStatus === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Handle item click (could open detail modal)
  const handleItemClick = (item) => {
    console.log('Selected item:', item);
    // Future: Open detail modal or navigate to item detail page
  };

  // Handle export
  const handleExport = () => {
    // Future: Implement CSV/Excel export
    console.log('Export triggered');
  };

  return (
    <div className="flex flex-col gap-6 p-6 max-w-[1400px] mx-auto max-md:p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-start gap-4 flex-wrap max-md:flex-col max-md:items-stretch">
        <div className="flex flex-col gap-1">
          <h1 className="m-0 text-2xl font-semibold text-gray-900">
            {t('stockMovements') || 'Stock Movements'}
          </h1>
          <p className="m-0 text-sm text-gray-500">
            {t('trackInventoryMovements') || 'Track inventory receipts, sales, and adjustments'}
          </p>
        </div>

        <div className="flex items-center gap-3 max-md:justify-end">
          <button
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 cursor-pointer transition-all hover:bg-gray-50 hover:border-blue-500 hover:text-blue-600"
            onClick={handleExport}
          >
            <Download size={18} />
            {t('export') || 'Export'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 max-md:grid-cols-2 max-sm:grid-cols-1">
        <SummaryCard
          icon={Package}
          label={t('totalItems') || 'Total Items'}
          value={summary.totalItems || 0}
          iconClass="receipts"
        />
        <SummaryCard
          icon={TrendingUp}
          label={t('totalValue') || 'Total Value'}
          value={formatCurrency(summary.totalValue || 0)}
          iconClass="sales"
        />
        <SummaryCard
          icon={RefreshCw}
          label={t('totalQuantity') || 'Total Quantity'}
          value={(summary.totalQuantity || 0).toFixed(2)}
          iconClass="adjustments"
        />
        <SummaryCard
          icon={AlertTriangle}
          label={t('lowStockItems') || 'Low Stock Items'}
          value={summary.lowStockCount || 0}
          iconClass="wastage"
        />
      </div>

      {/* View Controls */}
      <div className="flex justify-between items-center gap-4 flex-wrap py-3 border-b border-gray-200 max-md:flex-col max-md:items-stretch">
        <ViewToggle activeView={activeView} onViewChange={setActiveView} />

        {activeView === 'current' && (
          <div className="flex items-center gap-3 flex-wrap max-md:flex-col max-md:items-stretch">
            <div className="relative flex items-center">
              <Search size={18} className="absolute left-3 text-gray-400 pointer-events-none" />
              <input
                type="text"
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 max-md:w-full"
                placeholder={t('searchMaterials') || 'Search materials...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t('allCategories') || 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">{t('allStatuses') || 'All Statuses'}</option>
              <option value="good">{t('goodStock') || 'Good Stock'}</option>
              <option value="low">{t('lowStock') || 'Low Stock'}</option>
              <option value="critical">{t('critical') || 'Critical'}</option>
              <option value="out-of-stock">{t('outOfStock') || 'Out of Stock'}</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex flex-col gap-4 bg-white border border-gray-200 rounded-xl p-6 shadow-sm max-sm:p-4">
        {loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
            <Loader2 className="animate-spin" size={24} />
            <span>{t('loading') || 'Loading...'}</span>
          </div>
        )}

        {error && !loading && (
          <div className="flex flex-col items-center justify-center gap-3 py-12 text-red-600 bg-red-50 rounded-lg">
            <p>{error}</p>
            <button
              onClick={fetchInventory}
              className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              {t('retry') || 'Retry'}
            </button>
          </div>
        )}

        {!loading && !error && activeView === 'current' && (
          <>
            {filteredInventory.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-12 text-gray-500">
                <Package size={48} className="text-gray-300" />
                <h3 className="m-0 text-lg font-semibold text-gray-700">{t('noItemsFound') || 'No items found'}</h3>
                <p className="m-0 text-sm">{t('tryAdjustingFilters') || 'Try adjusting your search or filters'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4 max-md:grid-cols-1">
                {filteredInventory.map(item => (
                  <StockItemCard
                    key={item.id}
                    item={item}
                    t={t}
                    formatCurrency={formatCurrency}
                    onClick={handleItemClick}
                  />
                ))}
              </div>
            )}
          </>
        )}

        {!loading && !error && activeView === 'timeline' && (
          <TimelineView />
        )}
      </div>
    </div>
  );
};

export default StockMovements;
