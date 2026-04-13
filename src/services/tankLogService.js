import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class TankLogService {
  // Storage Tanks
  async getTanks(activeOnly = false) {
    try {
      const qs = activeOnly ? '?active_only=true' : '';
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/storage-tanks${qs}`);
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async createTank(tankData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/storage-tanks`, {
        method: 'POST', body: JSON.stringify(tankData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateTank(id, tankData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/storage-tanks/${id}`, {
        method: 'PUT', body: JSON.stringify(tankData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async deleteTank(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/storage-tanks/${id}`, {
        method: 'DELETE'
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Daily Logs
  async getLogsByDate(date) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/tank-logs?date=${date}`);
      return { success: true, data: data.data || [], date: data.date };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async saveLog(logData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/tank-logs`, {
        method: 'POST', body: JSON.stringify(logData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Linkable collection orders (not yet linked to any tank log)
  async getLinkableCollections(date, search = '') {
    try {
      const params = new URLSearchParams();
      if (date) params.set('date', date);
      if (search) params.set('search', search);
      const qs = params.toString();
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/tank-logs/linkable-collections${qs ? `?${qs}` : ''}`
      );
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  // History
  async getTankHistory(tankId, from, to) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/tank-logs/${tankId}/history?from=${from}&to=${to}`
      );
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const tankLogService = new TankLogService();
export default tankLogService;
