import React, { useState, useEffect } from 'react';
import Modal from './ui/Modal';
import { useSystemSettings } from '../context/SystemSettingsContext';
import purchaseOrderExpenseService from '../services/purchaseOrderExpenseService';
import { Plus, Edit2, Trash2, Banknote, TrendingUp, Package } from 'lucide-react';
import './PurchaseOrderExpenseModal.css';

const PurchaseOrderExpenseModal = ({
  isOpen,
  onClose,
  purchaseOrder,
  onSuccess
}) => {
  const { formatCurrency, formatDate } = useSystemSettings();

  const [mode, setMode] = useState('list'); // 'list', 'create', 'edit'
  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState({ total: 0, byCategory: {}, count: 0 });
  const [expenseSummary, setExpenseSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [selectedExpense, setSelectedExpense] = useState(null);

  // Form state
  const [formData, setFormData] = useState({
    category: 'freight',
    description: '',
    amount: '',
    expenseDate: new Date().toISOString().split('T')[0],
    vendor: '',
    referenceNumber: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen && purchaseOrder) {
      loadExpenses();
      loadExpenseSummary();
    }
  }, [isOpen, purchaseOrder]);

  const loadExpenses = async () => {
    if (!purchaseOrder?.id) return;

    setLoading(true);
    try {
      const result = await purchaseOrderExpenseService.getExpenses(purchaseOrder.id);
      if (result.success) {
        setExpenses(result.data.expenses);
        setSummary(result.data.summary);
      }
    } finally {
      setLoading(false);
    }
  };

  const loadExpenseSummary = async () => {
    if (!purchaseOrder?.id) return;

    const result = await purchaseOrderExpenseService.getExpenseSummary(purchaseOrder.id);
    if (result.success) {
      setExpenseSummary(result.data);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      let result;
      if (mode === 'edit') {
        result = await purchaseOrderExpenseService.updateExpense(selectedExpense.id, formData);
      } else {
        result = await purchaseOrderExpenseService.createExpense(purchaseOrder.id, formData);
      }

      if (result.success) {
        setMessage({
          type: 'success',
          text: mode === 'edit' ? 'Expense updated successfully' : 'Expense added successfully'
        });

        // Reload data
        await loadExpenses();
        await loadExpenseSummary();

        // Reset form after delay
        setTimeout(() => {
          setMode('list');
          resetForm();
          setMessage({ type: '', text: '' });
        }, 2000);

        if (onSuccess) onSuccess();
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to save expense' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (expense) => {
    setSelectedExpense(expense);
    setFormData({
      category: expense.category,
      description: expense.description,
      amount: expense.amount,
      expenseDate: new Date(expense.expenseDate).toISOString().split('T')[0],
      vendor: expense.vendor || '',
      referenceNumber: expense.referenceNumber || '',
      notes: expense.notes || ''
    });
    setMode('edit');
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;

    const result = await purchaseOrderExpenseService.deleteExpense(expenseId);
    if (result.success) {
      setMessage({ type: 'success', text: 'Expense deleted successfully' });
      await loadExpenses();
      await loadExpenseSummary();
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      if (onSuccess) onSuccess();
    } else {
      alert('Failed to delete expense: ' + result.error);
    }
  };

  const resetForm = () => {
    setFormData({
      category: 'freight',
      description: '',
      amount: '',
      expenseDate: new Date().toISOString().split('T')[0],
      vendor: '',
      referenceNumber: '',
      notes: ''
    });
    setSelectedExpense(null);
  };

  const handleClose = () => {
    setMode('list');
    resetForm();
    setMessage({ type: '', text: '' });
    onClose();
  };

  // Render expense list
  const renderExpenseList = () => (
    <div className="po-expense-list">
      {/* Summary Cards */}
      {expenseSummary && (
        <div className="expense-summary-cards">
          <div className="summary-card">
            <div className="summary-card-icon" style={{ backgroundColor: '#3b82f620' }}>
              <Package size={24} color="#3b82f6" />
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">PO Total</span>
              <span className="summary-card-value">{formatCurrency(expenseSummary.purchaseOrderTotal)}</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon" style={{ backgroundColor: '#ef444420' }}>
              <Banknote size={24} color="#ef4444" />
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Total Expenses</span>
              <span className="summary-card-value">{formatCurrency(expenseSummary.totalExpenses)}</span>
              <span className="summary-card-subtext">{expenseSummary.expenseCount} expense(s)</span>
            </div>
          </div>

          <div className="summary-card">
            <div className="summary-card-icon" style={{ backgroundColor: '#10b98120' }}>
              <TrendingUp size={24} color="#10b981" />
            </div>
            <div className="summary-card-content">
              <span className="summary-card-label">Actual Cost</span>
              <span className="summary-card-value">{formatCurrency(expenseSummary.actualCost)}</span>
              <span className="summary-card-subtext">
                +{expenseSummary.expensePercentage.toFixed(2)}% over PO
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="expense-list-header">
        <h3>Expense Details</h3>
        <button
          onClick={() => setMode('create')}
          className="btn-add-expense"
        >
          <Plus size={16} />
          Add Expense
        </button>
      </div>

      {/* Expense List */}
      {loading ? (
        <div className="loading-spinner">Loading...</div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <p>No expenses recorded for this purchase order</p>
          <button onClick={() => setMode('create')} className="btn-primary">
            Add First Expense
          </button>
        </div>
      ) : (
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Category</th>
              <th>Description</th>
              <th>Vendor</th>
              <th style={{ textAlign: 'right' }}>Amount</th>
              <th style={{ textAlign: 'center' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {expenses.map(expense => (
              <tr key={expense.id}>
                <td>{formatDate(expense.expenseDate)}</td>
                <td>
                  <span className="category-badge">
                    {purchaseOrderExpenseService.formatCategory(expense.category)}
                  </span>
                </td>
                <td>{expense.description}</td>
                <td>{expense.vendor || '-'}</td>
                <td style={{ textAlign: 'right', fontWeight: '500' }}>
                  {formatCurrency(expense.amount)}
                </td>
                <td style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => handleEdit(expense)}
                    className="btn-icon"
                    title="Edit"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="btn-icon btn-icon-danger"
                    title="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan="4" style={{ textAlign: 'right', fontWeight: '600' }}>Total:</td>
              <td style={{ textAlign: 'right', fontWeight: '600', fontSize: '1.1rem' }}>
                {formatCurrency(summary.total)}
              </td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );

  // Render expense form
  const renderExpenseForm = () => (
    <form onSubmit={handleSubmit} className="expense-form">
      <h3>{mode === 'edit' ? 'Edit Expense' : 'Add New Expense'}</h3>

      <div className="form-row">
        <div className="form-group">
          <label>Category *</label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            required
          >
            {purchaseOrderExpenseService.getExpenseCategories().map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Expense Date *</label>
          <input
            type="date"
            value={formData.expenseDate}
            onChange={(e) => setFormData({ ...formData, expenseDate: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="form-group">
        <label>Description *</label>
        <input
          type="text"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="e.g., Freight from Port to Warehouse"
          maxLength={500}
          required
        />
      </div>

      <div className="form-row">
        <div className="form-group">
          <label>Amount (OMR) *</label>
          <input
            type="number"
            step="0.001"
            min="0"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.000"
            required
          />
        </div>

        <div className="form-group">
          <label>Vendor</label>
          <input
            type="text"
            value={formData.vendor}
            onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
            placeholder="Optional"
            maxLength={200}
          />
        </div>
      </div>

      <div className="form-group">
        <label>Reference Number</label>
        <input
          type="text"
          value={formData.referenceNumber}
          onChange={(e) => setFormData({ ...formData, referenceNumber: e.target.value })}
          placeholder="Invoice/Receipt number (optional)"
          maxLength={100}
        />
      </div>

      <div className="form-group">
        <label>Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          placeholder="Additional notes (optional)"
          rows={3}
          maxLength={1000}
        />
      </div>

      <div className="form-actions">
        <button
          type="button"
          onClick={() => {
            setMode('list');
            resetForm();
          }}
          className="btn-secondary"
          disabled={submitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn-primary"
          disabled={submitting}
        >
          {submitting ? 'Saving...' : mode === 'edit' ? 'Update Expense' : 'Add Expense'}
        </button>
      </div>
    </form>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={`Purchase Order Expenses - ${purchaseOrder?.orderNumber}`}
      className="purchase-order-expense-modal"
      size="large"
    >
      {message.text && (
        <div className={`message message-${message.type}`}>
          {message.text}
        </div>
      )}

      {mode === 'list' ? renderExpenseList() : renderExpenseForm()}
    </Modal>
  );
};

export default PurchaseOrderExpenseModal;
