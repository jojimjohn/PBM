import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class VehicleService {
  async getAll(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.vehicle_type_id) query.set('vehicle_type_id', params.vehicle_type_id);
      if (params.search) query.set('search', params.search);
      const qs = query.toString();
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles${qs ? `?${qs}` : ''}`);
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching vehicles:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getById(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/${id}`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message, data: null };
    }
  }

  async create(vehicleData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles`, {
        method: 'POST', body: JSON.stringify(vehicleData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, vehicleData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'PUT', body: JSON.stringify(vehicleData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/${id}`, {
        method: 'DELETE'
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Documents
  async getDocuments(vehicleId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/${vehicleId}/documents`);
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  async addDocument(vehicleId, docData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/${vehicleId}/documents`, {
        method: 'POST', body: JSON.stringify(docData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async updateDocument(vehicleId, docId, docData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/${vehicleId}/documents/${docId}`, {
        method: 'PUT', body: JSON.stringify(docData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  // Expiry alerts
  async getExpiryAlerts(days = 60) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicles/expiry-alerts?days=${days}`);
      return { success: true, data: data.data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }
}

const vehicleService = new VehicleService();
export default vehicleService;
