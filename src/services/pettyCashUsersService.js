/**
 * Petty Cash Users Service (Admin)
 *
 * API service for managing petty cash users from the admin dashboard.
 * Uses system authentication (not portal auth).
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api';

const BASE_PATH = `${API_BASE_URL}/petty-cash-users`;

/**
 * Get all petty cash users with optional filtering
 * @param {object} params - Query parameters (page, limit, cardId, department, isActive, search)
 */
const getAll = async (params = {}) => {
  try {
    const queryString = new URLSearchParams(params).toString();
    const endpoint = `${BASE_PATH}${queryString ? `?${queryString}` : ''}`;
    return await authService.makeAuthenticatedRequest(endpoint);
  } catch (error) {
    console.error('Error fetching petty cash users:', error);
    return { success: false, error: error.message || 'Failed to fetch petty cash users' };
  }
};

/**
 * Get specific petty cash user by ID
 * @param {number} userId - Petty cash user ID
 */
const getById = async (userId) => {
  try {
    return await authService.makeAuthenticatedRequest(`${BASE_PATH}/${userId}`);
  } catch (error) {
    console.error('Error fetching petty cash user:', error);
    return { success: false, error: error.message || 'Failed to fetch petty cash user' };
  }
};

/**
 * Create new petty cash user
 * @param {object} userData - User data including cardId, name, phone, department, employeeId, pin
 */
const create = async (userData) => {
  try {
    return await authService.makeAuthenticatedRequest(BASE_PATH, {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('Error creating petty cash user:', error);
    return { success: false, error: error.message || 'Failed to create petty cash user' };
  }
};

/**
 * Update petty cash user
 * @param {number} userId - Petty cash user ID
 * @param {object} userData - Updated user data
 */
const update = async (userId, userData) => {
  try {
    return await authService.makeAuthenticatedRequest(`${BASE_PATH}/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  } catch (error) {
    console.error('Error updating petty cash user:', error);
    return { success: false, error: error.message || 'Failed to update petty cash user' };
  }
};

/**
 * Delete (deactivate) petty cash user
 * @param {number} userId - Petty cash user ID
 */
const remove = async (userId) => {
  try {
    return await authService.makeAuthenticatedRequest(`${BASE_PATH}/${userId}`, {
      method: 'DELETE',
    });
  } catch (error) {
    console.error('Error deleting petty cash user:', error);
    return { success: false, error: error.message || 'Failed to delete petty cash user' };
  }
};

/**
 * Reset user's PIN
 * @param {number} userId - Petty cash user ID
 * @param {string} newPin - New 4-6 digit PIN
 */
const resetPin = async (userId, newPin) => {
  try {
    return await authService.makeAuthenticatedRequest(`${BASE_PATH}/${userId}/reset-pin`, {
      method: 'POST',
      body: JSON.stringify({ newPin }),
    });
  } catch (error) {
    console.error('Error resetting PIN:', error);
    return { success: false, error: error.message || 'Failed to reset PIN' };
  }
};

/**
 * Get QR code for user
 * @param {number} userId - Petty cash user ID
 */
const getQrCode = async (userId) => {
  try {
    return await authService.makeAuthenticatedRequest(`${BASE_PATH}/${userId}/qr-code`);
  } catch (error) {
    console.error('Error getting QR code:', error);
    return { success: false, error: error.message || 'Failed to get QR code' };
  }
};

/**
 * Regenerate QR token (invalidates old QR code)
 * @param {number} userId - Petty cash user ID
 */
const regenerateQr = async (userId) => {
  try {
    return await authService.makeAuthenticatedRequest(`${BASE_PATH}/${userId}/regenerate-qr`, {
      method: 'POST',
    });
  } catch (error) {
    console.error('Error regenerating QR:', error);
    return { success: false, error: error.message || 'Failed to regenerate QR code' };
  }
};

const pettyCashUsersService = {
  getAll,
  getById,
  create,
  update,
  remove,
  resetPin,
  getQrCode,
  regenerateQr,
};

export default pettyCashUsersService;
