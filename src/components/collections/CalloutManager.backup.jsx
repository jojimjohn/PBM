import React, { useState, useEffect } from 'react';
import { AlertCircle, Plus, Search, Filter, Calendar, MapPin, Package, Clock, CheckCircle, XCircle, Eye, Edit, Trash2, Phone, User } from 'lucide-react';
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

// Enhanced Callout Form Modal with Supplier-Contract Integration
const CalloutFormModal = ({ callout, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
  const [formData, setFormData] = useState({
    contractId: callout?.contractId || '',
    supplierId: callout?.supplierId || '',
    locationId: callout?.locationId || '',
    requestedPickupDate: callout?.requestedPickupDate || '',
    priority: callout?.priority || 'normal',
    contactPerson: callout?.contactPerson || '',
    contactPhone: callout?.contactPhone || '',
    materials: callout?.materials || []
  });
  const [contracts, setContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [contractMaterials, setContractMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState(callout?.specialInstructions || '');

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData.contractId) {
      loadContractDetails();
    }
  }, [formData.contractId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      // Load contracts and suppliers
      const [contractsResponse, suppliersResponse] = await Promise.all([
        contractService.getAll(),
        supplierService.getAll()
      ]);

      if (contractsResponse.success) {
        setContracts(contractsResponse.data || []);
      }
      if (suppliersResponse.success) {
        setSuppliers(suppliersResponse.data || []);
      }
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContractDetails = async () => {
    try {
      const response = await contractService.getById(formData.contractId);
      console.log('Contract response:', response); // Debug log
      if (response.success && response.data) {
        const contract = response.data;
        console.log('Contract data:', contract); // Debug log
        
        // Set supplier info from contract
        setFormData(prev => ({
          ...prev,
          supplierId: contract.supplierId
        }));
        
        // Process rates from contract_location_rates table
        if (contract.rates && contract.rates.length > 0) {
          console.log('Contract rates found:', contract.rates); // Debug log
          
          // Group rates by location
          const locationMap = new Map();
          const materials = [];
          
          contract.rates.forEach(rate => {
            const locationId = rate.locationId;
            const locationName = rate.locationName;
            const locationCode = rate.locationCode;
            
            // Create or get location
            if (!locationMap.has(locationId)) {
              locationMap.set(locationId, {
                id: locationId,
                name: locationName,
                locationCode: locationCode
              });
            }
            
            // Add material with rate information for wizard
            materials.push({
              materialId: rate.materialId,
              materialName: rate.materialName,
              materialCode: rate.materialCode,
              unit: rate.unit,
              rateType: rate.rateType,
              contractRate: rate.contractRate,
              standardPrice: rate.standardPrice,
              locationId: locationId,
              locationName: locationName,
              availableQuantity: 0,
              materialCondition: 'good',
              notes: ''
            });
          });
          
          const locations = Array.from(locationMap.values());
          console.log('Grouped locations:', locations); // Debug log
          console.log('Contract materials with rates:', materials); // Debug log
          
          setLocations(locations);
          setContractMaterials(materials);
        } else {
          console.log('No rates found in contract - contract_location_rates table is empty'); // Debug log
          setLocations([]);
          setContractMaterials([]);
        }
      } else {
        console.log('Failed to load contract or no contract data'); // Debug log
        setLocations([]);
        setContractMaterials([]);
      }
    } catch (error) {
      console.error('Error loading contract details:', error);
      setLocations([]);
      setContractMaterials([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMaterialChange = (materialIndex, field, value) => {
    setContractMaterials(prev => {
      const updated = [...prev];
      updated[materialIndex] = {
        ...updated[materialIndex],
        [field]: value
      };
      return updated;
    });
  };

  const getSelectedMaterials = () => {
    return contractMaterials.filter(material => material.availableQuantity > 0);
  };

  const getTotalEstimatedValue = () => {
    return getSelectedMaterials().reduce((total, material) => {
      return total + (material.availableQuantity * material.contractRate);
    }, 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const selectedMaterials = getSelectedMaterials();
      if (selectedMaterials.length === 0) {
        alert(t('pleaseSelectAtLeastOneMaterial'));
        return;
      }

      const calloutData = {
        ...formData,
        specialInstructions: specialInstructions,
        materials: selectedMaterials.map(material => ({
          materialId: material.materialId,
          availableQuantity: material.availableQuantity,
          unit: material.unit,
          materialCondition: material.materialCondition,
          estimatedValue: material.availableQuantity * material.contractRate,
          notes: material.notes
        })),
        totalEstimatedValue: getTotalEstimatedValue()
      };

      const response = callout 
        ? await calloutService.updateCallout(callout.id, calloutData)
        : await calloutService.createCallout(calloutData);

      if (response.success) {
        onSubmit();
        onClose();
      }
    } catch (error) {
      console.error('Error saving callout:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      closeOnOverlayClick={false}
      title={callout ? t('editCallout') : t('createCallout')}
      className="modal-xl"
    >
      <div className="modal-body">
        {/* Progress Indicator */}
        <div className="bg-gray-50 -mx-6 -mt-6 px-6 py-4 mb-6 border-b border-gray-200">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center space-x-4">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold text-sm transition-colors`}>
                1
              </div>
              <div className={`h-1 w-20 rounded ${step >= 2 ? 'bg-blue-600' : 'bg-gray-300'} transition-colors`}></div>
              <div className={`flex items-center justify-center w-10 h-10 rounded-full ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-600'} font-semibold text-sm transition-colors`}>
                2
              </div>
            </div>
          </div>
          <div className="flex justify-between text-sm max-w-xs mx-auto">
            <span className={`font-medium ${step === 1 ? 'text-blue-600' : 'text-gray-500'}`}>
              {t('contractAndLocation')}
            </span>
            <span className={`font-medium ${step === 2 ? 'text-blue-600' : 'text-gray-500'}`}>
              {t('materialsAndInstructions')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Step 1: Contract & Location Selection */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('contractAndLocation')}</h3>
                <p className="text-gray-600 text-sm">{t('selectContractAndLocationForPickup')}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('selectContract')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.contractId}
                    onChange={(e) => handleInputChange('contractId', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    required
                  >
                    <option value="">{t('selectContract')}</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.contractNumber} - {contract.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('pickupLocation')} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleInputChange('locationId', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium disabled:bg-gray-100 disabled:text-gray-500"
                    required
                    disabled={!formData.contractId}
                  >
                    <option value="">
                      {!formData.contractId 
                        ? t('selectContractFirst') 
                        : locations.length === 0 
                          ? t('noLocationsAvailable') 
                          : t('selectLocation')
                      }
                    </option>
                    {locations.map(location => (
                      <option key={location.id} value={location.id}>
                        {location.name} - {location.locationCode}
                      </option>
                    ))}
                  </select>
                  {formData.contractId && locations.length === 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                      <p className="text-sm text-orange-700 font-medium">
                        ⚠️ {t('contractHasNoLocations')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('requestedPickupDate')} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.requestedPickupDate}
                    onChange={(e) => handleInputChange('requestedPickupDate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-gray-800 mb-2">
                    {t('priority')}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 font-medium"
                  >
                    <option value="low">{t('low')}</option>
                    <option value="normal">{t('normal')}</option>
                    <option value="high">{t('high')}</option>
                    <option value="urgent">{t('urgent')}</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={onClose} 
                  className="px-6 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  {t('cancel')}
                </button>
                <button 
                  type="button" 
                  onClick={() => setStep(2)}
                  disabled={!formData.contractId || !formData.locationId || !formData.requestedPickupDate}
                  className="px-6 py-3 bg-blue-600 border-2 border-blue-600 text-white rounded-lg hover:bg-blue-700 hover:border-blue-700 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  {t('next')} <Package className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Materials Selection */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{t('availableMaterials')}</h3>
                <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm font-medium">
                  {getSelectedMaterials().length} {t('materialsSelected')}
                </div>
              </div>
              
              {contractMaterials.length > 0 ? (
                <div className="space-y-6">
                  {/* Materials Cards */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {contractMaterials.filter(material => material.locationId === parseInt(formData.locationId)).map((material, index) => (
                      <div key={`${material.materialId}-${material.locationId}`} className="bg-white border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 hover:shadow-lg transition-all duration-200">
                        {/* Material Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div className="flex-1">
                            <h4 className="font-bold text-gray-900 text-lg mb-1">{material.materialName}</h4>
                            <p className="text-sm text-gray-600 mb-3">{material.materialCode}</p>
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-100 text-green-800">
                                {material.contractRate} OMR/{material.unit}
                              </span>
                              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">{t(material.rateType)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-green-600">
                              {(material.availableQuantity * material.contractRate).toFixed(3)}
                            </div>
                            <div className="text-sm text-gray-500">OMR</div>
                          </div>
                        </div>

                        {/* Quantity Input */}
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">
                              {t('availableQuantity')} ({material.unit})
                            </label>
                            <div className="relative">
                              <input
                                type="number"
                                min={material.minimumQuantity || 0}
                                max={material.maximumQuantity || undefined}
                                step="0.001"
                                value={material.availableQuantity || ''}
                                onChange={(e) => handleMaterialChange(index, 'availableQuantity', parseFloat(e.target.value) || 0)}
                                onFocus={(e) => e.target.value === '0' && e.target.select()}
                                className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-right font-medium text-gray-900"
                                placeholder={`Min: ${material.minimumQuantity || 0}${material.maximumQuantity ? `, Max: ${material.maximumQuantity}` : ''}`}
                              />
                              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                                <span className="text-gray-500 text-sm font-medium">{material.unit}</span>
                              </div>
                            </div>
                            {(material.minimumQuantity || material.maximumQuantity) && (
                              <div className="flex justify-between text-xs text-gray-600 mt-2 bg-gray-50 px-3 py-1 rounded">
                                {material.minimumQuantity && (
                                  <span><strong>{t('min')}:</strong> {material.minimumQuantity} {material.unit}</span>
                                )}
                                {material.maximumQuantity && (
                                  <span><strong>{t('max')}:</strong> {material.maximumQuantity} {material.unit}</span>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Condition Selection */}
                          <div>
                            <label className="block text-sm font-semibold text-gray-800 mb-2">{t('condition')}</label>
                            <select
                              value={material.materialCondition}
                              onChange={(e) => handleMaterialChange(index, 'materialCondition', e.target.value)}
                              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-gray-900"
                            >
                              <option value="excellent">{t('excellent')}</option>
                              <option value="good">{t('good')}</option>
                              <option value="fair">{t('fair')}</option>
                              <option value="poor">{t('poor')}</option>
                              <option value="mixed">{t('mixed')}</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Special Instructions */}
                  <div className="bg-gray-50 border-2 border-gray-200 rounded-xl p-5">
                    <label className="block text-sm font-semibold text-gray-800 mb-3">
                      {t('specialInstructions')}
                    </label>
                    <textarea
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={4}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white font-medium text-gray-900"
                      placeholder={t('anySpecialInstructionsForPickup')}
                    />
                  </div>
                  
                  {/* Summary Card */}
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-5">
                    <h4 className="font-bold text-blue-900 mb-4 text-lg">{t('calloutSummary')}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">{t('selectedMaterials')}:</span>
                        <span className="font-bold text-blue-900 text-lg">{getSelectedMaterials().length}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-blue-700">{t('totalEstimatedValue')}:</span>
                        <span className="font-bold text-blue-900 text-lg">{getTotalEstimatedValue().toFixed(3)} OMR</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-semibold text-gray-600 mb-2">{t('noMaterialsAvailable')}</h4>
                  <p className="text-gray-500">{t('pleaseSelectContractAndLocation')}</p>
                </div>
              )}

              <div className="flex justify-between items-center pt-6 border-t border-gray-200">
                <button 
                  type="button" 
                  onClick={() => setStep(1)} 
                  className="px-6 py-3 bg-white border-2 border-gray-400 rounded-lg text-gray-800 hover:bg-gray-50 hover:border-gray-500 font-semibold transition-all duration-200 flex items-center gap-2"
                >
                  ← {t('back')}
                </button>
                <button 
                  type="submit"
                  disabled={loading || getSelectedMaterials().length === 0}
                  className="px-6 py-3 bg-green-600 border-2 border-green-600 text-white rounded-lg hover:bg-green-700 hover:border-green-700 disabled:bg-gray-400 disabled:border-gray-400 disabled:cursor-not-allowed font-semibold transition-all duration-200 flex items-center gap-2 shadow-lg"
                >
                  {loading ? <LoadingSpinner size="small" /> : <CheckCircle className="w-5 h-5" />}
                  {callout ? t('updateCallout') : t('createCallout')}
                </button>
              </div>
            </div>
          )}

        </form>
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