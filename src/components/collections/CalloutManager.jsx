import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { AlertCircle, Plus, RefreshCw, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, Truck, User, Play, FileCheck, FileEdit, Navigation, PackageSearch, ClipboardList } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { useProjects } from '../../context/ProjectContext';
import { calloutService } from '../../services/collectionService';
import dataCacheService from '../../services/dataCacheService';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import CalloutFormModal from './CalloutFormModal';
import CalloutDetailsModal from './CalloutDetailsModal';
import DriverAssignmentModal from './DriverAssignmentModal';
import StatusUpdateModal from './StatusUpdateModal';
import WCNFinalizationModal from './WCNFinalizationModal';
import WCNRectificationModal from './WCNRectificationModal';
import WorkflowProgressBar, { WORKFLOW_STAGES } from './WorkflowProgressBar';
import './collections-managers.css';

/**
 * CalloutManager - Main collection orders management interface
 *
 * Features:
 * - Workflow Progress Bar for stage-based filtering
 * - Type badges distinguishing Callout vs Collection Order vs WCN
 * - Contextual "Next Step" action buttons
 * - Empty state guidance per workflow stage
 */

const CalloutManager = () => {
  const { t, isRTL } = useLocalization();
  const { formatDate } = useSystemSettings();
  const { selectedProjectId, getProjectQueryParam } = useProjects();
  const [loading, setLoading] = useState(false);
  const [callouts, setCallouts] = useState([]);
  const [workflowStage, setWorkflowStage] = useState('all'); // Workflow stage filter
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCallout, setSelectedCallout] = useState(null);
  // Note: DataTable handles its own internal pagination
  // We load all data and let DataTable paginate client-side
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 1000, // Load all data - DataTable paginates internally
    total: 0,
    totalPages: 0
  });

  // Persistent stats - loaded separately from filtered data
  const [globalStats, setGlobalStats] = useState({
    pending: 0,
    scheduled: 0,
    inProgress: 0,
    completed: 0,
    finalized: 0,
    total: 0
  });

  // Driver and Status Management
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCollectionOrder, setSelectedCollectionOrder] = useState(null);

  // WCN Management (Sprint 4.5)
  const [showWCNFinalizationModal, setShowWCNFinalizationModal] = useState(false);
  const [showWCNRectificationModal, setShowWCNRectificationModal] = useState(false);
  const [selectedWCNOrder, setSelectedWCNOrder] = useState(null);

  // Convert workflow stage to API status filter
  // DB statuses: scheduled, in_transit, collecting, completed, cancelled, failed
  const getStatusFilterFromWorkflowStage = useCallback((stage) => {
    switch (stage) {
      case 'scheduled':
        return 'scheduled';
      case 'in_progress':
        return 'in_transit,collecting'; // API handles comma-separated
      case 'completed':
        return 'completed'; // Will filter finalized out in client
      case 'finalized':
        return 'completed'; // Will filter non-finalized out in client
      default:
        return undefined; // 'all' stage - no filter
    }
  }, []);

  // Helper function to check if a row is finalized
  // MySQL can return boolean true, number 1, or string '1'
  const checkIsFinalized = useCallback((row) => {
    const val = row.is_finalized;
    return val === true || val === 1 || val === '1';
  }, []);

  // Calculate stats from loaded data (avoids duplicate API call)
  const calculateGlobalStats = useCallback((allData) => {
    const scheduled = allData.filter(c => c.status === 'scheduled').length;
    const inTransit = allData.filter(c => c.status === 'in_transit').length;
    const collecting = allData.filter(c => c.status === 'collecting').length;
    const inProgress = inTransit + collecting;
    const completedNotFinalized = allData.filter(c =>
      c.status === 'completed' && !checkIsFinalized(c)
    ).length;
    const finalized = allData.filter(c => checkIsFinalized(c)).length;

    setGlobalStats({
      pending: 0,
      scheduled,
      inProgress,
      completed: completedNotFinalized,
      finalized,
      total: allData.length
    });
  }, [checkIsFinalized]);

  // Combined data loading - PERFORMANCE FIX: Use dataCacheService for instant loading
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);

        // Get project filter params
        const projectParams = getProjectQueryParam();

        // PERFORMANCE FIX: Use dataCacheService for cached collection orders (2 min TTL)
        // This provides instant loading after the first fetch
        const allData = await dataCacheService.getCollectionOrders({
          page: 1,
          limit: 200,
          ...projectParams  // Include project_id filter
        }).catch(err => {
          console.error('Error loading callouts:', err);
          return [];
        });

        // Calculate stats from full dataset (before filtering by workflow stage)
        calculateGlobalStats(allData);

        // Now filter by workflow stage for display
        let filteredData = allData;
        const statusFilter = getStatusFilterFromWorkflowStage(workflowStage);

        if (statusFilter) {
          const statuses = statusFilter.split(',');
          filteredData = filteredData.filter(c => statuses.includes(c.status));
        }

        // Client-side filtering for completed vs finalized
        if (workflowStage === 'completed') {
          filteredData = filteredData.filter(c => c.status === 'completed' && !checkIsFinalized(c));
        } else if (workflowStage === 'finalized') {
          filteredData = filteredData.filter(c => checkIsFinalized(c));
        }

        setCallouts(filteredData);
        setPagination(prev => ({
          ...prev,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / prev.limit)
        }));
      } catch (error) {
        console.error('Error loading callouts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [workflowStage, getStatusFilterFromWorkflowStage, checkIsFinalized, calculateGlobalStats, selectedProjectId, getProjectQueryParam]);

  // Refresh function - invalidates cache and reloads fresh data
  const loadCallouts = async () => {
    try {
      setLoading(true);

      // Invalidate cache to force fresh data fetch on explicit refresh
      dataCacheService.invalidateCollectionOrders();

      // Get project filter params
      const projectParams = getProjectQueryParam();

      const response = await calloutService.getCallouts({
        page: 1,
        limit: 200,
        ...projectParams  // Include project_id filter
      });

      if (response.success) {
        const allData = response.data || [];
        calculateGlobalStats(allData);

        let filteredData = allData;
        const statusFilter = getStatusFilterFromWorkflowStage(workflowStage);

        if (statusFilter) {
          const statuses = statusFilter.split(',');
          filteredData = filteredData.filter(c => statuses.includes(c.status));
        }

        if (workflowStage === 'completed') {
          filteredData = filteredData.filter(c => c.status === 'completed' && !checkIsFinalized(c));
        } else if (workflowStage === 'finalized') {
          filteredData = filteredData.filter(c => checkIsFinalized(c));
        }

        setCallouts(filteredData);
        setPagination(prev => ({
          ...prev,
          total: filteredData.length,
          totalPages: Math.ceil(filteredData.length / 25)
        }));
      }
    } catch (error) {
      console.error('Error loading callouts:', error);
    } finally {
      setLoading(false);
    }
  };

  // Use globalStats for workflow bar (persistent across filters)
  // This ensures counts don't change when user filters by stage

  // Handler for workflow stage changes
  const handleWorkflowStageChange = useCallback((stage) => {
    setWorkflowStage(stage);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
  }, []);

  const handleCreateCallout = () => {
    setSelectedCallout(null);
    setShowCreateModal(true);
  };

  const handleViewCallout = async (callout) => {
    try {
      const response = await calloutService.getCallout(callout.id);
      if (response.success) {
        setSelectedCallout(response.data);
      } else {
        setSelectedCallout(callout);
      }
    } catch (error) {
      console.error('Error fetching callout details:', error);
      setSelectedCallout(callout);
    }
    setShowDetailsModal(true);
  };

  const handleEditCallout = (callout) => {
    setSelectedCallout(callout);
    setShowCreateModal(true);
  };

  const handleDeleteCallout = async (calloutId) => {
    if (window.confirm(t('confirmDeleteCallout'))) {
      try {
        const response = await calloutService.deleteCallout(calloutId);
        if (response.success) {
          loadCallouts();
          loadGlobalStats(); // Refresh stats after delete
        }
      } catch (error) {
        console.error('Error deleting callout:', error);
      }
    }
  };

  const handleAssignDriver = (callout) => {
    setSelectedCollectionOrder(callout);
    setShowDriverModal(true);
  };

  const handleUpdateStatus = (callout) => {
    setSelectedCollectionOrder(callout);
    setShowStatusModal(true);
  };

  const handleDriverAssignmentSave = async (driverData) => {
    try {
      const response = await calloutService.updateDriverDetails(selectedCollectionOrder.id, driverData);
      if (response.success) {
        loadCallouts();
        loadGlobalStats(); // Refresh stats after status change
        setShowDriverModal(false);
        setSelectedCollectionOrder(null);
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  const handleFinalizeWCN = (collectionOrder) => {
    setSelectedWCNOrder(collectionOrder);
    setShowWCNFinalizationModal(true);
  };

  const handleWCNFinalizationSuccess = () => {
    loadCallouts();
    loadGlobalStats(); // Refresh stats after finalization
    setShowWCNFinalizationModal(false);
    setSelectedWCNOrder(null);
  };

  const handleRectifyWCN = (collectionOrder) => {
    setSelectedWCNOrder(collectionOrder);
    setShowWCNRectificationModal(true);
  };

  const handleWCNRectificationSuccess = () => {
    loadCallouts();
    loadGlobalStats(); // Refresh stats after rectification
    setShowWCNRectificationModal(false);
    setSelectedWCNOrder(null);
  };

  // Get item type for badge display
  // Note: No 'pending' status in collection_orders - starts at 'scheduled'
  // Using design-system badge classes: success, warning, info, danger, neutral
  const getItemType = useCallback((row) => {
    if (row.status === 'scheduled') {
      return { type: 'scheduled', label: t('scheduled') || 'Scheduled', icon: Calendar, badgeClass: 'warning' };
    }
    if (['in_transit', 'collecting'].includes(row.status)) {
      return { type: 'collection', label: t('inProgress') || 'In Progress', icon: Truck, badgeClass: 'info' };
    }
    if (row.status === 'completed' && !checkIsFinalized(row)) {
      return { type: 'wcn-ready', label: t('wcnReady') || 'WCN Ready', icon: FileCheck, badgeClass: 'success' };
    }
    if (checkIsFinalized(row)) {
      return { type: 'finalized', label: t('finalized') || 'Finalized', icon: CheckCircle, badgeClass: 'confirmed' };
    }
    return { type: 'unknown', label: row.status, icon: AlertCircle, badgeClass: 'neutral' };
  }, [t, checkIsFinalized]);

  const getStatusIcon = (status) => {
    switch (status) {
      case 'scheduled': return <Calendar className="w-4 h-4 text-yellow-500" />;
      case 'in_transit': return <Navigation className="w-4 h-4 text-blue-500" />;
      case 'collecting': return <PackageSearch className="w-4 h-4 text-blue-600" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-red-600" />;
      default: return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'normal': return 'text-blue-600 bg-blue-100';
      case 'low': return 'text-gray-600 bg-gray-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Get primary action for a row (Next Step button)
  // Note: No 'pending' status - workflow starts at 'scheduled'
  const getPrimaryAction = useCallback((row) => {
    switch (row.status) {
      case 'scheduled':
        // Scheduled orders can either be started OR have driver assigned if not yet assigned
        if (!row.driverName) {
          return {
            label: t('assignDriver') || 'Assign Driver',
            icon: User,
            handler: () => handleAssignDriver(row),
            variant: 'primary'
          };
        }
        return {
          label: t('startCollection') || 'Start',
          icon: Play,
          handler: () => handleUpdateStatus(row),
          variant: 'primary'
        };
      case 'in_transit':
        return {
          label: t('markArrived') || 'Mark Arrived',
          icon: MapPin,
          handler: () => handleUpdateStatus(row),
          variant: 'primary'
        };
      case 'collecting':
        return {
          label: t('completeCollection') || 'Complete',
          icon: CheckCircle,
          handler: () => handleUpdateStatus(row),
          variant: 'primary'
        };
      case 'completed':
        if (!checkIsFinalized(row)) {
          return {
            label: t('finalizeWcn') || 'Finalize WCN',
            icon: FileCheck,
            handler: () => handleFinalizeWCN(row),
            variant: 'success'
          };
        }
        return {
          label: t('rectifyWcn') || 'Rectify',
          icon: FileEdit,
          handler: () => handleRectifyWCN(row),
          variant: 'secondary'
        };
      default:
        return null;
    }
  }, [t, checkIsFinalized]);

  // Priority badge styles
  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'urgent': return 'status-badge danger';
      case 'high': return 'status-badge warning';
      case 'normal': return 'status-badge info';
      case 'low': return 'status-badge secondary';
      default: return 'status-badge secondary';
    }
  };

  const columns = [
    {
      key: 'orderNumber',
      header: t('calloutNumber'),
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          {row.scheduledDate && (
            <div className="text-muted">{formatDate(row.scheduledDate)}</div>
          )}
        </div>
      )
    },
    {
      key: 'priority',
      header: t('priority'),
      filterable: true,
      filterOptions: [
        { value: 'urgent', label: t('urgent') },
        { value: 'high', label: t('high') },
        { value: 'normal', label: t('normal') || 'Normal' },
        { value: 'low', label: t('low') }
      ],
      render: (value) => (
        <span className={getPriorityBadgeClass(value)}>
          {t(value) || value}
        </span>
      )
    },
    {
      key: 'contractTitle',
      header: t('contract') + ' & ' + t('location'),
      render: (value, row) => (
        <div>
          <strong>{value}</strong>
          <div className="text-muted">{row.supplierName}</div>
          <div className="text-muted">
            <MapPin size={12} /> {row.locationName}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: t('status'),
      render: (value, row) => {
        const itemType = getItemType(row);
        const TypeIcon = itemType.icon;

        // Single badge showing the workflow stage - using design-system status-badge
        return (
          <span
            className={`status-badge ${itemType.badgeClass}`}
            title={`${itemType.label}${checkIsFinalized(row) ? ' - ' + (t('wcnFinalized') || 'WCN Finalized') : ''}`}
          >
            <TypeIcon size={12} />
            {itemType.label}
          </span>
        );
      }
    },
    {
      key: 'driverName',
      header: t('driver'),
      render: (value, row) => (
        <div>
          {value ? (
            <div>
              <strong>{value}</strong>
              {row.vehiclePlateNumber && (
                <div className="text-muted">{row.vehiclePlateNumber}</div>
              )}
            </div>
          ) : (
            <span className="text-muted">{t('notAssigned')}</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (value, row) => {
        const primaryAction = getPrimaryAction(row);
        // Map variant to button class
        const getButtonClass = (variant) => {
          switch (variant) {
            case 'primary': return 'btn btn-primary btn-sm';
            case 'success': return 'btn btn-success btn-sm';
            case 'danger': return 'btn btn-danger btn-sm';
            default: return 'btn btn-outline btn-sm';
          }
        };

        return (
          <div className="cell-actions">
            {/* Primary "Next Step" Action - Icon only with tooltip */}
            {primaryAction && (
              <button
                onClick={primaryAction.handler}
                className={getButtonClass(primaryAction.variant)}
                title={primaryAction.label}
              >
                <primaryAction.icon size={14} />
              </button>
            )}

            {/* View Details */}
            <button
              onClick={() => handleViewCallout(row)}
              className="btn btn-outline btn-sm"
              title={t('viewDetails')}
            >
              <Eye size={14} />
            </button>

            {/* Edit/Delete - only for pending and scheduled orders */}
            {(row.status === 'pending' || row.status === 'scheduled') && (
              <>
                <button
                  onClick={() => handleEditCallout(row)}
                  className="btn btn-outline btn-sm"
                  title={t('edit')}
                >
                  <Edit size={14} />
                </button>
                <button
                  onClick={() => handleDeleteCallout(row.id)}
                  className="btn btn-danger btn-sm"
                  title={t('delete')}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Empty state guidance component
  const EmptyStateGuidance = ({ stage }) => {
    const guidance = {
      scheduled: {
        icon: Calendar,
        title: t('noScheduledCollections') || 'No Scheduled Collections',
        description: t('scheduledEmptyDescription') || 'Create a new collection order to see it here.',
        action: { label: t('newCollectionOrder') || '+ New Collection', handler: handleCreateCallout }
      },
      in_progress: {
        icon: Truck,
        title: t('noActiveCollections') || 'No Active Collections',
        description: t('inProgressEmptyDescription') || 'Collections currently in transit or being collected will appear here.',
        action: null
      },
      completed: {
        icon: CheckCircle,
        title: t('noCompletedCollections') || 'No Completed Collections',
        description: t('completedEmptyDescription') || 'Completed collections waiting for WCN finalization appear here.',
        action: null
      },
      finalized: {
        icon: FileCheck,
        title: t('noFinalizedWcns') || 'No Finalized WCNs',
        description: t('finalizedEmptyDescription') || 'Finalized waste consignment notes with generated POs appear here.',
        action: null
      },
      all: {
        icon: Package,
        title: t('noCalloutsFound') || 'No Collection Orders Found',
        description: t('createFirstCallout'),
        action: { label: t('newCallout') || '+ New Callout', handler: handleCreateCallout }
      }
    };

    const config = guidance[stage] || guidance.all;
    const Icon = config.icon;

    return (
      <div className="empty-stage-guidance">
        <div className="empty-icon-wrapper">
          <Icon className="empty-icon" />
        </div>
        <h4 className="empty-title">{config.title}</h4>
        <p className="empty-description">{config.description}</p>
        {config.action && (
          <button className="btn-primary empty-action-btn" onClick={config.action.handler}>
            <Plus size={16} />
            {config.action.label}
          </button>
        )}
      </div>
    );
  };

  return (
    <div className={`callout-manager ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Workflow Progress Bar - Stage-based filtering unique to collections workflow */}
      <div style={{ marginBottom: '16px' }}>
        <WorkflowProgressBar
          activeStage={workflowStage}
          onStageChange={handleWorkflowStageChange}
          stats={globalStats}
          compact={true}
        />
      </div>

      {/* Collection Orders Table */}
      <div className="callouts-table">
        {!loading && callouts.length === 0 ? (
          <EmptyStateGuidance stage={workflowStage} />
        ) : (
          <DataTable
            data={callouts}
            columns={columns}
            loading={loading}
            title={t('collectionOrders')}
            subtitle={`${t('materialCollectionWorkflow') || 'Material collection workflow'} - ${callouts.length} ${t('orders') || 'orders'}`}
            headerActions={
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  className="btn btn-icon"
                  onClick={() => loadCallouts()}
                  title={t('refresh')}
                >
                  <RefreshCw size={16} />
                </button>
                <button
                  className="btn btn-primary"
                  onClick={handleCreateCallout}
                >
                  <Plus size={16} />
                  {t('newCollectionOrder')}
                </button>
              </div>
            }
            initialPageSize={25}
            paginated={true}
            searchable={true}
            filterable={true}
            emptyMessage={t('noCalloutsFound')}
          />
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CalloutFormModal
          callout={selectedCallout}
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedCallout(null);
          }}
          onSubmit={() => {
            loadCallouts();
            loadGlobalStats(); // Refresh stats after create/edit
            setShowCreateModal(false);
            setSelectedCallout(null);
          }}
        />
      )}

      {showDetailsModal && selectedCallout && (
        <CalloutDetailsModal
          callout={selectedCallout}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCallout(null);
          }}
        />
      )}

      {showDriverModal && selectedCollectionOrder && (
        <DriverAssignmentModal
          collectionOrder={selectedCollectionOrder}
          isOpen={showDriverModal}
          onClose={() => {
            setShowDriverModal(false);
            setSelectedCollectionOrder(null);
          }}
          onSave={handleDriverAssignmentSave}
        />
      )}

      {showStatusModal && selectedCollectionOrder && (
        <StatusUpdateModal
          collectionOrder={selectedCollectionOrder}
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedCollectionOrder(null);
          }}
          onSuccess={async () => {
            await loadCallouts();
            await loadGlobalStats(); // Refresh stats after status change
          }}
        />
      )}

      {showWCNFinalizationModal && selectedWCNOrder && (
        <WCNFinalizationModal
          collectionOrder={selectedWCNOrder}
          isOpen={showWCNFinalizationModal}
          onClose={() => {
            setShowWCNFinalizationModal(false);
            setSelectedWCNOrder(null);
          }}
          onSuccess={handleWCNFinalizationSuccess}
        />
      )}

      {showWCNRectificationModal && selectedWCNOrder && (
        <WCNRectificationModal
          collectionOrder={selectedWCNOrder}
          isOpen={showWCNRectificationModal}
          onClose={() => {
            setShowWCNRectificationModal(false);
            setSelectedWCNOrder(null);
          }}
          onSuccess={handleWCNRectificationSuccess}
        />
      )}
    </div>
  );
};

export default CalloutManager;
