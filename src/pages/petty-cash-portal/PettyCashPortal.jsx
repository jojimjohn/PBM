/**
 * Petty Cash Portal
 *
 * Main entry point for petty cash users.
 * Extracts token from URL, handles PIN authentication, and provides
 * a simple interface for expense submission and history viewing.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Wallet,
  Plus,
  History,
  LogOut,
  User,
  Loader2,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import pettyCashPortalService from '../../services/pettyCashPortalService';
import PinEntryScreen from './PinEntryScreen';
import ExpenseSubmitForm from './ExpenseSubmitForm';
import ExpenseHistory from './ExpenseHistory';
import './PettyCashPortal.css';

// View modes
const VIEWS = {
  PIN_ENTRY: 'pin_entry',
  DASHBOARD: 'dashboard',
  NEW_EXPENSE: 'new_expense',
  HISTORY: 'history',
};

const PettyCashPortal = () => {
  const [searchParams] = useSearchParams();
  const [view, setView] = useState(VIEWS.PIN_ENTRY);
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loginError, setLoginError] = useState(null);
  const [remainingAttempts, setRemainingAttempts] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Get token and company from URL
  const token = searchParams.get('token');
  const company = searchParams.get('company') || 'al-ramrami';

  // Check existing session
  useEffect(() => {
    const checkSession = async () => {
      if (pettyCashPortalService.isAuthenticated()) {
        // Try to get user data
        const result = await pettyCashPortalService.getMe();
        if (result.success) {
          setUser(result.data);
          setView(VIEWS.DASHBOARD);
        } else {
          // Session expired or invalid
          pettyCashPortalService.clearSession();
        }
      }
      setIsLoading(false);
    };

    checkSession();
  }, []);

  // Load categories
  useEffect(() => {
    const loadCategories = async () => {
      const result = await pettyCashPortalService.getCategories();
      if (result.success) {
        setCategories(result.data);
      }
    };
    loadCategories();
  }, []);

  // Handle session expiration
  useEffect(() => {
    const handleSessionExpired = () => {
      setUser(null);
      setView(VIEWS.PIN_ENTRY);
      setLoginError('Session expired. Please login again.');
    };

    window.addEventListener('pcSessionExpired', handleSessionExpired);
    return () => window.removeEventListener('pcSessionExpired', handleSessionExpired);
  }, []);

  // Handle PIN submission
  const handlePinSubmit = async (pin) => {
    if (!token) {
      setLoginError('Invalid QR code. Please scan again.');
      return;
    }

    setLoginError(null);
    setIsLoading(true);

    try {
      const result = await pettyCashPortalService.login(token, pin, company);

      if (result.success) {
        setUser(result.data.user);
        setView(VIEWS.DASHBOARD);
        setRemainingAttempts(null);
      } else {
        setLoginError(result.error || 'Login failed');
        if (result.remainingAttempts !== undefined) {
          setRemainingAttempts(result.remainingAttempts);
        }
      }
    } catch (error) {
      setLoginError(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle logout
  const handleLogout = async () => {
    await pettyCashPortalService.logout();
    setUser(null);
    setView(VIEWS.PIN_ENTRY);
    setLoginError(null);
    setRemainingAttempts(null);
  };

  // Refresh user data
  const refreshUserData = async () => {
    setIsRefreshing(true);
    const result = await pettyCashPortalService.getMe();
    if (result.success) {
      setUser(result.data);
    }
    setIsRefreshing(false);
  };

  // Handle expense submitted
  const handleExpenseSuccess = async () => {
    await refreshUserData();
    setView(VIEWS.DASHBOARD);
  };

  // Invalid QR code screen
  if (!token && !pettyCashPortalService.isAuthenticated()) {
    return (
      <div className="pc-portal">
        <div className="pc-portal-error">
          <AlertTriangle size={64} />
          <h1>Invalid Link</h1>
          <p>Please scan the QR code on your petty cash card to access the portal.</p>
        </div>
      </div>
    );
  }

  // Loading screen
  if (isLoading && view === VIEWS.PIN_ENTRY) {
    return (
      <div className="pc-portal">
        <div className="pc-portal-loading">
          <Loader2 size={48} className="spinning" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pc-portal">
      {/* PIN Entry View */}
      {view === VIEWS.PIN_ENTRY && (
        <PinEntryScreen
          onSubmit={handlePinSubmit}
          isLoading={isLoading}
          error={loginError}
          remainingAttempts={remainingAttempts}
          companyName={company === 'al-ramrami' ? 'Al Ramrami Trading' : 'Pride Muscat International'}
        />
      )}

      {/* Dashboard View */}
      {view === VIEWS.DASHBOARD && user && (
        <div className="pc-dashboard">
          {/* Header */}
          <header className="pc-header">
            <div className="pc-header-left">
              <Wallet size={28} />
              <span className="pc-title">Petty Cash</span>
            </div>
            <button className="pc-logout-btn" onClick={handleLogout}>
              <LogOut size={20} />
            </button>
          </header>

          {/* User Info Card */}
          <div className="pc-user-card">
            <div className="pc-user-info">
              <div className="pc-user-avatar">
                <User size={32} />
              </div>
              <div className="pc-user-details">
                <h2 className="pc-user-name">{user.name}</h2>
                {user.department && (
                  <p className="pc-user-department">{user.department}</p>
                )}
                <p className="pc-card-number">{user.cardNumber}</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="pc-balance-card">
            <div className="pc-balance-header">
              <span className="pc-balance-label">Available Balance</span>
              <button
                className="pc-refresh-btn"
                onClick={refreshUserData}
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? 'spinning' : ''} />
              </button>
            </div>
            <div className="pc-balance-amount">
              <span className="pc-currency">OMR</span>
              <span className="pc-amount">{(user.currentBalance || 0).toFixed(3)}</span>
            </div>
            {user.thisMonth && (
              <div className="pc-balance-footer">
                <div className="pc-stat">
                  <span className="pc-stat-label">This Month</span>
                  <span className="pc-stat-value pc-approved">
                    {user.thisMonth.approvedTotal?.toFixed(3) || '0.000'} approved
                  </span>
                </div>
                {user.thisMonth.pendingTotal > 0 && (
                  <div className="pc-stat">
                    <span className="pc-stat-value pc-pending">
                      {user.thisMonth.pendingTotal.toFixed(3)} pending
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="pc-actions">
            <button
              className="pc-action-btn pc-action-primary"
              onClick={() => setView(VIEWS.NEW_EXPENSE)}
            >
              <Plus size={24} />
              <span>New Expense</span>
            </button>
            <button
              className="pc-action-btn pc-action-secondary"
              onClick={() => setView(VIEWS.HISTORY)}
            >
              <History size={24} />
              <span>History</span>
            </button>
          </div>
        </div>
      )}

      {/* New Expense View */}
      {view === VIEWS.NEW_EXPENSE && user && (
        <div className="pc-view">
          <ExpenseSubmitForm
            user={user}
            categories={categories}
            onSuccess={handleExpenseSuccess}
            onCancel={() => setView(VIEWS.DASHBOARD)}
          />
        </div>
      )}

      {/* History View */}
      {view === VIEWS.HISTORY && user && (
        <div className="pc-view">
          <header className="pc-view-header">
            <button
              className="pc-back-btn"
              onClick={() => setView(VIEWS.DASHBOARD)}
            >
              ← Back
            </button>
          </header>
          <ExpenseHistory user={user} />
        </div>
      )}
    </div>
  );
};

export default PettyCashPortal;
