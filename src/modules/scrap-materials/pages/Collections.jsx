import React, { useState } from 'react';
import { Truck, FileText, HelpCircle } from 'lucide-react';
import { useLocalization } from '../../../context/LocalizationContext';
import CalloutManager from '../../../components/collections/CalloutManager';
// CSS moved to global index.css Tailwind

/**
 * Collections Page - Sprint 4.5 WCN Workflow
 *
 * This page manages the complete collections workflow:
 * 1. Collection Orders (scheduled → in_progress → completed)
 * 2. WCN Finalization (completed → finalized, creates PO + updates inventory)
 * 3. WCN Rectification (adjust quantities after finalization)
 *
 * Note: The CalloutManager component handles all collection order operations
 * including WCN finalization and rectification modals.
 */
const Collections = () => {
  const { t, isRTL } = useLocalization();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <div className={`collections-container ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Page Header */}
      <div className="collections-header">
        <div className="header-title">
          <Truck className="header-icon" size={32} />
          <div>
            <h1>Collections & WCN Management</h1>
            <span className="header-subtitle">
              Manage collection orders, finalize WCNs, and generate purchase orders
            </span>
          </div>
        </div>

        <div className="header-actions">
          <button
            className="help-btn"
            onClick={() => setShowHelp(!showHelp)}
            title="Show workflow help"
          >
            <HelpCircle className="w-5 h-5" />
            Workflow Guide
          </button>
        </div>
      </div>

      {/* Workflow Help Banner */}
      {showHelp && (
        <div className="workflow-help-banner">
          <FileText className="w-5 h-5" />
          <div className="workflow-steps">
            <div className="workflow-step">
              <strong>1. Create Collection Order</strong>
              <span>Schedule material collection from supplier location</span>
            </div>
            <div className="workflow-step-arrow">→</div>
            <div className="workflow-step">
              <strong>2. Complete Collection</strong>
              <span>Mark as completed after materials collected</span>
            </div>
            <div className="workflow-step-arrow">→</div>
            <div className="workflow-step">
              <strong>3. Finalize WCN</strong>
              <span>Generate WCN, update inventory, create purchase order</span>
            </div>
            <div className="workflow-step-arrow">→</div>
            <div className="workflow-step">
              <strong>4. Rectify (if needed)</strong>
              <span>Adjust quantities after finalization</span>
            </div>
          </div>
          <button
            onClick={() => setShowHelp(false)}
            className="help-close"
          >
            ✕
          </button>
        </div>
      )}

      {/* Main Content - Collection Orders Manager */}
      <div className="collections-content">
        <CalloutManager />
      </div>
    </div>
  );
};

export default Collections;
