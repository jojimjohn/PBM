import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, Filter, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, Truck, User, Play, FileCheck, FileEdit, Navigation, PackageSearch } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { calloutService } from '../../services/collectionService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import CalloutFormModal from './CalloutFormModal';
import CalloutDetailsModal from './CalloutDetailsModal';
import DriverAssignmentModal from './DriverAssignmentModal';
import StatusUpdateModal from './StatusUpdateModal';
import WCNFinalizationModal from './WCNFinalizationModal';
import WCNRectificationModal from './WCNRectificationModal';
import './collections-managers.css';

const CalloutManager = () => {
  const { t, isRTL } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [callouts, setCallouts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCallout, setSelectedCallout] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Driver and Status Management
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedCollectionOrder, setSelectedCollectionOrder] = useState(null);

  // WCN Management (Sprint 4.5)
  const [showWCNFinalizationModal, setShowWCNFinalizationModal] = useState(false);
  const [showWCNRectificationModal, setShowWCNRectificationModal] = useState(false);
  const [selectedWCNOrder, setSelectedWCNOrder] = useState(null);

  useEffect(() => {
    loadCallouts();
  }, [pagination.page, statusFilter, priorityFilter, searchTerm]);

  const loadCallouts = async () => {
    try {
      setLoading(true);
      const response = await calloutService.getCallouts({
        page: pagination.page,
        limit: pagination.limit,
        status: statusFilter === 'all' ? undefined : statusFilter,
        priority: priorityFilter === 'all' ? undefined : priorityFilter,
        search: searchTerm || undefined
      });

      if (response.success) {
        setCallouts(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error loading callouts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCallout = () => {
    setSelectedCallout(null);
    setShowCreateModal(true);
  };

  const handleViewCallout = async (callout) => {
    try {
      // Fetch full details including items from the backend
      const response = await calloutService.getCallout(callout.id);
      if (response.success) {
        setSelectedCallout(response.data);
      } else {
        // Fallback to row data if fetch fails
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
        setShowDriverModal(false);
        setSelectedCollectionOrder(null);
      }
    } catch (error) {
      console.error('Error assigning driver:', error);
    }
  };

  // WCN Finalization Handler (Sprint 4.5)
  const handleFinalizeWCN = (collectionOrder) => {
    setSelectedWCNOrder(collectionOrder);
    setShowWCNFinalizationModal(true);
  };

  const handleWCNFinalizationSuccess = () => {
    loadCallouts(); // Refresh the list
    setShowWCNFinalizationModal(false);
    setSelectedWCNOrder(null);
  };

  // WCN Rectification Handler (Sprint 4.5)
  const handleRectifyWCN = (collectionOrder) => {
    setSelectedWCNOrder(collectionOrder);
    setShowWCNRectificationModal(true);
  };

  const handleWCNRectificationSuccess = () => {
    loadCallouts(); // Refresh the list
    setShowWCNRectificationModal(false);
    setSelectedWCNOrder(null);
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'in_transit': return <Navigation className="w-4 h-4 text-purple-500" />;
      case 'collecting': return <PackageSearch className="w-4 h-4 text-orange-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'failed': return <AlertCircle className="w-4 h-4 text-yellow-600" />;
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

  // Calculate statistics (in_transit and collecting both count as "in progress")
  const stats = {
    scheduled: callouts.filter(c => c.status === 'scheduled').length,
    inProgress: callouts.filter(c => c.status === 'in_transit' || c.status === 'collecting').length,
    completed: callouts.filter(c => c.status === 'completed' && !c.is_finalized).length,
    finalized: callouts.filter(c => c.is_finalized).length,
    total: pagination.total || callouts.length
  };

  const columns = [
    {
      key: 'orderNumber',
      header: t('calloutNumber'),
      render: (value, row) => (
        <div>
          <div className="font-medium text-blue-600">{value}</div>
          {row.scheduledDate && (
            <div className="text-xs text-gray-500">
              {new Date(row.scheduledDate).toLocaleDateString()}
            </div>
          )}
        </div>
      )
    },
    {
      key: 'contractTitle',
      header: t('contract') + ' & ' + t('location'),
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-600">{row.supplierName}</div>
          <div className="text-xs text-gray-500 flex items-center mt-1">
            <MapPin className="w-3 h-3 mr-1" />
            {row.locationName}
          </div>
        </div>
      )
    },
    {
      key: 'status',
      header: t('status'),
      render: (value, row) => (
        <div>
          <div className="flex items-center mb-1">
            {getStatusIcon(value)}
            <span className="ml-1 text-sm font-medium">{t(value)}</span>
          </div>
          {!!row.is_finalized && (
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
              <FileCheck className="w-3 h-3 mr-1" />
              {t('wcnFinalized')}
            </span>
          )}
        </div>
      )
    },
    {
      key: 'driverName',
      header: t('driver'),
      render: (value, row) => (
        <div>
          {value ? (
            <div>
              <div className="text-sm font-medium">{value}</div>
              {row.vehiclePlateNumber && (
                <div className="text-xs text-gray-500">{row.vehiclePlateNumber}</div>
              )}
            </div>
          ) : (
            <span className="text-gray-400 text-xs">{t('notAssigned')}</span>
          )}
        </div>
      )
    },
    {
      key: 'actions',
      header: t('actions'),
      render: (value, row) => (
        <div className="table-actions">
          <button
            onClick={() => handleViewCallout(row)}
            className="btn btn-outline btn-sm"
            title={t('viewDetails')}
          >
            <Eye size={14} />
          </button>

          {/* WCN Finalization - Sprint 4.5: Only for completed but NOT finalized orders */}
          {row.status === 'completed' && !row.is_finalized && (
            <button
              onClick={() => handleFinalizeWCN(row)}
              className="btn btn-success btn-sm"
              title={t('finalizeWCN')}
            >
              <FileCheck size={14} />
            </button>
          )}

          {/* WCN Rectification - Sprint 4.5: Only for finalized orders */}
          {!!row.is_finalized && (
            <button
              onClick={() => handleRectifyWCN(row)}
              className="btn btn-outline btn-sm"
              title={t('rectifyWCN')}
            >
              <FileEdit size={14} />
            </button>
          )}

          {/* Driver Assignment - available for scheduled, in_transit, and collecting orders */}
          {(row.status === 'scheduled' || row.status === 'in_transit' || row.status === 'collecting') && (
            <button
              onClick={() => handleAssignDriver(row)}
              className="btn btn-outline btn-sm"
              title={t('assignDriver')}
            >
              <Truck size={14} />
            </button>
          )}

          {/* Status Update - available for scheduled, in_transit, collecting, and failed orders */}
          {(row.status === 'scheduled' || row.status === 'in_transit' || row.status === 'collecting' || row.status === 'failed') && (
            <button
              onClick={() => handleUpdateStatus(row)}
              className="btn btn-warning btn-sm"
              title={t('updateStatus')}
            >
              <Play size={14} />
            </button>
          )}

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
      )
    }
  ];

  return (
    <div className={`callout-manager ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card stat-card-blue">
          <div className="stat-icon">
            <Calendar className="w-6 h-6" />
          </div>
          <div className="stat-details">
            <p className="stat-label">{t('scheduled')}</p>
            <h3 className="stat-value">{stats.scheduled}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-orange">
          <div className="stat-icon">
            <Package className="w-6 h-6" />
          </div>
          <div className="stat-details">
            <p className="stat-label">{t('inProgress')}</p>
            <h3 className="stat-value">{stats.inProgress}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-green">
          <div className="stat-icon">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="stat-details">
            <p className="stat-label">{t('completed')}</p>
            <h3 className="stat-value">{stats.completed}</h3>
          </div>
        </div>

        <div className="stat-card stat-card-purple">
          <div className="stat-icon">
            <FileCheck className="w-6 h-6" />
          </div>
          <div className="stat-details">
            <p className="stat-label">{t('wcnFinalized')}</p>
            <h3 className="stat-value">{stats.finalized}</h3>
          </div>
        </div>
      </div>

      <div className="manager-header">
        <div className="header-title">
          <Truck className="w-6 h-6" />
          <div>
            <h2>{t('collectionOrders')}</h2>
            <p className="header-subtitle">{stats.total} {t('totalOrders')}</p>
          </div>
        </div>
        <div className="header-actions">
          <button
            className="btn-secondary"
            onClick={() => loadCallouts()}
            title={t('refresh')}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
              <path d="M3 3v5h5" />
              <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
              <path d="M16 21h5v-5" />
            </svg>
            {t('refresh')}
          </button>
          <button
            className="btn-primary"
            onClick={handleCreateCallout}
          >
            <Plus className="w-4 h-4" />
            {t('newCollectionOrder')}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-and-filters">
        <div className="search-input-wrapper">
          <Search className="w-5 h-5 search-icon" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchCallouts')}
            className="search-field"
          />
        </div>

        <div className="filters-row">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="scheduled">{t('scheduled')}</option>
            <option value="in_transit">{t('inTransit') || 'In Transit'}</option>
            <option value="collecting">{t('collecting') || 'Collecting'}</option>
            <option value="completed">{t('completed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
            <option value="failed">{t('failed') || 'Failed'}</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('allPriorities')}</option>
            <option value="urgent">{t('urgent')}</option>
            <option value="high">{t('high')}</option>
            <option value="normal">{t('normal')}</option>
            <option value="low">{t('low')}</option>
          </select>
        </div>
      </div>

      {/* Callouts Table */}
      <div className="callouts-table">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <DataTable
            data={callouts}
            columns={columns}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            emptyMessage={t('noCalloutsFound')}
          />
        )}
      </div>

      {/* Create/Edit Callout Modal */}
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
            setShowCreateModal(false);
            setSelectedCallout(null);
          }}
        />
      )}

      {/* Callout Details Modal */}
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

      {/* Driver Assignment Modal */}
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

      {/* Status Update Modal */}
      {showStatusModal && selectedCollectionOrder && (
        <StatusUpdateModal
          collectionOrder={selectedCollectionOrder}
          isOpen={showStatusModal}
          onClose={() => {
            setShowStatusModal(false);
            setSelectedCollectionOrder(null);
          }}
          onSuccess={async () => {
            await loadCallouts(); // Refresh collection orders list after status update
          }}
        />
      )}

      {/* WCN Finalization Modal - Sprint 4.5 */}
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

      {/* WCN Rectification Modal - Sprint 4.5 */}
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