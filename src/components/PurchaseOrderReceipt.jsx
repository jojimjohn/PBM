import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLocalization } from '../context/LocalizationContext';
import { useSystemSettings } from '../context/SystemSettingsContext';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Input } from './ui/Input';
import { Plus, Package, AlertTriangle, CheckCircle, Truck, Warehouse, ClipboardCheck, X, Star, FileText, Camera, Shield } from 'lucide-react';
// CSS moved to global index.css Tailwind

const PurchaseOrderReceipt = ({ 
  purchaseOrder, 
  isOpen, 
  onClose, 
  onReceive,
  loading = false 
}) => {
  const { t } = useLocalization();
  const { formatCurrency, formatDate } = useSystemSettings();
  
  const [receivedItems, setReceivedItems] = useState([]);
  const [receiptNotes, setReceiptNotes] = useState('');
  const [errors, setErrors] = useState({});
  const [qualityChecks, setQualityChecks] = useState({});
  const [overallQualityRating, setOverallQualityRating] = useState(5);
  const [qualityNotes, setQualityNotes] = useState('');
  const [activeQualityItem, setActiveQualityItem] = useState(null);

  useEffect(() => {
    if (purchaseOrder && isOpen) {
      // Initialize received items from purchase order items
      const initialItems = purchaseOrder.items?.map(item => ({
        itemId: item.id,
        materialId: item.materialId,
        materialName: item.materialName,
        orderedQuantity: parseFloat(item.quantityOrdered || 0),
        receivedQuantity: parseFloat(item.quantityReceived || 0),
        unitPrice: parseFloat(item.unitPrice || 0),
        batchNumber: item.batchNumber || '',
        expiryDate: item.expiryDate || '',
        location: 'Main Warehouse',
        condition: 'used', // Default for oil business
        notes: '',
        qualityGrade: 'A', // A, B, C, Reject
        qualityIssues: [],
        qualityPhotos: [],
        certificateNumber: '',
        testResults: {}
      }));
      
      // Initialize quality checks for each item
      const qualityChecks = {};
      initialItems.forEach(item => {
        const qualityCheckId = `quality_${item.id}`;
        qualityChecks[qualityCheckId] = {
        visualInspection: { passed: true, notes: '' },
        packaging: { passed: true, notes: '' },
        labeling: { passed: true, notes: '' },
        documentation: { passed: true, notes: '' },
        quantity: { passed: true, notes: '' },
        contamination: { passed: true, notes: '' },
        color: { passed: true, notes: '' },
        viscosity: { passed: true, notes: '' },
        overallGrade: 'A',
        inspector: '',
        inspectionDate: new Date().toISOString().split('T')[0],
        passed: true
        };
      });
      
      setReceivedItems(initialItems);
      setReceiptNotes('');
      setErrors({});
      setQualityChecks(qualityChecks);
      setOverallQualityRating(5);
      setQualityNotes('');
      setActiveQualityItem(null);
    }
  }, [purchaseOrder, isOpen]);

  const handleQuantityChange = (itemId, quantity) => {
    setReceivedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, receivedQuantity: parseFloat(quantity) || 0 }
        : item
    ));
  };

  const handleBatchNumberChange = (itemId, batchNumber) => {
    setReceivedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, batchNumber }
        : item
    ));
  };

  const handleExpiryDateChange = (itemId, expiryDate) => {
    setReceivedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, expiryDate }
        : item
    ));
  };

  const handleLocationChange = (itemId, location) => {
    setReceivedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, location }
        : item
    ));
  };

  const handleConditionChange = (itemId, condition) => {
    setReceivedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, condition }
        : item
    ));
  };

  const handleQualityCheck = (itemId, checkType, passed, notes = '') => {
    const qualityId = `quality_${itemId}`;
    setQualityChecks(prev => ({
      ...prev,
      [qualityId]: {
        ...prev[qualityId],
        [checkType]: { passed, notes }
      }
    }));
  };

  const handleQualityGrade = (itemId, grade) => {
    const qualityId = `quality_${itemId}`;
    setQualityChecks(prev => ({
      ...prev,
      [qualityId]: {
        ...prev[qualityId],
        overallGrade: grade,
        passed: grade !== 'Reject'
      }
    }));
    
    setReceivedItems(prev => prev.map(item => 
      item.itemId === itemId 
        ? { ...item, qualityGrade: grade }
        : item
    ));
  };

  const openQualityModal = (itemId) => {
    setActiveQualityItem(itemId);
  };

  const closeQualityModal = () => {
    setActiveQualityItem(null);
  };

  const getQualityChecksPassed = (itemId) => {
    const qualityId = `quality_${itemId}`;
    const checks = qualityChecks[qualityId];
    if (!checks) return 0;
    
    const checkTypes = ['visualInspection', 'packaging', 'labeling', 'documentation', 'quantity', 'contamination', 'color', 'viscosity'];
    return checkTypes.filter(type => checks[type]?.passed).length;
  };

  const getTotalQualityChecks = () => 8; // Total number of quality checks per item

  const validateReceipt = () => {
    const newErrors = {};
    
    receivedItems.forEach((item, index) => {
      if (item.receivedQuantity <= 0) {
        newErrors[`quantity_${item.itemId}`] = 'Quantity must be greater than 0';
      }
      
      if (item.receivedQuantity > item.orderedQuantity) {
        newErrors[`quantity_${item.itemId}`] = 'Received quantity cannot exceed ordered quantity';
      }
      
      if (!item.batchNumber.trim()) {
        newErrors[`batch_${item.itemId}`] = 'Batch number is required';
      }
      
      if (!item.location.trim()) {
        newErrors[`location_${item.itemId}`] = 'Storage location is required';
      }
      
      // Quality check validation
      const qualityId = `quality_${item.itemId}`;
      const qualityCheck = qualityChecks[qualityId];
      if (qualityCheck && !qualityCheck.passed) {
        newErrors[`quality_${item.itemId}`] = 'Quality inspection must pass before receiving';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleReceive = async () => {
    if (!validateReceipt()) {
      return;
    }

    const receiptData = {
      receivedItems: receivedItems.filter(item => item.receivedQuantity > 0).map(item => ({
        ...item,
        qualityCheck: qualityChecks[`quality_${item.itemId}`]
      })),
      notes: receiptNotes,
      qualityInspection: {
        overallRating: overallQualityRating,
        notes: qualityNotes,
        inspector: 'Current User', // Should come from auth context
        inspectionDate: new Date().toISOString(),
        totalItemsInspected: receivedItems.filter(item => item.receivedQuantity > 0).length,
        itemsPassed: receivedItems.filter(item => {
          const qualityId = `quality_${item.itemId}`;
          return item.receivedQuantity > 0 && qualityChecks[qualityId]?.passed;
        }).length
      }
    };

    await onReceive(receiptData);
  };

  const getTotalReceivedValue = () => {
    return receivedItems.reduce((total, item) => 
      total + (item.receivedQuantity * item.unitPrice), 0
    );
  };

  if (!purchaseOrder) return null;

  return (
    <Modal 
      isOpen={isOpen} 
      onClose={onClose} 
      title={`Receive Purchase Order - ${purchaseOrder.orderNumber}`}
      size="xl"
    >
      <div className="purchase-receipt-container">
        {/* Order Summary */}
        <div className="receipt-header">
          <div className="order-info">
            <div className="info-item">
              <Truck className="info-icon" />
              <div>
                <span className="info-label">Supplier</span>
                <span className="info-value">{purchaseOrder.supplierName}</span>
              </div>
            </div>
            <div className="info-item">
              <Package className="info-icon" />
              <div>
                <span className="info-label">Order Date</span>
                <span className="info-value">{formatDate(purchaseOrder.orderDate)}</span>
              </div>
            </div>
            <div className="info-item">
              <Warehouse className="info-icon" />
              <div>
                <span className="info-label">Total Value</span>
                <span className="info-value">{formatCurrency(purchaseOrder.totalAmount)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Receipt Items */}
        <div className="receipt-items">
          <h3>Received Materials</h3>
          <div className="items-table">
            <div className="table-header">
              <div className="col-material">Material</div>
              <div className="col-ordered">Ordered</div>
              <div className="col-received">Received</div>
              <div className="col-batch">Batch #</div>
              <div className="col-expiry">Expiry</div>
              <div className="col-location">Location</div>
              <div className="col-condition">Condition</div>
              <div className="col-quality">Quality</div>
            </div>
            
            {receivedItems.map((item) => (
              <div key={item.itemId} className="table-row">
                <div className="col-material">
                  <div className="material-info">
                    <span className="material-name">{item.materialName}</span>
                    <span className="material-price">{formatCurrency(item.unitPrice)}/unit</span>
                  </div>
                </div>
                
                <div className="col-ordered">
                  <span className="quantity-badge">{item.orderedQuantity}</span>
                </div>
                
                <div className="col-received">
                  <Input
                    type="number"
                    value={item.receivedQuantity}
                    onChange={(e) => handleQuantityChange(item.itemId, e.target.value)}
                    min="0"
                    max={item.orderedQuantity}
                    step="0.001"
                    placeholder="0.000"
                    error={errors[`quantity_${item.itemId}`]}
                  />
                </div>
                
                <div className="col-batch">
                  <Input
                    type="text"
                    value={item.batchNumber}
                    onChange={(e) => handleBatchNumberChange(item.itemId, e.target.value)}
                    placeholder="Batch number"
                    error={errors[`batch_${item.itemId}`]}
                  />
                </div>
                
                <div className="col-expiry">
                  <Input
                    type="date"
                    value={item.expiryDate}
                    onChange={(e) => handleExpiryDateChange(item.itemId, e.target.value)}
                  />
                </div>
                
                <div className="col-location">
                  <select 
                    value={item.location}
                    onChange={(e) => handleLocationChange(item.itemId, e.target.value)}
                    className={`location-select ${errors[`location_${item.itemId}`] ? 'error' : ''}`}
                  >
                    <option value="Main Warehouse">Main Warehouse</option>
                    <option value="Tank Farm A-1">Tank Farm A-1</option>
                    <option value="Tank Farm A-2">Tank Farm A-2</option>
                    <option value="Tank Farm B-1">Tank Farm B-1</option>
                    <option value="Tank Farm C-1">Tank Farm C-1</option>
                    <option value="Tank Farm C-2">Tank Farm C-2</option>
                    <option value="Storage Yard B">Storage Yard B</option>
                    <option value="Secure Storage">Secure Storage</option>
                  </select>
                </div>
                
                <div className="col-condition">
                  <select 
                    value={item.condition}
                    onChange={(e) => handleConditionChange(item.itemId, e.target.value)}
                    className="condition-select"
                  >
                    <option value="new">New</option>
                    <option value="used">Used</option>
                    <option value="refurbished">Refurbished</option>
                    <option value="damaged">Damaged</option>
                  </select>
                </div>
                
                <div className="col-quality">
                  <div className="quality-controls">
                    <div className="quality-grade">
                      <select 
                        value={item.qualityGrade || 'A'}
                        onChange={(e) => handleQualityGrade(item.itemId, e.target.value)}
                        className={`grade-select grade-${(item.qualityGrade || 'A').toLowerCase()}`}
                      >
                        <option value="A">Grade A</option>
                        <option value="B">Grade B</option>
                        <option value="C">Grade C</option>
                        <option value="Reject">Reject</option>
                      </select>
                    </div>
                    <button 
                      type="button"
                      onClick={() => openQualityModal(item.itemId)}
                      className="quality-check-btn"
                      title="Quality Inspection"
                    >
                      <ClipboardCheck size={16} />
                      <span className="quality-status">
                        {getQualityChecksPassed(item.itemId)}/{getTotalQualityChecks()}
                      </span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quality Inspection Summary */}
        <div className="quality-summary">
          <h3>
            <Shield className="section-icon" />
            Quality Inspection Summary
          </h3>
          <div className="quality-metrics">
            <div className="metric-card">
              <div className="metric-value">{receivedItems.filter(item => {
                const qualityId = `quality_${item.itemId}`;
                return item.receivedQuantity > 0 && qualityChecks[qualityId]?.passed;
              }).length}</div>
              <div className="metric-label">Items Passed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value">{receivedItems.filter(item => {
                const qualityId = `quality_${item.itemId}`;
                return item.receivedQuantity > 0 && !qualityChecks[qualityId]?.passed;
              }).length}</div>
              <div className="metric-label">Items Failed</div>
            </div>
            <div className="metric-card">
              <div className="metric-value rating-display">
                <div className="rating-stars">
                  {[1,2,3,4,5].map(star => (
                    <Star 
                      key={star}
                      size={16} 
                      className={star <= overallQualityRating ? 'star-filled' : 'star-empty'}
                      onClick={() => setOverallQualityRating(star)}
                    />
                  ))}
                </div>
              </div>
              <div className="metric-label">Overall Rating</div>
            </div>
          </div>
          
          <div className="quality-notes-section">
            <label>Quality Inspection Notes</label>
            <textarea
              value={qualityNotes}
              onChange={(e) => setQualityNotes(e.target.value)}
              placeholder="Overall quality assessment, issues found, recommendations..."
              rows={3}
            />
          </div>
        </div>

        {/* Receipt Summary */}
        <div className="receipt-summary">
          <div className="summary-item">
            <span>Items Received:</span>
            <span>{receivedItems.filter(item => item.receivedQuantity > 0).length}</span>
          </div>
          <div className="summary-item">
            <span>Total Value Received:</span>
            <span className="total-value">{formatCurrency(getTotalReceivedValue())}</span>
          </div>
        </div>

        {/* Receipt Notes */}
        <div className="receipt-notes">
          <label>Receipt Notes</label>
          <textarea
            value={receiptNotes}
            onChange={(e) => setReceiptNotes(e.target.value)}
            placeholder="Add notes about the receipt (quality, damages, discrepancies, etc.)"
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="receipt-actions">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleReceive}
            loading={loading}
            icon={CheckCircle}
          >
            Receive & Update Inventory
          </Button>
        </div>
      </div>
      
      {/* Quality Inspection Modal */}
      {activeQualityItem && (
        <QualityInspectionModal
          itemId={activeQualityItem}
          item={receivedItems.find(item => item.itemId === activeQualityItem)}
          qualityCheck={qualityChecks[`quality_${activeQualityItem}`]}
          onUpdate={(checkType, passed, notes) => handleQualityCheck(activeQualityItem, checkType, passed, notes)}
          onClose={closeQualityModal}
        />
      )}
    </Modal>
  );
};

export default PurchaseOrderReceipt;