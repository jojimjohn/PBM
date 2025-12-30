import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { useLocalization } from '../context/LocalizationContext';
import {
  Package,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronUp,
  Calendar,
  Hash,
  DollarSign,
  TrendingUp
} from 'lucide-react';
import salesOrderService from '../services/salesOrderService';
import './FIFOPreviewModal.css';

/**
 * FIFO Preview Modal Component
 *
 * Shows batch allocation preview before confirming a sales order.
 * Displays which batches will be used, COGS calculation, and gross margin.
 *
 * @param {boolean} isOpen - Modal visibility
 * @param {function} onClose - Close handler
 * @param {function} onConfirm - Confirm handler when user approves allocation
 * @param {Array} items - Order items: [{ materialId, quantity, unitPrice }]
 * @param {number} branchId - Optional branch filter
 * @param {function} formatCurrency - Currency formatting function
 */
const FIFOPreviewModal = ({
  isOpen,
  onClose,
  onConfirm,
  items = [],
  branchId = null,
  formatCurrency = (val) => `${parseFloat(val || 0).toFixed(3)} OMR`
}) => {
  const { t, isRTL } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [previewData, setPreviewData] = useState(null);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});
  const [lastFetchKey, setLastFetchKey] = useState('');

  // Create a stable key from items to prevent unnecessary refetches
  const itemsKey = items.map(i => `${i.materialId}-${i.quantity}`).join('|');

  // Fetch FIFO preview when modal opens (only once per unique item set)
  useEffect(() => {
    if (isOpen && items.length > 0 && itemsKey !== lastFetchKey) {
      setLastFetchKey(itemsKey);
      fetchPreview();
    }
  }, [isOpen, itemsKey]);

  const fetchPreview = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await salesOrderService.previewFIFO(items, branchId);

      if (result.success) {
        setPreviewData(result.data);
        // Auto-expand first item if there are allocations
        if (result.data.items.length > 0) {
          setExpandedItems({ [result.data.items[0].materialId]: true });
        }
      } else {
        setError(result.error || 'Failed to load FIFO preview');
      }
    } catch (err) {
      setError(err.message || 'An error occurred while loading preview');
    } finally {
      setLoading(false);
    }
  };

  const toggleItemExpand = (materialId) => {
    setExpandedItems(prev => ({
      ...prev,
      [materialId]: !prev[materialId]
    }));
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const handleConfirm = () => {
    if (previewData?.canFulfillAll) {
      onConfirm(previewData);
    }
  };

  const renderLoading = () => (
    <div className="fifo-preview-loading">
      <div className="fifo-loading-spinner" />
      <p>{t('loading') || 'Loading FIFO preview...'}</p>
    </div>
  );

  const renderError = () => (
    <div className="fifo-preview-error">
      <XCircle className="fifo-error-icon" />
      <p>{error}</p>
      <button className="fifo-retry-btn" onClick={fetchPreview}>
        {t('retry') || 'Retry'}
      </button>
    </div>
  );

  const renderInsufficientWarning = () => {
    if (!previewData?.insufficientItems?.length) return null;

    return (
      <div className="fifo-insufficient-warning">
        <AlertTriangle className="fifo-warning-icon" />
        <div className="fifo-warning-content">
          <strong>{t('insufficientStock') || 'Insufficient Stock'}</strong>
          <p>{t('insufficientStockDescription') || 'The following items cannot be fulfilled:'}</p>
          <ul>
            {previewData.insufficientItems.map((item, idx) => (
              <li key={idx}>
                <span className="fifo-item-name">{item.materialName}</span>
                <span className="fifo-item-shortage">
                  {t('requested') || 'Requested'}: {item.requested.toFixed(3)} |
                  {t('available') || 'Available'}: {item.available.toFixed(3)} |
                  {t('shortfall') || 'Shortfall'}: <strong>{item.shortfall.toFixed(3)}</strong>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    );
  };

  const renderSummary = () => {
    if (!previewData?.summary) return null;

    const { totalCOGS, totalRevenue, grossMargin, grossMarginPercent } = previewData.summary;
    const isPositiveMargin = grossMargin >= 0;

    return (
      <div className="fifo-summary-section">
        <h4 className="fifo-section-title">
          <TrendingUp className="fifo-section-icon" />
          {t('orderSummary') || 'Order Summary'}
        </h4>
        <div className="fifo-summary-grid">
          <div className="fifo-summary-item">
            <span className="fifo-summary-label">{t('totalRevenue') || 'Total Revenue'}</span>
            <span className="fifo-summary-value revenue">{formatCurrency(totalRevenue)}</span>
          </div>
          <div className="fifo-summary-item">
            <span className="fifo-summary-label">{t('totalCOGS') || 'Total COGS'}</span>
            <span className="fifo-summary-value cogs">{formatCurrency(totalCOGS)}</span>
          </div>
          <div className="fifo-summary-item highlight">
            <span className="fifo-summary-label">{t('grossMargin') || 'Gross Margin'}</span>
            <span className={`fifo-summary-value margin ${isPositiveMargin ? 'positive' : 'negative'}`}>
              {formatCurrency(grossMargin)} ({grossMarginPercent}%)
            </span>
          </div>
        </div>
      </div>
    );
  };

  const renderItemPreview = (item) => {
    const isExpanded = expandedItems[item.materialId];
    const hasAllocations = item.allocations && item.allocations.length > 0;

    return (
      <div key={item.materialId} className={`fifo-item-card ${!item.canFulfill ? 'insufficient' : ''}`}>
        <div
          className="fifo-item-header"
          onClick={() => hasAllocations && toggleItemExpand(item.materialId)}
          style={{ cursor: hasAllocations ? 'pointer' : 'default' }}
        >
          <div className="fifo-item-info">
            <div className="fifo-item-status">
              {item.canFulfill ? (
                <CheckCircle2 className="fifo-status-icon success" />
              ) : (
                <XCircle className="fifo-status-icon error" />
              )}
            </div>
            <div className="fifo-item-details">
              <span className="fifo-item-name">{item.materialName}</span>
              <span className="fifo-item-code">{item.materialCode}</span>
            </div>
          </div>

          <div className="fifo-item-metrics">
            <div className="fifo-metric">
              <span className="fifo-metric-label">{t('qty') || 'Qty'}</span>
              <span className="fifo-metric-value">{item.requestedQuantity.toFixed(3)} {item.unit}</span>
            </div>
            <div className="fifo-metric">
              <span className="fifo-metric-label">{t('cogs') || 'COGS'}</span>
              <span className="fifo-metric-value">{formatCurrency(item.cogs)}</span>
            </div>
            {item.grossMargin !== null && (
              <div className="fifo-metric">
                <span className="fifo-metric-label">{t('margin') || 'Margin'}</span>
                <span className={`fifo-metric-value ${item.grossMargin >= 0 ? 'positive' : 'negative'}`}>
                  {formatCurrency(item.grossMargin)}
                </span>
              </div>
            )}
            {hasAllocations && (
              <div className="fifo-expand-icon">
                {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </div>
            )}
          </div>
        </div>

        {/* Batch Allocations - Expandable */}
        {hasAllocations && isExpanded && (
          <div className="fifo-allocations-section">
            <table className="fifo-allocations-table">
              <thead>
                <tr>
                  <th><Hash size={14} /> {t('batchNumber') || 'Batch'}</th>
                  <th><Calendar size={14} /> {t('purchaseDate') || 'Purchase Date'}</th>
                  <th>{t('quantity') || 'Quantity'}</th>
                  <th><DollarSign size={14} /> {t('unitCost') || 'Unit Cost'}</th>
                  <th><DollarSign size={14} /> {t('cogs') || 'COGS'}</th>
                </tr>
              </thead>
              <tbody>
                {item.allocations.map((alloc, idx) => (
                  <tr key={idx}>
                    <td className="batch-number">{alloc.batchNumber}</td>
                    <td>{formatDate(alloc.purchaseDate)}</td>
                    <td>{alloc.quantity.toFixed(3)}</td>
                    <td>{formatCurrency(alloc.unitCost)}</td>
                    <td className="cogs-value">{formatCurrency(alloc.cogs)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr>
                  <td colSpan={4} className="total-label">{t('totalCOGS') || 'Total COGS'}</td>
                  <td className="total-value">{formatCurrency(item.cogs)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {/* Shortfall Warning */}
        {!item.canFulfill && (
          <div className="fifo-item-shortfall">
            <AlertTriangle size={14} />
            <span>
              {t('shortfall') || 'Shortfall'}: {item.shortfall.toFixed(3)} {item.unit}
              ({t('available') || 'Available'}: {item.totalAvailable.toFixed(3)})
            </span>
          </div>
        )}
      </div>
    );
  };

  const renderContent = () => {
    if (loading) return renderLoading();
    if (error) return renderError();
    if (!previewData) return null;

    return (
      <div className="fifo-preview-content">
        {/* Insufficient Stock Warning */}
        {renderInsufficientWarning()}

        {/* Items Section */}
        <div className="fifo-items-section">
          <h4 className="fifo-section-title">
            <Package className="fifo-section-icon" />
            {t('batchAllocations') || 'Batch Allocations'}
            <span className="fifo-item-count">({previewData.items.length} {t('items') || 'items'})</span>
          </h4>
          <div className="fifo-items-list">
            {previewData.items.map(renderItemPreview)}
          </div>
        </div>

        {/* Summary Section */}
        {renderSummary()}
      </div>
    );
  };

  const renderFooter = () => (
    <div className="fifo-preview-footer">
      <button
        className="fifo-cancel-btn"
        onClick={onClose}
      >
        {t('cancel') || 'Cancel'}
      </button>
      <button
        className="fifo-confirm-btn"
        onClick={handleConfirm}
        disabled={loading || !previewData?.canFulfillAll}
      >
        {previewData?.canFulfillAll
          ? (t('confirmOrder') || 'Confirm Order')
          : (t('cannotConfirm') || 'Cannot Confirm - Insufficient Stock')
        }
      </button>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('fifoPreview') || 'FIFO Allocation Preview'}
      description={t('fifoPreviewDescription') || 'Review which batches will be allocated for this order'}
      size="lg"
      closeOnOverlayClick={false}
      footer={renderFooter()}
    >
      {renderContent()}
    </Modal>
  );
};

export default FIFOPreviewModal;
