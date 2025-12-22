import React from 'react';
import { Clock, Calendar, Truck, CheckCircle, FileCheck, Package, ChevronRight } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import './WorkflowProgressBar.css';

/**
 * WorkflowProgressBar - Interactive workflow stage selector for Collections
 *
 * Displays the collection workflow stages as a clickable horizontal bar:
 * Scheduled → In Progress → Completed → Finalized
 *
 * Note: collection_orders table doesn't have 'pending' status.
 * Workflow starts at 'scheduled' when order is created.
 *
 * Each stage shows a count badge and filters the table when clicked.
 */

// Workflow stage configuration - matches collection_orders.status enum
// DB statuses: scheduled, in_transit, collecting, completed, cancelled, failed
const WORKFLOW_STAGES = [
  {
    id: 'scheduled',
    icon: Calendar,
    labelKey: 'scheduled',
    color: 'yellow', // Changed to yellow since it's first stage now
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-400',
    textColor: 'text-yellow-700',
    iconColor: 'text-yellow-500',
    descriptionKey: 'scheduledDescription',
    statuses: ['scheduled']
  },
  {
    id: 'in_progress',
    icon: Truck,
    labelKey: 'inProgress',
    color: 'blue', // Changed to blue to differentiate from scheduled
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-400',
    textColor: 'text-blue-700',
    iconColor: 'text-blue-500',
    descriptionKey: 'inProgressDescription',
    statuses: ['in_transit', 'collecting']
  },
  {
    id: 'completed',
    icon: CheckCircle,
    labelKey: 'completed',
    color: 'green',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-400',
    textColor: 'text-green-700',
    iconColor: 'text-green-500',
    descriptionKey: 'completedDescription',
    statuses: ['completed'],
    excludeFinalized: true // Only non-finalized completed items
  },
  {
    id: 'finalized',
    icon: FileCheck,
    labelKey: 'finalized',
    color: 'indigo',
    bgColor: 'bg-indigo-50',
    borderColor: 'border-indigo-400',
    textColor: 'text-indigo-700',
    iconColor: 'text-indigo-500',
    descriptionKey: 'finalizedDescription',
    statuses: ['completed'],
    requireFinalized: true // Only finalized items
  }
];

const WorkflowProgressBar = ({
  activeStage = 'all',
  onStageChange,
  stats = {},
  compact = false,
  className = ''
}) => {
  const { t, isRTL } = useLocalization();

  // Calculate count for each stage
  const getStageCount = (stage) => {
    switch (stage.id) {
      case 'scheduled':
        return stats.scheduled || 0;
      case 'in_progress':
        return stats.inProgress || 0;
      case 'completed':
        return stats.completed || 0;
      case 'finalized':
        return stats.finalized || 0;
      default:
        return 0;
    }
  };

  const totalCount = stats.total || 0;

  const handleStageClick = (stageId) => {
    if (onStageChange) {
      // Toggle off if clicking the active stage
      if (stageId === activeStage) {
        onStageChange('all');
      } else {
        onStageChange(stageId);
      }
    }
  };

  return (
    <div className={`workflow-progress-bar ${compact ? 'compact' : ''} ${isRTL ? 'rtl' : 'ltr'} ${className}`}>
      {/* Show All button */}
      <button
        className={`workflow-stage workflow-stage-all ${activeStage === 'all' ? 'active' : ''}`}
        onClick={() => handleStageClick('all')}
        title={t('showAllCollections') || 'Show all collections'}
      >
        <Package className="stage-icon" />
        <span className="stage-count">{totalCount}</span>
      </button>

      <div className="workflow-divider" />

      {/* Workflow stages */}
      <div className="workflow-stages-container">
        {WORKFLOW_STAGES.map((stage, index) => {
          const Icon = stage.icon;
          const count = getStageCount(stage);
          const isActive = activeStage === stage.id;
          const isLast = index === WORKFLOW_STAGES.length - 1;

          return (
            <React.Fragment key={stage.id}>
              <button
                className={`workflow-stage workflow-stage-${stage.color} ${isActive ? 'active' : ''} ${count === 0 ? 'empty' : ''}`}
                onClick={() => handleStageClick(stage.id)}
                title={`${t(stage.labelKey) || stage.labelKey}: ${t(stage.descriptionKey) || ''}`}
                data-stage={stage.id}
              >
                <Icon className="stage-icon" />
                <span className="stage-count">{count}</span>
              </button>

              {!isLast && (
                <ChevronRight className={`workflow-arrow ${isRTL ? 'rtl-flip' : ''}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

// Export stage configuration for use in CalloutManager
export { WORKFLOW_STAGES };
export default WorkflowProgressBar;
