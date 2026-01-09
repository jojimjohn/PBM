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
import '../styles/StockMovements.css';
import '../styles/ViewToggle.css';
import '../styles/TimelineView.css';

// Summary card component
const SummaryCard = ({ icon: Icon, label, value, change, changeType, iconClass }) => {
  return (
    <div className="summary-card">
      <div className="summary-card-header">
        <div className={`summary-card-icon ${iconClass}`}>
          <Icon size={20} />
        </div>
        <span className="summary-card-label">{label}</span>
      </div>
      <div className="summary-card-value">{value}</div>
      {change !== undefined && (
        <span className={`summary-card-change ${changeType}`}>
          {changeType === 'positive' ? '+' : ''}{change}%
        </span>
      )}
    </div>
  );
};

// Stock item card for current stock view
const StockItemCard = ({ item, t, formatCurrency, onClick }) => {
  const status = calculateStockStatus(item.quantity, item.minimumStockLevel);
  const statusInfo = stockStatusConfig[status];

  return (
    <div className="stock-item-card" onClick={() => onClick && onClick(item)}>
      <div className="stock-item-header">
        <div>
          <h4 className="stock-item-name">{item.materialName}</h4>
          <span className="stock-item-category">{item.category}</span>
        </div>
        <span className={`stock-status-badge ${status}`}>
          {statusInfo?.label || status}
        </span>
      </div>

      <div className="stock-item-details">
        <div className="stock-detail-item">
          <span className="stock-detail-label">{t('quantity') || 'Quantity'}</span>
          <span className="stock-detail-value">
            {item.quantity?.toFixed(3) || '0.000'} {item.unit}
          </span>
        </div>
        <div className="stock-detail-item">
          <span className="stock-detail-label">{t('avgCost') || 'Avg Cost'}</span>
          <span className="stock-detail-value">
            {formatCurrency(item.averageCost || 0)}
          </span>
        </div>
        <div className="stock-detail-item">
          <span className="stock-detail-label">{t('totalValue') || 'Total Value'}</span>
          <span className="stock-detail-value">
            {formatCurrency(item.totalValue || 0)}
          </span>
        </div>
        <div className="stock-detail-item">
          <span className="stock-detail-label">{t('reorderLevel') || 'Reorder Level'}</span>
          <span className="stock-detail-value">
            {item.minimumStockLevel?.toFixed(3) || '0.000'}
          </span>
        </div>
      </div>

      <div className="stock-item-footer">
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
    <div className="stock-movements-page" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="stock-movements-header">
        <div className="stock-movements-title-section">
          <h1 className="stock-movements-title">
            {t('stockMovements') || 'Stock Movements'}
          </h1>
          <p className="stock-movements-subtitle">
            {t('trackInventoryMovements') || 'Track inventory receipts, sales, and adjustments'}
          </p>
        </div>

        <div className="stock-movements-actions">
          <button className="export-btn" onClick={handleExport}>
            <Download size={18} />
            {t('export') || 'Export'}
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="stock-summary-grid">
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
      <div className="stock-view-controls">
        <ViewToggle activeView={activeView} onViewChange={setActiveView} />

        {activeView === 'current' && (
          <div className="stock-filters">
            <div className="search-input-wrapper">
              <Search size={18} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder={t('searchMaterials') || 'Search materials...'}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <select
              className="filter-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">{t('allCategories') || 'All Categories'}</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            <select
              className="filter-select"
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
      <div className="stock-content">
        {loading && (
          <div className="timeline-loading">
            <Loader2 className="spin" size={24} />
            <span>{t('loading') || 'Loading...'}</span>
          </div>
        )}

        {error && !loading && (
          <div className="timeline-error">
            <p>{error}</p>
            <button onClick={fetchInventory} className="retry-btn">
              {t('retry') || 'Retry'}
            </button>
          </div>
        )}

        {!loading && !error && activeView === 'current' && (
          <>
            {filteredInventory.length === 0 ? (
              <div className="timeline-empty">
                <Package size={48} className="empty-icon" />
                <h3>{t('noItemsFound') || 'No items found'}</h3>
                <p>{t('tryAdjustingFilters') || 'Try adjusting your search or filters'}</p>
              </div>
            ) : (
              <div className="current-stock-grid">
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
