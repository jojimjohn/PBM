import React, { useMemo } from 'react';
import { Clock, CheckCircle, Package, FileText } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import StatCard from '../ui/StatCard';

/**
 * PurchaseOrderStats Component
 *
 * Displays statistics for Purchase Orders tab
 * Shows: Pending, Approved, Received, and Billed counts
 *
 * @param {Array} purchaseOrders - Array of purchase order objects
 */
const PurchaseOrderStats = ({ purchaseOrders = [] }) => {
  const { t } = useLocalization();

  // Calculate statistics using useMemo for performance
  const stats = useMemo(() => {
    return {
      pending: purchaseOrders.filter(po => po.status === 'pending').length,
      approved: purchaseOrders.filter(po => po.status === 'approved').length,
      received: purchaseOrders.filter(po => po.status === 'received').length,
      billed: purchaseOrders.filter(po => po.billingStatus === 'billed').length
    };
  }, [purchaseOrders]);

  return (
    <div className="stats-grid">
      <StatCard
        title={t('pendingOrders')}
        value={stats.pending}
        icon={<Clock size={24} />}
        color="orange"
      />
      <StatCard
        title={t('approvedOrders')}
        value={stats.approved}
        icon={<CheckCircle size={24} />}
        color="green"
      />
      <StatCard
        title={t('receivedOrders')}
        value={stats.received}
        icon={<Package size={24} />}
        color="blue"
      />
      <StatCard
        title={t('billedOrders')}
        value={stats.billed}
        icon={<FileText size={24} />}
        color="purple"
      />
    </div>
  );
};

export default PurchaseOrderStats;
