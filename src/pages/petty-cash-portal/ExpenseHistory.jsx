/**
 * Expense History
 *
 * Shows the user's expense history with status badges and filtering.
 * Mobile-optimized list view with pull-to-refresh support.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  History,
  Receipt,
  Calendar,
  Banknote,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  ChevronDown,
  Loader2,
  RefreshCw,
  Image,
  FileText,
} from 'lucide-react';
import pettyCashPortalService from '../../services/pettyCashPortalService';
import './PettyCashPortal.css';

// Category icons mapping
const categoryIcons = {
  fuel: '⛽',
  transport: '🚕',
  meals: '🍽️',
  office_supplies: '📦',
  maintenance: '🔧',
  communication: '📱',
  travel: '✈️',
  miscellaneous: '📋',
  emergency: '🚨',
};

// Status configuration
const statusConfig = {
  pending: {
    label: 'Pending',
    icon: Clock,
    color: 'warning',
  },
  approved: {
    label: 'Approved',
    icon: CheckCircle,
    color: 'success',
  },
  rejected: {
    label: 'Rejected',
    icon: XCircle,
    color: 'danger',
  },
};

const ExpenseHistory = ({ user }) => {
  const [expenses, setExpenses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch expenses
  const fetchExpenses = useCallback(async (refresh = false) => {
    try {
      if (refresh) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }

      const params = {
        page: refresh ? 1 : page,
        limit: 20,
      };

      if (filter !== 'all') {
        params.status = filter;
      }

      const result = await pettyCashPortalService.getExpenses(params);

      if (result.success) {
        if (refresh || page === 1) {
          setExpenses(result.data);
        } else {
          setExpenses((prev) => [...prev, ...result.data]);
        }
        setHasMore(result.pagination?.page < result.pagination?.pages);
      } else {
        setError(result.error || 'Failed to load expenses');
      }
    } catch (err) {
      setError(err.message || 'Failed to load expenses');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [page, filter]);

  // Initial load
  useEffect(() => {
    fetchExpenses(true);
  }, [filter]);

  // Load more when page changes
  useEffect(() => {
    if (page > 1) {
      fetchExpenses(false);
    }
  }, [page]);

  // Handle refresh
  const handleRefresh = () => {
    fetchExpenses(true);
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!isLoading && hasMore) {
      setPage((prev) => prev + 1);
    }
  };

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  // Format amount
  const formatAmount = (amount) => {
    return parseFloat(amount).toFixed(3);
  };

  return (
    <div className="expense-history">
      {/* Header */}
      <div className="history-header">
        <h2>
          <History size={24} />
          Expense History
        </h2>
        <div className="header-actions">
          <button
            className="refresh-btn"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={20} className={isRefreshing ? 'spinning' : ''} />
          </button>
          <button
            className={`filter-btn ${showFilters ? 'active' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="filter-bar">
          <button
            className={`filter-option ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`filter-option ${filter === 'pending' ? 'active' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <Clock size={16} />
            Pending
          </button>
          <button
            className={`filter-option ${filter === 'approved' ? 'active' : ''}`}
            onClick={() => setFilter('approved')}
          >
            <CheckCircle size={16} />
            Approved
          </button>
          <button
            className={`filter-option ${filter === 'rejected' ? 'active' : ''}`}
            onClick={() => setFilter('rejected')}
          >
            <XCircle size={16} />
            Rejected
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="history-error">
          <p>{error}</p>
          <button onClick={handleRefresh}>Try Again</button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && expenses.length === 0 && (
        <div className="history-loading">
          <Loader2 size={32} className="spinning" />
          <p>Loading expenses...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && expenses.length === 0 && !error && (
        <div className="history-empty">
          <Receipt size={48} />
          <h3>No Expenses Yet</h3>
          <p>
            {filter === 'all'
              ? 'You haven\'t submitted any expenses yet.'
              : `No ${filter} expenses found.`}
          </p>
        </div>
      )}

      {/* Expense List */}
      {expenses.length > 0 && (
        <div className="expense-list">
          {expenses.map((expense) => {
            const status = statusConfig[expense.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            return (
              <div key={expense.id} className="expense-card">
                <div className="expense-card-header">
                  <div className="expense-category">
                    <span className="category-emoji">
                      {categoryIcons[expense.category] || '📋'}
                    </span>
                    <span className="category-name">
                      {expense.category?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className={`expense-status status-${status.color}`}>
                    <StatusIcon size={14} />
                    <span>{status.label}</span>
                  </div>
                </div>

                <div className="expense-card-body">
                  <p className="expense-description">{expense.description}</p>

                  <div className="expense-details">
                    <div className="expense-amount">
                      <Banknote size={16} />
                      <span>{formatAmount(expense.amount)} OMR</span>
                    </div>
                    <div className="expense-date">
                      <Calendar size={16} />
                      <span>{formatDate(expense.expenseDate)}</span>
                    </div>
                  </div>

                  {expense.vendor && (
                    <div className="expense-vendor">
                      <span className="vendor-label">Vendor:</span>
                      <span className="vendor-name">{expense.vendor}</span>
                    </div>
                  )}

                  {expense.hasReceipt && (
                    <div className="expense-receipt">
                      <Image size={14} />
                      <span>
                        {expense.receiptCount > 1
                          ? `${expense.receiptCount} receipts attached`
                          : 'Receipt attached'}
                      </span>
                    </div>
                  )}

                  {expense.approvalNotes && expense.status === 'rejected' && (
                    <div className="expense-rejection-note">
                      <FileText size={14} />
                      <span>{expense.approvalNotes}</span>
                    </div>
                  )}
                </div>

                <div className="expense-card-footer">
                  <span className="expense-number">{expense.expenseNumber}</span>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <button
              className="load-more-btn"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="spinning" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown size={18} />
                  Load More
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default ExpenseHistory;
