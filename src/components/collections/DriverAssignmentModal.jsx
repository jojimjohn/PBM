import React, { useState, useEffect } from 'react';
import { Truck, User, AlertCircle, Car, Search } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import Modal from '../ui/Modal';
import vehicleTypeService from '../../services/vehicleTypeService';
import vehicleService from '../../services/vehicleService';

const DriverAssignmentModal = ({ collectionOrder, isOpen, onClose, onSave }) => {
  const { t, isRTL } = useLocalization();
  const [formData, setFormData] = useState({
    driverName: '',
    vehiclePlate: '',
    vehicleType: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Dynamic vehicle types from API
  const [vehicleTypeOptions, setVehicleTypeOptions] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [vehicleSuggestions, setVehicleSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Load vehicle types and vehicles from API
  useEffect(() => {
    if (isOpen) {
      vehicleTypeService.getAll(true).then(result => {
        if (result.success) {
          setVehicleTypeOptions(result.data.map(vt => ({
            value: vt.type_name.toLowerCase().replace(/\s+/g, '_'),
            label: vt.type_name,
            id: vt.id
          })));
        }
      });
      vehicleService.getAll({ status: 'active' }).then(result => {
        if (result.success) setVehicles(result.data);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (collectionOrder && isOpen) {
      setFormData({
        driverName: collectionOrder.driverName || '',
        vehiclePlate: collectionOrder.vehiclePlate || '',
        vehicleType: collectionOrder.vehicleType || ''
      });
      setErrors({});
    }
  }, [collectionOrder, isOpen]);

  // Filter vehicles by plate as user types
  const handlePlateChange = (value) => {
    const upperValue = value.toUpperCase();
    handleChange('vehiclePlate', upperValue);
    if (upperValue.length >= 2) {
      const matches = vehicles.filter(v => v.vehicle_plate.includes(upperValue));
      setVehicleSuggestions(matches.slice(0, 5));
      setShowSuggestions(matches.length > 0);
    } else {
      setShowSuggestions(false);
    }
  };

  const selectVehicle = (vehicle) => {
    handleChange('vehiclePlate', vehicle.vehicle_plate);
    // Auto-populate vehicle type from master data
    if (vehicle.vehicle_type_name) {
      const matchingType = vehicleTypeOptions.find(vt =>
        vt.label.toLowerCase() === vehicle.vehicle_type_name.toLowerCase()
      );
      if (matchingType) handleChange('vehicleType', matchingType.value);
    }
    setShowSuggestions(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.driverName.trim()) {
      newErrors.driverName = t('driverNameRequired') || 'Driver name is required';
    }

    if (!formData.vehiclePlate.trim()) {
      newErrors.vehiclePlate = t('vehiclePlateRequired') || 'Vehicle plate is required';
    }

    if (!formData.vehicleType) {
      newErrors.vehicleType = t('vehicleTypeRequired') || 'Vehicle type is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Error assigning driver:', error);
      setErrors({ submit: error.message || t('errorAssigningDriver') });
    } finally {
      setSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('assignDriver')}
      size="medium"
    >
      <form onSubmit={handleSubmit} style={{ padding: '24px', direction: isRTL ? 'rtl' : 'ltr' }}>
        {/* Collection Order Info Banner */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: 'var(--blue-50)',
          borderRadius: '8px',
          border: '1px solid var(--blue-200)'
        }}>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--blue-900)', fontWeight: '500' }}>
            {t('calloutNumber')}: #{collectionOrder?.calloutNumber || collectionOrder?.id}
          </p>
          {collectionOrder?.locationName && (
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--blue-700)' }}>
              {t('location')}: {collectionOrder.locationName}
            </p>
          )}
        </div>

        {/* Driver Name */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--gray-700)'
          }}>
            <User style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
            {t('driverName')} *
          </label>
          <input
            type="text"
            value={formData.driverName}
            onChange={(e) => handleChange('driverName', e.target.value)}
            placeholder={t('enterDriverName')}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${errors.driverName ? 'var(--red-500)' : 'var(--gray-300)'}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              transition: 'border-color 0.2s'
            }}
            required
          />
          {errors.driverName && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--red-600)' }}>
              <AlertCircle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              {errors.driverName}
            </p>
          )}
        </div>

        {/* Vehicle Plate */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--gray-700)'
          }}>
            <Truck style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
            {t('vehiclePlate') || 'Vehicle Plate'} *
          </label>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              value={formData.vehiclePlate}
              onChange={(e) => handlePlateChange(e.target.value)}
              onFocus={() => formData.vehiclePlate.length >= 2 && vehicleSuggestions.length > 0 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder={t('enterVehiclePlate') || 'Search by plate or type manually'}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: `1px solid ${errors.vehiclePlate ? 'var(--red-500)' : 'var(--gray-300)'}`,
                borderRadius: '6px',
                fontSize: '14px',
                backgroundColor: 'white',
                textTransform: 'uppercase',
                transition: 'border-color 0.2s'
              }}
              required
            />
            {showSuggestions && (
              <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 10,
                backgroundColor: 'white', border: '1px solid var(--gray-300)',
                borderRadius: '6px', marginTop: '2px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
              }}>
                {vehicleSuggestions.map(v => (
                  <div key={v.id} onClick={() => selectVehicle(v)} style={{
                    padding: '8px 12px', cursor: 'pointer', fontSize: '13px',
                    borderBottom: '1px solid var(--gray-100)'
                  }}
                  onMouseEnter={e => e.target.style.backgroundColor = 'var(--blue-50)'}
                  onMouseLeave={e => e.target.style.backgroundColor = 'white'}>
                    <strong>{v.vehicle_plate}</strong> — {v.vehicle_type_name || 'No type'} {v.make ? `(${v.make} ${v.model || ''})` : ''}
                  </div>
                ))}
              </div>
            )}
          </div>
          {errors.vehiclePlate && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--red-600)' }}>
              <AlertCircle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              {errors.vehiclePlate}
            </p>
          )}
        </div>

        {/* Vehicle Type */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            marginBottom: '8px',
            fontSize: '14px',
            fontWeight: '500',
            color: 'var(--gray-700)'
          }}>
            <Car style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
            {t('vehicleType') || 'Vehicle Type'} *
          </label>
          <select
            value={formData.vehicleType}
            onChange={(e) => handleChange('vehicleType', e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              border: `1px solid ${errors.vehicleType ? 'var(--red-500)' : 'var(--gray-300)'}`,
              borderRadius: '6px',
              fontSize: '14px',
              backgroundColor: 'white',
              transition: 'border-color 0.2s',
              cursor: 'pointer'
            }}
            required
          >
            <option value="">{t('selectVehicleType') || 'Select vehicle type'}</option>
            {vehicleTypeOptions.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {errors.vehicleType && (
            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--red-600)' }}>
              <AlertCircle style={{ width: '12px', height: '12px', display: 'inline', marginRight: '4px' }} />
              {errors.vehicleType}
            </p>
          )}
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div style={{
            marginBottom: '20px',
            padding: '12px',
            backgroundColor: 'var(--red-50)',
            border: '1px solid var(--red-200)',
            borderRadius: '6px'
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--red-700)' }}>
              <AlertCircle style={{ width: '16px', height: '16px', display: 'inline', marginRight: '6px' }} />
              {errors.submit}
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: 'white',
              color: 'var(--gray-700)',
              border: '1px solid var(--gray-300)',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.6 : 1
            }}
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '10px 20px',
              backgroundColor: submitting ? 'var(--primary-400)' : 'var(--primary-600)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: submitting ? 'not-allowed' : 'pointer',
              transition: 'background-color 0.2s'
            }}
          >
            {submitting ? t('assigning') : t('assignDriver')}
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default DriverAssignmentModal;
