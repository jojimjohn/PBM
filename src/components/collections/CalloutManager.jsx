import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, Filter, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2 } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { calloutService } from '../../services/collectionService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import CalloutFormModal from './CalloutFormModal';
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
          loadCallouts();
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
      key: 'orderNumber',
      header: t('calloutNumber'),
      render: (value, row) => (
        <div className="font-medium text-blue-600">
          {value}
        </div>
      )
    },
    {
      key: 'contractTitle',
      header: t('contract'),
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.supplierName}</div>
        </div>
      )
    },
    {
      key: 'locationName',
      header: t('location'),
      render: (value, row) => (
        <div className="flex items-center">
          <MapPin className="w-4 h-4 text-gray-400 mr-1" />
          <span>{value}</span>
        </div>
      )
    },
    {
      key: 'scheduledDate',
      header: t('requestedDate'),
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'status',
      header: t('status'),
      render: (value, row) => (
        <div className="flex items-center">
          {getStatusIcon(value)}
          <span className="ml-1">{t(value)}</span>
        </div>
      )
    },
    {
      key: 'priority',
      header: t('priority'),
      render: (value) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(value)}`}>
          {t(value)}
        </span>
      )
    },
    {
      key: 'estimatedQuantity',
      header: t('estimatedQuantity'),
      render: (value, row) => value ? `${value} ${row.unit || ''}` : '-'
    },
    {
      key: 'totalValue',
      header: t('totalValue'),
      render: (value, row) => `${value || 0} ${row.currency || 'OMR'}`
    },
    {
      key: 'actions',
      header: t('actions'),
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

const CalloutDetailsModal = ({ callout, isOpen, onClose }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(true);
  const [fullCalloutData, setFullCalloutData] = useState(null);

  useEffect(() => {
    if (isOpen && callout) {
      loadFullCalloutData();
    }
  }, [isOpen, callout]);

  const loadFullCalloutData = async () => {
    try {
      setLoading(true);
      const response = await calloutService.getCallout(callout.id);
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setFullCalloutData(data.data);
        }
      }
    } catch (error) {
      console.error('Error loading callout details:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title={t('calloutDetails')}>
        <div className="p-6 text-center">
          <LoadingSpinner />
          <p className="mt-2 text-gray-600">{t('loading')}</p>
        </div>
      </Modal>
    );
  }

  const data = fullCalloutData || callout;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('calloutDetails')}>
      <div style={{ padding: '24px', maxHeight: '80vh', overflowY: 'auto' }}>
        
        {/* Header Information */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '24px',
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderRadius: '8px',
          border: '1px solid #e2e8f0'
        }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('calloutNumber')}
            </label>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
              {data.orderNumber || data.calloutNumber || '-'}
            </p>
          </div>
          
          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('status')}
            </label>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginTop: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: data.status === 'scheduled' ? '#dbeafe' : '#f3f4f6',
              color: data.status === 'scheduled' ? '#1e40af' : '#374151',
              display: 'inline-block'
            }}>
              {t(data.status || 'scheduled')}
            </p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('priority')}
            </label>
            <p style={{ 
              fontSize: '14px', 
              fontWeight: '500', 
              marginTop: '4px',
              padding: '4px 8px',
              borderRadius: '4px',
              backgroundColor: data.priority === 'high' ? '#fef2f2' : data.priority === 'urgent' ? '#fdf2f8' : '#f0fdf4',
              color: data.priority === 'high' ? '#dc2626' : data.priority === 'urgent' ? '#be185d' : '#16a34a',
              display: 'inline-block'
            }}>
              {t(data.priority || 'normal')}
            </p>
          </div>

          <div>
            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {t('scheduledDate')}
            </label>
            <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
              {data.scheduledDate ? new Date(data.scheduledDate).toLocaleDateString() : '-'}
            </p>
          </div>
        </div>

        {/* Contract & Location Information */}
        <div style={{ marginBottom: '24px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
            {t('contractAndLocation')}
          </h3>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
            gap: '16px'
          }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('contract')}
              </label>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                {data.contractTitle || '-'}
              </p>
            </div>
            
            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('supplier')}
              </label>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                {data.supplierName || '-'}
              </p>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('location')}
              </label>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                {data.locationName || '-'}
              </p>
            </div>

            <div>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                {t('totalValue')}
              </label>
              <p style={{ fontSize: '14px', fontWeight: '500', color: '#1e293b', marginTop: '4px' }}>
                {(parseFloat(data.totalValue) || 0).toFixed(2)} OMR
              </p>
            </div>
          </div>
        </div>

        {/* Materials */}
        {data.items && data.items.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              {t('materials')} ({data.items.length})
            </h3>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              overflow: 'hidden',
              backgroundColor: '#ffffff'
            }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ backgroundColor: '#f8fafc' }}>
                  <tr>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                      {t('material')}
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                      {t('quantity')}
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                      {t('condition')}
                    </th>
                    <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748b', textTransform: 'uppercase', borderBottom: '1px solid #e2e8f0' }}>
                      {t('value')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {data.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: index < data.items.length - 1 ? '1px solid #f1f5f9' : 'none' }}>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>
                        <div style={{ fontWeight: '500' }}>{item.materialName}</div>
                        {item.materialCode && (
                          <div style={{ fontSize: '12px', color: '#64748b' }}>{item.materialCode}</div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>
                        {(parseFloat(item.availableQuantity || item.requestedQuantity) || 0).toFixed(3)} {item.materialUnit || item.unit}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b' }}>
                        <span style={{ 
                          padding: '2px 6px', 
                          borderRadius: '4px', 
                          fontSize: '12px', 
                          backgroundColor: '#f0fdf4', 
                          color: '#16a34a' 
                        }}>
                          {t(item.materialCondition || 'good')}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '14px', color: '#1e293b', fontWeight: '500' }}>
                        {(parseFloat(item.totalValue) || 0).toFixed(2)} OMR
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {data.notes && (
          <div style={{ marginBottom: '24px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1e293b', marginBottom: '16px', borderBottom: '2px solid #e2e8f0', paddingBottom: '8px' }}>
              {t('specialInstructions')}
            </h3>
            <div style={{ 
              padding: '16px', 
              backgroundColor: '#f8fafc', 
              borderRadius: '8px', 
              border: '1px solid #e2e8f0',
              fontSize: '14px',
              color: '#374151',
              lineHeight: '1.5'
            }}>
              {data.notes}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'flex-end', 
          gap: '12px',
          paddingTop: '24px',
          borderTop: '1px solid #e2e8f0'
        }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 16px',
              backgroundColor: '#6b7280',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {t('close')}
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default CalloutManager;