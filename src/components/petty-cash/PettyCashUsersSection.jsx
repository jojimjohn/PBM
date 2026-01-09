/**
 * Petty Cash Users Section
 *
 * Admin component for managing petty cash users (drivers, cleaners, delivery staff).
 * Displays user list with QR code management and PIN reset capabilities.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Plus,
  QrCode,
  Key,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  CheckCircle,
  XCircle,
  Phone,
  Building,
  Loader2,
  Copy,
  Printer,
  AlertCircle,
  Link,
  ExternalLink,
  History,
  ArrowUpCircle,
  ArrowDownCircle,
  Ban,
  PlayCircle,
} from 'lucide-react';
import DataTable from '../ui/DataTable';
import Modal from '../ui/Modal';
import pettyCashUsersService from '../../services/pettyCashUsersService';
import pettyCashService from '../../services/pettyCashService';
import './PettyCashUsersSection.css';

const PettyCashUsersSection = ({
  cards = [],
  loading: parentLoading = false,
  t = (key, fallback) => fallback,
  hasPermission = () => true,
  formatCurrency = (amount) => `OMR ${parseFloat(amount || 0).toFixed(3)}`,
  onRefresh,
}) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showResetPinModal, setShowResetPinModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [qrCodeData, setQrCodeData] = useState(null);

  // Transaction history states
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  // Deactivation states
  const [deactivationReason, setDeactivationReason] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    cardId: '',
    name: '',
    phone: '',
    department: '',
    employeeId: '',
    pin: '',
    confirmPin: '',
  });
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState(null);

  // Load petty cash users
  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await pettyCashUsersService.getAll();
      console.log('📋 Petty Cash Users API Result:', result);
      if (result.success) {
        console.log('✅ Petty Cash Users loaded:', result.data?.length, 'users', result.data);
        setUsers(result.data || []);
      } else {
        console.error('❌ Failed to load petty cash users:', result.error);
        setError(result.error || 'Failed to load petty cash users');
      }
    } catch (err) {
      console.error('❌ Exception loading petty cash users:', err);
      setError(err.message || 'Failed to load petty cash users');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // Get available cards (not assigned to any PC user)
  // Note: A card can have both a system user (assignedTo) AND a PC user (for mobile portal)
  // We only filter out cards that already have a PC user assigned
  const getAvailableCards = () => {
    const assignedCardIds = users.map((u) => u.card_id);
    return cards.filter(
      (card) =>
        card.status === 'active' &&
        !assignedCardIds.includes(card.id)
    );
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setFormError(null);
  };

  // Handle create user
  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormError(null);

    // Validate PIN
    if (formData.pin.length < 4 || formData.pin.length > 6) {
      setFormError('PIN must be 4-6 digits');
      return;
    }

    if (formData.pin !== formData.confirmPin) {
      setFormError('PINs do not match');
      return;
    }

    if (!/^\d+$/.test(formData.pin)) {
      setFormError('PIN must contain only numbers');
      return;
    }

    setSubmitting(true);

    try {
      const result = await pettyCashUsersService.create({
        cardId: parseInt(formData.cardId),
        name: formData.name,
        phone: formData.phone || null,
        department: formData.department || null,
        employeeId: formData.employeeId || null,
        pin: formData.pin,
      });

      if (result.success) {
        setShowCreateModal(false);
        loadUsers();
        onRefresh?.();

        // Show QR code for the new user
        if (result.data?.qrCode) {
          setQrCodeData({
            qrCode: result.data.qrCode,
            portalUrl: result.data.portalUrl,
            userName: formData.name,
          });
          setShowQrModal(true);
        }
      } else {
        setFormError(result.error || 'Failed to create user');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle edit user
  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setSubmitting(true);
    setFormError(null);

    try {
      const result = await pettyCashUsersService.update(selectedUser.id, {
        name: formData.name,
        phone: formData.phone || null,
        department: formData.department || null,
        employeeId: formData.employeeId || null,
      });

      if (result.success) {
        setShowEditModal(false);
        loadUsers();
      } else {
        setFormError(result.error || 'Failed to update user');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reset PIN
  const handleResetPin = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    setFormError(null);

    if (newPin.length < 4 || newPin.length > 6) {
      setFormError('PIN must be 4-6 digits');
      return;
    }

    if (newPin !== confirmNewPin) {
      setFormError('PINs do not match');
      return;
    }

    if (!/^\d+$/.test(newPin)) {
      setFormError('PIN must contain only numbers');
      return;
    }

    setSubmitting(true);

    try {
      const result = await pettyCashUsersService.resetPin(selectedUser.id, newPin);

      if (result.success) {
        setShowResetPinModal(false);
        setNewPin('');
        setConfirmNewPin('');
        loadUsers();
      } else {
        setFormError(result.error || 'Failed to reset PIN');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to reset PIN');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle show QR code
  const handleShowQrCode = async (user) => {
    try {
      const result = await pettyCashUsersService.getQrCode(user.id);
      if (result.success) {
        setQrCodeData(result.data);
        setSelectedUser(user);
        setShowQrModal(true);
      } else {
        setError(result.error || 'Failed to load QR code');
      }
    } catch (err) {
      setError(err.message || 'Failed to load QR code');
    }
  };

  // Handle regenerate QR
  const handleRegenerateQr = async () => {
    if (!selectedUser) return;

    try {
      const result = await pettyCashUsersService.regenerateQr(selectedUser.id);
      if (result.success) {
        setQrCodeData(result.data);
      } else {
        setError(result.error || 'Failed to regenerate QR code');
      }
    } catch (err) {
      setError(err.message || 'Failed to regenerate QR code');
    }
  };

  // Handle deactivate user (with reason)
  const openDeactivateModal = (user) => {
    setSelectedUser(user);
    setDeactivationReason('');
    setFormError(null);
    setShowDeactivateModal(true);
  };

  const handleDeactivateUser = async (e) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (deactivationReason.trim().length < 5) {
      setFormError('Please provide a reason (at least 5 characters)');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      const result = await pettyCashService.deactivateUser(selectedUser.id, deactivationReason.trim());

      if (result.success) {
        setShowDeactivateModal(false);
        setDeactivationReason('');
        loadUsers();
        onRefresh?.();
      } else {
        setFormError(result.error || 'Failed to deactivate user');
      }
    } catch (err) {
      setFormError(err.message || 'Failed to deactivate user');
    } finally {
      setSubmitting(false);
    }
  };

  // Handle reactivate user
  const handleReactivateUser = async (user) => {
    if (!window.confirm(`Are you sure you want to reactivate ${user.name}?`)) {
      return;
    }

    try {
      const result = await pettyCashService.reactivateUser(user.id);

      if (result.success) {
        loadUsers();
        onRefresh?.();
      } else {
        setError(result.error || 'Failed to reactivate user');
      }
    } catch (err) {
      setError(err.message || 'Failed to reactivate user');
    }
  };

  // Load transaction history for a user's card
  const loadTransactionHistory = async (cardId) => {
    if (!cardId) return;

    setTransactionsLoading(true);
    try {
      const result = await pettyCashService.getCardTransactions(cardId, { limit: 20 });
      if (result.success) {
        setTransactions(result.data || []);
      } else {
        console.error('Failed to load transactions:', result.error);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Error loading transactions:', err);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // Get transaction type icon and color
  const getTransactionTypeInfo = (type) => {
    switch (type) {
      case 'initial_balance':
        return { icon: <ArrowUpCircle size={16} />, color: '#28a745', label: t('initialBalance', 'Initial Balance') };
      case 'reload':
        return { icon: <ArrowUpCircle size={16} />, color: '#17a2b8', label: t('reload', 'Reload') };
      case 'expense':
        return { icon: <ArrowDownCircle size={16} />, color: '#ffc107', label: t('expense', 'Expense') };
      case 'expense_approved':
        return { icon: <CheckCircle size={16} />, color: '#28a745', label: t('expenseApproved', 'Expense Approved') };
      case 'expense_rejected':
        return { icon: <XCircle size={16} />, color: '#dc3545', label: t('expenseRejected', 'Expense Rejected') };
      case 'adjustment':
        return { icon: <RefreshCw size={16} />, color: '#6c757d', label: t('adjustment', 'Adjustment') };
      case 'deduction':
        return { icon: <ArrowDownCircle size={16} />, color: '#dc3545', label: t('deduction', 'Deduction') };
      case 'reversal':
        return { icon: <RefreshCw size={16} />, color: '#fd7e14', label: t('reversal', 'Reversal') };
      default:
        return { icon: <History size={16} />, color: '#6c757d', label: type };
    }
  };

  // Handle delete user
  const handleDeleteUser = async (user) => {
    if (!window.confirm(`Are you sure you want to delete ${user.name}?`)) {
      return;
    }

    try {
      const result = await pettyCashUsersService.remove(user.id);
      if (result.success) {
        loadUsers();
        onRefresh?.();
      } else {
        setError(result.error || 'Failed to delete user');
      }
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  };

  // Copy portal URL to clipboard
  const copyPortalUrl = () => {
    if (qrCodeData?.portalUrl) {
      navigator.clipboard.writeText(qrCodeData.portalUrl);
    }
  };

  // Print QR code
  const printQrCode = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${qrCodeData?.userName || 'Petty Cash User'}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              margin: 0;
              padding: 20px;
            }
            img { max-width: 300px; }
            h1 { font-size: 24px; margin-bottom: 10px; }
            p { color: #666; margin: 5px 0; }
          </style>
        </head>
        <body>
          <h1>${qrCodeData?.userName || 'Petty Cash User'}</h1>
          <img src="${qrCodeData?.qrCode}" alt="QR Code" />
          <p>Scan this QR code and enter your PIN to access the portal</p>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Open create modal
  const openCreateModal = () => {
    setFormData({
      cardId: '',
      name: '',
      phone: '',
      department: '',
      employeeId: '',
      pin: '',
      confirmPin: '',
    });
    setFormError(null);
    setShowCreateModal(true);
  };

  // Open edit modal
  const openEditModal = (user) => {
    setSelectedUser(user);
    setFormData({
      name: user.name || '',
      phone: user.phone || '',
      department: user.department || '',
      employeeId: user.employee_id || '',
    });
    setFormError(null);
    setShowEditModal(true);
  };

  // Open reset PIN modal
  const openResetPinModal = (user) => {
    setSelectedUser(user);
    setNewPin('');
    setConfirmNewPin('');
    setFormError(null);
    setShowResetPinModal(true);
  };

  // Open view modal
  const openViewModal = async (user) => {
    try {
      // Reset transaction state
      setTransactions([]);

      // Fetch both user details and QR code in parallel
      const [userResult, qrResult] = await Promise.all([
        pettyCashUsersService.getById(user.id),
        pettyCashUsersService.getQrCode(user.id),
      ]);

      if (userResult.success) {
        // Merge QR code data into user object for display
        const userData = {
          ...userResult.data,
          qrCode: qrResult.success ? qrResult.data.qrCode : null,
          portalUrl: qrResult.success ? qrResult.data.portalUrl : userResult.data.portalUrl,
        };
        setSelectedUser(userData);
        setShowViewModal(true);

        // Load transaction history for the user's card
        if (userData.card_id) {
          loadTransactionHistory(userData.card_id);
        }
      } else {
        setError(userResult.error || 'Failed to load user details');
      }
    } catch (err) {
      setError(err.message || 'Failed to load user details');
    }
  };

  // Table columns
  // Note: DataTable render receives (value, row) - value is from column.key, row is full object
  const columns = [
    {
      key: 'name',
      header: t('name', 'Name'),
      sortable: true,
      render: (value, row) => (
        <div className="user-name-cell">
          <span className="name">{value || '-'}</span>
          {row?.employee_id && (
            <span className="employee-id">#{row.employee_id}</span>
          )}
        </div>
      ),
    },
    {
      key: 'cardNumber',
      header: t('card', 'Card'),
      sortable: true,
      render: (value) => (
        <span className="card-number">{value || '-'}</span>
      ),
    },
    {
      key: 'department',
      header: t('department', 'Department'),
      sortable: true,
      render: (value) => value || '-',
    },
    {
      key: 'currentBalance',
      header: t('balance', 'Balance'),
      sortable: true,
      render: (value) => formatCurrency(value),
    },
    {
      key: 'is_active',
      header: t('status', 'Status'),
      sortable: true,
      render: (value) => (
        <span className={`status-badge ${value ? 'active' : 'inactive'}`}>
          {value ? (
            <>
              <CheckCircle size={14} />
              {t('active', 'Active')}
            </>
          ) : (
            <>
              <XCircle size={14} />
              {t('inactive', 'Inactive')}
            </>
          )}
        </span>
      ),
    },
    {
      key: 'actions',
      header: t('actions', 'Actions'),
      render: (value, row) => {
        if (!row) return null;
        return (
          <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => openViewModal(row)}
              title={t('view', 'View')}
            >
              <Eye size={14} />
            </button>
            <button
              className="btn btn-outline btn-sm"
              onClick={() => handleShowQrCode(row)}
              title={t('showQrCode', 'Show QR Code')}
            >
              <QrCode size={14} />
            </button>
            {hasPermission('MANAGE_PETTY_CASH') && (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => openEditModal(row)}
                  title={t('edit', 'Edit')}
                >
                  <Edit size={14} />
                </button>
                <button
                  className="btn btn-warning btn-sm"
                  onClick={() => openResetPinModal(row)}
                  title={t('resetPin', 'Reset PIN')}
                >
                  <Key size={14} />
                </button>
                {row.is_active ? (
                  <button
                    className="btn btn-warning btn-sm"
                    onClick={() => openDeactivateModal(row)}
                    title={t('deactivate', 'Deactivate')}
                  >
                    <Ban size={14} />
                  </button>
                ) : (
                  <button
                    className="btn btn-success btn-sm"
                    onClick={() => handleReactivateUser(row)}
                    title={t('reactivate', 'Reactivate')}
                  >
                    <PlayCircle size={14} />
                  </button>
                )}
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDeleteUser(row)}
                  title={t('delete', 'Delete')}
                >
                  <Trash2 size={14} />
                </button>
              </>
            )}
          </div>
        );
      },
    },
  ];

  const availableCards = getAvailableCards();

  return (
    <div className="pc-users-section">
      {/* Section Header */}
      <div className="section-header">
        <h2>
          <Users size={24} />
          {t('pettyCashUsers', 'Petty Cash Users')}
        </h2>
        <div className="section-actions">
          <button
            className="btn btn-secondary"
            onClick={loadUsers}
            disabled={loading}
            style={{ marginRight: '8px' }}
          >
            <RefreshCw size={16} className={loading ? 'spinning' : ''} />
          </button>
          {hasPermission('MANAGE_PETTY_CASH') && (
            <button className="btn btn-primary" onClick={openCreateModal}>
              <Plus size={16} />
              {t('addUser', 'Add User')}
            </button>
          )}
        </div>
      </div>

      {/* Info Banner */}
      <div className="info-banner">
        <AlertCircle size={16} />
        <span>
          {t(
            'pcUsersInfo',
            'Petty cash users can submit expenses via mobile by scanning their QR code and entering their PIN.'
          )}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-banner">
          <AlertCircle size={16} />
          <span>{error}</span>
          <button onClick={() => setError(null)}>×</button>
        </div>
      )}

      {/* Users Table */}
      <DataTable
        data={users}
        columns={columns}
        searchable={true}
        sortable={true}
        paginated={true}
        loading={loading || parentLoading}
        emptyMessage={t('noUsersFound', 'No petty cash users found')}
      />

      {/* Create User Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title={t('addPettyCashUser', 'Add Petty Cash User')}
        size="md"
      >
        <form onSubmit={handleCreateUser} className="pc-user-form">
          {formError && (
            <div className="form-error">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div className="form-group">
            <label>{t('selectCard', 'Select Card')} *</label>
            <select
              name="cardId"
              value={formData.cardId}
              onChange={handleInputChange}
              required
            >
              <option value="">{t('selectCardPlaceholder', '-- Select a card --')}</option>
              {availableCards.map((card) => (
                <option key={card.id} value={card.id}>
                  {card.cardNumber} - {formatCurrency(card.currentBalance)}
                </option>
              ))}
            </select>
            {availableCards.length === 0 && (
              <span className="form-hint warning">
                {t('noAvailableCards', 'No available cards. Create a new card first or ensure existing cards are not already assigned.')}
              </span>
            )}
          </div>

          <div className="form-group">
            <label>{t('fullName', 'Full Name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder={t('enterFullName', 'Enter full name')}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('phone', 'Phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder={t('enterPhone', 'Enter phone number')}
              />
            </div>

            <div className="form-group">
              <label>{t('department', 'Department')}</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                placeholder={t('enterDepartment', 'e.g., Driver, Cleaner')}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('employeeId', 'Employee ID')}</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
              placeholder={t('optionalReference', 'Optional reference number')}
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('pin', 'PIN')} *</label>
              <input
                type="password"
                name="pin"
                value={formData.pin}
                onChange={handleInputChange}
                placeholder="4-6 digits"
                maxLength={6}
                pattern="\d{4,6}"
                required
              />
            </div>

            <div className="form-group">
              <label>{t('confirmPin', 'Confirm PIN')} *</label>
              <input
                type="password"
                name="confirmPin"
                value={formData.confirmPin}
                onChange={handleInputChange}
                placeholder="Re-enter PIN"
                maxLength={6}
                pattern="\d{4,6}"
                required
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowCreateModal(false)}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting || availableCards.length === 0}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  {t('creating', 'Creating...')}
                </>
              ) : (
                <>
                  <Plus size={16} />
                  {t('createUser', 'Create User')}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title={t('editPettyCashUser', 'Edit Petty Cash User')}
        size="md"
      >
        <form onSubmit={handleEditUser} className="pc-user-form">
          {formError && (
            <div className="form-error">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div className="form-group">
            <label>{t('fullName', 'Full Name')} *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>{t('phone', 'Phone')}</label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
              />
            </div>

            <div className="form-group">
              <label>{t('department', 'Department')}</label>
              <input
                type="text"
                name="department"
                value={formData.department}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label>{t('employeeId', 'Employee ID')}</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              onChange={handleInputChange}
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowEditModal(false)}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  {t('saving', 'Saving...')}
                </>
              ) : (
                t('saveChanges', 'Save Changes')
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* Reset PIN Modal */}
      <Modal
        isOpen={showResetPinModal}
        onClose={() => setShowResetPinModal(false)}
        title={t('resetPin', 'Reset PIN')}
        size="sm"
      >
        <form onSubmit={handleResetPin} className="pc-user-form">
          {formError && (
            <div className="form-error">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <p className="form-description">
            {t('resetPinDescription', 'Enter a new 4-6 digit PIN for')} <strong>{selectedUser?.name}</strong>
          </p>

          <div className="form-group">
            <label>{t('newPin', 'New PIN')} *</label>
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="4-6 digits"
              maxLength={6}
              pattern="\d{4,6}"
              required
            />
          </div>

          <div className="form-group">
            <label>{t('confirmNewPin', 'Confirm New PIN')} *</label>
            <input
              type="password"
              value={confirmNewPin}
              onChange={(e) => setConfirmNewPin(e.target.value)}
              placeholder="Re-enter PIN"
              maxLength={6}
              pattern="\d{4,6}"
              required
            />
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowResetPinModal(false)}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  {t('resetting', 'Resetting...')}
                </>
              ) : (
                <>
                  <Key size={16} />
                  {t('resetPin', 'Reset PIN')}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>

      {/* QR Code Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        title={t('qrCode', 'QR Code')}
        size="sm"
      >
        <div className="qr-modal-content">
          {qrCodeData?.qrCode && (
            <>
              <div className="qr-code-container">
                <img src={qrCodeData.qrCode} alt="QR Code" />
              </div>
              <p className="qr-user-name">{qrCodeData.userName || selectedUser?.name}</p>
              <p className="qr-instructions">
                {t('scanQrInstructions', 'Scan this QR code with a mobile device to access the expense portal')}
              </p>

              {/* Portal URL Display */}
              {qrCodeData?.portalUrl && (
                <div className="portal-url-container" style={{
                  background: '#f5f5f5',
                  border: '1px solid #ddd',
                  borderRadius: '6px',
                  padding: '0.75rem',
                  marginBottom: '1rem',
                  wordBreak: 'break-all'
                }}>
                  <label style={{
                    fontSize: '0.75rem',
                    color: '#666',
                    display: 'block',
                    marginBottom: '0.25rem',
                    fontWeight: '600'
                  }}>
                    {t('portalUrl', 'Portal URL')}
                  </label>
                  <code style={{
                    fontSize: '0.8rem',
                    color: '#333',
                    fontFamily: 'monospace'
                  }}>
                    {qrCodeData.portalUrl}
                  </code>
                </div>
              )}

              <div className="qr-actions">
                <button className="btn btn-secondary" onClick={copyPortalUrl}>
                  <Copy size={16} />
                  {t('copyLink', 'Copy Link')}
                </button>
                <button className="btn btn-secondary" onClick={printQrCode}>
                  <Printer size={16} />
                  {t('print', 'Print')}
                </button>
                <button className="btn btn-warning" onClick={handleRegenerateQr}>
                  <RefreshCw size={16} />
                  {t('regenerate', 'Regenerate')}
                </button>
              </div>
            </>
          )}
        </div>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={showViewModal}
        onClose={() => setShowViewModal(false)}
        title={t('userDetails', 'User Details')}
        size="md"
      >
        {selectedUser && (
          <div className="user-details">
            <div className="user-header">
              <div className="user-avatar">
                <Users size={32} />
              </div>
              <div className="user-info">
                <h3>{selectedUser.name}</h3>
                <span className={`status-badge ${selectedUser.is_active ? 'active' : 'inactive'}`}>
                  {selectedUser.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                </span>
              </div>
            </div>

            <div className="user-stats">
              <div className="stat">
                <span className="stat-label">{t('cardNumber', 'Card Number')}</span>
                <span className="stat-value">{selectedUser.cardNumber || '-'}</span>
              </div>
              <div className="stat">
                <span className="stat-label">{t('balance', 'Balance')}</span>
                <span className="stat-value">{formatCurrency(selectedUser.currentBalance)}</span>
              </div>
            </div>

            <div className="user-fields">
              {selectedUser.phone && (
                <div className="field">
                  <Phone size={16} />
                  <span>{selectedUser.phone}</span>
                </div>
              )}
              {selectedUser.department && (
                <div className="field">
                  <Building size={16} />
                  <span>{selectedUser.department}</span>
                </div>
              )}
              {selectedUser.employee_id && (
                <div className="field">
                  <span className="field-label">{t('employeeId', 'Employee ID')}:</span>
                  <span>{selectedUser.employee_id}</span>
                </div>
              )}
            </div>

            {/* Portal Access Section with QR Code */}
            {(selectedUser.portalUrl || selectedUser.qrCode) && (
              <div className="portal-access-section" style={{
                marginTop: '1rem',
                padding: '1rem',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                borderRadius: '8px',
                color: 'white'
              }}>
                <h4 style={{ marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <QrCode size={16} />
                  {t('portalAccess', 'Portal Access')}
                </h4>

                {/* QR Code Display */}
                {selectedUser.qrCode && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: '1rem'
                  }}>
                    <div style={{
                      background: 'white',
                      padding: '0.75rem',
                      borderRadius: '8px',
                      display: 'inline-block'
                    }}>
                      <img
                        src={selectedUser.qrCode}
                        alt="QR Code"
                        style={{
                          width: '150px',
                          height: '150px',
                          display: 'block'
                        }}
                      />
                    </div>
                  </div>
                )}

                {/* Portal URL */}
                {selectedUser.portalUrl && (
                  <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    padding: '0.75rem',
                    borderRadius: '6px',
                    marginBottom: '0.75rem'
                  }}>
                    <code style={{
                      fontSize: '0.75rem',
                      wordBreak: 'break-all',
                      color: 'white',
                      fontFamily: 'monospace'
                    }}>
                      {selectedUser.portalUrl}
                    </code>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                  {selectedUser.portalUrl && (
                    <>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem' }}
                        onClick={() => {
                          navigator.clipboard.writeText(selectedUser.portalUrl);
                          alert(t('urlCopied', 'URL copied to clipboard'));
                        }}
                        title={t('copyUrl', 'Copy URL')}
                      >
                        <Copy size={18} />
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem' }}
                        onClick={() => window.open(selectedUser.portalUrl, '_blank')}
                        title={t('openPortal', 'Open Portal')}
                      >
                        <ExternalLink size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {selectedUser.expenseSummary && (
              <div className="expense-summary">
                <h4>{t('expenseSummary', 'Expense Summary')}</h4>
                <div className="summary-grid">
                  <div className="summary-item">
                    <span className="label">{t('totalExpenses', 'Total Expenses')}</span>
                    <span className="value">{selectedUser.expenseSummary.totalExpenses}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">{t('approved', 'Approved')}</span>
                    <span className="value success">{formatCurrency(selectedUser.expenseSummary.totalApproved)}</span>
                  </div>
                  <div className="summary-item">
                    <span className="label">{t('pending', 'Pending')}</span>
                    <span className="value warning">{formatCurrency(selectedUser.expenseSummary.totalPending)}</span>
                  </div>
                </div>
              </div>
            )}

            {selectedUser.recentExpenses?.length > 0 && (
              <div className="recent-expenses">
                <h4>{t('recentExpenses', 'Recent Expenses')}</h4>
                <ul>
                  {selectedUser.recentExpenses.map((expense) => (
                    <li key={expense.id}>
                      <div className="expense-main">
                        <span className="expense-desc">{expense.description}</span>
                        <span className="expense-date">
                          {expense.created_at ? new Date(expense.created_at).toLocaleDateString('en-GB') : '-'}
                        </span>
                      </div>
                      <div className="expense-meta">
                        <span className="expense-amount">{formatCurrency(expense.amount)}</span>
                        <span className={`expense-status ${expense.status}`}>{expense.status}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transaction History Section */}
            <div className="transaction-history-section" style={{
              marginTop: '1rem',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <h4 style={{
                marginBottom: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                color: '#333'
              }}>
                <History size={18} />
                {t('transactionHistory', 'Transaction History')}
              </h4>

              {transactionsLoading ? (
                <div style={{ textAlign: 'center', padding: '1rem' }}>
                  <Loader2 size={24} className="spinning" />
                  <p style={{ marginTop: '0.5rem', color: '#666' }}>
                    {t('loadingTransactions', 'Loading transactions...')}
                  </p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="transaction-list" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {transactions.map((txn) => {
                    const typeInfo = getTransactionTypeInfo(txn.transaction_type);
                    return (
                      <div key={txn.id} style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        padding: '0.75rem',
                        borderBottom: '1px solid #e9ecef',
                        background: 'white'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                          <div style={{
                            color: typeInfo.color,
                            marginTop: '2px'
                          }}>
                            {typeInfo.icon}
                          </div>
                          <div>
                            <div style={{
                              fontWeight: '500',
                              color: '#333',
                              marginBottom: '0.25rem'
                            }}>
                              {typeInfo.label}
                            </div>
                            {txn.description && (
                              <div style={{ fontSize: '0.85rem', color: '#666' }}>
                                {txn.description}
                              </div>
                            )}
                            <div style={{ fontSize: '0.75rem', color: '#999', marginTop: '0.25rem' }}>
                              {txn.transaction_date
                                ? new Date(txn.transaction_date).toLocaleString('en-GB', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '-'}
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{
                            fontWeight: '600',
                            color: txn.amount >= 0 ? '#28a745' : '#dc3545'
                          }}>
                            {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                          </div>
                          {txn.balance_after !== null && (
                            <div style={{ fontSize: '0.75rem', color: '#666' }}>
                              {t('balance', 'Balance')}: {formatCurrency(txn.balance_after)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{
                  textAlign: 'center',
                  padding: '1.5rem',
                  color: '#666',
                  background: 'white',
                  borderRadius: '4px'
                }}>
                  <History size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                  <p>{t('noTransactionsFound', 'No transactions found')}</p>
                </div>
              )}
            </div>

            {/* Deactivation Info (if deactivated) */}
            {!selectedUser.is_active && selectedUser.deactivation_reason && (
              <div style={{
                marginTop: '1rem',
                padding: '1rem',
                background: '#fff3cd',
                border: '1px solid #ffc107',
                borderRadius: '8px'
              }}>
                <h4 style={{
                  marginBottom: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#856404'
                }}>
                  <Ban size={16} />
                  {t('deactivationInfo', 'Deactivation Information')}
                </h4>
                <p style={{ margin: 0, color: '#856404' }}>
                  <strong>{t('reason', 'Reason')}:</strong> {selectedUser.deactivation_reason}
                </p>
                {selectedUser.deactivated_at && (
                  <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#856404' }}>
                    <strong>{t('deactivatedOn', 'Deactivated on')}:</strong>{' '}
                    {new Date(selectedUser.deactivated_at).toLocaleString('en-GB')}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Deactivation Reason Modal */}
      <Modal
        isOpen={showDeactivateModal}
        onClose={() => setShowDeactivateModal(false)}
        title={t('deactivateUser', 'Deactivate User')}
        size="sm"
      >
        <form onSubmit={handleDeactivateUser} className="pc-user-form">
          {formError && (
            <div className="form-error">
              <AlertCircle size={16} />
              {formError}
            </div>
          )}

          <div style={{
            padding: '1rem',
            background: '#fff3cd',
            border: '1px solid #ffc107',
            borderRadius: '8px',
            marginBottom: '1rem'
          }}>
            <p style={{ margin: 0, color: '#856404' }}>
              <strong>{t('warning', 'Warning')}:</strong>{' '}
              {t(
                'deactivateUserWarning',
                `Deactivating ${selectedUser?.name} will prevent them from accessing the petty cash portal.`
              )}
            </p>
          </div>

          <div className="form-group">
            <label>{t('deactivationReason', 'Reason for Deactivation')} *</label>
            <textarea
              value={deactivationReason}
              onChange={(e) => setDeactivationReason(e.target.value)}
              placeholder={t('enterDeactivationReason', 'Enter the reason for deactivation...')}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '6px',
                resize: 'vertical'
              }}
              required
            />
            <span style={{ fontSize: '0.75rem', color: '#666' }}>
              {t('minChars', 'Minimum 5 characters')}
            </span>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowDeactivateModal(false)}
            >
              {t('cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              className="btn btn-warning"
              disabled={submitting || deactivationReason.trim().length < 5}
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="spinning" />
                  {t('deactivating', 'Deactivating...')}
                </>
              ) : (
                <>
                  <Ban size={16} />
                  {t('deactivate', 'Deactivate')}
                </>
              )}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default PettyCashUsersSection;
