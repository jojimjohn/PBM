/**
 * Employee Service
 * Handles all employee-related API operations
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class EmployeeService {
  // =========================================================================
  // Employees CRUD
  // =========================================================================

  async getAll(params = {}) {
    try {
      const query = new URLSearchParams();
      if (params.status) query.set('status', params.status);
      if (params.search) query.set('search', params.search);
      if (params.department) query.set('department', params.department);
      if (params.employee_type) query.set('employee_type', params.employee_type);
      if (params.page) query.set('page', params.page);
      if (params.limit) query.set('limit', params.limit);

      const qs = query.toString();
      const url = `${API_BASE_URL}/employees${qs ? `?${qs}` : ''}`;
      const data = await authService.makeAuthenticatedRequest(url);

      return { success: true, data: data.data || [], pagination: data.pagination };
    } catch (error) {
      console.error('Error fetching employees:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async getById(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${id}`
      );
      return { success: true, data: data.data };
    } catch (error) {
      console.error('Error fetching employee:', error);
      return { success: false, error: error.message, data: null };
    }
  }

  async create(employeeData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees`,
        { method: 'POST', body: JSON.stringify(employeeData) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error creating employee:', error);
      return { success: false, error: error.message };
    }
  }

  async update(id, employeeData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${id}`,
        { method: 'PUT', body: JSON.stringify(employeeData) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error updating employee:', error);
      return { success: false, error: error.message };
    }
  }

  async delete(id) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${id}`,
        { method: 'DELETE' }
      );
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error deactivating employee:', error);
      return { success: false, error: error.message };
    }
  }

  // =========================================================================
  // Addresses
  // =========================================================================

  async updateAddresses(employeeId, addresses) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/addresses`,
        { method: 'PUT', body: JSON.stringify({ addresses }) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error updating addresses:', error);
      return { success: false, error: error.message };
    }
  }

  // =========================================================================
  // Documents
  // =========================================================================

  async getDocuments(employeeId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/documents`
      );
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching documents:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async addDocument(employeeId, docData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/documents`,
        { method: 'POST', body: JSON.stringify(docData) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error adding document:', error);
      return { success: false, error: error.message };
    }
  }

  async updateDocument(employeeId, docId, docData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/documents/${docId}`,
        { method: 'PUT', body: JSON.stringify(docData) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error updating document:', error);
      return { success: false, error: error.message };
    }
  }

  // =========================================================================
  // Location Assignments
  // =========================================================================

  async getLocationAssignments(employeeId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/location-assignments`
      );
      return { success: true, data: data.data || [] };
    } catch (error) {
      console.error('Error fetching location assignments:', error);
      return { success: false, error: error.message, data: [] };
    }
  }

  async assignLocation(employeeId, assignmentData) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/location-assignments`,
        { method: 'POST', body: JSON.stringify(assignmentData) }
      );
      return { success: true, data: data.data, message: data.message };
    } catch (error) {
      console.error('Error assigning location:', error);
      return { success: false, error: error.message };
    }
  }

  async removeLocationAssignment(employeeId, assignmentId) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/${employeeId}/location-assignments/${assignmentId}`,
        { method: 'DELETE' }
      );
      return { success: true, message: data.message };
    } catch (error) {
      console.error('Error removing assignment:', error);
      return { success: false, error: error.message };
    }
  }

  // =========================================================================
  // Expiry Alerts
  // =========================================================================

  async getExpiryAlerts(days = 60) {
    try {
      const data = await authService.makeAuthenticatedRequest(
        `${API_BASE_URL}/employees/expiry-alerts?days=${days}`
      );
      return { success: true, data: data.data || [], meta: data.meta };
    } catch (error) {
      console.error('Error fetching expiry alerts:', error);
      return { success: false, error: error.message, data: [] };
    }
  }
}

const employeeService = new EmployeeService();
export default employeeService;
