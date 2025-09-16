import React, { useState } from 'react';
import Modal from './ui/Modal';
import Button from './ui/Button';
import { Input } from './ui/Input';
import { 
  Shield, CheckCircle, AlertTriangle, X, Eye, Package, FileText, 
  Droplets, Palette, Activity, Camera, Upload, Star, ClipboardCheck
} from 'lucide-react';
import './QualityInspectionModal.css';

const QualityInspectionModal = ({ 
  itemId, 
  item, 
  qualityCheck, 
  onUpdate, 
  onClose 
}) => {
  const [localChecks, setLocalChecks] = useState(qualityCheck || {});
  const [photos, setPhotos] = useState([]);

  const qualityCheckTypes = [
    {
      id: 'visualInspection',
      name: 'Visual Inspection',
      icon: Eye,
      description: 'Overall appearance, visible damage, leaks'
    },
    {
      id: 'packaging',
      name: 'Packaging Integrity',
      icon: Package,
      description: 'Container condition, seals, labels'
    },
    {
      id: 'labeling',
      name: 'Product Labeling',
      icon: FileText,
      description: 'Correct labels, batch info, expiry dates'
    },
    {
      id: 'documentation',
      name: 'Documentation',
      icon: ClipboardCheck,
      description: 'Certificates, test reports, compliance docs'
    },
    {
      id: 'quantity',
      name: 'Quantity Verification',
      icon: Activity,
      description: 'Actual vs ordered quantity accuracy'
    },
    {
      id: 'contamination',
      name: 'Contamination Check',
      icon: Droplets,
      description: 'Water content, foreign particles, purity'
    },
    {
      id: 'color',
      name: 'Color Assessment',
      icon: Palette,
      description: 'Product color consistency and standards'
    },
    {
      id: 'viscosity',
      name: 'Viscosity Test',
      icon: Activity,
      description: 'Flow characteristics and thickness'
    }
  ];

  const handleCheckUpdate = (checkType, passed, notes = '') => {
    const updatedChecks = {
      ...localChecks,
      [checkType]: { passed, notes }
    };
    setLocalChecks(updatedChecks);
    onUpdate(checkType, passed, notes);
  };

  const handlePhotoUpload = (event) => {
    const files = Array.from(event.target.files);
    setPhotos(prev => [...prev, ...files]);
  };

  const removePhoto = (index) => {
    setPhotos(prev => prev.filter((_, i) => i !== index));
  };

  const getOverallStatus = () => {
    const passedChecks = qualityCheckTypes.filter(check => 
      localChecks[check.id]?.passed
    ).length;
    const totalChecks = qualityCheckTypes.length;
    return { passed: passedChecks, total: totalChecks };
  };

  const { passed, total } = getOverallStatus();
  const passRate = total > 0 ? (passed / total * 100).toFixed(0) : 0;

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`Quality Inspection - ${item?.materialName}`}
      size="xl"
    >
      <div className="quality-inspection-container">
        {/* Header with Overall Status */}
        <div className="inspection-header">
          <div className="item-info">
            <h3>{item?.materialName}</h3>
            <p>Batch: {item?.batchNumber || 'N/A'} | Quantity: {item?.receivedQuantity}</p>
          </div>
          <div className="overall-status">
            <div className={`status-circle ${passRate >= 80 ? 'pass' : passRate >= 60 ? 'warning' : 'fail'}`}>
              <span className="pass-rate">{passRate}%</span>
            </div>
            <div className="status-text">
              <span className="passed">{passed}/{total} Checks Passed</span>
            </div>
          </div>
        </div>

        {/* Quality Check List */}
        <div className="quality-checks">
          <h4>
            <Shield className="section-icon" />
            Inspection Checklist
          </h4>
          
          <div className="checks-grid">
            {qualityCheckTypes.map((check) => {
              const CheckIcon = check.icon;
              const checkStatus = localChecks[check.id];
              const isPassed = checkStatus?.passed;
              
              return (
                <div key={check.id} className={`check-item ${isPassed === true ? 'passed' : isPassed === false ? 'failed' : 'pending'}`}>
                  <div className="check-header">
                    <div className="check-info">
                      <CheckIcon className="check-icon" />
                      <div>
                        <h5>{check.name}</h5>
                        <p>{check.description}</p>
                      </div>
                    </div>
                    <div className="check-controls">
                      <button
                        type="button"
                        className={`check-btn pass ${isPassed === true ? 'active' : ''}`}
                        onClick={() => handleCheckUpdate(check.id, true, checkStatus?.notes || '')}
                      >
                        <CheckCircle size={18} />
                        Pass
                      </button>
                      <button
                        type="button"
                        className={`check-btn fail ${isPassed === false ? 'active' : ''}`}
                        onClick={() => handleCheckUpdate(check.id, false, checkStatus?.notes || '')}
                      >
                        <X size={18} />
                        Fail
                      </button>
                    </div>
                  </div>
                  
                  {/* Notes section for failed checks or additional comments */}
                  {(isPassed === false || checkStatus?.notes) && (
                    <div className="check-notes">
                      <Input
                        type="text"
                        placeholder="Add notes about this check..."
                        value={checkStatus?.notes || ''}
                        onChange={(e) => handleCheckUpdate(check.id, isPassed, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Photo Documentation */}
        <div className="photo-documentation">
          <h4>
            <Camera className="section-icon" />
            Photo Documentation
          </h4>
          
          <div className="photo-upload">
            <input
              type="file"
              id="photo-upload"
              multiple
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="photo-upload" className="upload-btn">
              <Upload size={20} />
              Upload Photos
            </label>
            <span className="upload-hint">Add photos of quality issues or documentation</span>
          </div>

          {photos.length > 0 && (
            <div className="photo-grid">
              {photos.map((photo, index) => (
                <div key={index} className="photo-item">
                  <img 
                    src={URL.createObjectURL(photo)} 
                    alt={`Quality check ${index + 1}`}
                    className="photo-thumbnail"
                  />
                  <button
                    type="button"
                    className="remove-photo"
                    onClick={() => removePhoto(index)}
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Test Results Section */}
        <div className="test-results">
          <h4>
            <Activity className="section-icon" />
            Test Results (Optional)
          </h4>
          
          <div className="test-grid">
            <div className="test-field">
              <label>Specific Gravity</label>
              <Input
                type="number"
                step="0.001"
                placeholder="0.850"
              />
            </div>
            <div className="test-field">
              <label>Viscosity (cSt)</label>
              <Input
                type="number"
                step="0.1"
                placeholder="46.0"
              />
            </div>
            <div className="test-field">
              <label>Flash Point (°C)</label>
              <Input
                type="number"
                placeholder="220"
              />
            </div>
            <div className="test-field">
              <label>Water Content (%)</label>
              <Input
                type="number"
                step="0.01"
                placeholder="0.05"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="inspection-actions">
          <Button variant="secondary" onClick={onClose}>
            Close Inspection
          </Button>
          <Button 
            variant="primary" 
            onClick={onClose}
            icon={CheckCircle}
          >
            Save Quality Check
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default QualityInspectionModal;