/**
 * WastageSummaryCards Component
 *
 * Displays summary statistics for wastage records.
 * Used at the top of the wastage list page.
 *
 * Supports two modes:
 * 1. Pass wastages array - component calculates summary
 * 2. Pass pre-computed values directly (totalWastages, totalCost, etc.)
 */

import React, { useMemo } from 'react';
import { Package, AlertTriangle, CheckCircle, XCircle, Clock, Banknote } from 'lucide-react';
import { formatCurrency as formatCurrencyUtil } from '../../../../lib/utils';
import { useLocalization } from '../../../../context/LocalizationContext';

// Safe currency formatter that handles NaN/undefined
const formatCurrency = (amount) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return 'OMR 0.000';
  return formatCurrencyUtil(num);
};

/**
 * @param {Object} props
 * @param {Array} [props.wastages] - Array of wastage records (calculates summary if provided)
 * @param {number} [props.totalWastages] - Pre-computed total count
 * @param {number} [props.totalCost] - Pre-computed total cost
 * @param {number} [props.pendingCount] - Pre-computed pending count
 * @param {number} [props.approvedCount] - Pre-computed approved count
 * @param {boolean} [props.loading] - Loading state
 * @param {Function} [props.onPendingClick] - Click handler for pending card
 * @param {boolean} [props.pendingFilterActive] - Whether pending filter is active
 */
export function WastageSummaryCards({
  wastages,
  totalWastages,
  totalCost,
  pendingCount,
  approvedCount,
  loading = false,
  onPendingClick,
  pendingFilterActive = false
}) {
  const { t } = useLocalization();

  // Calculate summary statistics from wastages array if provided
  const calculatedSummary = useMemo(() => {
    if (!wastages?.length) {
      return null;
    }

    return wastages.reduce((acc, w) => {
      acc.total++;
      acc.totalCost += w.totalCost || 0;

      switch (w.status) {
        case 'pending':
        case 'pending_approval':
          acc.pending++;
          acc.pendingCost += w.totalCost || 0;
          break;
        case 'approved':
          acc.approved++;
          break;
        case 'rejected':
          acc.rejected++;
          break;
        default:
          break;
      }

      return acc;
    }, {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalCost: 0,
      pendingCost: 0
    });
  }, [wastages]);

  // Use pre-computed values if provided, otherwise use calculated values
  const summary = {
    total: totalWastages ?? calculatedSummary?.total ?? 0,
    totalCost: totalCost ?? calculatedSummary?.totalCost ?? 0,
    pending: pendingCount ?? calculatedSummary?.pending ?? 0,
    approved: approvedCount ?? calculatedSummary?.approved ?? 0
  };

  // Loading state - show skeletons
  if (loading) {
    return (
      <div className="summary-cards">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="summary-card animate-pulse">
            <div className="summary-icon" style={{ backgroundColor: '#e5e7eb' }} />
            <div>
              <div className="h-6 bg-gray-200 rounded w-12 mb-1" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="summary-cards">
      {/* Total Wastages */}
      <div className="summary-card">
        <div className="summary-icon warning">
          <AlertTriangle size={22} />
        </div>
        <div>
          <div className="summary-value">{summary.total}</div>
          <div className="summary-label">{t('totalWastages') || 'Total Wastages'}</div>
        </div>
      </div>

      {/* Total Cost */}
      <div className="summary-card">
        <div className="summary-icon danger">
          <Banknote size={22} />
        </div>
        <div>
          <div className="summary-value">{formatCurrency(summary.totalCost)}</div>
          <div className="summary-label">{t('totalWasteCost') || 'Total Waste Cost'}</div>
        </div>
      </div>

      {/* Pending Approval - Clickable if handler provided */}
      <div
        className={`summary-card ${onPendingClick ? 'clickable' : ''} ${pendingFilterActive ? 'active' : ''}`}
        onClick={onPendingClick}
        title={onPendingClick ? (t('clickToFilter') || 'Click to filter pending wastages') : ''}
        style={{ cursor: onPendingClick ? 'pointer' : 'default' }}
      >
        <div className="summary-icon info">
          <Clock size={22} />
        </div>
        <div>
          <div className="summary-value">{summary.pending}</div>
          <div className="summary-label">{t('pendingApproval') || 'Pending Approval'}</div>
        </div>
      </div>

      {/* Approved */}
      <div className="summary-card">
        <div className="summary-icon success">
          <CheckCircle size={22} />
        </div>
        <div>
          <div className="summary-value">{summary.approved}</div>
          <div className="summary-label">{t('approved') || 'Approved'}</div>
        </div>
      </div>
    </div>
  );
}

export default WastageSummaryCards;
