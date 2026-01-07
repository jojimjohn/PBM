/**
 * Projects Service
 * Handles all project-related API operations including user assignments
 */

import authService from './authService';
import { API_BASE_URL } from '../config/api.js';

class ProjectsService {
  /**
   * Get all projects for the current company
   * @param {Object} options - Filter and pagination options
   */
  async getAll(options = {}) {
    try {
      const params = new URLSearchParams();
      if (options.status) params.append('status', options.status);
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page);
      if (options.limit) params.append('limit', options.limit);

      const queryString = params.toString();
      const url = `${API_BASE_URL}/projects${queryString ? `?${queryString}` : ''}`;

      const data = await authService.makeAuthenticatedRequest(url);

      return {
        success: true,
        data: data.data || [],
        pagination: data.pagination,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch projects',
        data: []
      };
    }
  }

  /**
   * Get project statistics
   */
  async getStatistics() {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/statistics`);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching project statistics:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch statistics',
        data: null
      };
    }
  }

  /**
   * Get projects assigned to the current user
   * @param {boolean} activeOnly - Only return active projects
   */
  async getMyProjects(activeOnly = true) {
    try {
      const url = `${API_BASE_URL}/projects/my-projects?activeOnly=${activeOnly}`;
      const data = await authService.makeAuthenticatedRequest(url);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching user projects:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch your projects',
        data: []
      };
    }
  }

  /**
   * Get a specific project by ID with details
   * @param {number} projectId - Project ID
   */
  async getById(projectId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}`);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching project:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch project',
        data: null
      };
    }
  }

  /**
   * Create a new project
   * @param {Object} projectData - Project data
   */
  async create(projectData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Project created successfully'
      };
    } catch (error) {
      console.error('Error creating project:', error);
      return {
        success: false,
        error: error.message || 'Failed to create project'
      };
    }
  }

  /**
   * Update an existing project
   * @param {number} projectId - Project ID
   * @param {Object} projectData - Updated project data
   */
  async update(projectId, projectData) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(projectData),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Project updated successfully'
      };
    } catch (error) {
      console.error('Error updating project:', error);
      return {
        success: false,
        error: error.message || 'Failed to update project'
      };
    }
  }

  /**
   * Update project status
   * @param {number} projectId - Project ID
   * @param {string} status - New status (active, closed, on_hold, pending)
   */
  async updateStatus(projectId, status) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      return {
        success: true,
        message: data.message || `Project status updated to ${status}`
      };
    } catch (error) {
      console.error('Error updating project status:', error);
      return {
        success: false,
        error: error.message || 'Failed to update project status'
      };
    }
  }

  /**
   * Delete (close) a project
   * @param {number} projectId - Project ID
   */
  async delete(projectId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        message: data.message || 'Project closed successfully'
      };
    } catch (error) {
      console.error('Error deleting project:', error);
      return {
        success: false,
        error: error.message || 'Failed to close project'
      };
    }
  }

  // ============================================
  // User Assignment Methods
  // ============================================

  /**
   * Get users assigned to a project
   * @param {number} projectId - Project ID
   */
  async getProjectUsers(projectId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}/users`);

      return {
        success: true,
        data: data.data || [],
        message: data.message
      };
    } catch (error) {
      console.error('Error fetching project users:', error);
      return {
        success: false,
        error: error.message || 'Failed to fetch project users',
        data: []
      };
    }
  }

  /**
   * Assign a user to a project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID to assign
   * @param {string} roleInProject - Role in project (lead, contributor, viewer)
   */
  async assignUser(projectId, userId, roleInProject = 'contributor') {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, roleInProject }),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'User assigned to project'
      };
    } catch (error) {
      console.error('Error assigning user to project:', error);
      return {
        success: false,
        error: error.message || 'Failed to assign user to project'
      };
    }
  }

  /**
   * Bulk assign users to a project
   * @param {number} projectId - Project ID
   * @param {Array<number>} userIds - Array of user IDs
   * @param {string} roleInProject - Role for all users
   */
  async bulkAssignUsers(projectId, userIds, roleInProject = 'contributor') {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}/users/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userIds, roleInProject }),
      });

      return {
        success: true,
        data: data.data,
        message: data.message || 'Users assigned to project'
      };
    } catch (error) {
      console.error('Error bulk assigning users:', error);
      return {
        success: false,
        error: error.message || 'Failed to assign users to project'
      };
    }
  }

  /**
   * Remove a user from a project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID to remove
   */
  async removeUser(projectId, userId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}/users/${userId}`, {
        method: 'DELETE',
      });

      return {
        success: true,
        message: data.message || 'User removed from project'
      };
    } catch (error) {
      console.error('Error removing user from project:', error);
      return {
        success: false,
        error: error.message || 'Failed to remove user from project'
      };
    }
  }

  /**
   * Check if a user has access to a project
   * @param {number} projectId - Project ID
   * @param {number} userId - User ID to check
   */
  async checkUserAccess(projectId, userId) {
    try {
      const data = await authService.makeAuthenticatedRequest(`${API_BASE_URL}/projects/${projectId}/check-access/${userId}`);

      return {
        success: true,
        data: data.data,
        message: data.message
      };
    } catch (error) {
      console.error('Error checking project access:', error);
      return {
        success: false,
        error: error.message || 'Failed to check project access',
        data: { hasAccess: false, role: null }
      };
    }
  }
}

const projectsService = new ProjectsService();
export default projectsService;
