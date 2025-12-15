import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { useSystemSettings } from '../context/SystemSettingsContext';
import { usePermissions } from '../hooks/usePermissions';
import purchaseOrderAmendmentService from '../services/purchaseOrderAmendmentService';
import purchaseOrderService from '../services/purchaseOrderService';
import { FileText, Clock, CheckCircle, XCircle, AlertCircle, Plus, Trash2, ThumbsUp, ThumbsDown, Info } from 'lucide-react';
import './PurchaseOrderAmendmentModal.css';

const PurchaseOrderAmendmentModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  vendors, // Pass vendors from parent
  materials, // Pass materials from parent
  onSuccess
}) => {
  const { formatCurrency, formatDate, vatRate } = useSystemSettings();
  const { hasPermission } = usePermissions();

  const [mode, setMode] = useState('list'); // 'list', 'details', 'create'
  const [amendments, setAmendments] = useState([]);
  const [selectedAmendment, setSelectedAmendment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [approvalNotes, setApprovalNotes] = useState('');

  // Amendment form data
  const [formData, setFormData] = useState({
    reason: '',
    orderDate: '',
    vendorId: '',
    branchId: '',
    paymentTerms: 'immediate',
    expectedDeliveryDate: '',
    shippingCost: '',
    notes: '',
    items: []
  });

  // Load amendments for this PO
  useEffect(() => {
    if (isOpen && purchaseOrder) {
      loadAmendments();
    }
  }, [isOpen, purchaseOrder]);

  const loadAmendments = async () => {
    if (!purchaseOrder) return;

    setLoading(true);
    try {
      const result = await purchaseOrderAmendmentService.getAll(purchaseOrder.id);
      if (result.success) {
        setAmendments(result.data);
      }
    } catch (error) {
      console.error('Error loading amendments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (amendment) => {
    setSelectedAmendment(amendment);
    setApprovalNotes(''); // Clear any previous approval notes
    setMode('details');
  };

  const handleCreateAmendment = () => {
    // Helper to convert ISO date to yyyy-MM-dd format
    const formatDateForInput = (dateString) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return '';
      return date.toISOString().split('T')[0]; // Returns yyyy-MM-dd
    };

    // Initialize form with current PO data
    setFormData({
      reason: '',
      orderDate: formatDateForInput(purchaseOrder?.orderDate) || '',
      vendorId: purchaseOrder?.supplierId || purchaseOrder?.vendorId || '', // Database uses supplierId
      branchId: purchaseOrder?.branch_id || purchaseOrder?.branchId || '', // Database uses branch_id
      paymentTerms: purchaseOrder?.paymentTerms || 'immediate',
      expectedDeliveryDate: formatDateForInput(purchaseOrder?.expectedDeliveryDate) || '',
      shippingCost: purchaseOrder?.shippingCost || '',
      notes: purchaseOrder?.notes || '',
      items: (purchaseOrder?.items || []).map(item => ({
        id: item.id,
        materialId: item.materialId,
        materialName: item.materialName,
        quantity: item.quantityOrdered || item.quantity,
        rate: item.unitPrice || item.rate,
        amount: item.totalPrice || item.amount
      }))
    });
    setMode('create');
  };

  const handleBackToList = () => {
    setMode('list');
    setSelectedAmendment(null);
    setFormData({
      reason: '',
      orderDate: '',
      vendorId: '',
      branchId: '',
      paymentTerms: 'immediate',
      expectedDeliveryDate: '',
      shippingCost: '',
      notes: '',
      items: []
    });
    setMessage({ type: '', text: '' });
  };

  const handleClose = () => {
    setMode('list');
    setSelectedAmendment(null);
    setApprovalNotes(''); // Clear approval notes
    setFormData({
      reason: '',
      orderDate: '',
      vendorId: '',
      branchId: '',
      paymentTerms: 'immediate',
      expectedDeliveryDate: '',
      shippingCost: '',
      notes: '',
      items: []
    });
    setMessage({ type: '', text: '' });
    onClose();
  };

  const handleSubmitAmendment = async (e) => {
    e.preventDefault();

    if (!formData.reason || formData.reason.trim().length < 10) {
      setMessage({ type: 'error', text: 'Reason must be at least 10 characters' });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const amendmentData = {
        originalOrderId: purchaseOrder.id,
        reason: formData.reason.trim(),
        orderDate: formData.orderDate || null,
        vendorId: formData.vendorId && formData.vendorId !== '' ? parseInt(formData.vendorId) : null,
        branchId: formData.branchId && formData.branchId !== '' ? parseInt(formData.branchId) : null,
        paymentTerms: formData.paymentTerms || null,
        expectedDeliveryDate: formData.expectedDeliveryDate || null,
        shippingCost: formData.shippingCost ? parseFloat(formData.shippingCost) : null,
        notes: formData.notes || null,
        items: formData.items.length > 0 ? formData.items.map(item => ({
          id: item.id || null,
          materialId: parseInt(item.materialId),
          quantity: parseFloat(item.quantity),
          rate: parseFloat(item.rate),
          amount: parseFloat(item.amount)
        })) : null
      };

      const result = await purchaseOrderAmendmentService.create(amendmentData);

      if (result.success) {
        setMessage({ type: 'success', text: result.message || 'Amendment proposal created successfully. Awaiting approval.' });
        await loadAmendments();
        setMode('list');
        if (onSuccess) {
          onSuccess();
        }
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create amendment' });
      }
    } catch (error) {
      console.error('Error creating amendment:', error);
      setMessage({ type: 'error', text: 'Failed to create amendment. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleItemChange = (index, field, value) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;

    // Recalculate amount if quantity or rate changes
    if (field === 'quantity' || field === 'rate') {
      const qty = parseFloat(updatedItems[index].quantity) || 0;
      const rate = parseFloat(updatedItems[index].rate) || 0;
      updatedItems[index].amount = (qty * rate).toFixed(3);
    }

    setFormData({ ...formData, items: updatedItems });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = formData.items.filter((_, i) => i !== index);
    setFormData({ ...formData, items: updatedItems });
  };

  const handleAddItem = () => {
    setFormData({
      ...formData,
      items: [...formData.items, {
        materialId: '',
        materialName: '',
        quantity: '',
        rate: '',
        amount: 0
      }]
    });
  };

  const handleApproveAmendment = async () => {
    if (!selectedAmendment) return;

    if (!window.confirm('Are you sure you want to approve this amendment? This will apply the changes to the purchase order.')) {
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await purchaseOrderService.approveAmendment(selectedAmendment.id, {
        status: 'approved',
        notes: approvalNotes
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Amendment approved successfully!' });
        setApprovalNotes('');

        // Refresh amendments list
        await loadAmendments();

        // Notify parent to refresh PO data
        if (onSuccess) onSuccess();

        // Return to list after short delay
        setTimeout(() => {
          setMode('list');
          setSelectedAmendment(null);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to approve amendment' });
      }
    } catch (error) {
      console.error('Error approving amendment:', error);
      setMessage({ type: 'error', text: 'An error occurred while approving the amendment' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRejectAmendment = async () => {
    if (!selectedAmendment) return;

    if (!approvalNotes || approvalNotes.trim().length < 10) {
      setMessage({ type: 'error', text: 'Please provide a reason for rejection (minimum 10 characters)' });
      return;
    }

    if (!window.confirm('Are you sure you want to reject this amendment?')) {
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await purchaseOrderService.approveAmendment(selectedAmendment.id, {
        status: 'rejected',
        notes: approvalNotes
      });

      if (result.success) {
        setMessage({ type: 'success', text: 'Amendment rejected successfully!' });
        setApprovalNotes('');

        // Refresh amendments list
        await loadAmendments();

        // Return to list after short delay
        setTimeout(() => {
          setMode('list');
          setSelectedAmendment(null);
          setMessage({ type: '', text: '' });
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to reject amendment' });
      }
    } catch (error) {
      console.error('Error rejecting amendment:', error);
      setMessage({ type: 'error', text: 'An error occurred while rejecting the amendment' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Pending Approval', color: '#f59e0b', icon: Clock },
      approved: { label: 'Approved', color: '#10b981', icon: CheckCircle },
      rejected: { label: 'Rejected', color: '#ef4444', icon: XCircle }
    };

    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;

    return (
      <span
        className="amendment-status-badge"
        style={{ backgroundColor: `${config.color}20`, color: config.color }}
      >
        <Icon size={14} />
        {config.label}
      </span>
    );
  };

  // Format payment terms for display
  const formatPaymentTerms = (term) => {
    const termsMap = {
      'immediate': 'Immediate',
      'net_30': 'Net 30 Days',
      'net_60': 'Net 60 Days',
      'net_90': 'Net 90 Days',
      'advance': 'Advance Payment',
      'cod': 'Cash on Delivery'
    };
    return termsMap[term] || term;
  };

  // Render proposed changes in user-friendly format
  const renderProposedChanges = (proposedChanges, originalPO) => {
    if (!proposedChanges || !originalPO) return null;

    const changes = [];

    // Field-level changes
    const fieldChanges = [
      {
        label: 'Order Date',
        oldValue: originalPO.orderDate ? formatDate(originalPO.orderDate) : '-',
        newValue: proposedChanges.orderDate ? formatDate(proposedChanges.orderDate) : '-',
        hasChanged: proposedChanges.orderDate && originalPO.orderDate !== proposedChanges.orderDate
      },
      {
        label: 'Supplier',
        oldValue: vendors?.find(v => v.id === originalPO.supplierId)?.name || '-',
        newValue: vendors?.find(v => v.id === proposedChanges.supplierId)?.name || '-',
        hasChanged: proposedChanges.supplierId && originalPO.supplierId !== proposedChanges.supplierId
      },
      {
        label: 'Payment Terms',
        oldValue: formatPaymentTerms(originalPO.paymentTerms),
        newValue: formatPaymentTerms(proposedChanges.paymentTerms),
        hasChanged: proposedChanges.paymentTerms && originalPO.paymentTerms !== proposedChanges.paymentTerms
      },
      {
        label: 'Expected Delivery',
        oldValue: originalPO.expectedDeliveryDate ? formatDate(originalPO.expectedDeliveryDate) : '-',
        newValue: proposedChanges.expectedDeliveryDate ? formatDate(proposedChanges.expectedDeliveryDate) : '-',
        hasChanged: proposedChanges.expectedDeliveryDate && originalPO.expectedDeliveryDate !== proposedChanges.expectedDeliveryDate
      },
      {
        label: 'Shipping Cost',
        oldValue: formatCurrency(originalPO.shippingCost || 0),
        newValue: formatCurrency(proposedChanges.shippingCost || 0),
        hasChanged: proposedChanges.shippingCost !== undefined && parseFloat(originalPO.shippingCost || 0) !== parseFloat(proposedChanges.shippingCost || 0)
      }
    ];

    const changedFields = fieldChanges.filter(f => f.hasChanged);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Field Changes */}
        {changedFields.length > 0 && (
          <div>
            <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              Field Changes
            </h5>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '30%' }}>
                      Field
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '35%' }}>
                      Original Value
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', width: '35%' }}>
                      New Value
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {changedFields.map((field, index) => (
                    <tr key={index} style={{ borderBottom: index < changedFields.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                        {field.label}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#6b7280' }}>
                        {field.oldValue}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#059669', fontWeight: '500' }}>
                        {field.newValue}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Item Changes */}
        {proposedChanges.items && proposedChanges.items.length > 0 && (
          <div>
            <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
              Updated Items
            </h5>
            <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Material
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Quantity
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Rate
                    </th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {proposedChanges.items.map((item, index) => {
                    const material = materials?.find(m => m.id === parseInt(item.materialId));
                    return (
                      <tr key={index} style={{ borderBottom: index < proposedChanges.items.length - 1 ? '1px solid #e5e7eb' : 'none' }}>
                        <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: '#374151' }}>
                          {material?.name || `Material ID: ${item.materialId}`}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#374151' }}>
                          {parseFloat(item.quantity).toFixed(3)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', color: '#374151' }}>
                          {formatCurrency(item.rate)}
                        </td>
                        <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                          {formatCurrency(item.amount)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Total Changes */}
        <div>
          <h5 style={{ margin: '0 0 0.75rem 0', fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>
            Financial Summary
          </h5>
          <div style={{ border: '1px solid #e5e7eb', borderRadius: '0.5rem', overflow: 'hidden', backgroundColor: '#f9fafb' }}>
            <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Subtotal:</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                {formatCurrency(proposedChanges.subtotal || 0)}
              </span>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Tax Amount:</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                {formatCurrency(proposedChanges.taxAmount || 0)}
              </span>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #e5e7eb' }}>
              <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>Shipping:</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                {formatCurrency(proposedChanges.shippingCost || 0)}
              </span>
            </div>
            <div style={{ padding: '0.75rem', display: 'flex', justifyContent: 'space-between', backgroundColor: '#fff' }}>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151' }}>Total Amount:</span>
              <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#059669' }}>
                {formatCurrency(proposedChanges.totalAmount || 0)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render amendments list
  const renderAmendmentsList = () => (
    <div className="amendments-list-container">
      <div className="amendments-list-header">
        <h3>Amendment History for {purchaseOrder?.orderNumber}</h3>
        {/* Block amendments on auto-generated POs from WCN - must use WCN rectification instead */}
        {purchaseOrder?.source_type === 'wcn_auto' ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#dbeafe',
            border: '1px solid #3b82f6',
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
            color: '#1e40af',
            maxWidth: '400px'
          }}>
            <Info size={18} style={{ flexShrink: 0 }} />
            <span>
              This PO was auto-generated from WCN. To modify quantities, use <strong>WCN Rectification</strong> in the Collections tab instead.
            </span>
          </div>
        ) : purchaseOrder?.status !== 'draft' && (
          <button
            type="button"
            className="btn-create-invoice"
            onClick={handleCreateAmendment}
          >
            <Plus size={16} />
            Create Amendment
          </button>
        )}
      </div>

      {amendments.length === 0 ? (
        <div className="amendments-empty-state">
          <FileText size={48} />
          <p>No amendments created for this purchase order</p>
          <p className="amendments-empty-hint">
            Amendments track changes made to purchase orders after creation
          </p>
        </div>
      ) : (
        <div className="amendments-list">
          {amendments.map((amendment) => (
            <div key={amendment.id} className="amendment-card">
              <div className="amendment-card-header">
                <div>
                  <h4>Amendment #{amendment.amendment_number}</h4>
                  <p className="amendment-card-date">
                    {formatDate(amendment.amendment_date)}
                  </p>
                </div>
                {getStatusBadge(amendment.status)}
              </div>

              <div className="amendment-card-body">
                <div className="amendment-card-field">
                  <span className="amendment-card-label">Reason:</span>
                  <span className="amendment-card-value">{amendment.reason}</span>
                </div>

                <div className="amendment-card-row">
                  <div className="amendment-card-field">
                    <span className="amendment-card-label">Previous Total:</span>
                    <span className="amendment-card-value">
                      {formatCurrency(amendment.previous_total)}
                    </span>
                  </div>
                  <div className="amendment-card-field">
                    <span className="amendment-card-label">New Total:</span>
                    <span className="amendment-card-value amendment-card-new-total">
                      {formatCurrency(amendment.new_total)}
                    </span>
                  </div>
                </div>

                <div className="amendment-card-meta">
                  <span>Created by: {amendment.createdByName}</span>
                  {amendment.approvedByName && (
                    <span>
                      {amendment.status === 'approved' ? 'Approved' : 'Rejected'} by: {amendment.approvedByName}
                    </span>
                  )}
                </div>
              </div>

              <div className="amendment-card-actions">
                <button
                  type="button"
                  className="btn-amendment-action"
                  onClick={() => handleViewDetails(amendment)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render amendment form
  const renderAmendmentForm = () => {
    const calculateTotal = () => {
      const subtotal = formData.items.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      const taxAmount = (subtotal * vatRate) / 100; // Use VAT rate from system settings
      const shipping = parseFloat(formData.shippingCost) || 0;
      return {
        subtotal: subtotal.toFixed(3),
        taxAmount: taxAmount.toFixed(3),
        total: (subtotal + taxAmount + shipping).toFixed(3)
      };
    };

    const totals = calculateTotal();

    return (
      <div className="invoice-form">
        <div className="invoice-view-header">
          <h3>Create Amendment for {purchaseOrder?.orderNumber}</h3>
          <button
            type="button"
            className="btn-back"
            onClick={handleBackToList}
          >
            ← Back to List
          </button>
        </div>

        <form onSubmit={handleSubmitAmendment}>
          {/* Reason Field (Required) */}
          <div className="form-group">
            <label>
              Reason for Amendment <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <textarea
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Explain why this amendment is needed (minimum 10 characters)"
              rows={3}
              required
              minLength={10}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Order Date */}
          <div className="form-group">
            <label>Order Date</label>
            <input
              type="date"
              value={formData.orderDate}
              onChange={(e) => setFormData({ ...formData, orderDate: e.target.value })}
            />
          </div>

          {/* Vendor and Payment Terms */}
          <div className="form-row">
            <div className="form-group">
              <label>Vendor/Supplier</label>
              <select
                value={formData.vendorId}
                onChange={(e) => setFormData({ ...formData, vendorId: e.target.value })}
              >
                <option value="">Select Vendor</option>
                {vendors && vendors.map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Payment Terms</label>
              <select
                value={formData.paymentTerms}
                onChange={(e) => setFormData({ ...formData, paymentTerms: e.target.value })}
              >
                <option value="immediate">Immediate</option>
                <option value="net_30">Net 30 Days</option>
                <option value="net_60">Net 60 Days</option>
                <option value="net_90">Net 90 Days</option>
                <option value="advance">Advance Payment</option>
                <option value="cod">Cash on Delivery</option>
              </select>
            </div>
          </div>

          {/* Delivery Date and Shipping */}
          <div className="form-row">
            <div className="form-group">
              <label>Expected Delivery Date</label>
              <input
                type="date"
                value={formData.expectedDeliveryDate}
                onChange={(e) => setFormData({ ...formData, expectedDeliveryDate: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label>Shipping Cost</label>
              <input
                type="number"
                step="0.001"
                min="0"
                value={formData.shippingCost}
                onChange={(e) => setFormData({ ...formData, shippingCost: e.target.value })}
                placeholder="0.000"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <label style={{ margin: 0 }}>Order Items</label>
              <button
                type="button"
                onClick={handleAddItem}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.375rem 0.75rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '0.375rem',
                  fontSize: '0.75rem',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} />
                Add Material
              </button>
            </div>
            <div style={{ overflowX: 'auto', marginTop: '0.5rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Material</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Quantity</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Rate</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'center', fontSize: '0.75rem', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {formData.items.map((item, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #e5e7eb' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {item.materialName ? (
                          <span style={{ fontSize: '0.875rem' }}>{item.materialName}</span>
                        ) : (
                          <select
                            value={item.materialId}
                            onChange={(e) => {
                              const selectedMaterial = materials?.find(m => m.id === parseInt(e.target.value));
                              handleItemChange(index, 'materialId', e.target.value);
                              if (selectedMaterial) {
                                const updatedItems = [...formData.items];
                                updatedItems[index].materialName = selectedMaterial.name;
                                setFormData({ ...formData, items: updatedItems });
                              }
                            }}
                            style={{ width: '100%', padding: '0.375rem', fontSize: '0.875rem' }}
                            required
                          >
                            <option value="">Select Material</option>
                            {materials && materials.map((material) => (
                              <option key={material.id} value={material.id}>
                                {material.name}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="number"
                          step="0.001"
                          min="0.001"
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                          style={{ width: '100%', textAlign: 'right' }}
                          required
                        />
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        <input
                          type="number"
                          step="0.001"
                          min="0"
                          value={item.rate}
                          onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                          style={{ width: '100%', textAlign: 'right' }}
                          required
                        />
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '500' }}>
                        {formatCurrency(item.amount)}
                      </td>
                      <td style={{ padding: '0.75rem', textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(index)}
                          style={{
                            padding: '0.25rem 0.5rem',
                            backgroundColor: '#fee2e2',
                            color: '#991b1b',
                            border: 'none',
                            borderRadius: '0.25rem',
                            cursor: 'pointer',
                            fontSize: '0.75rem'
                          }}
                          title="Remove item"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ backgroundColor: '#f9fafb' }}>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>Subtotal:</td>
                    <td colSpan="2" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>{formatCurrency(totals.subtotal)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>Tax ({vatRate}%):</td>
                    <td colSpan="2" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>{formatCurrency(totals.taxAmount)}</td>
                  </tr>
                  <tr>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>Shipping:</td>
                    <td colSpan="2" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '0.875rem', fontWeight: '600' }}>{formatCurrency(formData.shippingCost || 0)}</td>
                  </tr>
                  <tr style={{ borderTop: '2px solid #d1d5db' }}>
                    <td colSpan="3" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: '700', color: '#1f2937' }}>Total:</td>
                    <td colSpan="2" style={{ padding: '0.75rem', textAlign: 'right', fontSize: '1rem', fontWeight: '700', color: '#3b82f6' }}>{formatCurrency(totals.total)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Notes */}
          <div className="form-group">
            <label>Additional Notes</label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Any additional notes for this amendment"
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </div>

          {/* Validation Messages */}
          {(!formData.reason || formData.reason.trim().length < 10) && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#92400e',
              marginBottom: '1rem'
            }}>
              ⚠️ Reason must be at least 10 characters (current: {formData.reason.trim().length})
            </div>
          )}
          {formData.items.length === 0 && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#92400e',
              marginBottom: '1rem'
            }}>
              ⚠️ At least one item is required
            </div>
          )}
          {formData.items.length > 0 && formData.items.some(item => !item.materialId || !item.quantity || !item.rate) && (
            <div style={{
              padding: '0.75rem',
              backgroundColor: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: '0.375rem',
              fontSize: '0.875rem',
              color: '#92400e',
              marginBottom: '1rem'
            }}>
              ⚠️ All items must have material selected, quantity, and rate filled
            </div>
          )}

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className="btn-cancel"
              onClick={handleBackToList}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-submit"
              disabled={
                submitting ||
                !formData.reason ||
                formData.reason.trim().length < 10 ||
                formData.items.length === 0 ||
                formData.items.some(item => !item.materialId || !item.quantity || !item.rate)
              }
              title={
                !formData.reason || formData.reason.trim().length < 10
                  ? 'Reason must be at least 10 characters'
                  : formData.items.length === 0
                  ? 'At least one item is required'
                  : formData.items.some(item => !item.materialId || !item.quantity || !item.rate)
                  ? 'All items must have material, quantity, and rate'
                  : 'Submit Amendment'
              }
            >
              {submitting ? 'Submitting...' : 'Submit Amendment'}
            </button>
          </div>
        </form>
      </div>
    );
  };

  // Render amendment details
  const renderAmendmentDetails = () => (
    <div className="amendment-details">
      <div className="amendment-details-header">
        <h3>Amendment #{selectedAmendment.amendment_number} Details</h3>
        <button
          type="button"
          className="btn-back"
          onClick={handleBackToList}
        >
          ← Back to List
        </button>
      </div>

      <div className="amendment-details-body">
        <div className="amendment-details-section">
          <h4>Amendment Information</h4>
          <div className="amendment-details-grid">
            <div className="amendment-details-field">
              <label>Amendment Number:</label>
              <span>#{selectedAmendment.amendment_number}</span>
            </div>
            <div className="amendment-details-field">
              <label>Status:</label>
              {getStatusBadge(selectedAmendment.status)}
            </div>
            <div className="amendment-details-field">
              <label>Original Order:</label>
              <span>{selectedAmendment.originalOrderNumber}</span>
            </div>
            <div className="amendment-details-field">
              <label>Amended Order:</label>
              <span>{selectedAmendment.amendedOrderNumber}</span>
            </div>
            <div className="amendment-details-field">
              <label>Amendment Date:</label>
              <span>{formatDate(selectedAmendment.amendment_date)}</span>
            </div>
            <div className="amendment-details-field">
              <label>Created By:</label>
              <span>{selectedAmendment.createdByName}</span>
            </div>
          </div>
        </div>

        <div className="amendment-details-section">
          <h4>Reason for Amendment</h4>
          <p className="amendment-details-reason">{selectedAmendment.reason}</p>
        </div>

        <div className="amendment-details-section">
          <h4>Financial Impact</h4>
          <div className="amendment-details-financial">
            <div className="amendment-financial-item">
              <label>Previous Total:</label>
              <span className="amendment-financial-value">
                {formatCurrency(selectedAmendment.previous_total)}
              </span>
            </div>
            <div className="amendment-financial-arrow">→</div>
            <div className="amendment-financial-item">
              <label>New Total:</label>
              <span className="amendment-financial-value amendment-financial-new">
                {formatCurrency(selectedAmendment.new_total)}
              </span>
            </div>
            <div className="amendment-financial-diff">
              <label>Difference:</label>
              <span className={`amendment-financial-value ${
                selectedAmendment.new_total - selectedAmendment.previous_total >= 0
                  ? 'positive'
                  : 'negative'
              }`}>
                {selectedAmendment.new_total - selectedAmendment.previous_total >= 0 ? '+' : ''}
                {formatCurrency(
                  selectedAmendment.new_total - selectedAmendment.previous_total
                )}
              </span>
            </div>
          </div>
        </div>

        {selectedAmendment.changes_summary &&
          selectedAmendment.changes_summary.proposed_changes && (
            <div className="amendment-details-section">
              <h4>Proposed Changes</h4>
              <div className="amendment-changes">
                {renderProposedChanges(selectedAmendment.changes_summary.proposed_changes, purchaseOrder)}
              </div>
            </div>
          )}

        {/* Approval Actions - Only show for pending amendments with permission */}
        {selectedAmendment.status === 'pending' && hasPermission('APPROVE_PURCHASE') && (
          <div className="amendment-details-section">
            <h4>Approval Actions</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500', color: '#374151' }}>
                  Notes / Reason (Optional for approval, required for rejection)
                </label>
                <textarea
                  value={approvalNotes}
                  onChange={(e) => setApprovalNotes(e.target.value)}
                  placeholder="Add notes or reason for your decision..."
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #d1d5db',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
                {approvalNotes.length > 0 && approvalNotes.length < 10 && (
                  <p style={{ marginTop: '0.25rem', fontSize: '0.75rem', color: '#6b7280' }}>
                    {approvalNotes.length} / 10 characters (minimum for rejection)
                  </p>
                )}
              </div>

              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  onClick={handleApproveAmendment}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: submitting ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => !submitting && (e.target.style.backgroundColor = '#059669')}
                  onMouseLeave={(e) => !submitting && (e.target.style.backgroundColor = '#10b981')}
                >
                  <ThumbsUp size={16} />
                  {submitting ? 'Processing...' : 'Approve Amendment'}
                </button>

                <button
                  onClick={handleRejectAmendment}
                  disabled={submitting}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    padding: '0.75rem 1.5rem',
                    backgroundColor: submitting ? '#9ca3af' : '#ef4444',
                    color: 'white',
                    border: 'none',
                    borderRadius: '0.375rem',
                    fontSize: '0.875rem',
                    fontWeight: '500',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    transition: 'background-color 0.2s'
                  }}
                  onMouseEnter={(e) => !submitting && (e.target.style.backgroundColor = '#dc2626')}
                  onMouseLeave={(e) => !submitting && (e.target.style.backgroundColor = '#ef4444')}
                >
                  <ThumbsDown size={16} />
                  {submitting ? 'Processing...' : 'Reject Amendment'}
                </button>
              </div>
            </div>
          </div>
        )}

        {selectedAmendment.status !== 'pending' && selectedAmendment.approvedByName && (
          <div className="amendment-details-section">
            <h4>
              {selectedAmendment.status === 'approved' ? 'Approval' : 'Rejection'} Information
            </h4>
            <div className="amendment-details-approval">
              <div className="amendment-details-field">
                <label>
                  {selectedAmendment.status === 'approved' ? 'Approved' : 'Rejected'} By:
                </label>
                <span>{selectedAmendment.approvedByName}</span>
              </div>
              <div className="amendment-details-field">
                <label>Date:</label>
                <span>{formatDate(selectedAmendment.approved_at)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Purchase Order Amendments"
      className="purchase-order-amendment-modal"
      closeOnOverlayClick={false}
    >
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="amendments-loading">
          <div className="amendments-spinner"></div>
          <p>Loading amendments...</p>
        </div>
      ) : mode === 'details' ? (
        renderAmendmentDetails()
      ) : mode === 'create' ? (
        renderAmendmentForm()
      ) : (
        renderAmendmentsList()
      )}
    </Modal>
  );
};

export default PurchaseOrderAmendmentModal;
