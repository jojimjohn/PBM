import React from 'react';
import Modal from './ui/Modal';
import { FileText, Calendar, User, Package, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import './SalesOrderViewModal.css';

const SalesOrderViewModal = ({
  isOpen,
  onClose,
  orderData,
  onEdit,
  t
}) => {
  if (!orderData) return null;

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

        {/* Financial Summary Card */}
        <div className="financial-card">
          <div className="financial-card-header">
            <DollarSign size={18} />
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
