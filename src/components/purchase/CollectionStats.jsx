import React, { useMemo } from 'react';
import { Calendar, Truck, Package, FileCheck } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import StatCard from '../ui/StatCard';

/**
 * CollectionStats Component
 *
 * Displays statistics for Collections tab
 * Shows: Scheduled, In Progress, Completed, and Finalized counts
 *
 * @param {Array} collectionOrders - Array of collection order objects
 */
const CollectionStats = ({ collectionOrders = [] }) => {
  const { t } = useLocalization();

  // Calculate statistics using useMemo for performance
  const stats = useMemo(() => {
    return {
      scheduled: collectionOrders.filter(co => co.status === 'scheduled').length,
      inProgress: collectionOrders.filter(co => co.status === 'in_progress').length,
      completed: collectionOrders.filter(co => co.status === 'completed').length,
      finalized: collectionOrders.filter(co => co.status === 'finalized' || co.is_finalized).length
    };
  }, [collectionOrders]);

  return (
    <div className="stats-grid">
      <StatCard
        title={t('scheduledCollections')}
        value={stats.scheduled}
        icon={<Calendar size={24} />}
        color="blue"
      />
      <StatCard
        title={t('inProgressCollections')}
        value={stats.inProgress}
        icon={<Truck size={24} />}
        color="purple"
      />
      <StatCard
        title={t('completedCollections')}
        value={stats.completed}
        icon={<Package size={24} />}
        color="green"
      />
      <StatCard
        title={t('finalizedCollections')}
        value={stats.finalized}
        icon={<FileCheck size={24} />}
        color="cyan"
      />
    </div>
  );
};

export default CollectionStats;
