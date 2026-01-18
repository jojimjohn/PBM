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
  const quantityColorClass = isIncoming ? 'text-emerald-600' : 'text-red-600';
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
    <div
      className={`grid grid-cols-[90px_1fr_auto] items-center gap-2.5 px-3 py-2 border-b border-gray-100 last:border-b-0 transition-colors hover:bg-gray-50 max-md:grid-cols-[70px_1fr] ${canViewWastage ? 'cursor-pointer hover:bg-violet-50' : ''}`}
      onClick={canViewWastage ? handleWastageClick : undefined}
    >
      <div className="flex items-center gap-1.5 min-w-[90px] max-md:flex-col max-md:items-start max-md:gap-0.5 max-md:min-w-[70px]">
        <div
          className="flex items-center justify-center w-7 h-7 shrink-0"
          style={{ backgroundColor: config.bgColor, color: config.color }}
        >
          <Icon size={14} />
        </div>
        <span className="text-[10px] font-semibold uppercase tracking-wide whitespace-nowrap max-md:text-[9px]" style={{ color: config.color }}>
          {isRTL ? config.labelAr : config.label}
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2 min-w-0">
        <span className="text-[13px] font-medium text-gray-700 whitespace-nowrap overflow-hidden text-ellipsis max-w-[200px] max-md:max-w-[150px]" title={movement.materialName}>
          {movement.materialName || 'Unknown'}
        </span>
        {movement.materialCode && (
          <span className="text-[11px] text-gray-400">#{movement.materialCode}</span>
        )}
        {movement.traceability && (
          <div className="flex gap-1">
            {movement.traceability.purchaseOrderNumber && (
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-500">PO: {movement.traceability.purchaseOrderNumber}</span>
            )}
            {movement.traceability.collectionOrderNumber && (
              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-[10px] font-medium text-gray-500">CO: {movement.traceability.collectionOrderNumber}</span>
            )}
            {movement.traceability.isManualReceipt && (
              <span className="inline-block px-1.5 py-0.5 bg-indigo-100 text-[10px] font-medium text-indigo-700">Manual</span>
            )}
            {isWastage && movement.referenceNumber && (
              <span className="inline-block px-1.5 py-0.5 bg-violet-100 text-[10px] font-medium text-violet-700">W: {movement.referenceNumber}</span>
            )}
          </div>
        )}
        {canViewWastage && (
          <button
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-violet-100 border border-violet-300 text-violet-700 text-[11px] font-medium cursor-pointer transition-colors hover:bg-violet-200 hover:border-violet-400"
            onClick={handleWastageClick}
            title={t('viewWastageDetails', 'View Wastage Details')}
          >
            <ExternalLink size={12} />
            <span>{t('viewDetails', 'View')}</span>
          </button>
        )}
      </div>

      <div className="flex flex-col items-end gap-0.5 min-w-[100px] max-md:col-start-2 max-md:items-start max-md:mt-1">
        <span className={`text-[13px] font-semibold font-mono ${quantityColorClass}`}>
          {quantitySign}{quantity.toFixed(2)} {unit}
        </span>
        {(movement.unitCost > 0) && (
          <span className="text-[11px] text-gray-400 font-mono">
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
    <div className="bg-white border border-slate-200 overflow-hidden">
      <div
        className="flex items-center gap-2 px-3 py-2.5 text-[13px] font-semibold text-slate-700 bg-slate-50 cursor-pointer select-none transition-colors hover:bg-slate-100"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <ChevronDown size={16} className={`transition-transform ${!isExpanded ? '-rotate-90' : ''}`} />
        <Calendar size={14} />
        <span>{formatDateHeader(dateKey)}</span>
        <span className="font-normal text-xs text-gray-500 ml-auto rtl:ml-0 rtl:mr-auto">
          {movements.length} {movements.length === 1 ? t('movement', 'movement') : t('movements', 'movements')}
        </span>
      </div>
      <div className={`flex flex-col ${!isExpanded ? 'hidden' : ''}`}>
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
    <div className="flex flex-col gap-4">
      {/* Header with stats */}
      <div className="flex justify-between items-center gap-4 flex-wrap max-md:flex-col max-md:items-start">
        <div className="flex gap-4 text-[13px] text-gray-500">
          <div className="flex items-center gap-1.5">
            <TrendingUp size={14} className="text-emerald-600" />
            <span>In: <span className="font-semibold text-emerald-600">{totalIn.toFixed(2)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <TrendingDown size={14} className="text-red-600" />
            <span>Out: <span className="font-semibold text-red-600">{totalOut.toFixed(2)}</span></span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>Total: <span className="font-semibold text-gray-700">{pagination.total}</span> records</span>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-end gap-3 p-3 bg-slate-50 border border-slate-200 max-md:flex-col max-md:items-stretch">
        <div className="flex flex-wrap items-end gap-3 max-md:flex-col">
          <div className="flex flex-col gap-0.5 min-w-[150px] max-md:w-full">
            <DateInput
              label={t('from', 'From')}
              value={startDate || ''}
              onChange={(value) => value && setStartDate(value)}
              size="small"
              maxDate={endDate || new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex flex-col gap-0.5 min-w-[150px] max-md:w-full">
            <DateInput
              label={t('to', 'To')}
              value={endDate || ''}
              onChange={(value) => value && setEndDate(value)}
              size="small"
              minDate={startDate || ''}
              maxDate={new Date().toISOString().split('T')[0]}
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white border border-blue-600 text-[13px] font-medium cursor-pointer transition-colors hover:bg-blue-700 h-8"
            onClick={handleApplyFilters}
          >
            <Filter size={14} />
            {t('apply', 'Apply')}
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 ml-auto max-md:ml-0 max-md:overflow-x-auto max-md:flex-nowrap max-md:pb-1">
          <button
            type="button"
            className={`px-2.5 py-1 border text-xs font-medium cursor-pointer transition-all ${typeFilter === '' ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600'}`}
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
                className={`px-2.5 py-1 border text-xs font-medium cursor-pointer transition-all ${typeFilter === type ? '' : 'bg-white border-slate-300 text-slate-600 hover:border-blue-500 hover:text-blue-600'}`}
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
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500 text-center">
          <Loader2 className="animate-spin" size={20} />
          <span>{t('loading', 'Loading...')}</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-red-600 text-center">
          <p>{error}</p>
          <button
            onClick={() => fetchMovements(pagination.page)}
            className="px-3.5 py-1.5 bg-blue-600 text-white border border-blue-600 text-[13px] font-medium cursor-pointer hover:bg-blue-700"
          >
            {t('retry', 'Retry')}
          </button>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && movements.length === 0 && (
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-gray-500 text-center">
          <Package size={40} className="opacity-40" />
          <h3 className="m-0 text-base font-semibold text-gray-700">{t('noTransactionsFound', 'No transactions found')}</h3>
          <p className="m-0 text-[13px]">{t('noTransactionsDescription', 'Try adjusting your date range or filters. Transactions include purchases, sales, adjustments, and wastages.')}</p>
        </div>
      )}

      {/* Timeline content */}
      {!loading && !error && movements.length > 0 && (
        <>
          <div className="flex flex-col gap-2">
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
          <div className="flex justify-between items-center gap-3 py-3 max-md:flex-wrap max-md:justify-center max-md:gap-2">
            <button
              type="button"
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-[13px] text-slate-700 font-medium cursor-pointer transition-all whitespace-nowrap shrink-0 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed max-md:min-w-[80px] max-md:justify-center"
              disabled={pagination.page <= 1}
              onClick={() => handlePageChange(pagination.page - 1)}
            >
              <ChevronLeft size={16} />
              {t('previous', 'Prev')}
            </button>

            <div className="flex items-center gap-2">
              <span className="text-[13px] text-slate-500">
                {t('page', 'Page')} {pagination.page} / {pagination.pages || 1}
              </span>
              <select
                className="px-2 py-1 border border-slate-300 text-[13px] text-slate-700 bg-white cursor-pointer focus:outline-none focus:border-blue-500"
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
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-300 text-[13px] text-slate-700 font-medium cursor-pointer transition-all whitespace-nowrap shrink-0 hover:border-blue-500 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed max-md:min-w-[80px] max-md:justify-center"
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
