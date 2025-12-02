import React, { useState, useEffect } from 'react';
import { Truck, User, AlertCircle, Car } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import Modal from '../ui/Modal';

const DriverAssignmentModal = ({ collectionOrder, isOpen, onClose, onSave }) => {
  const { t, isRTL } = useLocalization();
  const [formData, setFormData] = useState({
    driverName: '',
    vehiclePlate: '',
    vehicleType: ''
  });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Vehicle type options matching backend enum
  const vehicleTypeOptions = [
    { value: 'truck', label: t('vehicleTypeTruck') || 'Truck' },
    { value: 'pickup', label: t('vehicleTypePickup') || 'Pickup' },
    { value: 'van', label: t('vehicleTypeVan') || 'Van' },
    { value: 'trailer', label: t('vehicleTypeTrailer') || 'Trailer' }
  ];

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
          <input
            type="text"
            value={formData.vehiclePlate}
            onChange={(e) => handleChange('vehiclePlate', e.target.value.toUpperCase())}
            placeholder={t('enterVehiclePlate') || 'Enter vehicle plate (e.g. OM-1234)'}
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
