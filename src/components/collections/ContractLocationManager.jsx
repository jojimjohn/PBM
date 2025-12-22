import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Filter, Building, Phone, User, Banknote, Package, Edit, Trash2, Eye, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { contractLocationService } from '../../services/collectionService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import './collections-managers.css';

const ContractLocationManager = () => {
  const { t, isRTL } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [contractFilter, setContractFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRatesModal, setShowRatesModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [contracts, setContracts] = useState([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Load contract locations on component mount
  useEffect(() => {
    loadLocations();
    loadContracts();
  }, [pagination.page, contractFilter, statusFilter, searchTerm]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      const response = await contractLocationService.getContractLocations({
        page: pagination.page,
        limit: pagination.limit,
        contractId: contractFilter === 'all' ? undefined : contractFilter,
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchTerm || undefined
      });

      if (response.success) {
        setLocations(response.data || []);
        setPagination(prev => ({
          ...prev,
          total: response.pagination?.total || 0,
          totalPages: response.pagination?.totalPages || 0
        }));
      }
    } catch (error) {
      console.error('Error loading contract locations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadContracts = async () => {
    try {
      // This would typically load from contract service
      // For now using placeholder data based on the contracts seen in images
      setContracts([
        { id: 1, name: 'Al Nama Electricity Generation', supplier: 'RAECO' },
        { id: 2, name: 'NFC MWASALAT Waste Management', supplier: 'National Ferries Company' },
        { id: 3, name: 'ONTC MWASALAT Operations', supplier: 'Oman National Transport Company' }
      ]);
    } catch (error) {
      console.error('Error loading contracts:', error);
    }
  };

  const handleCreateLocation = () => {
    setSelectedLocation(null);
    setShowCreateModal(true);
  };

  const handleViewLocation = (location) => {
    setSelectedLocation(location);
    setShowDetailsModal(true);
  };

  const handleEditLocation = (location) => {
    setSelectedLocation(location);
    setShowCreateModal(true);
  };

  const handleViewRates = (location) => {
    setSelectedLocation(location);
    setShowRatesModal(true);
  };

  const handleDeleteLocation = async (locationId) => {
    if (window.confirm(t('confirmDeleteLocation'))) {
      try {
        const response = await contractLocationService.deleteContractLocation(locationId);
        if (response.success) {
          loadLocations(); // Refresh the list
        }
      } catch (error) {
        console.error('Error deleting contract location:', error);
      }
    }
  };

  const handleToggleStatus = async (locationId, isActive) => {
    try {
      const response = await contractLocationService.updateContractLocationStatus(locationId, !isActive);
      if (response.success) {
        loadLocations(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating location status:', error);
    }
  };

  const getStatusIcon = (isActive) => {
    return isActive ? 
      <CheckCircle className="w-4 h-4 text-green-500" /> : 
      <XCircle className="w-4 h-4 text-red-500" />;
  };

  const getStatusColor = (isActive) => {
    return isActive ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100';
  };

  const columns = [
    {
      key: 'locationName',
      title: t('locationName'),
      render: (value, row) => (
        <div>
          <div className="font-medium">{value}</div>
          <div className="text-sm text-gray-500">{row.contractName}</div>
        </div>
      )
    },
    {
      key: 'address',
      title: t('address'),
      render: (value, row) => (
        <div className="flex items-start">
          <Building className="w-4 h-4 text-gray-400 mr-1 mt-0.5" />
          <span className="text-sm">{value || '-'}</span>
        </div>
      )
    },
    {
      key: 'contactPerson',
      title: t('contact'),
      render: (value, row) => (
        <div className="text-sm">
          <div className="flex items-center">
            <User className="w-4 h-4 text-gray-400 mr-1" />
            <span>{value || '-'}</span>
          </div>
          {row.contactPhone && (
            <div className="flex items-center mt-1">
              <Phone className="w-4 h-4 text-gray-400 mr-1" />
              <span>{row.contactPhone}</span>
            </div>
          )}
        </div>
      )
    },
    {
      key: 'materialRatesCount',
      title: t('materialRates'),
      render: (value, row) => (
        <div className="flex items-center">
          <Package className="w-4 h-4 text-gray-400 mr-1" />
          <span>{value || 0} {t('materials')}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      title: t('status'),
      render: (value, row) => (
        <div className="flex items-center">
          {getStatusIcon(value)}
          <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(value)}`}>
            {value ? t('active') : t('inactive')}
          </span>
        </div>
      )
    },
    {
      key: 'lastCalloutDate',
      title: t('lastCallout'),
      render: (value) => value ? new Date(value).toLocaleDateString() : '-'
    },
    {
      key: 'totalCollections',
      title: t('totalCollections'),
      render: (value) => value || 0
    },
    {
      key: 'actions',
      title: t('actions'),
      render: (value, row) => (
        <div className="flex space-x-1">
          <button
            onClick={() => handleViewLocation(row)}
            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
            title={t('viewDetails')}
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleViewRates(row)}
            className="p-1 text-green-600 hover:bg-green-50 rounded"
            title={t('viewRates')}
          >
            <Banknote className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleEditLocation(row)}
            className="p-1 text-purple-600 hover:bg-purple-50 rounded"
            title={t('edit')}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(row.id, row.isActive)}
            className={`p-1 rounded ${row.isActive ? 'text-red-600 hover:bg-red-50' : 'text-green-600 hover:bg-green-50'}`}
            title={row.isActive ? t('deactivate') : t('activate')}
          >
            {row.isActive ? <XCircle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
          </button>
          <button
            onClick={() => handleDeleteLocation(row.id)}
            className="p-1 text-red-600 hover:bg-red-50 rounded"
            title={t('delete')}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className={`contract-location-manager ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="manager-header">
        <div className="header-title">
          <MapPin className="w-6 h-6" />
          <h2>{t('contractLocationManagement')}</h2>
        </div>
        <div className="header-actions">
          <button 
            className="filter-btn"
            onClick={() => {/* TODO: Implement advanced filter modal */}}
          >
            <Filter className="w-4 h-4" />
            {t('filter')}
          </button>
          <button 
            className="add-btn"
            onClick={handleCreateLocation}
          >
            <Plus className="w-4 h-4" />
            {t('newLocation')}
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
              placeholder={t('searchLocations')}
              className="search-field"
            />
          </div>
        </div>

        <div className="filters">
          <select
            value={contractFilter}
            onChange={(e) => setContractFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('allContracts')}</option>
            {contracts.map(contract => (
              <option key={contract.id} value={contract.id}>
                {contract.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">{t('allStatuses')}</option>
            <option value="active">{t('active')}</option>
            <option value="inactive">{t('inactive')}</option>
          </select>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon active">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{locations.filter(l => l.isActive).length}</div>
            <div className="stat-label">{t('activeLocations')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon inactive">
            <XCircle className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{locations.filter(l => !l.isActive).length}</div>
            <div className="stat-label">{t('inactiveLocations')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon total">
            <MapPin className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{locations.length}</div>
            <div className="stat-label">{t('totalLocations')}</div>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon rates">
            <Banknote className="w-6 h-6" />
          </div>
          <div className="stat-content">
            <div className="stat-value">{locations.reduce((sum, l) => sum + (l.materialRatesCount || 0), 0)}</div>
            <div className="stat-label">{t('totalRates')}</div>
          </div>
        </div>
      </div>

      {/* Contract Locations Table */}
      <div className="locations-table">
        {loading ? (
          <div className="flex justify-center py-8">
            <LoadingSpinner size="large" />
          </div>
        ) : (
          <DataTable
            data={locations}
            columns={columns}
            pagination={pagination}
            onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
            emptyMessage={t('noLocationsFound')}
          />
        )}
      </div>

      {/* Create/Edit Location Modal */}
      {showCreateModal && (
        <LocationFormModal
          location={selectedLocation}
          contracts={contracts}
          isOpen={showCreateModal}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedLocation(null);
          }}
          onSubmit={() => {
            loadLocations();
            setShowCreateModal(false);
            setSelectedLocation(null);
          }}
        />
      )}

      {/* Location Details Modal */}
      {showDetailsModal && selectedLocation && (
        <LocationDetailsModal
          location={selectedLocation}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedLocation(null);
          }}
        />
      )}

      {/* Location Rates Modal */}
      {showRatesModal && selectedLocation && (
        <LocationRatesModal
          location={selectedLocation}
          isOpen={showRatesModal}
          onClose={() => {
            setShowRatesModal(false);
            setSelectedLocation(null);
          }}
        />
      )}
    </div>
  );
};

// Placeholder components for modals - to be implemented
const LocationFormModal = ({ location, contracts, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    supplierId: location?.supplierId || '',
    supplierName: location?.supplierName || '',
    locationName: location?.locationName || '',
    locationCode: location?.locationCode || '',
    address: location?.address || '',
    contactPerson: location?.contactPerson || '',
    contactPhone: location?.contactPhone || '',
    coordinates: location?.coordinates || '',
    notes: location?.notes || '',
    isActive: location?.isActive ?? true
  });
  
  // Load suppliers when modal opens
  useEffect(() => {
    if (isOpen) {
      loadSuppliers();
    }
  }, [isOpen]);

  const loadSuppliers = async () => {
    try {
      const supplierService = (await import('../../services/supplierService')).default;
      const response = await supplierService.getAll();
      if (response.success) {
        setSuppliers(response.data || []);
      } else {
        console.error('Failed to load suppliers:', response.error);
      }
    } catch (error) {
      console.error('Error loading suppliers:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.supplierId) {
      alert('Please select a supplier');
      return;
    }
    
    if (!formData.locationName || !formData.locationCode) {
      alert('Please fill in location name and code');
      return;
    }

    try {
      setLoading(true);
      
      // Find supplier name with type-safe comparison
      const selectedSupplier = suppliers.find(s => s.id == formData.supplierId);
      const supplierName = selectedSupplier?.name || formData.supplierName;
      
      if (!supplierName) {
        alert('Supplier name is required. Please select a valid supplier.');
        return;
      }
      
      const locationData = {
        ...formData,
        supplierId: parseInt(formData.supplierId),
        supplierName: supplierName
      };

      let response;
      if (location) {
        // Update existing location
        response = await contractLocationService.updateLocation(location.id, locationData);
      } else {
        // Create new location
        response = await contractLocationService.createLocation(locationData);
      }

      if (response.success) {
        onSubmit();
      } else {
        alert(response.error || 'Failed to save location');
      }
    } catch (error) {
      console.error('Error saving location:', error);
      alert('Error saving location. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={location ? t('editContractLocation') : t('addSupplierLocation')}
    >
      <form onSubmit={handleSubmit} className="supplier-location-form">
        {/* Supplier Selection */}
        <div className="form-section">
          <div className="form-section-title">
            <Building size={18} />
            {t('supplierInformation')}
          </div>
          
          <div className="form-group">
            <label htmlFor="supplier">{t('supplier')} *</label>
            <select
              id="supplier"
              value={formData.supplierId}
              onChange={(e) => {
                const supplier = suppliers.find(s => s.id === e.target.value);
                handleInputChange('supplierId', e.target.value);
                handleInputChange('supplierName', supplier?.name || '');
              }}
              required
              disabled={loading}
            >
              <option value="">{t('selectSupplier')}</option>
              {suppliers.map(supplier => (
                <option key={supplier.id} value={supplier.id}>
                  {supplier.name} ({supplier.businessType ? supplier.businessType.replace('_', ' ') : 'Unknown Business'})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Location Details */}
        <div className="form-section">
          <div className="form-section-title">
            <MapPin size={18} />
            {t('locationDetails')}
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="locationName">{t('locationName')} *</label>
              <input
                type="text"
                id="locationName"
                value={formData.locationName}
                onChange={(e) => handleInputChange('locationName', e.target.value)}
                placeholder={t('enterLocationName')}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="locationCode">{t('locationCode')} *</label>
              <input
                type="text"
                id="locationCode"
                value={formData.locationCode}
                onChange={(e) => handleInputChange('locationCode', e.target.value.toUpperCase())}
                placeholder="e.g., MUSC"
                maxLength={6}
                required
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="address">{t('address')}</label>
            <textarea
              id="address"
              value={formData.address}
              onChange={(e) => handleInputChange('address', e.target.value)}
              placeholder={t('enterFullAddress')}
              rows={3}
              disabled={loading}
            />
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <div className="form-section-title">
            <User size={18} />
            {t('contactInformation')}
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="contactPerson">{t('contactPerson')}</label>
              <input
                type="text"
                id="contactPerson"
                value={formData.contactPerson}
                onChange={(e) => handleInputChange('contactPerson', e.target.value)}
                placeholder={t('contactPersonPlaceholder')}
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="contactPhone">{t('contactPhone')}</label>
              <input
                type="tel"
                id="contactPhone"
                value={formData.contactPhone}
                onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                placeholder="+968 XXXX XXXX"
                disabled={loading}
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Package size={18} />
            {t('additionalInformation')}
          </div>
          
          <div className="form-group">
            <label htmlFor="coordinates">{t('coordinates')} ({t('optional')})</label>
            <input
              type="text"
              id="coordinates"
              value={formData.coordinates}
              onChange={(e) => handleInputChange('coordinates', e.target.value)}
              placeholder="23.5859° N, 58.4059° E"
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label htmlFor="notes">{t('notes')} ({t('optional')})</label>
            <textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder={t('additionalNotesPlaceholder')}
              rows={3}
              disabled={loading}
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => handleInputChange('isActive', e.target.checked)}
                disabled={loading}
              />
              {t('locationIsActive')}
            </label>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button 
            type="button" 
            onClick={onClose}
            className="btn btn-secondary"
            disabled={loading}
          >
            {t('cancel')}
          </button>
          <button 
            type="submit" 
            className="btn btn-primary"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" />
                {t('saving')}
              </>
            ) : (
              <>
                <CheckCircle size={16} />
                {location ? t('updateLocation') : t('createLocation')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

const LocationDetailsModal = ({ location, isOpen, onClose }) => {
  const { t } = useLocalization();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('contractLocationDetails')}>
      <div className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('locationName')}</label>
              <p className="text-gray-600">{location.locationName}</p>
            </div>
            <div>
              <label className="font-medium">{t('contract')}</label>
              <p className="text-gray-600">{location.contractName}</p>
            </div>
          </div>

          <div>
            <label className="font-medium">{t('address')}</label>
            <p className="text-gray-600">{location.address || '-'}</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('contactPerson')}</label>
              <p className="text-gray-600">{location.contactPerson || '-'}</p>
            </div>
            <div>
              <label className="font-medium">{t('contactPhone')}</label>
              <p className="text-gray-600">{location.contactPhone || '-'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('status')}</label>
              <p className="text-gray-600">{location.isActive ? t('active') : t('inactive')}</p>
            </div>
            <div>
              <label className="font-medium">{t('materialRates')}</label>
              <p className="text-gray-600">{location.materialRatesCount || 0} {t('materials')}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="font-medium">{t('totalCollections')}</label>
              <p className="text-gray-600">{location.totalCollections || 0}</p>
            </div>
            <div>
              <label className="font-medium">{t('lastCallout')}</label>
              <p className="text-gray-600">{location.lastCalloutDate ? new Date(location.lastCalloutDate).toLocaleDateString() : '-'}</p>
            </div>
          </div>

          {location.coordinates && (
            <div>
              <label className="font-medium">{t('coordinates')}</label>
              <p className="text-gray-600">{location.coordinates}</p>
            </div>
          )}

          {location.notes && (
            <div>
              <label className="font-medium">{t('notes')}</label>
              <p className="text-gray-600">{location.notes}</p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
};

const LocationRatesModal = ({ location, isOpen, onClose }) => {
  const { t } = useLocalization();
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t('materialRates')}>
      <div className="p-4">
        <div className="space-y-4">
          <div className="text-center">
            <Banknote className="w-12 h-12 text-gray-400 mx-auto" />
            <h3 className="text-lg font-medium">{t('materialRatesComingSoon')}</h3>
            <p className="text-gray-600">{t('ratesFeatureDescription')}</p>
          </div>
          
          <div className="text-sm text-gray-500">
            <p><strong>{t('location')}:</strong> {location.locationName}</p>
            <p><strong>{t('contract')}:</strong> {location.contractName}</p>
            <p><strong>{t('materialRates')}:</strong> {location.materialRatesCount || 0} {t('configured')}</p>
          </div>

          {/* TODO: Show material rates table with rate types, prices, units */}
          <div className="bg-gray-50 p-4 rounded">
            <h4 className="font-medium mb-2">{t('plannedFeatures')}</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• {t('materialSpecificRates')}</li>
              <li>• {t('rateTypeManagement')} (Fixed, Discount, Minimum Price, Free, We Pay)</li>
              <li>• {t('quantityLimits')}</li>
              <li>• {t('rateValidityPeriods')}</li>
            </ul>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default ContractLocationManager;