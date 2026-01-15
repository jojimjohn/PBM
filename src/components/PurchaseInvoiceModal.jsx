import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import FileUpload from './ui/FileUpload';
import { useSystemSettings } from '../context/SystemSettingsContext';
import purchaseInvoiceService from '../services/purchaseInvoiceService';
import purchaseOrderService from '../services/purchaseOrderService';
import uploadService from '../services/uploadService';
import { FileText, Banknote, Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import './PurchaseInvoiceModal.css';

const PurchaseInvoiceModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess
}) => {
  const { formatCurrency, formatDate } = useSystemSettings();

  const [mode, setMode] = useState('list'); // 'list', 'create', 'view', 'payment'
  const [invoices, setInvoices] = useState([]);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Multi-PO Vendor Bill state (Sprint 4.5)
  const [billType, setBillType] = useState('company'); // 'company' or 'vendor'
  const [selectedPOs, setSelectedPOs] = useState([]);
  const [availablePOs, setAvailablePOs] = useState([]);

  // Generate auto invoice number
  const generateInvoiceNumber = () => {
    const year = new Date().getFullYear();
    const timestamp = Date.now().toString().slice(-6);
    return `INV-${year}-${timestamp}`;
  };

  // Form states
  const [formData, setFormData] = useState({
    invoiceNumber: generateInvoiceNumber(),
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceAmount: '',
    paymentTermsDays: 0,
    notes: ''
  });

  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'bank_transfer',
    reference: '',
    notes: ''
  });

  // Load invoices for this PO
  useEffect(() => {
    if (isOpen && purchaseOrder) {
      loadInvoices();
    }
  }, [isOpen, purchaseOrder]);

  // Load unbilled POs when vendor bill type selected (Sprint 4.5 - Task 7.4)
  useEffect(() => {
    if (billType === 'vendor' && mode === 'create') {
      loadUnbilledPOs();
    }
  }, [billType, mode]);

  // Calculate total from PO items (collected qty × rate)
  const calculateItemsTotal = (po) => {
    if (!po?.items || po.items.length === 0) {
      // Fallback to stored totalAmount if no items
      return parseFloat(po?.totalAmount) || 0;
    }

    return po.items.reduce((sum, item) => {
      const qty = parseFloat(item.quantityOrdered) || parseFloat(item.quantityReceived) || 0;
      const rate = parseFloat(item.unitPrice) || parseFloat(item.contractRate) || 0;
      const itemTotal = parseFloat(item.totalPrice) || (qty * rate);
      return sum + itemTotal;
    }, 0);
  };

  // Prefill form when entering create mode
  useEffect(() => {
    if (mode === 'create' && purchaseOrder) {
      // Calculate invoice amount from items (qty × rate) for accuracy
      const calculatedTotal = calculateItemsTotal(purchaseOrder);

      setFormData(prev => ({
        ...prev,
        invoiceNumber: prev.invoiceNumber || generateInvoiceNumber(),
        // Prefill invoice amount from calculated items total (WCN finalized values)
        invoiceAmount: calculatedTotal > 0 ? calculatedTotal.toFixed(3) : prev.invoiceAmount
      }));
    }
  }, [mode, purchaseOrder]);

  const loadInvoices = async () => {
    if (!purchaseOrder) return;

    setLoading(true);
    try {
      const result = await purchaseInvoiceService.getByPurchaseOrder(purchaseOrder.id);
      if (result.success) {
        setInvoices(result.data);
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load unbilled POs for vendor bill creation (Sprint 4.5)
  const loadUnbilledPOs = async () => {
    setLoading(true);
    try {
      const result = await purchaseOrderService.getUnbilledPOs();
      if (result.success) {
        setAvailablePOs(result.data || []);
      } else {
        setMessage({ type: 'error', text: 'Failed to load unbilled purchase orders' });
      }
    } catch (error) {
      console.error('Error loading unbilled POs:', error);
      setMessage({ type: 'error', text: 'Failed to load unbilled purchase orders' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    // Validation
    if (!formData.invoiceNumber.trim()) {
      setMessage({ type: 'error', text: 'Invoice number is required' });
      return;
    }

    if (!formData.invoiceAmount || parseFloat(formData.invoiceAmount) <= 0) {
      setMessage({ type: 'error', text: 'Valid invoice amount is required' });
      return;
    }

    // Vendor bill specific validation (Sprint 4.5 - Task 7.5)
    if (billType === 'vendor') {
      if (selectedPOs.length === 0) {
        setMessage({ type: 'error', text: 'Please select at least one purchase order for vendor bill' });
        return;
      }

      // Validate all POs belong to same supplier
      const suppliers = [...new Set(selectedPOs.map(po => po.supplierId))];
      if (suppliers.length > 1) {
        setMessage({ type: 'error', text: 'All selected purchase orders must belong to the same supplier' });
        return;
      }
    }

    setLoading(true);
    try {
      let result;

      if (billType === 'vendor') {
        // Create vendor bill covering multiple POs (Sprint 4.5)
        result = await purchaseInvoiceService.createVendorBill({
          ...formData,
          coversPurchaseOrders: selectedPOs.map(po => po.id),
          supplierId: selectedPOs[0].supplierId
        });
      } else {
        // Create company bill for single PO
        result = await purchaseInvoiceService.create({
          ...formData,
          purchaseOrderId: purchaseOrder.id,
          supplierId: purchaseOrder.supplierId
        });
      }

      if (result.success) {
        const billTypeText = billType === 'vendor' ? 'Vendor bill' : 'Invoice';
        const poCount = billType === 'vendor' ? ` (covering ${selectedPOs.length} POs)` : '';
        setMessage({ type: 'success', text: `${billTypeText} created successfully${poCount}` });
        await loadInvoices();
        setMode('list');
        resetForm();
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create invoice' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to create invoice' });
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' });

    if (!paymentData.amount || parseFloat(paymentData.amount) <= 0) {
      setMessage({ type: 'error', text: 'Valid payment amount is required' });
      return;
    }

    setLoading(true);
    try {
      const result = await purchaseInvoiceService.recordPayment(
        selectedInvoice.id,
        paymentData
      );

      if (result.success) {
        setMessage({ type: 'success', text: 'Payment recorded successfully' });
        await loadInvoices();
        setMode('list');
        resetPaymentForm();
        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to record payment' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: error.message || 'Failed to record payment' });
    } finally {
      setLoading(false);
    }
  };

  const handleViewInvoice = (invoice) => {
    setSelectedInvoice(invoice);
    setMode('view');
  };

  const handlePaymentMode = (invoice) => {
    setSelectedInvoice(invoice);
    setPaymentData({
      ...paymentData,
      amount: invoice.balance_due
    });
    setMode('payment');
  };

  const resetForm = () => {
    // Calculate from items for accuracy
    const calculatedTotal = calculateItemsTotal(purchaseOrder);

    setFormData({
      invoiceNumber: generateInvoiceNumber(),
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      // Prefill invoice amount from calculated items total (WCN finalized values)
      invoiceAmount: calculatedTotal > 0 ? calculatedTotal.toFixed(3) : '',
      paymentTermsDays: 0,
      notes: ''
    });
    setBillType('company');
    setSelectedPOs([]);
    setAvailablePOs([]);
  };

  const resetPaymentForm = () => {
    setPaymentData({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'bank_transfer',
      reference: '',
      notes: ''
    });
  };

  const handleClose = () => {
    setMode('list');
    resetForm();
    resetPaymentForm();
    setMessage({ type: '', text: '' });
    onClose();
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      unpaid: { label: 'Unpaid', color: '#f59e0b', icon: Clock },
      partial: { label: 'Partially Paid', color: '#3b82f6', icon: Clock },
      paid: { label: 'Paid', color: '#10b981', icon: CheckCircle },
      overdue: { label: 'Overdue', color: '#ef4444', icon: AlertCircle }
    };

    const config = statusConfig[status] || statusConfig.unpaid;
    const Icon = config.icon;

    return (
      <span
        className="invoice-status-badge"
        style={{ backgroundColor: `${config.color}20`, color: config.color }}
      >
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  // Render invoice list
  const renderInvoiceList = () => (
    <div className="invoice-list-container">
      <div className="invoice-list-header">
        <h3>Invoices for {purchaseOrder?.orderNumber}</h3>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setMode('create')}
        >
          <FileText size={16} />
          Create Invoice
        </button>
      </div>

      {invoices.length === 0 ? (
        <div className="invoice-empty-state">
          <FileText size={48} />
          <p>No invoices created for this purchase order</p>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setMode('create')}
          >
            Create First Invoice
          </button>
        </div>
      ) : (
        <div className="invoice-list">
          {invoices.map((invoice) => (
            <div key={invoice.id} className="invoice-card">
              <div className="invoice-card-header">
                <div>
                  <h4>{invoice.invoice_number}</h4>
                  <p className="invoice-card-date">
                    {formatDate(invoice.invoice_date)}
                  </p>
                </div>
                {getStatusBadge(invoice.payment_status)}
              </div>

              <div className="invoice-card-body">
                <div className="invoice-card-row">
                  <span className="invoice-card-label">Amount:</span>
                  <span className="invoice-card-value">
                    {formatCurrency(invoice.invoice_amount)}
                  </span>
                </div>
                <div className="invoice-card-row">
                  <span className="invoice-card-label">Paid:</span>
                  <span className="invoice-card-value">
                    {formatCurrency(invoice.paid_amount)}
                  </span>
                </div>
                <div className="invoice-card-row">
                  <span className="invoice-card-label">Balance:</span>
                  <span className="invoice-card-value invoice-card-balance">
                    {formatCurrency(invoice.balance_due)}
                  </span>
                </div>
              </div>

              <div className="invoice-card-actions">
                <button
                  type="button"
                  className="btn-invoice-action btn-view"
                  onClick={() => handleViewInvoice(invoice)}
                >
                  View Details
                </button>
                {invoice.balance_due > 0 && (
                  <button
                    type="button"
                    className="btn-invoice-action btn-payment"
                    onClick={() => handlePaymentMode(invoice)}
                  >
                    <Banknote size={16} />
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render create invoice form
  const renderCreateForm = () => (
    <form onSubmit={handleCreateInvoice}>
      <div className="modal-header">
        <h3 className="modal-title">
          <FileText size={20} />
          Create New Invoice
        </h3>
      </div>

      <div className="modal-body">
        {/* Bill Type Selector (Sprint 4.5 - Task 7.2) */}
        <div className="ds-form-section">
          <h4><Banknote size={16} /> Bill Type</h4>
          <div className="bill-type-selector">
            <label className={`bill-type-option ${billType === 'company' ? 'active' : ''}`}>
              <input
                type="radio"
                name="billType"
                value="company"
                checked={billType === 'company'}
                onChange={(e) => setBillType(e.target.value)}
              />
              <div className="bill-type-content">
                <strong>Company Bill</strong>
                <small>One invoice for one purchase order</small>
              </div>
            </label>
            <label className={`bill-type-option ${billType === 'vendor' ? 'active' : ''}`}>
              <input
                type="radio"
                name="billType"
                value="vendor"
                checked={billType === 'vendor'}
                onChange={(e) => setBillType(e.target.value)}
              />
              <div className="bill-type-content">
                <strong>Vendor Bill</strong>
                <small>One invoice covering multiple purchase orders</small>
              </div>
            </label>
          </div>
        </div>

        {/* Invoice Details Section */}
        <div className="ds-form-section">
          <h4><FileText size={16} /> Invoice Details</h4>
          <div className="ds-form-grid">
            <div className="ds-form-group">
              <label className="ds-form-label">
                Invoice Number <span className="required">*</span>
              </label>
              <input
                type="text"
                value={formData.invoiceNumber}
                onChange={(e) => setFormData({ ...formData, invoiceNumber: e.target.value })}
                placeholder="INV-2025-001"
                required
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">
                Invoice Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={formData.invoiceDate}
                onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        {/* Multi-PO Selector for Vendor Bills (Sprint 4.5 - Task 7.3) */}
        {billType === 'vendor' && (
          <div className="ds-form-section">
            <h4>Select Purchase Orders <span className="required">*</span></h4>
            {loading && availablePOs.length === 0 ? (
              <div className="loading-pos">Loading unbilled purchase orders...</div>
            ) : availablePOs.length === 0 ? (
              <div className="no-pos">No unbilled purchase orders available</div>
            ) : (
              <div className="po-selector">
                <div className="po-selector-header">
                  <span>{selectedPOs.length} of {availablePOs.length} selected</span>
                  {selectedPOs.length > 0 && (
                    <span className="po-total">
                      Total: {formatCurrency(selectedPOs.reduce((sum, po) => sum + (parseFloat(po.totalAmount) || 0), 0))}
                    </span>
                  )}
                </div>
                <div className="po-selector-list">
                  {availablePOs.map((po) => {
                    const isSelected = selectedPOs.some(p => p.id === po.id);
                    return (
                      <label key={po.id} className={`po-selector-item ${isSelected ? 'selected' : ''}`}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedPOs([...selectedPOs, po]);
                            } else {
                              setSelectedPOs(selectedPOs.filter(p => p.id !== po.id));
                            }
                          }}
                        />
                        <div className="po-selector-info">
                          <div className="po-selector-header-row">
                            <strong>{po.orderNumber}</strong>
                            <span className="po-selector-amount">{formatCurrency(po.totalAmount)}</span>
                          </div>
                          <div className="po-selector-details">
                            <span>{po.supplierName}</span>
                            <span>•</span>
                            <span>{formatDate(po.orderDate)}</span>
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Payment Information Section */}
        <div className="ds-form-section">
          <h4><Calendar size={16} /> Payment Information</h4>
          <div className="ds-form-grid">
            <div className="ds-form-group">
              <label className="ds-form-label">
                Invoice Amount (OMR) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                value={formData.invoiceAmount}
                onChange={(e) => setFormData({ ...formData, invoiceAmount: e.target.value })}
                placeholder="0.000"
                required
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Payment Terms (Days)</label>
              <input
                type="number"
                value={formData.paymentTermsDays}
                onChange={(e) => setFormData({ ...formData, paymentTermsDays: e.target.value })}
                placeholder="30"
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Due Date</label>
              <input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="ds-form-section">
          <div className="ds-form-group full-width">
            <label className="ds-form-label">Notes</label>
            <textarea
              rows="3"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional notes..."
            />
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setMode('list')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={loading}
        >
          {loading ? 'Creating...' : 'Create Invoice'}
        </button>
      </div>
    </form>
  );

  // Render payment form
  const renderPaymentForm = () => (
    <form onSubmit={handleRecordPayment}>
      <div className="modal-header">
        <h3 className="modal-title">
          <Banknote size={20} />
          Record Payment
        </h3>
      </div>

      <div className="modal-body">
        {/* Invoice Summary */}
        <div className="ds-form-section info">
          <h4><FileText size={16} /> Invoice Summary</h4>
          <div className="payment-summary">
            <div className="payment-summary-row">
              <span>Invoice Number:</span>
              <strong>{selectedInvoice?.invoice_number}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Invoice Amount:</span>
              <strong>{formatCurrency(selectedInvoice?.invoice_amount)}</strong>
            </div>
            <div className="payment-summary-row">
              <span>Already Paid:</span>
              <strong>{formatCurrency(selectedInvoice?.paid_amount)}</strong>
            </div>
            <div className="payment-summary-row highlight">
              <span>Balance Due:</span>
              <strong>{formatCurrency(selectedInvoice?.balance_due)}</strong>
            </div>
          </div>
        </div>

        {/* Payment Details */}
        <div className="ds-form-section">
          <h4><Banknote size={16} /> Payment Details</h4>
          <div className="ds-form-grid">
            <div className="ds-form-group">
              <label className="ds-form-label">
                Payment Amount (OMR) <span className="required">*</span>
              </label>
              <input
                type="number"
                step="0.001"
                value={paymentData.amount}
                onChange={(e) => setPaymentData({ ...paymentData, amount: e.target.value })}
                max={selectedInvoice?.balance_due}
                required
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">
                Payment Date <span className="required">*</span>
              </label>
              <input
                type="date"
                value={paymentData.paymentDate}
                onChange={(e) => setPaymentData({ ...paymentData, paymentDate: e.target.value })}
                required
              />
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">
                Payment Method <span className="required">*</span>
              </label>
              <select
                value={paymentData.paymentMethod}
                onChange={(e) => setPaymentData({ ...paymentData, paymentMethod: e.target.value })}
                required
              >
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cheque">Cheque</option>
                <option value="cash">Cash</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="ds-form-group">
              <label className="ds-form-label">Reference</label>
              <input
                type="text"
                value={paymentData.reference}
                onChange={(e) => setPaymentData({ ...paymentData, reference: e.target.value })}
                placeholder="Transaction ID / Cheque Number"
              />
            </div>

            <div className="ds-form-group full-width">
              <label className="ds-form-label">Notes</label>
              <textarea
                rows="2"
                value={paymentData.notes}
                onChange={(e) => setPaymentData({ ...paymentData, notes: e.target.value })}
                placeholder="Payment notes..."
              />
            </div>
          </div>
        </div>
      </div>

      <div className="modal-footer">
        <button
          type="button"
          className="btn btn-outline"
          onClick={() => setMode('list')}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-success"
          disabled={loading}
        >
          {loading ? 'Recording...' : 'Record Payment'}
        </button>
      </div>
    </form>
  );

  // Render invoice details view
  const renderInvoiceView = () => (
    <div className="invoice-view">
      <div className="invoice-view-header">
        <h3>Invoice Details</h3>
        <button
          type="button"
          className="btn-back"
          onClick={() => setMode('list')}
        >
          ← Back to List
        </button>
      </div>

      <div className="invoice-view-body">
        <div className="invoice-view-section">
          <h4>Invoice Information</h4>
          <div className="invoice-view-grid">
            <div className="invoice-view-field">
              <label>Invoice Number:</label>
              <span>{selectedInvoice?.invoice_number}</span>
            </div>
            <div className="invoice-view-field">
              <label>Status:</label>
              {getStatusBadge(selectedInvoice?.payment_status)}
            </div>
            <div className="invoice-view-field">
              <label>Invoice Date:</label>
              <span>{formatDate(selectedInvoice?.invoice_date)}</span>
            </div>
            <div className="invoice-view-field">
              <label>Due Date:</label>
              <span>{selectedInvoice?.due_date ? formatDate(selectedInvoice.due_date) : 'N/A'}</span>
            </div>
          </div>
        </div>

        <div className="invoice-view-section">
          <h4>Payment Details</h4>
          <div className="invoice-view-grid">
            <div className="invoice-view-field">
              <label>Invoice Amount:</label>
              <span className="invoice-view-amount">{formatCurrency(selectedInvoice?.invoice_amount)}</span>
            </div>
            <div className="invoice-view-field">
              <label>Paid Amount:</label>
              <span className="invoice-view-amount">{formatCurrency(selectedInvoice?.paid_amount)}</span>
            </div>
            <div className="invoice-view-field highlight">
              <label>Balance Due:</label>
              <span className="invoice-view-amount">{formatCurrency(selectedInvoice?.balance_due)}</span>
            </div>
            <div className="invoice-view-field">
              <label>Payment Terms:</label>
              <span>{selectedInvoice?.payment_terms_days || 0} days</span>
            </div>
          </div>
        </div>

        {selectedInvoice?.notes && (
          <div className="invoice-view-section">
            <h4>Notes</h4>
            <p className="invoice-view-notes">{selectedInvoice.notes}</p>
          </div>
        )}

        {/* Invoice Attachment */}
        <div className="invoice-view-section">
          <h4>Invoice Document</h4>
          <FileUpload
            mode="single"
            accept=".pdf,.jpg,.jpeg,.png"
            maxSize={5242880}
            onUpload={async (file) => {
              const result = await uploadService.uploadSingleFile('invoices', selectedInvoice.id, file);
              if (result.success) {
                // Refresh invoices to get updated attachment
                await loadInvoices();
                // Update selected invoice
                const updated = await purchaseInvoiceService.getById(selectedInvoice.id);
                if (updated.success) {
                  setSelectedInvoice(updated.data);
                }
                setMessage({ type: 'success', text: 'Invoice document uploaded successfully' });
              } else {
                setMessage({ type: 'error', text: 'Failed to upload document: ' + result.error });
              }
            }}
            onDelete={async () => {
              const result = await uploadService.deleteSingleFile('invoices', selectedInvoice.id);
              if (result.success) {
                // Refresh invoices to get updated attachment
                await loadInvoices();
                // Update selected invoice
                const updated = await purchaseInvoiceService.getById(selectedInvoice.id);
                if (updated.success) {
                  setSelectedInvoice(updated.data);
                }
                setMessage({ type: 'success', text: 'Invoice document deleted successfully' });
              } else {
                setMessage({ type: 'error', text: 'Failed to delete document: ' + result.error });
              }
            }}
            existingFiles={selectedInvoice?.attachment ? [{
              filename: selectedInvoice.attachment.split('/').pop(),
              originalName: selectedInvoice.attachment.split('/').pop(),
              path: selectedInvoice.attachment,
              size: 0
            }] : []}
          />
        </div>

        {selectedInvoice?.balance_due > 0 && (
          <div className="invoice-view-actions">
            <button
              type="button"
              className="btn-payment-large"
              onClick={() => handlePaymentMode(selectedInvoice)}
            >
              <Banknote size={18} />
              Record Payment
            </button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Purchase Invoices"
      className="ds-form-modal ds-modal-lg purchase-invoice-modal"
      closeOnOverlayClick={false}
    >
      {message.text && (
        <div className={`ds-alert ds-alert-${message.type}`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      {mode === 'list' && renderInvoiceList()}
      {mode === 'create' && renderCreateForm()}
      {mode === 'view' && renderInvoiceView()}
      {mode === 'payment' && renderPaymentForm()}
    </Modal>
  );
};

export default PurchaseInvoiceModal;
