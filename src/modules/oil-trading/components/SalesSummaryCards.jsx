/**
 * Sales Summary Cards Component
 *
 * Displays summary statistics for sales orders.
 * Shows today's sales, order counts, and pending orders.
 *
 * @module components/SalesSummaryCards
 */

import React from 'react'
import { Banknote, FileText, Clock, TrendingUp, Package, AlertTriangle } from 'lucide-react'

/**
 * @typedef {Object} SalesSummary
 * @property {number} totalSales - Total sales amount (today)
 * @property {number} totalOrders - Total orders count (today)
 * @property {number} pendingOrders - Pending orders count
 * @property {number} [totalRevenue] - Total revenue (all time)
 * @property {number} [averageOrderValue] - Average order value
 * @property {number} [overdueInvoices] - Overdue invoices count
 */

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string} Formatted currency string
 */
const formatCurrency = (amount) => {
  const value = parseFloat(amount) || 0
  return `OMR ${value.toFixed(2)}`
}

/**
 * Individual summary card component
 */
const SummaryCard = ({ icon: Icon, value, label, variant = 'default' }) => (
  <div className="summary-card">
    <div className={`summary-icon ${variant}`}>
      <Icon size={24} />
    </div>
    <div className="summary-info">
      <p className="summary-value">{value}</p>
      <p className="summary-label">{label}</p>
    </div>
  </div>
)

/**
 * Sales Summary Cards Component
 *
 * @param {Object} props
 * @param {SalesSummary} props.summary - Summary statistics
 * @param {Function} props.t - Translation function
 * @param {boolean} [props.showExtended=false] - Show extended stats
 */
const SalesSummaryCards = ({
  summary,
  t,
  showExtended = false
}) => {
  const {
    totalSales = 0,
    totalOrders = 0,
    pendingOrders = 0,
    totalRevenue = 0,
    averageOrderValue = 0,
    overdueInvoices = 0
  } = summary || {}

  return (
    <div className="sales-summary">
      <div className="summary-cards">
        {/* Today's Sales */}
        <SummaryCard
          icon={Banknote}
          value={formatCurrency(totalSales)}
          label={t('totalSalesToday', 'Total Sales (Today)')}
          variant="success"
        />

        {/* Orders Today */}
        <SummaryCard
          icon={FileText}
          value={totalOrders}
          label={t('ordersToday', 'Orders (Today)')}
          variant="primary"
        />

        {/* Pending Orders */}
        <SummaryCard
          icon={Clock}
          value={pendingOrders}
          label={t('pendingOrders', 'Pending Orders')}
          variant="warning"
        />

        {/* Extended Stats */}
        {showExtended && (
          <>
            {/* Total Revenue */}
            <SummaryCard
              icon={TrendingUp}
              value={formatCurrency(totalRevenue)}
              label={t('totalRevenue', 'Total Revenue')}
              variant="success"
            />

            {/* Average Order Value */}
            <SummaryCard
              icon={Package}
              value={formatCurrency(averageOrderValue)}
              label={t('averageOrderValue', 'Avg Order Value')}
              variant="primary"
            />

            {/* Overdue Invoices */}
            {overdueInvoices > 0 && (
              <SummaryCard
                icon={AlertTriangle}
                value={overdueInvoices}
                label={t('overdueInvoices', 'Overdue Invoices')}
                variant="danger"
              />
            )}
          </>
        )}
      </div>
    </div>
  )
}

/**
 * Compact version for smaller displays
 */
export const SalesSummaryCardsCompact = ({ summary, t }) => {
  const { totalSales = 0, totalOrders = 0, pendingOrders = 0 } = summary || {}

  return (
    <div className="sales-summary compact">
      <div className="summary-stat">
        <Banknote size={16} />
        <span>{formatCurrency(totalSales)}</span>
      </div>
      <div className="summary-stat">
        <FileText size={16} />
        <span>{totalOrders} {t('orders', 'orders')}</span>
      </div>
      <div className="summary-stat">
        <Clock size={16} />
        <span>{pendingOrders} {t('pending', 'pending')}</span>
      </div>
    </div>
  )
}

export default SalesSummaryCards
