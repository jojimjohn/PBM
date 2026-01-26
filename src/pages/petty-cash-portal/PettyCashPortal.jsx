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
// CSS moved to global index.css - using Tailwind classes

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
  const [projects, setProjects] = useState([]);
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

  // Load projects when user is authenticated
  useEffect(() => {
    const loadProjects = async () => {
      if (!user) return;
      const result = await pettyCashPortalService.getProjects();
      if (result.success) {
        setProjects(result.data);
      }
    };
    loadProjects();
  }, [user]);

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
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center p-6">
        <div className="flex flex-col items-center text-center max-w-sm">
          <div className="w-20 h-20 flex items-center justify-center bg-amber-100 text-amber-600 rounded-full mb-6">
            <AlertTriangle size={40} />
          </div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Invalid Link</h1>
          <p className="text-slate-600">Please scan the QR code on your petty cash card to access the portal.</p>
        </div>
      </div>
    );
  }

  // Loading screen
  if (isLoading && view === VIEWS.PIN_ENTRY) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200 flex items-center justify-center">
        <div className="flex flex-col items-center text-slate-500">
          <Loader2 size={48} className="animate-spin text-blue-500 mb-4" />
          <p className="text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 to-slate-200">
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
        <div className="max-w-md mx-auto px-4 py-6 space-y-4">
          {/* Header */}
          <header className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 flex items-center justify-center bg-blue-600 text-white rounded-lg">
                <Wallet size={22} />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-slate-900 uppercase">
                  PETTY CASH
                </h1>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest">Employee Portal</p>
              </div>
            </div>
            <button
              className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
              onClick={handleLogout}
            >
              <LogOut size={20} />
            </button>
          </header>

          {/* User Info Card */}
          <div className="bg-white border border-slate-200 p-4 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 flex items-center justify-center bg-blue-100 text-blue-600 rounded-full shrink-0">
                <User size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-semibold text-slate-800 truncate">{user.name}</h2>
                {user.department && (
                  <p className="text-sm text-slate-500">{user.department}</p>
                )}
                <p className="text-xs font-mono text-slate-400 mt-1">{user.cardNumber}</p>
              </div>
            </div>
          </div>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white p-5 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-emerald-100 uppercase tracking-wider">Available Balance</span>
              <button
                className="w-8 h-8 flex items-center justify-center text-emerald-200 hover:text-white hover:bg-emerald-400/30 rounded-full transition-colors"
                onClick={refreshUserData}
                disabled={isRefreshing}
              >
                <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
              </button>
            </div>
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-lg font-medium text-emerald-200">OMR</span>
              <span className="text-4xl font-bold tracking-tight">{(user.currentBalance || 0).toFixed(3)}</span>
            </div>
            {user.thisMonth && (
              <div className="pt-3 border-t border-emerald-400/40 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-emerald-200">This Month</span>
                  <span className="font-medium">
                    {user.thisMonth.approvedTotal?.toFixed(3) || '0.000'} approved
                  </span>
                </div>
                {user.thisMonth.pendingTotal > 0 && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-emerald-200">Pending</span>
                    <span className="font-medium text-amber-200">
                      {user.thisMonth.pendingTotal.toFixed(3)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              className="flex flex-col items-center justify-center gap-2 p-5 bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 active:scale-[0.98] transition-all"
              onClick={() => setView(VIEWS.NEW_EXPENSE)}
            >
              <Plus size={28} />
              <span>New Expense</span>
            </button>
            <button
              className="flex flex-col items-center justify-center gap-2 p-5 bg-white text-slate-700 font-semibold border border-slate-200 shadow-sm hover:bg-slate-50 active:scale-[0.98] transition-all"
              onClick={() => setView(VIEWS.HISTORY)}
            >
              <History size={28} />
              <span>History</span>
            </button>
          </div>
        </div>
      )}

      {/* New Expense View */}
      {view === VIEWS.NEW_EXPENSE && user && (
        <div className="max-w-md mx-auto">
          <ExpenseSubmitForm
            user={user}
            categories={categories}
            projects={projects}
            onSuccess={handleExpenseSuccess}
            onCancel={() => setView(VIEWS.DASHBOARD)}
          />
        </div>
      )}

      {/* History View */}
      {view === VIEWS.HISTORY && user && (
        <div className="max-w-md mx-auto">
          <header className="sticky top-0 bg-white/95 backdrop-blur-sm z-10 px-4 py-3 border-b border-slate-200 shadow-sm">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 transition-colors"
              onClick={() => setView(VIEWS.DASHBOARD)}
            >
              <span className="text-lg">←</span>
              <span>Back to Dashboard</span>
            </button>
          </header>
          <ExpenseHistory user={user} />
        </div>
      )}
    </div>
  );
};

export default PettyCashPortal;
