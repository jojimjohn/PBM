import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { calloutService } from '../../services/collectionService';
import contractService from '../../services/contractService';
import supplierService from '../../services/supplierService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';

const CalloutFormModal = ({ callout, isOpen, onClose, onSubmit }) => {
  const { t } = useLocalization();
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
  const [suppliers, setSuppliers] = useState([]);
  const [locations, setLocations] = useState([]);
  const [contractMaterials, setContractMaterials] = useState([]);
  const [specialInstructions, setSpecialInstructions] = useState(callout?.specialInstructions || '');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

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
      setSpecialInstructions('');
    }
  }, [callout, isOpen]);

  const loadCalloutForEditing = async (calloutId) => {
    try {
      setLoading(true);
      
      const response = await calloutService.getCallout(calloutId);
      
      if (response.ok) {
        const data = await response.json();
        
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
          setSpecialInstructions(calloutData.notes || ''); // Map from backend notes field
          
          // Also update contractMaterials to show quantities in the form
          if (calloutData.contractId) {
            // Load contract details to get the full material list, then merge with existing quantities
            loadContractDetails(calloutData.contractId, materials);
          }
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

  const loadContractDetails = async (contractId = null, existingMaterials = []) => {
    try {
      const targetContractId = contractId || formData.contractId;
      const response = await contractService.getById(targetContractId);
      if (response.success && response.data) {
        const contract = response.data;
        
        setFormData(prev => ({
          ...prev,
          supplierId: contract.supplierId
        }));
        
        if (contract.rates && contract.rates.length > 0) {
          const locationMap = new Map();
          const materials = [];
          
          contract.rates.forEach(rate => {
            const locationId = rate.locationId;
            const locationName = rate.locationName;
            const locationCode = rate.locationCode;
            
            if (!locationMap.has(locationId)) {
              locationMap.set(locationId, {
                id: locationId,
                name: locationName,
                locationCode: locationCode
              });
            }
            
            // Check if this material has existing quantities from loaded callout data
            const existingMaterial = existingMaterials.find(m => m.materialId === rate.materialId);
            
            materials.push({
              materialId: rate.materialId,
              materialName: rate.materialName,
              materialCode: rate.materialCode,
              unit: rate.unit,
              rateType: rate.rateType,
              contractRate: rate.contractRate,
              appliedRateType: rate.rateType, // For backend compatibility
              standardPrice: rate.standardPrice,
              minimumQuantity: rate.minimumQuantity,
              maximumQuantity: rate.maximumQuantity,
              locationId: locationId,
              locationName: locationName,
              availableQuantity: existingMaterial?.availableQuantity || 0, // Use existing quantity if available
              materialCondition: existingMaterial?.materialCondition || 'good',
              notes: existingMaterial?.notes || ''
            });
          });
          
          const locations = Array.from(locationMap.values());
          setLocations(locations);
          setContractMaterials(materials);
        } else {
          setLocations([]);
          setContractMaterials([]);
        }
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
      const rate = parseFloat(material.contractRate) || 0;
      return total + (material.availableQuantity * rate);
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
          availableQuantity: material.availableQuantity, // Use consistent field name
          unit: material.unit,
          condition: material.materialCondition,
          contractRate: parseFloat(material.contractRate) || 0,
          appliedRateType: material.appliedRateType || material.rateType,
          estimatedValue: material.availableQuantity * (parseFloat(material.contractRate) || 0),
          notes: material.notes || ''
        })),
        totalEstimatedValue: getTotalEstimatedValue()
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
                    <option value="">{t('selectContract')}</option>
                    {contracts.map(contract => (
                      <option key={contract.id} value={contract.id}>
                        {contract.contractNumber} - {contract.title}
                      </option>
                    ))}
                  </select>
                </div>

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
                  <label style={{ 
                    display: 'block', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    color: '#374151', 
                    marginBottom: '8px' 
                  }}>
                    {t('requestedPickupDate')} <span style={{ color: '#ef4444' }}>*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.requestedPickupDate ? formData.requestedPickupDate.split('T')[0] : ''}
                    onChange={(e) => {
                      // Convert date to end of day to ensure it's greater than current time
                      const selectedDate = new Date(e.target.value + 'T23:59:59.999Z');
                      handleInputChange('requestedPickupDate', selectedDate.toISOString());
                    }}
                    min={new Date().toISOString().split('T')[0]}
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
                  disabled={!formData.contractId || !formData.locationId || !formData.requestedPickupDate}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (!formData.contractId || !formData.locationId || !formData.requestedPickupDate) ? '#9ca3af' : '#2563eb',
                    border: '2px solid ' + ((!formData.contractId || !formData.locationId || !formData.requestedPickupDate) ? '#9ca3af' : '#2563eb'),
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: (!formData.contractId || !formData.locationId || !formData.requestedPickupDate) ? 'not-allowed' : 'pointer',
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
                  {getSelectedMaterials().length} {t('materialsSelected')}
                </div>
              </div>
              
              {contractMaterials.length > 0 ? (
                <div style={{ marginBottom: '24px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginBottom: '24px' }}>
                    {contractMaterials.filter(material => material.locationId === parseInt(formData.locationId)).map((material, filteredIndex) => {
                      const actualIndex = contractMaterials.findIndex(m => 
                        m.materialId === material.materialId && m.locationId === material.locationId
                      );
                      return (
                      <div key={`${material.materialId}-${material.locationId}`} style={{
                        backgroundColor: 'white',
                        border: '2px solid #e5e7eb',
                        borderRadius: '12px',
                        padding: '24px',
                        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                          <div style={{ flex: 1 }}>
                            <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1f2937', marginBottom: '4px' }}>
                              {material.materialName}
                            </h4>
                            <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '12px' }}>
                              {material.materialCode}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                              <span style={{
                                padding: '4px 12px',
                                borderRadius: '20px',
                                backgroundColor: '#dcfce7',
                                color: '#166534',
                                fontSize: '14px',
                                fontWeight: 'bold'
                              }}>
                                {material.contractRate || 'N/A'} OMR/{material.unit}
                              </span>
                              <span style={{
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: '#f3f4f6',
                                color: '#6b7280',
                                fontSize: '12px'
                              }}>
                                {t(material.rateType)}
                              </span>
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#059669' }}>
                              {(material.availableQuantity * (parseFloat(material.contractRate) || 0)).toFixed(3)}
                            </div>
                            <div style={{ fontSize: '14px', color: '#6b7280' }}>OMR</div>
                          </div>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: '#374151', 
                            marginBottom: '8px' 
                          }}>
                            {t('availableQuantity')} ({material.unit})
                          </label>
                          <input
                            type="number"
                            min={material.minimumQuantity || 0}
                            max={material.maximumQuantity || undefined}
                            step="0.001"
                            value={material.availableQuantity || ''}
                            onChange={(e) => handleMaterialChange(actualIndex, 'availableQuantity', parseFloat(e.target.value) || 0)}
                            onFocus={(e) => e.target.value === '0' && e.target.select()}
                            placeholder={`Min: ${material.minimumQuantity || 0}${material.maximumQuantity ? `, Max: ${material.maximumQuantity}` : ''}`}
                            style={{
                              width: '100%',
                              padding: '12px 16px',
                              border: '2px solid #d1d5db',
                              borderRadius: '8px',
                              fontSize: '16px',
                              fontWeight: '500',
                              textAlign: 'right',
                              backgroundColor: 'white',
                              color: '#1f2937'
                            }}
                          />
                          {(material.minimumQuantity || material.maximumQuantity) && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              fontSize: '12px',
                              color: '#6b7280',
                              marginTop: '4px',
                              backgroundColor: '#f9fafb',
                              padding: '8px 12px',
                              borderRadius: '6px'
                            }}>
                              {material.minimumQuantity && (
                                <span><strong>{t('min')}:</strong> {material.minimumQuantity} {material.unit}</span>
                              )}
                              {material.maximumQuantity && (
                                <span><strong>{t('max')}:</strong> {material.maximumQuantity} {material.unit}</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ 
                            display: 'block', 
                            fontSize: '14px', 
                            fontWeight: 'bold', 
                            color: '#374151', 
                            marginBottom: '8px' 
                          }}>
                            {t('condition')}
                          </label>
                          <select
                            value={material.materialCondition}
                            onChange={(e) => handleMaterialChange(actualIndex, 'materialCondition', e.target.value)}
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
                            <option value="excellent">{t('excellent')}</option>
                            <option value="good">{t('good')}</option>
                            <option value="fair">{t('fair')}</option>
                            <option value="poor">{t('poor')}</option>
                            <option value="mixed">{t('mixed')}</option>
                          </select>
                        </div>
                      </div>
                      );
                    })}
                  </div>

                  {/* Special Instructions */}
                  <div style={{
                    backgroundColor: '#f8fafc',
                    border: '2px solid #e2e8f0',
                    borderRadius: '12px',
                    padding: '20px',
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
                  
                  {/* Summary */}
                  <div style={{
                    backgroundColor: '#eff6ff',
                    border: '2px solid #bfdbfe',
                    borderRadius: '12px',
                    padding: '20px'
                  }}>
                    <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af', marginBottom: '16px' }}>
                      {t('calloutSummary')}
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                          {t('selectedMaterials')}:
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
                          {getSelectedMaterials().length}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', color: '#1e40af' }}>
                          {t('totalEstimatedValue')}:
                        </span>
                        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#1e40af' }}>
                          {getTotalEstimatedValue().toFixed(3)} OMR
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '48px 24px' }}>
                  <Package size={64} style={{ color: '#9ca3af', margin: '0 auto 16px' }} />
                  <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#6b7280', marginBottom: '8px' }}>
                    {t('noMaterialsAvailable')}
                  </h4>
                  <p style={{ color: '#9ca3af' }}>{t('pleaseSelectContractAndLocation')}</p>
                </div>
              )}

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
                  disabled={loading || getSelectedMaterials().length === 0}
                  style={{
                    padding: '12px 24px',
                    backgroundColor: (loading || getSelectedMaterials().length === 0) ? '#9ca3af' : '#059669',
                    border: '2px solid ' + ((loading || getSelectedMaterials().length === 0) ? '#9ca3af' : '#059669'),
                    borderRadius: '8px',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    cursor: (loading || getSelectedMaterials().length === 0) ? 'not-allowed' : 'pointer',
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