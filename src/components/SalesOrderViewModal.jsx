import React, { useState } from 'react';
import Modal from './ui/Modal';
import { FileText, Calendar, User, Package, Banknote, CheckCircle, AlertTriangle, Layers, DollarSign, TrendingUp, ChevronDown, ChevronUp, Hash, FileDown, FileCode, QrCode } from 'lucide-react';
import einvoicingService from '../services/einvoicingService';
import showToast from './ui/Toast';
// CSS moved to global index.css Tailwind

const SalesOrderViewModal = ({
  isOpen,
  onClose,
  orderData,
  onEdit,
  t
}) => {
  const [expandedAllocations, setExpandedAllocations] = useState({});
  const [generatingInvoice, setGeneratingInvoice] = useState(false);

  if (!orderData) return null;

  // E-invoice generation — idempotent
  const handleGenerateEInvoice = async () => {
    setGeneratingInvoice(true);
    const result = await einvoicingService.generate(orderData.id);
    if (result.success) {
      showToast.success(result.message || 'E-invoice generated');
      // Update the local order data so the download buttons appear
      orderData.invoice_uuid = result.data.invoiceUuid;
      orderData.qr_code_tlv = result.data.qrCodeTlv;
      orderData.invoiceNumber = result.data.invoiceNumber;
    } else {
      showToast.error(result.error || 'Failed to generate e-invoice');
    }
    setGeneratingInvoice(false);
  };

  const hasEInvoice = !!(orderData.invoice_uuid || orderData.qr_code_tlv);

  const toggleAllocation = (itemId) => {
    setExpandedAllocations(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  const isDelivered = orderData.status === 'delivered';
  const hasCOGS = parseFloat(orderData.cogs) > 0;

  const formatCurrency = (amount) => {
    return `OMR ${(parseFloat(amount) || 0).toFixed(2)}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`${orderData.orderNumber || `Order #${orderData.id}`} - ${t ? t('salesOrderDetails', 'Sales Order Details') : 'Sales Order Details'}`}
      onClose={onClose}
      className="modal-xl sales-order-details-modal"
      closeOnOverlayClick={false}
    >
      <div className="order-view-professional">
        {/* Header Section */}
        <div className="order-header">
          <div className="order-icon-container">
            <FileText size={24} color="white" />
          </div>
          <div className="order-header-info">
            <h2 className="order-title">
              {orderData.customerName || 'Sales Order'}
            </h2>
            <div className="order-badges">
              <span className={`status-badge-large ${orderData.status}`}>
                {orderData.status?.charAt(0).toUpperCase() + orderData.status?.slice(1)}
              </span>
              {orderData.invoiceNumber && (
                <span className="invoice-badge">
                  <CheckCircle size={14} />
                  Invoice Generated
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Invoice Alert */}
        {orderData.invoiceNumber && (
          <div className="alert-success">
            <CheckCircle size={16} />
            <div>
              <strong>Invoice Generated:</strong> {orderData.invoiceNumber}
              {orderData.invoiceGeneratedAt && (
                <span className="alert-subtitle">
                  {' '} on {formatDate(orderData.invoiceGeneratedAt)}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Information Cards Grid */}
        <div className="info-cards-grid">
          {/* Order Information Card */}
          <div className="info-card">
            <div className="info-card-header">
              <FileText size={18} />
              <h3>Order Information</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row">
                <span className="info-label">Order Number</span>
                <span className="info-value">{orderData.orderNumber || `#${orderData.id}`}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Order Date</span>
                <span className="info-value">{formatDate(orderData.orderDate || orderData.date)}</span>
              </div>
              {orderData.expectedDeliveryDate && (
                <div className="info-row">
                  <span className="info-label">Expected Delivery</span>
                  <span className="info-value">{formatDate(orderData.expectedDeliveryDate)}</span>
                </div>
              )}
              {orderData.actualDeliveryDate && (
                <div className="info-row">
                  <span className="info-label">Actual Delivery</span>
                  <span className="info-value">{formatDate(orderData.actualDeliveryDate)}</span>
                </div>
              )}
            </div>
          </div>

          {/* Customer Information Card */}
          <div className="info-card">
            <div className="info-card-header">
              <User size={18} />
              <h3>Customer Information</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row">
                <span className="info-label">Customer</span>
                <span className="info-value strong">{orderData.customerName || orderData.customer}</span>
              </div>
              {orderData.customerPhone && (
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{orderData.customerPhone}</span>
                </div>
              )}
              {orderData.customerEmail && (
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{orderData.customerEmail}</span>
                </div>
              )}
              {orderData.deliveryAddress && (
                <div className="info-row">
                  <span className="info-label">Delivery Address</span>
                  <span className="info-value">{orderData.deliveryAddress}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Section */}
        <div className="items-card">
          <div className="items-card-header">
            <Package size={18} />
            <h3>Order Items</h3>
          </div>
          <div className="items-table-container">
            <table className="professional-table">
              <thead>
                <tr>
                  <th className="text-center">#</th>
                  <th>Material</th>
                  <th className="text-right">Quantity</th>
                  <th className="text-right">Unit Price</th>
                  <th className="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {(orderData.salesOrderItems || orderData.items || []).map((item, index) => (
                  <tr key={index}>
                    <td className="text-center">{index + 1}</td>
                    <td>
                      <div className="material-name">
                        <strong>{item.materialName || item.name}</strong>
                        {item.unit && <span className="material-unit">({item.unit})</span>}
                      </div>
                    </td>
                    <td className="text-right">{(parseFloat(item.quantity) || 0).toFixed(3)}</td>
                    <td className="text-right">{formatCurrency(item.unitPrice || item.rate)}</td>
                    <td className="text-right strong">
                      {formatCurrency(item.totalPrice || (item.quantity * (item.unitPrice || item.rate)))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Batch Allocations Section - Only for delivered orders with COGS */}
        {isDelivered && hasCOGS && (
          <div className="allocations-card">
            <div className="allocations-card-header">
              <Layers size={18} />
              <h3>FIFO Batch Allocations</h3>
              <span className="allocations-badge">
                <TrendingUp size={14} />
                COGS Tracked
              </span>
            </div>
            <div className="allocations-card-body">
              {/* Gross Margin Summary */}
              <div className="margin-summary">
                <div className="margin-item">
                  <span className="margin-label">Total Revenue</span>
                  <span className="margin-value revenue">{formatCurrency(orderData.totalAmount)}</span>
                </div>
                <div className="margin-item">
                  <span className="margin-label">Total COGS</span>
                  <span className="margin-value cogs">{formatCurrency(orderData.cogs)}</span>
                </div>
                <div className="margin-item highlight">
                  <span className="margin-label">Gross Profit</span>
                  <span className={`margin-value ${(orderData.totalAmount - orderData.cogs) >= 0 ? 'positive' : 'negative'}`}>
                    {formatCurrency(orderData.totalAmount - orderData.cogs)}
                    {orderData.totalAmount > 0 && (
                      <span className="margin-percent">
                        ({(((orderData.totalAmount - orderData.cogs) / orderData.totalAmount) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Per-Item COGS Breakdown */}
              <div className="item-allocations">
                <h4 className="allocations-subtitle">Per-Item Cost Breakdown</h4>
                {(orderData.salesOrderItems || orderData.items || []).map((item, index) => (
                  <div key={index} className="allocation-item">
                    <div
                      className="allocation-item-header"
                      onClick={() => item.batchAllocations?.length > 0 && toggleAllocation(index)}
                      style={{ cursor: item.batchAllocations?.length > 0 ? 'pointer' : 'default' }}
                    >
                      <div className="allocation-item-info">
                        <span className="allocation-material">{item.materialName || item.name}</span>
                        <span className="allocation-qty">{(parseFloat(item.quantity) || 0).toFixed(3)} {item.unit}</span>
                      </div>
                      <div className="allocation-item-cogs">
                        <span className="cogs-label">COGS:</span>
                        <span className="cogs-value">{formatCurrency(item.cogs || 0)}</span>
                        {item.batchAllocations?.length > 0 && (
                          <span className="expand-icon">
                            {expandedAllocations[index] ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Expanded Batch Details */}
                    {expandedAllocations[index] && item.batchAllocations && (
                      <div className="batch-details">
                        <table className="batch-table">
                          <thead>
                            <tr>
                              <th><Hash size={12} /> Batch</th>
                              <th>Purchase Date</th>
                              <th className="text-right">Qty</th>
                              <th className="text-right">Unit Cost</th>
                              <th className="text-right">COGS</th>
                            </tr>
                          </thead>
                          <tbody>
                            {item.batchAllocations.map((alloc, allocIdx) => (
                              <tr key={allocIdx}>
                                <td className="batch-number">{alloc.batchNumber}</td>
                                <td>{formatDate(alloc.purchaseDate)}</td>
                                <td className="text-right">{(parseFloat(alloc.quantity) || 0).toFixed(3)}</td>
                                <td className="text-right">{formatCurrency(alloc.unitCost)}</td>
                                <td className="text-right">{formatCurrency(alloc.cogs)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {/* If no batch allocations available yet, show pending message */}
                    {!item.batchAllocations && (
                      <div className="no-allocations">
                        <AlertTriangle size={14} />
                        <span>Batch allocation details not available</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Pending FIFO Message for non-delivered orders */}
        {!isDelivered && orderData.status !== 'cancelled' && orderData.status !== 'draft' && (
          <div className="pending-fifo-card">
            <AlertTriangle size={18} />
            <div className="pending-fifo-content">
              <strong>Pending FIFO Allocation</strong>
              <p>COGS will be calculated when this order is marked as delivered. The system will use FIFO (First-In-First-Out) to allocate inventory batches.</p>
            </div>
          </div>
        )}

        {/* Financial Summary Card */}
        <div className="financial-card">
          <div className="financial-card-header">
            <Banknote size={18} />
            <h3>Financial Summary</h3>
          </div>
          <div className="financial-card-body">
            <div className="summary-row">
              <span className="summary-label">Subtotal</span>
              <span className="summary-value">{formatCurrency(orderData.subtotal)}</span>
            </div>
            {parseFloat(orderData.discountAmount) > 0 && (
              <div className="summary-row">
                <span className="summary-label">Discount</span>
                <span className="summary-value discount">- {formatCurrency(orderData.discountAmount)}</span>
              </div>
            )}
            {parseFloat(orderData.taxAmount || orderData.vatAmount) > 0 && (
              <div className="summary-row">
                <span className="summary-label">VAT</span>
                <span className="summary-value">{formatCurrency(orderData.taxAmount || orderData.vatAmount)}</span>
              </div>
            )}
            {parseFloat(orderData.shippingCost) > 0 && (
              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-value">{formatCurrency(orderData.shippingCost)}</span>
              </div>
            )}
            <div className="summary-row total">
              <span className="summary-label strong">Total Amount</span>
              <span className="summary-value strong">{formatCurrency(orderData.totalAmount || orderData.total)}</span>
            </div>
          </div>
        </div>

        {/* Notes Section */}
        {orderData.notes && (
          <div className="notes-card">
            <div className="notes-card-header">
              <FileText size={18} />
              <h3>Notes</h3>
            </div>
            <div className="notes-card-body">
              {orderData.notes}
            </div>
          </div>
        )}

        {/* Special Instructions */}
        {orderData.specialInstructions && (
          <div className="notes-card">
            <div className="notes-card-header">
              <AlertTriangle size={18} />
              <h3>Special Instructions</h3>
            </div>
            <div className="notes-card-body">
              {orderData.specialInstructions}
            </div>
          </div>
        )}

        {/* E-Invoice Actions */}
        <div className="my-4 p-3 bg-slate-50 border border-slate-200 rounded-lg">
          <div className="text-[10px] uppercase font-bold tracking-widest text-slate-500 mb-2">
            Oman E-Invoicing (OTA)
          </div>
          {!hasEInvoice ? (
            <button
              className="btn btn-primary btn-sm"
              onClick={handleGenerateEInvoice}
              disabled={generatingInvoice}
            >
              <FileCode size={14} />
              {generatingInvoice ? 'Generating...' : 'Generate E-Invoice'}
            </button>
          ) : (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs text-emerald-700 font-mono">
                ✓ Invoice: {orderData.invoiceNumber}
              </span>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => einvoicingService.downloadPdf(orderData.id)}
              >
                <FileDown size={14} /> PDF
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => einvoicingService.downloadXml(orderData.id)}
              >
                <FileCode size={14} /> UBL XML
              </button>
              <button
                className="btn btn-outline btn-sm"
                onClick={() => window.open(einvoicingService.getQrUrl(orderData.id), '_blank')}
              >
                <QrCode size={14} /> QR
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {onEdit && (
            <button
              className="btn btn-primary"
              onClick={() => {
                onEdit(orderData);
                onClose();
              }}
            >
              Edit Order
            </button>
          )}
        </div>
      </div>
    </Modal>
  );
};

export default SalesOrderViewModal;
