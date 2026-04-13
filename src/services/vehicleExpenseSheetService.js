import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class VehicleExpenseSheetService {
  async getAll(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.date) query.set('date', params.date);
      if (params.from) query.set('from', params.from);
      if (params.to) query.set('to', params.to);
      if (params.vehiclePlate) query.set('vehiclePlate', params.vehiclePlate);
      if (params.status) query.set('status', params.status);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);
      const qs = query.toString();
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-expense-sheets${qs ? `?${qs}` : ''}`);
      return { success: true, data: data.data || [], pagination: data.pagination };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async getById(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-expense-sheets/${id}`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  async create(sheetData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-expense-sheets`, {
        method: 'POST', body: JSON.stringify(sheetData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, sheetData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-expense-sheets/${id}`, {
        method: 'PUT', body: JSON.stringify(sheetData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async submit(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-expense-sheets/${id}/submit`, {
        method: 'POST'
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async approve(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-expense-sheets/${id}/approve`, {
        method: 'POST'
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getCarryForward(vehiclePlate, date) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/vehicle-expense-sheets/carry-forward?vehiclePlate=${encodeURIComponent(vehiclePlate)}&date=${date}`
      );
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const vehicleExpenseSheetService = new VehicleExpenseSheetService();
export default vehicleExpenseSheetService;
