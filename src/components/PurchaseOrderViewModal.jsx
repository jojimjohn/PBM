import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import {
  FileText, Calendar, User, Package, Banknote,
  CheckCircle, AlertTriangle, Truck, Edit3, Link2,
  MapPin, Clock, Receipt
} from 'lucide-react';
// CSS moved to global index.css Tailwind
import purchaseOrderService from '../services/purchaseOrderService';
import purchaseOrderExpenseService from '../services/purchaseOrderExpenseService';
import { useSystemSettings } from '../context/SystemSettingsContext';

const PurchaseOrderViewModal = ({
  isOpen,
  onClose,
  orderData,
  onEdit,
  onRefresh,
  t
}) => {
  const [expenses, setExpenses] = useState([]);
  const [loadingExpenses, setLoadingExpenses] = useState(false);

  // Load expenses when modal opens
  useEffect(() => {
    const loadExpenses = async () => {
      if (isOpen && orderData?.id) {
        setLoadingExpenses(true);
        try {
          const result = await purchaseOrderExpenseService.getExpenses(orderData.id);
          if (result.success) {
            setExpenses(result.data?.expenses || []);
          }
        } catch (error) {
          console.error('Error loading PO expenses:', error);
        } finally {
          setLoadingExpenses(false);
        }
      }
    };
    loadExpenses();
  }, [isOpen, orderData?.id]);

  // Calculate total expenses
  const totalExpenses = expenses.reduce((sum, exp) => sum + (parseFloat(exp.amount) || 0), 0);
  const [linking, setLinking] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkFormData, setLinkFormData] = useState({
    collectionOrderId: '',
    notes: ''
  });

  const { formatDate: systemFormatDate, formatCurrency: systemFormatCurrency } = useSystemSettings();

  if (!orderData) return null;

  const formatCurrency = (amount) => {
    return systemFormatCurrency ? systemFormatCurrency(amount) : `OMR ${(parseFloat(amount) || 0).toFixed(3)}`;
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return systemFormatDate ? systemFormatDate(date) : new Date(date).toLocaleDateString();
  };

  const getStatusBadgeClass = (status) => {
    const statusMap = {
      'draft': 'status-draft',
      'pending': 'status-pending',
      'approved': 'status-approved',
      'ordered': 'status-ordered',
      'received': 'status-received',
      'cancelled': 'status-cancelled'
    };
    return statusMap[status?.toLowerCase()] || 'status-draft';
  };

  const handleLinkToWCN = async () => {
    if (!linkFormData.collectionOrderId) {
      alert('Please enter Collection Order ID');
      return;
    }

    try {
      setLinking(true);
      const result = await purchaseOrderService.linkToWCN(orderData.id, {
        collectionOrderId: parseInt(linkFormData.collectionOrderId),
        notes: linkFormData.notes
      });

      if (result.success) {
        alert('Successfully linked PO to WCN! Inventory has been updated.');
        setShowLinkForm(false);
        setLinkFormData({ collectionOrderId: '', notes: '' });
        if (onRefresh) onRefresh();
        onClose();
      } else {
        alert(`Failed to link PO to WCN: ${result.error}`);
      }
    } catch (error) {
      console.error('Error linking PO to WCN:', error);
      alert('An error occurred while linking to WCN');
    } finally {
      setLinking(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      title={`${orderData.orderNumber || `PO #${orderData.id}`} - Purchase Order Details`}
      onClose={onClose}
      className="modal-xl purchase-order-details-modal"
      closeOnOverlayClick={false}
    >
      <div className="order-view-professional">
        {/* Header Section */}
        <div className="order-header">
          <div className="order-icon-container purchase">
            <Package size={24} color="white" />
          </div>
          <div className="order-header-info">
            <h2 className="order-title">
              {orderData.supplierName || 'Purchase Order'}
            </h2>
            <div className="order-badges">
              <span className={`status-badge-large ${getStatusBadgeClass(orderData.status)}`}>
                {orderData.status?.charAt(0).toUpperCase() + orderData.status?.slice(1)}
              </span>

              {/* Source Type Badge - NEW Sprint 4.5 */}
              {orderData.source_type === 'wcn_auto' ? (
                <span className="source-type-badge wcn_auto">
                  <Truck size={14} />
                  AUTO - WCN {orderData.wcn_number}
                </span>
              ) : (
                <span className="source-type-badge manual">
                  <Edit3 size={14} />
                  MANUAL
                  {orderData.collection_order_id && ` - Linked to WCN ${orderData.wcn_number}`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Source Information Card - NEW Sprint 4.5 */}
        <div className="source-info-card">
          <div className="info-card-header">
            <FileText size={18} />
            <h3>Source Information</h3>
          </div>
          <div className="info-card-body">
            {orderData.source_type === 'wcn_auto' ? (
              <div className="source-auto-info">
                <div className="alert-info">
                  <CheckCircle size={16} />
                  <div>
                    <strong>Automatically Generated from WCN Finalization</strong>
                    <div className="alert-subtitle">
                      This purchase order was created automatically when the WCN was finalized.
                      Inventory has already been updated during WCN finalization.
                    </div>
                  </div>
                </div>
                <div className="wcn-details">
                  <div className="info-row">
                    <span className="info-label">WCN Number</span>
                    <span className="info-value strong">{orderData.wcn_number}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Collection Order</span>
                    <span className="info-value">{orderData.collectionOrderNumber || `#${orderData.collection_order_id}`}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="source-manual-info">
                <div className="alert-info">
                  <Edit3 size={16} />
                  <div>
                    <strong>Manually Created Purchase Order</strong>
                    <div className="alert-subtitle">
                      This purchase order was created manually and can be linked to a WCN if applicable.
                    </div>
                  </div>
                </div>

                {orderData.collection_order_id ? (
                  <div className="wcn-linked-details">
                    <div className="alert-success">
                      <CheckCircle size={16} />
                      <span>Linked to WCN: <strong>{orderData.wcn_number}</strong></span>
                    </div>
                    <div className="info-row">
                      <span className="info-label">Collection Order</span>
                      <span className="info-value">{orderData.collectionOrderNumber || `#${orderData.collection_order_id}`}</span>
                    </div>
                  </div>
                ) : (
                  <div className="wcn-link-section">
                    {!showLinkForm ? (
                      <button
                        className="btn-link-wcn"
                        onClick={() => setShowLinkForm(true)}
                      >
                        <Link2 size={16} />
                        Link to WCN
                      </button>
                    ) : (
                      <div className="wcn-link-form">
                        <h4>Link to Waste Consignment Note (WCN)</h4>
                        <div className="form-group">
                          <label>Collection Order ID *</label>
                          <input
                            type="number"
                            className="form-control"
                            placeholder="Enter Collection Order ID"
                            value={linkFormData.collectionOrderId}
                            onChange={(e) => setLinkFormData({
                              ...linkFormData,
                              collectionOrderId: e.target.value
                            })}
                          />
                          <small className="form-help">
                            Enter the ID of the finalized collection order with WCN
                          </small>
                        </div>
                        <div className="form-group">
                          <label>Notes (Optional)</label>
                          <textarea
                            className="form-control"
                            placeholder="Add any notes about this linking..."
                            rows="2"
                            value={linkFormData.notes}
                            onChange={(e) => setLinkFormData({
                              ...linkFormData,
                              notes: e.target.value
                            })}
                          />
                        </div>
                        <div className="form-actions">
                          <button
                            className="btn btn-secondary"
                            onClick={() => {
                              setShowLinkForm(false);
                              setLinkFormData({ collectionOrderId: '', notes: '' });
                            }}
                            disabled={linking}
                          >
                            Cancel
                          </button>
                          <button
                            className="btn btn-primary"
                            onClick={handleLinkToWCN}
                            disabled={linking}
                          >
                            {linking ? 'Linking...' : 'Link to WCN'}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

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
                <span className="info-value">{orderData.orderNumber || `PO-${orderData.id}`}</span>
              </div>
              <div className="info-row">
                <span className="info-label">Order Date</span>
                <span className="info-value">{formatDate(orderData.orderDate)}</span>
              </div>
              {orderData.expectedDeliveryDate && (
                <div className="info-row">
                  <span className="info-label">Expected Delivery</span>
                  <span className="info-value">{formatDate(orderData.expectedDeliveryDate)}</span>
                </div>
              )}
              {orderData.paymentTerms && (
                <div className="info-row">
                  <span className="info-label">Payment Terms</span>
                  <span className="info-value">{orderData.paymentTerms}</span>
                </div>
              )}
            </div>
          </div>

          {/* Supplier Information Card */}
          <div className="info-card">
            <div className="info-card-header">
              <Truck size={18} />
              <h3>Supplier Information</h3>
            </div>
            <div className="info-card-body">
              <div className="info-row">
                <span className="info-label">Supplier</span>
                <span className="info-value strong">{orderData.supplierName}</span>
              </div>
              {orderData.supplierPhone && (
                <div className="info-row">
                  <span className="info-label">Phone</span>
                  <span className="info-value">{orderData.supplierPhone}</span>
                </div>
              )}
              {orderData.supplierEmail && (
                <div className="info-row">
                  <span className="info-label">Email</span>
                  <span className="info-value">{orderData.supplierEmail}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Order Items Section */}
        <div className="items-card">
          <div className="items-card-header">
            <Package size={18} />
            <h3>Order Items ({orderData.itemCount || orderData.items?.length || 0})</h3>
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
                {(orderData.items || []).map((item, index) => {
                  // Use quantityOrdered from backend, fallback to quantity for legacy data
                  const qty = parseFloat(item.quantityOrdered) || parseFloat(item.quantity) || 0;
                  const rate = parseFloat(item.unitPrice) || parseFloat(item.rate) || parseFloat(item.contractRate) || 0;
                  const total = parseFloat(item.totalPrice) || (qty * rate);

                  return (
                    <tr key={index}>
                      <td className="text-center">{index + 1}</td>
                      <td>
                        <div className="material-name">
                          <strong>{item.materialName || item.name}</strong>
                          {item.unit && <span className="material-unit">({item.unit})</span>}
                        </div>
                      </td>
                      <td className="text-right">{qty.toFixed(3)}</td>
                      <td className="text-right">{formatCurrency(rate)}</td>
                      <td className="text-right strong">{formatCurrency(total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Linked Expenses Section */}
        <div className="expenses-card">
          <div className="expenses-card-header">
            <Receipt size={18} />
            <h3>Linked Expenses ({expenses.length})</h3>
          </div>
          {loadingExpenses ? (
            <div className="expenses-loading">Loading expenses...</div>
          ) : expenses.length > 0 ? (
            <div className="expenses-table-container">
              <table className="professional-table">
                <thead>
                  <tr>
                    <th>Category</th>
                    <th>Description</th>
                    <th>Vendor</th>
                    <th className="text-right">Amount</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense, index) => (
                    <tr key={expense.id || index}>
                      <td>
                        <span style={{
                          backgroundColor: '#e0f2fe',
                          color: '#0369a1',
                          padding: '0.25rem 0.5rem',
                          borderRadius: '0.375rem',
                          fontSize: '0.75rem',
                          textTransform: 'capitalize'
                        }}>
                          {(expense.category || '').replace('_', ' ')}
                        </span>
                      </td>
                      <td>{expense.description || '-'}</td>
                      <td>{expense.vendor || '-'}</td>
                      <td className="text-right strong">{formatCurrency(expense.amount)}</td>
                      <td>{formatDate(expense.expenseDate)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan="3" className="text-right strong">Total Expenses:</td>
                    <td className="text-right strong" style={{ color: '#dc2626' }}>{formatCurrency(totalExpenses)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          ) : (
            <div className="expenses-empty">
              <Receipt size={24} style={{ opacity: 0.5, marginBottom: '0.5rem' }} />
              <p>No expenses linked to this purchase order</p>
            </div>
          )}
        </div>

        {/* Financial Summary Card */}
        <div className="financial-card">
          <div className="financial-card-header">
            <Banknote size={18} />
            <h3>Financial Summary</h3>
          </div>
          <div className="financial-card-body">
            <div className="summary-row">
              <span className="summary-label">Subtotal (Items)</span>
              <span className="summary-value">{formatCurrency(orderData.subtotal)}</span>
            </div>
            {parseFloat(orderData.taxAmount) > 0 && (
              <div className="summary-row">
                <span className="summary-label">VAT</span>
                <span className="summary-value">{formatCurrency(orderData.taxAmount)}</span>
              </div>
            )}
            {parseFloat(orderData.shippingCost) > 0 && (
              <div className="summary-row">
                <span className="summary-label">Shipping</span>
                <span className="summary-value">{formatCurrency(orderData.shippingCost)}</span>
              </div>
            )}
            <div className="summary-row">
              <span className="summary-label">Order Total</span>
              <span className="summary-value">{formatCurrency(orderData.totalAmount)}</span>
            </div>
            {totalExpenses > 0 && (
              <div className="summary-row expenses-row">
                <span className="summary-label">+ Linked Expenses</span>
                <span className="summary-value" style={{ color: '#dc2626' }}>{formatCurrency(totalExpenses)}</span>
              </div>
            )}
            <div className="summary-row total grand-total">
              <span className="summary-label strong">Grand Total (with expenses)</span>
              <span className="summary-value strong">{formatCurrency((parseFloat(orderData.totalAmount) || 0) + totalExpenses)}</span>
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

        {/* Action Buttons */}
        <div className="modal-actions">
          <button className="btn btn-secondary" onClick={onClose}>
            Close
          </button>
          {onEdit && orderData.status !== 'received' && (
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

export default PurchaseOrderViewModal;
