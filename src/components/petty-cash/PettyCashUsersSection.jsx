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
// CSS moved to global index.css Tailwind

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
  const getAvailableCards = (excludeUserId = null) => {
    const assignedCardIds = users
      .filter((u) => excludeUserId ? u.id !== excludeUserId : true)
      .map((u) => u.card_id)
      .filter(Boolean);
    return cards.filter(
      (card) =>
        card.status === 'active' &&
        !assignedCardIds.includes(card.id)
    );
  };

  // Format card display name (name + number)
  const formatCardOption = (card) => {
    const name = card.cardName || card.staffName || card.name;
    if (name) {
      return `${name} (${card.cardNumber})`;
    }
    return card.cardNumber;
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
        cardId: formData.cardId ? parseInt(formData.cardId) : null,
        name: formData.name,
        phone: formData.phone || null,
        department: formData.department || null,
        employeeId: formData.employeeId || null,
      });

      if (result.success) {
        setShowEditModal(false);
        loadUsers();
        onRefresh?.(); // Refresh cards list to update assigned staff column
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
      cardId: user.card_id || '',
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
          <div className="flex items-center gap-1 flex-wrap">
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
    <div>
      {/* Section Header - Right-aligned actions like other pages */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-slate-800">
          <Users size={20} />
          {t('pettyCashUsers', 'Petty Cash Users')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-outline"
            onClick={loadUsers}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
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
      <div className="flex items-center gap-2 p-3 mb-4 bg-blue-50 border border-blue-200 text-blue-800 text-sm">
        <AlertCircle size={16} className="flex-shrink-0" />
        <span>
          {t(
            'pcUsersInfo',
            'Petty cash users can submit expenses via mobile by scanning their QR code and entering their PIN.'
          )}
        </span>
      </div>

      {/* Error Display */}
      {error && (
        <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 text-red-800 text-sm">
          <AlertCircle size={16} className="flex-shrink-0" />
          <span className="flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="p-1 hover:bg-red-100 transition-colors"
          >
            ×
          </button>
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
                  {formatCardOption(card)} - {formatCurrency(card.currentBalance)}
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
                  <Loader2 size={16} className="animate-spin" />
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

          {/* Card Assignment - show available cards + current card */}
          <div className="form-group">
            <label>{t('assignedCard', 'Assigned Card')}</label>
            <select
              name="cardId"
              value={formData.cardId}
              onChange={handleInputChange}
            >
              <option value="">{t('noCardAssigned', '-- No card assigned --')}</option>
              {/* Show available cards for this user (includes their current card) */}
              {getAvailableCards(selectedUser?.id).map((card) => (
                <option key={card.id} value={card.id}>
                  {formatCardOption(card)} - {formatCurrency(card.currentBalance)}
                </option>
              ))}
              {/* If user has a card that's not in available cards, show it separately */}
              {selectedUser?.card_id && !getAvailableCards(selectedUser?.id).find(c => c.id === selectedUser.card_id) && (
                <option value={selectedUser.card_id}>
                  {selectedUser.cardNumber || `Card #${selectedUser.card_id}`} (current)
                </option>
              )}
            </select>
            <span className="form-hint">
              {t('cardAssignmentHint', 'Assign or change the petty cash card for this user')}
            </span>
          </div>

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
                  <Loader2 size={16} className="animate-spin" />
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
                  <Loader2 size={16} className="animate-spin" />
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
        <div className="flex flex-col items-center">
          {qrCodeData?.qrCode && (
            <>
              {/* QR Code Display */}
              <div className="p-4 bg-white border border-slate-200 mb-4">
                <img src={qrCodeData.qrCode} alt="QR Code" className="w-48 h-48" />
              </div>

              {/* User Name */}
              <p className="text-lg font-semibold text-slate-800 mb-2">
                {qrCodeData.userName || selectedUser?.name}
              </p>

              {/* Instructions */}
              <p className="text-sm text-slate-500 text-center mb-4">
                {t('scanQrInstructions', 'Scan this QR code with a mobile device to access the expense portal')}
              </p>

              {/* Portal URL Display */}
              {qrCodeData?.portalUrl && (
                <div className="w-full p-3 bg-slate-50 border border-slate-200 mb-4">
                  <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                    {t('portalUrl', 'Portal URL')}
                  </label>
                  <code className="text-xs text-slate-700 font-mono break-all">
                    {qrCodeData.portalUrl}
                  </code>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <button className="btn btn-outline btn-sm" onClick={copyPortalUrl}>
                  <Copy size={14} />
                  {t('copyLink', 'Copy Link')}
                </button>
                <button className="btn btn-outline btn-sm" onClick={printQrCode}>
                  <Printer size={14} />
                  {t('print', 'Print')}
                </button>
                <button className="btn btn-warning btn-sm" onClick={handleRegenerateQr}>
                  <RefreshCw size={14} />
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
          <div className="space-y-4">
            {/* User Header */}
            <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
              <div className="w-14 h-14 bg-slate-100 flex items-center justify-center text-slate-500">
                <Users size={28} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-800">{selectedUser.name}</h3>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium mt-1 ${
                  selectedUser.is_active
                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    : 'bg-slate-100 text-slate-500 border border-slate-200'
                }`}>
                  {selectedUser.is_active ? t('active', 'Active') : t('inactive', 'Inactive')}
                </span>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200">
                <span className="block text-xs text-slate-500 uppercase tracking-wider mb-1">{t('cardNumber', 'Card Number')}</span>
                <span className="text-sm font-semibold text-slate-800 font-mono">{selectedUser.cardNumber || '-'}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200">
                <span className="block text-xs text-emerald-600 uppercase tracking-wider mb-1">{t('balance', 'Balance')}</span>
                <span className="text-lg font-bold text-emerald-700">{formatCurrency(selectedUser.currentBalance)}</span>
              </div>
            </div>

            {/* User Fields */}
            {(selectedUser.phone || selectedUser.department || selectedUser.employee_id) && (
              <div className="flex flex-wrap gap-4 text-sm text-slate-600">
                {selectedUser.phone && (
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-400" />
                    <span>{selectedUser.phone}</span>
                  </div>
                )}
                {selectedUser.department && (
                  <div className="flex items-center gap-2">
                    <Building size={14} className="text-slate-400" />
                    <span>{selectedUser.department}</span>
                  </div>
                )}
                {selectedUser.employee_id && (
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{t('employeeId', 'Employee ID')}:</span>
                    <span className="font-medium">{selectedUser.employee_id}</span>
                  </div>
                )}
              </div>
            )}

            {/* Portal Access Section with QR Code */}
            {(selectedUser.portalUrl || selectedUser.qrCode) && (
              <div className="p-4 bg-blue-50 border border-blue-200">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-blue-800 mb-3">
                  <QrCode size={16} />
                  {t('portalAccess', 'Portal Access')}
                </h4>

                {/* QR Code Display */}
                {selectedUser.qrCode && (
                  <div className="flex justify-center mb-3">
                    <div className="p-3 bg-white border border-blue-200">
                      <img
                        src={selectedUser.qrCode}
                        alt="QR Code"
                        className="w-32 h-32"
                      />
                    </div>
                  </div>
                )}

                {/* Portal URL */}
                {selectedUser.portalUrl && (
                  <div className="p-2 bg-white border border-blue-200 mb-3">
                    <code className="text-xs text-slate-700 font-mono break-all">
                      {selectedUser.portalUrl}
                    </code>
                  </div>
                )}

                <div className="flex items-center justify-center gap-2">
                  {selectedUser.portalUrl && (
                    <>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => {
                          navigator.clipboard.writeText(selectedUser.portalUrl);
                          alert(t('urlCopied', 'URL copied to clipboard'));
                        }}
                        title={t('copyUrl', 'Copy URL')}
                      >
                        <Copy size={14} />
                        {t('copy', 'Copy')}
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => window.open(selectedUser.portalUrl, '_blank')}
                        title={t('openPortal', 'Open Portal')}
                      >
                        <ExternalLink size={14} />
                        {t('open', 'Open')}
                      </button>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Expense Summary */}
            {selectedUser.expenseSummary && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('expenseSummary', 'Expense Summary')}</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 text-center">
                    <span className="block text-xs text-slate-500 mb-1">{t('totalExpenses', 'Total')}</span>
                    <span className="text-lg font-bold text-slate-800">{selectedUser.expenseSummary.totalExpenses}</span>
                  </div>
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-center">
                    <span className="block text-xs text-emerald-600 mb-1">{t('approved', 'Approved')}</span>
                    <span className="text-lg font-bold text-emerald-700">{formatCurrency(selectedUser.expenseSummary.totalApproved)}</span>
                  </div>
                  <div className="p-3 bg-amber-50 border border-amber-200 text-center">
                    <span className="block text-xs text-amber-600 mb-1">{t('pending', 'Pending')}</span>
                    <span className="text-lg font-bold text-amber-700">{formatCurrency(selectedUser.expenseSummary.totalPending)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Expenses */}
            {selectedUser.recentExpenses?.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('recentExpenses', 'Recent Expenses')}</h4>
                <div className="border border-slate-200 divide-y divide-slate-200">
                  {selectedUser.recentExpenses.map((expense) => (
                    <div key={expense.id} className="flex items-center justify-between p-3 bg-white hover:bg-slate-50">
                      <div>
                        <span className="block text-sm text-slate-800">{expense.description}</span>
                        <span className="text-xs text-slate-500">
                          {expense.created_at ? new Date(expense.created_at).toLocaleDateString('en-GB') : '-'}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="block text-sm font-semibold text-slate-800">{formatCurrency(expense.amount)}</span>
                        <span className={`inline-block px-2 py-0.5 text-xs font-medium ${
                          expense.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                          expense.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                          'bg-red-50 text-red-700'
                        }`}>
                          {expense.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Transaction History Section */}
            <div className="p-4 bg-slate-50 border border-slate-200">
              <h4 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
                <History size={16} />
                {t('transactionHistory', 'Transaction History')}
              </h4>

              {transactionsLoading ? (
                <div className="flex flex-col items-center justify-center py-6 text-slate-500">
                  <Loader2 size={24} className="animate-spin mb-2" />
                  <p className="text-sm">{t('loadingTransactions', 'Loading transactions...')}</p>
                </div>
              ) : transactions.length > 0 ? (
                <div className="max-h-72 overflow-y-auto border border-slate-200 bg-white divide-y divide-slate-200">
                  {transactions.map((txn) => {
                    const typeInfo = getTransactionTypeInfo(txn.transaction_type);
                    return (
                      <div key={txn.id} className="flex items-start justify-between p-3">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5" style={{ color: typeInfo.color }}>
                            {typeInfo.icon}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-800">{typeInfo.label}</div>
                            {txn.description && (
                              <div className="text-xs text-slate-500">{txn.description}</div>
                            )}
                            <div className="text-xs text-slate-400 mt-1">
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
                        <div className="text-right">
                          <div className={`text-sm font-semibold ${txn.amount >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                            {txn.amount >= 0 ? '+' : ''}{formatCurrency(txn.amount)}
                          </div>
                          {txn.balance_after !== null && (
                            <div className="text-xs text-slate-500">
                              {t('balance', 'Balance')}: {formatCurrency(txn.balance_after)}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 bg-white border border-slate-200 text-slate-400">
                  <History size={32} className="mb-2 opacity-30" />
                  <p className="text-sm">{t('noTransactionsFound', 'No transactions found')}</p>
                </div>
              )}
            </div>

            {/* Deactivation Info (if deactivated) */}
            {!selectedUser.is_active && selectedUser.deactivation_reason && (
              <div className="p-4 bg-amber-50 border border-amber-200">
                <h4 className="flex items-center gap-2 text-sm font-semibold text-amber-800 mb-2">
                  <Ban size={16} />
                  {t('deactivationInfo', 'Deactivation Information')}
                </h4>
                <p className="text-sm text-amber-700">
                  <strong>{t('reason', 'Reason')}:</strong> {selectedUser.deactivation_reason}
                </p>
                {selectedUser.deactivated_at && (
                  <p className="text-xs text-amber-600 mt-1">
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
                  <Loader2 size={16} className="animate-spin" />
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
