import React, { useMemo } from 'react';
import { Clock, CheckCircle, XCircle } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import StatCard from '../ui/StatCard';

/**
 * ExpenseStats Component
 *
 * Displays statistics for Expenses tab
 * Shows: Pending Approval, Approved, and Rejected counts
 *
 * @param {Array} expenses - Array of expense objects
 */
const ExpenseStats = ({ expenses = [] }) => {
  const { t } = useLocalization();

  // Calculate statistics using useMemo for performance
  const stats = useMemo(() => {
    return {
      pendingApproval: expenses.filter(e => e.status === 'pending').length,
      approved: expenses.filter(e => e.status === 'approved').length,
      rejected: expenses.filter(e => e.status === 'rejected').length
    };
  }, [expenses]);

  return (
    <div className="stats-grid">
      <StatCard
        title={t('pendingApproval')}
        value={stats.pendingApproval}
        icon={<Clock size={24} />}
        color="orange"
      />
      <StatCard
        title={t('approvedExpenses')}
        value={stats.approved}
        icon={<CheckCircle size={24} />}
        color="green"
      />
      <StatCard
        title={t('rejectedExpenses')}
        value={stats.rejected}
        icon={<XCircle size={24} />}
        color="red"
      />
    </div>
  );
};

export default ExpenseStats;
