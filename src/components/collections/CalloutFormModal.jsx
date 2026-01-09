import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { calloutService } from '../../services/collectionService';
import contractService from '../../services/contractService';
import supplierService from '../../services/supplierService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import DateInput from '../ui/DateInput';
import MaterialSelector from '../ui/MaterialSelector';

const CalloutFormModal = ({ callout, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
  const { toAPIDateFormat, getInputDate } = useSystemSettings();
  const [formData, setFormData] = useState({
    contractId: '',
    supplierId: '',
    locationId: '',
    requestedPickupDate: '',
    priority: 'normal',
    contactPerson: '',
    contactPhone: '',
    materials: []
  });
  const [contracts, setContracts] = useState([]);
  const [filteredContracts, setFilteredContracts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [selectedMaterials, setSelectedMaterials] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState(callout?.specialInstructions || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Filter contracts when supplier changes - exclude expired contracts
  useEffect(() => {
    if (formData.supplierId && contracts.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Start of today for comparison

      const supplierContracts = contracts.filter(c => {
        // Must belong to selected supplier
        if (c.supplierId !== parseInt(formData.supplierId)) return false;

        // Must be active status
        if (c.status !== 'active') return false;

        // Must not be expired (endDate >= today)
        if (c.endDate) {
          const endDate = new Date(c.endDate);
          endDate.setHours(23, 59, 59, 999); // End of the contract end date
          if (endDate < today) return false;
        }

        return true;
      });
      setFilteredContracts(supplierContracts);
    } else {
      setFilteredContracts([]);
    }
  }, [formData.supplierId, contracts]);

  useEffect(() => {
    if (isOpen) {
      loadInitialData();
    }
  }, [isOpen]);

  useEffect(() => {
    if (callout && isOpen) {
      // For editing, fetch full callout details including items
      loadCalloutForEditing(callout.id);
    } else if (isOpen) {
      // Reset form for new callout
      setFormData({
        contractId: '',
        supplierId: '',
        locationId: '',
        requestedPickupDate: '',
        priority: 'normal',
        contactPerson: '',
        contactPhone: '',
        materials: []
      });
      setSelectedMaterials([]); // Reset material selection
      setSpecialInstructions('');
    }
  }, [callout, isOpen]);

  const loadCalloutForEditing = async (calloutId) => {
    try {
      setLoading(true);

      const data = await calloutService.getCallout(calloutId);

      if (data.success) {
        const calloutData = data.data;

        // Convert items to materials format expected by the form
        const materials = calloutData.items?.map(item => ({
          materialId: item.materialId,
          materialName: item.materialName,
          availableQuantity: item.availableQuantity, // Map from backend availableQuantity
          unit: item.materialUnit,
          qualityGrade: item.qualityGrade,
          materialCondition: item.materialCondition, // Map from backend materialCondition
          notes: item.notes
        })) || [];

        const newFormData = {
          contractId: calloutData.contractId || '',
          supplierId: calloutData.supplierId || '',
          locationId: calloutData.locationId || '',
          requestedPickupDate: calloutData.scheduledDate ? calloutData.scheduledDate.split('T')[0] : '',
          priority: calloutData.priority || 'normal',
          contactPerson: calloutData.contactPerson || '',
          contactPhone: calloutData.contactPhone || '',
          materials: materials
        };

        setFormData(newFormData);
        setSelectedMaterials(materials); // Initialize MaterialSelector with existing materials
        setSpecialInstructions(calloutData.notes || ''); // Map from backend notes field

        // Load locations for the contract (materials will be managed by MaterialSelector in edit mode)
        if (calloutData.contractId) {
          loadContractDetails(calloutData.contractId);
        }
      }
    } catch (error) {
      console.error('Error loading callout for editing:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (formData.contractId) {
      loadContractDetails();
    }
  }, [formData.contractId]);

  const loadInitialData = async () => {
    try {
      setLoading(true);
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

  const loadContractDetails = async (contractId = null) => {
    try {
      const targetContractId = contractId || formData.contractId;
      const response = await contractService.getById(targetContractId);
      if (response.success && response.data) {
        const contract = response.data;

        setFormData(prev => ({
          ...prev,
          supplierId: contract.supplierId
        }));

        // Load locations only - materials will be managed by MaterialSelector
        if (contract.rates && contract.rates.length > 0) {
          const locationMap = new Map();

          contract.rates.forEach(rate => {
            const locationId = rate.locationId;
            const locationName = rate.locationName;
            const locationCode = rate.locationCode;
            const isActive = rate.locationIsActive === 1 || rate.locationIsActive === true;

            if (!locationMap.has(locationId)) {
              locationMap.set(locationId, {
                id: locationId,
                name: locationName,
                locationCode: locationCode,
                isActive: isActive
              });
            }
          });

          let locations = Array.from(locationMap.values());

          // For NEW callouts, filter out inactive locations
          // For EDITING existing callouts, keep all locations (including inactive ones that may be selected)
          if (!callout) {
            locations = locations.filter(loc => loc.isActive);
          }

          setLocations(locations);

          // Auto-select if only one location available (for new callouts only)
          if (!callout && locations.length === 1) {
            setFormData(prev => ({
              ...prev,
              locationId: locations[0].id.toString()
            }));
          }
          // Do NOT pre-populate materials - MaterialSelector will handle material selection
        } else {
          setLocations([]);
        }
      }
    } catch (error) {
      console.error('Error loading contract details:', error);
      setLocations([]);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };

      // Reset dependent fields when supplier changes
      if (field === 'supplierId') {
        updated.contractId = '';
        updated.locationId = '';
        setLocations([]);
        setSelectedMaterials([]);
      }

      // Reset location when contract changes
      if (field === 'contractId') {
        updated.locationId = '';
      }

      return updated;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Filter out materials with zero quantities (Task 1.9)
      const materialsWithQuantity = selectedMaterials.filter(m => m.quantity > 0);

      if (materialsWithQuantity.length === 0) {
        alert(t('pleaseSelectAtLeastOneMaterial'));
        setLoading(false);
        return;
      }

      // Calculate total estimated value
      const totalEstimatedValue = materialsWithQuantity.reduce((total, material) => {
        const rate = parseFloat(material.contractRate) || 0;
        return total + (material.quantity * rate);
      }, 0);

      const calloutData = {
        ...formData,
        specialInstructions: specialInstructions,
        materials: materialsWithQuantity.map(material => ({
          materialId: material.materialId,
          availableQuantity: material.quantity, // Map quantity to availableQuantity for backend
          unit: material.unit,
          condition: material.materialCondition || 'good', // Default condition
          contractRate: parseFloat(material.contractRate) || 0,
          appliedRateType: material.appliedRateType || material.rateType || 'fixed_rate',
          estimatedValue: material.quantity * (parseFloat(material.contractRate) || 0),
          notes: material.notes || ''
        })),
        totalEstimatedValue: totalEstimatedValue
      };

      const response = callout
        ? await calloutService.updateCallout(callout.id, calloutData)
        : await calloutService.createCallout(calloutData);

      if (response.success) {
        // Show success message
        alert(callout ? t('calloutUpdatedSuccessfully') : t('calloutCreatedSuccessfully'));

        // Refresh the parent list
        if (onSubmit) {
          onSubmit();
        }

        // Close the modal
        onClose();
      } else {
        // Show error message
        alert(response.error || t('errorSavingCallout'));
      }
    } catch (error) {
      console.error('Error saving callout:', error);
      alert(t('errorSavingCallout'));
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose}
      closeOnOverlayClick={false}
      title={callout ? t('editCallout') : t('createCallout')}
      className="modal-xl"
    >
      <div style={{ padding: '24px' }}>
        {/* Professional Progress Indicator */}
        <div style={{
          backgroundColor: '#f8fafc',
          margin: '-24px -24px 24px -24px',
          padding: '20px 24px',
          borderBottom: '1px solid #e2e8f0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= 1 ? '#2563eb' : '#d1d5db',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                1
              </div>
              <div style={{
                width: '80px',
                height: '4px',
                borderRadius: '2px',
                backgroundColor: step >= 2 ? '#2563eb' : '#d1d5db'
              }}></div>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                backgroundColor: step >= 2 ? '#2563eb' : '#d1d5db',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 'bold',
                fontSize: '16px'
              }}>
                2
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '320px', margin: '0 auto' }}>
            <span style={{ 
              fontWeight: step === 1 ? 'bold' : 'normal',
              color: step === 1 ? '#2563eb' : '#64748b',
              fontSize: '14px'
            }}>
              {t('contractAndLocation')}
            </span>
            <span style={{ 
              fontWeight: step === 2 ? 'bold' : 'normal',
              color: step === 2 ? '#2563eb' : '#64748b',
              fontSize: '14px'
            }}>
              {t('materialsAndInstructions')}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Step 1: Contract & Location */}
          {step === 1 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                  {t('contractAndLocation')}
                </h3>
                <p style={{ color: '#6b7280', fontSize: '14px' }}>
                  {t('selectContractAndLocationForPickup')}
                </p>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', marginBottom: '32px' }}>
                {/* Supplier Selection - First */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {t('supplier')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => handleInputChange('supplierId', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      backgroundColor: 'white',
                      color: '#1f2937'
                    }}
                    required
                  >
                    <option value="">{t('selectSupplier')}</option>
                    {suppliers.map(supplier => (
                      <option key={supplier.id} value={supplier.id}>
                        {supplier.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Contract Selection - Filtered by Supplier */}
                <div>
                  <label style={{
                    display: 'block',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    color: '#374151',
                    marginBottom: '8px'
                  }}>
                    {t('selectContract')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.contractId}
                    onChange={(e) => handleInputChange('contractId', e.target.value)}
                    disabled={!formData.supplierId}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      backgroundColor: !formData.supplierId ? '#f3f4f6' : 'white',
                      color: !formData.supplierId ? '#6b7280' : '#1f2937'
                    }}
                    required
                  >
                    <option value="">
                      {!formData.supplierId
                        ? t('selectSupplierFirst')
                        : filteredContracts.length === 0
                          ? t('noContractsAvailable')
                          : t('selectContract')
                      }
                    </option>
                    {filteredContracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.contractNumber} - {contract.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Pickup Location - Filtered by Contract */}
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    {t('pickupLocation')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <select
                    value={formData.locationId}
                    onChange={(e) => handleInputChange('locationId', e.target.value)}
                    disabled={!formData.contractId}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      backgroundColor: !formData.contractId ? '#f3f4f6' : 'white',
                      color: !formData.contractId ? '#6b7280' : '#1f2937'
                    }}
                    required
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
                </div>

                <div>
                  <DateInput
                    label={t('requestedPickupDate')}
                    value={formData.requestedPickupDate ? formData.requestedPickupDate.split('T')[0] : ''}
                    onChange={(value) => {
                      // Convert to ISO format for API consistency
                      if (value) {
                        handleInputChange('requestedPickupDate', value);
                      } else {
                        handleInputChange('requestedPickupDate', '');
                      }
                    }}
                    minDate={new Date().toISOString().split('T')[0]}
                    required
                    size="large"
                  />
                </div>
                
                <div>
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    {t('priority')}
                  </label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      border: '2px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '16px',
                      fontWeight: '500',
                      backgroundColor: 'white',
                      color: '#1f2937'
                    }}
                  >
                    <option value="low">{t('low')}</option>
                    <option value="normal">{t('normal')}</option>
                    <option value="high">{t('high')}</option>
                    <option value="urgent">{t('urgent')}</option>
                  </select>
                </div>
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button 
                  type="button" 
                  onClick={onClose}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    border: '2px solid #6b7280',
                    borderRadius: '8px',
                    color: '#374151',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer'
                  }}
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  disabled={!formData.supplierId || !formData.contractId || !formData.locationId || !formData.requestedPickupDate}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (!formData.supplierId || !formData.contractId || !formData.locationId || !formData.requestedPickupDate) ? '#9ca3af' : '#2563eb',
                    border: '2px solid ' + ((!formData.supplierId || !formData.contractId || !formData.locationId || !formData.requestedPickupDate) ? '#9ca3af' : '#2563eb'),
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: (!formData.supplierId || !formData.contractId || !formData.locationId || !formData.requestedPickupDate) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {t('next')} <Package size={20} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Materials */}
          {step === 2 && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
                  {t('availableMaterials')}
                </h3>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  padding: '4px 12px',
                  borderRadius: '20px',
                  backgroundColor: '#dbeafe',
                  color: '#1d4ed8',
                  fontSize: '14px',
                  fontWeight: '500'
                }}>
                  {selectedMaterials.length} {t('materialsSelected')}
                </div>
              </div>
              
              {/* MaterialSelector Component */}
              <MaterialSelector
                contractId={formData.contractId}
                locationId={formData.locationId}
                selectedMaterials={selectedMaterials}
                onChange={setSelectedMaterials}
                mode={callout ? 'edit' : 'create'}
                disabled={loading}
              />

              {/* Special Instructions */}
              <div style={{
                backgroundColor: '#f8fafc',
                border: '2px solid #e2e8f0',
                borderRadius: '12px',
                padding: '20px',
                marginTop: '24px',
                marginBottom: '24px'
              }}>
                <label style={{
                  display: 'block',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  color: '#374151',
                  marginBottom: '12px'
                }}>
                  {t('specialInstructions')}
                </label>
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  rows={4}
                  placeholder={t('anySpecialInstructionsForPickup')}
                  style={{
                    width: '100%',
                    padding: '12px 16px',
                    border: '2px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '16px',
                    fontWeight: '500',
                    backgroundColor: 'white',
                    color: '#1f2937',
                    resize: 'vertical'
                  }}
                />
              </div>

              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                paddingTop: '24px',
                borderTop: '1px solid #e5e7eb'
              }}>
                <button 
                  type="button" 
                  onClick={() => setStep(1)}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: 'white',
                    border: '2px solid #6b7280',
                    borderRadius: '8px',
                    color: '#374151',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  ← {t('back')}
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedMaterials.length === 0}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (loading || selectedMaterials.length === 0) ? '#9ca3af' : '#059669',
                    border: '2px solid ' + ((loading || selectedMaterials.length === 0) ? '#9ca3af' : '#059669'),
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: (loading || selectedMaterials.length === 0) ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {loading ? <LoadingSpinner size="small" /> : <CheckCircle size={20} />}
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

export default CalloutFormModal;