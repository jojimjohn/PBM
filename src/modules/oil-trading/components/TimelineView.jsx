/**
 * TimelineView Component
 * Compact chronological timeline for stock movements
 * with collapsible date groups and pagination
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Package,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Trash2,
  ArrowRightLeft,
  Filter,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Loader2,
  List,
  LayoutList,
  ExternalLink
} from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';
import { useSystemSettings } from '../../../context/SystemSettingsContext';
import transactionService from '../../../services/transactionService';
import DateInput from '../../../components/ui/DateInput';
import '../styles/TimelineView.css';

// Movement type configuration
const movementTypeConfig = {
  purchase: { icon: TrendingUp, color: '#059669', bgColor: '#d1fae5', label: 'Purchase', labelAr: 'شراء' },
  receipt: { icon: TrendingUp, color: '#059669', bgColor: '#d1fae5', label: 'Receipt', labelAr: 'استلام' },
  sale: { icon: TrendingDown, color: '#dc2626', bgColor: '#fee2e2', label: 'Sale', labelAr: 'بيع' },
  adjustment: { icon: RefreshCw, color: '#d97706', bgColor: '#fef3c7', label: 'Adjust', labelAr: 'تعديل' },
  wastage: { icon: Trash2, color: '#7c3aed', bgColor: '#ede9fe', label: 'Waste', labelAr: 'هدر' },
  transfer: { icon: ArrowRightLeft, color: '#0891b2', bgColor: '#cffafe', label: 'Transfer', labelAr: 'تحويل' },
  in: { icon: TrendingUp, color: '#059669', bgColor: '#d1fae5', label: 'In', labelAr: 'دخول' },
  out: { icon: TrendingDown, color: '#dc2626', bgColor: '#fee2e2', label: 'Out', labelAr: 'خروج' }
};

// Compact Timeline Item
const TimelineItem = ({ movement, t, isRTL, formatCurrency, onWastageClick }) => {
  const movementType = movement.transactionType || movement.type || 'adjustment';
  const config = movementTypeConfig[movementType] || movementTypeConfig.adjustment;
  const Icon = config.icon;

  const quantity = Math.abs(parseFloat(movement.quantity) || 0);
  const isIncoming = ['purchase', 'receipt', 'in'].includes(movementType);
  const quantitySign = isIncoming ? '+' : '-';
  const quantityClass = isIncoming ? 'quantity-positive' : 'quantity-negative';
  const unit = movement.materialUnit || movement.unit || '';

  // Check if this is a wastage item with reference ID
  const isWastage = movementType === 'wastage';
  const wastageId = movement.referenceId || movement.wastageId;
  const canViewWastage = isWastage && wastageId && onWastageClick;

  const handleWastageClick = (e) => {
    e.stopPropagation();
    if (canViewWastage) {
      onWastageClick(wastageId, movement);
    }
  };

  return (
    <div className={`timeline-item ${canViewWastage ? 'clickable' : ''}`} onClick={canViewWastage ? handleWastageClick : undefined}>
      <div className="timeline-item-type-col">
        <div
          className="timeline-item-icon"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <Icon size={14} />
        </div>
        <span className="timeline-item-type" style={{ color: config.color }}>
          {isRTL ? config.labelAr : config.label}
        </span>
      </div>

      <div className="timeline-item-content">
        <span className="timeline-item-material" title={movement.materialName}>
          {movement.materialName || 'Unknown'}
        </span>
        {movement.materialCode && (
          <span className="timeline-item-batch">#{movement.materialCode}</span>
        )}
        {movement.traceability && (
          <div className="timeline-item-traceability">
            {movement.traceability.purchaseOrderNumber && (
              <span className="traceability-badge">PO: {movement.traceability.purchaseOrderNumber}</span>
            )}
            {movement.traceability.collectionOrderNumber && (
              <span className="traceability-badge">CO: {movement.traceability.collectionOrderNumber}</span>
            )}
            {movement.traceability.isManualReceipt && (
              <span className="traceability-badge manual">Manual</span>
            )}
            {isWastage && movement.referenceNumber && (
              <span className="traceability-badge wastage">W: {movement.referenceNumber}</span>
            )}
          </div>
        )}
        {canViewWastage && (
          <button className="view-wastage-link" onClick={handleWastageClick} title={t('viewWastageDetails', 'View Wastage Details')}>
            <ExternalLink size={12} />
            <span>{t('viewDetails', 'View')}</span>
          </button>
        )}
      </div>

      <div className="timeline-item-quantity-col">
        <span className={`timeline-item-quantity ${quantityClass}`}>
          {quantitySign}{quantity.toFixed(2)} {unit}
        </span>
        {(movement.unitCost > 0) && (
          <span className="timeline-item-cost">
            @ {formatCurrency(movement.unitCost)}
          </span>
        )}
      </div>
    </div>
  );
};

// Collapsible Date Group
const DateGroup = ({ dateKey, movements, t, isRTL, formatCurrency, formatDateHeader, defaultExpanded = true, onWastageClick }) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className="timeline-date-group">
      <div
        className={`timeline-date-header ${!isExpanded ? 'collapsed' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronDown size={16} className="collapse-icon" />
        <Calendar size={14} />
        <span>{formatDateHeader(dateKey)}</span>
        <span className="timeline-date-count">
          {movements.length} {movements.length === 1 ? t('movement', 'movement') : t('movements', 'movements')}
        </span>
      </div>
      <div className={`timeline-items ${!isExpanded ? 'collapsed' : ''}`}>
        {movements.map((movement) => (
          <TimelineItem
            key={movement.id}
            movement={movement}
            t={t}
            isRTL={isRTL}
            formatCurrency={formatCurrency}
            onWastageClick={onWastageClick}
          />
        ))}
      </div>
    </div>
  );
};

// Main TimelineView component
const TimelineView = ({ materialId = null, onWastageClick = null }) => {
  const { t, isRTL, formatCurrency } = useLocalization();
  const { formatDate } = useSystemSettings();

  const [movements, setMovements] = useState([]);
  const [groupedMovements, setGroupedMovements] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pageSize, setPageSize] = useState(100);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 100,
    total: 0,
    hasMore: false
  });

  // Date filters - default to last 30 days
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [typeFilter, setTypeFilter] = useState('');

  // Fetch transactions from transactions table
  const fetchMovements = useCallback(async (page = 1) => {
    setLoading(true);
    setError(null);

    try {
      // Build params for transactionService
      const params = {
        limit: pageSize,
        offset: (page - 1) * pageSize
      };
      if (startDate) params.dateFrom = startDate;
      if (endDate) params.dateTo = endDate;
      if (materialId) params.materialId = materialId;
      if (typeFilter) params.transactionType = typeFilter;

      // Use transactionService.getAll() which queries transactions table
      const response = await transactionService.getAll(params);

      if (response.success && response.data && Array.isArray(response.data)) {
        // Filter out transactions without materialId (like payments)
        const materialTransactions = response.data.filter(tx => tx.materialId != null);

        const transformedMovements = materialTransactions.map(tx => ({
          id: tx.id,
          date: tx.transactionDate || tx.created_at,
          type: tx.transactionType,
          transactionType: tx.transactionType,
          quantity: tx.quantity,
          materialId: tx.materialId,
          materialName: tx.materialName || 'Unknown',
          materialCode: tx.materialCode || '',
          materialUnit: '',
          unit: '',
          reference: tx.transactionNumber || tx.referenceId || '-',
          referenceNumber: tx.transactionNumber,
          referenceId: tx.referenceId,
          referenceType: tx.referenceType,
          unitCost: tx.unitPrice || 0,
          amount: tx.amount,
          description: tx.description,
          traceability: null
        }));

        // Group by date
        const grouped = {};
        transformedMovements.forEach(m => {
          let dateKey = 'unknown';
          if (m.date) {
            const dateStr = typeof m.date === 'string' ? m.date : m.date.toISOString();
            dateKey = dateStr.split('T')[0];
          }
          if (!grouped[dateKey]) grouped[dateKey] = [];
          grouped[dateKey].push(m);
        });

        setMovements(transformedMovements);
        setGroupedMovements(grouped);

        const total = response.pagination?.total || transformedMovements.length;
        setPagination({
          page: page,
          limit: pageSize,
          total: total,
          pages: Math.ceil(total / pageSize) || 1,
          hasMore: page * pageSize < total
        });
      } else {
        setMovements([]);
        setGroupedMovements({});
        setPagination({ page: 1, limit: pageSize, total: 0, pages: 1, hasMore: false });
      }
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate, materialId, typeFilter, pageSize]);

  useEffect(() => {
    fetchMovements(1);
  }, [fetchMovements]);

  const handleApplyFilters = () => fetchMovements(1);
  const handlePageChange = (newPage) => fetchMovements(newPage);

  const formatDateHeader = (dateStr) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const todayStr = today.toISOString().split('T')[0];
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (dateStr === todayStr) return t('today', 'Today');
    if (dateStr === yesterdayStr) return t('yesterday', 'Yesterday');

    const weekday = date.toLocaleDateString(isRTL ? 'ar-OM' : 'en-US', { weekday: 'short' });
    return `${weekday}, ${formatDate(date)}`;
  };

  const sortedDates = Object.keys(groupedMovements).sort((a, b) => new Date(b) - new Date(a));

  // Calculate summary stats - purchases are positive, sales/wastage are negative
  const totalIn = movements.filter(m => ['purchase', 'receipt', 'in', 'adjustment'].includes(m.transactionType) && parseFloat(m.quantity) > 0).reduce((sum, m) => sum + Math.abs(parseFloat(m.quantity) || 0), 0);
  const totalOut = movements.filter(m => ['sale', 'out', 'wastage'].includes(m.transactionType) || parseFloat(m.quantity) < 0).reduce((sum, m) => sum + Math.abs(parseFloat(m.quantity) || 0), 0);

  return (
    <div className="timeline-view">
      {/* Header with stats */}
      <div className="timeline-header">
        <div className="timeline-stats">
          <div className="stat-item">
            <TrendingUp size={14} style={{ color: '#059669' }} />
            <span>In: <span className="stat-value" style={{ color: '#059669' }}>{totalIn.toFixed(2)}</span></span>
          </div>
          <div className="stat-item">
            <TrendingDown size={14} style={{ color: '#dc2626' }} />
            <span>Out: <span className="stat-value" style={{ color: '#dc2626' }}>{totalOut.toFixed(2)}</span></span>
          </div>
          <div className="stat-item">
            <span>Total: <span className="stat-value">{pagination.total}</span> records</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="timeline-filters-section">
        <div className="timeline-date-filters">
          <div className="date-filter-group">
            <DateInput
              label={t('from', 'From')}
              value={startDate || ''}
              onChange={(value) => value && setStartDate(value)}
              size="small"
              maxDate={endDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="date-filter-group">
            <DateInput
              label={t('to', 'To')}
              value={endDate || ''}
              onChange={(value) => value && setEndDate(value)}
              size="small"
              minDate={startDate || ''}
              maxDate={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button type="button" className="date-filter-apply-btn" onClick={handleApplyFilters}>
            <Filter size={14} />
            {t('apply', 'Apply')}
          </button>
        </div>

        <div className="timeline-type-filters">
          <button
            type="button"
            className={`type-filter-btn ${typeFilter === '' ? 'active' : ''}`}
            onClick={() => setTypeFilter('')}
          >
            {t('all', 'All')}
          </button>
          {['purchase', 'sale', 'adjustment', 'wastage'].map((type) => {
            const config = movementTypeConfig[type];
            return (
              <button
                key={type}
                type="button"
                className={`type-filter-btn ${typeFilter === type ? 'active' : ''}`}
                onClick={() => setTypeFilter(type)}
                style={typeFilter === type ? { backgroundColor: config.bgColor, color: config.color, borderColor: config.color } : {}}
              >
                {isRTL ? config.labelAr : config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="timeline-loading">
          <Loader2 className="spin" size={20} />
          <span>{t('loading', 'Loading...')}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="timeline-error">
          <p>{error}</p>
          <button onClick={() => fetchMovements(pagination.page)} className="retry-btn">
            {t('retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && movements.length === 0 && (
        <div className="timeline-empty">
          <Package size={40} className="empty-icon" />
          <h3>{t('noTransactionsFound', 'No transactions found')}</h3>
          <p>{t('noTransactionsDescription', 'Try adjusting your date range or filters. Transactions include purchases, sales, adjustments, and wastages.')}</p>
        </div>
      )}

      {/* Timeline content */}
      {!loading && !error && movements.length > 0 && (
        <>
          <div className="timeline-content">
            {sortedDates.map((dateKey, index) => (
              <DateGroup
                key={dateKey}
                dateKey={dateKey}
                movements={groupedMovements[dateKey] || []}
                t={t}
                isRTL={isRTL}
                formatCurrency={formatCurrency}
                formatDateHeader={formatDateHeader}
                defaultExpanded={index < 3} // Expand first 3 days by default
                onWastageClick={onWastageClick}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="timeline-pagination">
            <button
              type="button"
              className="pagination-btn"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
              {t('previous', 'Prev')}
            </button>

            <div className="pagination-controls">
              <span className="pagination-info">
                {t('page', 'Page')} {pagination.page} / {pagination.pages || 1}
              </span>
              <select
                className="page-size-select"
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  fetchMovements(1);
                }}
              >
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={200}>200</option>
                <option value={500}>500</option>
              </select>
            </div>

            <button
              type="button"
              className="pagination-btn"
              disabled={!pagination.hasMore}
              onClick={() => handlePageChange(pagination.page + 1)}
            >
              {t('next', 'Next')}
              <ChevronRight size={16} />
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default TimelineView;
