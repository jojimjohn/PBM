import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class VehicleTypeService {
  async getAll(activeOnly = false) {
    try {
      const qs = activeOnly ? '?active_only=true' : '';
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-types${qs}`);
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching vehicle types:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async create(typeData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-types`, {
        method: 'POST', body: JSON.stringify(typeData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async update(id, typeData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-types/${id}`, {
        method: 'PUT', body: JSON.stringify(typeData)
      });
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/vehicle-types/${id}`, {
        method: 'DELETE'
      });
      return { success: true, message: data.message };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const vehicleTypeService = new VehicleTypeService();
export default vehicleTypeService;
