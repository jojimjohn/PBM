/**
 * Petty Cash Portal Service
 *
 * API service for the petty cash user portal.
 * This service handles communication with the /api/pc-portal endpoints.
 *
 * Unlike other services, this uses its own authentication (QR + PIN)
 * separate from the main system authentication.
 */

import { API_BASE_URL } from '../config/api.js';

const PC_PORTAL_BASE = `${API_BASE_URL}/pc-portal`;

/**
 * Get stored session token
 */
const getToken = () => {
  return localStorage.getItem('pcAccessToken');
};

/**
 * Set session token
 */
const setToken = (token) => {
  if (token) {
    localStorage.setItem('pcAccessToken', token);
  } else {
    localStorage.removeItem('pcAccessToken');
  }
};

/**
 * Clear session
 */
const clearSession = () => {
  localStorage.removeItem('pcAccessToken');
  localStorage.removeItem('pcUser');
};

/**
 * Make authenticated request to PC Portal API
 */
const makeRequest = async (endpoint, options = {}) => {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include cookies
  };

  const response = await fetch(`${PC_PORTAL_BASE}${endpoint}`, config);

  // Handle session expiration
  if (response.status === 401) {
    const data = await response.json();
    if (data.code === 'TOKEN_EXPIRED' || data.code === 'INVALID_TOKEN') {
      clearSession();
      // Dispatch event for portal to handle
      window.dispatchEvent(new CustomEvent('pcSessionExpired'));
    }
    throw new Error(data.error || 'Session expired');
  }

  return response;
};

/**
 * Login with QR token and PIN
 * @param {string} token - QR token from scanned code
 * @param {string} pin - User's PIN (4-6 digits)
 * @param {string} company - Company ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const login = async (token, pin, company) => {
  try {
    const response = await fetch(`${PC_PORTAL_BASE}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ token, pin, company }),
    });

    const data = await response.json();

    if (data.success && data.data?.token) {
      setToken(data.data.token);
      localStorage.setItem('pcUser', JSON.stringify(data.data.user));
    }

    return data;
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error.message || 'Login failed',
    };
  }
};

/**
 * Logout and clear session
 */
const logout = async () => {
  try {
    await fetch(`${PC_PORTAL_BASE}/logout`, {
      method: 'POST',
      credentials: 'include',
    });
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearSession();
  }
};

/**
 * Get current user info
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const getMe = async () => {
  try {
    const response = await makeRequest('/me');
    return await response.json();
  } catch (error) {
    console.error('Get user error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch user data',
    };
  }
};

/**
 * Get expense categories
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
const getCategories = async () => {
  try {
    const response = await fetch(`${PC_PORTAL_BASE}/categories`);
    return await response.json();
  } catch (error) {
    console.error('Get categories error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch categories',
    };
  }
};

/**
 * Get projects the PC user belongs to
 * Returns only active projects the user is assigned to via user_projects
 * @returns {Promise<{success: boolean, data?: array, error?: string}>}
 */
const getProjects = async () => {
  try {
    const response = await makeRequest('/projects');
    return await response.json();
  } catch (error) {
    console.error('Get projects error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch projects',
    };
  }
};

/**
 * Get expense history
 * @param {object} params - Query parameters (page, limit, status, category, dateFrom, dateTo)
 * @returns {Promise<{success: boolean, data?: array, pagination?: object, error?: string}>}
 */
const getExpenses = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `/expenses${queryString ? `?${queryString}` : ''}`;
    const response = await makeRequest(endpoint);
    return await response.json();
  } catch (error) {
    console.error('Get expenses error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch expenses',
    };
  }
};

/**
 * Get specific expense
 * @param {number} expenseId - Expense ID
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const getExpense = async (expenseId) => {
  try {
    const response = await makeRequest(`/expenses/${expenseId}`);
    return await response.json();
  } catch (error) {
    console.error('Get expense error:', error);
    return {
      success: false,
      error: error.message || 'Failed to fetch expense',
    };
  }
};

/**
 * Submit new expense
 * @param {object} expenseData - Expense data
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const submitExpense = async (expenseData) => {
  try {
    const response = await makeRequest('/expenses', {
      method: 'POST',
      body: JSON.stringify(expenseData),
    });
    return await response.json();
  } catch (error) {
    console.error('Submit expense error:', error);
    return {
      success: false,
      error: error.message || 'Failed to submit expense',
    };
  }
};

/**
 * Upload receipt for expense
 * @param {number} expenseId - Expense ID
 * @param {File} file - Receipt file
 * @returns {Promise<{success: boolean, data?: object, error?: string}>}
 */
const uploadReceipt = async (expenseId, file) => {
  try {
    const formData = new FormData();
    formData.append('receipt', file);

    const token = getToken();
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${PC_PORTAL_BASE}/expenses/${expenseId}/receipt`, {
      method: 'POST',
      headers,
      credentials: 'include',
      body: formData,
    });

    return await response.json();
  } catch (error) {
    console.error('Upload receipt error:', error);
    return {
      success: false,
      error: error.message || 'Failed to upload receipt',
    };
  }
};

/**
 * Check if user is authenticated (has valid token)
 */
const isAuthenticated = () => {
  return !!getToken();
};

/**
 * Get stored user info
 */
const getStoredUser = () => {
  try {
    const user = localStorage.getItem('pcUser');
    return user ? JSON.parse(user) : null;
  } catch {
    return null;
  }
};

const pettyCashPortalService = {
  login,
  logout,
  getMe,
  getCategories,
  getProjects,
  getExpenses,
  getExpense,
  submitExpense,
  uploadReceipt,
  isAuthenticated,
  getStoredUser,
  clearSession,
};

export default pettyCashPortalService;
