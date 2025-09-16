import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, Filter, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, Phone, User } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { calloutService } from '../../services/collectionService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
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

  // Load callouts on component mount
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

  const handleViewCallout = (callout) => {
    setSelectedCallout(callout);
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
          loadCallouts(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting callout:', error);
      }
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'scheduled': return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'in_progress': return <Package className="w-4 h-4 text-orange-500" />;
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled': return <XCircle className="w-4 h-4 text-red-500" />;
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

  const columns = [
    {
      key: 'calloutNumber',
      title: t('calloutNumber'),
      render: (value, row) => (
        <div className="font-medium text-blue-600">
          {value}
        </div>
      )
    },
    {
      key: 'contractName',
      title: t('contract'),
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.supplierName}</div>
        </div>
      )
    },
    {
      key: 'locationName',
      title: t('location'),
      render: (value, row) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'requestedPickupDate',
      title: t('requestedDate'),
      render: (value) => new Date(value).toLocaleDateString()
    },
    {
      key: 'status',
      title: t('status'),
      render: (value, row) => (
        <div className="flex items-center">
          {getStatusIcon(value)}
          <span className="ml-1">{t(value)}</span>
        </div>
      )
    },
    {
      key: 'priority',
      title: t('priority'),
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {t(value)}
        </span>
      )
    },
    {
      key: 'estimatedQuantity',
      title: t('estimatedQuantity'),
      render: (value, row) => value ? `${value} ${row.unit || ''}` : '-'
    },
    {
      key: 'totalValue',
      title: t('totalValue'),
      render: (value, row) => `${value || 0} ${row.currency || 'OMR'}`
    },
    {
      key: 'actions',
      title: t('actions'),
      render: (value, row) => (
        <div className="flex space-x-2">
          <button
            onClick={() => handleViewCallout(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title={t('viewDetails')}
          >
            <Eye className="w-4 h-4" />
          </button>
          {(row.status === 'pending' || row.status === 'scheduled') && (
            <>
              <button
                onClick={() => handleEditCallout(row)}
                className="p-1 text-green-600 hover:bg-green-50 rounded"
                title={t('edit')}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDeleteCallout(row.id)}
                className="p-1 text-red-600 hover:bg-red-50 rounded"
                title={t('delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className={`callout-manager ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="manager-header">
        <div className="header-title">
          <AlertCircle className="w-6 h-6" />
          <h2>{t('calloutManagement')}</h2>
        </div>
        <div className="header-actions">
          <button 
            className="filter-btn"
            onClick={() => {/* TODO: Implement filter modal */}}
          >
            <Filter className="w-4 h-4" />
            {t('filter')}
          </button>
          <button 
            className="add-btn"
            onClick={handleCreateCallout}
          >
            <Plus className="w-4 h-4" />
            {t('newCallout')}
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="search-and-filters">
        <div className="search-bar">
          <div className="search-input">
            <Search className="w-5 h-5 search-icon" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchCallouts')}
              className="search-field"
            />
          </div>
        </div>

        <div className="filters">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="pending">{t('pending')}</option>
            <option value="scheduled">{t('scheduled')}</option>
            <option value="in_progress">{t('inProgress')}</option>
            <option value="completed">{t('completed')}</option>
            <option value="cancelled">{t('cancelled')}</option>
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
    </div>
  );
};

// Placeholder components for modals - to be implemented
const CalloutFormModal = ({ callout, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={callout ? t('editCallout') : t('createCallout')}>
      <div className="p-4">
        <p>{t('calloutFormComingSoon')}</p>
        {/* TODO: Implement callout form */}
      </div>
    </Modal>
  );
};

const CalloutDetailsModal = ({ callout, isOpen, onClose }) => {
  const { t } = useLocalization();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('calloutDetails')}>
      <div className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('calloutNumber')}</label>
              <p className="text-gray-600">{callout.calloutNumber}</p>
            </div>
            <div>
              <label className="font-medium">{t('status')}</label>
              <p className="text-gray-600">{t(callout.status)}</p>
            </div>
            <div>
              <label className="font-medium">{t('priority')}</label>
              <p className="text-gray-600">{t(callout.priority)}</p>
            </div>
            <div>
              <label className="font-medium">{t('requestedDate')}</label>
              <p className="text-gray-600">{new Date(callout.requestedPickupDate).toLocaleDateString()}</p>
            </div>
          </div>

          {callout.specialInstructions && (
            <div>
              <label className="font-medium">{t('specialInstructions')}</label>
              <p className="text-gray-600">{callout.specialInstructions}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('contactPerson')}</label>
              <p className="text-gray-600">{callout.contactPerson || '-'}</p>
            </div>
            <div>
              <label className="font-medium">{t('contactPhone')}</label>
              <p className="text-gray-600">{callout.contactPhone || '-'}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default CalloutManager;