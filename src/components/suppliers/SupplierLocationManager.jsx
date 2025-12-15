import React, { useState, useEffect } from 'react';
import { MapPin, Plus, Search, Filter, Building, Phone, User, Edit, Trash2, Eye } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import { API_BASE_URL } from '../../config/api';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DataTable from '../ui/DataTable';
import '../../modules/scrap-materials/styles/Suppliers.css';

const SupplierLocationManager = () => {
  const { t, isRTL } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [locations, setLocations] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [regions, setRegions] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({});
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  });

  // Load data on component mount
  useEffect(() => {
    loadLocations();
    loadSuppliers();
    loadRegions();
  }, [pagination.page]);

  const loadLocations = async () => {
    try {
      setLoading(true);
      console.log('Loading supplier locations...');

      // Build query parameters
      const params = new URLSearchParams();
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());

      const url = `${API_BASE_URL}/supplier-locations?${params.toString()}`;
      console.log('Making request to:', url);

      // makeAuthenticatedRequest returns parsed JSON directly, not a Response object
      const data = await authService.makeAuthenticatedRequest(url);

      console.log('Locations API response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch supplier locations');
      }

      console.log('Setting locations:', data.data);
      setLocations(data.data || []);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.pages || 0
      }));

    } catch (error) {
      console.error('Error loading locations:', error);
      setLocations([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSuppliers = async () => {
    try {
      console.log('Loading suppliers...');
      // makeAuthenticatedRequest returns parsed JSON directly
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/suppliers`);

      console.log('Suppliers API response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch suppliers');
      }

      console.log('Setting suppliers:', data.data);
      setSuppliers(data.data || []);
    } catch (error) {
      console.error('Error loading suppliers:', error);
      setSuppliers([]);
    }
  };

  const loadRegions = async () => {
    try {
      console.log('Loading regions...');
      // makeAuthenticatedRequest returns parsed JSON directly
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/materials/regions`);

      console.log('Regions API response:', data);

      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch regions');
      }

      console.log('Setting regions:', data.data);
      setRegions(data.data || []);
    } catch (error) {
      console.error('Error loading regions:', error);
      setRegions([]);
    }
  };

  const handleCreateLocation = () => {
    setFormData({
      supplierId: '',
      locationName: '',
      locationCode: '',
      address: '',
      contactPerson: '',
      contactPhone: '',
      coordinates: '',
      region_id: '',
      isActive: true,
      notes: ''
    });
    setSelectedLocation(null);
    setShowCreateModal(true);
  };

  const handleEditLocation = (location) => {
    setFormData(location);
    setSelectedLocation(location);
    setShowCreateModal(true);
  };

  const handleDeleteLocation = async (location) => {
    try {
      setLoading(true);
      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/supplier-locations/${location.id}`,
        {
          method: 'DELETE'
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete supplier location');
      }

      loadLocations();
    } catch (error) {
      console.error('Error deleting location:', error);
      alert(error.message || 'Failed to delete location');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateLocation = async (location) => {
    try {
      setLoading(true);
      
      // Only send allowed fields for reactivation
      const reactivationData = {
        supplierId: location.supplierId,
        locationName: location.locationName,
        locationCode: location.locationCode,
        address: location.address || '',
        contactPerson: location.contactPerson || '',
        contactPhone: location.contactPhone || '',
        coordinates: location.coordinates || '',
        region_id: location.region_id || undefined,
        isActive: true,
        notes: location.notes || ''
      };

      const response = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/supplier-locations/${location.id}`,
        {
          method: 'PUT',
          body: JSON.stringify(reactivationData),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reactivate supplier location');
      }

      loadLocations();
    } catch (error) {
      console.error('Error reactivating location:', error);
      alert(error.message || 'Failed to reactivate location');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocation = async () => {
    try {
      setLoading(true);
      
      // Validate required fields
      if (!formData.supplierId || !formData.locationName || !formData.locationCode) {
        alert('Please fill in all required fields (Supplier, Location Name, and Location Code)');
        setLoading(false);
        return;
      }

      const url = selectedLocation 
        ? `${API_BASE_URL}/supplier-locations/${selectedLocation.id}` 
        : `${API_BASE_URL}/supplier-locations`;
      const method = selectedLocation ? 'PUT' : 'POST';

      // Clean the form data to only include allowed fields
      const cleanFormData = {
        supplierId: parseInt(formData.supplierId),
        locationName: formData.locationName.trim(),
        locationCode: formData.locationCode.trim(),
        address: formData.address ? formData.address.trim() : '',
        contactPerson: formData.contactPerson ? formData.contactPerson.trim() : '',
        contactPhone: formData.contactPhone ? formData.contactPhone.trim() : '',
        coordinates: formData.coordinates ? formData.coordinates.trim() : '',
        region_id: formData.region_id && formData.region_id !== '' ? parseInt(formData.region_id) : undefined,
        isActive: formData.isActive === true || formData.isActive === 1 || formData.isActive === '1',
        notes: formData.notes ? formData.notes.trim() : ''
      };

      // Additional validation
      if (!cleanFormData.supplierId || isNaN(cleanFormData.supplierId)) {
        alert('Please select a valid supplier');
        setLoading(false);
        return;
      }

      if (cleanFormData.locationName.length < 2) {
        alert('Location name must be at least 2 characters long');
        setLoading(false);
        return;
      }

      if (cleanFormData.locationCode.length > 10) {
        alert('Location code must be 10 characters or less');
        setLoading(false);
        return;
      }

      console.log('Sending cleaned form data:', cleanFormData);

      const response = await authService.makeAuthenticatedRequest(url, {
        method,
        body: JSON.stringify(cleanFormData),
        headers: {
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to save supplier location');
      }

      setShowCreateModal(false);
      loadLocations();
    } catch (error) {
      console.error('Error saving location:', error);
      alert(error.message || 'Failed to save location');
    } finally {
      setLoading(false);
    }
  };

  // Table columns for supplier locations - updated to match other screens
  const columns = [
    {
      key: 'supplierName',
      header: t('supplier', 'Supplier'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="supplier-info">
          <div className="supplier-avatar" style={{ backgroundColor: '#3b82f6' }}>
            {value ? value.substring(0, 2).toUpperCase() : '??'}
          </div>
          <div className="supplier-details">
            <strong>{value || 'Unknown Supplier'}</strong>
            <span className="supplier-id">ID: {row.supplierId}</span>
          </div>
        </div>
      )
    },
    {
      key: 'locationCode',
      header: t('locationCode', 'Location Code'),
      sortable: true,
      filterable: true,
      render: (value) => (
        <div className="location-code">
          <code>{value}</code>
        </div>
      )
    },
    {
      key: 'locationName',
      header: t('locationName', 'Location Name'),
      sortable: true,
      filterable: true,
      render: (value, row) => (
        <div className="location-info">
          <div className="location-avatar">
            <MapPin size={16} />
          </div>
          <div className="location-details">
            <strong>{value}</strong>
          </div>
        </div>
      )
    },
    {
      key: 'address',
      header: t('address', 'Address'),
      sortable: false,
      render: (value) => (
        <div className="address-info">
          <Building size={14} />
          <span>{value || 'Not provided'}</span>
        </div>
      )
    },
    {
      key: 'regionName',
      header: t('region', 'Region'),
      sortable: true,
      render: (value, row) => (
        <div className="region-info">
          <MapPin size={14} />
          <span>{value ? `${value} - ${row.regionGovernorate}` : 'Not specified'}</span>
        </div>
      )
    },
    {
      key: 'contactPerson',
      header: t('contactPerson', 'Contact Person'),
      sortable: true,
      render: (value) => (
        <div className="contact-info">
          <User size={14} />
          <span>{value || 'Not specified'}</span>
        </div>
      )
    },
    {
      key: 'contactPhone',
      header: t('phone', 'Phone'),
      sortable: false,
      render: (value) => (
        <div className="phone-info">
          <Phone size={14} />
          <span>{value || 'Not provided'}</span>
        </div>
      )
    },
    {
      key: 'isActive',
      header: t('status', 'Status'),
      sortable: true,
      filterable: true,
      render: (value, row) => {
        // Handle boolean values (true/false) and integer values (1/0)
        const isActive = value === true || value === 1 || value === '1';
        return (
          <span 
            className="supplier-status-badge"
            style={{ backgroundColor: isActive ? '#10b981' : '#ef4444' }}
          >
            {isActive ? t('active', 'Active') : t('inactive', 'Inactive')}
          </span>
        );
      }
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      sortable: false,
      render: (value, row) => (
        <div className="table-actions">
          <button 
            className="btn btn-outline btn-sm" 
            onClick={(e) => {
              e.stopPropagation()
              handleEditLocation(row)
            }}
            title={t('edit', 'Edit')}
          >
            <Edit size={14} />
          </button>
          {row.isActive ? (
            <button 
              className="btn btn-outline btn-sm btn-danger" 
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteLocation(row)
              }}
              title={t('delete', 'Delete')}
            >
              <Trash2 size={14} />
            </button>
          ) : (
            <button 
              className="btn btn-outline btn-sm btn-success" 
              onClick={(e) => {
                e.stopPropagation()
                handleReactivateLocation(row)
              }}
              title="Reactivate"
            >
              <Plus size={14} />
            </button>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="supplier-locations-page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-section">
          <h1>{t('supplierLocations', 'Supplier Locations')}</h1>
          <p>{t('manageCollectionPoints', 'Manage supplier collection points and locations')}</p>
        </div>
        
        <div className="page-actions">
          <button 
            className="btn btn-primary"
            onClick={handleCreateLocation}
          >
            <Plus size={20} />
            {t('addLocation', 'Add Location')}
          </button>
        </div>
      </div>


      {/* Data Table Container */}
      <div className="locations-table-container">
        {loading && (
          <div className="page-loading">
            <LoadingSpinner message="Loading locations..." size="large" />
          </div>
        )}
        <DataTable
          data={locations}
          columns={columns}
          title={t('supplierLocations', 'Supplier Locations')}
          subtitle={t('manageCollectionPointsSubtitle', 'View and manage all supplier collection points')}
          loading={loading}
          searchable={true}
          filterable={true}
          sortable={true}
          paginated={true}
          exportable={true}
          selectable={false}
          onRowClick={handleEditLocation}
          emptyMessage={t('noLocationsFound', 'No supplier locations found')}
          className="locations-table"
          initialPageSize={10}
          stickyHeader={true}
          enableColumnToggle={true}
        />
      </div>

      {/* Create/Edit Location Modal */}
      {showCreateModal && (
        <LocationFormModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSave={handleSaveLocation}
          title={selectedLocation ? t('editLocation', 'Edit Location') : t('addNewLocation', 'Add New Location')}
          formData={formData}
          setFormData={setFormData}
          suppliers={suppliers}
          regions={regions}
          isEdit={!!selectedLocation}
          loading={loading}
          t={t}
        />
      )}
    </div>
  );
};

// Location Form Modal Component
const LocationFormModal = ({ 
  isOpen, 
  onClose, 
  onSave, 
  title, 
  formData, 
  setFormData, 
  suppliers,
  regions, 
  isEdit, 
  loading,
  t 
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <Modal 
      isOpen={isOpen}
      title={title} 
      onClose={onClose}
      className="modal-xl"
    >
      <form className="location-form" onSubmit={handleSubmit}>
        {/* Basic Information */}
        <div className="form-section">
          <div className="form-section-title">
            <MapPin size={20} />
            {t('basicInformation', 'Basic Information')}
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>{t('supplier', 'Supplier')} *</label>
              <select
                value={formData.supplierId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, supplierId: parseInt(e.target.value) }))}
                required
                className="form-control"
              >
                <option value="">{t('selectSupplier', 'Select Supplier')}</option>
                {suppliers.map(supplier => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>{t('locationCode', 'Location Code')} *</label>
              <input
                type="text"
                value={formData.locationCode || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, locationCode: e.target.value }))}
                required
                placeholder="LOC001"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{t('locationName', 'Location Name')} *</label>
              <input
                type="text"
                value={formData.locationName || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, locationName: e.target.value }))}
                required
                placeholder="Main Collection Point"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{t('region', 'Region')}</label>
              <select
                value={formData.region_id || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, region_id: e.target.value }))}
                className="form-control"
              >
                <option value="">{t('selectRegion', 'Select Region')}</option>
                {regions.map(region => (
                  <option key={region.id} value={region.id}>
                    {region.name} - {region.governorate}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Phone size={20} />
            {t('contactInformation', 'Contact Information')}
          </div>
          
          <div className="form-grid">
            <div className="form-group">
              <label>{t('contactPerson', 'Contact Person')}</label>
              <input
                type="text"
                value={formData.contactPerson || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPerson: e.target.value }))}
                placeholder="Contact name"
                className="form-control"
              />
            </div>

            <div className="form-group">
              <label>{t('contactPhone', 'Contact Phone')}</label>
              <input
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, contactPhone: e.target.value }))}
                placeholder="+968 1234 5678"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Address & Additional Information */}
        <div className="form-section">
          <div className="form-section-title">
            <Building size={20} />
            {t('addressInformation', 'Address & Additional Information')}
          </div>
          
          <div className="form-grid">
            <div className="form-group full-width">
              <label>{t('address', 'Address')}</label>
              <textarea
                value={formData.address || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Full address of the location"
                rows="3"
                className="form-control"
              />
            </div>

            <div className="form-group full-width">
              <label>{t('notes', 'Notes')}</label>
              <textarea
                value={formData.notes || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this location"
                rows="2"
                className="form-control"
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="form-actions">
          <button type="button" className="btn btn-outline" onClick={onClose}>
            {t('cancel', 'Cancel')}
          </button>
          <button 
            type="submit" 
            className="btn btn-primary" 
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="loading-spinner" />
                {isEdit ? t('updating', 'Updating...') : t('creating', 'Creating...')}
              </>
            ) : (
              <>
                <MapPin size={16} />
                {isEdit ? t('updateLocation', 'Update Location') : t('createLocation', 'Create Location')}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default SupplierLocationManager;