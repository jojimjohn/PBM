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
// CSS moved to global index.css - using Tailwind classes

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
    <div className="px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 flex items-center justify-center bg-blue-600 text-white rounded-lg">
            <History size={18} />
          </div>
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">HISTORY</h2>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Your Expenses</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={20} className={isRefreshing ? 'animate-spin' : ''} />
          </button>
          <button
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors
              ${showFilters ? 'text-blue-600 bg-blue-100' : 'text-slate-500 hover:text-blue-600 hover:bg-blue-50'}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={20} />
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1.5 text-sm font-medium transition-colors
              ${filter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            onClick={() => setFilter('all')}
          >
            All
          </button>
          <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors
              ${filter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'}`}
            onClick={() => setFilter('pending')}
          >
            <Clock size={14} />
            Pending
          </button>
          <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors
              ${filter === 'approved' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'}`}
            onClick={() => setFilter('approved')}
          >
            <CheckCircle size={14} />
            Approved
          </button>
          <button
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium transition-colors
              ${filter === 'rejected' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'}`}
            onClick={() => setFilter('rejected')}
          >
            <XCircle size={14} />
            Rejected
          </button>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="flex flex-col items-center gap-3 py-8 text-center">
          <p className="text-red-600">{error}</p>
          <button
            className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 hover:bg-blue-50"
            onClick={handleRefresh}
          >
            Try Again
          </button>
        </div>
      )}

      {/* Loading State */}
      {isLoading && expenses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-500">
          <Loader2 size={32} className="animate-spin text-blue-500 mb-3" />
          <p className="text-sm">Loading expenses...</p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && expenses.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center py-12 text-slate-400">
          <Receipt size={48} className="mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-slate-600 mb-1">No Expenses Yet</h3>
          <p className="text-sm">
            {filter === 'all'
              ? 'You haven\'t submitted any expenses yet.'
              : `No ${filter} expenses found.`}
          </p>
        </div>
      )}

      {/* Expense List */}
      {expenses.length > 0 && (
        <div className="space-y-3">
          {expenses.map((expense) => {
            const status = statusConfig[expense.status] || statusConfig.pending;
            const StatusIcon = status.icon;

            const getStatusClasses = () => {
              switch (status.color) {
                case 'success': return 'bg-emerald-100 text-emerald-700';
                case 'warning': return 'bg-amber-100 text-amber-700';
                case 'danger': return 'bg-red-100 text-red-700';
                default: return 'bg-slate-100 text-slate-700';
              }
            };

            return (
              <div key={expense.id} className="bg-white border border-slate-200 shadow-sm overflow-hidden">
                {/* Card Header */}
                <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryIcons[expense.category] || '📋'}</span>
                    <span className="text-sm font-medium text-slate-700 capitalize">
                      {expense.category?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium ${getStatusClasses()}`}>
                    <StatusIcon size={12} />
                    <span>{status.label}</span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <p className="text-sm text-slate-800">{expense.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-semibold">
                      <Banknote size={16} />
                      <span>{formatAmount(expense.amount)} OMR</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-500">
                      <Calendar size={14} />
                      <span>{formatDate(expense.expenseDate)}</span>
                    </div>
                  </div>

                  {expense.vendor && (
                    <div className="text-xs text-slate-500">
                      <span className="text-slate-400">Vendor:</span>{' '}
                      <span className="text-slate-600">{expense.vendor}</span>
                    </div>
                  )}

                  {expense.hasReceipt && (
                    <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-blue-50 text-blue-600 text-xs">
                      <Image size={12} />
                      <span>
                        {expense.receiptCount > 1
                          ? `${expense.receiptCount} receipts attached`
                          : 'Receipt attached'}
                      </span>
                    </div>
                  )}

                  {expense.approvalNotes && expense.status === 'rejected' && (
                    <div className="flex items-start gap-2 p-2.5 bg-red-50 border border-red-200 text-red-700 text-xs">
                      <FileText size={14} className="shrink-0 mt-0.5" />
                      <span>{expense.approvalNotes}</span>
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="px-4 py-2 bg-slate-50 border-t border-slate-200">
                  <span className="text-xs font-mono text-slate-400">{expense.expenseNumber}</span>
                </div>
              </div>
            );
          })}

          {/* Load More */}
          {hasMore && (
            <button
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 transition-colors disabled:opacity-50"
              onClick={handleLoadMore}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Loading...
                </>
              ) : (
                <>
                  <ChevronDown size={16} />
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
