import React, { useState, useEffect } from 'react';
import { Package, CheckCircle, AlertCircle, FileText, Truck, Calendar, AlertTriangle, Edit3, Plus, Trash2, Loader } from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import { collectionOrderService } from '../../services/collectionService';
import materialService from '../../services/materialService';
import LoadingSpinner from '../LoadingSpinner';
import Modal from '../ui/Modal';
import './WCNFinalizationModal.css';

const WCNFinalizationModal = ({ collectionOrder, isOpen, onClose, onSuccess }) => {
  const { t } = useLocalization();
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState('');
  const [wcnDate, setWcnDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState([]);
  const [compositePreview, setCompositePreview] = useState([]);
  const [hasQuantityChanges, setHasQuantityChanges] = useState(false);
  const [hasQualityChanges, setHasQualityChanges] = useState(false);

  // State for adding new materials
  const [availableMaterials, setAvailableMaterials] = useState([]);
  const [showAddMaterial, setShowAddMaterial] = useState(false);
  const [newMaterial, setNewMaterial] = useState({
    materialId: '',
    quantity: '',
    rate: ''
  });

  // Progress indicator state for finalization steps
  const [finalizationStep, setFinalizationStep] = useState(0);
  const [finalizationMessage, setFinalizationMessage] = useState('');
  const finalizationSteps = [
    { label: 'Validating', description: 'Checking quantities...' },
    { label: 'Preparing', description: 'Preparing WCN data...' },
    { label: 'Finalizing', description: 'Finalizing WCN & updating inventory...' },
    { label: 'Generating PO', description: 'Creating purchase order...' },
    { label: 'Complete', description: 'Done!' }
  ];

  useEffect(() => {
    if (isOpen && collectionOrder) {
      loadCollectionItems();
      loadAvailableMaterials();
    }
  }, [isOpen, collectionOrder]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setFinalizationStep(0);
      setFinalizationMessage('');
      setShowAddMaterial(false);
      setNewMaterial({ materialId: '', quantity: '', rate: '' });
    }
  }, [isOpen]);

  const loadCollectionItems = async () => {
    try {
      setLoading(true);
      setError('');
      setHasQuantityChanges(false);
      setHasQualityChanges(false);

      // Get collection order details with items
      const response = await collectionOrderService.getCollectionOrder(collectionOrder.id);

      if (response.success) {
        const orderData = response.data || response;
        // Store original quantities and quality for comparison
        const itemsWithVerification = (orderData.items || []).map(item => ({
          ...item,
          originalQuantity: item.availableQuantity || item.collectedQuantity || 0,
          verifiedQuantity: item.collectedQuantity || item.availableQuantity || 0,
          // Quality verification fields
          expectedQualityGrade: item.qualityGrade || 'A',
          verifiedQualityGrade: item.qualityGrade || 'A',
          qualityVerified: item.qualityVerified || false,
          expectedCondition: item.materialCondition || 'good',
          actualCondition: item.materialCondition || 'good',
          isNewItem: false // Mark existing items
        }));
        setItems(itemsWithVerification);

        // Check for composite materials and build preview
        await buildCompositePreview(itemsWithVerification);
      } else {
        setError(response.error || 'Failed to load collection items');
      }
    } catch (err) {
      console.error('Error loading collection items:', err);
      setError('Failed to load collection items');
    } finally {
      setLoading(false);
    }
  };

  // Load all available materials for adding new ones
  const loadAvailableMaterials = async () => {
    try {
      const response = await materialService.getAll();
      if (response.success) {
        setAvailableMaterials(response.data || []);
      }
    } catch (err) {
      console.error('Error loading materials:', err);
    }
  };

  // Handle adding a new material to the collection
  const handleAddMaterial = () => {
    if (!newMaterial.materialId || !newMaterial.quantity) {
      setError('Please select a material and enter a quantity');
      return;
    }

    const material = availableMaterials.find(m => m.id === parseInt(newMaterial.materialId));
    if (!material) {
      setError('Selected material not found');
      return;
    }

    // Check if material already exists in items
    const existingItem = items.find(item => item.materialId === parseInt(newMaterial.materialId));
    if (existingItem) {
      setError(`${material.name} is already in the collection. Edit the existing quantity instead.`);
      return;
    }

    const newItem = {
      id: null, // null indicates new item not in original collection
      materialId: parseInt(newMaterial.materialId),
      materialName: material.name,
      materialCode: material.code,
      unit: material.unit || 'KG',
      originalQuantity: 0, // New items have 0 original quantity
      verifiedQuantity: parseFloat(newMaterial.quantity),
      agreedRate: parseFloat(newMaterial.rate) || 0,
      isNewItem: true, // Flag to identify newly added items
      // Quality verification defaults for new items
      expectedQualityGrade: null, // No expected grade for new items
      verifiedQualityGrade: 'A', // Default to A
      qualityVerified: false,
      expectedCondition: null,
      actualCondition: 'good'
    };

    setItems(prev => [...prev, newItem]);
    setHasQuantityChanges(true);
    setShowAddMaterial(false);
    setNewMaterial({ materialId: '', quantity: '', rate: '' });
    setError('');

    // Update composite preview with new items
    buildCompositePreview([...items, newItem]);
  };

  // Handle removing a newly added material
  const handleRemoveNewItem = (index) => {
    const item = items[index];
    if (!item.isNewItem) return; // Can only remove newly added items

    setItems(prev => prev.filter((_, i) => i !== index));

    // Check if any changes remain
    const remainingItems = items.filter((_, i) => i !== index);
    const changed = remainingItems.some(item =>
      item.verifiedQuantity !== item.originalQuantity || item.isNewItem
    );
    setHasQuantityChanges(changed);
  };

  // Handle quantity change for verification
  const handleQuantityChange = (index, newQuantity) => {
    const quantity = parseFloat(newQuantity) || 0;

    setItems(prevItems => {
      const updatedItems = prevItems.map((item, i) => {
        if (i === index) {
          return { ...item, verifiedQuantity: quantity };
        }
        return item;
      });

      // Check if any quantities have changed from original
      const changed = updatedItems.some(item =>
        item.verifiedQuantity !== item.originalQuantity
      );
      setHasQuantityChanges(changed);

      // Update composite preview with new quantities
      buildCompositePreview(updatedItems);

      return updatedItems;
    });
  };

  // Handle quality grade change for verification
  const handleQualityGradeChange = (index, newGrade) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map((item, i) => {
        if (i === index) {
          return {
            ...item,
            verifiedQualityGrade: newGrade,
            qualityVerified: true // Auto-mark as verified when grade is changed
          };
        }
        return item;
      });

      // Check if any quality grades have changed from expected
      const changed = updatedItems.some(item =>
        item.verifiedQualityGrade !== item.expectedQualityGrade
      );
      setHasQualityChanges(changed);

      return updatedItems;
    });
  };

  // Handle quality verification checkbox toggle
  const handleQualityVerifiedToggle = (index) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map((item, i) => {
        if (i === index) {
          return { ...item, qualityVerified: !item.qualityVerified };
        }
        return item;
      });
      return updatedItems;
    });
  };

  // Handle condition change
  const handleConditionChange = (index, newCondition) => {
    setItems(prevItems => {
      const updatedItems = prevItems.map((item, i) => {
        if (i === index) {
          return { ...item, actualCondition: newCondition };
        }
        return item;
      });
      return updatedItems;
    });
  };

  // Quality grade options
  const qualityGrades = ['A', 'B', 'C', 'Reject'];
  const conditionOptions = ['excellent', 'good', 'fair', 'poor', 'mixed'];

  // Get quality badge color
  const getQualityBadgeClass = (grade) => {
    switch (grade) {
      case 'A': return 'quality-a';
      case 'B': return 'quality-b';
      case 'C': return 'quality-c';
      case 'Reject': return 'quality-reject';
      default: return '';
    }
  };

  const buildCompositePreview = async (collectionItems) => {
    try {
      const preview = [];

      for (const item of collectionItems) {
        // Use verifiedQuantity for preview (falls back to collectedQuantity)
        const quantity = item.verifiedQuantity ?? item.collectedQuantity ?? 0;

        // Check if material is composite
        const materialResponse = await materialService.getById(item.materialId);

        if (materialResponse.success) {
          const material = materialResponse.data || materialResponse;

          if (material.is_composite) {
            // Get composite breakdown
            const compositionResponse = await materialService.getCompositions(item.materialId);

            if (compositionResponse.success) {
              const compositions = compositionResponse.data || [];

              preview.push({
                compositeMaterial: item.materialName,
                quantity: quantity,
                components: compositions.map(comp => ({
                  name: comp.component_material_name,
                  type: comp.component_type,
                  quantity: comp.component_type === 'container'
                    ? quantity
                    : quantity, // Will be refined with actual content quantity
                  unit: comp.capacity_unit
                }))
              });
            }
          }
        }
      }

      setCompositePreview(preview);
    } catch (err) {
      console.error('Error building composite preview:', err);
      // Non-critical error, continue without preview
    }
  };

  const handleFinalize = async () => {
    try {
      setProcessing(true);
      setError('');

      // Step 1: Validate
      setFinalizationStep(1);
      setFinalizationMessage('Validating collected quantities...');
      await new Promise(r => setTimeout(r, 400)); // Small delay for visual feedback

      const invalidItems = items.filter(item => item.verifiedQuantity < 0);
      if (invalidItems.length > 0) {
        setError('Verified quantities cannot be negative');
        setFinalizationStep(0);
        setProcessing(false);
        return;
      }

      // Validate new items have rates
      const newItemsWithoutRate = items.filter(item => item.isNewItem && !item.agreedRate);
      if (newItemsWithoutRate.length > 0) {
        setError('Please enter a rate for all newly added materials');
        setFinalizationStep(0);
        setProcessing(false);
        return;
      }

      // Step 2: Prepare data
      setFinalizationStep(2);
      setFinalizationMessage('Preparing WCN data...');
      await new Promise(r => setTimeout(r, 300));

      // Prepare WCN data with verified quantities and quality
      const wcnData = {
        wcnDate: wcnDate,
        notes: notes,
        // Include verified quantities and quality for each item (existing and new)
        items: items.map(item => ({
          id: item.id, // null for new items
          materialId: item.materialId,
          materialName: item.materialName, // For logging new materials
          verifiedQuantity: item.verifiedQuantity,
          originalQuantity: item.originalQuantity,
          unit: item.unit,
          agreedRate: item.agreedRate || item.contractRate || 0,
          isNewItem: item.isNewItem || false, // Flag for backend to handle new materials
          // Quality verification fields
          expectedQualityGrade: item.expectedQualityGrade,
          verifiedQualityGrade: item.verifiedQualityGrade,
          qualityVerified: item.qualityVerified || false,
          actualCondition: item.actualCondition
        }))
      };

      // DEBUG: Log the WCN data being sent
      console.log('=== WCN FINALIZATION DEBUG ===');
      console.log('Collection Order ID:', collectionOrder.id);
      console.log('Items state before mapping:', items);
      console.log('WCN Data being sent:', JSON.stringify(wcnData, null, 2));
      console.log('Items with quantities:', wcnData.items.map(i => ({
        materialId: i.materialId,
        materialName: i.materialName,
        verifiedQuantity: i.verifiedQuantity,
        verifiedQuantityType: typeof i.verifiedQuantity,
        isNewItem: i.isNewItem
      })));
      console.log('=== END DEBUG ===');

      // Step 3: Finalize WCN
      setFinalizationStep(3);
      setFinalizationMessage('Finalizing WCN and updating inventory...');

      const response = await collectionOrderService.finalizeWCN(collectionOrder.id, wcnData);

      if (response.success) {
        // Step 4: Generating PO (already done by backend, but show progress)
        setFinalizationStep(4);
        setFinalizationMessage('Purchase order generated...');
        await new Promise(r => setTimeout(r, 400));

        // Step 5: Complete
        setFinalizationStep(5);
        const newItemsAdded = response.data?.newItemsAdded || 0;
        setFinalizationMessage(
          newItemsAdded > 0
            ? `WCN finalized! ${newItemsAdded} new material(s) added.`
            : 'WCN finalized successfully!'
        );

        // Show success briefly before closing
        await new Promise(r => setTimeout(r, 800));

        if (onSuccess) {
          onSuccess(response.data);
        }
        onClose();
      } else {
        // Keep progress visible briefly on error so user sees where it failed
        setFinalizationMessage('Error occurred');
        await new Promise(r => setTimeout(r, 500));
        setFinalizationStep(0);
        setError(response.error || 'Failed to finalize WCN');
      }
    } catch (err) {
      console.error('Error finalizing WCN:', err);
      setFinalizationMessage('Error occurred');
      await new Promise(r => setTimeout(r, 500));
      setFinalizationStep(0);
      setError(err.message || 'Network error. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (!collectionOrder) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Finalize WCN (Waste Consignment Note)"
      size="large"
    >
      <div className="wcn-finalization-modal">
        {loading ? (
          <div className="loading-container">
            <LoadingSpinner />
            <p>Loading collection details...</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="alert alert-error">
                <AlertCircle size={20} />
                <span>{error}</span>
              </div>
            )}

            {/* Progress Indicator - Shows during finalization */}
            {processing && finalizationStep > 0 && (
              <div className="wcn-progress-indicator">
                <div className="progress-header">
                  <Loader size={20} className="spinner" />
                  <span>Finalizing WCN...</span>
                </div>
                <div className="progress-steps">
                  {finalizationSteps.map((step, index) => {
                    const stepNum = index + 1;
                    const isCompleted = finalizationStep > stepNum;
                    const isActive = finalizationStep === stepNum;

                    return (
                      <div
                        key={index}
                        className={`progress-step ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                      >
                        <div className="step-circle">
                          {isCompleted ? (
                            <CheckCircle size={16} />
                          ) : (
                            <span>{stepNum}</span>
                          )}
                        </div>
                        <div className="step-label">{step.label}</div>
                      </div>
                    );
                  })}
                </div>
                <div className="progress-message">
                  {finalizationMessage}
                </div>
              </div>
            )}

            {/* Collection Order Info */}
            <div className="wcn-section">
              <h3 className="section-title">
                <Truck size={20} />
                Collection Order Details
              </h3>
              <div className="info-grid">
                <div className="info-item">
                  <label>Order Number:</label>
                  <strong>{collectionOrder.orderNumber}</strong>
                </div>
                <div className="info-item">
                  <label>Supplier:</label>
                  <span>{collectionOrder.supplierName}</span>
                </div>
                <div className="info-item">
                  <label>Collection Date:</label>
                  <span>{new Date(collectionOrder.scheduledDate).toLocaleDateString()}</span>
                </div>
                <div className="info-item">
                  <label>Status:</label>
                  <span className={`status-badge ${collectionOrder.status}`}>
                    {collectionOrder.status}
                  </span>
                </div>
              </div>
            </div>

            {/* WCN Details Form */}
            <div className="wcn-section">
              <h3 className="section-title">
                <FileText size={20} />
                WCN Details
              </h3>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="wcnDate">
                    <Calendar size={16} />
                    WCN Date *
                  </label>
                  <input
                    type="date"
                    id="wcnDate"
                    value={wcnDate}
                    onChange={(e) => setWcnDate(e.target.value)}
                    max={new Date().toISOString().split('T')[0]}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label htmlFor="notes">Notes (Optional)</label>
                  <textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Add any notes about this collection..."
                  />
                </div>
              </div>
            </div>

            {/* Collection Items - Editable Verification */}
            <div className="wcn-section">
              <div className="section-header-with-action">
                <h3 className="section-title">
                  <Package size={20} />
                  {t('verifyMaterials', 'Verify Collected Materials')} ({items.length})
                  {hasQuantityChanges && (
                    <span className="quantity-changed-badge">
                      <Edit3 size={14} />
                      {t('quantityModified', 'Qty Modified')}
                    </span>
                  )}
                  {hasQualityChanges && (
                    <span className="quality-changed-badge">
                      <AlertCircle size={14} />
                      {t('qualityModified', 'Grade Modified')}
                    </span>
                  )}
                </h3>
                {!processing && (
                  <button
                    type="button"
                    className="btn btn-outline btn-sm add-material-btn"
                    onClick={() => setShowAddMaterial(!showAddMaterial)}
                  >
                    <Plus size={16} />
                    Add Material
                  </button>
                )}
              </div>
              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                <AlertCircle size={18} />
                <span>
                  Review and verify the collected quantities. You can also add materials that were collected but not in the original callout.
                </span>
              </div>

              {/* Add New Material Form */}
              {showAddMaterial && (
                <div className="add-material-form">
                  <h4>Add New Material</h4>
                  <div className="add-material-grid">
                    <div className="form-group">
                      <label>Material *</label>
                      <select
                        value={newMaterial.materialId}
                        onChange={(e) => setNewMaterial({ ...newMaterial, materialId: e.target.value })}
                      >
                        <option value="">Select a material...</option>
                        {availableMaterials
                          .filter(m => !items.some(i => i.materialId === m.id))
                          .map(material => (
                            <option key={material.id} value={material.id}>
                              {material.name} {material.code ? `(${material.code})` : ''}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>Quantity *</label>
                      <input
                        type="number"
                        value={newMaterial.quantity}
                        onChange={(e) => setNewMaterial({ ...newMaterial, quantity: e.target.value })}
                        placeholder="0.000"
                        min="0.001"
                        step="0.001"
                      />
                    </div>
                    <div className="form-group">
                      <label>Rate (OMR) *</label>
                      <input
                        type="number"
                        value={newMaterial.rate}
                        onChange={(e) => setNewMaterial({ ...newMaterial, rate: e.target.value })}
                        placeholder="0.000"
                        min="0"
                        step="0.001"
                      />
                    </div>
                    <div className="form-group form-actions-inline">
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={handleAddMaterial}
                        disabled={!newMaterial.materialId || !newMaterial.quantity}
                      >
                        <Plus size={14} />
                        Add
                      </button>
                      <button
                        type="button"
                        className="btn btn-secondary btn-sm"
                        onClick={() => {
                          setShowAddMaterial(false);
                          setNewMaterial({ materialId: '', quantity: '', rate: '' });
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="items-table-container">
                <table className="items-table wcn-verification-table">
                  <thead>
                    <tr>
                      <th>Material</th>
                      <th className="text-center">Expected Qty</th>
                      <th className="text-center">Verified Qty</th>
                      <th>Unit</th>
                      <th className="text-center">Expected Grade</th>
                      <th className="text-center">Verified Grade</th>
                      <th className="text-center">Quality ✓</th>
                      <th className="text-right">Rate</th>
                      <th className="text-right">Amount</th>
                      <th className="text-center" style={{ width: '50px' }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const hasQtyChanged = item.verifiedQuantity !== item.originalQuantity || item.isNewItem;
                      const hasGradeChanged = item.verifiedQualityGrade !== item.expectedQualityGrade;
                      const rate = parseFloat(item.agreedRate || item.contractRate || 0);
                      const amount = item.verifiedQuantity * rate;

                      return (
                        <tr key={index} className={`${hasQtyChanged ? 'quantity-modified' : ''} ${hasGradeChanged ? 'quality-modified' : ''} ${item.isNewItem ? 'new-item-row' : ''}`}>
                          <td>
                            <strong>{item.materialName}</strong>
                            {item.materialCode && <small> ({item.materialCode})</small>}
                            {item.isNewItem && (
                              <span className="new-item-badge">NEW</span>
                            )}
                          </td>
                          <td className="text-center expected-qty">
                            {item.isNewItem ? '-' : item.originalQuantity}
                          </td>
                          <td className="text-center">
                            <input
                              type="number"
                              className={`quantity-input ${hasQtyChanged ? 'changed' : ''}`}
                              value={item.verifiedQuantity}
                              onChange={(e) => handleQuantityChange(index, e.target.value)}
                              min="0"
                              step="0.001"
                              disabled={processing}
                            />
                            {hasQtyChanged && !item.isNewItem && (
                              <span className={`quantity-diff ${item.verifiedQuantity > item.originalQuantity ? 'increase' : 'decrease'}`}>
                                {item.verifiedQuantity > item.originalQuantity ? '+' : ''}
                                {(item.verifiedQuantity - item.originalQuantity).toFixed(3)}
                              </span>
                            )}
                          </td>
                          <td>{item.unit || 'KG'}</td>
                          <td className="text-center">
                            {item.isNewItem ? (
                              <span className="no-expected">-</span>
                            ) : (
                              <span className={`quality-badge ${getQualityBadgeClass(item.expectedQualityGrade)}`}>
                                {item.expectedQualityGrade}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <select
                              className={`quality-select ${hasGradeChanged ? 'changed' : ''}`}
                              value={item.verifiedQualityGrade}
                              onChange={(e) => handleQualityGradeChange(index, e.target.value)}
                              disabled={processing}
                            >
                              {qualityGrades.map(grade => (
                                <option key={grade} value={grade}>{grade}</option>
                              ))}
                            </select>
                            {hasGradeChanged && !item.isNewItem && (
                              <span className="quality-change-indicator">
                                {item.expectedQualityGrade} → {item.verifiedQualityGrade}
                              </span>
                            )}
                          </td>
                          <td className="text-center">
                            <input
                              type="checkbox"
                              className="quality-verified-checkbox"
                              checked={item.qualityVerified || false}
                              onChange={() => handleQualityVerifiedToggle(index)}
                              disabled={processing}
                              title={item.qualityVerified ? t('qualityVerified', 'Quality Verified') : t('verifyQuality', 'Click to verify quality')}
                            />
                          </td>
                          <td className="text-right">
                            OMR {rate.toFixed(3)}
                          </td>
                          <td className="text-right">
                            <strong className={hasQtyChanged ? 'amount-changed' : ''}>
                              OMR {amount.toFixed(2)}
                            </strong>
                          </td>
                          <td className="text-center">
                            {item.isNewItem && (
                              <button
                                type="button"
                                className="btn-remove-item"
                                onClick={() => handleRemoveNewItem(index)}
                                title="Remove this material"
                                disabled={processing}
                              >
                                <Trash2 size={14} />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr>
                      <td colSpan="8" className="text-right"><strong>Total Value:</strong></td>
                      <td className="text-right">
                        <strong className="total-amount">
                          OMR {items.reduce((sum, item) =>
                            sum + (item.verifiedQuantity * parseFloat(item.agreedRate || item.contractRate || 0)), 0
                          ).toFixed(2)}
                        </strong>
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Composite Material Preview */}
            {compositePreview.length > 0 && (
              <div className="wcn-section composite-preview">
                <h3 className="section-title">
                  <AlertTriangle size={20} />
                  Composite Material Auto-Split Preview
                </h3>
                <div className="alert alert-info">
                  <AlertCircle size={18} />
                  <span>
                    The following composite materials will be automatically split into components during finalization:
                  </span>
                </div>
                {compositePreview.map((comp, index) => (
                  <div key={index} className="composite-item">
                    <div className="composite-header">
                      <strong>{comp.compositeMaterial}</strong>
                      <span className="composite-qty">{comp.quantity} units</span>
                    </div>
                    <div className="composite-components">
                      <p className="components-label">Will be split into:</p>
                      <ul>
                        {comp.components.map((component, idx) => (
                          <li key={idx}>
                            <span className="component-name">{component.name}</span>
                            <span className="component-type">({component.type})</span>
                            <span className="component-qty">
                              {component.quantity} {component.unit}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* What Happens Next */}
            <div className="wcn-section what-happens">
              <h3 className="section-title">
                <CheckCircle size={20} />
                What Happens When You Finalize
              </h3>
              <ol className="steps-list">
                <li>
                  <strong>WCN Number Generated:</strong> A unique WCN number will be created (e.g., WCN-2025-0001)
                </li>
                <li>
                  <strong>Inventory Updated:</strong> All collected materials will be added to inventory
                  {compositePreview.length > 0 && (
                    <span className="sub-step">
                      {' '}(Composite materials will be automatically split into components)
                    </span>
                  )}
                </li>
                <li>
                  <strong>Purchase Order Auto-Generated:</strong> A PO will be created automatically with status "received"
                </li>
                <li>
                  <strong>Collection Finalized:</strong> This collection order will be marked as finalized and locked
                </li>
              </ol>
              <div className="alert alert-warning">
                <AlertTriangle size={18} />
                <span>
                  <strong>Important:</strong> Once finalized, you cannot undo this action.
                  However, you can use WCN Rectification to adjust quantities if needed.
                </span>
              </div>
            </div>

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
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleFinalize}
                disabled={processing || !wcnDate}
              >
                {processing ? (
                  <>
                    <LoadingSpinner size="small" />
                    Finalizing WCN...
                  </>
                ) : (
                  <>
                    <CheckCircle size={18} />
                    Finalize WCN & Generate PO
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

export default WCNFinalizationModal;
