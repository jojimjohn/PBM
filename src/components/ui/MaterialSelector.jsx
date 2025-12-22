import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLocalization } from '../../context/LocalizationContext';
import LoadingSpinner from '../LoadingSpinner';
import { calloutService } from '../../services/collectionService';

/**
 * MaterialSelector Component
 *
 * Reusable component for dynamic material selection in collection orders.
 * Allows users to freely select and modify materials when creating or editing
 * collection orders for Al Ramrami Trading Enterprises (oil/petroleum business).
 *
 * @param {number} contractId - Selected contract ID
 * @param {number} locationId - Selected supplier location ID
 * @param {Array} selectedMaterials - Currently selected materials with quantities
 * @param {Function} onChange - Callback when material selection changes
 * @param {string} mode - Operation mode: 'create' or 'edit'
 * @param {boolean} disabled - Whether the component is disabled
 */
const MaterialSelector = ({
  contractId,
  locationId,
  selectedMaterials = [],
  onChange,
  mode = 'create',
  disabled = false
}) => {
  const { t } = useLocalization();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [availableMaterials, setAvailableMaterials] = useState([]);

  // Load materials from API
  const loadMaterials = async () => {
    if (!contractId || !locationId) {
      console.log('[MaterialSelector] Missing contractId or locationId:', { contractId, locationId });
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      console.log('[MaterialSelector] Loading materials for:', { contractId, locationId });
      const response = await calloutService.getContractMaterials(contractId, locationId);
      console.log('[MaterialSelector] API Response:', response);

      if (response.success) {
        console.log('[MaterialSelector] Materials received:', response.data?.length || 0, 'items:', response.data);
        setAvailableMaterials(response.data || []);
      } else {
        console.error('[MaterialSelector] Error response:', response.error);
        setError(response.error || t('errorLoadingMaterials'));
      }
    } catch (err) {
      console.error('[MaterialSelector] Error loading materials:', err);
      setError(t('errorLoadingMaterials'));
    } finally {
      setLoading(false);
    }
  };

  // Load materials when contract or location changes
  useEffect(() => {
    loadMaterials();
  }, [contractId, locationId]);

  // Retry function for error recovery
  const retry = () => {
    loadMaterials();
  };

  // Handle material selection toggle
  const handleToggleMaterial = (materialId) => {
    if (disabled) return;

    const isSelected = selectedMaterials.some(m => m.materialId === materialId);
    let updatedMaterials;

    if (isSelected) {
      // Remove material from selection
      updatedMaterials = selectedMaterials.filter(m => m.materialId !== materialId);
    } else {
      // Add material with quantity 0 and contract rate information
      const material = availableMaterials.find(m => m.materialId === materialId);
      updatedMaterials = [
        ...selectedMaterials,
        {
          materialId: material.materialId,
          materialName: material.materialName,
          materialCode: material.materialCode,
          quantity: 0,
          unit: material.unit,
          minimumQuantity: material.minimumQuantity,
          maximumQuantity: material.maximumQuantity,
          // Include contract rate fields - CRITICAL for billing workflow
          contractRate: material.contractRate || 0,
          rateType: material.rateType || 'fixed_rate',
          paymentDirection: material.paymentDirection || 'we_pay',
          discountPercentage: material.discountPercentage || 0,
          minimumPrice: material.minimumPrice || 0,
          standardPrice: material.standardPrice || 0
        }
      ];
    }

    onChange(updatedMaterials);
  };

  // Handle quantity change with validation
  const handleQuantityChange = (materialId, newQuantity) => {
    if (disabled) return;

    const quantity = parseFloat(newQuantity) || 0;
    const material = availableMaterials.find(m => m.materialId === materialId);

    const updatedMaterials = selectedMaterials.map(m => {
      if (m.materialId === materialId) {
        return { ...m, quantity };
      }
      return m;
    });

    onChange(updatedMaterials);
  };

  // Validate quantity against constraints
  const getQuantityError = (material) => {
    if (!material.quantity) return null;

    const min = material.minimumQuantity || 0;
    const max = material.maximumQuantity;

    if (material.quantity < min) {
      return t('quantityBelowMinimum', { min, unit: material.unit });
    }

    if (max && material.quantity > max) {
      return t('quantityAboveMaximum', { max, unit: material.unit });
    }

    return null;
  };

  // Conditional rendering based on state
  if (loading) {
    return <LoadingSpinner message={t('loadingMaterials')} />;
  }

  if (error) {
    return (
      <div className="error-message">
        {error}
        <button onClick={retry} className="btn-retry">
          {t('retry')}
        </button>
      </div>
    );
  }

  return (
    <div className="material-selector-container">
      <div className="materials-table-header">
        <h4>{t('selectMaterials')}</h4>
        <p className="text-sm text-gray-600">
          {t('selectMaterialsToCollect')} ({selectedMaterials.length} {t('selected')})
        </p>
      </div>

      {availableMaterials.length === 0 ? (
        <div className="no-materials-message">
          {t('noMaterialsAvailable')}
        </div>
      ) : (
        <table className="materials-table">
          <thead>
            <tr>
              <th className="checkbox-col">{t('select')}</th>
              <th>{t('material')}</th>
              <th>{t('rate')}</th>
              <th>{t('quantity')}</th>
              <th>{t('unit')}</th>
            </tr>
          </thead>
          <tbody>
            {availableMaterials.map((material) => {
              const selected = selectedMaterials.find(m => m.materialId === material.materialId);
              const quantityError = selected ? getQuantityError(selected) : null;

              return (
                <tr key={material.materialId} className={`material-row ${selected ? 'selected' : ''}`}>
                  <td className="checkbox-col">
                    <input
                      type="checkbox"
                      className="material-checkbox"
                      checked={!!selected}
                      onChange={() => handleToggleMaterial(material.materialId)}
                      disabled={disabled}
                    />
                  </td>
                  <td>
                    <div className="material-name">{material.materialName}</div>
                    {(material.minimumQuantity > 0 || material.maximumQuantity > 0) ? (
                      <div className="material-constraints">
                        {material.minimumQuantity > 0 && `${t('min')}: ${material.minimumQuantity} ${material.unit}`}
                        {material.minimumQuantity > 0 && material.maximumQuantity > 0 && ' | '}
                        {material.maximumQuantity > 0 && `${t('max')}: ${material.maximumQuantity} ${material.unit}`}
                      </div>
                    ) : null}
                  </td>
                  <td className="text-right">
                    <span className="contract-rate">
                      {parseFloat(material.contractRate || 0).toFixed(3)} OMR
                    </span>
                  </td>
                  <td>
                    {selected ? (
                      <div className="quantity-input-wrapper">
                        <input
                          type="number"
                          className={`quantity-input ${quantityError ? 'invalid' : ''}`}
                          value={selected.quantity || ''}
                          onChange={(e) => handleQuantityChange(material.materialId, e.target.value)}
                          placeholder={t('enterQuantity')}
                          min={material.minimumQuantity || 0}
                          max={material.maximumQuantity || undefined}
                          disabled={disabled}
                        />
                        {quantityError && (
                          <div className="validation-error">{quantityError}</div>
                        )}
                      </div>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                  <td>{material.unit}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default MaterialSelector;
