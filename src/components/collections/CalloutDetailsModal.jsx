import React, { useState } from 'react';
import {
  Package, MapPin, Calendar, User, FileText, Truck, Clock, CheckCircle,
  AlertCircle, DollarSign, Box, Link2, RefreshCw, ShoppingCart, Phone, History, X
} from 'lucide-react';
import { useLocalization } from '../../context/LocalizationContext';
import Modal from '../ui/Modal';

// Sub-component for Rectification History Modal
const RectificationHistoryModal = ({ isOpen, onClose, rectificationNotes, rectificationCount }) => {
  if (!isOpen) return null;

  // Parse rectification notes into structured entries
  // Format: [timestamp] Rectification #N - notes\n  • Material: old → new (+/-diff) - "reason"
  const parseRectificationNotes = (notes) => {
    if (!notes) return [];

    const entries = [];
    // Split by double newlines to get each rectification block
    const blocks = notes.split(/\n\n+/).filter(block => block.trim());

    for (const block of blocks) {
      const lines = block.split('\n');
      const headerLine = lines[0];

      // Parse header: [timestamp] Rectification #N - notes
      const headerMatch = headerLine.match(/^\[(\d{4}-\d{2}-\d{2}T[\d:.]+Z?)\]\s*(.*)$/);

      if (headerMatch) {
        const adjustments = [];

        // Parse adjustment lines: • Material: old → new (+/-diff) - "reason"
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (line.startsWith('•')) {
            const adjMatch = line.match(/•\s*(.+?):\s*([\d.]+)\s*→\s*([\d.]+)\s*\(([+-]?[\d.]+)\)\s*-\s*"(.+)"/);
            if (adjMatch) {
              adjustments.push({
                material: adjMatch[1],
                oldValue: parseFloat(adjMatch[2]),
                newValue: parseFloat(adjMatch[3]),
                diff: parseFloat(adjMatch[4]),
                reason: adjMatch[5]
              });
            } else {
              // Fallback: just show the line as-is
              adjustments.push({ raw: line.substring(1).trim() });
            }
          }
        }

        entries.push({
          timestamp: new Date(headerMatch[1]),
          header: headerMatch[2],
          adjustments
        });
      } else if (block.trim()) {
        // Fallback for old format or unstructured notes
        entries.push({
          timestamp: null,
          header: block.trim(),
          adjustments: []
        });
      }
    }

    return entries;
  };

  const entries = parseRectificationNotes(rectificationNotes);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '600px',
        width: '90%',
        maxHeight: '80vh',
        overflow: 'auto',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History style={{ width: '20px', height: '20px', color: 'var(--orange-600)' }} />
            Rectification History ({rectificationCount} {rectificationCount === 1 ? 'time' : 'times'})
          </h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px'
            }}
          >
            <X style={{ width: '20px', height: '20px', color: 'var(--gray-500)' }} />
          </button>
        </div>

        {entries.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {entries.map((entry, index) => (
              <div
                key={index}
                style={{
                  padding: '16px',
                  backgroundColor: 'var(--orange-50)',
                  borderRadius: '8px',
                  borderLeft: '4px solid var(--orange-400)'
                }}
              >
                {/* Header with timestamp */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--orange-800)' }}>
                    {entry.header}
                  </div>
                  {entry.timestamp && (
                    <div style={{ fontSize: '11px', color: 'var(--orange-600)', fontFamily: 'monospace' }}>
                      {entry.timestamp.toLocaleString()}
                    </div>
                  )}
                </div>

                {/* Adjustments list */}
                {entry.adjustments && entry.adjustments.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {entry.adjustments.map((adj, adjIndex) => (
                      <div
                        key={adjIndex}
                        style={{
                          padding: '10px 12px',
                          backgroundColor: 'white',
                          borderRadius: '6px',
                          border: '1px solid var(--orange-200)'
                        }}
                      >
                        {adj.raw ? (
                          <div style={{ fontSize: '13px', color: 'var(--gray-700)' }}>{adj.raw}</div>
                        ) : (
                          <>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: 'var(--gray-900)', marginBottom: '4px' }}>
                              {adj.material}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                              <span style={{ color: 'var(--gray-600)' }}>{adj.oldValue}</span>
                              <span style={{ color: 'var(--gray-400)' }}>→</span>
                              <span style={{ fontWeight: '600', color: 'var(--gray-900)' }}>{adj.newValue}</span>
                              <span style={{
                                padding: '2px 6px',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                backgroundColor: adj.diff > 0 ? 'var(--green-100)' : 'var(--red-100)',
                                color: adj.diff > 0 ? 'var(--green-700)' : 'var(--red-700)'
                              }}>
                                {adj.diff > 0 ? '+' : ''}{adj.diff}
                              </span>
                            </div>
                            <div style={{ fontSize: '12px', color: 'var(--gray-600)', marginTop: '4px', fontStyle: 'italic' }}>
                              "{adj.reason}"
                            </div>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            padding: '24px',
            textAlign: 'center',
            backgroundColor: 'var(--gray-50)',
            borderRadius: '8px'
          }}>
            <History style={{ width: '32px', height: '32px', color: 'var(--gray-400)', marginBottom: '8px' }} />
            <p style={{ margin: 0, color: 'var(--gray-500)' }}>
              No detailed rectification history available
            </p>
          </div>
        )}

        <div style={{ marginTop: '20px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '8px 20px',
              backgroundColor: 'var(--gray-600)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const CalloutDetailsModal = ({ callout, isOpen, onClose, onViewPO }) => {
  const { t, isRTL } = useLocalization();
  const [showRectificationHistory, setShowRectificationHistory] = useState(false);

  if (!callout) return null;

  const getStatusColor = (status) => {
    const colors = {
      pending: 'orange',
      scheduled: 'blue',
      in_transit: 'purple',
      collecting: 'cyan',
      completed: 'green',
      cancelled: 'red',
      failed: 'red'
    };
    return colors[status] || 'gray';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      low: 'green',
      normal: 'blue',
      high: 'orange',
      urgent: 'red'
    };
    return colors[priority] || 'gray';
  };

  // Calculate totals - show collected if finalized, otherwise show available
  const isFinalized = callout.is_finalized === 1 || callout.isFinalized;
  const hasWCN = callout.wcn_number || callout.wcnNumber;
  const hasPO = callout.purchase_order_id || callout.purchaseOrderId;
  const rectificationCount = callout.rectification_count || callout.rectificationCount || 0;
  const rectificationNotes = callout.rectification_notes || callout.rectificationNotes || '';

  // Calculate totals for both available and collected
  const totalAvailable = callout.items?.reduce((sum, item) =>
    sum + parseFloat(item.availableQuantity || 0), 0) || 0;
  const totalCollected = callout.items?.reduce((sum, item) =>
    sum + parseFloat(item.collectedQuantity || 0), 0) || 0;
  const totalValue = callout.items?.reduce((sum, item) =>
    sum + parseFloat(item.totalValue || 0), 0) || 0;

  // Determine what quantity to show prominently
  const hasCollectedData = totalCollected > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('calloutDetails') || 'Collection Order Details'}
      size="large"
    >
      <div style={{ padding: '24px', direction: isRTL ? 'rtl' : 'ltr', maxHeight: '80vh', overflowY: 'auto' }}>
        {/* Status Banner */}
        <div style={{
          marginBottom: '24px',
          padding: '16px',
          backgroundColor: `var(--${getStatusColor(callout.status)}-50)`,
          borderLeft: `4px solid var(--${getStatusColor(callout.status)}-500)`,
          borderRadius: '8px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {callout.status === 'completed' ? (
              <CheckCircle style={{ width: '24px', height: '24px', color: `var(--${getStatusColor(callout.status)}-600)` }} />
            ) : (
              <Clock style={{ width: '24px', height: '24px', color: `var(--${getStatusColor(callout.status)}-600)` }} />
            )}
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '600', color: `var(--${getStatusColor(callout.status)}-900)` }}>
                {t(`status_${callout.status}`) || callout.status}
              </h3>
              <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: `var(--${getStatusColor(callout.status)}-700)` }}>
                {t('orderNumber') || 'Order'}: #{callout.orderNumber || callout.calloutNumber || callout.id}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <span style={{
                padding: '4px 12px',
                borderRadius: '16px',
                fontSize: '12px',
                fontWeight: '600',
                backgroundColor: `var(--${getPriorityColor(callout.priority)}-100)`,
                color: `var(--${getPriorityColor(callout.priority)}-700)`
              }}>
                {t(`priority_${callout.priority}`) || callout.priority || 'Normal'}
              </span>
            </div>
          </div>
        </div>

        {/* WCN Status Section */}
        {(isFinalized || hasWCN) && (
          <div style={{
            marginBottom: '24px',
            padding: '16px',
            backgroundColor: 'var(--green-50)',
            borderRadius: '8px',
            border: '1px solid var(--green-200)'
          }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--green-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText style={{ width: '18px', height: '18px' }} />
              WCN (Waste Consignment Note) Status
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--green-700)', marginBottom: '4px' }}>
                  WCN Number
                </label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--green-900)', fontFamily: 'monospace' }}>
                  {callout.wcn_number || callout.wcnNumber || '-'}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--green-700)', marginBottom: '4px' }}>
                  WCN Date
                </label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--green-900)' }}>
                  {(callout.wcn_date || callout.wcnDate) ? new Date(callout.wcn_date || callout.wcnDate).toLocaleDateString() : '-'}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--green-700)', marginBottom: '4px' }}>
                  Status
                </label>
                <p style={{ margin: 0 }}>
                  <span style={{
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '12px',
                    fontWeight: '600',
                    backgroundColor: isFinalized ? 'var(--green-200)' : 'var(--yellow-200)',
                    color: isFinalized ? 'var(--green-800)' : 'var(--yellow-800)'
                  }}>
                    {isFinalized ? '✓ Finalized' : 'Pending'}
                  </span>
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--green-700)', marginBottom: '4px' }}>
                  Rectifications
                </label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--green-900)' }}>
                  {rectificationCount > 0 ? (
                    <button
                      onClick={() => setShowRectificationHistory(true)}
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        cursor: 'pointer',
                        backgroundColor: 'var(--orange-100)',
                        color: 'var(--orange-700)',
                        fontSize: '12px',
                        fontWeight: '600',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                      title="Click to view rectification history"
                    >
                      <RefreshCw style={{ width: '12px', height: '12px' }} />
                      {rectificationCount} time(s)
                      <History style={{ width: '12px', height: '12px' }} />
                    </button>
                  ) : (
                    <span style={{ color: 'var(--gray-500)' }}>None</span>
                  )}
                </p>
              </div>
            </div>

            {/* PO Link */}
            {hasPO && (
              <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--green-200)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <ShoppingCart style={{ width: '16px', height: '16px', color: 'var(--green-700)' }} />
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--green-800)' }}>
                      Purchase Order Created: PO #{callout.purchase_order_id || callout.purchaseOrderId}
                    </span>
                    <CheckCircle style={{ width: '14px', height: '14px', color: 'var(--green-600)' }} />
                  </div>
                  {onViewPO && (
                    <button
                      onClick={() => onViewPO(callout.purchase_order_id || callout.purchaseOrderId)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: 'var(--green-600)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}
                    >
                      <Link2 style={{ width: '12px', height: '12px' }} />
                      View PO
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Inventory Status */}
            {isFinalized && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Box style={{ width: '16px', height: '16px', color: 'var(--green-700)' }} />
                <span style={{ fontSize: '14px', color: 'var(--green-700)' }}>
                  <CheckCircle style={{ width: '14px', height: '14px', display: 'inline', marginRight: '4px', color: 'var(--green-600)' }} />
                  Inventory Updated with collected materials
                </span>
              </div>
            )}
          </div>
        )}

        {/* Main Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
          {/* Contract Information */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <FileText style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
              {t('contract') || 'Contract'}
            </label>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
              {callout.contractNumber || callout.contractName || callout.contractId || t('noContract') || 'No Contract'}
            </p>
          </div>

          {/* Supplier Information */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Truck style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
              {t('supplier') || 'Supplier'}
            </label>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
              {callout.supplierName || callout.supplierId || '-'}
            </p>
          </div>

          {/* Location Information */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <MapPin style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
              {t('location') || 'Location'}
            </label>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
              {callout.locationName || callout.locationId || '-'}
            </p>
          </div>

          {/* Scheduled Date */}
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
              <Calendar style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
              {t('scheduledDate') || 'Scheduled Date'}
            </label>
            <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
              {callout.scheduledDate ? new Date(callout.scheduledDate).toLocaleDateString() : '-'}
            </p>
          </div>

          {/* Contact Person */}
          {callout.contactPerson && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
                <User style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                {t('contactPerson') || 'Contact Person'}
              </label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
                {callout.contactPerson}
              </p>
            </div>
          )}

          {/* Contact Phone */}
          {callout.contactPhone && (
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--gray-600)', marginBottom: '8px', textTransform: 'uppercase' }}>
                <Phone style={{ width: '14px', height: '14px', display: 'inline', marginRight: '6px' }} />
                {t('contactPhone') || 'Contact Phone'}
              </label>
              <p style={{ margin: 0, fontSize: '16px', fontWeight: '500', color: 'var(--gray-900)' }}>
                {callout.contactPhone}
              </p>
            </div>
          )}
        </div>

        {/* Driver & Vehicle Information */}
        {(callout.driverName || callout.vehiclePlate) && (
          <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: 'var(--blue-50)', borderRadius: '8px', border: '1px solid var(--blue-200)' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '600', color: 'var(--blue-800)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Truck style={{ width: '16px', height: '16px' }} />
              {t('driverVehicleInfo') || 'Driver & Vehicle Information'}
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--blue-700)', marginBottom: '4px' }}>
                  {t('driverName') || 'Driver Name'}
                </label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--blue-900)' }}>
                  {callout.driverName || '-'}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--blue-700)', marginBottom: '4px' }}>
                  {t('vehiclePlate') || 'Vehicle Plate'}
                </label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--blue-900)', fontFamily: 'monospace' }}>
                  {callout.vehiclePlate || '-'}
                </p>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--blue-700)', marginBottom: '4px' }}>
                  {t('vehicleType') || 'Vehicle Type'}
                </label>
                <p style={{ margin: 0, fontSize: '14px', fontWeight: '500', color: 'var(--blue-900)', textTransform: 'capitalize' }}>
                  {callout.vehicleType || '-'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Materials Section - Enhanced with Both Columns */}
        <div style={{ marginBottom: '24px' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Package style={{ width: '18px', height: '18px' }} />
            {isFinalized ? 'Collected Materials' : 'Materials'}
            {callout.items && <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--gray-500)' }}>({callout.items.length} items)</span>}
          </h4>

          {/* Collection Status Info */}
          {!isFinalized && callout.items && callout.items.length > 0 && (
            <div style={{
              marginBottom: '12px',
              padding: '10px 14px',
              backgroundColor: hasCollectedData ? 'var(--blue-50)' : 'var(--yellow-50)',
              borderRadius: '6px',
              border: `1px solid ${hasCollectedData ? 'var(--blue-200)' : 'var(--yellow-200)'}`,
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <AlertCircle style={{ width: '16px', height: '16px', color: hasCollectedData ? 'var(--blue-600)' : 'var(--yellow-600)' }} />
              <span style={{ fontSize: '13px', color: hasCollectedData ? 'var(--blue-700)' : 'var(--yellow-700)' }}>
                {hasCollectedData
                  ? 'Collection recorded. Finalize WCN to update inventory and create PO.'
                  : 'Collection not yet recorded. Available quantities shown are estimates.'}
              </span>
            </div>
          )}

          {callout.items && callout.items.length > 0 ? (
            <div style={{ border: '1px solid var(--gray-200)', borderRadius: '8px', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      {t('material') || 'Material'}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      Available
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      Collected
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      {t('unit') || 'Unit'}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      {t('rate') || 'Rate'}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'right', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      {t('amount') || 'Amount'}
                    </th>
                    <th style={{ padding: '12px', textAlign: 'center', fontSize: '12px', fontWeight: '600', color: 'var(--gray-700)', textTransform: 'uppercase' }}>
                      {t('quality') || 'Quality'}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {callout.items.map((item, index) => {
                    const availableQty = parseFloat(item.availableQuantity || 0);
                    const collectedQty = parseFloat(item.collectedQuantity || 0);
                    const hasCollected = collectedQty > 0;
                    const diff = collectedQty - availableQty;

                    return (
                      <tr key={index} style={{ borderBottom: index < callout.items.length - 1 ? '1px solid var(--gray-100)' : 'none' }}>
                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gray-900)' }}>
                          <strong>{item.materialName || item.materialId}</strong>
                          {item.materialCode && <span style={{ display: 'block', fontSize: '12px', color: 'var(--gray-500)' }}>{item.materialCode}</span>}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gray-600)', textAlign: 'right' }}>
                          {availableQty.toFixed(3)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>
                          <span style={{ color: hasCollected ? 'var(--gray-900)' : 'var(--gray-400)' }}>
                            {collectedQty.toFixed(3)}
                          </span>
                          {hasCollected && diff !== 0 && (
                            <span style={{
                              display: 'block',
                              fontSize: '11px',
                              color: diff > 0 ? 'var(--green-600)' : 'var(--red-600)'
                            }}>
                              {diff > 0 ? '+' : ''}{diff.toFixed(3)}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gray-700)' }}>
                          {item.unit || item.materialUnit || 'KG'}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gray-700)', textAlign: 'right' }}>
                          OMR {parseFloat(item.contractRate || item.agreedRate || 0).toFixed(3)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--primary-600)', textAlign: 'right' }}>
                          OMR {parseFloat(item.totalValue || 0).toFixed(2)}
                        </td>
                        <td style={{ padding: '12px', fontSize: '14px', color: 'var(--gray-700)', textAlign: 'center' }}>
                          <span style={{
                            padding: '2px 8px',
                            borderRadius: '10px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: item.qualityGrade === 'A' ? 'var(--green-100)' :
                                            item.qualityGrade === 'B' ? 'var(--blue-100)' :
                                            item.qualityGrade === 'C' ? 'var(--yellow-100)' : 'var(--gray-100)',
                            color: item.qualityGrade === 'A' ? 'var(--green-700)' :
                                  item.qualityGrade === 'B' ? 'var(--blue-700)' :
                                  item.qualityGrade === 'C' ? 'var(--yellow-700)' : 'var(--gray-700)'
                          }}>
                            {item.qualityGrade || '-'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr style={{ backgroundColor: 'var(--gray-50)', borderTop: '2px solid var(--gray-200)' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)' }}>
                      Total
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '500', color: 'var(--gray-600)', textAlign: 'right' }}>
                      {totalAvailable.toFixed(3)}
                    </td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: 'var(--gray-900)', textAlign: 'right' }}>
                      {totalCollected.toFixed(3)}
                    </td>
                    <td colSpan="2" style={{ padding: '12px' }}></td>
                    <td style={{ padding: '12px', fontSize: '16px', fontWeight: '700', color: 'var(--primary-600)', textAlign: 'right' }}>
                      OMR {totalValue.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px' }}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', backgroundColor: 'var(--gray-50)', borderRadius: '8px', border: '1px dashed var(--gray-300)' }}>
              <Package style={{ width: '32px', height: '32px', color: 'var(--gray-400)', marginBottom: '8px' }} />
              <p style={{ margin: 0, color: 'var(--gray-500)' }}>No materials added to this collection order</p>
            </div>
          )}
        </div>

        {/* Special Instructions/Notes */}
        {(callout.notes || callout.specialInstructions) && (
          <div style={{ marginBottom: '24px' }}>
            <h4 style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '600', color: 'var(--gray-900)' }}>
              {t('notes') || 'Notes'}
            </h4>
            <div style={{ padding: '16px', backgroundColor: 'var(--gray-50)', borderRadius: '8px', border: '1px solid var(--gray-200)' }}>
              <p style={{ margin: 0, fontSize: '14px', color: 'var(--gray-700)', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
                {callout.notes || callout.specialInstructions}
              </p>
            </div>
          </div>
        )}

        {/* Close Button */}
        <div style={{ marginTop: '24px', textAlign: 'right' }}>
          <button
            onClick={onClose}
            style={{
              padding: '10px 24px',
              backgroundColor: 'var(--primary-600)',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseOver={(e) => e.target.style.backgroundColor = 'var(--primary-700)'}
            onMouseOut={(e) => e.target.style.backgroundColor = 'var(--primary-600)'}
          >
            {t('close') || 'Close'}
          </button>
        </div>
      </div>

      {/* Rectification History Modal */}
      <RectificationHistoryModal
        isOpen={showRectificationHistory}
        onClose={() => setShowRectificationHistory(false)}
        rectificationNotes={rectificationNotes}
        rectificationCount={rectificationCount}
      />
    </Modal>
  );
};

export default CalloutDetailsModal;
