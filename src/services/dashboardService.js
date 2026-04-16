/**
 * Dashboard Service
 * Fetches aggregated data for role-specific dashboards.
 */
import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class DashboardService {
  async getExecutive() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/dashboards/executive`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getOperations() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/dashboards/operations`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getAccountant() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/dashboards/accountant`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async getSales() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/dashboards/sales`);
      return { success: true, data: data.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

const dashboardService = new DashboardService();
export default dashboardService;
