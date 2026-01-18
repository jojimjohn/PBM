import React, { useState, useEffect } from 'react';
import { Edit3, AlertTriangle, CheckCircle, AlertCircle, TrendingUp, TrendingDown, Package } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { useSystemSettings } from '../../context/SystemSettingsContext';
import { collectionOrderService } from '../../services/collectionService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
// CSS moved to global index.css Tailwind

const WCNRectificationModal = ({ collectionOrder, isOpen, onClose, onSuccess }) => {
  const { t } = useLocalization();
  const { formatDate } = useSystemSettings();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [inventoryImpact, setInventoryImpact] = useState([]);
  const [showImpactPreview, setShowImpactPreview] = useState(false);

  useEffect(() => {
    if (isOpen && collectionOrder) {
      loadWCNItems();
    }
  }, [isOpen, collectionOrder]);

  const loadWCNItems = async () => {
    try {
      setLoading(true);
      setError('');

      // Get collection order details with items
      const response = await collectionOrderService.getCollectionOrder(collectionOrder.id);

      if (response.success) {
        const orderData = response.data || response;

        const collectionItems = orderData.items || [];
        setItems(collectionItems);

        // Initialize adjustments with both original WCN quantity and current quantity
        // original_collected_quantity = quantity when WCN was first finalized
        // collectedQuantity = current quantity (after any previous rectifications)
        setAdjustments(
          collectionItems.map(item => ({
            itemId: item.id,
            materialName: item.materialName,
            materialCode: item.materialCode,
            // Original WCN quantity (from finalization, never changes after rectification)
            originalWcnQuantity: parseFloat(item.original_collected_quantity || item.collectedQuantity || 0),
            // Current quantity (may have been rectified since finalization)
            currentQuantity: parseFloat(item.collectedQuantity || 0),
            // For legacy support - use originalQuantity as alias for currentQuantity in validation
            originalQuantity: parseFloat(item.collectedQuantity || 0),
            newQuantity: parseFloat(item.collectedQuantity || 0),
            reason: '',
            unit: item.unit || 'KG'
          }))
        );
      } else {
        setError(response.error || 'Failed to load WCN items');
      }
    } catch (err) {
      console.error('Error loading WCN items:', err);
      setError('Failed to load WCN items');
    } finally {
      setLoading(false);
    }
  };

  const handleQuantityChange = (itemId, newQuantity) => {
    setAdjustments(prev =>
      prev.map(adj =>
        adj.itemId === itemId
          ? { ...adj, newQuantity: parseFloat(newQuantity) || 0 }
          : adj
      )
    );
    setShowImpactPreview(false); // Reset preview when quantities change
  };

  const handleReasonChange = (itemId, reason) => {
    setAdjustments(prev =>
      prev.map(adj =>
        adj.itemId === itemId
          ? { ...adj, reason }
          : adj
      )
    );
  };

  const getChangedAdjustments = () => {
    return adjustments.filter(adj => adj.newQuantity !== adj.currentQuantity);
  };

  const validateAdjustments = () => {
    const changed = getChangedAdjustments();

    if (changed.length === 0) {
      setError('No changes detected. Please adjust at least one quantity.');
      return false;
    }

    for (const adj of changed) {
      if (!adj.reason || adj.reason.trim().length < 10) {
        setError(`Please provide a detailed reason (min 10 characters) for ${adj.materialName}`);
        return false;
      }

      if (adj.newQuantity < 0) {
        setError(`Quantity cannot be negative for ${adj.materialName}`);
        return false;
      }
    }

    return true;
  };

  const handlePreviewImpact = async () => {
    if (!validateAdjustments()) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const changed = getChangedAdjustments();

      const rectificationData = {
        itemAdjustments: changed.map(adj => ({
          itemId: adj.itemId,
          newQuantity: adj.newQuantity,
          reason: adj.reason
        })),
        notes: notes
      };

      // Note: This is a preview call - backend should support a preview mode
      // For now, we'll calculate impact on frontend
      const impacts = changed.map(adj => {
        const diff = adj.newQuantity - adj.currentQuantity;
        return {
          materialName: adj.materialName,
          materialCode: adj.materialCode,
          originalWcnQuantity: adj.originalWcnQuantity,
          currentQuantity: adj.currentQuantity,
          newQuantity: adj.newQuantity,
          adjustment: diff,
          adjustmentType: diff > 0 ? 'increase' : 'decrease',
          reason: adj.reason,
          unit: adj.unit
        };
      });

      setInventoryImpact(impacts);
      setShowImpactPreview(true);
    } catch (err) {
      console.error('Error previewing impact:', err);
      setError('Failed to preview inventory impact');
    } finally {
      setProcessing(false);
    }
  };

  const handleSubmitRectification = async () => {
    if (!validateAdjustments()) {
      return;
    }

    try {
      setProcessing(true);
      setError('');

      const changed = getChangedAdjustments();

      const rectificationData = {
        itemAdjustments: changed.map(adj => ({
          itemId: adj.itemId,
          newQuantity: adj.newQuantity,
          reason: adj.reason
        })),
        notes: notes
      };

      const response = await collectionOrderService.rectifyWCN(collectionOrder.id, rectificationData);

      if (response.success) {
        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        setError(response.error || 'Failed to rectify WCN');
      }
    } catch (err) {
      console.error('Error rectifying WCN:', err);
      setError('Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!collectionOrder) return null;

  const changedCount = getChangedAdjustments().length;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="WCN Rectification - Adjust Quantities"
      size="large"
    >
      <div className="wcn-rectification-modal">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading WCN details...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* WCN Info */}
            <div className="wcn-section">
              <h3 className="section-title">
                <Package size={20} />
                WCN Information
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>WCN Number:</label>
                  <strong>{collectionOrder.wcn_number || 'N/A'}</strong>
                </div>
                <div className="info-item">
                  <label>Order Number:</label>
                  <span>{collectionOrder.orderNumber}</span>
                </div>
                <div className="info-item">
                  <label>Finalized Date:</label>
                  <span>
                    {collectionOrder.finalized_at
                      ? formatDate(collectionOrder.finalized_at)
                      : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Rectification Count:</label>
                  <span className="rectification-badge">
                    {collectionOrder.rectification_count || 0} times
                  </span>
                </div>
              </div>
            </div>

            {/* Important Notice */}
            <div className="alert alert-warning">
              <AlertTriangle size={20} />
              <div>
                <strong>Important:</strong> WCN rectification allows you to adjust quantities after finalization.
                This will directly impact inventory levels. All changes must include a detailed reason.
              </div>
            </div>

            {/* Adjustment Form */}
            <div className="wcn-section">
              <h3 className="section-title">
                <Edit3 size={20} />
                Adjust Quantities {changedCount > 0 && `(${changedCount} changed)`}
              </h3>
              <div className="adjustments-container">
                {adjustments.map((adj, index) => {
                  const hasChanged = adj.newQuantity !== adj.currentQuantity;
                  const diffFromCurrent = adj.newQuantity - adj.currentQuantity;
                  const diffFromOriginal = adj.newQuantity - adj.originalWcnQuantity;
                  const wasRectifiedBefore = adj.currentQuantity !== adj.originalWcnQuantity;

                  return (
                    <div key={adj.itemId} className={`adjustment-item ${hasChanged ? 'changed' : ''}`}>
                      <div className="adjustment-header">
                        <div className="material-info">
                          <strong>{adj.materialName}</strong>
                          {adj.materialCode && <span className="material-code">({adj.materialCode})</span>}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          {wasRectifiedBefore && (
                            <span style={{
                              fontSize: '11px',
                              padding: '2px 8px',
                              borderRadius: '10px',
                              backgroundColor: 'var(--orange-100)',
                              color: 'var(--orange-700)'
                            }}>
                              Previously rectified
                            </span>
                          )}
                          {hasChanged && (
                            <div className="change-indicator">
                              {diffFromCurrent > 0 ? (
                                <span className="increase">
                                  <TrendingUp size={16} />
                                  +{diffFromCurrent.toFixed(3)} {adj.unit}
                                </span>
                              ) : (
                                <span className="decrease">
                                  <TrendingDown size={16} />
                                  {diffFromCurrent.toFixed(3)} {adj.unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="adjustment-controls">
                        <div className="quantity-inputs" style={{ display: 'grid', gridTemplateColumns: '1fr auto 1fr auto 1fr', gap: '12px', alignItems: 'end' }}>
                          {/* Original WCN Quantity - from initial finalization */}
                          <div className="quantity-field">
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--gray-600)', marginBottom: '4px' }}>
                              Original WCN Qty:
                            </label>
                            <input
                              type="number"
                              value={adj.originalWcnQuantity}
                              disabled
                              className="quantity-input disabled"
                              style={{ backgroundColor: 'var(--gray-100)', color: 'var(--gray-600)' }}
                            />
                            <span className="unit-label">{adj.unit}</span>
                          </div>

                          <div className="quantity-arrow" style={{ paddingBottom: '8px' }}>→</div>

                          {/* Current Quantity - after any previous rectifications */}
                          <div className="quantity-field">
                            <label style={{ display: 'block', fontSize: '12px', color: wasRectifiedBefore ? 'var(--orange-600)' : 'var(--gray-600)', marginBottom: '4px' }}>
                              Current Qty{wasRectifiedBefore ? ' (rectified)' : ''}:
                            </label>
                            <input
                              type="number"
                              value={adj.currentQuantity}
                              disabled
                              className="quantity-input disabled"
                              style={{ backgroundColor: wasRectifiedBefore ? 'var(--orange-50)' : 'var(--gray-100)', borderColor: wasRectifiedBefore ? 'var(--orange-300)' : undefined }}
                            />
                            <span className="unit-label">{adj.unit}</span>
                          </div>

                          <div className="quantity-arrow" style={{ paddingBottom: '8px' }}>→</div>

                          {/* New Quantity - editable */}
                          <div className="quantity-field">
                            <label style={{ display: 'block', fontSize: '12px', color: 'var(--primary-600)', marginBottom: '4px', fontWeight: '600' }}>
                              New Quantity:
                            </label>
                            <input
                              type="number"
                              value={adj.newQuantity}
                              onChange={(e) => handleQuantityChange(adj.itemId, e.target.value)}
                              min="0"
                              step="0.001"
                              className={`quantity-input ${hasChanged ? 'changed' : ''}`}
                            />
                            <span className="unit-label">{adj.unit}</span>
                          </div>
                        </div>

                        {/* Show summary of changes from original */}
                        {hasChanged && diffFromOriginal !== 0 && (
                          <div style={{
                            marginTop: '8px',
                            padding: '8px 12px',
                            backgroundColor: 'var(--blue-50)',
                            borderRadius: '6px',
                            fontSize: '12px',
                            color: 'var(--blue-700)'
                          }}>
                            <strong>Net change from original WCN:</strong>{' '}
                            <span style={{ color: diffFromOriginal > 0 ? 'var(--green-600)' : 'var(--red-600)', fontWeight: '600' }}>
                              {diffFromOriginal > 0 ? '+' : ''}{diffFromOriginal.toFixed(3)} {adj.unit}
                            </span>
                          </div>
                        )}

                        {hasChanged && (
                          <div className="reason-field">
                            <label>
                              Reason for Adjustment: *
                              <span className="char-count">
                                {adj.reason.length}/10 min
                              </span>
                            </label>
                            <textarea
                              value={adj.reason}
                              onChange={(e) => handleReasonChange(adj.itemId, e.target.value)}
                              placeholder="Explain why this quantity needs to be adjusted (min 10 characters)..."
                              rows={2}
                              className={adj.reason.length < 10 ? 'invalid' : 'valid'}
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* General Notes */}
            <div className="wcn-section">
              <div className="form-group">
                <label htmlFor="notes">General Notes (Optional)</label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={3}
                  placeholder="Add any additional notes about this rectification..."
                />
              </div>
            </div>

            {/* Inventory Impact Preview */}
            {showImpactPreview && inventoryImpact.length > 0 && (
              <div className="wcn-section impact-preview">
                <h3 className="section-title">
                  <AlertTriangle size={20} />
                  Inventory Impact Preview
                </h3>
                <div className="alert alert-info">
                  <AlertCircle size={18} />
                  <span>Review the inventory changes before confirming rectification:</span>
                </div>
                <div className="impact-table-container">
                  <table className="impact-table">
                    <thead>
                      <tr>
                        <th>Material</th>
                        <th style={{ fontSize: '11px' }}>Original WCN</th>
                        <th style={{ fontSize: '11px' }}>Current Qty</th>
                        <th>Adjustment</th>
                        <th style={{ fontSize: '11px' }}>New Qty</th>
                        <th>Reason</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryImpact.map((impact, index) => (
                        <tr key={index}>
                          <td>
                            <strong>{impact.materialName}</strong>
                            {impact.materialCode && <small> ({impact.materialCode})</small>}
                          </td>
                          <td className="text-right" style={{ color: 'var(--gray-500)', fontSize: '12px' }}>
                            {impact.originalWcnQuantity} {impact.unit}
                          </td>
                          <td className="text-right">{impact.currentQuantity} {impact.unit}</td>
                          <td className="text-center">
                            <span className={`adjustment-badge ${impact.adjustmentType}`}>
                              {impact.adjustment > 0 ? '+' : ''}
                              {impact.adjustment.toFixed(3)} {impact.unit}
                            </span>
                          </td>
                          <td className="text-right">
                            <strong>{impact.newQuantity} {impact.unit}</strong>
                          </td>
                          <td>
                            <small>{impact.reason}</small>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={processing}
              >
                Cancel
              </button>

              {!showImpactPreview && changedCount > 0 && (
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={handlePreviewImpact}
                  disabled={processing}
                >
                  <AlertTriangle size={18} />
                  Preview Impact
                </button>
              )}

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleSubmitRectification}
                disabled={processing || changedCount === 0}
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="small" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Confirm Rectification ({changedCount})
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};

export default WCNRectificationModal;
